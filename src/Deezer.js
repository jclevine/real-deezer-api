import request from 'request-promise'
import urls from './urls'

export class Deezer {
  constructor(apiKey) {
    this.apiKey = apiKey
  }
  
  async getAllPlaylistIds(...filterStrings) {
    const playlists = await request.get(`${urls.apiBase}/user/me/playlists`, {
      qs: {
        access_token: this.apiKey,
        expires: 0
      }
    })

    return playlists.data
      .filter(playlist => filterStrings.length == 0 || Deezer.playlistPassesFilterStrings(filterStrings, playlist.name))              
      .map(playlist => playlist.id)
  }

  static playlistPassesFilterStrings(filterStrings, playlistName) {
    return filterStrings.some(filter => playlistName.toLowerCase().includes(filter))
  }

  async getAllTrackIds(...playlistIds) {
    return (await Promise.all(this.getPlaylistTracks(playlistIds)))
      .map(trackListData => trackListData.data) 
      .reduce((flattenedTrackList, playlistTrackList) => [...flattenedTrackList, ...playlistTrackList])
      .map(trackInfo => trackInfo.id)      
  }

  getPlaylistTracks(playlistIds) {
    return playlistIds.map(async playlistId => {
      return await request.get(`${urls.apiBase}/playlist/${playlistId}/tracks`, {
        qs: {
          access_token: this.apiKey,
          expires: 0
        }
      })
    })
  }
}
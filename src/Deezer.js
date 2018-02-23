import requestPromise from 'request-promise'
import urls from './urls'
import readFilePromise from 'fs-readfile-promise'

export class Deezer {

  constructor(apiKey) {
    this.apiKey = apiKey
    this.DEEZER_MAX_TRACK_COUNT_PER_ADD = 10
  }
  
  async getAllPlaylistIds(...filterStrings) {
    const playlists = await requestPromise.get(`${urls.apiBase}/user/me/playlists`, {
      qs: {
        access_token: this.apiKey,
        expires: 0
      }
    })

    return JSON.parse(playlists).data
      .filter(playlist => filterStrings.length == 0 || Deezer.playlistPassesFilterStrings(filterStrings, playlist.title))              
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
      return await requestPromise.get(`${urls.apiBase}/playlist/${playlistId}/tracks`, {
        qs: {
          access_token: this.apiKey,
          expires: 0
        }
      })
    })
  }

  async createPlaylists({filePath, titleRoot, maxPlaylistSize, maxPlaylistTrackAddPerRequest, overrideFileReader=readFilePromise}) {
    const playlistIds = (await overrideFileReader(filePath)).split('\n')
    const chunks = Deezer.splitOriginalPlaylistIntoMaxSizeChunks(playlistIds, maxPlaylistSize)
    await chunks.forEach(async (playlist, i) => {
      const newPlaylistId = await this.initializePlaylist(`${titleRoot}-${i}`)
      const playlistTrackAddLimitationChunk = Deezer.splitOriginalPlaylistIntoMaxSizeChunks(playlist, this.DEEZER_MAX_TRACK_COUNT_PER_ADD) 
      await playlistTrackAddLimitationChunk.forEach(async tracks => {
        await this.addTracksToPlaylist(newPlaylistId, tracks)
      })
    })
  }

  async initializePlaylist(title) {
    const res = await requestPromise.post(`${urls.apiBase}/user/me/playlists`, {
      qs: {
        access_token: this.apiKey,
        expires: 0,
        title     
      }
    })
    return res.id
  }
  static splitOriginalPlaylistIntoMaxSizeChunks(playlist, maxPlaylistSize) {
    let chunks = []
    const chunkCount = Math.ceil(playlist.length / maxPlaylistSize)
    for (let i = 0, j = 0; i < chunkCount; ++i, j += maxPlaylistSize) {
      chunks[i] = playlist.slice(j, j + maxPlaylistSize)
    }

    return chunks
  }

  async addTracksToPlaylist(playlistId, tracks) {
    await requestPromise.post(`${urls.apiBase}/playlist/${playlistId}/tracks`, {
      qs: {
        songs: tracks.join(','),
        access_token: this.apiKey,
        expires: 0
      }
    })
  }  

  async getTrack(id) {
    return await requestPromise.get(`${urls.apiBase}/track/${id}`)
  }
}

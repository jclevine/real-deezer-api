import { Deezer} from '../src/Deezer'
import { expect } from 'chai'
import sinon from 'sinon'
import { assert } from 'sinon'
import requestPromise from 'request-promise'
import readFilePromise from 'fs-readfile-promise'


const sandbox = sinon.createSandbox()

describe('Playlists', () => {

  afterEach(function () {
      sandbox.restore()
  })

  it('gets all the playlist ids', async () => {
    const getStub = sandbox.stub(requestPromise, 'get').resolves(JSON.stringify({
      data: [ { id: 1, title: 'Something' }, { id: 2, title: 'Something2' }, { id: 3, title: 'Something3' } ]
    }))

    const dz = new Deezer('fake-api-key')
    const actual = await dz.getAllPlaylistIds()

    assert.calledWith(getStub, 
      'http://api.deezer.com/user/me/playlists', 
      {
        qs: {
          access_token: 'fake-api-key',
          expires: 0
        }
      }
    )

    expect(actual).to.be.deep.equal([1, 2, 3])
  })

  it('gets all the playlist ids with names containing one substring', async () => {
    const getStub = sandbox.stub(requestPromise, 'get').resolves(JSON.stringify({
      data: [ 
        { id: 1, title: 'Super Playlist!' }, 
        { id: 2, title: 'Bad Playlist!' }, 
        { id: 3, title: 'Ok Playlist!' },
        { id: 4, title: 'Super Playlist 2!' } 
      ]
    }))

    const dz = new Deezer('fake-api-key')
    const actual = await dz.getAllPlaylistIds('super')

    expect(actual).to.be.deep.equal([1, 4])
  })

  it('gets all the playlist ids with names containing two possible substrings', async () => {
    const getStub = sandbox.stub(requestPromise, 'get').resolves(JSON.stringify({
      data: [ 
        { id: 1, title: 'Super Playlist!' }, 
        { id: 2, title: 'Bad Playlist!' }, 
        { id: 3, title: 'Ok Playlist!' },
        { id: 4, title: 'Super Playlist 2!' } 
      ]
    }))

    const dz = new Deezer('fake-api-key')
    const actual = await dz.getAllPlaylistIds('super', 'ok')

    expect(actual).to.be.deep.equal([1, 3, 4])
  })

  it('creates 2 playlists from 3 tracks with a max playlist size of 2', async () => {    
    const readFileStub = sandbox.stub().resolves('1000\n2000\n3000')

   
    // Creation of first playlist that will get 2 of the tracks
    const postStub = sandbox.stub(requestPromise, 'post').onFirstCall().resolves({id: 10000})
      
    // Creation of the second playlist that will get 1 track
    postStub.onSecondCall().resolves({id: 20000})

    // Return the size of the 1st playlist after the 2 tracks were added
    const getStub = sandbox.stub(requestPromise, 'get').withArgs(
      'https://api.deezer.com/playlist/10000', {
        qs: {
          access_token: 'fake-api-key',
          expires: 0
        }
      }).resolves({nb_tracks: 2})
      
    // Return the size of the 2nd playlist after the last 1 track was added
    getStub.withArgs(
      'https://api.deezer.com/playlist/20000', {
        qs: {
          access_token: 'fake-api-key',
          expires: 0
        }
      }).resolves({nb_tracks: 1})

    // Actually create the playlists!
    const dz = new Deezer('fake-api-key')
    await dz.createPlaylists({
      filePath: 'test.txt',
      titleRoot: 'super-fun',
      maxPlaylistSize: 2,
      maxPlaylistTrackAddPerRequest: 10,
      overrideFileReader: readFileStub
    })

    // Assert that the 2 tracks were added to the 1st playlist
    assert.calledWith(postStub, 
      'http://api.deezer.com/playlist/10000/tracks', {
        qs: {
          songs: '1000,2000',
          access_token: 'fake-api-key',
          expires: 0
        }
      })

    // Assert that the 1 track was added to the 2nd playlist
    assert.calledWith(postStub, 
      'http://api.deezer.com/playlist/20000/tracks', {
        qs: {
          songs: '3000',
          access_token: 'fake-api-key',
          expires: 0
        }
      })
  })
})
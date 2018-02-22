import { Deezer} from '../src/Deezer'
import { expect } from 'chai'
import sinon from 'sinon'
import { assert } from 'sinon'
import request from 'request-promise'

describe('Playlists', () => {

  afterEach(() => {
    request.get.restore()
  })

  it('gets all the playlist ids', async () => {
    const getStub = sinon.stub(request, 'get').resolves({
      data: [ { id: 1, name: 'Something' }, { id: 2, name: 'Something2' }, { id: 3, name: 'Something3' } ]
    })

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
    const getStub = sinon.stub(request, 'get').resolves({
      data: [ 
        { id: 1, name: 'Super Playlist!' }, 
        { id: 2, name: 'Bad Playlist!' }, 
        { id: 3, name: 'Ok Playlist!' },
        { id: 4, name: 'Super Playlist 2!' } 
      ]
    })

    const dz = new Deezer('fake-api-key')
    const actual = await dz.getAllPlaylistIds('super')

    expect(actual).to.be.deep.equal([1, 4])
  })

  it('gets all the playlist ids with names containing two possible substrings', async () => {
    const getStub = sinon.stub(request, 'get').resolves({
      data: [ 
        { id: 1, name: 'Super Playlist!' }, 
        { id: 2, name: 'Bad Playlist!' }, 
        { id: 3, name: 'Ok Playlist!' },
        { id: 4, name: 'Super Playlist 2!' } 
      ]
    })

    const dz = new Deezer('fake-api-key')
    const actual = await dz.getAllPlaylistIds('super', 'ok')

    expect(actual).to.be.deep.equal([1, 3, 4])
  })
})
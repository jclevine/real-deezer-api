import { Deezer} from '../src/Deezer'
import { expect } from 'chai'
import sinon from 'sinon'
import { assert } from 'sinon'
import request from 'request-promise'


const sandbox = sinon.createSandbox()

describe('Tracks', () => {

  afterEach(function () {
    sandbox.restore()
  })

  it('gets all the tracks for a single playlist id', async () => {
    const getStub = sandbox.stub(request, 'get').resolves(JSON.stringify({
      data: [ { id: 100, title: 'Discovery' }, { id: 200, title: 'Wow!'} ]
    }))

    const dz = new Deezer('fake-api-key')
    const actual = await dz.getAllTrackIds(5)

    assert.calledWith(getStub, 
      'http://api.deezer.com/playlist/5/tracks', 
      {
        qs: {
          access_token: 'fake-api-key',
          expires: 0
        }
      }
    )

    expect(actual).to.deep.equal([100, 200])
  })

  it('gets all the tracks for two playlist ids', async () => {
    const getStub = sandbox.stub(request, 'get')    
    getStub.withArgs(
      'http://api.deezer.com/playlist/5/tracks', 
      {
        qs: {
          access_token: 'fake-api-key',
          expires: 0
        }
      }
    ).resolves(JSON.stringify({
      data: [ 
        { id: 100, title: 'Discovery' }, { id: 200, title: 'Wow!'}
      ]
    }))
    getStub.withArgs(
      'http://api.deezer.com/playlist/10/tracks', 
      {
        qs: {
          access_token: 'fake-api-key',
          expires: 0
        }
      }
    ).resolves(JSON.stringify({
      data: [ 
        { id: 300, title: 'In It' }, { id: 400, title: 'Desolation Row'} 
      ]
    }))

    const dz = new Deezer('fake-api-key')
    const actual = await dz.getAllTrackIds(5, 10)

    assert.calledWith(getStub, 'http://api.deezer.com/playlist/5/tracks')
    assert.calledWith(getStub, 'http://api.deezer.com/playlist/10/tracks')

    expect(actual).to.deep.equal([100, 200, 300, 400])
  })

  it('gets a track by id', async () => {
    const expected = {
      id: 1,
      album: {
        title: 'I Love You, Honeybear',
        cover: 'https://deezer.com/album/2/image'
      }
    }
    const getStub = sandbox.stub(request, 'get').resolves(JSON.stringify(expected))
    
    const dz = new Deezer('fake-api-key')
    const actual = await dz.getTrack(1)
    expect(actual).to.be.deep.equal(expected)
  })
})
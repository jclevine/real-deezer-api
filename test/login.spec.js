import { Deezer} from '../src/Deezer'
import { expect } from 'chai'

describe('Login', () => {  
  it('logs in properly with a good API key', async () => {
    const dz = new Deezer('fake-api-key')
    expect(dz).to.not.be.null
  })
})
import { VBase, IOContext } from '@vtex/api'
import { DYNAMIC_YIELD_INTEGRATION } from './constants'

const service = DYNAMIC_YIELD_INTEGRATION

export default function VBaseClient(ioContext: IOContext, fileName: any) {
  const client = new VBase(ioContext)

  return {
    saveFile: (data: any) => {
      var Readable = require('stream').Readable
      var s = new Readable()

      s._read = function noop() {}
      s.push(JSON.stringify(data))
      s.push(null)

      return client.saveFile(service, fileName, s, false)
    },
    getFile: () => {
      return client.getJSON<any>(service, fileName)
    },
    deleteFile: () => {
      return client.deleteFile(service, fileName)
    },
  }
}

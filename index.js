const { Local,Async,AsyncPromise,Sync,Source,Sink,Duplex,Action,KeyPair,_ } = require("icebreaker-rpc")

const PeerInfo = require("./peerInfo")
const connect =require('./connect')

module.exports = {
  PeerInfo:PeerInfo,
  Connect:connect,
  KeyPair,
  Action,
  Local,
  AsyncPromise,
  Async,
  Sync,
  Source,
  Sink,
  Duplex,
  KeyPair,
  _
}

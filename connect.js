const { Connect,_ } = require("icebreaker-rpc")
const network = require('icebreaker-network')

const ms = require('ms')
const url = require("url")
const LB = require('./lb')
const Timeout = require('./timeout')

module.exports = (...args)=>{
  let cid = 0
  return  function connect(addresses,_local,params,cb,done){
    const connections={}

    if (_.isString(addresses)) addresses = [addresses]
    
    if(_.isFunction(params) ){
        cb = params;
        params={};
        params = _local
        _local=null

      }
      if(!params) params ={}

      if(!params.connectionTimeout) params.connectionTimeout = ms("40s")
      if(!params.encoding) params.encoding = "base58"
      if(!params.appKey) params.appKey = "alligator@1.0.0"
      
      if (_.isString(addresses)) addresses = [addresses]
        
      const addrs = addresses.slice(0).filter(function (addr) {
        return network.protoNames().indexOf(url.parse(addr).protocol) !== -1
      })
      .sort(function sortFunc(a, b) {
        const sortingArr = network.protoNames()
        return sortingArr.indexOf(url.parse(a[1]).protocol) - sortingArr.indexOf(url.parse(b[1]).protocol)
      })

      if (addrs.length === 0 && addresses.length > 0) return cb(new Error("protocol not found in Address:" + JSON.stringify(addresses)))
      if(!params.wrap)params.wrap=(d) => {
        return Timeout(d, params.connectionTimeout, () => {
          if(done)done()
          d.end()
        })
      }
      const addr  =addrs.shift() 
      const id = url.parse(addr).auth
      for (let k in connections) {
        let c = connections[k]
        if (c.peerID === id) return cb(null, c)
      }

      Connect(addr, _local, params,function cb2(err, con) {
        
        if (addrs.length > 0 && err != null) return connect(addrs.shift(),_local,params, cb2)
        if(err) return cb(err)

        if(params.lb && params.lb === false) return cb(err,con)
     
        LB({config:params,addrs:con.peer.addrs,connect:function(addresses,cb){
          let params2 = {...params}
          params2.lb=false
          params2.wrap=(d) => {
            d.id = cid=++cid;
            connections[d.id]=d;

            var t  =Timeout(d, params2.connectionTimeout, function() {
              delete connections[d.id]
              d.end()
            })

            return t  
          }
          connect(addresses,_local,params2,function(err,con){
              if(err) return cb(err)
              cb(err,con)
            })
        },live:true},function(lb){

          if(err)return cb(err)
            con.lb = lb
            const end = con.end
            con.end = (...args)=>{
              Object.keys(connections).forEach(function(key){
                if(connections[key]&&connections[key].end)connections[key].end(...args)
              })
              return end(...args)
            }
            cb(err, con)
        });
      })
    
}(...args)
}


var fs = require('fs')
var request = require('request')
var qs = require('querystring')


function thunkify(fn) {
  return function() {
    var args = Array.prototype.slice.call(arguments)
    return function (callback) {
      args.push(callback)
      fn.apply(null, args)
    }
  }
}

function readIP(path, callback) {
  fs.readFile(path, function(err, data) {
    if (err) {
      callback(err)
    } else {
      try {
        data = JSON.parse(data)
        callback(null, data)
      } catch (error) {
        callback(error)
      }
    }
  })
}

readIP = thunkify(readIP)

readIP('./ip.json')(function (err, data) {
  return readIP('./ip.json')
})(function (err, data) {
  return readIP('./ip.json')
})

/*
a 必须返回一个接受 callback 的函数
a 调用这个 callback 函数，如果返回值是函数，就接受下一个callback作为参数
否则，构造一个函数，将结果封装成一个接受callback的参数返回
*/
// run : node --harmony-generators co.js

var fs = require('mz/fs')
var request = require('request')
var qs = require('querystring')
var co = require('co')

function readIP(path, callback) {
  return fs.readFile(path)
    .then(function(data) {
      try {
        data = JSON.parse(data)
      } catch (err) {
        return Pormise.reject(err)
      }
      return Promise.resolve(data)
    })
}

function ip2geo(ip) {
  return new Promise(function(resolve, reject) {
    request({
      url: 'http://www.telize.com/geoip/' + ip,
      json: true,
      timeout: 2000
    }, function(err, resp, body) {
      if (err) {
        reject(err)
      } else {
        body.ip = ip
        resolve(body)
      }
    })
  })
}

function geo2weather(geo, callback) {
  var params = {
    lat: geo.latitude,
    lon: geo.longitude,
    APPID: '9bf4d2b07c7ddeb780c5b32e636c679d'
  }
  return new Promise(function(resolve, reject) {
    request({
      url: 'http://api.openweathermap.org/data/2.5/weather?' + qs.stringify(params),
      json: true,
      timeout: 2000,
    }, function(err, resp, body) {
      if (err) {
        reject(err)
      } else {
        body.geo = geo
        resolve(body)
      }
    })
  })
}

function writeWeather(weathers, callback) {
  var output = []
  var weather
  for (var i = 0; i < weathers.length; i++) {
    weather = weathers[i]
    output.push({
      ip: weather.geo.ip,
      weather: weather.weather[0].main,
      region: weather.geo.region
    })
  }
  return fs.writeFile('./weather.json', JSON.stringify(output, null, '  '))
}

co(function *() {
  var ip, ips = yield readIP('./ip.json')
  var geo;
  var weather, weathers = [];
  for (var i = 0; i < ips.length; i++) {
    ip = ips[i]
    geo = yield ip2geo(ip)
    weather = yield geo2weather(geo)
    geo.ip = ip
    weather.geo = geo
    weathers.push(weather)
  }
  yield writeWeather(weathers)
  console.log('success!')
}).catch(function (err) {
  console.log(err)
})
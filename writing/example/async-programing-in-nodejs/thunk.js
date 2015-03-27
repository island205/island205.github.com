var fs = require('fs')
var request = require('request')
var qs = require('querystring')

function Thunk() {
  return function (fn) {
    fn.apply(null, arguments)
  }
}

function thunkify(fn) {
  return function () {

  }
}

function readIP(path) {
  return function (fn) {
    fs.readFile(path, function(err, data) {
      if (err) {
        callback(err)
      } else {
        try {
          data = JSON.parse(data)
          fn(null, data)
        } catch (error) {
          fn(error)
        }
      }
    })
  }
}

function ip2geo(ip, callback) {
  request({
    url: 'http://www.telize.com/geoip/' + ip,
    json: true,
    timeout: 2000
  }, function(err, resp, body) {
    return Thunk(err, body)
  })
}

function geo2weather(lat, lon, callback) {
  var params = {
    lat: lat,
    lon: lon,
    APPID: '9bf4d2b07c7ddeb780c5b32e636c679d'
  }
  request({
    url: 'http://api.openweathermap.org/data/2.5/weather?' + qs.stringify(params),
    json: true,
    timeout: 2000,
  }, function(err, resp, body) {
    return Thunk(err, body)
  })
}

function ips2geos(ips, callback) {
  var geos = []
  var ip
  var remain = ips.length
  for (var i = 0; i < ips.length; i++) {
    ip = ips[i];
    (function(ip) {
      ip2geo(ip, function(err, geo) {
        if (err) {
          return Thunk(err)
        } else {
          geo.ip = ip
          geos.push(geo)
          remain--
        }
        if (remain === 0) {
          return Thunk(null, geos)
        }
      })
    })(ip)
  }
}

function geos2weathers(geos, callback) {
  var weathers = []
  var geo
  var remain = geos.length
  for (var i = 0; i < geos.length; i++) {
    geo = geos[i];
    (function(geo) {
      geo2weather(geo.latitude, geo.longitude, function(err, weather) {
        if (err) {
          return Thunk(err)
        } else {
          weather.geo = geo
          weathers.push(weather)
          remain--
        }
        if (remain == 0) {
          return Thunk(null, weathers)
        }
      })
    })(geo)
  }
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
  fs.writeFile('./weather.json', JSON.stringify(output, null, '  '), callback)
}

readIP('./ip.json', function(err, ips) {
  if (err) {
    console.log('readIP', err)
  } else {
    ips2geos(ips, function(err, geos) {
      if (err) {
        console.log('ips2geos', err)
      } else {
        geos2weathers(geos, function(err, weathers) {
          if (err) {
            console.log('geos2weathers', err)
          } else {
            writeWeather(weathers, function() {
              console.log('success!')
            })
          }
        })
      }
    })
  }
})

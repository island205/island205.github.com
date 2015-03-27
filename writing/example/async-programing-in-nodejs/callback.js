var fs = require('fs')
var request = require('request')
var qs = require('querystring')

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

function ip2geo(ip, callback) {
  var url = 'http://www.telize.com/geoip/' + ip
  request({
    url: url,
    json: true
  }, function(err, resp, body) {
    callback(err, body)
  })
}

function geo2weather(lat, lon, callback) {
  var params = {
    lat: lat,
    lon: lon,
    APPID: '9bf4d2b07c7ddeb780c5b32e636c679d'
  }
  var url = 'http://api.openweathermap.org/data/2.5/weather?' + qs.stringify(params)
  request({
    url: url,
    json: true,
  }, function(err, resp, body) {
    callback(err, body)
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
          callback(err)
        } else {
          geo.ip = ip
          geos.push(geo)
          remain--
        }
        if (remain == 0) {
          callback(null, geos)
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
          callback(err)
        } else {
          weather.geo = geo
          weathers.push(weather)
          remain--
        }
        if (remain == 0) {
          callback(null, weathers)
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

function handlerError(err) {
  console.log('error: ' + err)
}

function ReadIPCallback(err, ips) {
  if (err) {
    handlerError(err)
  } else {
    ips2geos(ips, ips2geosCallback)
  }
}

function ips2geosCallback(err, geos) {
  if (err) {
    handlerError(err)
  } else {
    geos2weathers(geos, geos2weathersCallback)
  }
}

function geos2weathersCallback(err, weathers) {
  if (err) {
    handlerError(err)
  } else {
    writeWeather(weathers, writeWeatherCallback)
  }
}

function writeWeatherCallback(err) {
  if (err) {
    handlerError(err)
  } else {
    console.log('success!')
  }
}

readIP('./ip.json', ReadIPCallback)

// readIP('./ip.json', function(err, ips) {
//   if (err) {
//     handlerError(err)
//   } else {
//     ips2geos(ips, function(err, geos) {
//       if (err) {
//         handlerError(err)
//       } else {
//         geos2weathers(geos, function(err, weathers) {
//           if (err) {
//             handlerError(err)
//           } else {
//             writeWeather(weathers, function(err) {
//               if (err) {
//                 handlerError(err)
//               } else {
//                 console.log('success!')
//               }
//             })
//           }
//         })
//       }
//     })
//   }
// })
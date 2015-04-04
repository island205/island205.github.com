var fs = require('fs')
var request = require('request')
var qs = require('querystring')

function readIP(path) {
  return function(callback) {
    return function (callback) {
      return function (callback) {
        return function (callback) {
          fs.readFile(path, function(err, data) {
            var hasError = false
            if (err) {
              callback(err)
            } else {
              try {
                data = JSON.parse(data)
              } catch (e) {
                err = e
                hasError = true
              }
              if (hasError) {
                callback(err)
              } else {
                callback(null, data)
              }
            }
          })
        }
      }
    }
  }
}

function ip2geo(ip) {
  return function (callback) {
    var url = 'http://www.telize.com/geoip/' + ip
    request({
      url: url,
      json: true
    }, function(err, resp, body) {
      callback(err, body)
    })
  }
}

function geo2weather(lat, lon) {
  return function (callback) {
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
}

function ips2geos(ips) {
  return function (callback) {
    var geos = []
    var ip
    var remain = ips.length
    var returned = false
    for (var i = 0; i < ips.length; i++) {
      ip = ips[i];
      (function(ip) {
        ip2geo(ip)(function (err, geo) {
          if (returned) {
            return
          }
          if (err) {
            callback(err)
            returned = true
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
}

function geos2weathers(geos) {
  return function (callback) {
    var weathers = []
    var geo
    var remain = geos.length
    var returned = false
    for (var i = 0; i < geos.length; i++) {
      geo = geos[i];
      (function(geo) {
        geo2weather(geo.latitude, geo.longitude)(function (err, weather) {
          if (returned) {
            return
          }
          if (err) {
            callback(err)
            returned = true
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
}

function writeWeather(weathers) {
  return function (callback) {
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
}

function handlerError(err) {
  console.log('error: ' + err)
}

readIP('./ip.json')(function (err, ips) {
  return ips2geos(ips)
})(function (err, geos) {
  return geos2weathers(geos)
})(function (err, weathers) {
  return writeWeather(weathers)
})(function (err) {
  if (err) {
    handlerError(err)
  } else {
    console.log('success!')
  }
})

// readIP('./ip.json')(function (err, ips) {
//   if (err) {
//     handlerError(err)
//   } else {
//     ips2geos(ips)(function (err, geos) {
//       if (err) {
//         handlerError(err)
//       } else {
//         geos2weathers(geos)(function (err, weathers) {
//           if (err) {
//             handlerError(err)
//           } else {
//             writeWeather(weathers)(function (err) {
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
title: Node.js 异步编程之 Callback
----

Node.js 基于 JavaScript 引擎 v8，是单线程的。Node.js 采用了与通常 Web 上的 JavaScript 异步编程的方式来处理会造成阻塞的I/O操作。在 Node.js 中读取文件、访问数据库、网络请求等等都有可能是异步的。对于 Node.js 新人或者从其他语言背景迁移到 Node.js  上的开发者来说，异步编程是比较痛苦的一部分。本章将由浅入深为大家讲解 Node.js 异步编程的方方面面。从最基础的 callback 到 thunk、Promise、co 直到 ES7 计划的 async/await。

首先我们先从一个具体的异步编程的例子说起。

## 获取多个 ip 所在地的天气信息

在 ip.json 这个文件中，有一个数组我们存放了若干个 ip 地址，分别来自不同的地方的不同访问者，内容如下：

    // ip.json
    ["115.29.230.208", "180.153.132.38", "74.125.235.224", "91.239.201.98", "60.28.215.115"]

希望可以每一个 ip 所在地当前的天气。将结果输出到 weather.json 这个文件中各式如下：

    // weather.json
    [
      { "ip": "115.29.230.208", "weather": "Clouds", "region": "Zhejiang" },
      { "ip": "180.153.132.38", "weather": "Clear", "region": "Shanghai" },
      { "ip": "74.125.235.224", "weather": "Rain", "region": "California" },
      { "ip": "60.28.215.115", "weather": "Clear", "region": "Tianjin" }
    ]

整理思路，我们分成以下几步来完成：

- 读取 ip 地址；
- 根据 ip 地址获取 ip 所在地的地理位置；
- 根据地理位置查询当地的天气；
- 将结果写入到 weather.json 文件中。

这些步骤都是异步的（读写文件可以同步，但作为示例，都用异步）。

## callback

首先我们尝试不借助任何库，试着以 Node.js API 通常提供的方式——专递一个 callback 作为异步回调——来实现。我们将借助三个基础模块：

- fs：从文件 ip.json 读取 IP 列表；把结果写入到文件中；
- request：用来发送 HTTP 请求，根据 IP 地址获取 geo 数据，再通过 geo 数据获取天气数据；
- querystring：用来组装发送请求的 url 参数。

新建一个 callback.js 文件，引入这几个模块：

    // callback.js
    var fs = require('fs')
    var request = require('request')
    var qs = require('querystring')

读取文件中的 IP 列表，调用 `fs.readFile` 读取文件内容，再通过 `JSON.parse` 来解析 JSON 数据：

    ...
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
    ...

接着就是使用 IP 来获取geo，我们使用 `request` 来请求一个开放的 geo 服务：

    ...
    function ip2geo(ip, callback) {
      var url = 'http://www.telize.com/geoip/' + ip
      request({
        url: url,
        json: true
      }, function(err, resp, body) {
        callback(err, body)
      })
    }
    ...

使用 geo 数据来获取 weather：

    ...
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
    ...

现在我们已经获取 geo、获取 weather 的接口，接下来我们还有稍微复杂的问题要处理，因为 ip 有多个，所以我们需要并行地去读取 geo 已经并行地读取 weather 数据：

    ...
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
    ...

ips2geos 和 geos2weathers 都使用了一种比较原始的方法，remain 来计算等待返回的个数，remain 为 0 表示并行请求结束，将处理结果装进一个数组返回。

最后就是将结果写入到 weather.json 文件中：

    ...
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
    ...

组合上面这些函数，我们就可以实现我们的目标：

    ...
    function handlerError(err) {
      console.log('error: ' + err)
    }

    readIP('./ip.json', function(err, ips) {
      if (err) {
        handlerError(err)
      } else {
        ips2geos(ips, function(err, geos) {
          if (err) {
            handlerError(err)
          } else {
            geos2weathers(geos, function(err, weathers) {
              if (err) {
                handlerError(err)
              } else {
                writeWeather(weathers, function(err) {
                  if (err) {
                    handlerError(err)
                  } else {
                    console.log('success!')
                  }
                })
              }
            })
          }
        })
      }
    })

哈哈，你妈这嵌套，你可能觉得这就是 JavaScript 异步的问题，说真的，嵌套不是 JavaScript 异步的真正问题所在。上面这段代码我们可以下面这样写：

    ...
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

好了，这是我们 callback.js 的全部内容。运行：

    node callback.js

将会生成 weater.json 文件：

    [
      {
        "ip": "180.153.132.38",
        "weather": "Clear",
        "region": "Shanghai"
      },
      {
        "ip": "91.239.201.98",
        "weather": "Clouds"
      },
      {
        "ip": "60.28.215.115",
        "weather": "Clear",
        "region": "Tianjin"
      },
      {
        "ip": "74.125.235.224",
        "weather": "Clouds",
        "region": "California"
      },
      {
        "ip": "115.29.230.208",
        "weather": "Clear",
        "region": "Zhejiang"
      }
    ]

那正真的问题是什么？

当然是异步的问题啦，异步本质上要处理三个事情：

- 异步操作什么时候结束，需要通知回来，Callback 是一种方案；
- 异步产生的结果需要传递回来，Callback 接受一个 data 参数，把数据传回来；
- 异步如果出错了怎么办？Callback 接受 一个 err 参数，把错误传回来。

但有没有发现好多重复的工作（各种 callback）？上面的这些代码有什么问题么？请大家期待本文的续篇。
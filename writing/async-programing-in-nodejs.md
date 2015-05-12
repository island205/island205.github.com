title: Node.js 异步编程
----

Node.js 基于 JavaScript 引擎 v8，是但线程的。Node.js 采用了与通常 Web 上的 JavaScript 异步编程的方式来处理会造成阻塞的I/O操作。在 Node.js 中读取文件、访问数据库、网络请求等等都有可能是异步的。对于 Node.js 新人或者从其他语言背景迁移到 Node.js  上的开发者来说，异步编程是比较痛苦的一部分。本章将由浅入深为大家讲解 Node.js 异步编程的方方面面。

首先我们先从一个具体的异步编程的例子说起。

## 获取多个 ip 所在地的天气信息

在 ip.json 这个文件中，有一个数组我们存放了若干个 ip 地址，分别来自不同的敌方的不同访问者，内容如下：

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

新建一个 blank.js 文件，引入这几个模块：

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

那正真的问题是什么？这些重复的工作因什么而起？我们该如何解决？请大家期待本文的续续篇。

## Callback 的问题

在上一篇中，我们使用 callback 的方式来实现了我们需求，将一个 IP 列表转换成了具体的城市和天气。可以看出回调嵌套并不是 Callback 作为异步处理方案的真真问题。那正真的问题是什么呢？

### 可靠性

上篇文章发出来，就被 [@朴灵大大](http://weibo.com/1744667943/CaykJoiwz?type=comment) 吐了一手槽，我还浑然不知。看上一篇文章中的这段代码：

    try {
      data = JSON.parse(data)
      callback(null, data)
    } catch (error) {
      callback(error)
    }

事实上，在这段代码中，`callback` 有可能被调用两次。

> 这个问题[苏千在12年的沪JS大会上已经讲过了](http://www.infoq.com/cn/presentations/Nodejs-hole)，我是现场观众，但却忘记了……

`JSON.parse` 没报错，但是如果 `callback` 在运行的时候报异常的话，就会触发 `catch` 块，`callback` 就会再被调用一次。这个问题不难理解，但是非常隐蔽。下面是可行的一种 fix 方案：

    var hasError = false
    try {
      data = JSON.parse(data)
    } catch (e) {
      err = err
      hasError = true
    }
    if (hasError) {
      callback(err)
    } else {
      callback(null, data)
    }

其实不仅仅是上面这段代码，看下面这一段：

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

这段代码来自 `ips2geos` 函数，这个函数就是实现并行地异步读取多个 IP 地址的 geo 数据，读取成功后组装成数组返回给 `callback`；但如果某个异步读取过程出错了，就直接调用 `callback` 将错误信息返回。但在这段代码中，`callback` 很可能被调用多次，**这种情况出现在有多个异步 IP 转 geo 出错的时候**。一种还算凑活的修正：

    var returned = false
    for (var i = 0; i < ips.length; i++) {
      ip = ips[i];
      (function(ip) {
        ip2geo(ip, function(err, geo) {
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

这就是 `callback` 的可靠性问题。某个以 `callback` 作为异步回调逻辑都可能产生问题。我们自己写的代码，或者第三方类库都有可能导致 `callback` 被重复调用。以 `callback` 提供的异步 API 是无法保证回调次数的，这就产生了信任问题。如果有大量的异步嵌套，只要出错，就是一场灾难。

### 很难处理串/并行异步操作

串并行的异步操作大大提高了程序的复杂度，而直白的 `callback` 拿这个问题没有太大的办法。

作为写程序的开发者，同步逻辑更容易理解，更直观。可以像下面这样：

串行逻辑：

    var ips = readIP('./ip.json')
    var geos = ips2geos(ips)
    var weathers = geos2weathers(geos)
    ...


并行逻辑：

    function ips2geos(ips) {
      var geos = []
      var ip
      for (var i = 0; i < ips.length; i++) {
        ip = ips[i]
        geos.push(ip2geo(ip))
      }
      return geos
    }

很简单不是。

> 像上面这样的代码，[fibjs](http://fibjs.org/) 可以做到，fibjs 把异步串/并行做到了自己的内部实现中。

异步打破了程序运行的正常顺序，而 `callback` 的表现力非常不足，稍微复杂的处理逻辑代码写起来就一团糟。见第一节的 `ips2geos` 等函数。

### 总结

在本文中我们指出了 `callback` 作为异步处理的两个比较严重的问题，异步本身并不是坏事，只是 `callback` 的方案缺乏可靠性，表现力不足。在下一篇文章中我就进入正题，开始给大家介绍 thunk 以及 [thunks](https://github.com/thunks/thunks) 类库。后者是 [@严清](http://weibo.com/zensh) 开发的一个类库，灵感来自于 co，意在提升异步编程的体验。敬请期待。

## thunk

我们终于进入正题了，今天我们来聊聊 thunk，在讨论它之前，我们先来回顾一下讨论的内容。

异步要处理的三个问题：

- 异步介绍需要继续运行后面的逻辑
- 要获取异步计算的结果
- 需要知道异步是否出错

采用 callback(err, data) 这样形式，确实可以满足上面这三点需求，但是自身存在问题：

- 缺乏可靠性，callback 可能会被多次调用；
- 缺乏表现力，容易造成代码的嵌套，不能很好地处理任务的串行和并行。

我们先从第二点开始讨论，处理嵌套太多的问题。callback 嵌套太多就是因为对于一个异步的过程，我们传递了一个 callback 函数，然后如果这 callback 函数中还有异步的话，我们必须再传递一个 callback 进去，如此反复嵌套就越来越多了。

问题就在这里，我们获取异步结果是以传递一个 callback 参数来实现的。如果不是传递 callback 而是把异步结果 return 回来不就没有嵌套的问题了。

我们尝试修改 readIP 函数：

    function readIP(path) {
      return function(callback) {
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

我们把 readIP 真实的处理逻辑包含在了一个函数中，这个函数接受一个 callback 作为参数，用来获取异步的结果，然后 readIP 仅仅是返回了这个函数，这个函数就相当于**携带了结果**。于是我们可以这样是用 readIP：

    readIP('./ip.json')(function (err, data) {
      if (err) {
        console.log(err)
      } else {
        console.log(data)
      }
    })

继续修改 ip2geo：

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

可以这样使用 ip2geo：

    ip2geo('115.29.230.208')(function (err, data) {
      if (err) {
        console.log(err)
      } else {
        console.log(data)
      }
    })

继续修改 geo2weather：

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

再来看看 ips2geos：

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


当我们把所有代码都改完，最终的结果：

    readIP('./ip.json')(function (err, ips) {
      if (err) {
        handlerError(err)
      } else {
        ips2geos(ips)(function (err, geos) {
          if (err) {
            handlerError(err)
          } else {
            geos2weathers(geos)(function (err, weathers) {
              if (err) {
                handlerError(err)
              } else {
                writeWeather(weathers)(function (err) {
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

这不还是嵌套么？？？如果我们这样：





## co

[co](https://github.com/tj/co) 是由 tj 发起的一个开源项目。目的在于利用 ECMAScript 6 的 Generator 和 Promise 特性来解决在 Node 中异步问题。
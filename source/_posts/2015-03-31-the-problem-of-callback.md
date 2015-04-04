title: Node.js 异步编程之 Callback的问题
----

在上一篇中，我们使用 Callback 的方式来实现了我们需求，将一个 IP 列表转换成了具体的城市和天气。可以看出回调嵌套并不是 Callback 作为异步处理方案的真真问题。那正真的问题是什么呢？

## 可靠性

上篇文章发出来，就被 [@朴灵](http://weibo.com/1744667943/CaykJoiwz?type=comment) 吐槽，我还浑然不知。看上一篇文章中的这段代码：

    try {
      data = JSON.parse(data)
      callback(null, data)
    } catch (error) {
      callback(error)
    }

事实上，在这段代码中，`callback` 有可能被调用两次。

> 这个问题[苏千在12年的沪JS大会上已经讲过了](http://www.infoq.com/cn/presentations/Nodejs-hole)，我是现场观众，但却忘记了……

如果`JSON.parse` 成功，但是 `callback` 在运行的时候报异常的话，就会触发 `catch` 块，`callback` 就会再被调用一次。这个问题不难理解，但是非常隐蔽。下面是可行的一种 fix 方案：

    var hasError = false
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

这就是 `callback` 的可靠性问题。每个以 `callback` 作为异步回调逻辑都可能产生问题。我们自己写的代码，或者第三方类库都有可能导致 `callback` 被重复调用。以 `callback` 提供的异步 API 是无法保证回调次数的，这就产生了信任问题。如果有大量的异步嵌套，只要出错，就是一场灾难。

## 很难处理串/并行异步操作

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
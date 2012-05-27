---
layout:  post
title:   浏览器缓存和CDN
---

#浏览器缓存和CDN

*作者：[island205](http://island205.github.com)* 时间：2012-05-27

##引子

前不久QA的同事来问我公司与CDN相关的事情，版本号是什么？浏览器缓存，CDN缓存的一些细节，为什么静态资源要有版本号？版本号怎么来的？如何就能刷缓存的？我虽然一一作答，但还是觉得对细节了解得不够清楚，遂打算起一篇文章好好研究一下浏览器的缓存和CDN，来探讨一下二者的来龙去脉。

##研究方法和工具

从HTTP头讲起，一步步看看缓存是如何实现的，同时使用[Node.js](http://nodejs.org)来做实例服务器，使用[CoffeeScript](http://coffeescript.org)来做一些小实例，帮助大家理解，浏览器选定chrome，一是方面察看请求，二是浏览器间的对缓存的处理也不一致，仅用chrome理解原理为要。

开始我的探索之旅吧！

##第一个问题，浏览器一定会有缓存吗？

首先介绍一个工具[Chrome缓存察看器](http://www.nirsoft.net/utils/chrome_cache_view.html)，可以用它来察看Chrome的缓存数据。为了便于后续的实验，我们先清掉chrome的缓存数据（方法自寻），然后使用察看其察看如下：

![清除了缓存的chrome，可能还会有一到两个无法清除的与Google相关的缓存，不过没什么大碍，其他缓存已经被清除了](http://pic.yupoo.com/island205/BZR9gG7Y/medish.jpg)

清除了缓存的chrome，可能还会有一到两个无法清除的与Google相关的缓存，不过没什么大碍，其他缓存已经被清除了。

用`Node.js`快速搭建一个最简单的服务器：

**server.coffee**

{% highlight coffeescript %}
	http=require "http"
	server=http.createServer (req,res)->
		#返回服务器当前的处理时间
		res.end (new Date()).toString()
	server.listen 1337,'127.0.0.1'

	console.log "Sever runing at http://127.0.0.1:1337"
{% endhighlight %}

使用`coffee -cw .`命令实时编译server.coffee成server.js，使用[nodemon](https://github.com/remy/nodemon)，来运行server.js，每次文件有修改时就不用手动重启node服务器了。

运行命令`nodemon server.js`，使用清掉了缓存的chrome访问[http://127.0.0.1:1337](http://127.0.0.1:1337)。

下图是chrome浏览器请求的情况，在调试工具的Network中可以察看请求头和相应头（在之后的实验中我直接使用文本来表示页面呈现的样子和关键的HTTP头）：

![首次请求的情况](http://pic.yupoo.com/island205/BZRkumQT/medish.jpg)

然后这是Chrome的缓存（同样之后直接使用关键的文本）：

![chrome缓存](http://pic.yupoo.com/island205/BZRkOCtV/medish.jpg)



---
layout:  post
title:   浏览器缓存和CDN
---

#浏览器缓存和CDN

*作者：[island205](http://island205.github.com) 时间：2012-05-27*

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


可以看出新增了两条缓存，第二条忽略（详情可看[Favicon](http://zh.wikipedia.org/wiki/Favicon)）,第一条的详细信息：

>Filename:		127.0.0.1_1337  
>URL:			http://127.0.0.1:1337  
>Filesize:		55   
>Last Accessed:		2012/5/27 下午 11:54:19  
>Server Response:	HTTP/1.1 200 OK

那这就是缓存吗？刷新就不再访问服务器直接使用这个缓存吗？我们刷新试试看，页面上的结果：

>Thu May 31 2012 22:35:16 GMT+0800 (China Standard Time)

（由多个时间段写成，实验时间虽不连贯，但是是正确的）

再看看缓存察看器里的结果：  
>Filename:		127.0.0.1_1337  
>URL:			http://127.0.0.1:1337  
>Filesize:		55   
>Last Accessed:		2012/5/31 下午 10:35:16  
>Server Response:	HTTP/1.1 200 OK	  

这是什么意思？再一次请求的时候并没有直接使用缓存，而是发出了新的请求，且更新了缓存。这些缓存既然不用保存着有什么用？

在我们的node服务器上添加一行：

**server.coffee**  
{% highlight coffeescript %}
	http=require "http"
	server=http.createServer (req,res)->
		#返回一个链接 跳转到/index
		res.write("<a href='http://127.0.0.1:1337/index'>goto /index</a><br />")
		#返回服务器当前的处理时间
		res.end (new Date()).toString()
	server.listen 1337,'127.0.0.1'

	console.log "Sever runing at http://127.0.0.1:1337"
{% endhighlight %}

现在访问[http://127.0.0.1:1337](http://127.0.0.1:1337)，点击链接`goto /index`，页面跳转到了http:127.0.0.1:1337页面。察看缓存，多了一条数据：  
>Filename:		index  
>URL:			http://127.0.0.1:1337/index  
>Filesize:		110  
>Last Accessed:		2012/5/31 下午 11:41:05	  
>Server Response:	HTTP/1.1 200 OK	   

按浏览器的back按钮，然后forward，往复，你会发现页面的时间一直没变。即你在翻找浏览历史的时候，浏览器并不会去请求服务器，而是直接从缓存中拿内容。我们先不讨论如何让浏览器在back或者forward的时候也访问服务器，先讨论下如何让浏览器在刷新时拿的也是缓存中的的数据？

##Expires

HTTP还处于洪荒时期，如何让客户端缓存（使用缓存，不访问服务器）请求呢？我们在HTTP的头中加入了一个Expires（过期时间），当给缓存设定一个未来的时间点，告诉浏览器，在这个时间点以前，你就使用缓存吧，别来请求我了：  
**server.coffee**  
{% highlight coffeescript %}
http=require "http"
server=http.createServer (req,res)->
	scriptResHeader=
		Expires:new Date((new Date()).getTime()+30*1000)
		if req.url.indexOf("/script")>-1
			#设置脚本的返回头
			for own key,value of scriptResHeader
				res.setHeader key,value
			#返回一段JS代码 例如：alert('Fri Jun 01 2012 00:03:37 GMT+0800 (China Standard Time)');
			res.end "alert('#{(new Date()).toString()}');"
		else
			#返回一个script标签，引用/script脚本
			res.write("<script src='/script'></script>")
			#返回服务器当前的处理时间
			res.end (new Date()).toString()
server.listen 1337,'127.0.0.1'

console.log "Sever runing at http://127.0.0.1:1337"
{% endhighlight %}

现在我们访问[http://127.0.0.1:1337](http://127.0.0.1:1337)时，会请求发两次请求，还有一个是[http://127.0.0.1:1337/script](http://127.0.0.1:1337/script)，并且现在我们为这个脚本请求返回头加了一个过期时间，就是当前服务器时间的30秒以后，如果现在服务器时间是  
>Fri Jun 01 2012 00:17:44 GMT+0800 (China Standard Time)  
那过期时间就是：  
>Fri Jun 01 2012 00:18:14 GMT+0800 (China Standard Time)  
如下图所示：  
![script的过期时间](http://pic.yupoo.com/island205/C0td8x0C/medish.jpg )



				

			






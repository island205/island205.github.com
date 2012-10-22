---
layout:  post
title:  [翻译]CoffeeScript Source Maps 
---

*作者：[Ryan Florence](http://ryanflorence.com/2012/coffeescript-source-maps/) 时间：2012-10-22

Michael Ficarra创建的“better CoffeeScript compiler”的[kickstarter](http://www.kickstarter.com/projects/michaelficarra/make-a-better-coffeescript-compiler)很成功，而且现在还反馈了和一个巨大的红利——[source maps](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/)，CoffeeScript调试，作为不把CoffeeScript用在浏览器中最流行也是最强的反对意见，现在已经解决90%了。

##安装CoffeeScriptRedux

从Github上把它clone下来：

{% highlight bash %}
    $ git clone git://github.com/michaelficarra/CoffeeScriptRedux.git
{% endhightlight %}

安装依赖：

{% highlight bash %}
    $ cd CoffeeScriptRedux
    $ make deps
{% endhightlight %}

运行测试，保证没啥问题：

{% highlight bash %}
    $make test
{% endhightlight %}

##把你的文件编译为JS吧

CoffeeScriptRedux没有使用与CofffeeScript一样的接口，所以可能这会与你使用的稍微有点不一样。 

从CoffeeScriptRedux目录开始：

{% highlight bash %}
    $ ./bin/coffee --js -i /path/to/test.coffee
{% endhightlight %}

这会创建一个文件：`/path/to/test.js`。

##创建Source Map文件

{% highlight bash %}
    $ ./bin/coffee --source-map -i /path/to/test.coffee > /path/to/test.js.map
{% endhightlight %}

为了干成这事，我不得不安装了source-map：

{% highlight bash %}
    $ npm install source-map
{% endhightlight %}

##把Source Map告诉浏览器

你需要告诉浏览器source map文件在哪里，可以往文件里添加一行注释，你可以编辑`test.js`，或者直接运行：

{% highlight bash %}
    $ (echo; echo '//@ sourceMappingURL=test.js.map') >> /path/to/test.js
{% endhightlight %}

##打开Chrome开启Source Map功能

打开控制台，点击右边的齿轮按钮，勾选“Enable Source Maps”。

![chrome](http://ryanflorence.com/2012/coffeescript-source-maps/chrome.png)

##“That's it!”

打开一个带有`test.js`的页面，查看`web inspector`的“Sources”，你的CoffeeScript就在那里，你可以设置断点，鼠标划过变量能够看到它们的值（译者：噢噢噢噢），诸如此类！

下面是一个我故意打破映射的实现：

[下载示例文件](http://ryanflorence.com/2012/coffeescript-source-maps/demo.zip)

![map](http://ryanflorence.com/2012/coffeescript-source-maps/map.png)

##那，那10%没有解决的是什么？

就是，你无法在console中直接输入CoffeeScript。这里有一个CoffeeConsole chrome插件，但是在断点的地方它什么都不知道啊 。（译者：说不准可以使用`：//@sourceUrl=<path>`解决？）


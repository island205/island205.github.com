---
layout:  chapter
title:   CoffeeScript与Node.js
---

<div class="back"><a href="/cs/">&laquo; 返回目录</a></div>

#第6章 Node.js服务端程序
在服务器上运行JavaScript一直都是web开发者的梦想。使用基于JavaScript服务端的开发者，无需在客户端语言和服务端语言之间来回切换，只要通晓web程序世界的通用语言JavaScript——或者它二十一世纪的旁系语言，CoffeeScript——就行了。  
现在这个梦想终于成为了现实。在本章中，从介绍模块模式（CommonJS标准的一部分）开始，我们将进行一段简短的Node.js之旅。然后我们还会搞清楚什么是“事件架构”及其对服务器端性能、编程思想的影响。最终，我们将为上一章的5x5游戏添加一个Node的后台程序，同时使用WebSocket来实现实时多人游戏的模式。

##6.1 什么是Node.js
不要受名字的影响：Node.js并不是一个JavaScript类库。相反，它是一个JavaScript解释器（由Google Chrome浏览器的JavaScript引擎V8驱动），它提供了底层操作系统调用的接口。通过这种方式，运行于Node.js上的JavaScript可以读写文件，创建进程，甚至可以收发HTTP请求——这是最富吸引力的一点。   
与CoffeeScript一样，Node.js也是一个新项目（可追溯到2009年早些时候），它成长迅速，并催生出了很多激动人心的事物。看看Node.js Knockout 吧——一个受Rails Rumble 启发的编程竞赛，看谁能在48小时内开发出最好的Node程序。   
已经有许多很棒的用Node和CoffeeScript写成的项目了。下面是挑选出来的几个示例项目。看完本书后你可以回过来看看这个列表，阅读真实的源码是把你的能力推向更高层次的一个好方法：

- **Docco\[Ash11\]**：著名计算机科学家Donald Knuth提倡“文学化编程”的方法论。其涵义是编写的代码和注释要让那些第一次碰到这个程序的人，只要阅读一次源码就能理解这个程序。由Jeremy Ashkenas开发的Docco就支持这种方法论，它能生成漂亮的网页，并在网页中分列两边显示注释和代码。  
- **Eco\[Ste11\]**：假设你正在编写一个基于Node的web程序。你手头上有了所有HTML框架和大堆程序代码，但是你却不知道如何把它们结合到一起。Eco允许你把CoffeeScript嵌到HTML标签中，使其成为一个服务器端的模板语言。  
- **Zappa\[NM11\]**：从头开始创建一个web程序从来都没有如此的简单过。Zappa构建在Node的流行框架Express之上，你只需通过简单的描述就能定义服务器该如何处理任意HTTP请求 。它还能完美地集成Eco！  
- **Zombie.js\[Ark11\]**：全栈式web程序测试模块领域又来了一个新小伙：Zombie.js。Zombie允许你运用Sizzle强大的能力验证你web程序的行为，而Sizzle同时也是jQuery的选择器引擎。它不仅好用，而且还异常的快。

你可以在https://github.com/jashkenas/coffee-script/wiki/In-The-Wild上找到一个非常完整程序列表，它包含了各种各样基于CoffeeScript的程序。

##6.2 使用“exports”和“require”构建模块化代码
在前面几章中，我们曾使用过`global`来把变量存放到程序级的命名空间中。但是`global`有其适用的范围，Node开发者通常更愿意让每个文件都有自己的命名空间，以保持代码的整洁和模块化。那一个文件如何与其他文件共享对象呢？  
解决办法就是使用一个叫做`exports`的特殊对象，它是CommonJS模块标准的一部分。一个文件的`exports`对象会在另外一个文件`require`调用该文件时返回。因而，举例来说，假设我们有两个文件：

   **Nodejs/app.coffee**

{% highlight coffeescript %}
    util = require './util'
    
    console.log util.square(5)
{% endhighlight %}
    
   **Nodejs/util.coffee**

{% highlight coffeescript %}
    console.log 'Now generating utility functions...'
    exports.square = (x) -> x * x
{% endhighlight %}

当你运行命令`coffee app.coffee`时，`require “./util”`执行`util.coffee`后返回它的`exports`对象，你会得到如下结果：

{% highlight bash %}
    Now generating utility functions...
    25
{% endhighlight %}

你可能会问为什么我们不需要指定文件扩展名？在Node.js中通常可以省略文件扩展名`.js`。不过只有在运行的程序已加载了coffee-script类库之后才可以省略`.coffee`。当然使用`coffee`运行文件时就已经隐式地加载了这个模块。coffee-script同时也会告诉Node.js如何处理CoffeeScript文件。因此，假如我们只把`app`而没有把`util`编译为JavaScript，那我们就必须这样写：

   **Nodejs/app.js**

{% highlight coffeescript %}
    require('coffee-script');
    var util = require('./util');
    console.log(util.square(5));
{% endhighlight %}

当遇到一个没有带“.”或者“./”前缀的类库时，Node就到它的类库目录中寻找匹配的文件。你可以使用`require.paths`来查看类库目录。  
根据约定，一个类库供`require`调用的名字与供npm安装的名字是一样的。比方说，回想下，我们曾使用命令`npm install -g coffee-script`来安装过CoffeeScript。这个命令不但为我们安装了可执行的coffee二进制文件，同时还安装了coffee-script类库。在本章的后面我们还会使用npm为我们的项目安装更多其他的类库。

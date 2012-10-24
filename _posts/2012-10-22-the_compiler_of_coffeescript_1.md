---
layout:  post
title:   CoffeeScript编译器研究（一）（未完成）
---

#CoffeeScript编译器研究（一）（未完成）

[CoffeeScript](http://coffeescript.org/)越来越流行，接触CoffeeScript也已经一年有余，最近正在看它的编译器实现，在这里把体会记录下来。

目前，CoffeeScript编译器是使用CoffeeScript编写的，很多人会问，这是蛋生鸡呢，还是鸡生蛋？ 
其实CoffeeScript编译器最初是使用Ruby编写的，CoffeeScript团队于2010年2月21号发布了[v0.5.0](http://coffeescript.org/#changelog)，使用CoffeeScript重写了编译器。

#CoffeeScript编译器的整体架构

{% highlight coffeescript %}
             -------------      -----------------
             -           -      -               -
cs code ---> -   Lexer   - ---> - Parser(Jison) - ---> AST ---> node.compile() ---> js code
             -           -      -               -
             -------------      -----------------
                                        ^
                                        -
                                        -
                                  -------------
                                  -           -
                                  -   Nodes   -
                                  -           -
                                  -------------
{% endhighlight %}

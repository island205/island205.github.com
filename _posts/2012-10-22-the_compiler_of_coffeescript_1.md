---
layout:  post
title:   CoffeeScript编译器（一）
---

#CoffeeScript编译器（一）

[CoffeeScript](http://coffeescript.org/)越来越流行，接触CoffeeScript也已经一年有余，最近正在看它的编译器实现，在这里把体会记录下来。

目前，CoffeeScript编译器是使用CoffeeScript编写的，很多人会问，这是蛋生鸡呢，还是鸡生蛋？ 
其实CoffeeScript编译器最初是使用Ruby编写的，CoffeeScript团队于2010年2月21号发布了[v0.5.0](http://coffeescript.org/#changelog)，使用CoffeeScript重写了编译器。

#CoffeeScript编译器的整体架构

就目前的CoffeeScript编译器来说，整体架构如下图：

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

概括来讲（通常了解点编译器的人都会说的），CoffeeScript编译器也不例外，主要也分为三大部分：词法解析器（Lexer），语法解析器（Parser）以及构造AST（抽象语法树），遍历语法树生成相应的代码。

下面首先对这三块进行简单的介绍：

- **Lexer([lexer.coffee](http://coffeescript.org/documentation/docs/lexer.html))**：词法解析器就是接受输入的cs代码，然后输出token。虽然CoffeeScript语法解析是基于Jison的，Jison同时也可以做词法解析，但CoffeeScript却自己实现了词法解析器。为什么CoffeeScript要自己实现一个Lexer呢？因为CoffeeScript的语法是LALR(1)的，无法满足CoffeeScript简洁语法的需要，因此需要自定义Lexer，且使用[rewriter.coffee](http://coffeescript.org/documentation/docs/rewriter.html)来处理这些语法，在token流中插入补充token； 

- **Parser([grammar.coffee](http://coffeescript.org/documentation/docs/grammar.html))**：语法解析器就是根据CoffeeScript的语法规则，接受Lexer的输出的token作为输入产生AST。生成AST并不是所有Parser都需要做的。在语法解析的过程中，使用不同的语法规则进行移入token，规约即可。只是可以定义规约时的操作，结合[nodes.coffee](http://coffeescript.org/documentation/docs/nodes.html)（其中定义了AST不同类型的节点）生成CoffeeScript所需的AST；  
在源码中并没有一个名为`parser.coffee`的文件。Parser是使用Jison基于`grammar.coffee`生成的；
- **AST**：抽象语法树是Parser的产物，也就是`nodes.coffee`所定义的诸多节点组成的一棵树。每个节点都有`compile`和`compileNode`方法。从根节点开始，通过`compile`方法的调用，深度优先遍历整个AST，从而生成js代码。

调用CoffeeScript提供出来的接口，可以看到产生的一些中间变量，例如：

{% highlight coffeescript %}
code = '''
do ->
    String::trim || String::trim = ->
        @replace /^\s+|\s+$/g,''
    return
'''
###
[
    ["UNARY", "do", 0],
    ["->", "->", 0],
    ["INDENT", 4, 1],
    ["IDENTIFIER", "String", 1],
    ["::", "::", 1],
    ["IDENTIFIER", "trim", 1],
    ["LOGIC", "||", 1],
    ["IDENTIFIER", "String", 1],
    ["::", "::", 1],
    ["IDENTIFIER", "trim", 1],
    ["=", "=", 1],
    ["->", "->", 1],
    ["INDENT", 4, 2],
    ["@", "@", 2],
    ["IDENTIFIER", "replace", 2],
    ["CALL_START", "(", 2],
    ["REGEX", "/^s+|s+$/g", 2],
    [",", ",", 2],
    ["STRING", "''", 2],
    ["CALL_END", ")", 3],
    ["OUTDENT", 4, 3],
    ["TERMINATOR", "\n", 3],
    ["RETURN", "return", 3],
    ["OUTDENT", 4, 3],
    ["TERMINATOR", "\n", 3]
]
###
console.log JSON.stringify CoffeeScript.tokens code
###
{
    "expressions": [{
        "args": [],
        "isNew": false,
        "isSuper": false,
        "variable": {
            "params": [],
            "body": {
                "expressions": [{
                    "operator": "||",
                    "first": {
                        "base": {
                            "value": "String"
                        },
                        "properties": [{
                            "name": {
                                "value": "trim",
                                "asKey": true
                            },
                            "proto": ".prototype",
                            "soak": false
                        }]
                    },
                    "second": {
                        "variable": {
                            "base": {
                                "value": "String"
                            },
                            "properties": [{
                                "name": {
                                    "value": "trim",
                                    "asKey": true
                                },
                                "proto": ".prototype",
                                "soak": false
                            }]
                        },
                        "value": {
                            "params": [],
                            "body": {
                                "expressions": [{
                                    "args": [{
                                        "base": {
                                            "value": "/^s+|s+$/g"
                                        },
                                        "properties": []
                                    }, {
                                        "base": {
                                            "value": "''"
                                        },
                                        "properties": []
                                    }],
                                    "soak": false,
                                    "isNew": false,
                                    "isSuper": false,
                                    "variable": {
                                        "base": {
                                            "value": "this"
                                        },
                                        "properties": [{
                                            "name": {
                                                "value": "replace",
                                                "asKey": true
                                            },
                                            "proto": "",
                                            "soak": false
                                        }],
                                        "this": true
                                    }
                                }]
                            },
                            "bound": false
                        }
                    },
                    "flip": false
                }, {}]
            },
            "bound": false
        },
        "do": true
    }]
}
###
console.log JSON.stringify CoffeeScript.nodes code
{% endhighlight %}

这一部分就说到这里，之后会更加深入到CoffeeScript的各个实现细节之中。


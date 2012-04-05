---
layout:  chapter
title:   集合与迭代
---

<div class="back"><a href="/cs/">&laquo; 返回目录</a></div>

#**3.2 数组**
你可以使用任意的普通对象来保存值列表，只是数组（继承了`Array`原型中的属性）为你提供了好几个非常棒的特性。  
你可以使用JSON式的语法来定义数组：

{% highlight coffeescript %}
    mcFlys = ['George', 'Lorraine', 'Marty']
{% endhighlight %}

该行代码等价于：

{% highlight coffeescript %}
    mcFlys = new Array()
    mcFlys[0] = 'George'
    mcFlys[1] = 'Lorraine'
    mcFlys[2] = 'Marty'
{% endhighlight %}

别忘了对象上的每一个键都会被转化为字符串，因此`arr[1]`、`arr[“1”]`甚至包括`arr[{toString:->”1”}]`的含义都是一样的。（如果某个对象有一个`toString`方法，则在该对象被转化为字符串时会使用该方法的返回值。）  
因为数组也是对象，所以你可以自由地为数组加上各种属性，尽管一般并不会这么做。更通常的做法是直接修改`Array`的原型，为所有的数组添加特殊的方法。例如，Prototype.js框架以此为数组添加了像`flatten`和`each`这类方法，使其更像Ruby的数组。

##**区间**
打开REPL吧，因为熟悉CoffeeScript区间语法（以及在下一小节中即将介绍与之密切相关的切分（`slice`）和剪接（`splice`）语法）的最好方法就是`('practice' for i in [1..3]).join(', ')`。 
CoffeeScript引入了Ruby式语法来定义一个连续的整数数组：

{% highlight bash %}
    coffee> [1..5]
    [1, 2, 3, 4, 5]
{% endhighlight %}

`..`被用来定义闭区间（inclusive range）。但是通常我们希望能够忽略最后一个值，如果是这样，可以添加一个`.`来生成排外区间(exclusive rage)：

{% highlight bash %}
    coffee> [1...5]
    [1, 2, 3, 4]
{% endhighlight %}

（为了方便记忆，可想像额外的`.`代替了最后一项值。）区间也可以是倒序的：

{% highlight bash %}
    coffee> [5..1]
    [5, 4, 3, 2, 1]
{% endhighlight %}

不管顺序是正是反，排外区间总是省略掉末尾的值：

{% highlight bash %}
    coffee> [5...1]
    [5, 4, 3, 2]
{% endhighlight %}

通常很少单独使用这种语法，我们很快就会发现，它是CoffeeScript`for`循环不可或缺的一部分。

##**切分和剪接**
当你想从数组中切出一块时，需要使用听起来有点暴力的`slice`方法：

{% highlight bash %}
    coffee> ['a', 'b', 'c', 'd'].slice 0, 3
    ['a', 'b', 'c']
{% endhighlight %}

传给`slice`的两个数字是索引值。从第一个索引开始到第二个索引结束但不包括第二个索引内的所有东西都拷贝到返回结果里。你可能一看就会说：“这听起来有点像排外区间 。”你说对了：

{% highlight bash %}
    coffee> ['a', 'b', 'c', 'd'][0...3]
    ['a', 'b', 'c']
{% endhighlight %}

你也可以使用闭区间：

{% highlight bash %}
    coffee> ['a', 'b', 'c', 'd'][0..3]
    ['a', 'b', 'c', 'd']
{% endhighlight %}

这里的规则较闭区间来说稍有不同，这都是因 为`slice`的特殊性所致。特别地，如果第一个索引的指向位置在第二个的指向位置之后，结果就会是一个空数组而不是一个倒转的数组：

{% highlight bash %}
    coffee> ['a', 'b', 'c', 'd'][3...0]
    []
{% endhighlight %}

还有，负索引会从数组末尾往前倒数，虽然`arr[-1]`只是表示查找`arr`中名为`“-1”`的属性值，但是`arr[0…-1]`的意思却是“把从数组开始直到但不包含最后一个元素的切分返回给我。”换句话说，当切分`arr`时，-1的意义与`arr.length-1`相同。  
如果你省略了第二个索引，则无论你使用的是两个还是三个点，都会一直切分到数组的末尾：

{% highlight bash %}
    coffee> ['this', 'that', 'the other'][1..]
    ['that', 'the other']
    coffee> ['this', 'that', 'the other'][1...]
    ['that', 'the other']
{% endhighlight %}

CoffeeScript还为`splice`——`slice`的用于插值的兄弟方法——提供了一个简写法。它看起来就像是在给切分赋值：

{% highlight bash %}
    coffee> arr = ['a', 'c']
    coffee> arr[1...2] = ['b']
    coffee> arr
    ['a', 'b']
{% endhighlight %}

<br />
<div class="addition">
<p><strong>字符串的切分</strong></p>

<p>有意思的是，JavaScript也为字符串提供了一个<code>slice</code>方法，尽管它的行为与<code>substring</code>方法一致。这就非常方便了，因为意味这你可以使用CoffeeSript的切分语法获取子字符串：</p>
<div class='highlight'><pre><code class='bash'>    coffee&gt; <span class='s1'>&#39;The year is 3022&#39;</span><span class='o'>[</span>-4..<span class='o'>]</span>
    3022
</code></pre>
</div>
<p>然而，别太发散——虽然切分适用于字符串，但是剪接却不行。因为在JavaScript中字符串一旦被定义就永远不能修改了。</p>
</div>

区间即表示数组被替换的部分。如果该区间为空，则会从第一个索引处开始直接插入值。

{% highlight bash %}
    coffee> arr = ['a', 'c']
    coffee> arr[1...1] = ['b']
    coffee> arr
    ['a', 'b', 'c']
{% endhighlight %}

有一点差异需要引起注意：虽然负数索引在切分时能够表现完美，但是在剪接时就完全不行了。但是省略第二个索引的技巧也还适用：

{% highlight bash %}
    coffee> steveAustin = ['regular', 'guy']
    coffee> replacementParts = ['better', 'stronger', 'faster']
    coffee> steveAustin[0..] = replacementParts
    coffee> steveAustin
    ['better', 'stronger', 'faster']
{% endhighlight %}

关于切分和剪接的内容就这么多。你可以认为自己是使用区间提取子字符串和子数组方面的专家啦！但是在`for…in` 语法中区间还有另外一种更加富有想象力的用法，在下一节中我们就会看到。

#**3.3 集合的迭代**
在CoffeeScript中内置了两种语法来对集合进行迭代：对象迭代和数组迭代（包括其他可列举对象，通常指的就是数组）。虽然两者看起来很像，但是它们的表现却很不一样。 
使用下面的句法来迭代对象的属性：

{% highlight coffeescript %}
    for key, value of object
      # do things with key and value
{% endhighlight %}

该循环会迭代该对象的所有键名，并且将其赋值给`for`后面第一个具名变量。第二个变量，即上面名为`value`的变量，可以省略。正如你所期望的那样，它会被赋上与键相对应的值，因此`value=object[key]`。

<div class="addition">
<p><strong>“hasOwnProperty”与“for own”</strong></p>

<p>在JavaScript中，对象“自己”的属性和从原型上继承而来的属性是有差别的。你可以使用<code>object.hasOwnProperty(key)</code>来检测某个特定属性是不是对象“自己”的。<br />因为大家通常希望迭代对象自己的属性，而不是迭代那些与同类共享的属性，所以CoffeeScript允许你使用<code>for own</code>自动进行检查且跳过那些没有通过检查的属性。这里有个例子：</p>
<div class='highlight'><pre><code class='coffeescript'>    <span class='k'>for</span> <span class='nx'>own</span> <span class='nx'>sword</span> <span class='k'>of</span> <span class='nx'>Kahless</span>
      <span class='p'>...</span>
</code></pre>
</div>
<p>它是下面这段代码的简写：</p>
<div class='highlight'><pre><code class='coffeescript'>    <span class='k'>for</span> <span class='nx'>sword</span> <span class='k'>of</span> <span class='nx'>Kahless</span>
      <span class='k'>continue</span> <span class='nx'>unless</span> <span class='nx'>Kahless</span><span class='p'>.</span><span class='nx'>hasOwnProperty</span><span class='p'>(</span><span class='nx'>sword</span><span class='p'>)</span>
      <span class='p'>...</span>
</code></pre>
</div>
<p>每当<code>for…of</code>给出了你不想要的属性时，使用<code>for own…in</code>替换了试试看。</p>
</div>

对于数组来说，语法稍稍有点不一样：

{% highlight coffeescript %}
    for value in array
      # do things with the value
{% endhighlight %}

为什么需要使用不一样的语法呢？为什么不直接使用`for key, value of array`呢？这是因为我们不能阻止数组拥有额外的方法和数据。如果你想要它的全部家当，那用`of`没问题。但是如果你就是想把数组当作一个数组，那么就使用`in`——你只会依次地获得`array[0]`、`array[1]`等，直到`array[array.length-1]`为止。  
两种风格的for循环都可以在后面跟一个`when`从句，当给定的条件为假时，就跳过当前的迭代。例如，下面的代码会忽略掉`obj`上非方法属性而调用其他所有的方法：

{% highlight coffeescript %}
    for key, func of obj when typeof func is 'function'
      func()
{% endhighlight %}

下面这段代码只有在`big`比较大时才会把其赋值给`highestBig`：

{% highlight coffeescript %}
    highestBid = 0
    for bid of entries when bid > highestBid
      highestBid = bid
{% endhighlight %}

当然，我们也可以在循环体内使用`continue`、`unless`等条件语句来替代`when`从句。但是`when`是一个非常有用的语法糖，尤其对于单行代码控来说。就如我们将在47页3.5节*列表解析*中看到的一样，它还是可以阻止任何值被添加到循环返回值数组中的唯一方法。

<div class="addition">
<p><strong>无作用域的<code>for</code></strong><br />当你写<code>for x of obj</code>或者<code>for x in arr</code>时，你其实正在给一个当前作用域内名为<code>x</code>的变量赋值。在循环结束后你还可以继续利用它们。看这个例子：</p>
<div class='highlight'><pre><code class='coffeescript'>    <span class='k'>for</span> <span class='nx'>name</span><span class='p'>,</span> <span class='nx'>occupation</span> <span class='k'>of</span> <span class='nx'>murderMysteryCharacters</span>
      <span class='k'>break</span> <span class='k'>if</span> <span class='nx'>occupation</span> <span class='o'>is</span> <span class='s1'>&#39;butler&#39;</span>
    <span class='nx'>console</span><span class='p'>.</span><span class='nx'>log</span> <span class='s2'>&quot;#{name} did it!&quot;</span>
</code></pre>
</div>
<p>再看另外一个例子：</p>
<div class='highlight'><pre><code class='coffeescript'>    <span class='nv'>countdown = </span><span class='p'>[</span><span class='mi'>10</span><span class='p'>..</span><span class='mi'>0</span><span class='p'>]</span>
    <span class='k'>for</span> <span class='nx'>num</span> <span class='k'>in</span> <span class='nx'>countdown</span>
      <span class='k'>break</span> <span class='k'>if</span> <span class='nx'>abortLaunch</span><span class='p'>()</span>
    <span class='k'>if</span> <span class='nx'>num</span> <span class='o'>is</span> <span class='mi'>0</span>
      <span class='nx'>console</span><span class='p'>.</span><span class='nx'>log</span> <span class='s1'>&#39;We have liftoff!&#39;</span>
    <span class='k'>else</span>
      <span class='nx'>console</span><span class='p'>.</span><span class='nx'>log</span> <span class='s2'>&quot;Launch aborted with #{num} seconds left&quot;</span>
</code></pre>
</div>
<p>但是这样作用域的缺少也会让你出其不意，尤其是当你在循环内定义了函数的时候。因此在不确定的情况下，就用<code>do</code>来捕获每个迭代内的变量：</p>
<div class='highlight'><pre><code class='coffeescript'>    <span class='k'>for</span> <span class='nx'>x</span> <span class='k'>in</span> <span class='nx'>arr</span>
      <span class='nx'>do</span> <span class='nf'>(x) -&gt;</span>
        <span class='nx'>setTimeout</span> <span class='p'>(</span><span class='o'>-&gt;</span> <span class='nx'>console</span><span class='p'>.</span><span class='nx'>log</span> <span class='nx'>x</span><span class='p'>),</span> <span class='mi'>0</span>
</code></pre>
</div>
<p>我们还会在3.9节<em>练习</em>中来回顾这个问题，详见56页。</p>
</div>

`for…in`支持一个其表兄`for…of`并不支持的补充修饰符：`by`。比起每次逐个循环（默认情况）整个数组，`by`可以让你随意地设置步值 ：

{% highlight coffeescript %}
    decimate = (army) ->
      execute(soldier) for soldier in army by 10
{% endhighlight %}

步值并非必须是整数。分数能与区间正常地协同工作：

{% highlight coffeescript %}
    animate = (startTime, endTime, framesPerSecond) ->
      for pos in [startTime..endTime] by 1 / framesPerSecond
        addFrame pos
{% endhighlight %}

你也可以使用一个负步值反过来从区间末尾开始迭代：

{% highlight coffeescript %}
    countdown = (max) ->
      console.log x for x in [max..0] by -1
{% endhighlight %}

但是要注意，数组迭代并不支持负步值。当你写`for…in [start..end]`时，`start`是第一个迭代值（而`end`是最后一个迭代值），只要`start>end`时负数步值就没有问题。但是每当你写`for…in arr`时，第一个迭代索引值总是`0`，最后一个迭代索引总是`arr.length-1`。因此如果`arr.length`大于零，则负步值会产生死循环——永远不可能达到最后一个迭代索引！  
关于`for…of`和`for…in`，你应该了解的就这么多。记住最重要的一点，CoffeeScript中的`of`与JavaScript中的`in`等价。可以这样来想：值在数组中（`in`），而你知道数组的（`of`）键。  
`of`和`in`作为运算符有两种存在方式：`key of obj`用来检测`obj[key]`是否已被赋值，而`x in arr`则是用来检测`arr`是否存在某个值等于`x`。正如`for…in`循环，`in`运算符只能用在数组上（还包括其他可枚举实体，比如说arguments和jQuery对象）。下面是一个例子：

{% highlight coffeescript %}
    fruits = ['apple', 'cherry', 'tomato']
    'tomato' in fruits # true
    germanToEnglish: {ja: 'yes', nein: 'no'}
    'ja' of germanToEnglish #true
    germanToEnglish[ja]?
{% endhighlight %}

如果你想检测一个非枚举对象是否包含某个特定值时该怎么办？我们把这个问题留到练习中去解答。

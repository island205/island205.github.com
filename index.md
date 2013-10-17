---
layout: content
title: island205.github.com
---

<h1>island205<sub style="color:gray;">(ZhiCun)</sub></h1>

<h2>Who am I?</h2>
<p>
I am a fronteer working in <a href="http://www.dianping.com" target="_blank">Dianping.Inc</a>. I like reading,coding,running,and sleeping.
</p>

<h2>How to contact me ?</h2>
<ol>
	<li>mailto <a href="mailto:island205@gmail.com">island205@gmail.com</a></li>
	<li>
		followme at
		<a href="http://www.douban.com/people/island205/">douban</a> or
		<a href="https://twitter.com/#!/island205">twitter</a>.
	</li>
	<li>this is my <a href="http://island205.com">blog</a>.</li>
</ol>

<h2>books I translated</h2>

<a href="/tlboc/" class="face">
<img src="/img/tlboc.gif" title="CoffeeScript中文手册（The Little Book On CoffeeScript中文版）">
</a>
<a href="/cs/" class="face">
<img src="/img/cs.jpg" title="深入浅出CoffeeScript（CoffeeScript Accelerated JavaScript Development）">
</a>
<a href="http://read.douban.com/ebook/198648/" class="face">
<img src="http://pic.yupoo.com/island205/CmtFoqUo/medium.jpg" title="CoffeeScript小书（The Little Book On CoffeeScript中文版 豆瓣阅读版）" style="height:236px;">
</a>

<h2>books I wrote</h2>

<a href="/helloseajs/01-contents.html" class="face">
<img src="http://pic.yupoo.com/island205/Df8YGtwK/medium.jpg" title="Hello Sea.js">
</a>

<h2>posts</h2>
<ol>
    {% for post in site.posts %}
    <li>{{ post.date | date_to_string }} <a href="{{ post.url }}">{{ post.title }}</a></li>
    {% endfor %}
</ol>

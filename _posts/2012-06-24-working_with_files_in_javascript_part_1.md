---
layout:  post
title:  [翻译]使用JavaScript处理文件，第1部分：基础（未完成）
---

#使用JavaScript处理文件，第1部分：基础

*作者：[Nicholas C. Zakas](http://www.nczonline.net/about/) 时间：2012-06-24*

很多年前，我在Google面试时被问到，如果可以话，你想要改变什么来让Web提供更佳的体验？在我心中最首要的是能够有其他处理文件的方式，而不仅仅是是通过`<input type="file">`控件。虽然Web的其他部分一直在变化，但我们处理文件的方式与最开始一样，没什么变化。幸好，有了HTML5相关的API，我们现在在最新版的桌面浏览器（iOS还不支持File API）中处理文件较以前有了更多选择。

##File类型

File类型在File API标准中有定义，它是一个文件抽象的表示。每一个File实例都有下面这几个属性：  
- **name**	文件名
- **size**	件字节大小
- **type**	件的MIME类型




title: 可选择样式表
----

可选择样式表这个问题，有点绕，之前看懂了，后来忘记，现在就把它记下来。 这个问题与样式表的rel和title属性的值和组合有关：

1.默认样式表，指定rel属性为stylesheet，会在页面上一直存在的样式，不受用户选择其他可选择样式表的影响：

    <link href=”default.css” rel=”stylesheet” type=”text/css”>

2.可选择默认样式表，指定rel属性为stylesheet，指定title的值，默认会应用到页面上，会出现在用户可选择样式表列表内，且用户选了其他可替换样式表后，会去掉该样式表：

    <link href=”default.css” rel=”stylesheet” type=”text/css” title=”Alternate Default Style”>

3.可选择样式表，指定rel属性为alternate stylesheet，指定title的值，默认不会应用到页面上，会出现在用户可选择样式表列表内，且用户选了其他可替换样式表后，会去掉该样式表，可以有多类（title来区分），下面是两个示例：

    <link href=”basic.css” rel=”alternate stylesheet” type=”text/css” title=”Basic”>

    <link href=”fancy.css” rel=”alternate stylesheet” type=”text/css” title=”Fancy”>

在Firefox中，使用菜单View>>Page Style可以查看可选择样式表列表（我的是Firefox 13.0.1）。

## 参考

- [Alternative Style Sheets](https://developer.mozilla.org/en/CSS/Alternative_style_sheets)
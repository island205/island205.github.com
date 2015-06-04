title:  测试驱动编写 React 简易计算器
----

> 本文的[源码](https://github.com/island205/ReactUnitTesting/tree/master/Caculator)和 [DEMO](http://island205.com/ReactUnitTesting/Caculator/) 都可以点击链接找到。

在5月30号 Teambition 组织的 React 的分享会中，我分享了如何对 React 组件进行单元测试，本文将做一些介绍和记录，以飨读者。

### 单元测试的重要性

> 此处省略十万字。

### 模块范式和测试方案

React 的开发并不脱离前端的开发范式。下表总结了 React 开发各个环节的一些可选方案。

<!--
<table>
  <thead>
    <tr>
      <th>Code</th>
      <th>Runtime</th>
      <th>Unit Test</th>
      <th>Test Runner</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Global</td>
      <td>In Order</td>
      <td rowspan=4>
        Jasmine
        <br>
        Mocha
        <br>
        <br>
        Tools:
          <br>
          Jasmine-react
          <br>
          Chance
        </td>
      <td rowspan=4>
        Manual
        <br>
        Karma
      </td>
    </tr>
    <tr>
      <td>AMD</td>
      <td>RequireJS</td>
    </tr>
    <tr>
      <td>CommonJS</td>
      <td>
          Browserify
          <br>
          Webpack
          <br>
          RequireJS
      </td>
    </tr>
    <tr>
      <td>ES6 Module</td>
      <td>
          Browserify
          <br>
          Webpack
          <br>
          RequireJS
      </td>
    </tr>
    <tr>
      <td>CommonJS</td>
      <td colspan=3>Jest</td>
    </tr>
  </tbody>
</table>
-->

<table> <thead> <tr> <th>Code</th> <th>Runtime</th> <th>Unit Test</th> <th>Test Runner</th> </tr> </thead> <tbody> <tr> <td>Global</td> <td>In Order</td> <td rowspan=4> Jasmine <br> Mocha <br> <br> Tools: <br> Jasmine-react <br> Chance </td> <td rowspan=4> Manual <br> Karma </td> </tr> <tr> <td>AMD</td> <td>RequireJS</td> </tr> <tr> <td>CommonJS</td> <td> Browserify <br> Webpack <br> RequireJS </td> </tr> <tr> <td>ES6 Module</td> <td> Browserify <br> Webpack <br> RequireJS </td> </tr> <tr> <td>CommonJS</td> <td colspan=3>Jest</td> </tr> </tbody> </table>

#### 模块范式

目前前端通常有四种代码的组织范式。

- **Global**：即无论是 React 还是 JSXTransformer，包括 业务代码都顺序的引入到页面中。通过全局对象来实现模块的共享。即如 [React 入门](http://facebook.github.io/react/docs/getting-started.html) 这样的例子；
- **AMD**：我们也可以在 AMD 的项目中使用 React，AMD 已经是一种非常成熟的方案，而且社区对 AMD 的支持也非常广泛。我们可以把 Flux 中的各个要件都写成 AMD 模块，然后异步加载到前端配合使用；
- **CommonJS**：CommonJS 是 React 项目本身代码组织的方式，也是 React 社区许多组件的模块化方案；基于 CommonJS；然后是用 Browserify 和 Webpack 来搭建运行时，当然通过一些工具转化成 AMD 模块也行；
- **ES6 Module**：编写未来的模块，通过 babel 等工具转化成现在可用的模块。

#### 测试用例

测试用例代码必须依附于开发范式，无论选择组织范式，代码必须都是分模块的（分文件、分模块），这样测试用例也可以分模块细粒度的编写。至于说基于何种测试框架，前端推荐使用 Jasmine，再加上一些测试的辅助工具即可，比如做 spy、mock 等。除此之外我们可以使用像 Karma 这样 Testing Runner，最大限度地排除开发过程中的重复劳动。

#### Jest

Jest 是 Facebook 打造的无脑的 CommonJS 模块测试框架。优点如下：

- 熟悉，基于 Jasmine；
- 轻量，一个待测试模块文件，一个测试文件，命令行就可以跑，无需浏览器；
- 内置 mock 方案，自动 mock 所有模块；

但，跑了几个官方的例子，有的不通，Github 上看说是 `jsdom` 的问题，必须使用 `0.10.x` 版的 node。呵呵，还是使用小而美的组合比较靠谱。而且 Jest 只能用来测试 CommonJS 范式的代码。

#### ES6 + Webpack + Jasmine + Karma 组合

我选择了 ES6 + Webpack + Jasmine + Karma 组合。

<!--
<table>
  <thead>
    <tr>
      <th>Code</th>
      <th>Runtime</th>
      <th>Unit Test</th>
      <th>Test Runner</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Global</td>
      <td>In Order</td>
      <td rowspan=4>
        <span style="font-weight: bold; color: green;">Jasmine</span>
        <br>
        Mocha
        <br>
        <br>
        Tools:
          <br>
          Jasmine-react
          <br>
          Chance
        </td>
      <td rowspan=4>
        Manual
        <br>
        <span style="font-weight: bold; color: green;">Karma</span>
      </td>
    </tr>
    <tr>
      <td>AMD</td>
      <td>RequireJS</td>
    </tr>
    <tr>
      <td>CommonJS</td>
      <td>
          Browserify
          <br>
          Webpack
          <br>
          RequireJS
      </td>
    </tr>
    <tr>
      <td style="font-weight: bold; color: green;">ES6 Module</td>
      <td>
          Browserify
          <br>
          <span style="font-weight: bold; color: green;">Webpack</span>
          <br>
          RequireJS
      </td>
    </tr>
    <tr>
      <td>CommonJS</td>
      <td colspan=3>Jest</td>
    </tr>
  </tbody>
</table>
-->

<table> <thead> <tr> <th>Code</th> <th>Runtime</th> <th>Unit Test</th> <th>Test Runner</th> </tr> </thead> <tbody> <tr> <td>Global</td> <td>In Order</td> <td rowspan=4> <span style="font-weight: bold; color: green;">Jasmine</span> <br> Mocha <br> <br> Tools: <br> Jasmine-react <br> Chance </td> <td rowspan=4> Manual <br> <span style="font-weight: bold; color: green;">Karma</span> </td> </tr> <tr> <td>AMD</td> <td>RequireJS</td> </tr> <tr> <td>CommonJS</td> <td> Browserify <br> Webpack <br> RequireJS </td> </tr> <tr> <td style="font-weight: bold; color: green;">ES6 Module</td> <td> Browserify <br> <span style="font-weight: bold; color: green;">Webpack</span> <br> RequireJS </td> </tr> <tr> <td>CommonJS</td> <td colspan=3>Jest</td> </tr> </tbody> </table>

ES6 Module，编写未来的代码，相信不久的将来 React 也会切换到 ES6 Module 上来。使用 Webpack 来 bundle 代码实现运行时，作为工具可以随时替换，如果之后有更好的工具就可以换掉。Jasmine 和 Karma 就不用细说了。

### 开始

我们的目标（也是最终结果）：

![React Caculator](http://ntu.so/di/GXMSJ/Caculator.png)

拆解成三个模块来实现这个计算器：

- Caculator.js：主界面，包括计算结果显示屏；
- Button.js：每一个按钮；
- Parser.js：用来解析用户的输入流（2+1=+3=5+1-...），产生结果，本质是一个状态机。

#### 搭建 TDD 环境

新建目录，添加文件如下：


    ├── src
    │   ├── Button.js
    │   ├── Button.less
    │   ├── Caculator.js
    │   ├── Caculator.less
    │   ├── Parser.js
    ├── test
    │   ├── specs
    │   │   ├── Button.spec.js
    │   │   ├── Caculator.spec.js
    │   │   └── Parser.spec.js
    │   └── test-main.js
    ├── package.json
    ├── karma.conf.js
    └── webpack.config.js

##### karma.conf.js

该文件通过 `karma init` 生成，然后做一些简单修改，添加 `karma-webpack` 插件把 `test/test-main.js` bundle 成一个可运行在浏览器中的测试文件：

    // 监听文件变化，重新运行测试
    files: [
      // included: false 为不包含这些文件到浏览器中
      {pattern: 'src/*.js', included: false},
      {pattern: 'src/*.less', included: false},
      {pattern: 'test/specs/**/*.js', included: false},
      'test/test-main.js'
    ],
    // ...
    preprocessors: {
      'test/test-main.js': ['webpack']
    },
    
    webpack: {
      devtool: 'inline-source-map',
      module: {
        loaders: [
          { test: /\.js$/, loader: 'babel-loader' },
          { test: /\.less$/, loader: "style!css!less" }
        ]
      }
    }
    
    webpackMiddleware: {
        noInfo: true,
        devtool: "#inline-source-map"
    },

    plugins: [
        require("karma-webpack"),
        require('karma-jasmine'),
        require('karma-chrome-launcher')
    ]

##### test-main.js
  
ES6 module，加入测试用例。

    import './specs/Button.spec'
    import './specs/Caculator.spec'
    import './specs/Parser.spec'

##### Caculator.spec.js

首先编写 Caculator 的测试用例：

    import React from 'react/addons'
    import Caculator from '../../src/Caculator'
    
    var TestUtils = React.addons.TestUtils
      
    describe('Caculator', function () {
      var caculator
    
      beforeEach(function () {
        caculator = TestUtils.renderIntoDocument(<Caculator />)
      })
    
      it('should display a caculator', function () {
        var divs = TestUtils.scryRenderedDOMComponentsWithTag(caculator, 'div')
        expect(divs.length).toBe(3)
        var as = TestUtils.scryRenderedDOMComponentsWithTag(caculator, 'a')
        expect(as.length).toBe(18)
      })
    })


> **TestUtils.renderIntoDocument** 较于 **React.render** 的优点在于，并不会把组件渲染到页面上，这样测试用例之间不会互相污染。`TestUtils` 多个像 `scryRenderedDOMComponentsWithTag` 这样的方法，便于你在 React 组件中查找子对象（可以是标记名、组件名等）。

##### Caculator.js

首先编写一个简单的 React 组件：

    "use strict";
    
    import './Caculator.less'
    
    export default React.createClass({
      render: function () {
        return (<div></div>)
      }
    })

运行 `karma start`，运行测试用例：

    $ karma start
    INFO [karma]: Karma v0.12.33 server started at http://localhost:9876/
    INFO [launcher]: Starting browser Chrome
    INFO [Chrome 43.0.2357 (Mac OS X 10.10.4)]: Connected on socket SQQx_6CxC3UHjooVPFk7 with id 86084967
    INFO [karma]: Delaying execution, these browsers are not ready: Chrome 43.0.2357 (Mac OS X 10.10.4)
    Chrome 43.0.2357 (Mac OS X 10.10.4) Caculator should display a caculator FAILED
      Expected 1 to be 3.
      Expected 0 to be 18.
    Chrome 43.0.2357 (Mac OS X 10.10.4): Executed 1 of 1 (1 FAILED) (0 secs / 0.026 Chrome 43.0.2357 (Mac OS X 10.10.4): Executed 1 of 1 (1 FAILED) ERROR (0.003 secs / 0.026 secs)

接下来我们编写 `Caculator.js` 的实现逻辑，以及修改 `Button.spec.js` 和 `Button.js`，实现计算器的 UI 功能。这里不再深入细节中，大家可以查看[示例代码](https://github.com/island205/ReactUnitTesting/tree/master/Caculator)。 

#### 事件模拟

`Button` 会注册一个 `click` 监听函数，当用户点击时，会通知 `Caculator` 输入的内容是什么。下面是这部分的测试用例：

    it('should call onPress as being clicked', function () {
      var letter
      var button = TestUtils.renderIntoDocument(
        <Button
          letter="=" onPress={function (lt) {
            letter = lt
          }}
        />
      )
      
      TestUtils.Simulate.click(button.getDOMNode())
      
      expect(letter).toBe('=')
    })

**TestUtils.Simulate** 是 `TestUtils` 提供的另外一个功能，可以模拟用户的操作，向组件发送事件。更多相关的使用可以参考[React 相关文档](http://facebook.github.io/react/docs/test-utils.html)。

#### Parser.js

`Parser.js` 是计算器的算法核心，提供了两个接口：

- **.take(letter)**，将用户每次点击的按钮输入到解析器中；
- **.getScreen()**，获取屏幕上应该显示的值。

<span></span>

    // Caculator.js
    updateScreen: function () {
      this.setState({
        screen: this.parser.getScreen()
      })
    },
    onPress: function (letter) {
      this.parser.take(letter)
      this.updateScreen()
    },
    componentDidMount: function () {
      this.parser = new Parser()
      this.updateScreen()
    }

在用户点击按钮的时候，输入 `letter`，然后调用  `getScreen()`，通过 `setState` 来更新显示。

部分测试用例如下：

    it('should handle ±', function () {
      parser.take('1')
      expect(parser.getScreen()).toBe('1')
      parser.take('±')
      expect(parser.getScreen()).toBe('-1')
      parser.take('±')
      expect(parser.getScreen()).toBe('1')
    })
    
    it('should accpet float', function () {
      parser.take('1')
      parser.take('.')
      parser.take('1')
      expect(parser.getScreen()).toBe('1.1')
      parser.take('±')
      expect(parser.getScreen()).toBe('-1.1')
    })
    
    it('should clear screen when user click C', function () {
      parser.take('1')
      parser.take('.')
      parser.take('1')
      expect(parser.getScreen()).toBe('1.1')
      parser.take('C')
      expect(parser.getScreen()).toBe(0)
    })

##### 状态图

关于 Parser.js 里的算法，琢磨了很久，怎么改代码都写不好，很明显的问题就是，同一个输入在不同状态下，需要实施的操作完全不一样。于是停止 coding，先把状态图画出来：

![Caculator State Machine](http://t1.qpic.cn/mblogpic/9e8552609e06c7b03536/2000.jpg)

- **s1**：初始状态（求值操作或者清空操作都会回到这个状态。）；
- **s2**：左操作数输入中；
- **s3**：右操作数输入中；
- **s4**：出错（除0操作导致）；

状态图画好，一切引刃而解，据此添加更多的测试用例，在 Parser.js 把逻辑实现即可。

#### webpack.config.js

组件都写好了，新建 `dist` 目录，添加 `dist/index.html` 和  入口 'src/index.js' 文件，是时候把组件组装成起来了：

    // webpack.config.js
    module.exports = {
        entry: "./src/index.js",
        output: {
            path: 'dist/',
            filename: "bundle.js"
        },
        module: {
            loaders: [
                { test: /\.js$/, loader: 'babel-loader' },
                { test: /\.less$/, loader: "style!css!less" }
            ]
        }
    }

通过 `webpack` 把应用打包到 `dist/bundle.js`。做一些样式方面的调整就行啦。猛击 [DEMO](http://island205.com/ReactUnitTesting/Caculator/)。

#### 总结

单元测试驱动开发除了能够保证代码质量以外，一定还可以减少调试的重复劳动。比如 Parser 的输入序列使用测试用例来输入很简单，如果使用手动点击就很麻烦了。针对 React 组件的单元测试还有点本文并没有提到，比如 React-Jasmine rewire 的使用等等，大家可以自己琢磨。




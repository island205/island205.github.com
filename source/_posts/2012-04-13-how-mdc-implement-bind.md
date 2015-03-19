title: MDC上是如何实现bind函数的
----

在平时开发过程中想必都有把函数绑定到某个上下文 this 上 JavaScript 1.8.5 中引入了 `Function.prototype.bind` 来满足这个需求今天就来说一说这个函数 什么时候使用 `bind` 函数 先看这个例子：

    $(function() {
      var me;
      me = {
        name: "mee"
        init: function() {
          this.bind();
        }
        bind: function() {
          $(window).click(this.sayHello);
        }
        sayHello: function() {
          alert("Hello I am "
            this.name " !");
        }
      };
      me.init();
    });

单击窗口之后结果是 `Hello I am result !` 这并不是我们想要的我们希望的是 `Hello I am meee !` 为什么会这样因为` $(window).click(this.sayHello)` 改变了 `sayHello` 的上下文如果我们使用如下的方法给 `sayHello` 绑定上正确的上下文即可：

    $(function() {
      var me;
      me = {
        name: "mee"
        init: function() {
          this.bind();
        }
        bind: function() {
          $(window).click(this.sayHello.bind(this));
        }
        sayHello: function() {
          alert("HelloI am "
            this.name " !");
        }
      };
      me.init();
    }); 

`bind` 函数到底是什么 在 JavaScript 中函数是非常灵活的函数执行时都是在某个特定的上下文中并且在 JavaScript 中可直接通过 `apply` 或者 `call` 函数来修改函数的上下文在较老的不支持bind函数的浏览器中我们可以通过如下的方式实现 `bind`：

    if (!Function.prototype.bind) {
      Function.prototype.bind = function(context) {
        var toBind;
        toBind = this;
        return function() {
          return toBind.apply(context arguments);
        };
      };
    }

MDC 是如何实现 `bind` 函数的 实话是上面 `bind` 的实现和 MDC 的比起来弱爆了先看看 MDC 的实现：

    if (!Function.prototype.bind) {
      Function.prototype.bind = function(oThis) {
        if (typeof this !== 'function') {
          // closest thing possible to the ECMAScript 5
          // internal IsCallable function
          throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }
    
        var aArgs   = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP    = function() {},
            fBound  = function() {
              return fToBind.apply(this instanceof fNOP
                     ? this
                     : oThis,
                     aArgs.concat(Array.prototype.slice.call(arguments)));
            };
    
        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();
    
        return fBound;
      };
    }

 MDC 的实现做了如下的处理 `typeof this !== function` 首先确定上下文是否是一个函数 `aArgs = Array.prototype.slice.call(arguments 1)` 标准里的一部分 `fun.bind(thisArg[ arg1[ arg2[ ...]]])` 可传入一些固定的参数 `this instanceof fNOP ? this : oThis || window` 这一句非常细节处理的问题是当使用 `new` 关键字调用绑定的函数后还能以新的 `this` 调用构造函数而不被绑定到特定的上下文中 `fNOP.prototype = this.prototype; fBound.prototype = new fNOP();` 这两句也很细节保证生成的绑定的新函数继承了原来函数的所有原型属性且对新函数原型的修改不会影响到原来的函数 总之只能调用函数的 `bind` 方法 `Function.prototype.bind.call({})` 就会报错即处理 1 生成的新函数包含了原函数的所有功能甚至包括元函数的原型但是对新函数的修改不会影响原函数新函数与原函数唯一的区别就是前者绑定了上下文而这个绑定的上下文并不影响 `new` 新函数。
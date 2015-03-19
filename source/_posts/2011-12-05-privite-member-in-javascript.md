title: JavaScript 的私有属性和方法
----

在JavaScript中谈私有属性和私有方法就是扯淡，"private"还杵在保留字的位置上，不知道什么时候提上来实现真正的私有。那今天咱就来讨论下如何以JS当前的特性来实现私有成员。

## 闭包

（比较枯燥，可以跳过本单元）JavaScript实现私有属性必须依赖闭包特性(可以先通过该链接补习)。下面也稍微补习下，看下面的例子：

    var uniqueId;
    uniqueId = (function() {
      var index;
      index = 0;
      return function(prefix) {
        return prefix + "_" + index++;
      };
    })();
    //c_0
    console.log(uniqueId("c"));
    //c_1
    console.log(uniqueId("c"));

通常所说的或所看到的闭包就是这样子—— `(function(){})()`，但这不是它的全部或者是本质。在定义uniqueId这个函数的时候，我们使用了匿名函数表达式（请注意(function(){})是函数表达式）定义了一个函数且立即执行，把function(prefix){/*some code*/}作为返回值赋值给了quniqueId，此时这个 `function(prefix){/*some code*/}`已经生成了函数实例，在函数实例生成的过程中:

- 通俗的讲将index这个外部函数定义的变量记住了（为什么要记住？没记住你让我怎么给你计算prefix+"_"+index的值嘛！）；
- 再次我们没法通过什么this.index或者someObj.index引用到index，改变其值了，(function(){})()这个一执行完，局部变量index在外面怎么调得到嘛；
- 怎么调得到，只能靠function(prefix){/*some code*/}，因为我们还能通过它间接的取得或改变index值。这就是闭包了。

比较学术的解释：

- JS是词法作用域（就是程序看上去啥样就啥样）的，使用一个叫做[[scope]]的内部属性来标识每个执行上下文的作用域（我可以读写哪些变量啊，调用哪些哪些函数啊）；每个函数执行时都由该[scope]作用域加上活动对象来构成真实的执行上下文；
- 而这个执行上下文[[scope]]属性是在函数生成时就指定的了，不严格的讲为生成该函数时的执行上下文；
- 于是function(prefix){/*some code*/}生成时其内部的[[scope]]属性引用了(function(){})()执行上下文的scope链；该scope链即包含了该函数的[[scope]]和活动对象，且活动对象包含了index的定义引用；
- GC的回收规则，没人用我我就是垃圾！因此uniqueId引用了function(prefix){/*some code*/}函数实例，而该函数实例的[[scope]]引用了(function(){})()执行期的scope链，其包含活动对象，即有index的引用；ok，index还有人引用它，它不是垃圾，因此闭包形成了，我们可以通过uniqueId函数间接的读取或者修改index。

总结：其实学术解释和通俗解释一个意思，不过闭包其实是相对的，并不是我们不能修改index，只是需要间接的方法（是不是有点私有属性和私有方法的感觉）。

## 私有属性和私有方法

相对来说，构造单例对象的私有属性和方法都比较简单。

    var aira;
    aira = (function () {
        var __getName, __name;
        //private variable
        __name = "HTC mobile";
        //private method
        __getName = function () {
            return __name;
        };
        aira = {
            init: function () {
                //change private variable inner
                __name = "aira";
            },
            hello: function () {
                //execute private method inner
                console.log("hello,my name is " + (__getName()));
            }
        };
        return aira;
    })();
    aira.init();
    //hello,my name is aira
    aira.hello();

使用双下划线"__"表示私有；aira手机有一个私有属性__name和私有方法__getName；我们可以在init中修改__name，在hello中调用__getName，且在闭包外面无法直接调用和修改这两个成员。我们做到了，这就是单例对象的私有属性和私有方法。
但是更确切的说，其实aira能够有私有属性和方法仅仅是因为它有私有的一个闭包，即init和hello成员的[[scope]]都引用了闭包的活动对象。

然而，一个构造函数（类）的私有属性和方法就么这么简单了。

    var Phone, aira;
    //wrap by function
    Phone = function (name) {
        var phone;
        phone = (function () {
            var __getName, __name;
            __name = name;
            __getName = function () {
                return __name;
            };
            phone = {
                init: function (number) {
                    __name += "#" + number;
                },
                hello: function () {
                    console.log("hello,my name is " + (__getName()));
                }
            };
            return phone;
        })();
        return phone;
    };
    aira1 = Phone("aira");
    aira1.init(1);
    //hello,my name is aira#1
    aira1.hello();
    
    aira2 = Phone("aira");
    aira2.init(2);
    //hello,my name is aira#2
    aira2.hello();

我们先来简单的将单例对象的构造包裹一个函数，实现产生不同的对象。我们可以说Phone是一个类，因为它可以产生不同的对象，有类似的功能。同样aira1和aira2都有自己闭包，于是都有自己的私有属性和方法。

我想对自己说，别逗了你，这样就行啦？！JS中类的概念就是构造函数。

    var Phone, aira1, aira2;
    Phone = function (name) {
        var __getName, __name;
        __name = name;
        __getName = function () {
            return __name;
        };
        this.init = function (number) {
            __name += "#" + number;
        };
        this.hello = function () {
            console.log("hello,my name is " + (__getName()));
        };
    };
    aira1 = new Phone("aira");
    aira1.init(1);
    //hello,my name is aira#1
    aira1.hello();
    
    aira2 = new Phone("aira");
    aira2.init(1);
    //hello,my name is aira#2
    aira2.hello();

Phone构造函数其实就是闭包的功能，每个Phone实例的init和hello都能引用其构造期间的形成的私有的__name和__getName。

真的，我已经无力回天了，每个实例必须由闭包产生私有属性和方法，因此只能在该闭包中定义公共方法暴露出来（比如说init和hello），这就意味着每次构造一个实例我们都必须生成init和hello的函数实例，这是多么的低效，因为JS有原型。

    var Phone, aira;
    Phone = function (name) {
        var __getName, __name;
        __name = name;
        __getName = function () {
            return __name;
        };
    };
    Phone.prototype.init = function (number) {
        __name += "#" + number;
    };
    Phone.prototype.hello = function () {
        console.log("hello,my name is " + (__getName()));
    };
    aira = new Phone("aira");

上面的代码是错误的（在init中的\_\_name是全局的，hello中的\_\_getName方法因为不存在，所以会报错），这就是问题所在，能够引用私有属性和变量的公共方法必须在闭包中定义，然后暴露出来，然而原型方法并不能在闭包中定义。

## 曲线救国

### 私有约定

    var Phone, aira1, aira2;
    Phone = function (name) {
        //"__" private variable
        this.__name = name;
    };
    Phone.prototype.init = function (number) {
        this.__name += "#" + number;
    };
    Phone.prototype.hello = function () {
        console.log("hello,my name is " + (this.__getName()));
    };
    //"__" private method
    Phone.prototype.__getName = function () {
        return this.__name;
    };
    aira1 = new Phone("aira");
    aira1.init(1);
    //hello,my name is aira#1
    aira1.hello();
    aira2 = new Phone("aira");
    aira2.init(2);
    //hello,my name is aira#2
    aira2.hello();

以双下划线“__”表示私有，用最近看到的一代码注释来解释：“神奇，勿动”。
这是私有方法么？

    var Phone, aira1, aira2;
    Phone = (function () {
        var __getName, __name;
        __getName = function () {
            return __name;
        };
        Phone = function (name) {
            __name = name;
        };
        Phone.prototype.init = function (number) {
            __name += "#" + number;
        };
        Phone.prototype.hello = function () {
            console.log("hello,my name is " + (__getName()));
        };
        return Phone;
    })();
    aira1 = new Phone("aira");
    aira1.init(1);
    //hello,my name is aira#1 right!
    aira1.hello();
    aira2 = new Phone("aira");
    aira2.init(2);
    //hello,my name is aira#2 right!
    aira2.hello();
    //hello,my name is aira#2 wrong!
    aira1.hello();

试图用闭包包住构造函数，形成闭包，但是得到的结果是\_\_name和\_\_getName其实都是类的私有属性，而不是实例的。aira1和aira2共用了\_\_name和\_\_getName。
再来确定下什么是私有属性和私有方法，即每个类实例都拥有且只能在类内访问的变量和函数。也就是说变量和方法只能由类的方法来调用。说到这里，我们或许可以尝试下，不让类外的方法调用类的私有方法。

    var inner, outer;
    outer = function () {
        inner();
    };
    inner = function () {
        console.log(arguments.callee.caller);
    };
    /*
      function(){
          inner();
      }
      */
    outer();

从arguments的callee中可获得当前的执行函数inner，而inner的动态属性caller指向了调用inner的外层函数outer，由此看来我们可以使用arguments.callee.caller来确定函数的执行环境，实现私有方法和属性。

    var Phone, aira1, aira2;
    Function.prototype.__public = function (klass) {
        this.klass = klass;
        return this;
    };
    Function.prototype.__private = function () {
        var that;
        that = this;
        return function () {
            if (this.constructor === arguments.callee.caller.klass) {
                return that.apply(this, arguments);
            } else {
                throw new Error("" + that + " is a private method!");
            }
        };
    };
    Phone = function (name) {
        var __name;
        __name = name;
        this.__getName = (function () {
            return __name;
        }).__private();
        this.__setName = (function (name) {
            __name = name;
        }).__private();
    };
    Phone.prototype.init = (function (number) {
        this.__setName(this.__getName() + "#" + number);
    }).__public(Phone);
    Phone.prototype.hello = (function () {
        console.log("hello,my name is " + (this.__getName()));
    }).__public(Phone);
    aira1 = new Phone("aira");
    aira1.init(1);
    //hello,my name is aira#1
    aira1.hello();
    aira2 = new Phone("aira");
    aira2.init(1);
    //hello,my name is aira#2
    aira2.hello();
    //hello,my name is aira#1
    aira1.hello();

    try {
        aira1.__getName();
    } catch (e) {
    /*
    Error Object
        message:"function () {return __name;} is a private method!"
    */
        console.log(e);
    }


- 请原谅我给Function原型上添加了两个方法\_\_public和\_\_private以此来实现私有方法的调用环境检测；
- 其次，我无法给私有属性添加检测，所以私有属性直接不可见，使用私有的get，set方法访问；
- 本身在aira1外部调用时我们还是能看到\_\_getName和\_\_setName方法，只是不能调用而已；
- 唯一好的一点是原型方法（公共方法）终于可以从构造函数闭包中解放出来。

## 参考

- [Javascript Closures](http://jibbering.com/faq/notes/closures/#clIRExSc)
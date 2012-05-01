//EnhanceJS version 1.1 - Test-Driven Progressive Enhancement
//http://enhancejs.googlecode.com/
//Copyright (c) 2010 Filament Group, Inc, authors.txt
//Licensed under MIT (license.txt)

//闭包
//
//    (function(win,doc,undefined){})(window,document);

(function(win, doc, undefined) {

//####局部标量   
//- settings
//- body
//- fakeBody
//- windowLoaded
//- head
//- docElem
//- testPass
//- mediaCookieA
//- mediaCookieB
//- toggledMedia

var settings, body, fakeBody, windowLoaded, head, 
	docElem = doc.documentElement,
	testPass = false,
	mediaCookieA, mediaCookieB, 
	toggledMedia = [];
	
if(doc.getElementsByTagName){ head = doc.getElementsByTagName('head')[0] || docElem; }
else{ head = docElem; }

//`mediaquery`测试是否支持某个media
var mediaquery = (function(){
	var cache = {},
		testDiv = doc.createElement('div');
	
	testDiv.setAttribute('id','ejs-qtest');
	return function(q){
		//如果没有cache的测试
		if (cache[q] === undefined) {
			addFakeBody();
			var styleBlock = doc.createElement('style');
			styleBlock.type = "text/css";
			head.appendChild(styleBlock);
			//[dynamic-script-and-style-elements-in-ie](http://www.phpied.com/dynamic-script-and-style-elements-in-ie/)
			var cssrule = '@media '+q+' { #ejs-qtest { position: absolute; width: 10px; } }';
			if (styleBlock.styleSheet){ styleBlock.styleSheet.cssText = cssrule; }
			else { styleBlock.appendChild(doc.createTextNode(cssrule)); }     
			body.appendChild(testDiv);
			var divWidth = testDiv.offsetWidth;
			body.removeChild(testDiv);
			head.removeChild(styleBlock);
			removeFakeBody();
			cache[q] = (divWidth == 10);
		}
		return cache[q];
	}
})();

//`enhance`API
win.enhance = function(options) {
    options  = options || {};
    settings = {};
    //合并自定义配置和默认配置
    for (var name in enhance.defaultSettings) {
        var option = options[name];
        settings[name] = option !== undefined ? option : enhance.defaultSettings[name];
    }
    //合并自定义测试
    for (var test in options.addTests) {
        settings.tests[test] = options.addTests[test];
    }
    //add testName class immediately for FOUC prevention, remove later on fail
    if (docElem.className.indexOf(settings.testName) === -1) {
        docElem.className += ' ' + settings.testName;
    }
    //cookie names for toggled media types
    mediaCookieA = settings.testName + '-toggledmediaA';
	mediaCookieB = settings.testName + '-toggledmediaB';
	toggledMedia = [readCookie(mediaCookieA), readCookie(mediaCookieB)];
    //fallback for removing testName class
    setTimeout(function(){ if(!testPass){ removeHTMLClass(); } }, 3000);

    runTests();
    
    applyDocReadyHack();
    
    windowLoad(function() { windowLoaded = true; });
};

//`query`API
enhance.query = mediaquery;

//####默认测试
//- getById
//- getByTagName
//- createEl
//- boxmodel
//- position
//- floatClear
//- heightOverflow
//- ajax
//- resize
//- print

enhance.defaultTests = {
    getById: function() {
        return !!doc.getElementById;
    },
    getByTagName: function() {
        return !!doc.getElementsByTagName;
    },
    createEl: function() {
        return !!doc.createElement;
    },
    boxmodel: function() {
        var newDiv = doc.createElement('div');
        newDiv.style.cssText = 'width: 1px; padding: 1px;';
        body.appendChild(newDiv);
        var divWidth = newDiv.offsetWidth;
        body.removeChild(newDiv);
        return divWidth === 3;
    },
    position: function() {
        var newDiv = doc.createElement('div');
        newDiv.style.cssText = 'position: absolute; left: 10px;';
        body.appendChild(newDiv);
        var divLeft = newDiv.offsetLeft;
        body.removeChild(newDiv);
        return divLeft === 10;
    },
    floatClear: function() {
        var pass = false,
            newDiv = doc.createElement('div'),
            style = 'style="width: 5px; height: 5px; float: left;"';
        newDiv.innerHTML = '<div ' + style + '></div><div ' + style + '></div>';
        body.appendChild(newDiv);
        var childNodes = newDiv.childNodes,
            topA = childNodes[0].offsetTop,
            divB = childNodes[1],
            topB = divB.offsetTop;
        if (topA === topB) {
            divB.style.clear = 'left';
            topB = divB.offsetTop;
            if (topA !== topB) {
                pass = true;
            }
        }
        body.removeChild(newDiv);
        return pass;
    },
    heightOverflow: function() {
        var newDiv = doc.createElement('div');
        newDiv.innerHTML = '<div style="height: 10px;"></div>';
        newDiv.style.cssText = 'overflow: hidden; height: 0;';
        body.appendChild(newDiv);
        var divHeight = newDiv.offsetHeight;
        body.removeChild(newDiv);
        return divHeight === 0;
    },
    ajax: function() {
        //factory test borrowed from quirksmode.org
        var xmlhttp = false, index = -1, factory,
            XMLHttpFactories = [
                function() { return new XMLHttpRequest() },
                function() { return new ActiveXObject("Msxml2.XMLHTTP") },
                function() { return new ActiveXObject("Msxml3.XMLHTTP") },
                function() { return new ActiveXObject("Microsoft.XMLHTTP") }
            ];
        while ((factory = XMLHttpFactories[++index])) {
            try { xmlhttp = factory(); }
            catch (e) { continue; }
            break;
        }
        return !!xmlhttp;
    },
    resize: function() {
        return win.onresize != false;
    },
    print: function() {
        return !!win.print;
    }
};

//默认设置
enhance.defaultSettings = {
    testName: 'enhanced',
    loadScripts: [],
    loadStyles: [],
    queueLoading: true,
    appendToggleLink: true,
    forcePassText: 'View high-bandwidth version',
    forceFailText: 'View low-bandwidth version',
    tests: enhance.defaultTests,
    media: {
    	'-ejs-desktop': enhance.query('screen and (max-device-width: 1024px)') ? 'not screen and (max-device-width: 1024px)' : 'screen',
    	'-ejs-handheld': 'screen and (max-device-width: 1024px)'
    },
    addTests: {},
    alertOnFailure: false,
    onPass: function(){},
    onFail: function(){},
    onLoadError: addIncompleteClass,
    onScriptsLoaded: function(){}
};

//支持cookie
function cookiesSupported(){
	return !!doc.cookie;
}
enhance.cookiesSupported = cookiesSupported();

//强制测试失败
function forceFail() {
    createCookie(settings.testName, 'fail');
    win.location.reload();
}
if(enhance.cookiesSupported){ enhance.forceFail = forceFail; }

//强制测试通过
function forcePass() {
    createCookie(settings.testName, 'pass');
    win.location.reload();
}
if(enhance.cookiesSupported){ enhance.forcePass = forcePass; }

//重新测试
function reTest() {
    eraseCookie(settings.testName);
    win.location.reload();
}
if(enhance.cookiesSupported){ enhance.reTest = reTest; }

//创建一个假的body
function addFakeBody(){
	fakeBody = doc.createElement('body'); 
	docElem.insertBefore(fakeBody, docElem.firstChild);
	body = fakeBody;
}

//移除假的body
function removeFakeBody(){
	docElem.removeChild(fakeBody);
	body = doc.body;
}


//`runTests`运行测试
function runTests() {
    var result = readCookie(settings.testName);
    //check for cookies from a previous test
    if (result) {
        if (result === 'pass') {
            enhancePage();
            settings.onPass();
        } else {
            settings.onFail();
            removeHTMLClass();
        }
        
        // append toggle link
        if (settings.appendToggleLink) {
            windowLoad(function() { 
                appendToggleLinks(result);
            });
        }
    }
    //no cookies - run tests
    else {
        var pass = true;
        addFakeBody();
        for (var name in settings.tests) {
            pass = settings.tests[name]();
            if (!pass) {
                if (settings.alertOnFailure) {
                    alert(name + ' failed');
                }
                break;
            }
        }
        removeFakeBody();
        result = pass ? 'pass' : 'fail';
        createCookie(settings.testName, result);
        if (pass) {
            enhancePage();
            settings.onPass();
        }
        else {
            settings.onFail();
            removeHTMLClass();
        }
                    
        if (settings.appendToggleLink) {
            windowLoad(function() { 
                appendToggleLinks(result);
            });
        }
    }
}

//添加`onload`事件队列
function windowLoad(callback) {
    if (windowLoaded) {
        callback();
    } else {
        var oldonload = win.onload
        win.onload = function() {
            if (oldonload) { oldonload(); }
            callback();
        }
    }
}

//添加切换链接
function appendToggleLinks(result) {
    if (!settings.appendToggleLink || !enhance.cookiesSupported) { return; }
    if (result) {
        var a = doc.createElement('a');
        a.href = "#";
        a.className = settings.testName + '_toggleResult';
        a.innerHTML = result === 'pass' ? settings.forceFailText : settings.forcePassText;
        a.onclick   = result === 'pass' ? enhance.forceFail : enhance.forcePass;
        doc.getElementsByTagName('body')[0].appendChild(a);
    }
}

//删除HTML的样式类
function removeHTMLClass(){
	docElem.className = docElem.className.replace(settings.testName,'');
}

//增强
function enhancePage() {
	testPass = true;
    if (settings.loadStyles.length) {
    	appendStyles();
    }
    if (settings.loadScripts.length) {
    	appendScripts();        
    }
    else{
    	settings.onScriptsLoaded();
    }
}

//media toggling methods and storage
function toggleMedia(mediaA,mediaB){
	if(readCookie(mediaCookieA) && readCookie(mediaCookieB)){
		eraseCookie(mediaCookieA);
		eraseCookie(mediaCookieB);
	}
	else{
		createCookie(mediaCookieA, mediaA);
		createCookie(mediaCookieB, mediaB);
	}
	win.location.reload();
}
enhance.toggleMedia = toggleMedia;

//return a toggled media type/query
function mediaSwitch(q){
	if(toggledMedia.length == 2){
		if(q == toggledMedia[0]){ q = toggledMedia[1]; }
		else if(q == toggledMedia[1]){ q = toggledMedia[0]; }
	}
	return q;
}

function addIncompleteClass (){
	var errorClass = settings.testName + '-incomplete';
	if (docElem.className.indexOf(errorClass) === -1) {
        docElem.className += ' ' + errorClass;
    }
}

function checkifsupported(ifsupported){
	if(ifsupported.constructor === Array){ 
		var allGood = true;
        for(var item in ifsupported){
        	if(allGood){ allGood = !!ifsupported[item]; }
        }   
        return allGood;
	}	
	else {	
		return !!ifsupported;
    }
}

function appendStyles() {
    var index = -1,
        item;
    while ((item = settings.loadStyles[++index])) {
        var link  = doc.createElement('link');
        link.type = 'text/css';
        link.rel  = 'stylesheet';
        link.onerror = settings.onLoadError;
        
        if (typeof item === 'string') {
            link.href = item;
            head.appendChild(link);
        }
        else {
        	if(item['media']){
        		item['media'] = mediaSwitch(item['media']); 
        		if(settings['media']){
        			if(settings['media'][item['media']] !== undefined){
        				item['media'] = settings['media'][item['media']];
        			}
        		} 
        	}
        	if(item['excludemedia']){ item['excludemedia'] = mediaSwitch(item['excludemedia']); }
        	
            var applies = true;
            if(item['media'] && item['media'] !== 'print' && item['media'] !== 'projection' && item['media'] !== 'speech' && item['media'] !== 'aural' && item['media'] !== 'braille'){
	        	applies = mediaquery(item['media']);
	        }
            if(applies && item['excludemedia']){
            	applies = !mediaquery(item['excludemedia']);
	        }
	        if (applies && item['iecondition']) {
                applies = isIE(item['iecondition']);
            }
            if(applies && item['ifsupported'] !== undefined){
            	applies = checkifsupported(item['ifsupported']);
            	if(!applies && item['fallback'] !== undefined){
					item['href'] = item['fallback'];
					applies = true;
				}
            }
	        if(applies){ 	        	
	        	for (var attr in item) {
	                if (attr !== 'iecondition' && attr !== 'excludemedia' && attr !== 'ifsupported' && attr !== 'fallback') {
	                    link.setAttribute(attr, item[attr]);
	                }    
	            }
	            head.appendChild(link); 
	        }
        }
    }
}

var isIE = (function() {
	var cache = {},
		b;
    return function(condition) {	
    	if(/*@cc_on!@*/true){return false;}
		var cc = 'IE';
		if(condition){ 
			if(condition !== 'all'){ //deprecated support for 'all' keyword
				if( !isNaN(parseFloat(condition)) ){ 
					cc += ' ' + condition; //deprecated support for straight version #
				}
				else {
					cc = condition; //recommended (conditional comment syntax)
				}
			}
		}
		if (cache[cc] === undefined) {
			b = b || doc.createElement('B');
			b.innerHTML = '<!--[if '+ cc +']><b></b><![endif]-->';
			cache[cc] = !!b.getElementsByTagName('b').length;
		}
		return cache[cc];
	}	
})();

function appendScripts(){
	settings.queueLoading ? appendScriptsSync() : appendScriptsAsync();
}

function appendScriptsSync() {
    var queue = [].concat(settings.loadScripts);
    function next() {
        if (queue.length === 0) {
            return false;
        }
        var item    = queue.shift(),
            script = createScriptTag(item),
            done   = false;
        if(script){
	        script.onload = script.onreadystatechange = function() {
	            if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
	                done = true;
	                if(next() === false){
	                	settings.onScriptsLoaded();
	                }
	                this.onload = this.onreadystatechange = null;
	            }
	        }
	        head.insertBefore(script, head.firstChild);
        }
        else{
        	return next();
        }
    }
    next();
}

function appendScriptsAsync() {
    var index = -1,
        item;
    while ((item = settings.loadScripts[++index])) {
    	var script = createScriptTag(item);
        if(script){
        	head.insertBefore(script, head.firstChild);
        }	
    }
    settings.onScriptsLoaded();
}

function createScriptTag(item) {
    var script  = doc.createElement('script');
    script.type = 'text/javascript';
    script.onerror = settings.onLoadError;
    if (typeof item === 'string') {
        script.src  = item;
        return script;
    }
    else {
    	if(item['media']){ 
    		item['media'] = mediaSwitch(item['media']); 
    		if(settings['media']){
    			if(settings['media'][item['media']]){
    				item['media'] = settings['media'][item['media']];
    			}
    		}  
    	}
        if(item['excludemedia']){ item['excludemedia'] = mediaSwitch(item['excludemedia']); }
        	
        var applies = true;
        if(item['media']){
        	applies = mediaquery(item['media']);
        }
        if(applies && item['excludemedia']){
        	applies = !mediaquery(item['excludemedia']);
        }
        if (applies && item['iecondition']) {
                applies = isIE(item['iecondition']);
        }
        if(applies && item['ifsupported'] !== undefined){
        	applies = checkifsupported(item['ifsupported']);
        	if(!applies && item['fallback'] !== undefined){
				item['src'] = item['fallback'];
				applies = true;
			}
        }
        
        if(applies){
        	for (var attr in item) {
            if (attr !== 'iecondition' && attr !== 'media' && attr !== 'excludemedia' && attr !== 'ifsupported' && attr !== 'fallback') {
	            	script.setAttribute(attr, item[attr]);
	            }    
	        }
	        return script;
        }
        else{
        	return false;
        }
    }
}

/* cookie functions from quirksmode.org (modified) */
function createCookie(name, value, days) {
    days = days || 90;
    var date = new Date();
    date.setTime(date.getTime()+(days*24*60*60*1000));
    var expires = "; expires="+date.toGMTString();
    doc.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = doc.cookie.split(';');
    for (var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
			}
    return null;
}
	
function eraseCookie(name) {
    createCookie(name,"",-1);
}

function applyDocReadyHack() {
    // via http://webreflection.blogspot.com/2009/11/195-chars-to-help-lazy-loading.html
    // verify that document.readyState is undefined
    // verify that document.addEventListener is there
    // these two conditions are basically telling us
    // we are using Firefox < 3.6
    if (doc.readyState == null && doc.addEventListener){
        // on DOMContentLoaded event, supported since ages
        doc.addEventListener("DOMContentLoaded", function DOMContentLoaded(){
            // remove the listener itself
            doc.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
            // assign readyState as complete
            doc.readyState = "complete";
        }, false);
        // set readyState = loading or interactive
        // it does not really matter for this purpose
        doc.readyState = "loading";
	}
}		
})(window, document);

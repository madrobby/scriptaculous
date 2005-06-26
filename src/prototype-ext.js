// Copyright (c) 2005 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
// 
// Element.Class part Copyright (c) 2005 by Rick Olson
// 
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
// 
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var Event = {
  KEY_BACKSPACE: 8,
  KEY_TAB:       9,
  KEY_RETURN:   13,
  KEY_ESC:      27,
  KEY_LEFT:     37,
  KEY_UP:       38,
  KEY_RIGHT:    39,
  KEY_DOWN:     40,
  KEY_DELETE:   46,

  element: function(event) {
    return event.srcElement || event.currentTarget;
  },
  
  isLeftClick: function(event) {
    return (((event.which) && (event.which == 1)) ||
            ((event.button) && (event.button == 1)));
  },
  
  pointerX: function(event) {
    return event.pageX || (event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft));
  },
  
  pointerY: function(event) {
    return event.pageY || (event.clientY + (document.documentElement.scrollTop || document.body.scrollTop));
  },

  stop: function(event) {
    if(event.preventDefault)
      { event.preventDefault(); event.stopPropagation(); }
    else
      event.returnValue = false;
  },

  // find the first node with the given tagName, starting from the
  // node the event was triggered on, traverses the DOM upwards
  findElement: function(event, tagName) {
    element = Event.element(event);
      while(element.tagName.toUpperCase() != tagName.toUpperCase() && element.parentNode)
        element = element.parentNode;
    return element;
  },
  
  observe: function(element, name, observer) {
    if(name=='keypress') {
      if(navigator.appVersion.indexOf('AppleWebKit')>0)
        { $(element).addEventListener("keydown",observer,false); return; }
      if($(element).addEventListener) $(element).addEventListener("keypress",observer,false)
        else if($(element).attachEvent) $(element).attachEvent("onkeydown",observer);
    } else {
      if($(element).addEventListener) $(element).addEventListener(name,observer,false)
        else if($(element).attachEvent) $(element).attachEvent("on" + name,observer);
    }
  }
}

/*--------------------------------------------------------------------------*/

// removes whitespace-only text node children
// needed to make Gecko-based browsers happy
Element.cleanWhitespace = function(element) {
  var element = $(element);
  for(var i=0;i<element.childNodes.length;i++) {
    var node = element.childNodes[i];
    if(node.nodeType==3 && !/\S/.test(node.nodeValue)) 
      Element.remove(node);
  }
}

Element.collectTextNodesIgnoreClass = function(element, ignoreclass) {
  var children = $(element).childNodes;
  var text     = "";
  var classtest = new RegExp("^([^ ]+ )*" + ignoreclass+ "( [^ ]+)*$","i");
  
  for (var i = 0; i < children.length; i++) {
    if(children[i].nodeType==3) {
      text+=children[i].nodeValue;
    } else {
      if((!children[i].className.match(classtest)) && children[i].hasChildNodes())
        text += Element.collectTextNodesIgnoreClass(children[i], ignoreclass);
    }
  }
  
  return text;
}

/*--------------------------------------------------------------------------*/

Text = {
  stripTags: function(htmlstr) {
    return htmlstr.replace(/<\/?[^>]+>/gi,"");
  },
  decodeHTML: function(htmlstr) {
    return htmlstr.replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&quot;/gi,'"').replace(/&apos;/gi,"'").replace(/&amp;/gi,"&").replace(/[\n\r]/gi,"");
  }
}

/*--------------------------------------------------------------------------*/

Element.Class = {
    // Element.toggleClass(element, className) toggles the class being on/off
    // Element.toggleClass(element, className1, className2) toggles between both classes,
    //   defaulting to className1 if neither exist
    toggle: function(element, className) {
      if(Element.Class.has(element, className)) {
        Element.Class.remove(element, className);
        if(arguments.length == 3) Element.Class.add(element, arguments[2]);
      } else {
        Element.Class.add(element, className);
        if(arguments.length == 3) Element.Class.remove(element, arguments[2]);
      }
    },

    // gets space-delimited classnames of an element as an array
    get: function(element) {
      element = $(element);
      return element.className.split(' ');
    },

    // functions adapted from original functions by Gavin Kistner
    remove: function(element) {
      element = $(element);
      var regEx;
      for(var i = 1; i < arguments.length; i++) {
        regEx = new RegExp("^" + arguments[i] + "\\b\\s*|\\s*\\b" + arguments[i] + "\\b", 'g');
        element.className = element.className.replace(regEx, '')
      }
    },

    add: function(element) {
      element = $(element);
      for(var i = 1; i < arguments.length; i++) {
        Element.Class.remove(element, arguments[i]);
        element.className += (element.className.length > 0 ? ' ' : '') + arguments[i];
      }
    },

    // returns true if all given classes exist in said element
    has: function(element) {
      element = $(element);
      if(!element || !element.className) return false;
      var regEx;
      for(var i = 1; i < arguments.length; i++) {
        regEx = new RegExp("\\b" + arguments[i] + "\\b");
        if(!regEx.test(element.className)) return false;
      }
      return true;
    },
    
    // expects arrays of strings and/or strings as optional paramters
    // Element.Class.has_any(element, ['classA','classB','classC'], 'classD')
    has_any: function(element) {
      element = $(element);
      if(!element || !element.className) return false;
      var regEx;
      for(var i = 1; i < arguments.length; i++) {
        if((typeof arguments[i] == 'object') && 
          (arguments[i].constructor == Array)) {
          for(var j = 0; j < arguments[i].length; j++) {
            regEx = new RegExp("\\b" + arguments[i][j] + "\\b");
            if(regEx.test(element.className)) return true;
          }
        } else {
          regEx = new RegExp("\\b" + arguments[i] + "\\b");
          if(regEx.test(element.className)) return true;
        }
      }
      return false;
    },
    
    childrenWith: function(element, className) {
      var children = $(element).getElementsByTagName('*');
      var elements = new Array();
      
      for (var i = 0; i < children.length; i++) {
        if (Element.Class.has(children[i], className)) {
          elements.push(children[i]);
          break;
        }
      }
      
      return elements;
    }
}

/*--------------------------------------------------------------------------*/

var Position = {
  // must be called before calling within_including_scrolloffset, every time the page is scrolled
  prepare: function() {
    this.deltaX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    this.deltaY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.include_scroll_offsets = true;
  },
  
  real_offset: function(element) {
    var valueT = 0; var valueL = 0;
    do {
      valueT += element.scrollTop || 0;
      valueL += element.scrollLeft || 0; 
      element = element.parentNode;
    } while(element);
    return [valueL, valueT];
  },
  
  // caches x/y coordinate pair to use with overlap
  within: function(element, x, y) {
    if(this.include_scroll_offsets)
      return within_including_scrolloffsets(element, x, y);
    this.xcomp = x;
    this.ycomp = y;
    var offsettop = element.offsetTop;
    var offsetleft = element.offsetLeft;
    return (y>=offsettop &&
            y<offsettop+element.offsetHeight &&
            x>=offsetleft && 
            x<offsetleft+element.offsetWidth);
  },
  
  within_including_scrolloffsets: function(element, x, y) {
    var offsetcache = this.real_offset(element);
    this.xcomp = x + offsetcache[0] - this.deltaX;
    this.ycomp = y + offsetcache[1] - this.deltaY;
    this.xcomp = x;
    this.ycomp = y;
    var offsettop = element.offsetTop;
    var offsetleft = element.offsetLeft;
    return (y>=offsettop &&
            y<offsettop+element.offsetHeight &&
            x>=offsetleft && 
            x<offsetleft+element.offsetWidth);
  },
  
  // within must be called directly before
  overlap: function(mode, element) {  
    if(!mode) return 0;  
    if(mode == 'vertical') 
      return ((element.offsetTop+element.offsetHeight)-this.ycomp) / element.offsetHeight;
    if(mode == 'horizontal')
      return ((element.offsetLeft+element.offsetWidth)-this.xcomp) / element.offsetWidth;
  },
  
  clone: function(source, target) {
    $(target).style.top      = $(source).style.top;
    $(target).style.left     = $(source).style.left;
    $(target).style.width    = $(source).offsetWidth + "px";
    $(target).style.height   = $(source).offsetHeight + "px";
  }
}
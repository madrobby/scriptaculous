// small but works-for-me stuff for testing javascripts
// not ready for "production" use

Object.inspect = function(obj) {
  var info = [];
  
  if(typeof obj=="string" || 
     typeof obj=="number") {
    return obj;
  } else {
    for(property in obj)
      if(typeof obj[property]!="function")
        info.push(property + ' => "' + obj[property] + '"');
  }
  
  return ("'" + obj + "' #" + typeof obj + 
    ": {" + info.join(", ") + "}");
}

// borrowed from http://www.schuerig.de/michael/javascript/stdext.js
// Copyright (c) 2005, Michael Schuerig, michael@schuerig.de

Array.flatten = function(array, excludeUndefined) {
  if (excludeUndefined === undefined) {
    excludeUndefined = false;
  }
  var result = [];
  var len = array.length;
  for (var i = 0; i < len; i++) {
    var el = array[i];
    if (el instanceof Array) {
      var flat = el.flatten(excludeUndefined);
      result = result.concat(flat);
    } else if (!excludeUndefined || el != undefined) {
      result.push(el);
    }
  }
  return result;
};

if (!Array.prototype.flatten) {
  Array.prototype.flatten = function(excludeUndefined) {
    return Array.flatten(this, excludeUndefined);
  }
}

/*--------------------------------------------------------------------------*/

var Builder = {
  node: function(elementName) {
    var element = document.createElement(elementName);

    // attributes (or text)

    if(arguments[1]) {
      if(this._isStringOrNumber(arguments[1]) ||
         (arguments[1] instanceof Array))
        this._children(element, arguments[1]);
      else
        this._attributes(element, arguments[1]);
    }

    // text, or array of children
    if(arguments[2])
      this._children(element, arguments[2]);

     return element;
  },
  _text: function(text) {
     return document.createTextNode(text);
  },
  _attributes: function(element, attributes) {
    for(attribute in attributes)
      if(this._isStringOrNumber(attributes[attribute]))
        element.setAttribute(
          attribute=='className' ? 'class' : attribute,
          attributes[attribute]);
  },
  _children: function(element, children) {
    if(typeof children=='object') { // array can hold nodes and text
      children = children.flatten();
      for(var i = 0; i<children.length; i++)
        if(typeof children[i]=='object')
          element.appendChild(children[i]);
        else
          if(this._isStringOrNumber(children[i]))
            element.appendChild(this._text(children[i]));
    } else
      if(this._isStringOrNumber(children)) 
         element.appendChild(this._text(children));
  },
  _isStringOrNumber: function(param) {
    return(typeof param=='string' || typeof param=='number');
  }
}

/* ------------- element ext -------------- */

// adapted from http://dhtmlkitchen.com/learn/js/setstyle/index4.jsp
// note: Safari return null on elements with display:none; see http://bugzilla.opendarwin.org/show_bug.cgi?id=4125
// instead of "auto" values returns null so it's easier to use with || constructs

String.prototype.camelize = function() {
  var oStringList = this.split('-');
  if(oStringList.length == 1)    
    return oStringList[0];
  var ret = this.indexOf("-") == 0 ? 
    oStringList[0].charAt(0).toUpperCase() + oStringList[0].substring(1) : oStringList[0];
  for(var i = 1, len = oStringList.length; i < len; i++){
    var s = oStringList[i];
    ret += s.charAt(0).toUpperCase() + s.substring(1)
  }
  return ret;
}

Element.getStyle = function(element, style) {
  element = $(element);
  var value = element.style[style.camelize()];
  if(!value)
    if(document.defaultView && document.defaultView.getComputedStyle) {
      var css = document.defaultView.getComputedStyle(element, null);
      value = (css!=null) ? css.getPropertyValue(style) : null;
    } else if(element.currentStyle) {
      value = element.currentStyle[style.camelize()];  
    }
  if(value=='auto') value = null;
  return value;
}

Element.makePositioned = function(element) {
  element = $(element);
  if(Element.getStyle(element, 'position')=='static')
    element.style.position = "relative";
}

Element.makeClipping = function(element) {
  element = $(element);
  element._overflow = Element.getStyle(element, 'overflow') || 'visible';
  if(element._overflow!='hidden') element.style.overflow = 'hidden';
}

Element.undoClipping = function(element) {
  element = $(element);
  if(element._overflow!='hidden') element.style.overflow = element._overflow;
}

/*--------------------------------------------------------------------------*/

Position.absolutize = function(element) {
  element = $(element);
  if(element.style.position=='absolute') return;
  Position.prepare();

  var offsets = Position.cumulativeOffset(element);
  var top     = offsets[1];
  var left    = offsets[0];
  var width   = element.clientWidth;
  var height  = element.clientHeight;

  element._originalLeft   = left - parseFloat(element.style.left  || 0);
  element._originalTop    = top  - parseFloat(element.style.top || 0);
  element._originalWidth  = element.style.width;
  element._originalHeight = element.style.height;

  element.style.position = 'absolute';
  element.style.top    = top + 'px';;
  element.style.left   = left + 'px';;
  element.style.width  = width + 'px';;
  element.style.height = height + 'px';;
}

Position.relativize = function(element) {
  element = $(element);
  if(element.style.position=='relative') return;
  Position.prepare();

  element.style.position = 'relative';
  var top  = parseFloat(element.style.top  || 0) - (element._originalTop || 0);
  var left = parseFloat(element.style.left || 0) - (element._originalLeft || 0);

  element.style.top    = top + 'px';
  element.style.left   = left + 'px';
  element.style.height = element._originalHeight;
  element.style.width  = element._originalWidth;
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

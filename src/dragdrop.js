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

/*--------------------------------------------------------------------------*/

Event = {
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
    return (((event.which) && (event.which != 3)) ||
            ((event.button) && (event.button != 2)));
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

  getParentNodeOrSelfByName: function(event, nodeName) {
    element = Event.element(event);
      while(element.nodeName != nodeName && element.parentNode)
        element = element.parentNode;
    return element;
  },

  observeKeypress: function(element, observer) {             /* special handling needed */
    if(navigator.appVersion.indexOf('AppleWebKit')>0)
      { $(element).addEventListener("keydown",observer,false); return; }
    if($(element).addEventListener) $(element).addEventListener("keypress",observer,false)
      else if($(element).attachEvent) $(element).attachEvent("onkeydown",observer);
  },

  add: function(element, name, observer) {
    if($(element).addEventListener) $(element).addEventListener(name,observer,false)
      else if($(element).attachEvent) $(element).attachEvent("on" + name,observer);
  },

  observeBlur: function(element, observer) {
    Event.add(element, "blur", observer);
  },

  observeClick: function(element, observer) {
    Event.add(element, "click", observer);
  },

  observeHover: function(element, observer) {
    Event.add(element, "mouseover", observer);
  },

  observeMousedown: function(element, observer) {
    Event.add(element, "mousedown", observer);
  },

  observeMouseup: function(element, observer) {
    Event.add(element, "mouseup", observer);
  },

  observeMousemove: function(element, observer) {
    Event.add(element, "mousemove", observer);
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

Position = {
  // must be called before calling within_including_scrolloffset, everytime the page is scrolled
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
  }  
}

Droppables = {
  drops: new Array(),
  include_scroll_offsets: false,
  
  add: function(element) {
    var element = $(element);
    var options = {
      greedy:     true,
      hoverclass: null  
    }.extend(arguments[1] || {});
    
    // cache containers
    if(options.containment) {
      options._containers = new Array();
      var containment = options.containment;
      if((typeof containment == 'object') && 
        (containment.constructor == Array)) {
        for(var i=0; i<containment.length; i++)
          options._containers.push($(containment[i]));
      } else {
        options._containers.push($(containment));
      }
       options._containers_length = 
        options._containers.length-1;
    }
    
    if(element.style.position=='') //fix IE
      element.style.position = 'relative'; 
    
    // activate the droppable
    element.droppable = options;
    
    this.drops.push(element);
  },
  
  is_contained: function(element, drop) {
    var containers = drop.droppable._containers;
    var parentNode = element.parentNode;
    var i = drop.droppable._containers_length;
    do { if(parentNode==containers[i]) return true; } while (i--);
    return false;
  },
  
  is_affected: function(pX, pY, element, drop) {
    return (
      (drop!=element) &&
      ((!drop.droppable._containers) ||
        this.is_contained(element, drop)) &&
      ((!drop.droppable.accept) ||
        (Element.Class.has_any(element, drop.droppable.accept))) &&
      Position.within(drop, pX, pY) );
  },
  
  deactivate: function(drop) {
    Element.Class.remove(drop, drop.droppable.hoverclass);
    this.last_active = null;
  },
  
  activate: function(drop) {
    if(this.last_active) this.deactivate(this.last_active);
    if(drop.droppable.hoverclass) {
      Element.Class.add(drop, drop.droppable.hoverclass);
      this.last_active = drop;
    }
  },
  
  show: function(event, element) {
    var pX = Event.pointerX(event);
    var pY = Event.pointerY(event);
    if(this.include_scroll_offsets) Position.prepare();
    
    var i = this.drops.length-1; do {
      var drop = this.drops[i];
      if(this.is_affected(pX, pY, element, drop)) {
        if(drop.droppable.onHover)
           drop.droppable.onHover(
            element, drop, Position.overlap(drop.droppable.overlap, drop));
        if(drop.droppable.greedy) { 
          this.activate(drop);
          return;
        }
      }
    } while (i--);
  },
  
  fire: function(event, element) {
    var pX = Event.pointerX(event);
    var pY = Event.pointerY(event);
    if(this.include_scroll_offsets) Position.prepare();
    
    var i = this.drops.length-1; do {
      var drop = this.drops[i];
      if(this.is_affected(pX, pY, element, drop))
        if(drop.droppable.onDrop)
           drop.droppable.onDrop(element);
    } while (i--);
  },
  
  reset: function() {
    if(this.last_active)
      this.deactivate(this.last_active);
  }
}

Draggables = {
  observers: new Array(),
  addObserver: function(observer) {
    this.observers.push(observer);    
  },
  notify: function(eventName) {  // 'onStart', 'onEnd'
    for(var i = 0; i < this.observers.length; i++)
      this.observers[i][eventName]();
  }
}

Draggable = Class.create();
Draggable.prototype = {
  initialize: function(element) {
    this.element      = $(element);
    this.element.drag = this;
    this.options      = arguments[1] || {};
    this.handle       = this.options.handle ? $(this.options.handle) : this.element;
    this.active       = false;
    this.dragging     = false;
    this.offsetX      = 0;
    this.offsetY      = 0;
    this.originalLeft = parseInt(this.element.style.left || "0");
    this.originalTop  = parseInt(this.element.style.top || "0");
    this.originalX    = this.element.offsetLeft;
    this.originalY    = this.element.offsetTop;
    this.originalZ    = parseInt(this.element.style.zIndex || "0");
    Event.observeMousedown (this.handle, this.startDrag.bindAsEventListener(this));
    Event.observeMouseup   (document, this.endDrag.bindAsEventListener(this));
    Event.observeMousemove (document, this.update.bindAsEventListener(this));
  },
  startDrag: function(event) {
    if(Event.isLeftClick(event)) {
      this.active = true;
      if(this.element.style.position=="") this.element.style.position = "relative";
      this.originalX = this.element.offsetLeft - parseInt(this.element.style.left || '0') - this.originalLeft;
      this.originalY = this.element.offsetTop  - parseInt(this.element.style.top || '0')  - this.originalTop;
      this.offsetX =  event.clientX - this.originalX - this.originalLeft;
      this.offsetY =  event.clientY - this.originalY - this.originalTop;
      Event.stop(event);
    }
  },
  endDrag: function(event) {
    if(this.active && this.dragging) {
      this.active = false;
      this.dragging = false;
      Droppables.fire(event, this.element);
      Draggables.notify('onEnd');
      if(this.options.revert) {
        var cleft = parseInt(this.element.style.left || 0);
        var ctop = parseInt(this.element.style.top || 0);
        new Effect2.MoveBy(this.element, this.originalTop-ctop, this.originalLeft-cleft, {duration:0.4});
      } else {
        this.originalLeft = parseInt(this.element.style.left || "0");
        this.originalTop  = parseInt(this.element.style.top || "0");
      }
      this.element.style.zIndex = this.originalZ;
      new Effect2.Opacity(this.element, {duration:0.2, from:0.7, to:1.0});
      Droppables.reset();
      Event.stop(event);
    }
    this.active = false;
    this.dragging = false;
  },
  draw: function(event) {
    this.originalX = this.element.offsetLeft - parseInt(this.element.style.left || '0') - this.originalLeft;
    this.originalY = this.element.offsetTop  - parseInt(this.element.style.top || '0')  - this.originalTop;
    if((!this.options.constraint) || (this.options.constraint=='horizontal'))
       this.element.style.left = ((event.clientX - this.originalX) - this.offsetX) + "px";
    if((!this.options.constraint) || (this.options.constraint=='vertical'))
      this.element.style.top  = ((event.clientY - this.originalY) - this.offsetY) + "px";
  },
  update: function(event) {
   if(this.active) {
      if(!this.dragging) {
        this.dragging = true;
        Draggables.notify('onStart');
        this.element.style.zIndex = "1000";
        if(!this.element.style.position) this.element.style.position = 'relative';
        new Effect2.Opacity(this.element, {duration:0.2, from:1.0, to:0.7});
      }
      Droppables.show(event, this.element);
      this.draw(event);
      if(this.options.change) this.options.change(this);
      if(navigator.appVersion.indexOf('AppleWebKit')>0) window.scrollBy(0,0);
      Event.stop(event);
   }
  }
}

SortableObserver = Class.create();
SortableObserver.prototype = {
  initialize: function(element, observer) {
    this.element   = $(element);
    this.observer  = observer;
    this.lastValue = Sortable.serialize(this.element);
  },
  onStart: function() {
    this.lastValue = Sortable.serialize(this.element);
  },
  onEnd: function() {    
    if(this.lastValue != Sortable.serialize(this.element))
      this.observer(this.element)
  }
}




// TODO: add a way to make possible to refill empty sortables, by
//       providing a 'elementid_refill' element that displays an element only
//       if there are no other elements w/ options.tag in the sortable.
//       option.refill to override (false | 'id')
Sortable = {
  create: function(element) {
    var options = { 
      tag:         'li',       // assumes li children, override with tag: 'tagname'
      overlap:     'vertical', // one of 'vertical', 'horizontal'
      constraint:  'vertical', // one of 'vertical', 'horizontal', false
      containment: $(element), // also takes array of elements (or id's); or false
      handle:      false,      // or a CSS class
      only:        false,
      hoverclass:  null,
      onChange:    function() {},
      onUpdate:    function() {}
    }.extend(arguments[1] || {});
    $(element).sortable_tag      = options.tag;   // convenience for serializing
    $(element).sortable_onChange = options.onChange;
    Element.cleanWhitespace(element); // fixes Gecko engine
    Draggables.addObserver(new SortableObserver(element, options.onUpdate));
    var elements = $(element).childNodes;
    for (var i = 0; i < elements.length; i++) 
      if(elements[i].tagName && elements[i].tagName==options.tag.toUpperCase() &&
         (!options.only || (Element.Class.has(elements[i], options.only)))) {
        handle = elements[i];
        if(options.handle)
          handle = Element.Class.childrenWith(elements[i], options.handle)[0];
        new Draggable(elements[i], 
          { 
            revert:      true,
            constraint:  options.constraint,
            handle:      handle
          }
        );
        Droppables.add(elements[i],
          { 
            overlap:     options.overlap,
            containment: options.containment,
            hoverclass:  options.hoverclass,
            onHover: function(element, dropon, overlap) { 
              if(overlap>0.5) {
                if(dropon.previousSibling != element) {
                  var oldParentNode = element.parentNode;
                  dropon.parentNode.insertBefore(element, dropon);
                  if(dropon.parentNode!=oldParentNode) 
                    oldParentNode.sortable_onChange(element);
                  if(dropon.parentNode.sortable_onChange)
                    dropon.parentNode.sortable_onChange(element);
                }
              } else {                
                var nextElement = dropon.nextSibling || null;
                if(nextElement != element) {
                  var oldParentNode = element.parentNode;
                  dropon.parentNode.insertBefore(element, nextElement);
                  if(dropon.parentNode!=oldParentNode) 
                    oldParentNode.sortable_onChange(element);
                  if(dropon.parentNode.sortable_onChange)
                    dropon.parentNode.sortable_onChange(element);
                }
              }
            }
          }
        );
      }
  },
  serialize: function(element) {
    var options = {
      tag:  $(element).sortable_tag || 'li',
      name: $(element).id     
    }.extend(arguments[1] || {});
    
    var items = $(element).childNodes;
    var queryComponents = new Array();
 
    for(var i=0; i<items.length; i++)
      if(items[i].tagName && items[i].tagName==options.tag.toUpperCase())
        queryComponents.push(
          encodeURIComponent(options.name) + "[]=" + 
          encodeURIComponent(items[i].id.split("_")[1]));

    return queryComponents.join("&");
  }
} 
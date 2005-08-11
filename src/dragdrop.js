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

var Droppables = {
  drops: false,
  
  remove: function(element) {
    for(var i = 0; i < this.drops.length; i++)
      if(this.drops[i].element == element)
        this.drops.splice(i,1);
  },
  
  add: function(element) {
    var element = $(element);
    var options = Object.extend({
      greedy:     true,
      hoverclass: null  
    }, arguments[1] || {});
    
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
    
    Element.makePositioned(element); // fix IE
    
    options.element = element;
    
    // activate the droppable    
    if(!this.drops) this.drops = [];
    this.drops.push(options);
  },
  
  isContained: function(element, drop) {
    var containers = drop._containers;
    var parentNode = element.parentNode;
    var i = drop._containers_length;
    do { if(parentNode==containers[i]) return true; } while (i--);
    return false;
  },
  
  isAffected: function(pX, pY, element, drop) {
    return (
      (drop.element!=element) &&
      ((!drop._containers) ||
        this.isContained(element, drop)) &&
      ((!drop.accept) ||
        (Element.Class.has_any(element, drop.accept))) &&
      Position.within(drop.element, pX, pY) );
  },
  
  deactivate: function(drop) {
    Element.Class.remove(drop.element, drop.hoverclass);
    this.last_active = null;
  },
  
  activate: function(drop) {
    if(this.last_active) this.deactivate(this.last_active);
    if(drop.hoverclass)
      Element.Class.add(drop.element, drop.hoverclass);
    this.last_active = drop;
  },
  
  show: function(event, element) {
    if(!this.drops) return;
    var pX = Event.pointerX(event);
    var pY = Event.pointerY(event);
    Position.prepare();
    
    var i = this.drops.length-1; do {
      var drop = this.drops[i];
      if(this.isAffected(pX, pY, element, drop)) {
        if(drop.onHover)
           drop.onHover(element, drop.element, Position.overlap(drop.overlap, drop.element));
        if(drop.greedy) { 
          this.activate(drop);
          return;
        }
      }
    } while (i--);
  },
  
  fire: function(event, element) {
    if(!this.last_active) return;
    Position.prepare();
    
    if (this.isAffected(Event.pointerX(event), Event.pointerY(event), element, this.last_active))
      if (this.last_active.onDrop) 
        this.last_active.onDrop(element, this.last_active);
    
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
  removeObserver: function(element) {  // element instead of obsever fixes mem leaks
    for(var i = 0; i < this.observers.length; i++)
      if(this.observers[i].element && (this.observers[i].element == element))
        this.observers.splice(i,1);
  },
  notify: function(eventName, draggable) {  // 'onStart', 'onEnd'
    for(var i = 0; i < this.observers.length; i++)
      this.observers[i][eventName](draggable);
  }
}

/*--------------------------------------------------------------------------*/

Draggable = Class.create();
Draggable.prototype = {
  initialize: function(element) {
    var options = Object.extend({
      handle: false,
      starteffect: function(element) { 
        new Effect.Opacity(element, {duration:0.2, from:1.0, to:0.7}); 
      },
      reverteffect: function(element, top_offset, left_offset) {
        var dur = Math.sqrt(Math.abs(top_offset^2)+Math.abs(left_offset^2))*0.02;
        new Effect.MoveBy(element, -top_offset, -left_offset, {duration:dur});
      },
      endeffect: function(element) { 
         new Effect.Opacity(element, {duration:0.2, from:0.7, to:1.0}); 
      },
      zindex: 1000,
      revert: false
    }, arguments[1] || {});
    
    this.element      = $(element);
    this.handle       = options.handle ? $(options.handle) : this.element;
    
    Element.makePositioned(this.element); // fix IE    
    
    this.offsetX      = 0;
    this.offsetY      = 0;
    this.originalLeft = this.currentLeft();
    this.originalTop  = this.currentTop();
    this.originalX    = this.element.offsetLeft;
    this.originalY    = this.element.offsetTop;
    this.originalZ    = parseInt(this.element.style.zIndex || "0");
    
    this.options      = options;
    
    this.active       = false;
    this.dragging     = false;   
    
    this.eventMouseDown = this.startDrag.bindAsEventListener(this);
    this.eventMouseUp   = this.endDrag.bindAsEventListener(this);
    this.eventMouseMove = this.update.bindAsEventListener(this);
    this.eventKeypress  = this.keyPress.bindAsEventListener(this);
    
    Event.observe(this.handle, "mousedown", this.eventMouseDown);
    Event.observe(document, "mouseup", this.eventMouseUp);
    Event.observe(document, "mousemove", this.eventMouseMove);
    Event.observe(document, "keypress", this.eventKeypress);
  },
  destroy: function() {
    Event.stopObserving(this.handle, "mousedown", this.eventMouseDown);
    Event.stopObserving(document, "mouseup", this.eventMouseUp);
    Event.stopObserving(document, "mousemove", this.eventMouseMove);
    Event.stopObserving(document, "keypress", this.eventKeypress);
  },
  currentLeft: function() {
    return parseInt(this.element.style.left || '0');
  },
  currentTop: function() {
    return parseInt(this.element.style.top || '0')
  },
  startDrag: function(event) {
    if(Event.isLeftClick(event)) {
      this.active = true;
      var pointer = [Event.pointerX(event), Event.pointerY(event)];
      var offsets = Position.cumulativeOffset(this.element);
      this.offsetX =  (pointer[0] - offsets[0]);
      this.offsetY =  (pointer[1] - offsets[1]);
      Event.stop(event);
    }
  },
  finishDrag: function(event, success) {
    this.active = false;
    this.dragging = false;
    
    if(success) Droppables.fire(event, this.element);
    Draggables.notify('onEnd', this);
    
    var revert = this.options.revert;
    if(revert && typeof revert == 'function') revert = revert(this.element);
    
    if(this.options.ghosting) {
      Position.relativize(this.element);
      Element.remove(this._clone);
      this._clone = null;
    }
      
    if(revert && this.options.reverteffect) {
      this.options.reverteffect(this.element, 
      this.currentTop()-this.originalTop,
      this.currentLeft()-this.originalLeft);
    } else {
      this.originalLeft = this.currentLeft();
      this.originalTop  = this.currentTop();
    }
    
    this.element.style.zIndex = this.originalZ;
      
    if(this.options.endeffect) 
      this.options.endeffect(this.element);
      
    
    Droppables.reset();
  },
  keyPress: function(event) {
    if(this.active) {
      if(event.keyCode==Event.KEY_ESC) {
        this.finishDrag(event, false);
        Event.stop(event);
      }
    }
  },
  endDrag: function(event) {
    if(this.active && this.dragging) {
      this.finishDrag(event, true);
      Event.stop(event);
    }
    this.active = false;
    this.dragging = false;
  },
  draw: function(event) {
    var pointer = [Event.pointerX(event), Event.pointerY(event)];
    var offsets = Position.cumulativeOffset(this.element);
    offsets[0] -= this.currentLeft();
    offsets[1] -= this.currentTop();
    var style = this.element.style;
    if((!this.options.constraint) || (this.options.constraint=='horizontal'))
      style.left = (pointer[0] - offsets[0] - this.offsetX) + "px";
    if((!this.options.constraint) || (this.options.constraint=='vertical'))
      style.top  = (pointer[1] - offsets[1] - this.offsetY) + "px";
    if(style.visibility=="hidden") style.visibility = ""; // fix gecko rendering
  },
  update: function(event) {
   if(this.active) {
      if(!this.dragging) {
        var style = this.element.style;
        this.dragging = true;
        if(style.position=="") style.position = "relative";
        style.zIndex = this.options.zindex;
        
        if(this.options.ghosting) {
          this._clone = this.element.cloneNode(true);
          Position.absolutize(this.element);
          this.element.parentNode.insertBefore(this._clone, this.element);
        }
        
        Draggables.notify('onStart', this);
        if(this.options.starteffect) this.options.starteffect(this.element);
      }
      
      Droppables.show(event, this.element);
      this.draw(event);
      if(this.options.change) this.options.change(this);
      
      // fix AppleWebKit rendering
      if(navigator.appVersion.indexOf('AppleWebKit')>0) window.scrollBy(0,0); 
      
      Event.stop(event);
   }
  }
}

/*--------------------------------------------------------------------------*/

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
    Sortable.unmark();
    if(this.lastValue != Sortable.serialize(this.element))
      this.observer(this.element)
  }
}

Sortable = {
  sortables: new Array(),
  options: function(element){
    var element = $(element);
    for(var i=0;i<this.sortables.length;i++)
      if(this.sortables[i].element == element)
        return this.sortables[i];
    return null;        
  },
  destroy: function(element){
    var element = $(element);
    for(var i=0;i<this.sortables.length;i++) {
      if(this.sortables[i].element == element) {
        var s = this.sortables[i];
        Draggables.removeObserver(s.element);
        for(var j=0;j<s.droppables.length;j++)
          Droppables.remove(s.droppables[j]);
        for(var j=0;j<s.draggables.length;j++)
          s.draggables[j].destroy();
        this.sortables.splice(i,1);
      }
    }
  },
  create: function(element) {
    var element = $(element);
    var options = Object.extend({ 
      element:     element,
      tag:         'li',       // assumes li children, override with tag: 'tagname'
      dropOnEmpty: false,
      tree:        false,      // fixme: unimplemented
      overlap:     'vertical', // one of 'vertical', 'horizontal'
      constraint:  'vertical', // one of 'vertical', 'horizontal', false
      containment: element,    // also takes array of elements (or id's); or false
      handle:      false,      // or a CSS class
      only:        false,
      hoverclass:  null,
      ghosting:    false,
      onChange:    function() {},
      onUpdate:    function() {}
    }, arguments[1] || {});
    
    // clear any old sortable with same element
    this.destroy(element);
    
    // build options for the draggables
    var options_for_draggable = {
      revert:      true,
      ghosting:    options.ghosting,
      constraint:  options.constraint,
      handle:      handle };
   
    if(options.starteffect)
      options_for_draggable.starteffect = options.starteffect;
   
    if(options.reverteffect)
      options_for_draggable.reverteffect = options.reverteffect;
    else
      if(options.ghosting) options_for_draggable.reverteffect = function(element) {
        element.style.top  = 0;
        element.style.left = 0;
      };
   
    if(options.endeffect)
      options_for_draggable.endeffect = options.endeffect;
   
    if(options.zindex)
      options_for_draggable.zindex = options.zindex;
    
    // build options for the droppables  
    var options_for_droppable = {
      overlap:     options.overlap,
      containment: options.containment,
      hoverclass:  options.hoverclass,
      onHover:     Sortable.onHover,
      greedy:      !options.dropOnEmpty
    }

    // fix for gecko engine
    Element.cleanWhitespace(element); 
    
    options.draggables = [];
    options.droppables = [];
    
    // make it so
    
    // drop on empty handling
    if(options.dropOnEmpty) {
      Droppables.add(element,
        {containment: options.containment, onHover: Sortable.onEmptyHover, greedy: false});
      options.droppables.push(element);
    }
     
    var elements = this.findElements(element, options);
    if(elements) {
      for (var i = 0; i < elements.length; i++) {
        // handles are per-draggable
        var handle = options.handle ? 
          Element.Class.childrenWith(elements[i], options.handle)[0] : elements[i];
            options.draggables.push(new Draggable(elements[i], Object.extend(options_for_draggable, { handle: handle })));
            Droppables.add(elements[i], options_for_droppable);
        
        options.droppables.push(elements[i]);
      }
    }
   
    // keep reference
    this.sortables.push(options);
    
    // for onupdate
    Draggables.addObserver(new SortableObserver(element, options.onUpdate));

  },
  
  // return all suitable-for-sortable elements in a guaranteed order
  findElements: function(element, options) {
    if(!element.hasChildNodes()) return null;
    var elements = [];
    var children = element.childNodes;
    for(var i = 0; i<children.length; i++) {
      if(children[i].tagName && children[i].tagName==options.tag.toUpperCase() &&
        (!options.only || (Element.Class.has(children[i], options.only))))
          elements.push(children[i]);
      if(options.tree) {
        var grandchildren = this.findElements(children[i], options);
        if(grandchildren) elements.push(grandchildren);
      }
    }
  
    return (elements.length>0 ? elements.flatten() : null);
  },
  
  onHover: function(element, dropon, overlap) {
    if(overlap>0.5) {
      Sortable.mark(dropon, 'before');
      if(dropon.previousSibling != element) {
        var oldParentNode = element.parentNode;
        element.style.visibility = "hidden"; // fix gecko rendering
        dropon.parentNode.insertBefore(element, dropon);
        if(dropon.parentNode!=oldParentNode && oldParentNode.sortable) 
          oldParentNode.sortable.onChange(element);
        if(dropon.parentNode.sortable)
          dropon.parentNode.sortable.onChange(element);
      }
    } else {
      Sortable.mark(dropon, 'after');
      var nextElement = dropon.nextSibling || null;
      if(nextElement != element) {
        var oldParentNode = element.parentNode;
        element.style.visibility = "hidden"; // fix gecko rendering
        dropon.parentNode.insertBefore(element, nextElement);
        if(dropon.parentNode!=oldParentNode && oldParentNode.sortable) 
          oldParentNode.sortable.onChange(element);
        if(dropon.parentNode.sortable)
          dropon.parentNode.sortable.onChange(element);
      }
    }
  },
  
  onEmptyHover: function(element, dropon) {
    if(element.parentNode!=dropon) {
      dropon.appendChild(element);
    }
  },
  
  unmark: function() {
    if(Sortable._marker) Element.hide(Sortable._marker);
  },
  
  mark: function(dropon, position) {
    // mark on ghosting only
    var sortable = Sortable.options(dropon.parentNode);
    if(sortable && !sortable.ghosting) return; 
    
    if(!Sortable._marker) {
      Sortable._marker = $('dropmarker') || document.createElement('DIV');
      Element.hide(Sortable._marker);
      Element.Class.add(Sortable._marker, 'dropmarker');
      Sortable._marker.style.position = 'absolute';
      document.getElementsByTagName("body").item(0).appendChild(Sortable._marker);
    }    
    var offsets = Position.cumulativeOffset(dropon);
    Sortable._marker.style.top  = offsets[1] + 'px';
    if(position=='after') Sortable._marker.style.top = (offsets[1]+dropon.clientHeight) + 'px';
    Sortable._marker.style.left = offsets[0] + 'px';
    Element.show(Sortable._marker);
  },
  
  serialize: function(element) {
    var element = $(element);
    var sortableOptions = this.options(element);
    var options = Object.extend({
      tag:  sortableOptions.tag,
      only: sortableOptions.only,
      name: element.id
    }, arguments[1] || {});
    
    var items = $(element).childNodes;
    var queryComponents = new Array();
 
    for(var i=0; i<items.length; i++)
      if(items[i].tagName && items[i].tagName==options.tag.toUpperCase() &&
        (!options.only || (Element.Class.has(items[i], options.only))))
        queryComponents.push(
          encodeURIComponent(options.name) + "[]=" + 
          encodeURIComponent(items[i].id.split("_")[1]));

    return queryComponents.join("&");
  }
} 
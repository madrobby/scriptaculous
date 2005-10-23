// Copyright (c) 2005 Marty Haught
// 
// See scriptaculous.js for full license.

if(!Control) var Control = {};
Control.Slider = Class.create();

// options:
//  axis: 'vertical', or 'horizontal' (default)
//  increment: (default: 1)
//  step: (default: 1)
//
// callbacks:
//  onChange(value)
//  onSlide(value)
Control.Slider.prototype = {
  initialize: function(handle, track, options) {
    var slider = this;
    
    if(handle instanceof Array) {
      this.handles = handle.collect( function(e) { return $(e) });
    } else {
      this.handles = [$(handle)];
    }
    
    this.track   = $(track);
    this.options = options || {};

    this.axis      = this.options.axis || 'horizontal';
    this.increment = this.options.increment || 1;
    this.step      = parseInt(this.options.step || '1');
    this.value     = 0; // assure backwards compat
    this.values    = this.handles.map( function() { return 0 });

    var defaultMaximum = Math.round(this.track.offsetWidth / this.increment);
    if(this.isVertical()) defaultMaximum = Math.round(this.track.offsetHeight / this.increment);   
    
    this.maximum = this.options.maximum || defaultMaximum;
    this.minimum = this.options.minimum || 0;

    // Will be used to align the handle onto the track, if necessary
    this.alignX = parseInt (this.options.alignX || '0');
    this.alignY = parseInt (this.options.alignY || '0');

    // Zero out the slider position	
    this.setCurrentLeft(Position.cumulativeOffset(this.track)[0] - Position.cumulativeOffset(this.handles[0])[0] + this.alignX);
    this.setCurrentTop(this.trackTop() - Position.cumulativeOffset(this.handles[0])[1] + this.alignY);

    this.offsetX = 0;
    this.offsetY = 0;

    this.originalLeft = this.currentLeft();
    this.originalTop  = this.currentTop();
    
    this.active   = false;
    this.dragging = false;
    this.disabled = false;

    // FIXME: use css
    this.handleImage    = this.options.handleImage ? $(this.options.handleImage) : false; 
    this.handleDisabled = this.options.handleDisabled || false;
    this.handleEnabled  = false;
    if(this.handleImage)
      this.handleEnabled  = this.handleImage.src || false;

    if(this.options.disabled)
      this.setDisabled();

    // Value Array
    this.allowedValues = this.options.values || false;  // Add method to validate and sort??
    if(this.allowedValues) {
      this.minimum = this.allowedValues.min();
      this.maximum = this.allowedValues.max();
    }

    this.eventMouseDown = this.startDrag.bindAsEventListener(this);
    this.eventMouseUp   = this.endDrag.bindAsEventListener(this);
    this.eventMouseMove = this.update.bindAsEventListener(this);
    //this.eventKeypress  = this.keyPress.bindAsEventListener(this);

    // Initialize handles
    this.handles.each( function(h,i) {
      slider.setValue(parseInt(slider.options.sliderValue || slider.minimum), i);
      Element.makePositioned(h); // fix IE
      Event.observe(h, "mousedown", slider.eventMouseDown);
    });
    
    Event.observe(document, "mouseup", this.eventMouseUp);
    Event.observe(document, "mousemove", this.eventMouseMove);
    //Event.observe(document, "keypress", this.eventKeypress);

  },
  dispose: function() {
    var slider = this;
    
    Event.stopObserving(document, "mouseup", this.eventMouseUp);
    Event.stopObserving(document, "mousemove", this.eventMouseMove);
    //Event.stopObserving(document, "keypress", this.eventKeypress);
    
    this.handles.each( function(h) {
      Event.stopObserving(h, "mousedown", slider.eventMouseDown);
    });
  },
  setDisabled: function(){
    this.disabled = true;
    if(this.handleDisabled)
      this.handleImage.src = this.handleDisabled;
  },
  setEnabled: function(){
    this.disabled = false;
    if(this.handleEnabled)
      this.handleImage.src = this.handleEnabled;
  },  
  currentLeft: function() {
    return parseInt(this.handles[this.activeHandleIdx || 0].style.left || '0');
  },
  currentTop: function() {
    return parseInt(this.handles[this.activeHandleIdx || 0].style.top || '0');
  },
  setCurrentLeft: function(left, handle) {
    this.handles[handle || this.activeHandleIdx || 0].style.left = left +"px";
  },
  setCurrentTop: function(top, handle) {
    this.handles[handle || this.activeHandleIdx || 0].style.top = top +"px";
  },
  trackLeft: function(){
    return Position.cumulativeOffset(this.track)[0];
  },
  trackTop: function(){
    return Position.cumulativeOffset(this.track)[1];
  }, 
  getNearestValue: function(value){
    if(this.allowedValues){
      if(value >= this.allowedValues.max()) return(this.allowedValues.max());
      if(value <= this.allowedValues.min()) return(this.allowedValues.min());

      var offset = Math.abs(this.allowedValues[0] - value);
      var newValue = this.allowedValues[0];

      this.allowedValues.each( function(v) {
        var currentOffset = Math.abs(v - value);
        if(currentOffset <= offset){
          newValue = v;
          offset = currentOffset;
        } 
      });
      return newValue;
    }
    return value;
  },
  setValue: function(sliderValue, handleIdx){
    if(!this.active) {
      this.activeHandle    = this.handles[handleIdx];
      this.activeHandleIdx = handleIdx;
    }
    // First check our max and minimum and nearest values
    sliderValue = this.getNearestValue(sliderValue);
    
    if(sliderValue > this.maximum) sliderValue = this.maximum;
    if(sliderValue < this.minimum) sliderValue = this.minimum;
    var pos = (sliderValue - this.minimum) * this.increment;
    
    if(this.isVertical()){
      this.setCurrentTop(pos, handleIdx || this.activeHandleIdx || 0);
    } else {
      this.setCurrentLeft(pos, handleIdx || this.activeHandleIdx || 0);
    }
    
    this.values[handleIdx || this.activeHandleIdx || 0] = sliderValue;
    this.value = this.values[0]; // assure backwards compat
    
    this.updateFinished();
  },
  setValueBy: function(delta, handleIdx) {
    this.setValue(this.values[handleIdx || this.activeHandleIdx || 0] + delta, 
      handleIdx || this.activeHandleIdx || 0);
  },
  getRange: function(range) {
    var v = this.values.sort(function(a,b) { return a-b });
    range = range || 0;
    return $R(v[range],v[range+1]);
  },
  minimumOffset: function(){
    return(this.isVertical() ? 
      this.trackTop() + this.alignY :
      this.trackLeft() + this.alignX);
  },
  maximumOffset: function(){
    return(this.isVertical() ?
      this.trackTop() + this.alignY + (this.maximum - this.minimum) * this.increment :
      this.trackLeft() + this.alignX + (this.maximum - this.minimum) * this.increment);
  },  
  isVertical:  function(){
    return (this.axis == 'vertical');
  },
  startDrag: function(event) {
    if(Event.isLeftClick(event)) {
      if(!this.disabled){
        this.active          = true;
        this.activeHandle    = Event.element(event);
        this.activeHandleIdx = this.handles.indexOf(this.activeHandle);
        
        var pointer = [Event.pointerX(event), Event.pointerY(event)];
        var offsets = Position.cumulativeOffset(this.activeHandle);
        this.offsetX      = (pointer[0] - offsets[0]);
        this.offsetY      = (pointer[1] - offsets[1]);
        this.originalLeft = this.currentLeft();
        this.originalTop  = this.currentTop();
        this.originalZ    = parseInt(this.activeHandle.style.zIndex || '0');
      }
      Event.stop(event);
    }
  },
  update: function(event) {
   if(this.active) {
      if(!this.dragging) {
        var style = this.activeHandle.style;
        this.dragging = true;
        if(style.position=="") style.position = "relative";
        style.zIndex = this.options.zindex;
      }
      this.draw(event);
      // fix AppleWebKit rendering
      if(navigator.appVersion.indexOf('AppleWebKit')>0) window.scrollBy(0,0);
      Event.stop(event);
   }
  },
  draw: function(event) {
    var pointer = [Event.pointerX(event), Event.pointerY(event)];
    var offsets = Position.cumulativeOffset(this.activeHandle);

    offsets[0] -= this.currentLeft();
    offsets[1] -= this.currentTop();
        
    // Adjust for the pointer's position on the handle
    pointer[0] -= this.offsetX;
    pointer[1] -= this.offsetY;

    if(this.isVertical()){
      if(pointer[1] > this.maximumOffset()) pointer[1] = this.maximumOffset();
      if(pointer[1] < this.minimumOffset()) pointer[1] = this.minimumOffset();
      this.values[this.activeHandleIdx] = 
        this.getNearestValue(Math.round((pointer[1] - this.minimumOffset()) / this.increment) + this.minimum);
      pointer[1] = this.trackTop() + this.alignY + (this.values[this.activeHandleIdx] - this.minimum) * this.increment;
      this.activeHandle.style.top = pointer[1] - offsets[1] + "px";
    } else {
      if(pointer[0] > this.maximumOffset()) pointer[0] = this.maximumOffset();
      if(pointer[0] < this.minimumOffset()) pointer[0] = this.minimumOffset();
      this.values[this.activeHandleIdx] = 
        this.getNearestValue(Math.round((pointer[0] - this.minimumOffset()) / this.increment) + this.minimum);
      pointer[0] = this.trackLeft() + this.alignX + (this.values[this.activeHandleIdx] - this.minimum) * this.increment;
      this.activeHandle.style.left = (pointer[0] - offsets[0]) + "px";
    }
    
    this.value = this.values[0];
    if(this.options.onSlide) this.options.onSlide(this.values.length>1 ? this.values : this.value, this);
  },
  endDrag: function(event) {
    if(this.active && this.dragging) {
      this.finishDrag(event, true);
      Event.stop(event);
    }
    this.active = false;
    this.dragging = false;
  },  
  finishDrag: function(event, success) {
    this.active = false;
    this.dragging = false;
    this.activeHandle.style.zIndex = this.originalZ;
    this.originalLeft = this.currentLeft();
    this.originalTop  = this.currentTop();
    this.updateFinished();
  },
  updateFinished: function() {
    if(this.options.onChange) this.options.onChange(this.values.length>1 ? this.values : this.value, this);
  }
//  keyPress: function(event) {
//    if(this.active && !this.disabled) {
//      switch(event.keyCode) {
//        case Event.KEY_ESC:
//          this.finishDrag(event, false);
//          Event.stop(event); 
//          break;
//      }
//      if(navigator.appVersion.indexOf('AppleWebKit')>0) Event.stop(event);
//    }
//  }
}

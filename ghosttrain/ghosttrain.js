// Copyright (c) 2005 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
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

// small but works-for-me stuff for testing javascripts
// not ready for "production" use

/*--------------------------------------------------------------------------*/

var Engine = {
  detect: function() {
    var UA = navigator.userAgent;
    this.isKHTML = /Konqueror|Safari|KHTML/.test(UA);
    this.isGecko = (/Gecko/.test(UA) && !this.isKHTML);
    this.isOpera = /Opera/.test(UA);
    this.isMSIE  = (/MSIE/.test(UA) && !this.isOpera);
  }
}
Engine.detect();

/*--------------------------------------------------------------------------*/

// Test generator helper

Test.Unit.Generator = Class.create();
Test.Unit.Generator.prototype = {
  initialize: function() {
    this.code = "";
    this.addLine("new Test.Unit.Runner({");
  },
  addLine: function(line) {
    this.code += line + '\n';
  },
  startTest: function(name) {
    this.addLine("test" + name + ": function() { with(this) {");
  },
  endTest: function() {
    this.addLine("}}")
  },
  finish: function() {
    this.addLine("}, \"testlog\");");
  },
  dump: function() {
    return(this.code);
  }
}

// Ghost Train classes

GhostTrain = {
  Version: "0.1.0"  
};

// find by _ghostTrainId, needed for elements w/o id attribute
function $G(id) {
  var elements = document.getElementsByTagName('*');
  for (var i = 0; i < elements.length; i++)
    if(elements[i]._ghostTrainId==id) return elements[i];
  return null;
}

GhostTrain.Recorder = Class.create();
GhostTrain.Recorder.prototype = {
  EVENTS: [
   "click", "dblclick", "mousedown", "mouseup",
   "mouseover", "mouseout", "mousemove",
   "keypress", "keyup", "keydown",
   //"blur", "focus",
   "resize", "scroll", 
   "load" 
  ],
  initialize: function() {
    this.log = [];
    this.rid = 0;
    this._interceptor = this.interceptor.bindAsEventListener(this);
  },
  record: function() {
    this.isRecording = true;
    this.startCapturing();
  },
  stop: function() {
    this.isRecording = false;
    this.stopCapturing();
  },
  pause: function() {
    if(this.isPaused) {
      this.isPaused = false;
      this.startCapturing();
    } else {
      this.isPaused = true;
      this.stopCapturing();
    }
  },
  startCapturing: function() {
    for(var i=0;i<this.EVENTS.length;i++) 
      Event.observe(window, this.EVENTS[i], this._interceptor, true);
  },
  stopCapturing: function() {
    for(var i=0;i<this.EVENTS.length;i++) 
      Event.stopObserving(window, this.EVENTS[i], this._interceptor, true);
  },
  getIdQuery: function(event) {
    var query = (
      event.type=='mousemove' || event.type=='mouseout' || event.type=='mouseover') ? 
      event.target : event.originalTarget;
    
    if(!query._ghostTrainId)
      query._ghostTrainId = "gid_" + (this.rid++);
    
    return (query.id == "") ? "$G('"+query._ghostTrainId+"')" : "$('"+query.id+"')";
  },
  logEvent: function(event) {
    if(true) { //todo filter controls
      event.idQuery = this.getIdQuery(event);
      this.log.push(event);
      // fixme: hack for now
      $('ghosttrain_info').innerHTML = this.log.length + ' events';
    } 
  },
  interceptor: function(event) {
    var eventObj = Object.extend({}, event);
    
    // only use last mousemove in a series
    if(eventObj.type=='mousemove') {
      this._lastEvent = eventObj;
      return;
    }
    if(this._lastEvent) {
      this.logEvent(this._lastEvent);
      this._lastEvent = null;
    }
    
    this.logEvent(eventObj);
  },
  dumpLog: function(element) {
    element = $(element);
    //element.innerHTML += this.log[0].inspect();
    for(var i=0;i<this.log.length;i++) 
      element.innerHTML += this.log[i].type + 
        " at " + this.log[i].pageX + "/" + this.log[i].pageY + 
        " on " + this.log[i].originalTarget + '\n';
  },
  scaffold: function() {
    var test = new Test.Unit.Generator();
    test.startTest("Foo");
    for(var i=0;i<this.log.length;i++) {
      test.addLine("  Event.simulateMouse("+this.log[i].idQuery+",'"+this.log[i].type+"',{pointerX: "+this.log[i].pageX+", pointerY:"+this.log[i].pageY+"});");
      //test.addLine("");
    }
    test.endTest();
    test.finish();
    return(test.dump());
  }
}

GhostTrain.Control = Class.create();
GhostTrain.Control.prototype = {
  initialize: function(recorder) {
    this.recorder = recorder;
    this._createHTML();
    this.isShrunk = false;
    this.isActive = true;
  },
  record: function() {
    if(!this.recorder.isRecording) {
      this.recorder.record();
      this.shrink();
      this.setStatus('Recording...');
    }
  },
  stop: function() {
    if(this.recorder.isRecording) {
      this.recorder.stop();
      this.expand();
      this.setStatus('New test scaffold generated')
      $('generated_test').value = this.recorder.scaffold();
    }
  },
  pause: function() {
    if(this.recorder.isRecording) {
      this.recorder.pause();
      if(this.recorder.isPaused) {
        $('generated_test').value = this.recorder.scaffold();
        this.expand();
        this.setStatus('Recording paused');  
      } else {
        this.shrink();
        this.setStatus('Recording...');
      }
    }
  },
  run: function() {
    if(!this.recorder.isRecording) {
      if($('generated_test').value=="") {
        alert("No test script defined! Record some actions or paste a testscript in.");
        return;
      }
      try {
        eval($('generated_test').value);
      } catch(e) {
        alert("Error while executing test script: "+e.inspect());
      }
    }
  },
  intercept: function() {
    // while recording ghost train key toggles pause
    if(this.recorder.isRecording) {
      this.pause();
      return;
    }
    // else toggles ghost train itself
    if(this.isActive) {
      this.hide();
    } else {
      this.show();
    }
  },
  hide: function() {
    Element.hide(this.element);
    Element.hide(this.reminder);
    this.isActive = false;
  },
  show: function() {
    if(this.isShrunk) {
      Element.hide(this.element);
      Element.show(this.reminder);
    } else {
      Element.hide(this.reminder);
      Element.show(this.element);
    }
    this.isActive = true;
  },
  shrink: function() {
    if(!this.isShrunk) {
      Element.hide(this.element);
      Element.show(this.reminder);
      this.isShrunk = true;
    }
  },
  expand: function() {
    if(this.isShrunk) {
      Element.hide(this.reminder);
      Element.show(this.element);
      this.isShrunk = false;
    }
  },
  setStatus: function(message) {
    $('ghosttrain-status').innerHTML = message; 
  },
  _createHTML: function() {
    
    /*this.element = Builder.node('div',{id:'ghosttrain'},[
      Builder.node('div',{klass:'controls'},[
        Builder.node('h1',{},[Builder.text('Ghost Train ' + GhostTrain.Version)]),
        (!Engine.isGecko ? 'Note: your browser is probably not compatible with Ghost Train (try Firefox).' : ''),
        Builder.node('ul',{klass:'buttons'},[
          Builder.node('li',{klass:'active', onclick:'GhostTrain.controller.record();'},'Record')
        ]),
      ]),
    ]);*/
  this.element = Builder.node('div',{id:'ghosttrain'});
    
    // fixme: for now
  this.element.innerHTML = '<div class="controls">' +
      '<h1>Ghost Train ' + GhostTrain.Version + '</h1>' +
      (!Engine.isGecko ? 'Note: your browser is probably not compatible with Ghost Train (try Firefox).' : '') +
      '<ul class="buttons">' +
      '  <li class="active" onclick="GhostTrain.controller.record();">Record</li>' +
      '  <li class="active" onclick="GhostTrain.controller.stop();">Stop</li>' +
      '  <li class="active" onclick="GhostTrain.controller.run();">Run</li>' +
      '</ul>' +
      '<input id="ghosttrain-step" type="checkbox" checked="checked"/> step' +
      '<a href="#" onclick="Effect.SlideDown($(\'ghosttrain-panel\'))">script</a>' +
      '<br/>' +
      '<div id="ghosttrain-status" class="status">Press record to begin recording</div>' +
      '<div id="ghosttrain-panel"><div>' +
      '  <textarea id="generated_test" style="width:240px;height:150px;font-size:10px;"></textarea><br/>' +
      '  <a href="#" onclick="Effect.SlideUp($(\'ghosttrain-panel\'))">hide</a>' +
      '</div></div>' +
      '<a href="http://wiki.script.aculo.us/scriptaculous/show/GhostTrain" class="documentation">Ghost Train documentation</a>' +
      '</div>';
    document.body.appendChild(this.element);
    this.reminder = Builder.node('div',{id:'ghosttrain-reminder',style:'display:none'},[
      'Press ESC to pause',
      Builder.node('br'),
      Builder.node('span',{id:'ghosttrain_info'},' ')
    ]);
    document.body.appendChild(this.reminder);
  }
}

GhostTrain.intercept = function(event) {
  if(event.keyCode==Event.KEY_ESC) {
    if(!GhostTrain.active) {
      GhostTrain.recorder   = new GhostTrain.Recorder();
      GhostTrain.controller = new GhostTrain.Control(GhostTrain.recorder); 
      GhostTrain.active     = true;
    } else {
      GhostTrain.controller.intercept(); 
    }
  }
}

Event.observe(document, 'keypress', GhostTrain.intercept, true);
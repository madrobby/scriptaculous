// Copyright (c) 2005 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
//           (c) 2005 Jon Tirsen
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

Object.prototype.inspect = function(){
  var info = [];
  for(property in this)
    if(typeof this[property]!="function") 
      info.push(property + ' => "' + this[property] + '"');
  return ("'" + this + "' #" + typeof this + 
    ": {" + info.join(", ") + "}");
}

// overload inspect for Strings, very confusing output otherwise (comment out and you'll notice ;-) )
String.prototype.inspect = function() {
  return this;
}

// experimental, Firefox-only
Event.simulateMouse = function(element, eventName) {
  var oEvent = document.createEvent("MouseEvents");
  oEvent.initMouseEvent(eventName, true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, $(element));
  $(element).dispatchEvent(oEvent);
};

Test = {}
Test.Unit = {};

Test.Unit.Logger = Class.create();
Test.Unit.Logger.prototype = {
  initialize: function(log) {
    this.log = $(log);
    if (this.log) {
      this._createLogTable();
    }
  },
  start: function(testName) {
    if (!this.log) return;
    this.testName = testName;
    this.lastLogLine = document.createElement('tr');
    this.statusCell = document.createElement('td');
    this.nameCell = document.createElement('td');
    this.nameCell.appendChild(document.createTextNode(testName));
    this.messageCell = document.createElement('td');
    this.lastLogLine.appendChild(this.statusCell);
    this.lastLogLine.appendChild(this.nameCell);
    this.lastLogLine.appendChild(this.messageCell);
    this.loglines.appendChild(this.lastLogLine);
  },
  finish: function(status, summary) {
    if (!this.log) return;
    this.lastLogLine.className = status;
    this.statusCell.innerHTML = status;
    this.messageCell.innerHTML = this._toHTML(summary);
  },
  message: function(message) {
    if (!this.log) return;
    this.messageCell.innerHTML = this._toHTML(message);
  },
  summary: function(summary) {
    if (!this.log) return;
    this.logsummary.innerHTML = this._toHTML(summary);
  },
  _createLogTable: function() {
    this.log.innerHTML =
    '<div id="logsummary"></div>' +
    '<table id="logtable">' +
    '<thead><tr><th>Status</th><th>Test</th><th>Message</th></tr></thead>' +
    '<tbody id="loglines"></tbody>' +
    '</table>';
    this.logsummary = $('logsummary')
    this.loglines = $('loglines');
  },
  _toHTML: function(txt) {
    return txt.escapeHTML().replace(/\n/,"<br/>");
  }
}

Test.Unit.Runner = Class.create();
Test.Unit.Runner.prototype = {
  initialize: function(testcases, log) {
    this.log = log;
    this.tests = [];
    for(var testcase in testcases) {
      if(/^test/.test(testcase)) {
        this.tests.push(new Test.Unit.Testcase(testcase, testcases[testcase], testcases["setup"], testcases["teardown"]));
      }
    }
    this.currentTest = 0;
    Event.observe(window, 'load', this._initialize.bindAsEventListener(this));
  },
  _initialize: function() {
    this.logger = new Test.Unit.Logger(this.log);
    setTimeout(this.runTests.bind(this), 1000);
  },
  runTests: function() {
    var test = this.tests[this.currentTest];
    if (!test) {
      // finished!
      this.logger.summary(this.summary());
      return;
    }
    if(!test.isWaitingForAjax) {
      this.logger.start(test.name);
    }
    test.run();
    if(test.isWaitingForAjax) {
      this.logger.message("Waiting for AJAX");
      setTimeout(this.runTests.bind(this), test.ajaxTimeout);
    } else {
      this.logger.finish(test.status(), test.summary());
      this.currentTest++;
      // tail recursive, hopefully the browser will skip the stackframe
      this.runTests();
    }
  },
  summary: function() {
    var assertions = 0;
    var failures = 0;
    var errors = 0;
    var messages = [];
    for(var i=0;i<this.tests.length;i++) {
      assertions +=   this.tests[i].assertions;
      failures   +=   this.tests[i].failures;
      errors     +=   this.tests[i].errors;
    }
    return (
      this.tests.length + " tests, " + 
      assertions + " assertions, " + 
      failures   + " failures, " +
      errors     + " errors");
  }
}

Test.Unit.Assertions = Class.create();
Test.Unit.Assertions.prototype = {
  initialize: function() {
    this.assertions = 0;
    this.failures   = 0;
    this.errors     = 0;
    this.messages   = [];
  },
  summary: function() {
    return (
      this.assertions + " assertions, " + 
      this.failures   + " failures, " +
      this.errors     + " errors" + "\n" +
      this.messages.join("\n"));
  },
  pass: function() {
    this.assertions++;
  },
  fail: function(message) {
    this.failures++;
    this.messages.push("Failure: " + message);
  },
  error: function(error) {
    this.errors++;
    this.messages.push(error.name + ": "+ error.message + "(" + error.inspect() +")");
  },
  status: function() {
    if (this.failures > 0) return 'failed';
    if (this.errors > 0) return 'error';
    return 'passed';
  },
  assert: function(expression) {
    var message = arguments[1] || 'assert: got "' + expression.inspect() + '"';
    try { expression ? this.pass() : 
      this.fail(message); }
    catch(e) { this.error(e); }
  },
  assertEqual: function(expected, actual) {
    var message = arguments[2] || "assertEqual";
    try { (expected == actual) ? this.pass() :
      this.fail(message + ': expected "' + expected.inspect() + 
        '", actual "' + actual.inspect() + '"'); }
    catch(e) { this.error(e); }
  },
  assertNotEqual: function(expected, actual) {
    var message = arguments[2] || "assertNotEqual";
    try { (expected != actual) ? this.pass() : 
      this.fail(message + ': got "' + actual.inspect() + '"'); }
    catch(e) { this.error(e); }
  },
  assertNull: function(object) {
    var message = arguments[1] || 'assertNull'
    try { (object==null) ? this.pass() : 
      this.fail(message + ': got "' + object.inspect() + '"'); }
    catch(e) { this.error(e); }
  },
  assertHidden: function(element) {
    var message = arguments[1] || 'assertHidden';
    this.assertEqual("none", element.style.display, message);
  },
  assertNotNull: function(object) {
    var message = arguments[1] || 'assertNotNull';
    this.assert(object != null);
  },
  assertVisible: function(element) {
    if(element == document) return;
    this.assertNotNull(element);
    // if it's not an element (just check parent) may be a text node for example
    if (element.style) {
      this.assertNotEqual("none", element.style.display, element.inspect() + " should be visible");
    }
    this.assertVisible(element.parentNode);
  }
}

Test.Unit.Testcase = Class.create();
Object.extend(Object.extend(Test.Unit.Testcase.prototype, Test.Unit.Assertions.prototype), {
  initialize: function(name, test, setup, teardown) {
    Test.Unit.Assertions.prototype.initialize.bind(this)();
    this.name           = name;
    this.test           = test || function() {};
    this.setup          = setup || function() {};
    this.teardown       = teardown || function() {};
    this.isWaitingForAjax = false;
    this.ajaxTimeout    = 1000;
  },
  waitForAjax: function(nextPart) {
    this.isWaitingForAjax = true;
    this.test = nextPart;
  },
  run: function() {
    this.isWaitingForAjax = false;
    try {
      try {
        this.setup.bind(this)(); 
        this.test.bind(this)();
      } finally {
        if(!this.waitingForAjax) {
          this.teardown.bind(this)();
        }
      }
    }
    catch(e) { this.error(e); }
  }
});
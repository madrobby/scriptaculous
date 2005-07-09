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

Object.prototype.inspect = function(){
  var info = [];
  for(property in this)
    if(typeof this[property]!="function") 
      info.push(property + ' => "' + this[property] + '"');
  return ("'" + this + "' #" + typeof this + 
    ": {" + info.join(", ") + "}");
}

function h(string) {
  return string.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

Test = {}
Test.Unit = {};

Test.Unit.Runner = Class.create();
Test.Unit.Runner.prototype = {
  initialize: function(testcases, log) {
    this.log_element = $(log) || false;
    this.testcases   = [];
    for(testcase in testcases) {
      if(/^test_/.test(testcase)) {
      this.log("Running test case " + testcase + "...");
      var test = new Test.Unit.Testcase(testcases[testcase]);
      test.run();
      this.log("Finished test case " + testcase + ":");
      this.log(test.asserts.summary()+"\n");
      this.testcases.push(test);
      }
    }
    this.log(this.summary());
  },
  log: function(message) {
    if(this.log_element)
      this.log_element.innerHTML += h(message).replace(/\n/,"<br/>") + "<br/>";
  },
  summary: function() {
    var tests = 0;
    var assertions = 0;
    var failures = 0;
    var errors = 0;
    var messages = [];
    for(var i=0;i<this.testcases.length;i++) {
      tests++;
      assertions +=   this.testcases[i].asserts.assertions;
      failures   +=   this.testcases[i].asserts.failures;
      errors     +=   this.testcases[i].asserts.errors;
    }
    return (
      tests + " tests, " + 
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
    this.messages.push(error.name + ": "+ error.message);
  },
  assert: function(boolean_var) {
    try { boolean_var ? this.pass() : 
      this.fail(arguments[1] || 'assert: got "' + boolean_var.inspect() + '"'); }
    catch(e) { this.error(e); }
  },
  assert_equal: function(expected, actual) {
    try { (expected == actual) ? this.pass() : 
      this.fail(arguments[2] || 'assert_equal: expected "' + expected.inspect() + 
        '", actual "' + actual.inspect() + '"'); }
    catch(e) { this.error(e); }
  },
  assert_not_equal: function(expected, actual) {
    try { (expected != actual) ? this.pass() : 
      this.fail(arguments[2] || 'assert_no_equal: got "' + actual.inspect() + '"'); }
    catch(e) { this.error(e); }
  },
  assert_null: function(object_var) {
    try { (typeof object_var==null) ? this.pass() : 
      this.fail(arguments[1] || 'assert_null: got "' + object_var.inspect() + '"'); }
    catch(e) { this.error(e); }
  }
}

Test.Unit.Testcase = Class.create();
Test.Unit.Testcase.prototype = {
  initialize: function() {
    this.asserts = new Test.Unit.Assertions();
    this.tests   = arguments[0] || function() {};
  },
  run: function() {
    try { this.tests.bind(this.asserts)(); }
    catch(e) { this.asserts.error(e); }
  }
}
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

/*--------------------------------------------------------------------------*/

var Builder = {
  node: function(elementName) {
    var element = document.createElement(elementName);

    // attributes (or text)

    if(arguments[1]) {
      if(this._isStringOrNumber(arguments[1]) ||
         (typeof arguments[1]=='object' && 
           arguments[1].constructor.toString().indexOf('Array')>0))
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
          attribute=='klass' ? 'class' : attribute,
          attributes[attribute]);
  },
  _children: function(element, children) {
    if(typeof children=='object') { // array can hold nodes and text
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

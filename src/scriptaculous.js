Scriptaculous = {
  Version: '1.5_pre1',
  require: function(libraryName) {
    // inserting via DOM fails in Safari 2.0, so brute force approach
    document.write('<script type="text/javascript" src="'+libraryName+'"></script>');
  },
  load: function() {
    // fixme: check for prototype version number
    if(typeof Prototype=='undefined') 
      throw("script.aculo.us requires the Prototype JavaScript framework >= 1.4.0");
    var scriptTags = document.getElementsByTagName("script");
    for(var i=0;i<scriptTags.length;i++) {
      if(scriptTags[i].src && scriptTags[i].src.match(/scriptaculous\.js$/)) {
        var path = scriptTags[i].src.replace(/scriptaculous\.js$/,'');
        this.require(path + 'util.js');
        this.require(path + 'effects.js');
        this.require(path + 'dragdrop.js');
        this.require(path + 'controls.js');
      }
    }
  }
}

Scriptaculous.load();
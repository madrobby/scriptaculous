// Copyright (c) 2005-2007 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
//
// Based on code created by Jules Gravinese (http://www.webveteran.com/)
//
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

Sound = {
  tracks: {},
  template: 
    new Template('<embed id="sound_#{track}_#{id}" src="#{url}" loop="false" autostart="true" hidden="true"/>'),
  play: function(url){    
    var options = Object.extend({
      track: 'global', url: url, replace: false
    }, arguments[1] || {});
    
    if(options.replace && this.tracks[options.track]) {
      $R(0, this.tracks[options.track].id).each(function(id){
        var sound = $('sound_'+options.track+'_'+id);
        sound.Stop && sound.Stop();
        sound.remove();
      })
      this.tracks[options.track] = null;
    }
      
    if(!this.tracks[options.track])
      this.tracks[options.track] = { id: 0 }
    else
      this.tracks[options.track].id++;
      
    options.id = this.tracks[options.track].id;
    if (Prototype.Browser.IE) {
      var sound = document.createElement('bgsound');
      sound.setAttribute('id','sound_'+options.track+'_'+options.id);
      sound.setAttribute('src',options.url);
      sound.setAttribute('loop','1');
      sound.setAttribute('autostart','true');
      $$('body')[0].appendChild(sound);
    }  
    else
      new Insertion.Bottom($$('body')[0], Sound.template.evaluate(options));
  }
};

(function(){
  if(Prototype.Browser.Gecko && (navigator.platform.indexOf("Win") > 0) && navigator.plugins) { 
    var hasQuicktime = false;
    for (i=0; i<navigator.plugins.length; i++ )
	    if(navigator.plugins[i].name.indexOf("QuickTime") >= 0) hasQuicktime = true;
	  if(!hasQuicktime) Sound.play = function(){};
	}
})();

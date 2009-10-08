#mostly borrowed from the rails Rakefile

require 'rake'

PKG_NAME        = 'scriptaculous-js'
PKG_BUILD       = ENV['PKG_BUILD'] ? '.' + ENV['PKG_BUILD'] : ''
PKG_TIMESTAMP   = Time.new.to_s
PKG_VERSION     = '1.8.3' + PKG_BUILD
PKG_FILE_NAME   = "#{PKG_NAME}-#{PKG_VERSION}"
PKG_DESTINATION = ENV["PKG_DESTINATION"] || "dist"

RAILS_RAILTIES   = (ENV["RAILS_ROOT"] || '../rails-trunk') + '/railties/html/javascripts'
RAILS_ACTIONVIEW = (ENV["RAILS_ROOT"] || '../rails-trunk') + '/actionpack/lib/action_view/helpers/javascripts'

desc "Default Task"
task :default => [ :clean, :fresh_scriptaculous, :package ]

task :clean do
  rm_rf PKG_DESTINATION
end

PKG_FILES = FileList[
  'CHANGELOG',
  'README.rdoc',
  'MIT-LICENSE',
  'lib/prototype.js',
  'test/**/*.html',
  'test/**/*.css',
  'test/**/*.png',
  'test/**/*.mp3'
]

SRC_FILES = FileList[
  'src/scriptaculous.js',
  'src/dragdrop.js',
  'src/effects.js',
  'src/controls.js',
  'src/unittest.js',
  'src/builder.js',
  'src/slider.js',
  'src/sound.js',
  'src/unittest.js'
]

RAILS_FILES = FileList[
  'src/effects.js',
  'src/dragdrop.js',
  'src/controls.js'
]

DIRS = %w( src lib test test/functional test/unit  )

desc "Make a ready-for-packaging distribution dir"
task :fresh_scriptaculous do 
  mkdir PKG_DESTINATION
  mkdir File.join(PKG_DESTINATION, PKG_FILE_NAME)
  mkdir_p DIRS.map { |dir| File.join(PKG_DESTINATION, PKG_FILE_NAME, dir) }
  PKG_FILES.each { |file| cp file, File.join(PKG_DESTINATION, PKG_FILE_NAME, file) }  
  SRC_FILES.each do |file|
    File.open(File.join(PKG_DESTINATION, PKG_FILE_NAME, file), 'w+') do |dist|
      dist << ('// script.aculo.us '+File.basename(file)+' v'+PKG_VERSION+", "+PKG_TIMESTAMP+"\n\n")
      dist << File.read(file)
    end
  end
end

desc "Packages the fresh script.aculo.us scripts"
task :package do
  system %{cd #{PKG_DESTINATION}; tar -czvf #{PKG_FILE_NAME}.tar.gz #{PKG_FILE_NAME}}
  system %{cd #{PKG_DESTINATION}; zip -r #{PKG_FILE_NAME}.zip #{PKG_FILE_NAME}}
  system %{cd #{PKG_DESTINATION}; tar -c #{PKG_FILE_NAME} | bzip2 --best  > #{PKG_FILE_NAME}.tar.bz2 }
end

desc "Update rails trunk to latest script.aculo.us"
task :update_rails do
  RAILS_FILES.each do |file|
    cp file, File.join(RAILS_RAILTIES, File.basename(file))
    cp file, File.join(RAILS_ACTIONVIEW, File.basename(file))
  end
end

require 'src/javascripttest'
desc "Runs all the JavaScript unit tests and collects the results"
JavaScriptTestTask.new(:unittest) do |t|
  t.mount("/lib")
  t.mount("/src")
  t.mount("/test")
  
  t.run("/test/unit/loading_test.html")
  t.run("/test/unit/unittest_test.html")
  t.run("/test/unit/bdd_test.html")
  t.run("/test/unit/effects_test.html")
  t.run("/test/unit/ajax_autocompleter_test.html")
  t.run("/test/unit/ajax_inplaceeditor_test.html")
  t.run("/test/unit/slider_test.html")
  t.run("/test/unit/string_test.html")
  t.run("/test/unit/builder_test.html")
  t.run("/test/unit/element_test.html")
  t.run("/test/unit/dragdrop_test.html")
  t.run("/test/unit/sortable_test.html")
  t.run("/test/unit/position_clone_test.html")
  
  t.browser(:safari)
  t.browser(:firefox)
  t.browser(:ie)
  t.browser(:konqueror)
end
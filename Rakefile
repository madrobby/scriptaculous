#mostly borrowed from the rails Rakefile

require 'rake'

PKG_NAME        = 'scriptaculous-js'
PKG_BUILD       = ENV['PKG_BUILD'] ? '.' + ENV['PKG_BUILD'] : ''
PKG_VERSION     = '1.0' + PKG_BUILD
PKG_FILE_NAME   = "#{PKG_NAME}-#{PKG_VERSION}"
PKG_DESTINATION = ENV["RAILS_PKG_DESTINATION"] || "dist"

desc "Default Task"
task :default => [ :clean, :fresh_scriptaculous, :package ]

task :clean do
  rm_rf PKG_DESTINATION
end

PKG_FILES = FileList[
  'CHANGELOG',
  'README',
  'MIT-LICENSE',
  'src/dragdrop.js',
  'src/effects.js',
  'src/controls.js'
]

desc "Make a ready-for-packaging distribution dir"
task :fresh_scriptaculous do 
  mkdir PKG_DESTINATION
  mkdir File.join(PKG_DESTINATION, PKG_FILE_NAME)
  mkdir File.join(PKG_DESTINATION, PKG_FILE_NAME, "src")
  PKG_FILES.each { |file| cp_r file, File.join(PKG_DESTINATION, PKG_FILE_NAME, file) }
end

desc "Packages the fresh script.aculo.us scripts"
task :package do
  system %{cd #{PKG_DESTINATION}; tar -czvf #{PKG_FILE_NAME}.tar.gz #{PKG_FILE_NAME}}
  system %{cd #{PKG_DESTINATION}; zip -r #{PKG_FILE_NAME}.zip #{PKG_FILE_NAME}}
  system %{cd #{PKG_DESTINATION}; tar -c #{PKG_FILE_NAME} | bzip2 --best  > #{PKG_FILE_NAME}.tar.bz2 }
end


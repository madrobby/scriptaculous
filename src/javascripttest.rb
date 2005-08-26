require 'rake/tasklib'
require 'thread'
require 'webrick'

class Browser
  def setup ; end
  def open(url) ; end
  def teardown ; end

  def applescript(script)
    system "osascript -e '#{script}' 2>&1 >/dev/null"
  end
end

class FirefoxBrowser < Browser
  def visit(url)
    applescript('tell application "Firefox" to Get URL "' + url + '"')
  end

  def to_s
    "Firefox"
  end
end

class SafariBrowser < Browser
  def setup
    applescript('tell application "Safari" to make new document')
  end

  def visit(url)
    applescript('tell application "Safari" to set URL of front document to "' + url + '"')
  end

  def teardown
    #applescript('tell application "Safari" to close front document')
  end

  def to_s
    "Safari"
  end
end

# shut up, webrick :-)
class ::WEBrick::HTTPServer
  def access_log(config, req, res)
    # nop
  end
end
class ::WEBrick::BasicLog
  def log(level, data)
    # nop
  end
end

class JavaScriptTestTask < ::Rake::TaskLib

  def initialize(name=:test)
    @name = name
    @tests = []
    @browsers = []

    @queue = Queue.new

    result = []

    @server = WEBrick::HTTPServer.new(:Port => 4711) # TODO: make port configurable
    @server.mount_proc("/results") do |req, res|
      @queue.push(req.query['result'])
      res.body = "OK"
    end
    yield self if block_given?
    define
  end

  def define
    task @name do
      trap("INT") { @server.shutdown }
      t = Thread.new { @server.start }

      # run all combinations of browsers and tests
      @browsers.each do |browser|
        browser.setup
        @tests.each do |test|
          browser.visit("http://localhost:4711#{test}?resultsURL=http://localhost:4711/results&t=" + ("%.6f" % Time.now.to_f))
          result = @queue.pop
          puts "#{test} on #{browser}: #{result}"
        end
        browser.teardown
      end

      @server.shutdown
      t.join
    end
  end

  def mount(path, dir=nil)
    dir = Dir.pwd + path unless dir

    @server.mount(path, WEBrick::HTTPServlet::FileHandler, dir)
  end

  # test should be specified as a url
  def run(test)
    @tests<<test
  end

  def browser(browser)
    browser =
      case(browser)
        when :firefox
          FirefoxBrowser.new
        when :safari
          SafariBrowser.new
        else
          browser
      end

    @browsers<<browser
  end
end


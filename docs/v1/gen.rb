require 'pathname'

Dir.chdir __dir__
Dir.chdir '..' until File.exist? '.git' or Pathname(Dir.pwd).root?

if Pathname(Dir.pwd).root?
  warn 'can not find any git repo'
  warn 'please do git clone instead of downloading the source code'
  exit
end

def main
  `git ls-files -z **/Router.ts`.split(?\0).each { |e| parse_router_entry e }
  render_doc
end

@routes = []

def parse_router_entry filename
  code = File.read filename
  offset = 0
  while (i = code.index 'Object.freeze({', offset)
    i += 'Object.freeze('.size
    j = code.index '}', i
    conf = code[i..j]
    meth = conf.match(/method:\s*"([^"]+)"/)[1].upcase
    path = conf.match(/path:\s*"([^"]+)"/)[1]
    handler = conf.match(/handler:\s*(\w+)/)[1]
    auth = conf.match?(/auth:\s*true/)
    schema = conf.match(/schema:\s*(\w+)/)&.to_a&.slice(1)
    req, res = parse_req_res filename, code, handler, schema
    @routes << [meth, path, handler, auth, schema, req, res, filename]
    offset = j + 1
  end
end

def parse_req_res filename, code, handler, schema
  relpath = code.match(/import.*\b#{handler}\b.*from\s*['"]([^'"]+)/)[1]
  path = File.expand_path relpath, File.dirname(filename)
  if File.exist? "#{path}.ts"
    path = "#{path}.ts"
  else
    path = "#{path}/index.ts"
  end
  code = File.read path
  req = parse_req filename, code
  res = parse_res filename, code
  return req, res
end

def parse_req filename, code
  schema = code.match(/FastifySchema<({[^}]+})>/)&.to_a&.slice(1)
  return {} if schema.nil?
  extract = -> key { schema.match(/\b#{key}:\s*(\w+)/)&.to_a&.slice(1) }
  interface = -> name { code[/^interface\s+#{name}\s*{[^}]+}/] }
  req = {}
  if (body = extract['body'])
    req[:body] = interface[body]
  end
  if (query = extract['querystring'])
    req[:query] = interface[query]
  end
  if (params = extract['params'])
    req[:params] = interface[params]
  end
  req
end

def parse_res filename, code
  offset = 0
  res = []
  while (i = code.index 'reply.send({', offset)
    i += 'reply.send('.size
    j = code.index '})', i
    res.push dedent code[i..j]
    offset = j + 1
  end
  res
end

def dedent code
  lines = code.lines(chomp: true)
  indent = lines[-1][/^\s*/].size
  lines = [lines[0]] + lines[1..].map { |e| e[indent..] }
  lines.join ?\n
end

def indent code, prefix='  '
  code.lines(chomp: true).map { |e| prefix + e }.join ?\n
end

def render_doc
  puts "```"
  @routes.each do |meth, path, handler, auth, schema, req, res, filename|
    puts "#{meth} #{path} (#{handler})#{auth ? ' [auth]' : ''}"
    %i(params query body).each do |key|
      if req[key]
        puts "#{key}:", indent(req[key])
      end
    end
    puts "results:"
    res.uniq.each do |e|
      puts indent e
    end
    puts
  end
  puts "```"
end

main if __FILE__ == $0

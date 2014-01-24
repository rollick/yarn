# modified from http://stackoverflow.com/a/15867999

require 'rubygems'
require 'open-uri'

desc "Backup the live db to local ./dump folder"
task :backup_live_db do
  passwd = ENV['YARN_PASSWD']
  if passwd
    uri = `YARN_PASSWD=#{passwd} expect -c 'spawn meteor mongo yarn --url; sleep 5; expect -re "Password"; send "$env(YARN_PASSWD)\r\n"; set timeout -1; expect -re "mongodb";'`
  else
    uri = `meteor mongo yarn --url`
  end
  pass = uri.match(/client-.*:([^@]+)@/)[1]
  domain = uri.match(/@(.*):\d/)[1]
  port = uri.match(/@.*:(\d.*)\//)[1]
  puts "Using live db password: #{pass}"
  `mongodump -h #{domain}:#{port} -d yarn_meteor_com -u client -p #{pass}`
end

desc "Copy live database to local"
task :copy_live_db => :backup_live_db do
  server =  `meteor mongo --url`
  uri = URI.parse(server)
  `mongorestore --host #{uri.host} --port #{uri.port} --db meteor --drop dump/yarn_meteor_com/`
end

desc "Restore last backup"
task :restore do
  server =  `meteor mongo --url`
  uri = URI.parse(server)
  `mongorestore --host #{uri.host} --port #{uri.port} --db meteor --drop dump/yarn_meteor_com/`
end
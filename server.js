// Load the http module to create an http server.
var http = require('http');
var Router = require('node-simple-router');
var Docker = require('dockerode');
var sh = require('sh');
var xmpp = require('simple-xmpp');
xmpp.on('error', function(err) {
            console.error(err);
});
xmpp.connect({
                jid                 : 'YOURNAME@gmail.com',
                password            : 'PASSWORD',
                host                : 'talk.google.com',
                port                : 5222
});


var router = Router();
// Configure our HTTP server to respond with Hello World to all requests.
router.get("/hello", function(request, response) {
	//console.log(request);
	response.writeHead(200, {"Content-Type": "text/plain"});
	response.write("User: " + request.get.id +" "+ request.get.title + "\n");
	response.write('Hello World\n');
	xmpp.send('philipzheng@gmail.com', new Date().toLocaleTimeString() + ' id:' + request.get.id  + ' title:' + request.get.title);
	response.end();
});
router.get("/", function(request, response) {
	response.writeHead(200, {"Content-Type": "text/plain"});
	response.write("index!!!\n");
	response.end();
});

router.post("/hook", function(request, response) {
	var dockerrepo = request.body.repository;
	console.log(dockerrepo.owner);
	console.log(dockerrepo.repo_name);
	if (dockerrepo.owner == "philipz" && dockerrepo.status == "Active"){
		for (i = 1; i < 5; i++) {
			sh('machine url azure' + i ).result(function(output) {
				runContainer(output, dockerrepo.repo_name, 'www');
			});
		}
	}
	xmpp.send('philipzheng@gmail.com', new Date().toLocaleTimeString() + ' Repo:' + dockerrepo.repo_name  + ' Status:' + dockerrepo.status);
	
	var result = {
		state: "success",
		description: "PASSED",
		context: "Continuous integration by Philipz",
		target_url: "http://hooker.dockware.io/hello?id=philipz&title=hacker"
	};
	var json = JSON.stringify(result);
	response.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': json.length});
	console.log(json);
	response.write(json);
	response.end();
});

function runContainer(output,repo_name,name) {
	var host = output.substring(6).split(':');
	var docker = new Docker({
		host: host[0],
      		port: 4243
	});
	docker.pull(repo_name + ':latest', function (err, stream) {  
		stream.on('data', function(chunk) {
			//console.log('got %d bytes of data', chunk.length);
		})
		stream.on('end', function() {
	  		console.log(host[0] + ' ' + repo_name + ' Pull Finish!!!');
	var container_old = docker.getContainer(name);
	container_old.stop(function (err, data) {
		console.log(host[0] + ' ' + name + ' Container Stop!!!');
		container_old.remove(function (err, data) {
		console.log(data);
		console.log(host[0] + ' ' + name + ' Container Remove!!!');
	docker.createContainer({Image: repo_name + ':latest', name: name}, function(err, container) {
		if (container != null) {
		container.start({"PortBindings": {"80/tcp": [
               		{"HostPort": "80"}
            		]}}, function(err, data) {
	  		console.log(host[0] + ' ' + name + ' Container Create & Start!!!');
        	});
		} else {
	  		console.log(host[0] + ' ' + name + ' Container is NULL!!!');
		}
	});
	});
	});

		});
	});
}
var server = http.createServer(router);
server.listen(8000);
// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8000/");

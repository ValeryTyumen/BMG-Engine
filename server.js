var http = require('http');
var https = require('https');
var WebSocketServer = require('websocket').server;
var url = require('url');
var path = require('path');
var fs = require('fs');


var mimeTypes = {
	'html': 'text/html',
	'jpeg': 'image/jpeg',
	 'jpg': 'image/jpeg',
	 'png': 'image/png',
	  'js': 'text/javascript',
	 'css': 'text/css'
};

var server = http.createServer(function(request, response) {
	console.log((new Date()) + ' Received request for ' + request.url);
	
	var uri = url.parse(request.url).pathname;
	var filename = path.join(process.cwd(), uri);
	
	fs.exists(filename, function(exists) {
		if(!exists) {
			console.log('not exists: ' + filename);
			response.writeHead(404);
			response.end();
			return;
		}
		var ext = path.extname(filename).split('.');
		var mimeType = mimeTypes[ext[ext.length - 1]];
		response.writeHead(200, {'Content-Type': mimeType});

		var readStream = fs.createReadStream(filename);
		readStream.pipe(response);
	});
})

server.listen(8080, function() {
	console.log((new Date()) + ' Server listening on port 80');
})

var wsServer = new WebSocketServer({
	httpServer: server
	//,
	//BAD FOR PRODUCTION
	//autoAcceptConnections: false
});



var interval = 50;
var connections = [];
var iter = 0;
var state = '{}';


function broadcastState() {
	Object.keys(connections).forEach(function(id) {
		state['clientId'] = id;
		connections[id].sendUTF(state);
	});
	state = '{}';
	if (connections.length != 0)
		setTimeout(broadcastState, interval);
}


wsServer.on('request', function(request) {
	
	var conn = request.accept('echo-protocol', request.origin);
	var id = iter++;
	connections[id] = conn;
	if (connections.length == 1)
		broadcastState();

	console.log((new Date()) + ' Connection accepted.');

	conn.on('message', function(message) {
		var data = message.utf8Data;
		//console.log('Got message: ' + data);
		try {
			var playerState = JSON.parse(data);
			var stateObject = JSON.parse(state);
			stateObject[id] = playerState;
			state = JSON.stringify(stateObject);
		} catch(error) {
			console.log((new Date()) + ' Parse error from player ' + id + '.');
		}
	});

	conn.on('close', function(reasonCode, description) {
		console.log((new Date()) + ' Peer ' + conn.remoteAddress + ' disconnected.');
		delete connections[id];
	});
});



var http = require('http');
var https = require('https');
var WebSocketServer = require('ws').Server;
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
	console.log((new Date()) + ' Server listening on port 8080');
})

var wss = new WebSocketServer({ port: 8081 });

var interval = 50;
var c = 100;
var connections = [];
var iter = 0;
var state = {};


function broadcastState() {
	wss.clients.forEach(function(client) {
		client.send(JSON.stringify(state));
	});
	console.log((new Date()) +  ' broadcasted state: ' + JSON.stringify(state));
	state = {};
	if (wss.clients.length != 0)
		setTimeout(broadcastState, interval);
}

function randFloat(low, high) {
	return (high - low) * Math.random() + low;
}

function createPlayerState() {
	var playerState = {};
	playerState.color = 0xffffff * Math.random();
	playerState.position = {
		x: randFloat(-10, 10),
		y: 5,
		z: randFloat(-10, 10)
	};
	playerState.rotation = {
		x: 0,
		y: randFloat(0, 10),
		z: 0
	};
	return playerState;
}

wss.on('connection', function connection(ws) {
	var id = iter++;
	var newPlayerState = createPlayerState();
	var newState = {'clientId': id};
	newState[id] = newPlayerState;
	console.log((new Date()) + ' Init player: ' + JSON.stringify(newState));
	ws.send(JSON.stringify(newState));
	if (wss.clients.length == 1)
		broadcastState();

	console.log((new Date()) + ' Connection accepted.');

	ws.on('message', function(message) {
		var data = message;
		try {
			var playerState = JSON.parse(data);
			state[id] = playerState;
		} catch(error) {
			console.log((new Date()) + ' Parse error from player ' + id + '.');
		}
	});

	ws.on('close', function() {
		console.log((new Date()) + ' Peer disconnected.');
	});
});
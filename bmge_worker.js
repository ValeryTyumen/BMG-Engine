var url = document.URL;
var wsAddress = url.replace(/^http/, 'ws');
var webSocket = new WebSocket(wsAddress, 'echo-protocol');

webSocket.onopen = function(event) {};

webSocket.onmessage = function(event) {
	postMessage(JSON.parse(event.data));
};

onmessage = function(event) {
	var data = event.data;
	data['time'] = (new Date()).now();
	webSocket.send(JSON.stringify(event.data));
}

webSocket.onclose = function(event) {};

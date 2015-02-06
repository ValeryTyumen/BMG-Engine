var onFirstMessage = true;
onmessage = function(event) {
	if (onFirstMessage) {
		onFirstMessage = false;
		var url = event.data;
		var wsAddress = url.replace(/^http/, 'ws');
		var webSocket = new WebSocket(wsAddress, 'echo-protocol');

		webSocket.onopen = function(event) {
			webSocket.send('Fuck');
		};

		webSocket.onmessage = function(event) {
			postMessage(JSON.parse(event.data));
		};

		webSocket.onclose = function(event) {};
	} else {
		var data = event.data;
		data['time'] = (new Date()).now();
		webSocket.send(JSON.stringify(event.data));
	}
}
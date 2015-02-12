var onFirstMessage = true;
var webSocket;
onmessage = function(event) {
	if (onFirstMessage) {
		onFirstMessage = false;
		var url = event.data;
		var wsAddress = url.replace(/^http/, 'ws');
		webSocket = new WebSocket(wsAddress, 'echo-protocol');

		webSocket.onopen = function(event) {
		};

		webSocket.onmessage = function(event) {
			postMessage(event.data);
		};

		webSocket.onclose = function(event) {};
	} else {
		//webSocket.send(JSON.stringify(event.data));
		webSocket.send(event.data);
	}
}
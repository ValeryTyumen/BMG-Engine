var onFirstMessage = true;
var webSocket;
onmessage = function(event) {
	if (onFirstMessage) {
		onFirstMessage = false;
		var url = event.data;
		var wsAddress = url.replace(/^http/, 'ws');
		if (wsAddress.substr(wsAddress.length - 6, 5) == ':8080') {
			wsAddress = wsAddress.substr(0, wsAddress.length - 2) + '1';
		} else {
			wsAddress = wsAddress.substr(0, wsAddress.length - 5) + ':8081';
		}
		webSocket = new WebSocket(wsAddress, 'echo-protocol');

		webSocket.onopen = function(event) {
		};

		webSocket.onmessage = function(event) {
			postMessage(event.data);
		};

		webSocket.onclose = function(event) {};
	} else {
		webSocket.send(event.data);
	}
}
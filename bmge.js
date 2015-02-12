var players = {};
var spheres = {};
var playerId = -1;
var stateBuffer = [];
var bufferSize = 100;
var input;

function createPlayer(id, playerState, scene) {
	var geometry = new THREE.SphereGeometry(1, 32, 32);
	var material = Physijs.createMaterial(new THREE.MeshLambertMaterial(), .4, .5);
	spheres[id] = new Physijs.SphereMesh(geometry, material, 1);
	spheres[id].castShadow = true;
	players[id] = new THREE.Object3D();
	setPlayerState(id, playerState);
	scene.add(players[id]);
	scene.add(spheres[id]);
} 

//A kind of serialization, could be better
function setPlayerState(id, playerState) {
	var sphere = spheres[id];
	var player = players[id];
	sphere.position.set(playerState.position.x, playerState.position.y, playerState.position.z);
	sphere.rotation.set(playerState.rotation.x, playerState.rotation.y, playerState.rotation.z);
	player.position.set(playerState.position.x, playerState.position.y, playerState.position.z);
	//player.rotation.set(playerState.rotation.x, playerState.rotation.y, playerState.rotation.z);
	sphere.material.color = new THREE.Color(playerState.color);
}

function getPlayerState(id) {
	//console.log(spheres[id].position);
	var playerState = {};
	playerState['time'] = (new Date()).getTime();
	playerState.position = {};
	playerState.position.x = spheres[id].position.x;
	playerState.position.y = spheres[id].position.y;
	playerState.position.z = spheres[id].position.z;
	playerState.rotation = {};
	playerState.rotation.x = spheres[id].rotation.x;
	playerState.rotation.y = spheres[id].rotation.y;
	playerState.rotation.z = spheres[id].rotation.z;
	playerState.color = spheres[id].material.color.getHex();
	return playerState;
}

function setInput() {
	input = {
		straight: 0,
		side: 0
	};
	$(document).keydown(function(event) {
		if (playerId != -1) {
			switch (event.keyCode) {
				case 37: //left
					input.side = -1;
					break;
				case 38: //forward
					input.straight = 1;
					break;
				case 39: //right
					input.side = 1;
					break;
				case 40: //back
					input.straight = -1;
					break;
			}
		}
	});
	$(document).keyup(function(event) {
		if (playerId != -1) {
			var mesh = players[playerId];
			switch (event.keyCode) {
				case 37: //left
					input.side = 0;
					break;
				case 38: //forward
					input.straight = 0;
					break;
				case 39: //right
					input.side = 0;
					break;
				case 40: //back
					input.straight = 0;
					break;
			}
		}
	});
}

function createMultiplayer(scene) {
	setInput();
	if (typeof(Worker) == 'undefined') {
		alert('Sorry, no Web Workers support');
		return;
	}
	var worker = new Worker('bmge_worker.js');
	worker.postMessage(window.location.origin);
	worker.onmessage = function(event) {
		//try {
			var state = JSON.parse(event.data);
			if ('clientId' in state)
				playerId = state['clientId'];
			delete state['clientId'];
			stateBuffer.push(state);
			if (stateBuffer.length > bufferSize) {
				stateBuffer.shift(1);
			}
			Object.keys(state).forEach(function(id) {
				if (!(id in players)) {
					createPlayer(id, state[id], scene);
				}
			});
			setCameraPosition();
			var playerState = getPlayerState(playerId);
			worker.postMessage(JSON.stringify(playerState));
		//} catch(error) {}
	};
}

//method -> ['strict', 'optimistic', 'filtering']

function movePlayer() {
	if (input && playerId != -1) {
		var player = players[playerId];
		var sphere = spheres[playerId];
		player.position.copy(sphere.position);
		sphere.applyCentralImpulse(new THREE.Vector3(input.straight, 0, 0));
		sphere.applyCentralImpulse(new THREE.Vector3(0, 0, input.side));
	}
}

function setCameraPosition() {
	if (playerId != -1 && window.camera) {
		players[playerId].add(window.camera);
		window.camera.position.set(-10, 10, -10);
		window.camera.lookAt(new THREE.Vector3(0, 0, 0));
	}
}

function renderGame(method) {
	if (playerId != -1) {
		movePlayer();
		var cauchySurface = getCauchySurface(playerId, stateBuffer, method);
		Object.keys(stateBuffer[stateBuffer.length - 1]).forEach(function(id) {
			if (playerId != id) {
				var worldLine = getWorldLine(id, stateBuffer);
				var t0 = getCauchySurface(playerId, stateBuffer, 'strict')(new THREE.Vector3);
				var t1 = (new Date()).getTime();
				var t = findWorldLineIntersection(cauchySurface, worldLine, t0, t1, 15);
				setPlayerState(id, worldLine(t)); //NOT GOOD!!!!
			}
		});
	}
}

var players = {};
var spheres = {};
var playerId = -1;
var stateBuffer = [];
var bufferSize = 100;
var input;

function createPlayer(id, playerState, scene) {
	var geometry = new THREE.SphereGeometry(1, 32, 32);
	var material = Physijs.createMaterial(new THREE.MeshLambertMaterial({ color: 0xff00ff }), .4, 0);
	spheres[id] = new Physijs.SphereMesh(geometry, material, 1);
	spheres[id].castShadow = true;
	players[id] = new THREE.Object3D();
	setPlayerState(id, playerState);
	scene.add(players[id]);
	scene.add(spheres[id]);
} 

//A kind of serialization, could be better
function setPlayerState(id, playerState) {
	spheres[id].position.set(playerState.position.x, playerState.position.y, playerState.position.z);
	spheres[id].rotation.set(playerState.rotation.x, playerState.rotation.y, playerState.rotation.z);
	players[id].position.set(playerState.position.x, playerState.position.y, playerState.position.z);
	players[id].rotation.set(playerState.rotation.x, playerState.rotation.y, playerState.rotation.z);
	spheres[id].material.color = new THREE.Color(playerState.color);
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
	playerState.color = spheres[id].material.color;
	return playerState;
}

function setInput() {
	input = {
		move: 0,
		rotate: 0,
	};
	$(document).keydown(function(event) {
		if (playerId != -1) {
			switch (event.keyCode) {
				case 37: //left
					input.rotate = 1;
					break;
				case 38: //forward
					input.move = 1;
					break;
				case 39: //right
					input.rotate = -1;
					break;
				case 40: //back
					input.move = -1;
					break;
			}
		}
	});
	$(document).keyup(function(event) {
		if (playerId != -1) {
			var mesh = players[playerId];
			switch (event.keyCode) {
				case 37: //left
					input.rotate = 0;
					break;
				case 38: //forward
					input.move = 0;
					break;
				case 39: //right
					input.rotate = 0;
					break;
				case 40: //back
					input.move = 0;
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
		player.rotation.set(0, sphere.rotation.y, 0);
		sphere.setAngularVelocity(new THREE.Vector3(0, input.rotate, 0));
		//player.rotateOnAxis(new THREE.Vector3(0, 1, 0), input.rotate / 10000);
		var direction = (new THREE.Vector3(input.move, 0, 0)).applyQuaternion(player.quaternion.inverse());
		sphere.applyCentralImpulse(direction);
	}
}

function setCameraPosition() {
	if (playerId != -1 && window.camera) {
		players[playerId].add(window.camera);
		window.camera.position.set(-10, 5, 0);
		window.camera.lookAt(new THREE.Vector3(0, 0, 0));
	}
}

function renderGame(method) {
	if (playerId != -1) {
		movePlayer();
		var cauchySurface = getCauchySurface(playerId, stateBuffer[stateBuffer.length - 1], method);
		Object.keys(players).forEach(function(id) {
			if (playerId != id) {
				var worldLine = getWorldLine(id, stateBuffer);
				var t0 = getPlayerFirstAppear(id, stateBuffer);
				var t1 = (new Date()).getTime();
				var t = findWorldLineIntersection(cauchySurface, worldLine, t0, t1, 15);
				setPlayerState(id, worldLine(t)); //NOT GOOD!!!!
			}
		});
	}
}

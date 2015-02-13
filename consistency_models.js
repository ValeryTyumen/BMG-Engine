//http://0fps.net/2014/02/26/replication-in-networked-games-spacetime-consistency-part-3/
//three.js required

var c = 10; // #TODO remove

function findWorldLineIntersection(cauchySurface, worldLine, t0, t1, n) {
	for (var i = 0; i < n; i++) {
		t = (t0 + t1) / 2;
		var playerState = worldLine(t);
		var location = new THREE.Vector3(playerState.position.x, playerState.position.y, playerState.position.z);
		if (t > cauchySurface(location)) {
			t1 = t;
		} else {
			t0 = t;
		}
	}
	return t0;
}

//#TODO optimizing with binary search
function approximateLinearly(t, playerStates, valueKey) {
	if (t <= playerStates[0]['time']) {
		return playerStates[0][valueKey];
	}
	if (t >= playerStates[playerStates.length - 1]['time']) {
		return playerStates[playerStates.length - 1][valueKey];
	}
	var t_bound = playerStates.length - 1;
	while (t < playerStates[t_bound]['time']) {
		t_bound--;
	}
	var t1 = playerStates[t_bound]['time'];
	var t2 = playerStates[t_bound + 1]['time'];
	if (valueKey == 'position' || valueKey == 'rotation') {
		var x1 = playerStates[t_bound][valueKey].x;
		var y1 = playerStates[t_bound][valueKey].y;
		var z1 = playerStates[t_bound][valueKey].z;
		var x2 = playerStates[t_bound + 1][valueKey].x;
		var y2 = playerStates[t_bound + 1][valueKey].y;
		var z2 = playerStates[t_bound + 1][valueKey].z;
		return { 
			x: THREE.Math.mapLinear(t, t1, t2, x1, x2),
			y: THREE.Math.mapLinear(t, t1, t2, y1, y2),
			z: THREE.Math.mapLinear(t, t1, t2, z1, z2)
		};
	} else {
		var v1 = playerStates[t_bound][valueKey];
		var v2 = playerStates[t_bound + 1][valueKey];
		return THREE.Math.mapLinear(t, t1, t2, v1, v2);
	}
}



function getWorldLine(playerId, stateBuffer) {
	var playerStates = getPlayerStates(playerId, stateBuffer);
	if (playerStates.length == 0) {
		//#TODO
		console.log('No player states in buffer');
		return;
	} 
	return function(t) {
		var result = {'time': t};
		Object.keys(playerStates[0])
			.forEach(function(key) {
				//Seems to be not very good for int values, but maybe OK
				if (key != 'time') {
					result[key] = approximateLinearly(t, playerStates, key);
				}
			});
		return result;
	}
}

function getPlayerStates(playerId, stateBuffer) {
	var playerStates = [];
	for (var i = 0; i < stateBuffer.length; i++) {
		if (playerId in stateBuffer[i]) {
			playerStates.push(stateBuffer[i][playerId]);
		}
	}
	return playerStates;
}

//method -> ['strict', 'optimistic', 'filtering']
function getCauchySurface(playerId, stateBuffer, method) {
	var state;
	for (var i = stateBuffer.length - 1; i >= 0; i--) {
		if (playerId in stateBuffer[i]) {
			state = stateBuffer[i];
			break;
		}
	}
	function strictCauchySurface(location) {
		var minTime = -1;
		Object.keys(state).forEach(function(id) {
			if (minTime === -1 || minTime > state[id]['time']) {
				minTime = state[id]['time'];
			}
		});
		return minTime;
	}
	function optimisticCauchySurface(location) {
		return state[playerId]['time'];
	}
	function filteringCauchySurface(location) {
		var minValue = -1;
		Object.keys(state).forEach(function(id) {
			var playerLocation = new THREE.Vector3(state[id].x, state[id].y, state[id].z);
			var locationVector = new THREE.Vector3(location.x, location.y, location.z);
			var value = locationVector.sub(playerLocation).length() / window.c + state[id]['time'];
			if (minValue == -1 || minValue > value) {
				minValue = value;
			}
		});
		return minValue;
	}
	var surfaces = {
		'strict': strictCauchySurface,
		'optimistic': optimisticCauchySurface,
		'filtering': filteringCauchySurface
	};
	return surfaces[method];
}
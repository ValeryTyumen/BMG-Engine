//http://0fps.net/2014/02/26/replication-in-networked-games-spacetime-consistency-part-3/
//three.js required

function findWorldLineIntersection(cauchySurface, worldLine, t0, t1, n) {
	for (var i = 0; i < n; i++) {
		t = (t0 + t1) / 2;
		var playerState = worldLine(t);
		var location = new THREE.Vector3(playerState.x, playerState.y, playerState.z);
		if (t > cauchySurface(location)) {
			t1 = t;
		} else {
			t0 = t;
		}
	}
	return t0;
}

function getPlayerFirstAppear(playerId, stateBuffer) {
	var playerFirstAppear = 0;
	while (!(playerId in stateBuffer[playerFirstAppear])) {
		playerFirstAppear++;
	}
	return playerFirstAppear;
}

// Probable optimizing with binary search
function approximateLinearly(t, playerId, stateBuffer, valueKey) {
	var playerFirstAppear = getPlayerFirstAppear(playerId, stateBuffer);
	//This can be better, but maybe OK
	if (stateBuffer[playerFirstAppear][playerId]['time'] >= t) {
		return stateBuffer[playerFirstAppear][playerId][valueKey];
	}
	if (stateBuffer[stateBuffer.length - 1][playerId]['time'] <= t) {
		return stateBuffer[stateBuffer.length - 1][playerId][valueKey];
	}
	var t_bound = stateBuffer.length - 1;
	while (stateBuffer[t_bound][playerId]['time'] > t) {
		t_bound--;
	}
	var t1 = stateBuffer[t_bound][playerId]['time'];
	var t2 = stateBuffer[t_bound + 1][playerId]['time'];
	var v1 = stateBuffer[t_bound][playerId][valueKey];
	var v2 = stateBuffer[t_bound + 1][playerId][valueKey];
	return THREE.Math.mapLinear(t, t1, t2, v1, v2);
}


function getWorldLine(playerId, stateBuffer) {
	return function(t) {
		var result = {'time': t};
		Object.keys(stateBuffer[stateBuffer.length - 1][playerId])
			.forEach(function(key) {
				//Seems to be not very good for int values, but maybe OK
				if (key != 'time') {
					result[key] = approximateLinearly(t, playerId, stateBuffer, key);
				}
			});
		return result;
	}
}

//method -> ['strict', 'optimistic', 'filtering']
function getCauchySurface(playerId, state, method) {
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
			var value = locationVector.sub(playerLocation).length() / state.c + state[id]['time'];
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
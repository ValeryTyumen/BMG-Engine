var players = {};
var scene;
var state = {};

function createPlayer(color) {
	var geometry = new THREE.BoxGeometry(1, 1, 1);
	var material = new THREE.MeshLambertMaterial({ color: color });
	var cube = new THREE.Mesh(geometry, material);
	scene.add(cube);
	return cube;
}

var worker = new Worker('bmge_worker.js');

worker.onmessage = function(event) {
	try {
		state = JSON.parse(event.data);
		var playerId = state['clientId'];
		delete state['id'];
		state.keys().forEach(function(id) {
			if (!(id in players)) {
				players[id] = createPlayer(state[id]['color']);
			}
			if (id == playerId) {
				
			} else {
				
			}
		});
	} catch(error) {}
};

scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 40, 0);
directionalLight.target.position.set(0, 0, 0);
scene.add(directionalLight);
var ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);


var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 5;

var render = function() {
	requestAnimationFrame(render);

	cube.rotation.x += 0.1;
	cube.rotation.y += 0.1;

	renderer.render(scene, camera);
};

render();
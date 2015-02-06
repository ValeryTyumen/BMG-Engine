'use strict';
Physijs.scripts.worker = 'physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

/*window.onload = function() {
	if (typeof(Worker) == 'undefined') {
		alert('Sorry, no Web Workers support');
		return;
	}
	var worker = new Worker('bmge_worker.js');
	worker.postMessage(window.location.origin);
	worker.onmessage = function(event) {
		try {
			state = JSON.parse(event.data);
			playerId = state['clientId'];
			delete state['id'];
			Object.keys(state).forEach(function(id) {
				if (!(id in players)) {
					players[id] = createPlayer(state[id]['color']);
				}
				if (id == playerId) {

				} else {
					
				}
			});
		} catch(error) {}
	};
}
*/
var players = {};
var scene;
var camera;
var plane;
var playerId = -1;
var player = null;
var velocity;
var state = {};



function createPlayer(color) {
	var geometry = new THREE.BoxGeometry(10, 10, 10);
	var material = Physijs.createMaterial(new THREE.MeshBasicMaterial({ color: color }), 1, 1);
	var cube = new Physijs.BoxMesh(geometry, material);
	scene.add(cube);
	//cube.position.z = 60;
	console.log('fuck');
	return cube;
}

scene = new Physijs.Scene();
scene.setGravity(new THREE.Vector3(0, 0, -1));
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 40, 0);
directionalLight.target.position.set(0, 0, 0);
scene.add(directionalLight);
var ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

var planeGeometry = new THREE.PlaneBufferGeometry(20, 20);
var planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
plane = new Physijs.Mesh(planeGeometry, planeMaterial, 1, 1, 0);
plane.position.set(0, 0, 0);
scene.add(plane);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 100;

createPlayer(0xffff00).add(camera);

var render = function() {
	requestAnimationFrame(render);
	scene.simulate();
	if (playerId != -1) {
		player = players[playerId];
		player.add(camera);
		camera.position.set(0, 3, -3);
		camera.target.position.set(0, 1, 0);
	}

	renderer.render(scene, camera);
};
render();

scene.addEventListener(
			'update',
			function() {
				scene.simulate( undefined, 2 );
			}
		);

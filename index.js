'use strict';
Physijs.scripts.worker = 'physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var time = (new Date()).getTime();
var deltaTime = 0;
var scene;
var camera;
var plane;

scene = new Physijs.Scene;
scene.setGravity(new THREE.Vector3(0, -50, 0));
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 40, 0);
directionalLight.target.position.set(0, 0, 0);
scene.add(directionalLight);
var ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

var planeGeometry = new THREE.PlaneGeometry(100, 100, 0, 0);
var planeMaterial = Physijs.createMaterial(
	new THREE.MeshLambertMaterial({ color: 0xff00ff }),
	.8,
	0
);
plane = new Physijs.HeightfieldMesh(planeGeometry, planeMaterial, 0);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth * 3 / 4, window.innerHeight * 3 / 4);
$('#canvas-container').append(renderer.domElement);

function initGame() {	
	camera.position.y = 10;
	camera.position.z = 15;
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	var render = function() {
		requestAnimationFrame(render);
		scene.simulate();
		renderer.render(scene, camera);
	};
	render();

	createMultiplayer(scene);

	scene.addEventListener('update',
		function() {
			deltaTime = (new Date()).getTime() - time;
			time = (new Date()).getTime();
			//console.log(deltaTime);
			renderGame('filtering');
			scene.simulate( undefined, 2 );
		}
	);
}

$(initGame);
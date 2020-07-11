
const defaultObject = new THREE.Object3D();
const friction = 10;

function rand(min, max)
{
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

var entities = [];
class Entity
{
	constructor(obj, vel)
	{
		this.obj = (obj != null) ? obj : defaultObject;
		this.vel = vel != null ? vel : new THREE.Vector3(0, 0, 0);
		this.subUpdate = function(){};
		scene.add(this.obj);
		this.update = function()
		{
			this.subUpdate(this);
			var vel = this.vel;
			var obj = this.obj;
			obj.position.x += vel.x * delta;
			obj.position.y += vel.y * delta;
			obj.position.z += vel.z * delta;
		}
		entities.push(this);
	}
}

class Weapon extends Entity
{
	constructor(delay, speed, obj, pobj, owner)
	{
		super(obj);
		this.delay = delay;
		this.intClock = new THREE.Clock();
		this.intClock.start();
		this.pobj = pobj;
		this.owner = owner;
		this.update = function(){}
		this.primary = function()
		{
			if(this.intClock.getElapsedTime() > delay)
			{
				this.intClock.stop();
				var projg = this.pobj.clone(), vel = new THREE.Vector3();
				projg.position.x = this.owner.obj.position.x;
				projg.position.y = this.owner.obj.position.y;
				projg.position.z = this.owner.obj.position.z;
				vel.x = this.owner.obj.rotation.x * speed;
				vel.y = this.owner.obj.rotation.y * speed;
				vel.z = this.owner.obj.rotation.z * speed;
				var proj = new Entity(projg, vel);
				sounds[rand(0, sounds.length - 1)].play();
				this.intClock.start();
			}
		}
	}
}

var living = [];
class Living extends Entity
{
	constructor(ai, main, obj)
	{
		super(obj, new THREE.Vector3());
		if(main)
		{
			this.update = ai;
		}
		else
		{
			this.subUpdate = ai;
		}
		this.weapon = new Weapon(0.1, 30, null, objects["bullet"], this);
		living.push(this);
	}
}

class Enemy extends Living
{
	constructor(obj)
	{
		super(function(o)
		{
			if(this.obj.position.distanceTo(player.obj.position) < 70)
			{
				this.obj.lookAt(player.obj.position);
				var action = rand(0,2);
				if(action == 1)this.weapon.primary();
			}
		}, true, obj);
	}
}

var leftClick, rightClick;
class Player extends Living
{
	constructor()
	{
		super(function(o)
		{
			if(controls.enabled)
			{
				var vel = this.vel, obj = this.obj;
				vel.x -= vel.x * friction * delta;
				vel.y -= vel.y * friction * delta;
				vel.z -= vel.z * friction * delta;
				if (controls.moveForward) 
				{
					vel.z -= 400.0 * delta;
				}
				if(controls.moveBackward) 
				{
					vel.z += 400.0 * delta;
				}
				if(controls.moveLeft) 
				{
					vel.x -= 400.0 * delta;
				}
				if(controls.moveRight) 
				{
					vel.x += 400.0 * delta;
				}
				if(leftClick)
				{
					this.weapon.primary();
				}
				controls.getObject().translateX(vel.x * delta);
				controls.getObject().translateY(vel.y * delta);
				controls.getObject().translateZ(vel.z * delta);
				obj.position.x = controls.getObject().position.x;
				obj.position.y = camera.position.y;
				obj.position.z = controls.getObject().position.z;
				obj.rotation.x = camera.getWorldDirection().x;
				obj.rotation.y = camera.getWorldDirection().y;
				obj.rotation.z = camera.getWorldDirection().z;
			}
		}, true, null);
		var onmousedown = function(event)
		{
			if(event.button == 0)
			{
				leftClick = true;
			}
			if(event.button == 2)
			{
				rightClick = true;
			}
		}
		var onmouseup = function(event)
		{
			if(event.button == 0)
			{
				leftClick = false;
			}
			if(event.button == 2)
			{
				rightClick = false;
			}
		}
		document.onmousedown = onmousedown;
		document.onmouseup = onmouseup;
	}
}

function error(msg)
{
	console.log(msg);
}

function progress(xhr)
{
	console.log((xhr.loaded / xhr.total * 100) + "% loaded}");
}

var objects = {};
function loadOBJMTL(id, res, callback)
{
	var mtlLoader = new THREE.MTLLoader();
	mtlLoader.setTexturePath("res/models/" + res + "/");
	mtlLoader.setPath("res/models/" + res + "/");
	mtlLoader.load(res + ".mtl", function(materials) 
	{
		materials.preload();
		var objLoader = new THREE.OBJLoader();
		objLoader.setMaterials(materials);
		objLoader.setPath("res/models/" + res + "/");
		objLoader.load(res + ".obj", function(object) 
		{
			objects[id] = object;
			if(callback != null)
			{
				callback(object);
			}
		}, progress, error);
	}, progress, error);
}

var sunlight, ground;
function loadWorld()
{
	sunlight = new THREE.AmbientLight(0x606060);
	scene.add(sunlight);
	loadOBJMTL("bullet" ,"cube", function(o){o.scale.set(2, 2, 2); player = new Player();});
	loadOBJMTL("farm" ,"farmhouse_obj", function(o){o.scale.set(0.8, 0.8, 0.8); scene.add(o);});
	loadOBJMTL("skull" ,"skull", function(o){loadEnemies();});
	var materials = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture("res/textures/grass.jpg")});
	materials.side = THREE.DoubleSide;
	var geometry = new THREE.PlaneGeometry(100, 100);
	ground = new THREE.Mesh(geometry, materials);
	ground.material.side = THREE.DoubleSide;
	ground.rotation.x = Math.PI / 2;
	scene.add(ground);
}

function loadEnemies()
{
	for(var i = 0; i < 10; i++)
	{
		var obj = objects["skull"].clone();
		obj.receiveShadow = true;
		obj.position.x = rand(-100,100);
		obj.position.y = rand(0, 60);
		obj.position.z = rand(-100,100);
		new Enemy(obj); 
	}
}

var scene, camera, renderer, clock, controls, player;
var sounds = [];
function init()
{
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x373644);
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	clock = new THREE.Clock();
	controls = new THREE.FirstPersonControls(camera);
	scene.add(controls.getObject());
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	loadWorld();
	camera.position.y = 5;
	for(var i = 0; i < 6; i++)
	{
		sounds[i] = new Audio("res/sounds/" + i + ".mp3");
	}
}

var delta;
function animate() 
{
	delta = clock.getDelta();
	requestAnimationFrame(animate);
	for(var i = 0; i < entities.length; i++)
	{
		entities[i].update();
	}
	renderer.render(scene, camera);
}


init();
animate();
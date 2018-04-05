//canvas-asteroids.js ...........................................................

//common vars

let canvas;
let context;
let screenWidth;
let screenHeight;
let doublePI = Math.PI * 2;

//game vars

let ship;

let particlePool;
let particles;

let bulletPool;
let bullets;

let asteroidPool;
let asteroids;

let hScan;
let asteroidVelFactor = 0;

//keyboard vars

let keyLeft = false;
let keyUp = false;
let keyRight = false;
let keyDown = false;
let keySpace = false;

window.getAnimationFrame =
window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.oRequestAnimationFrame ||
window.msRequestAnimationFrame ||
function(callback)
{
	window.setTimeout(callback, 16.6);
};

window.onload = function()
{
	canvas = document.getElementById('canvas');
	context = canvas.getContext('2d');

	window.onresize();

	keyboardInit();
	bulletInit();
	asteroidInit();
	shipInit();

	loop();
};

window.onresize = function()
{
	if(!canvas) return;

	screenWidth = canvas.clientWidth;
	screenHeight = canvas.clientHeight;

	canvas.width = screenWidth;
	canvas.height = screenHeight;

	hScan = (screenHeight / 4) >> 0;
};

function keyboardInit()
{
	window.onkeydown = function(e)
	{
		switch(e.keyCode)
		{
			//key A or LEFT
			case 65:
			case 37:

			keyLeft = true;

			break;

			//key W or UP
			case 87:
			case 38:

			keyUp = true;

			break;

			//key D or RIGHT
			case 68:
			case 39:

			keyRight = true;

			break;

			//key S or DOWN
			case 83:
			case 40:

			keyDown = true;

			break;

			//key Space
			case 32:
       case 75:

			keySpace = true;

			break;
		}

    e.preventDefault();
	};

	window.onkeyup = function(e)
	{
		switch(e.keyCode)
		{
			//key A or LEFT
			case 65:
			case 37:

			keyLeft = false;

			break;

			//key W or UP
			case 87:
			case 38:

			keyUp = false;

			break;

			//key D or RIGHT
			case 68:
			case 39:

			keyRight = false;

			break;

			//key S or DOWN
			case 83:
			case 40:

			keyDown = false;

			break;

			//key Space
       case 75:
			case 32:

			keySpace = false;

			break;
		}

    e.preventDefault();
	};
}

function bulletInit()
{
	bulletPool = Pool.create(Bullet, 40);
	bullets = [];
}

function asteroidInit()
{
	asteroidPool = Pool.create(Asteroid, 30);
	asteroids = [];
}

function shipInit()
{
	ship = Ship.create(screenWidth >> 1, screenHeight >> 1, this);
}

function loop()
{
	updateShip();
	updateBullets();
	updateAsteroids();

	checkCollisions();

	render();

	getAnimationFrame(loop);
}

function updateShip()
{
	ship.update();

	if(ship.idle) return;

	if(keySpace) ship.shoot();
	if(keyLeft) ship.angle -= 0.1;
	if(keyRight) ship.angle += 0.1;

	if(keyUp)
	{
		ship.thrust.setLength(0.1);
		ship.thrust.setAngle(ship.angle);
	}
	else
	{
		ship.vel.mul(0.94);
		ship.thrust.setLength(0);
	}

	if(ship.pos.getX() > screenWidth) ship.pos.setX(0);
	else if(ship.pos.getX() < 0) ship.pos.setX(screenWidth);

	if(ship.pos.getY() > screenHeight) ship.pos.setY(0);
	else if(ship.pos.getY() < 0) ship.pos.setY(screenHeight);
}


function updateBullets()
{
	let i = bullets.length - 1;

	for(i; i > -1; --i)
	{
		let b = bullets[i];

		if(b.blacklisted)
		{
			b.reset();

			bullets.splice(bullets.indexOf(b), 1);
			bulletPool.disposeElement(b);

			continue;
		}

		b.update();

		if(b.pos.getX() > screenWidth) b.blacklisted = true;
		else if(b.pos.getX() < 0) b.blacklisted = true;

		if(b.pos.getY() > screenHeight) b.blacklisted = true;
		else if(b.pos.getY() < 0) b.blacklisted = true;
	}
}

function updateAsteroids()
{
	let i = asteroids.length - 1;

	for(i; i > -1; --i)
	{
		let a = asteroids[i];

		if(a.blacklisted)
		{
			a.reset();

			asteroids.splice(asteroids.indexOf(a), 1);
			asteroidPool.disposeElement(a);

			continue;
		}

		a.update();

		if(a.pos.getX() > screenWidth + a.radius) a.pos.setX(-a.radius);
		else if(a.pos.getX() < -a.radius) a.pos.setX(screenWidth + a.radius);

		if(a.pos.getY() > screenHeight + a.radius) a.pos.setY(-a.radius);
		else if(a.pos.getY() < -a.radius) a.pos.setY(screenHeight + a.radius);
	}

	if(asteroids.length < 5)
	{
		let factor = (Math.random() * 2) >> 0;

		generateAsteroid(screenWidth * factor, screenHeight * factor, 60 , 'b');
	}
}

function generateAsteroid(x, y, radius, type)
{
	let a = asteroidPool.getElement();

	//if the bullet pool doesn't have more elements, will return 'null'.

	if(!a) return;

	a.radius = radius;
	a.type = type;
	a.pos.setXY(x, y);
	a.vel.setLength(1 + asteroidVelFactor);
	a.vel.setAngle(Math.random() * (Math.PI * 2));

	//bullets[bullets.length] = b; same as: bullets.push(b);

	asteroids[asteroids.length] = a;
	asteroidVelFactor += 0.025;
}

function checkCollisions()
{
	checkBulletAsteroidCollisions();
	checkShipAsteroidCollisions();
}

function checkBulletAsteroidCollisions()
{
	let i = bullets.length - 1;
	let j;

	for(i; i > -1; --i)
	{
		j = asteroids.length - 1;

		for(j; j > -1; --j)
		{
			let b = bullets[i];
			let a = asteroids[j];

			if(checkDistanceCollision(b, a))
			{
				b.blacklisted = true;

				destroyAsteroid(a);
			}
		}
	}
}

function checkShipAsteroidCollisions()
{
	let i = asteroids.length - 1;

	for(i; i > -1; --i)
	{
		let a = asteroids[i];
		let s = ship;

		if(checkDistanceCollision(a, s))
		{
			if(s.idle) return;

			s.idle = true;

			destroyAsteroid(a);
		}
	}
}

function checkDistanceCollision(obj1, obj2)
{
	let vx = obj1.pos.getX() - obj2.pos.getX();
	let vy = obj1.pos.getY() - obj2.pos.getY();
	let vec = Vec2D.create(vx, vy);

	if(vec.getLength() < obj1.radius + obj2.radius)
	{
		return true;
	}

	return false;
}

function destroyAsteroid(asteroid)
{
	asteroid.blacklisted = true;

	resolveAsteroidType(asteroid);
}

function resolveAsteroidType(asteroid)
{
	switch(asteroid.type)
	{
		case 'b':

		generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 40, 'm');
		generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 40, 'm');

		break;

		case 'm':

		generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 20, 's');
		generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 20, 's');

		break;
	}
}

function render()
{
	context.globalAlpha = 0.4;
	context.fillRect(0, 0, screenWidth, screenHeight);
	context.globalAlpha = 1;

	renderShip();
	renderBullets();
	renderAsteroids();
}

function renderShip()
{
	if(ship.idle) return;

	context.save();
	context.translate(ship.pos.getX() >> 0, ship.pos.getY() >> 0);
	context.rotate(ship.angle);

	context.strokeStyle = '#FFF';
	context.lineWidth = 1;
	context.beginPath();
	context.moveTo(10, 0);
	context.lineTo(-10, -10);
	context.lineTo(-10, 10);
	context.lineTo(10, 0);
	context.stroke();
	context.closePath();
	context.fillStyle = '#DDD';
	context.fill();
	context.restore();
}

function renderBullets()
{
	//inverse for loop = more performance.

	let i = bullets.length - 1;

	for(i; i > -1; --i)
	{
		let b = bullets[i];

		context.beginPath();
		context.strokeStyle = b.color;
		context.arc(b.pos.getX() >> 0, b.pos.getY() >> 0, b.radius, 0, doublePI);
		if(Math.random() > 0.2) context.stroke();
		context.closePath();
	}
}

function renderAsteroids()
{
	//inverse for loop = more performance.

	let i = asteroids.length - 1;

	for(i; i > -1; --i)
	{
		let a = asteroids[i];

		context.beginPath();
		context.lineWidth = 4;
		context.strokeStyle = a.color;


		let j = a.sides;

		context.moveTo((a.pos.getX() + Math.cos(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0, (a.pos.getY() + Math.sin(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0);

		for(j; j > -1; --j)
		{
			context.lineTo((a.pos.getX() + Math.cos(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0, (a.pos.getY() + Math.sin(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0);

		}

		if(Math.random() > 0.2) context.stroke();

		context.closePath();
		
	}
}


function generateShot()
{
	let b = bulletPool.getElement();

	//if the bullet pool doesn't have more elements, will return 'null'.

	if(!b) return;

	b.radius = 1;
	b.pos.setXY(ship.pos.getX() + Math.cos(ship.angle) * 14, ship.pos.getY() + Math.sin(ship.angle) * 14);
	b.vel.setLength(10);
	b.vel.setAngle(ship.angle);

	//bullets[bullets.length] = b; same as: bullets.push(b);

	bullets[bullets.length] = b;
}

function resetGame()
{
	asteroidVelFactor = 0;

	ship.pos.setXY(screenWidth >> 1, screenHeight >> 1);
	ship.vel.setXY(0, 0);

	resetAsteroids();
}

function resetAsteroids()
{
	let i = asteroids.length - 1;

	for(i; i > -1; --i)
	{
		let a = asteroids[i];
		a.blacklisted = true;
	}
}

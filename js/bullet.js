let Bullet = (function()
{
	//exposed methods:

	let create = function()
	{
		let obj = Object.create(def);
		obj.radius = 4;
		obj.color = '#FFF';
		obj.pos = Vec2D.create(0, 0);
		obj.vel = Vec2D.create(0, 0);
		obj.blacklisted = false;

		return obj;
	};

	//Bullet definition:

	let def =
	{
		radius: null,
		color: null,
		pos: null,
		vel: null,
		blacklisted: null,

		update: function()
		{
			this.pos.add(this.vel);
		},

		reset: function()
		{
			this.blacklisted = false;
		}
	};

	return {create:create};
}());

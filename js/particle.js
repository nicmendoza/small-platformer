function Particle(game,type,stage,position,options){
	var self = this,
		maxDistance = 20;

	self.position = {};
	self.position.x = position.x;
	self.position.y = position.y;

	self.width = 20;
	self.height = 20;

	self.startPosition = {
		x: self.position.x,
		y: self.position.y
	};

	self.direction = options.direction;

	this.sprite = new Sprite({
			position: {
				x: 140,
				y: 0
			},
			size: {
				height: 20,
				width: 20
			},
			url: 'img/sprites.png',
			speed: 10,
			frames: [0,1]
		});

	this.onUpdate = function(){
		this.position.x+= (this.direction === 'left' ? -0.5 : 0.5);

		if(Math.abs( this.position.x - this.startPosition.x) > maxDistance ){
			stage.removeObject(self);
		}
	}

	stage.addObject(this);
	
}

Particle.prototype = new Item();
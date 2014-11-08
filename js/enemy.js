
function Enemy(game,options){

	var self = this;
	self.position = options.position || {
		x: options.x,
		y: options.y
	};
	self.game = game;
	self.width = 10;
	self.height = 10;

	self.options = options;

	self.maxMovementSpeed = 1;
	self.currentMovementSpeed = self.maxMovementSpeed;

	self.onUpdate = options.onUpdate;

	self.momentum = {
		x: 0,
		y: 0.1
	};

	self.lastPosition = {};

	self.direction = 'right';

	self.isMovingObject = true;

	this.stage = game.mainStage;

	self.drawTransformations = function(ctx){
		ctx.fillStyle = 'orange';
	};

	//if a type passed in, call the setup function in it
	if(options.type){
		self.types[options.type](self);
	}

	this.onInit && this.onInit.call(self);
}

Enemy.prototype = new Item();

Enemy.prototype.die = function(){

	if(this.isDead) return;
	this.isDead = true;
	this.height = 2;
	this.position.y += 8;
	this.momentum.x = 0;
	// hack to strop patrol updates
	delete this.onUpdate;
	return true;
};

Enemy.prototype.types = {

	jumping_jack: function(entity){
		entity.onUpdate = function(game){
			if(!this.isFalling && Math.random() * 100 > 95 ){
				this.momentum.y = -4
				this.position.y+= 0.1;
				this.momentum.x = -(this.momentum.x);
			}
		}
	},
	patrolling: function(entity){

		entity.onInit = function(game){
			// this is optional
			this.patrolStartX = this.position.x;
			this.momentum.x = 1;
		};

		entity.onUpdate = function(game){
			if(Math.abs(this.patrolStartX - this.position.x) >= this.options.patrol_distance || this.isAgainstWall() ){
				this.turnAround();
			}
		};

	}
}

function Enemy(options,game){

	var self = this;
	self.position = options.position;
	self.game = game;
	self.width = 10;
	self.height = 10;

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

	options.onInit && options.onInit.call(self);
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
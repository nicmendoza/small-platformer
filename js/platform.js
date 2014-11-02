function Platform(options,game,stage){
	var self = this;

	self.position = options.position;
	self.width = options.width;
	self.height = options.height;
	self.game = game;
	this.color = options.color;
	self.springiness = 0.2;

	this.stage = stage || game.mainStage;

	self.isOneWay = !!options.isOneWay;
	self.isObstacle = true;
	self.isMovingObject = false;

	self.canSupportPlayer = true;

	this.drawTransformations = function(ctx){
		ctx.fillStyle = self.color;
	};
}

Platform.prototype = new Item();
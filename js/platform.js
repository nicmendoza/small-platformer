function Platform(game,options){
	var self = this;

	self.position = options.position || {
		x: options.x,
		y: options.y
	};
	self.width = options.width;
	self.height = options.height;
	self.game = game;
	this.color = options.color || 'black';
	self.springiness = 0.2;

	this.stage = options.stage || game.mainStage;

	//options MUST be lower case because of SVG
	self.isOneWay = !!options.isoneway;
	self.isObstacle = true;
	self.isMovingObject = false;

	self.canSupportPlayer = true;

	this.drawTransformations = function(ctx){
		ctx.fillStyle = self.color;
	};
}

Platform.prototype = new Item();
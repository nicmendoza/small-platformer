function Platform(game,options){
	var self = this;

	self.options = options;

	self.position = options.position || {
		x: options.x,
		y: options.y
	};
	self.width = options.width;
	self.height = options.height;
	self.game = game;
	this.color = options.color || 'black';
	self.springiness = 0.2;

	//options MUST be lower case because of SVG
	self.isOneWay = !!options.isoneway;
	self.isObstacle = true;
	self.isMovingObject = false;

	self.canSupportPlayer = true;

	this.drawTransformations = function(ctx){
		ctx.fillStyle = self.color;
	};

	if(self.options.path){
		self.direction = 'forward';
		self.options.path = self.game.getAllEntities().filter(function(entity){
			return entity instanceof Line && entity.options.id === self.options.path
		})[0];
	}

}

Platform.prototype = new Item();

Platform.prototype.update = function(game){
	var self = this;
	if(!self.options.path)return;
	self.position = self.options.path.getPosition(self,game.timeSinceLastDraw);

};
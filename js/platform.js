function Platform(game,options){
	var self = this;

	self.options = options;

	self.position = options.position || {
		x: options.x,
		y: options.y
	};

	self.lastPosition = {
		x: self.position.x,
		y: self.position.y
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

		self.isMovingObject = true;
		self.direction = 'forward';
		self.path = self.game.getAllEntities().filter(function(entity){
			return entity instanceof Line && entity.options.id === self.options.path;
		})[0];

		self.lastOffset = {};

		self.push = function(object){
			object.position.x += self.lastOffset.x;

			//don't push things down (or through their own tops!)
			// if(self.lastOffset.y > 0 ){
			// 	debugger;
			// 	object.position.y += Math.min( self.lastOffset.y, self.position.y - ( object.position.y + object.height ) );
			// }
			if(self.lastOffset.y < 0){
				object.position.y += self.lastOffset.y;
			}
			
		};
	}

}

Platform.prototype = new Item();

Platform.prototype.update = function(game){
	var self = this,
		newPosition,isTurning;

	if(self.options.path) {

		newPosition = self.path.projectPosition(self, game.timeSinceLastDraw);
		// works but currently unused
		//isTurning = self.lastOffset ? !sameSign(self.lastOffset.y, newPosition.y - this.position.y) : false;
		self.lastOffset.x = newPosition.x - this.position.x;
		self.lastOffset.y = newPosition.y - this.position.y;

		self.momentum = {
			x: newPosition.x - this.position.x,
			y: newPosition.y - this.position.y
		};

	}

	Item.prototype.update.call(self);
	

};
// warning: doesn't work for -0
function sameSign(a,b){
	return ((a<0) === (b<0)); 
}
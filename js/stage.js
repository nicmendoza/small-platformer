function Stage(game,relativeMovementRatio,initialObjects,update){
	var self = this;

	self.objects = initialObjects || [];
	self.garbage = [];

	self.game = game;

	//this is really only used on the camera update call for now
	self.width = game.width;
	self.height = game.height;

	var originalUpdate = update.bind(self);
	self.update = function(player){
		originalUpdate(player);
		self.garbage.forEach(function(object){
			self.objects.splice(self.objects.indexOf(object),1);

		});
		self.garbage = [];
	};

	self.relativeMovementRatio = relativeMovementRatio || 1;

	self.position = {
		x: 0,
		y: 0
	};

	self.relativeMovementRatio = relativeMovementRatio;
}

Stage.prototype.addObject = function(object){
	this.objects.push(object);
	object.stage = this;
};

Stage.prototype.getRenderPosition = function(object){

	return {
		x: ( object.position.x + this.position.x ) * this.relativeMovementRatio,
		y: ( object.position.y + this.position.y ) * this.relativeMovementRatio
	};
};
function Stage(game,options){
	var self = this;

	self.objects = [];
	self.garbage = [];

	self.game = game;

	//this is really only used on the camera update call for now
	self.width = game.width;
	self.height = game.height;
	var originalUpdate = self.camera[options.camera || 'playerStageFollowing'].bind(self);
	self.update = function(player){
		originalUpdate(player);
		self.garbage.forEach(function(object){
			self.objects.splice(self.objects.indexOf(object),1);

		});
		self.garbage = [];
	};

	self.position = {
		x: 0,
		y: 0
	};

	self.relativeMovementRatio = options.distance || 1;
}

Stage.prototype.addObject = function(object){
	this.objects.push(object);
	object.position.x = object.position.x * ( 1 / this.relativeMovementRatio );
	object.position.y = object.position.y * ( 1 / this.relativeMovementRatio );
	object.stage = this;
};

Stage.prototype.getRenderPosition = function(object){
	return {
		x: ( object.position.x + this.position.x ) * this.relativeMovementRatio,
		y: ( object.position.y + this.position.y ) * this.relativeMovementRatio
	};
};

Stage.prototype.camera = {
	center: function(player){
		this.position.x = Math.min(0,-( player.position.x - this.width / 2 ));
	},
	nudge: function(player){

		var activeZoneWidth = 200,
			// get player's drawn location
			playerPositionX = this.getRenderPosition(player).x;

		if(playerPositionX < activeZoneWidth){
			this.position.x = Math.min(0, this.position.x + activeZoneWidth - playerPositionX) * this.relativeMovementRatio;
		} else if(playerPositionX > this.width - activeZoneWidth ) {
			this.position.x += (this.width - activeZoneWidth - playerPositionX) * this.relativeMovementRatio;
		};
	},
	playerStageFollowing: function(player){
		this.position.x = player.stage.position.x;
		this.position.y = player.stage.position.y
	}
};
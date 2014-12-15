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

		var activeZoneWidth = this.width / 3, // move camera if player within 1/3 width of edge of screen
			activeZoneHeight = this.height * 0.1, // move camera if player within top 10% of screen
			// get player's drawn location
			playerPosition = this.getRenderPosition(player);

		if(playerPosition.x < activeZoneWidth){
			this.position.x = Math.min(0, this.position.x + activeZoneWidth - playerPosition.x) * this.relativeMovementRatio;
		} else if(playerPosition.x > this.width - activeZoneWidth ) {
			this.position.x += (this.width - activeZoneWidth - playerPosition.x) * this.relativeMovementRatio;
		}

		if(this.game.player.position.y < activeZoneHeight){
			this.position.y = -( this.game.player.position.y - activeZoneHeight);
		} else {
			this.position.y = 0;
		}

	},
	playerStageFollowing: function(player){
		this.position.x = player.stage.position.x;
		this.position.y = player.stage.position.y
	}
};
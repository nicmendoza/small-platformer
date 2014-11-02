function Player(position,game){
	var self = this;

	self.game = game;

	self.height = 10;
	self.width = 10;
	self.maxMovementSpeed = 2;
	self.jumpSpeed = 3;
	self.currentMovementSpeed = self.maxMovementSpeed;
	self.direction = 'left';
	self.isMovingObject = true;

	self.pickups = [];
	self.maxPickups = 2;

	self.stage = game.mainStage;

	self.isFalling = false;
	self.isCrouching = false;

	self.position = position;
	self.lastPosition = {};
	self.momentum = {
		x: 0,
		y: 0.1
	};
}

Player.prototype = new Item();

Player.prototype.update = function(){
	var self = this,
		intersectingObjects = self.getIntersectingObjects(),
		intersectingEnemies, intersectingPickups;

	if(intersectingObjects.length){

		intersectingEnemies = intersectingObjects.filter(function(object){
			return object instanceof Enemy;
		})
			.forEach(function(enemy){

				if(self.momentum.y > 0 && self.position.y + self.height - self.momentum.y <= enemy.position.y){
					enemy.die();
					self.momentum.y = -(self.momentum.y+1)
				} else if(!enemy.isDead) {
					self.die() || enemy.die();
				}
			});

		intersectingPickups = intersectingObjects.filter(function(object){
			return object instanceof Pickup
		})
			.forEach(function(pickup){
				self.getPickup(pickup);
				pickup.die();
			});

	}

	self.lastPosition.x = self.position.x;
	self.lastPosition.y = self.position.y;

	// accelerate left
	if(self.game.inputs.isDown('LEFT') && !self.game.inputs.isDown('RIGHT')){
		self.direction = 'left';
		self.momentum.x = -( Math.min( Math.abs(self.momentum.x)+ .2, self.maxMovementSpeed ) );
	}

	// accelerate right
	if(self.game.inputs.isDown('RIGHT') && !self.game.inputs.isDown('LEFT')){
		self.direction = 'right';
		self.momentum.x = Math.min( Math.abs(self.momentum.x)+ .2, self.maxMovementSpeed );
	}

	// if player holding neither or both LEFT/RIGHT, slow down
	if( ( !self.game.inputs.isDown('LEFT') && !self.game.inputs.isDown('RIGHT')  ) ||  ( self.game.inputs.isDown('LEFT') && self.game.inputs.isDown('RIGHT')  )  ){
		self.momentum.x = (self.momentum.x < 0 ? -1 : 1 ) * Math.max(0,Math.abs(self.momentum.x)-.2);
	}

	if( self.game.inputs.isDown('FIRE') ) {
		self.usePickup();
	}

	//jump if we need to
	self.game.inputs.isDown('SPACE') && !self.isFalling && self.jump();


	if(self.game.inputs.isDown('DOWN')){
		self.game.oneWaysEnabled = false;
	} else {
		self.game.oneWaysEnabled = true;
	}

	self.updateCrouching(self.game.inputs.isDown('DOWN'));

	self.updateX();
	self.updateY();
};

Player.prototype.draw = function(ctx){
	var self = this,
		position;

	this.update();

	// only close over these values AFTER player has updated
	position = self.stage.getRenderPosition(self);

	ctx.fillRect(position.x,position.y,self.width,self.height);
	ctx.fillStyle = '#FF4444';
	ctx.fillRect(position.x + ( self.direction === 'left' ? -2 : 0 ),position.y-2,self.width+2,2);
};

// returns false if player survives
Player.prototype.die = function(){
	// some kind of animation

	return !this.losePickup() && self.game.reset();

	
};

Player.prototype.updateCrouching = function(wantsToCrouch){
	var self = this;

	if(self.isCrouching && !wantsToCrouch){
		self.height = 10;
		self.position.y -= 4;
		self.isCrouching = false;
	};

	
	if(wantsToCrouch && !self.isFalling && !self.isCrouching){
		self.position.y += 4;
		self.height = 6;
		self.isCrouching = true;
	}
};

Player.prototype.getPickup = function(object){
	return this.pickups.length < this.maxPickups && !!this.pickups.push(object);
};

Player.prototype.losePickup = function(){
	return this.pickups.pop();
};

Player.prototype.usePickup = function(){
	this.pickups[0] && this.pickups[0].use(this);
};


Player.prototype.jump = function(){
	var self = this;
	this.position.y+=.1;
	this.momentum.y = this.isCrouching ? -5 : -4;
};
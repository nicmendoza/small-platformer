function Player(game,options){

	var width = 50,
		spriteWidth = width + 10,
		height = 60,
		self = this;


	self.game = game;

	self.options = options;
	
	self.height = height;
	self.width = width;

	self.baseSize = {
		height: self.height,
		width: self.width
	};

	self.maxMovementSpeed = 4;
	self.jumpSpeed = 10;
	self.currentMovementSpeed = self.maxMovementSpeed;
	self.direction = 'left';
	self.isMovingObject = true;

	self.pickups = [];
	self.maxPickups = 2;

	self.isFalling = false;
	self.isCrouching = false;

	self.position = options.position || {
		x: parseInt(options.x,10),
		y: parseInt(options.y,10)
	};

	self.lastPosition = {
		x: self.position.x,
		y: self.position.y
	};
	self.momentum = {
		x: 0,
		y: 0.1
	};

	self.states = {
		'standing': new Sprite({
			position: {
				x: 0,
				y: 170
			},
			size: {
				height: height,
				width: spriteWidth
			},
			url: 'img/sprites.png',
			frames: [0]
		}),
		'crouching': new Sprite({
			position: {
				x: 60,
				y: 170
			},
			size: {
				height: height,
				width: spriteWidth
			},
			url: 'img/sprites.png',
			frames: [0]
		}),
		'walkright' : new Sprite({
			position: {
				x: 0,
				y: 40
			},
			size: {
				height: height,
				width: spriteWidth
			},
			url: 'img/sprites.png',
			speed: 4,
			frames: [1,0,2,0]
		}),
		'walkleft' : new Sprite({
			position: {
				x: 0,
				y: 108
			},
			size: {
				height: height,
				width: spriteWidth
			},
			url: 'img/sprites.png',
			speed: 4,
			frames: [1,0,2,0]
		}),
		'waving' : new Sprite({
			position: {
				x: 0,
				y: 233
			},
			size: {
				height: height,
				width: 80
			},
			url: 'img/sprites.png',
			speed: 5,
			frames: [0,1,2,3,2,1],
			once: true
		}),
		'jumpright' : new Sprite({
			position: {
				x: 181,
				y: 40
			},
			size: {
				height: height,
				width: spriteWidth
			},
			url: 'img/sprites.png',
			frames: [0]
		}),
		'jumpleft' : new Sprite({
			position: {
				x: 181,
				y: 108
			},
			size: {
				height: height,
				width: spriteWidth
			},
			url: 'img/sprites.png',
			frames: [0]
		})

	}

	self.sprite = self.states['standing'];

}

Player.prototype = new Item();

Player.prototype.update = function(){
	var self = this,
		intersectingObjects = self.getIntersectingObjects(),
		intersectingEnemies, intersectingPickups,bounce;

	if(intersectingObjects.length){

		intersectingEnemies = intersectingObjects.filter(function(object){
			return object instanceof Enemy && !object.isDead;
		})
			.forEach(function(enemy){
				if(self.momentum.y > 0 && self.wasAbove(enemy)){
					resources.get('audio/stomp.wav').play();
					enemy.die();
					bounce = true;
				} else if(!enemy.isDead) {
					self.die() || enemy.die();
				}
			});

		intersectingPickups = intersectingObjects.filter(function(object){
			return object instanceof Pickup
		})
			.forEach(function(pickup){
				self.getPickup(pickup);
				resources.get('audio/power-up.wav').play();
				pickup.die();
			});

	}

	if(bounce){
		self.momentum.y = -( self.momentum.y + 1 );
	}

	// accelerate left
	if(self.game.inputs.isDown('LEFT') && !self.game.inputs.isDown('RIGHT')){
		self.direction = 'left';
		self.momentum.x = -( Math.min( Math.abs(self.momentum.x)+ .2, self.maxMovementSpeed ) );

		self.sprite = self.states['walkleft'];
	}

	// accelerate right
	if(self.game.inputs.isDown('RIGHT') && !self.game.inputs.isDown('LEFT')){
		self.direction = 'right';
		self.momentum.x = Math.min( Math.abs(self.momentum.x)+ .2, self.maxMovementSpeed );

		self.sprite = self.states['walkright'];
	}

	// if player holding neither or both LEFT/RIGHT, slow down
	if( ( !self.game.inputs.isDown('LEFT') && !self.game.inputs.isDown('RIGHT')  ) ||  ( self.game.inputs.isDown('LEFT') && self.game.inputs.isDown('RIGHT')  )  ){
		self.momentum.x = (self.momentum.x < 0 ? -1 : 1 ) * Math.max(0,Math.abs(self.momentum.x)-.2);
	}

	if( self.game.inputs.isDown('FIRE') ) {
		self.usePickup(self.game,self);
	}

	//jump if we need to
	self.game.inputs.isDown('SPACE') && !self.isFalling && self.jump();


	if(self.game.inputs.isDown('DOWN')){
		self.game.oneWaysEnabled = false;
	} else {
		self.game.oneWaysEnabled = true;
	}

	self.updateCrouching(self.game.inputs.isDown('DOWN'));

	self.updateSpriteState();

	Item.prototype.update.call(self,self.game);
	
};

// Player.prototype.draw = function(ctx){
// 	var self = this,
// 		position;

// 	// only close over these values AFTER player has updated
// 	position = self.stage.getRenderPosition(self);

// 	ctx.fillStyle = self.options.color || 'black';
// 	ctx.fillRect(position.x,position.y,self.width,self.height);
// 	ctx.fillStyle = '#FF4444';
// 	ctx.fillRect(position.x + ( self.direction === 'left' ? -2 : 0 ),position.y-2,self.width+2,2);
// };

// returns false if player survives
Player.prototype.die = function(){
	// some kind of animation
	resources.get('audio/fall-into-lava.wav').play();
	return !this.losePickup() && self.game.reset();

	
};

Player.prototype.updateCrouching = function(wantsToCrouch){
	var self = this,
		crouchDiff = Math.ceil( self.baseSize.height * 0.4 );

	// hack: not letting you come out of a crouch mid-air or mid-fall so you can't
	// wedge yourself into objects
	if(self.isCrouching && !wantsToCrouch && !self.isFalling){
		self.height = self.baseSize.height;
		if(self.isFalling){}
		self.position.y -= crouchDiff;
		self.isCrouching = false;
	};

	if(wantsToCrouch && !self.isFalling && !self.isCrouching){
		self.position.y += crouchDiff;
		self.height = self.baseSize.height - crouchDiff;
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
	this.position.y -=1;
	this.momentum.y = -( this.isCrouching ? self.jumpSpeed : self.jumpSpeed * 0.85 );
	resources.get('audio/jump.wav').play();
};

Player.prototype.updateSpriteState = function(){

	var self = this;

	// if we're not moving at all
	if(!self.momentum.x && !self.momentum.y){
		// if we're waving
		if( self.sprite === self.states['waving'] ){
			// do nothing
		// else if we're not waving and a dice roll comes up positive
		} else if( self.sprite !== self.states['waving'] && Math.round( Math.random() * 0.501 ) ) {
			// set sprite to waving
			self.sprite = self.states['waving'].reset();
			//assign callback for when animate complete
			self.sprite.onCompleteOnce = function(){
				//set to standing
				self.sprite = self.states['standing'];
			}

		// else
		} else {
			// set sprite to standing
			self.sprite = self.states['standing'].reset();
		}
		
	}

	if(self.isCrouching){
		self.sprite = self.states['crouching'];
	}

	if(self.isFalling){
		if(self.direction === 'left'){
			self.sprite = self.states['jumpleft'];
		} else if(self.direction === 'right'){
			self.sprite = self.states['jumpright'];
		}
	}
};
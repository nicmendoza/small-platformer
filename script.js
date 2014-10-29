function Game(canvas){
	var self = this;

	self.run = true;

	self.height = canvas.height;
	self.width = canvas.width;
	self.gravity = 10;
	self.maxFallSpeed = 5;
	self.tileSize = 5;

	self.oneWaysEnabled = true;

	self.ctx = canvas.getContext('2d');

	self.stages = [new Stage(3000,1,[],function(player){

		var playerPositionX = player.stage.getPosition(player).x,
			activeZoneWidth = 200;

		// OPTION: player-centered camera
		//this.position.x = Math.min(0,-( player.position.x - self.width / 2 ));

		// OPTION: player-following camera
		if(playerPositionX < activeZoneWidth){
			
			this.position.x = Math.min(0, this.position.x + activeZoneWidth - playerPositionX);
		} else if(playerPositionX > self.width - activeZoneWidth ) {
			this.position.x += (self.width-activeZoneWidth - playerPositionX);
		};

		
	})];

	self.mainStage = self.stages[0];

	self.player = new Player({
		x:self.width/2,
		y:self.height - 70
	},self);

	[  self.player,
	// ground
	new Platform({
		position: { 
			x: 0, 
			y: self.height - 30
		},
		height: 50,
		width: 1200,
		color: '#F5D190'
	},self),
	// left-hand mesa
	new Platform({
		position: { 
			x: 0, 
			y: self.height -80
		},
		height: 50,
		width: 250,
		isOneWay: true,
		color: '#CEAA6A'
	},self),
	// right-hand mesa
	new Platform({
		position: { 
			x: 500, 
			y: self.height -80
		},
		height: 50,
		width: 50,
		color: '#CEAA6A'
	},self),
	// green island
	new Platform({
		position: { 
			x: self.width - 80, 
			y: self.height - 80
		},
		height: 80,
		width: 40,
		color: '#7CAD8A'
	},self)
	].reverse().forEach(function(object){
		self.stages[0].addObject(object);
	});

	/*	
		array of stages

		when player moves (near edge of screen),
		stage position is updated by the amount of the player's movement,
		proportionally to its perceived distance

	*/

	self.inputs = new KeyboardListener();

	window.requestAnimationFrame(self.draw.bind(self));

}

Game.prototype.draw = function(){
	var self = this;
	this.ctx.clearRect(0,0,this.width,this.height);
	self.stages.forEach(function(stage){
		stage.objects.forEach(function(object){
			self.ctx.save();
			object.draw();
			self.ctx.restore();
		});

		stage.update(self.player);
	});
	
	if(this.run){
		window.requestAnimationFrame(this.draw.bind(this));
	}
	
};

Game.prototype.pushStages = function(leadingCorner){
	//if(leadingCorner.x > )
}

Game.prototype.objectOutOfFrame = function(){
	//todo: finish this
	return object.position.y > game.height - object.height;
}

function Player(position,game){
	var self = this;

	self.game = game;

	self.height = 10;
	self.width = 10;
	self.maxMovementSpeed = 2;
	self.jumpSpeed = 3;
	self.currentMovementSpeed = self.maxMovementSpeed;
	self.direction = 'left';

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

Player.prototype.draw = function(){
	var self = this,
		intersectingItems = self.getIntersectingItems(),
		position = self.stage.getPosition(self);

	self.lastPosition.x = position.x;
	self.lastPosition.y = position.y;

	/*

		Note: probably need to re-organize this whole engine
		to store tiles in an array


		Get coords of leading corner:
			{ 
				x: left or right, 
				y: top or bottom}
			 depending on movement direction

		
		loop through supporting objects, find closest one
		filter by whether or not they are on the screen


	*/

	//set facing direction
	if(self.game.inputs.isDown('LEFT')){
		self.direction = 'left';
	}

	if(self.game.inputs.isDown('RIGHT')){
		self.direction = 'right';
	}

	self.game.inputs.isDown('SPACE') && !self.isFalling && self.jump();

	self.updateCrouching(self.game.inputs.isDown('DOWN'));

	self.updateX();
	self.updateY();

	game.ctx.fillRect(position.x,position.y,self.width,self.height);
	game.ctx.fillStyle = '#FF4444';
	game.ctx.fillRect(position.x + ( self.direction === 'left' ? -2 : 0 ),position.y-2,self.width+2,2);
};

Player.prototype.updateCrouching = function(wantsToCrouch){
	var self = this;

	if(self.isCrouching && !wantsToCrouch){
		self.height = 10;
		self.position.y -= 4;
		self.isCrouching = false;
	};

	
	if(wantsToCrouch && !self.isFalling && !self.isCrouching){
		self.height = 6;
		self.position.y += 4;
		self.isCrouching = true;
	}
};


Player.prototype.jump = function(){
	var self = this;
	this.position.y+=.1;
	this.momentum.y = this.isCrouching ? -5 : -4;
};

Player.prototype.getLeadingCorner = function(){

	return {
		// uses right edge as default, unless facing left
		//todo: this seems backwards, and might be causing bugs. fix
		x: this.direction === 'left' ? this.position.x: this.position.x + this.width,
		// if falling, bottom, else top
		y: this.momentum.y > 0 ? this.position.y + this.height : this.position.y
	}
};



Player.prototype.updateX = function(){
	var self = this,
		leadingXCoord = self.getLeadingCorner()['x'],
		closestObject = self.stage.objects
			.filter(function(object){
				return object.isObstacle && !object.isOneWay;
			})
			.filter(function(object){
				// player is not over or under object
				return self.position.y + self.height > object.position.y 
					&& self.position.y < object.position.y + object.height;
			})
			.filter(function(object){
				// object is "in front" of player
				if(self.direction === 'left'){
					return object.position.x + object.width <= leadingXCoord;
				} else {
					return object.position.x >= leadingXCoord;
				}
			})
			.sort(function(a,b){
				//need to handle them being equal
				return Math.abs(self.position.x - a.position.x) > Math.abs(self.position.x - b.position.x) ? 1 : 0;
			})[0],
		closestObjectNearestEdge = closestObject && ( self.direction === 'left' ? closestObject.position.x + closestObject.width : closestObject.position.x );


	self.lastPosition.x = self.position.x;

	if(self.game.inputs.isDown('LEFT') && !self.game.inputs.isDown('RIGHT')){
		self.position.x = self.position.x - ( closestObject ? Math.min(self.currentMovementSpeed,leadingXCoord - closestObjectNearestEdge) : self.currentMovementSpeed );
	}

	if(self.game.inputs.isDown('RIGHT') && !self.game.inputs.isDown('LEFT')){
		self.position.x = self.position.x +  ( closestObject ? Math.min(self.currentMovementSpeed, closestObject.position.x - leadingXCoord ) : self.currentMovementSpeed );			
	}

};

Player.prototype.updateY = function(){
	var self = this,
		leadingCoord = self.getLeadingCorner(),
		closestObject = self.stage.objects
			.filter(function(object){
				return object.isObstacle && object.isOneWay ? self.game.oneWaysEnabled : true;
			})
			.filter(function(object){
				// player is over object
				return self.position.x + self.width > object.position.x
					&& self.position.x < object.position.x + object.width;
			})
			.filter(function(object){
				// player is higher than top of object
				return self.position.y + self.height <= object.position.y;
			})
			// .filter(function(object){
				// player was previously above object (not jumping through from bottom)
			// 	return self.position.y - self.momentum.y < object.position.y;
			// })
			.sort(function(a,b){
				//sort by closest to player
				//need to handle them being equal
				return Math.abs(self.position.y - a.position.y) > Math.abs(self.position.y - b.position.y) ? 1 : 0;
			})[0],
		closestObjectNearestEdge = closestObject && closestObject.position.y,
		isOnGround = Math.abs(self.position.y + self.height - closestObjectNearestEdge) < 1;

	

	if(isOnGround){

		// if falling at 75% of max fall speed or faster, bounce when hitting the ground
		if(self.isFalling && self.momentum.y > self.game.maxFallSpeed * 0.75){
			// flip momentum
			self.momentum.y = -(Math.ceil( self.momentum.y * closestObject.springiness) );
			// if we achieved bounce, get player off ground so they can actually bounce
			if(self.momentum.y){
				self.position.y -=.1;
			}
			
		}

		

		//reset momentum while on ground (if player was already on ground previously)
		if(self.lastPosition.y === self.position.y){
			self.momentum.y = 0;
			self.isFalling = false;
		}

	} else {
		self.momentum.y += .2;
		// comment out to fly :)
		self.isFalling = true;
	}


	if(self.game.inputs.isDown('DOWN')){
		self.game.oneWaysEnabled = false
	} else {
		self.game.oneWaysEnabled = true;
	}

	self.position.y = self.position.y + ( closestObject ? Math.min(self.momentum.y, closestObjectNearestEdge - leadingCoord.y ) : self.momentum.y);
	self.lastPosition.y = self.position.y;
}

/*
	Options: {
		position: {
			x: 0,
			y: 0
		},
		height: 10,
		width: 10,
		allowDown: false
	}
*/

function Platform(options,game){
	var self = this;

	self.position = options.position;
	self.width = options.width;
	self.height = options.height;
	self.game = game;
	this.color = options.color;
	self.springiness = 0.2;

	// todo: pass this in
	this.stage = game.mainStage;

	self.isOneWay = !!options.isOneWay;
	self.isObstacle = true;

	self.canSupportPlayer = true;

	this.drawTransformations = function(ctx){
		ctx.fillStyle = self.color;
	}
}

Platform.prototype = new Item();

/*
	stage
		position
			x
			y
		relativeMovementRatio
*/

function Stage(width, relativeMovementRatio,initialObjects,update){
	var self = this;

	self.objects = initialObjects || [];

	self.update = update.bind(self);

	self.position = {
		x: 0,
		y: 0
	}

	self.relativeMovementRatio = relativeMovementRatio;
}

Stage.prototype.addObject = function(object){
	this.objects.push(object);
};

Stage.prototype.getPosition = function(object){
	return {
		x: object.position.x + this.position.x,
		y: object.position.y + this.position.y
	}
}

function Item(){
	//todo: see if there is a way to get this to work
	// var self = this;
	// [].slice.call(arguments).forEach(function(arg){
	// 	if(arg instanceof Game){
	// 		self.game = arg;
	// 	}
	// });
}

Item.prototype.isDirectlyAbove = function(item){

	var thisLeft = this.position.x,
		thisRight = this.position.x + this.width,
		itemLeft = item.position.x,
		itemRight = item.position.x + item.width;

	return thisLeft > itemLeft
		&& thisRight < itemRight;
};

Item.prototype.getIntersectingItems = function(){
	var thisItem = this,
		thisLeft = this.position.x,
		thisRight = thisLeft + this.width,
		thisTop = this.position.y,
		thisBottom = thisTop + this.height;

	return this.stage.objects.filter(function(item){
		var itemLeft = item.position.x,
			itemRight = itemLeft + item.width,
			itemTop = item.position.y,
			itemBottom = itemTop + item.height;

		return item !== thisItem
			&& thisRight >= itemLeft
			&& thisLeft <= itemRight
			&& thisTop <= itemBottom
			&& thisBottom >= itemTop;
	});

	
};

Item.prototype.itemsBelow = function(){
	var self = this;
	return self.game && self.stage.objects.filter(function(object){

	}) || [];
};

Item.prototype.draw = function(){

	var position = this.stage.getPosition(this);

	this.drawTransformations && this.drawTransformations(this.game.ctx);
	this.game.ctx.fillRect(position.x,position.y,this.width,this.height);
};

function KeyboardListener(){
	var self = this,
		down = {},
			keys = {
			'LEFT': 	[37,65], // left arrow, a
			'UP' : 		38,
			'RIGHT': 	[39,68], // right arrow, d
			'DOWN': 	[40,83],
			'SPACE': 	32
		};

	self.isDown = function(keyName){
		return keys[keyName].length ? keys[keyName].some(function(keyCode){ return down[keyCode] }) : down[keys[keyName]];
	};

	document.addEventListener('keydown',function(e){
		down[e.keyCode] = true;
	});

	document.addEventListener('keyup',function(e){
		down[e.keyCode] = false;
	});
}

var game = new Game(document.getElementById('game'));
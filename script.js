function Game(canvas){
	var self = this;

	self.run = true;

	self.height = canvas.height;
	self.width = canvas.width;
	self.gravity = 10;
	self.maxFallSpeed = 1;
	self.tileSize = 5;

	self.ctx = canvas.getContext('2d');
	self.objects = [new Player({
			x:self.width/2,
			y:self.height - 70
		},self),  
		new Platform({
			position: { 
				x: 0, 
				y: self.height - 30
			},
			height: 50,
			width: self.width * 0.6,
			color: '#F5D190'
		},self),
		new Platform({
			position: { 
				x: 0, 
				y: self.height -80
			},
			height: 2,
			width: self.width/3,
			color: '#CEAA6A'
		},self),
		new Block({
			position: { 
				x: 0, 
				y: self.height -80
			},
			height: 50,
			width: self.width/3,
			color: '#E5C38C'
		},self),
		new Block({
			position: { 
				x: self.width - 80, 
				y: self.height - 80
			},
			height: 80,
			width: 40,
			color: '#7CAD8A'
		},self)
		].reverse();

	self.inputs = new KeyboardListener();

	window.requestAnimationFrame(self.draw.bind(self));

}

Game.prototype.draw = function(){
	this.ctx.clearRect(0,0,this.width,this.height);
	this.objects.forEach(function(object){
		object.draw();
	});
	if(this.run){
		window.requestAnimationFrame(this.draw.bind(this));
	}
	
};

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

	self.isFalling = true;
	self.isCrouching = false;

	self.position = position;
	self.lastPosition = {};
	self.momentum = {
		x: 0,
		y: 0.1
	};
	//todo: probably can remove this;
	self.isJumping = false;
}

Player.prototype = new Item();

Player.prototype.draw = function(){
	var self = this,
		intersectingItems = self.getIntersectingItems();

	self.lastPosition.x = self.position.x;
	self.lastPosition.y = self.position.y;

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

	self.getLeadingCorner();

	//set facing direction
	if(self.game.inputs.isDown('LEFT')){
		self.direction = 'left';
	}

	if(self.game.inputs.isDown('RIGHT')){
		self.direction = 'right';
	}

	self.game.inputs.isDown('SPACE') && !self.isFalling && !self.isJumping && self.jump();

	self.updateCrouching(self.game.inputs.isDown('DOWN'));

	evaluateMomentumEffect(this,this.game,intersectingItems);

	game.ctx.fillRect(self.position.x,self.position.y,self.width,self.height);
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

	self.isJumping = true;
	self.justJumped = true;
	this.momentum.y = this.isCrouching ? -5 : -4;
};

Player.prototype.getLeadingCorner = function(){

	return {
		// uses right edge as default, unless facing left
		//todo: this seems backwards, and might be causing bugs. fix
		x: self.direction === 'left' ? this.position.x + this.width : this.position.x,
		// if falling, bottom, else top
		y: this.momentum.y > 0 ? this.position.y + this.height : this.position.y
	}
};



Player.prototype.updateX = function(){
	var self = this,
		leadingXCoord = self.getLeadingCorner().x,
		closestObject = self.game.objects
			.filter(function(object){
				return object.isObstacle;
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
		self.position.x = self.position.x +  ( closestObject ? Math.min(self.currentMovementSpeed, leadingXCoord + closestObject.position.x) : self.currentMovementSpeed );			
	}

};

Player.prototype.updateY = function(){
	var self = this,
		leadingCoord = self.getLeadingCorner(),
		closestObject = self.game.objects
			.filter(function(object){
				return object.isObstacle;
			})
			.filter(function(object){
				// player is over object
				return self.position.x > object.position.x
					&& self.position.x + self.width <= object.position.x + object.width;
			})
			.filter(function(object){
				// player is higher than top of object
				return self.position.y + self.height <= object.position.y;
			})
			.sort(function(a,b){
				//sort by closest to player
				//need to handle them being equal
				return Math.abs(self.position.y - a.position.y) > Math.abs(self.position.y - b.position.y) ? 1 : 0;
			})[0],
		closestObjectNearestEdge = closestObject && closestObject.position.y,
		isOnGround = Math.abs(self.position.y + self.height - closestObjectNearestEdge) < 1;

	self.lastPosition.y = self.position.y;

	// if(self.game.inputs.isDown('LEFT') && !self.game.inputs.isDown('RIGHT')){
	// 	self.position.x = self.position.x - ( closestObject ? Math.min(self.currentMovementSpeed,leadingXCoord - closestObjectNearestEdge) : self.currentMovementSpeed );
	// }

	// if(self.game.inputs.isDown('RIGHT') && !self.game.inputs.isDown('LEFT')){
	// 	self.position.x = self.position.x +  ( closestObject ? Math.min(self.currentMovementSpeed, leadingXCoord + closestObject.position.x) : self.currentMovementSpeed );			
	// }

	if(isOnGround){
		self.isFalling = false;
		self.isJumping = false;
		//self.momentum.y = 0;
	}

	// if(self.isFalling){
	// 	//self.momentum.y += 0.1;
	// }

	

	self.position.y = self.position.y + ( closestObject ? Math.min(self.momentum.y, closestObjectNearestEdge - leadingCoord.y ) : self.momentum.y);

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

	self.isObstacle = true;

	self.canSupportPlayer = true;

	this.drawTransformations = function(ctx){
		ctx.fillStyle = self.color;
	}
}

Platform.prototype = new Item();


// todo: make Block the primitive that Platform is built on
function Block(options,game){
	var self = this;

	self.position = options.position;
	self.width = options.width;
	self.height = options.height;
	self.game = game;
	this.color = options.color;

	self.canSupportPlayer = false;

	this.drawTransformations = function(ctx){
		ctx.fillStyle = self.color;
	}
}

Block.prototype = new Item();

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

	return this.game.objects.filter(function(item){
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
	return self.game && self.game.objects.filter(function(object){

	}) || [];
};

Item.prototype.draw = function(){
	this.game.ctx.save();
	this.drawTransformations && this.drawTransformations(this.game.ctx);
	this.game.ctx.fillRect(this.position.x,this.position.y,this.width,this.height);
	this.game.ctx.restore();
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


function evaluateMomentumEffect(object,game,intersectingItems){

	var objectBottomY = object.position.y + object.height,
		supportingItems = intersectingItems 
		&& intersectingItems.filter(function(item){
				return item.canSupportPlayer
						// this still doesn't work for fast-falling objects
						&& objectBottomY - item.position.y < 5;
			}),
		isFalling = object.momentum.y > 0;

	// for walking over cliffs
	if(!intersectingItems.length){
		// start falling if in mid-air and not moving
		object.momentum.y += .1;
	}

	// if(isFalling && supportingItems.length){

	// 	object.isFalling = false;
	// 	object.isJumping = false;

	// 	// prevent item from going through intersecting item that can support it
	// 	object.position.y = supportingItems[0].position.y - object.height;

	// 	// add a bounce for large drops
	// 	if(object.momentum.y > 0 ){
	// 		object.momentum.y = Math.ceil(-object.momentum.y*.3);
	// 	}

	// }

	object.justJumped = false;

	if(object.momentum.y !== 0){
		object.momentum.y += .1;
	}

	object.updateX();
	object.updateY();

	//object.position.y += object.momentum.y;
	//object.position.x += object.momentum.x;

}

var game = new Game(document.getElementById('game'));
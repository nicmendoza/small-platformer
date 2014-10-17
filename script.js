function Game(canvas){
	var self = this;

	self.run = true;

	self.height = canvas.height;
	self.width = canvas.width;
	self.gravity = 10;
	self.maxFallSpeed = .2;

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
			height: 50,
			width: self.width/3,
			color: '#CEAA6A'
		},self),
		new Platform({
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

	self.isFalling = true;
	self.isCrouching = false;

	self.position = position;
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

	self.game.inputs.isDown('LEFT') && (self.position.x -= self.currentMovementSpeed);
	self.game.inputs.isDown('RIGHT') && (self.position.x += self.currentMovementSpeed);
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
	this.momentum.y = this.isCrouching ? -4 : -3;
};

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

	self.canSupportPlayer = true;

	this.drawTransformations = function(ctx){
		ctx.fillStyle = self.color;
	}
}

Platform.prototype = new Item();

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

	if(isFalling && supportingItems.length){

		object.isFalling = false;
		object.isJumping = false;

		// prevent item from going through intersecting item that can support it
		object.position.y = supportingItems[0].position.y - object.height;

		// add a bounce for large drops
		if(object.momentum.y > 0 ){
			object.momentum.y = Math.ceil(-object.momentum.y*.3);
		}

	}

	object.justJumped = false;

	if(object.momentum.y !== 0 && object.momentum.y < game.maxFallSpeed){
		object.momentum.y += .1;
	}

	object.position.y += object.momentum.y;
	object.position.x += object.momentum.x;

}

var game = new Game(document.getElementById('game'));
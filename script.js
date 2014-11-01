/*

	todo: moving platforms
	todo: artwork (top edges for platforms, repeating textures)
	todo: level design (and tooling) (svg?)
	todo: ladders (?)
	todo: wall jumping (?)
	todo: convert x translations to using momentum instead of hard-coded movement speed
	todo: figure out better way for objects to inherit methods
	todo: try foreground objects
	todo: move enemy types/logic into config object or Enemy prototype
	todo: path-following enemies
	todo: fireball-type player weapon
	todo: pickups
	todo: push items to remove into collection to be removed at end of game.draw

*/

function Game(canvas,levelInit){
	var self = this;

	self.run = true;

	self.height = canvas.height;
	self.width = canvas.width;
	self.gravity = 10;
	self.maxFallSpeed = 5;
	self.oneWaysEnabled = true;

	self.deaths = 0;

	self.ctx = canvas.getContext('2d');

	self.HUD = new HUD(self);

	self.stages = [];

	// configure HUD
	self.HUD.addHUDItem({
		draw: function(ctx){
			ctx.font = '14px arial'
			ctx.fillText('deaths: ' + self.deaths, 4,14);
		}
	});
		
	// create initial level
	self.currentLevel = levelInit;
	self.setLevel(levelInit);

	self.reset = function(){

		self.stages = [];

		self.setLevel(levelInit);
		self.deaths++;
		delete self.resetting;
	};

	self.inputs = new KeyboardListener();

	window.requestAnimationFrame(self.draw.bind(self));

}

Game.prototype.draw = function(){
	var self = this,
		stage;
	this.ctx.clearRect(0,0,this.width,this.height);

	for(var i = self.stages.length  - 1; i >= 0; i--){
		stage = self.stages[i];

		stage.objects.forEach(function(object){
			self.ctx.save();
			object.draw(self.ctx);
			self.ctx.restore();
		});

		stage.update(self.player);

	}

	if(self.objectOutOfFrame(self.player)){
		if(!self.resetting){
			self.resetting = true;
			setTimeout(self.reset,500);
		}
		
	}

	self.HUD.draw(self.ctx);
	
	if(this.run){
		window.requestAnimationFrame(this.draw.bind(this));
	}
	
};

Game.prototype.pushStages = function(leadingCorner){
	//if(leadingCorner.x > )
};

Game.prototype.objectOutOfFrame = function(object){
	//todo: finish this
	return object.position.y > game.height - object.height;
};

Game.prototype.setLevel = function(levelInit){
	levelInit.call(this,this);
};

Game.prototype.resetLevel = function(){
	this.setLevel(this.currentLevel);
};

Game.prototype.camera = {
	playerFollowing: function(player){
		this.position.x = Math.min(0,-( player.position.x - self.width / 2 ));
	},
	playerNudging: function(player){

		var activeZoneWidth = 200,
			// get player's drawn location
			playerPositionX = this.getRenderPosition(player).x;

		if(playerPositionX < activeZoneWidth){
			this.position.x = Math.min(0, this.position.x + activeZoneWidth - playerPositionX) * this.relativeMovementRatio;
		} else if(playerPositionX > this.game.width - activeZoneWidth ) {
			this.position.x += (this.game.width - activeZoneWidth - playerPositionX) * this.relativeMovementRatio;
		};
	},
	playerStageFollowing: function(player){
		this.position.x = player.stage.position.x;
		this.position.y = player.stage.position.y
	}
}

function HUD(game){
	var self = this;
	self.game = game;
	self.objects = [];
}

HUD.prototype.draw = function(ctx){
	var self = this;
	self.objects.forEach(function(object){
		ctx.save();
		object.draw(self.game.ctx);
		ctx.restore();
	});
};

HUD.prototype.addHUDItem = function(options){
	this.objects.push(new HUDItem(this,this.game,options));
};

function HUDItem(HUD,game,options){
	var self = this;

	self.HUD = HUD;
	self.game = game;
	self.draw = options.draw;
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
	self.isMovingObject = true;

	self.pickups = [];

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
					self.die();
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

	// face left if we need to
	if(self.game.inputs.isDown('LEFT')){
		self.direction = 'left';
	}

	// face right if we need to
	if(self.game.inputs.isDown('RIGHT')){
		self.direction = 'right';
	}

	if(self.game.inputs.isDown('LEFT') && !self.game.inputs.isDown('RIGHT') || self.game.inputs.isDown('RIGHT') && !self.game.inputs.isDown('LEFT')){
		self.shouldMove = true;
	} else {
		self.shouldMove = false;
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
}

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

Player.prototype.die = function(){
	// some kind of animation

	self.game.reset();
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
	return this.pickups.length < 2 && !!this.pickups.push(object);
};

Player.prototype.usePickup = function(){
	this.pickups[0] && this.pickups[0].use(this);
}


Player.prototype.jump = function(){
	var self = this;
	this.position.y+=.1;
	this.momentum.y = this.isCrouching ? -5 : -4;
};

function Pickup(game,options){
	this.use = options.onUse;
	this.label = options.label;

	this.position = options.position;
	this.game = game;

	this.width = 10;
	this.height = 10;
	this.drawTransformations = function(ctx){
		ctx.fillStyle = 'blue';
	}
}

Pickup.prototype = new Item();

Item.prototype.getLeadingCorner = function(){

	return {
		// uses right edge as default, unless facing left
		x: this.direction === 'left' ? this.position.x: this.position.x + this.width,
		// if falling, bottom, else top
		y: this.momentum.y > 0 ? this.position.y + this.height : this.position.y
	}
};


Item.prototype.updateX = function(withControls){
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
		closestObjectNearestEdge = closestObject && ( self.direction === 'left' ? closestObject.position.x + closestObject.width : closestObject.position.x ),
		movementSpeed = self.isCrouching ? self.currentMovementSpeed/5 : self.currentMovementSpeed;


	self.lastPosition.x = self.position.x;

	if(self.shouldMove && self.direction === 'left'){
		self.position.x = self.position.x - ( closestObject ? Math.min(movementSpeed,leadingXCoord - closestObjectNearestEdge) : movementSpeed );
	}

	if(self.shouldMove && self.direction === 'right'){
		self.position.x = self.position.x +  ( closestObject ? Math.min(movementSpeed, closestObject.position.x - leadingXCoord ) : movementSpeed );
	}

};

Item.prototype.updateY = function(){

	var self = this,
		leadingCoord = self.getLeadingCorner(),
		closestObject = self.stage.objects

			.filter(function(object){
					// object can block player
				return object.isObstacle && ( object.isOneWay ? self.game.oneWaysEnabled : true )

					// player is over object
					&& self.position.x + self.width > object.position.x
					&& self.position.x < object.position.x + object.width

					// player is higher than top of object
					&& self.position.y + self.height <= object.position.y

					// player was previously above object (not jumping through from bottom)
					//&& self.position.y - self.momentum.y < object.position.y;
			})
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
				self.position.y -= 0.1;
			}
			
		}

		//reset momentum while on ground (if player was already on ground previously)
		if(self.lastPosition.y === self.position.y){
			self.momentum.y = 0;
			self.isFalling = false;
		}

	} else {
		self.momentum.y += 0.2;
		// comment out to fly :)
		self.isFalling = true;
	}


	self.position.y = self.position.y + ( closestObject ? Math.min(self.momentum.y, closestObjectNearestEdge - leadingCoord.y ) : self.momentum.y);
	self.lastPosition.y = self.position.y;

};

Item.prototype.turnAround = function(){
	this.direction = this.direction === 'left' ? 'right' : 'left';
};

Item.prototype.isOffScreen = function(){
	if(this.position.y > this.game.height){
		return true;
	}
};

Item.prototype.die = function(){
	this.stage.garbage.push(this);
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

function Platform(options,game,stage){
	var self = this;

	self.position = options.position;
	self.width = options.width;
	self.height = options.height;
	self.game = game;
	this.color = options.color;
	self.springiness = 0.2;

	// todo: pass this in
	this.stage = stage || game.mainStage;

	self.isOneWay = !!options.isOneWay;
	self.isObstacle = true;
	self.isMovingObject = false;

	self.canSupportPlayer = true;

	this.drawTransformations = function(ctx){
		ctx.fillStyle = self.color;
	};
}

Platform.prototype = new Item();

function Enemy(options,game){

	var self = this;
	self.position = options.position;
	self.game = game;
	self.width = 10;
	self.height = 10;

	self.maxMovementSpeed = 1;
	self.currentMovementSpeed = self.maxMovementSpeed;

	self.onUpdate = options.onUpdate;

	self.momentum = {
		x: 0,
		y: 0.1
	};

	self.lastPosition = {};

	self.direction = 'right';

	self.isMovingObject = true;

	this.stage = game.mainStage;

	self.drawTransformations = function(ctx){
		ctx.fillStyle = 'orange';
	};

	options.onInit && options.onInit.call(self);
}

Enemy.prototype = new Item();

Enemy.prototype.die = function(){

	if(this.isDead) return;
	this.isDead = true;
	this.height = 2;
	this.position.y += 8;
	// hack to stop patrol movement
	this.shouldMove = false;
	// hack to strop patrol updates
	delete this.onUpdate
};

/*
	stage
		position
			x
			y
		relativeMovementRatio
*/

function Stage(game,relativeMovementRatio,initialObjects,update){
	var self = this;

	self.objects = initialObjects || [];
	self.garbage = [];

	self.game = game;

	var originalUpdate = update.bind(self)
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

Item.prototype.getIntersectingObjects = function(){
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

Item.prototype.draw = function(ctx){

	this.update && this.update();
	this.onUpdate && this.onUpdate();

	if(this.isMovingObject){
		this.updateY && this.updateY();
		this.updateX && this.updateX();
	}

	var position = this.stage.getRenderPosition(this);

	this.drawTransformations && this.drawTransformations(ctx);
	ctx.fillRect(position.x,position.y,this.width,this.height);
};

function KeyboardListener(){
	var self = this,
		down = {},
			keys = {
			'LEFT': 	[37,65], // left arrow, a
			'UP' : 		38,
			'RIGHT': 	[39,68], // right arrow, d
			'DOWN': 	[40,83],
			'SPACE': 	32,
			'FIRE': 	16 // shift key
		};

	self.isDown = function(keyName){
		return keys[keyName].length ? keys[keyName].some(function(keyCode){ return down[keyCode]; }) : down[keys[keyName]];
	};

	document.addEventListener('keydown',function(e){
		down[e.keyCode] = true;
	});

	document.addEventListener('keyup',function(e){
		down[e.keyCode] = false;
	});
}

var aBasicLevel = function(game){

	var self = this;

	game.player = new Player({
		x:game.width/2,
		y:game.height - 70
	},game);

	game.stages.push(
		new Stage(self,1,[],self.camera.playerNudging)
	);

	[  game.player,

		// fireball
		new Pickup(self,{
			position: {
				x: 200,
				y: game.height - 90
			},
			label: 'F',
			color: 'blue',
			onUse: function(player){


				var now = new Date(),
					fireball;

				if(player.lastFired && now - player.lastFired < 500){
					return;
				}

				player.lastFired = now;

				fireball = new Item()

				fireball.game = game;

				fireball.width = 5;
				fireball.height = 5;
				fireball.position = {
					x: player.position.x,
					y: player.position.y
				}
				fireball.lastPosition = {}
				fireball.momentum = {
					x: 0,
					y: 0
				}
				fireball.isMovingObject = true;

				fireball.update = function(){
					fireball.position.x +=1;

					if(!fireball.isFalling){
						fireball.momentum.y = -3;
						fireball.position.y -= .1;
					}

					fireball.getIntersectingObjects()
						.filter(function(object){return object instanceof Enemy})
						.forEach(function(object){
							object.die();
						});

					if(fireball.isOffScreen()){
						fireball.die();
					}
				}

				fireball.drawTransformations = function(ctx){
					ctx.fillStyle = 'red';
				}

				game.stages[0].addObject(fireball);

			}
		}),

		// patrolling enemy
		new Enemy({
			position: {
				x: game.width - 130,
				y: game.height - 80
			},
			onInit: function(){
				this.patrolDistance = 20;
				this.patrolStartX = this.position.x
				this.shouldMove = true;
			},
			onUpdate: function(){
				if(Math.abs(this.patrolStartX - this.position.x) >= 20){
					this.turnAround();
				}
			}
		},game),


		// jumping enemy
		new Enemy({
			position: {
				x: game.width - 200,
				y: game.height - 80
			},
			onUpdate: function(){

				if(!this.isFalling){
					this.momentum.y = -4
					this.position.y+= 0.1;
				}
			}
		},game),

		// ground
		new Platform({
			position: {
				x: 0,
				y: game.height - 30
			},
			height: 50,
			width: 1200,
			color: '#F5D190'
		},game),

		// distan platforr
		new Platform({
			position: {
				x: 1400,
				y: game.height - 30
			},
			height: 50,
			width: 1200,
			color: '#F5D190'
		},game),

		// left-hand mesa
		new Platform({
			position: {
				x: 0,
				y: game.height -80
			},
			height: 50,
			width: 250,
			isOneWay: true,
			color: '#CEAA6A'
		},game),
		// right-hand mesa
		new Platform({
			position: {
				x: 500,
				y: game.height -80
			},
			height: 50,
			width: 50,
			color: '#CEAA6A'
		},game),
		// green island
		new Platform({
			position: {
				x: game.width - 80,
				y: game.height - 80
			},
			height: 80,
			width: 40,
			color: '#7CAD8A'
		},game),
	].reverse().forEach(function(object){
		game.stages[0].addObject(object);
	});


	new Array(35).join(',|').split(',').forEach(function(object,i){
		game.stages[0].addObject(new Enemy({
			position: {
				x: 0 + (i * 70),
				y: game.height - 80 - (i*25)
			}
			
		},game));
	});

	game.stages.push(new Stage(game,1/5,[],game.camera.playerStageFollowing));

	game.stages[1].addObject(
		new Platform({
			position: {
				x: 500,
				y: 20
			},
			height: 80,
			width: 200,
			color: '#EFEFEF'
		},game)
	);

	// a cloud idea -- probably going to go with pre-drawn clouds, but this could be interesting too
	var backgroundStageWidth = game.width * 1 / ( game.stages[1].relativeMovementRatio )

	new Array(15).join(',|').split(',').forEach(function(object,i){
		game.stages[1].addObject(new Platform({
			position: {
				x: Math.round(backgroundStageWidth * Math.random()),
				y: Math.round( (game.height/3 - 200) * Math.random())
			},
			height: Math.round(200 * Math.random()),
			width: Math.round(400 * Math.random()),
			color: '#EFEFEF'
			
		},game));
	});


};

var game = new Game(document.getElementById('game'),aBasicLevel);
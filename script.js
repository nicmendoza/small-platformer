function Game(canvas){
	var self = this;

	self.height = canvas.height;
	self.width = canvas.width;
	self.gravity = 10;

	self.ctx = canvas.getContext('2d');
	self.objects = [new Player({x:self.width/2,y:self.height - 20},self)];

	self.inputs = new KeyboardListener()

	window.requestAnimationFrame(self.draw.bind(self));

}

Game.prototype.draw = function(){
	this.ctx.clearRect(0,0,this.width,this.height);
	this.objects.forEach(function(object){
		object.draw();
	});
	window.requestAnimationFrame(this.draw.bind(this));
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
		y: 0
	};

	self.isJumping = false;
}

Player.prototype.draw = function(){
	var self = this;

	self.game.inputs.isDown('LEFT') && (self.position.x -= self.currentMovementSpeed);
	self.game.inputs.isDown('RIGHT') && (self.position.x += self.currentMovementSpeed);
	self.game.inputs.isDown('SPACE') && !self.isFalling && !self.isJumping && self.jump();

	self.updateCrouching(self.game.inputs.isDown('DOWN'));
	evaluateMomentumEffect(this,this.game);

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
	self.isFalling = true;
	this.momentum.y = this.isCrouching ? -4 : -3;
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

function evaluateMomentumEffect(object,game){

	object.position.y += object.momentum.y;
	object.position.x += object.momentum.x;


	//todo: replace this with check if object intersecting something under it
	if(object.position.y > game.height - object.height){
		object.isFalling = false;
		object.isJumping = false;	
		object.momentum.y = 0;
	};

	if(object.isFalling){
		object.momentum.y += .1;
	}

}

var game = new Game(document.getElementById('game'));
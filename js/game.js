function Game(canvas){
	var self = this;

	self.run = true;

	self.height = canvas.height;
	self.width = canvas.width;
	this.backgroundColor = '#D7F8FC';

	self.periodStart = new Date();
	self.fps = 0;
	self.frames = 0;

	self.gravity = 6;
	self.maxFallSpeed = 12;
	self.oneWaysEnabled = true;

	self.deaths = 0;

	self.ctx = canvas.getContext('2d');

	self.HUD = new HUD(self);

	self.stages = [];

	// configure HUD
	self.HUD.addHUDItem({
		draw: function(ctx){
			ctx.font = '14px arial';
			ctx.fillText('deaths: ' + self.deaths, 4,14);
		}
	});


	self.HUD.addHUDItem({
		draw: function(ctx){
			ctx.font = '14px arial';
			ctx.fillText('fps: ' + self.fps, 4,28);
		}
	});

	self.HUD.addHUDItem({
		draw: function(ctx){

			var size = 50,
				gutter = 10
				drawY = gutter;

			ctx.font = '14px arial';

			for(var i = 0; i < game.player.maxPickups; i++){
				drawHUDBox(self.width - size - gutter, drawY, size, self.player.pickups[i]);
				drawY += ( size + gutter );
			}

			function drawHUDBox(x,y,size,pickup){

				var spriteX,spriteY;

				ctx.fillStyle = 'rgba(222,222,222,0.7)';
				ctx.fillRect(x,y, size, size );
				ctx.fillStyle = '#F9F9F9';
				ctx.fillRect( x + gutter / 2, y + gutter / 2, size * 0.8, size * 0.8 );

				if(pickup){

					

					if(pickup.sprite){

						spriteX = x + ( size * 0.8 ) / 2;
						spriteY = y + ( size * 0.8 ) / 2;

						pickup.sprite.draw(ctx, {x: spriteX, y: spriteY}, game.timeSinceLastDraw);
					} else {
						pickup.drawTransformations(ctx);

						ctx.fillRect( x + gutter / 2, y + gutter / 2, size * 0.8, size * 0.8 );

						ctx.font = '10px arial';
						ctx.fillStyle = 'white';
						ctx.fillText( pickup.label,x + ( size - ctx.measureText( pickup.label).width ) / 2 , y + ( size / 2 ) );
					}

					
				}
			}

		}
	});
		
	var levelLoader = new LevelLoader(game);

	self.load = function(level){
		levelLoader.load(self, 'levels/level-03.svg', function(){
			//update game state every 60th of a second
			setInterval(self.tick.bind(self),1000/60);
			//start draw loop
			self.draw();
		});
	};

	self.reset = function(){

		self.stages = [];

		self.setLevel(game.curentLevel);
		self.deaths++;
		delete self.resetting;
	};

	self.inputs = new InputListener();

	

}

Game.prototype.tick = function(){
	var self = this,
		now = new Date(), 
		stage;

	// delta Time in fractions of a second
	self.timeSinceLastDraw = ( now - ( self.lastDrawTime || now - 1 ) ) / 1000;

	self.ctx.save();

	for(var i = self.stages.length  - 1; i >= 0; i--){
		stage = self.stages[i];

		stage.objects.forEach(function(object){
			object.update && object.update(self);
			
		});

		stage.objects.forEach(function(object){
			object.checkCollisions && object.checkCollisions();
		});

		stage.update(self.player);

	}

	if(self.player.isOffScreen()){
		if(!self.resetting){
			self.resetting = true;
			setTimeout(self.reset,500);
		}
		
	}

	self.lastDrawTime = now;

	//force update of gamepad object
	navigator.getGamepads();

	self.frames++;
	if(now - self.periodStart >= 1000){
		self.fps = self.frames;
		self.periodStart = new Date();
		self.frames = 0;
	}
};

Game.prototype.draw = function(){
	var self = this,
		now = new Date(), 
		stage;

	self.ctx.save();
	self.ctx.fillStyle = this.backgroundColor;
	self.ctx.clearRect(0,0,this.width,this.height);
	self.ctx.fillRect(0,0,this.width,this.height);
	self.ctx.restore();

	for(var i = self.stages.length  - 1; i >= 0; i--){
		stage = self.stages[i];

		stage.objects.forEach(function(object){
			self.ctx.save();
			object.draw(self.ctx,self.timeSinceLastDraw);
			self.ctx.restore();
		});

	}
	self.HUD.draw(self.ctx);
	
	if(this.run){
		window.requestAnimationFrame(this.draw.bind(this));
	}
	
};

Game.prototype.setLevel = function(levelInit){
	levelInit.call(this,this);
	this.curentLevel = levelInit;
};

Game.prototype.resetLevel = function(){
	this.setLevel(this.currentLevel);
};

Game.prototype.getAllEntities = function(){
	return this.stages.reduce(function(accumulator,stage){ return accumulator.concat(stage.objects) },[]);
};

function InputListener(){
	var self = this,
		down = {},
		keys = {
			'LEFT': 	[37,65], // left arrow, a
			'UP' : 		38,
			'RIGHT': 	[39,68], // right arrow, d
			'DOWN': 	[40,83],
			'SPACE': 	[32,['buttons',2]],
			'FIRE': 	16 // shift key
		},
		controllerMapping = {
			'SPACE': ['buttons',2],
			'LEFT': ['axes',[0,-1]],
			'RIGHT' : ['axes', [0,1]],
			'UP' : ['axes', [1,-1]],
			'DOWN': ['axes', [1,1]],
			'FIRE': ['buttons', 3]
		},
		controllers = {};

	self.isDown = function(keyName){

		var keyPressed = keys[keyName].length ? ( keys[keyName].some(function(keyCode){ return down[keyCode]; }) || controllerButtonPressed ) : down[keys[keyName]],
			controllerButtonPressed,mapping;

		if(self.controller && controllerMapping[ keyName ]){
			
			mapping = controllerMapping[ keyName ];

			if( mapping[0] === 'axes'  ){
				// axis
				controllerButtonPressed = self.controller[ mapping[0] ][ mapping[1][0] ] === mapping[1][1];
			} else if( mapping[0] === 'buttons') {
				// button
				controllerButtonPressed = self.controller[ mapping[0] ][ mapping[1] ].pressed;
			}
		}



		return keyPressed || controllerButtonPressed;
	};

	document.addEventListener('keydown',function(e){
		down[e.keyCode] = true;
	});

	document.addEventListener('keyup',function(e){
		down[e.keyCode] = false;
	});

	if(window.GamepadEvent){
		// if/when connected, add controller
		window.addEventListener('gamepadconnected',addController);
		window.addEventListener('gamepaddisconnected',removeController);

		// for Chrome (for previously connected controllers)
		var interval = setInterval(function(){
			[].slice.call(navigator.getGamepads()).forEach(function(gamepad){
				addController(gamepad);
				// one controller is all we need
				clearInterval(interval);
			});
		},1000);

		
	}

	function addController(gamepadE){
			gamepad = gamepadE instanceof Event ? gamepadE.gamepad : gamepadE;
			gamepad && ( controllers[gamepad.id] = gamepad );
			self.controller = self.controller || gamepad;
		}

		function removeController(gamepadE){
			gamepad = gamepadE instanceof Event ? gamepadE.gamepad : gamepadE;
			delete controllers[gamepadEvent.gamepad.id];
		}

}
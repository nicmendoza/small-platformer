function Game(canvas,levelInit){
	var self = this;

	self.run = true;

	self.height = canvas.height;
	self.width = canvas.width;
	this.backgroundColor = '#D7F8FC';

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
		now = new Date(), 
		stage;

	// delta Time in fractions of a second
	self.timeSinceLastDraw = ( now - ( self.lastDrawTime || now - 1 ) ) / 1000;

	self.ctx.save();
	self.ctx.fillStyle = this.backgroundColor;
	self.ctx.clearRect(0,0,this.width,this.height);
	self.ctx.fillRect(0,0,this.width,this.height);
	self.ctx.restore();

	this.ctx.fillStyle = 'black';

	for(var i = self.stages.length  - 1; i >= 0; i--){
		stage = self.stages[i];

		stage.objects.forEach(function(object){
			self.ctx.save();
			object.draw(self.ctx,self.timeSinceLastDraw);
			self.ctx.restore();
		});

		stage.update(self.player);

	}

	if(self.player.isOffScreen()){
		if(!self.resetting){
			self.resetting = true;
			setTimeout(self.reset,500);
		}
		
	}

	self.HUD.draw(self.ctx);

	self.lastDrawTime = now;
	
	if(this.run){
		window.requestAnimationFrame(this.draw.bind(this));
	}
	
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
function Pickup(game,options){

	this.label = options.label;

	this.position = {
		x: options.x,
		y: options.y
	};
	this.game = game;

	this.width = 20;
	this.height = 20;

	this.sprite = options.sprite;

	this.drawTransformations = options.drawTransformations;

	if(options.type){
		this.types[options.type](this);
	}
}

Pickup.prototype = new Item();


Pickup.prototype.types = {

	fireball: function(pickup){

		var size = 20;

		pickup.label = 'Fireball',
		pickup.sprite = new Sprite({
			position: {
				x: 0,
				y: size
			},
			size: {
				height: size,
				width: size
			},
			url: 'img/player-sprites.png',
			speed: 7,
			frames: [0,1,2,3]
		});

		pickup.use = function(player){
			var now = new Date(),
					fireDelay = 500,//ms
					maxBounces = 3,
					initialMomentumY = -3,
					fireball;

				// if player is holding TWO fireballs, double the number of bounces
				if(player.pickups[1] && player.pickups[1].label === 'Fireball'){
					maxBounces = maxBounces * 2;
				}

				// prevent rapid-fire
				if(player.lastFired && now - player.lastFired < fireDelay){
					return;
				}

				player.lastFired = now;

				fireball = new Item();

				fireball.game = game;

				fireball.sprite = new Sprite({
					url: 'img/player-sprites.png',
					position: {
						x: 0,
						y: 0
					},
					size: {
						height: size,
						width: size
					},
					speed: 10, // frames per second,
					frames: [0,1,2,3,4,5]
				});

				fireball.width = size;
				fireball.height = size;
				fireball.position = {
					x: player.position.x,
					y: player.position.y
				}
				fireball.lastPosition = {};

				fireball.momentum = {
					x: player.momentum.x * 1.2 || ( player.direction === 'left' ? -4 : 4),
					y: initialMomentumY
				}

				fireball.direction = player.direction;

				fireball.isMovingObject = true;
				fireball.isFalling = true;

				fireball.bounces = 0;

				fireball.drawTransformations = function(ctx){
					ctx.fillStyle = 'red';
				}

				fireball.onUpdate = function(){

					//force a bounce!
					if(!fireball.isFalling){
						fireball.momentum.y = initialMomentumY;
						fireball.position.y -= 0.1;
						fireball.bounces++;
					}

					if(fireball.isAgainstWall()){
						fireball.bounces++;
						fireball.turnAround();
					}

					// kill enemies
					fireball.getIntersectingObjects()
						.forEach(function(object){
							if( object instanceof Enemy ) {
								object.die() && fireball.die() && resources.get('audio/stomp.wav').play();;
							}
						});

					// limit bounces
					if(fireball.bounces >= maxBounces || fireball.isOffScreen()){
						fireball.die();
					}
				}

				game.stages[0].addObject(fireball);

				resources.get('audio/fireball.wav').play();
		}

	},

	lightning: function(pickup){
		pickup.label = 'Lightning';

		pickup.drawTransformations = function(){};


		pickup.use = function(player){

			var lightning = new Item();
			var bolts = [lightningBoltPoints(200)];
			lightning.game = game;

			lightning.position = {
				x: player.position.x + player.width,
				y: player.position.y + player.height / 2
			};

			lightning.player = player;

			lightning.height = lightning.player.height;
			lightning.width = 200;

			var interval = setInterval(function(){
				bolts = [lightningBoltPoints(200)];
			},300);

			setTimeout(function(){
				game.stages[0].removeObject(lightning);
				clearInterval(interval);
			},1000);


			lightning.onUpdate = function(){

				
				// kill enemies
				lightning.getIntersectingObjects()
					.forEach(function(object){
						if( object instanceof Enemy ) {
							object.die();
						}
					});
			}


			// var intialMomentum = {
			// 	x: player.momentum.x,
			// 	y: player.momentum.y
			// },
			// 	positions = [];

			lightning.draw = function(){
				var position = game.stages[0].getRenderPosition(this.player);
				renderLightningBolt(position.x + this.player.width, position.y + this.player.height * .2,bolts[0]);
			};

			game.stages[0].addObject(lightning);


			
		};

		

		// generate array of coordinates for bolt
		
	}

};

window.lightningBoltPoints = function(maxLength){
	var dist = Math.round( Math.random() * maxLength),
		points = 10 + Math.round(Math.random() * 40),
		arr = [];

	for(var i = 0; i < points; i++){
		arr.push( {dist: Math.round( Math.random() * maxLength  ), disp: Math.round( Math.random() * 40 ) });
	}

	arr = arr.sort(function(a,b){
		return a.dist - b.dist;
	});



	return arr;

}
window.renderLightningBolt= function(startX,startY,bolt){
	var ctx = window.game.ctx;

	ctx.strokeStyle = 'white';
	ctx.shadowBlur = 4;
	ctx.shadowColor = "white";
	ctx.beginPath();

	ctx.moveTo(startX,startY);

	bolt.forEach(function(point){

		ctx.lineTo(startX + point.dist, startY + point.disp);

	});
	
	ctx.stroke();
	ctx.closePath();
};

game.run = false;

function Pickup(game,options){

	this.label = options.label;

	this.position = {
		x: options.x,
		y: options.y
	};
	this.game = game;

	this.width = 10;
	this.height = 10;

	this.sprite = options.sprite;

	this.drawTransformations = options.drawTransformations;

	if(options.type){
		this.types[options.type](this);
	}
}

Pickup.prototype = new Item();


Pickup.prototype.types = {

	fireball: function(pickup){

		pickup.label = 'Fireball',
		pickup.sprite = new Sprite({
			position: {
				x: 0,
				y: 10
			},
			size: {
				height: 10,
				width: 10
			},
			url: 'img/sprites.png',
			frames: [0]
		})

		pickup.use = function(player){
			var now = new Date(),
					fireDelay = 500,
					maxBounces = 3,
					fireball;

				// prevent rapid-fire
				if(player.lastFired && now - player.lastFired < fireDelay){
					return;
				}

				player.lastFired = now;

				fireball = new Item();

				fireball.game = game;

				fireball.sprite = new Sprite({
					url: 'img/sprites.png',
					position: {
						x: 0,
						y: 0
					},
					size: {
						height: 10,
						width: 10
					},
					speed: 10, // frames per second,
					frames: [0,1,2,3,4,5]
				});

				fireball.width = 8;
				fireball.height = 8;
				fireball.position = {
					x: player.position.x,
					y: player.position.y
				}
				fireball.lastPosition = {};

				fireball.momentum = {
					x: player.momentum.x * 1.2 || ( player.direction === 'left' ? -2 : 2),
					y: -3
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
						fireball.momentum.y = -3;
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

	}

};
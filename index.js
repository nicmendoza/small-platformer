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
			label: 'Fireball',
			color: 'red',
			sprite: new Sprite({
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
			}),
			drawTransformations: function(ctx){
				ctx.fillStyle = 'red';
			},
			onUse: function(player){


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

				fireball.width = 5;
				fireball.height = 5;
				fireball.position = {
					x: player.position.x,
					y: player.position.y
				}
				fireball.lastPosition = {};

				fireball.momentum = {
					x: player.momentum.x * 1.2 || ( player.direction === 'left' ? -2 : 2),
					y: 0
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
					if(fireball.bounces > maxBounces || fireball.isOffScreen()){
						fireball.die();
					}
				}

				game.stages[0].addObject(fireball);

				resources.get('audio/fireball.wav').play();

			}
		}),

		// patrolling enemy
		new Enemy({
			position: {
				x: game.width - 130,
				y: game.height - 80
			},
			onInit: function(){
				// this is optional
				this.patrolDistance = 200;
				this.patrolStartX = this.position.x
				this.momentum.x = 1;
			},
			onUpdate: function(){
				if(Math.abs(this.patrolStartX - this.position.x) >= this.patrolDistance || this.isAgainstWall() ){
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
			onInit: function(){
				//this.momentum.x = -1;
			},
			onUpdate: function(){

				if(!this.isFalling && Math.random() * 100 > 95 ){
					this.momentum.y = -4
					this.position.y+= 0.1;
					this.momentum.x = -(this.momentum.x);
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
			width: 5200,
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

	game.stages.push(new Stage(game,1/8,[],game.camera.playerStageFollowing));


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
			color: 'white'
			
		},game));
	});



	game.stages.push(new Stage(game,1/4,[],game.camera.playerStageFollowing));


	// a mountain idea
	var backgroundStageWidth = game.width * 1 / ( game.stages[1].relativeMovementRatio )

	new Array(15).join(',|').split(',').forEach(function(object,i){

		var height = Math.random() * 300;

		game.stages[2].addObject(new Platform({
			position: {
				x: Math.round(backgroundStageWidth * Math.random()),
				y: (game.height * 4) - height
			},
			height: height,
			width: Math.round(200 * Math.random()),
			color: '#D2BF9E'
			
		},game));
	});

	// to test having player have pickup immediately;
	game.player.getPickup(game.stages[0].objects[7])


};

resources.load([
    'img/sprites.png',
    'audio/fireball.wav',
    'audio/coin.wav',
    'audio/jump.wav',
    'audio/power-up.wav',
    'audio/stomp.wav',
    'audio/fall-into-lava.wav',
    'audio/music-pamgaea.mp3'
]);

resources.onReady(function(){
	resources.get('audio/music-pamgaea.mp3').volume = 0.3;
	resources.get('audio/music-pamgaea.mp3').loop = true;
	//resources.get('audio/music-pamgaea.mp3').play();
	window.game = new Game(document.getElementById('game'),aBasicLevel);
});


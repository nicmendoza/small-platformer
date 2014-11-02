function Pickup(game,options){
	this.use = options.onUse;
	this.label = options.label;

	this.position = options.position;
	this.game = game;

	this.width = 10;
	this.height = 10;

	this.drawTransformations = options.drawTransformations;
}

Pickup.prototype = new Item();
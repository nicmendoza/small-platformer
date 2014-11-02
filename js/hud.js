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
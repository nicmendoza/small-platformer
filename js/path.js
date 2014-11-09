var CIRCLE = Math.PI * 2;

function Path(){
	
}

Path.prototype.getPosition = function(){
	
};

function Line(game,options){
	var self = this;

	self.options = options;

	self.startPosition = {
		x: options.x1,
		y: options.y1
	};

	self.endPosition = {
		x: options.x2,
		y: options.y2
	};

	self.angle = Math.atan2(self.startPosition.y - self.endPosition.y, self.startPosition.x - self.endPosition.x);

	self.totalDistance = Math.sqrt( Math.pow( self.endPosition.x - self.startPosition.x, 2 ) + Math.pow( self.endPosition.y - self.startPosition.y , 2 ) );
	//todo: move this to platform, rather than path segment
	self.traversalTime = self.totalDistance / self.options.speed;

	self.moveX = self.endPosition.x !== self.startPosition.x;
	self.moveY = self.endPosition.y !== self.startPosition.y;

	self.xDefaultDirection = self.endPosition.x > self.startPosition.x ? 1 : -1;
	self.yDefaultDirection = self.endPosition.y > self.startPosition.y ? 1 : -1;

	self.position = {
		x: ( self.startPosition.x + self.endPosition.x ) / 2,
		y: ( self.startPosition.y + self.endPosition.y ) / 2
	}

}

Line.prototype.projectPosition = function(entity,secondsElapsed){
	var self = this,
		traversalTime = self.totalDistance / entity.options.speed, // seconds
		distance = self.totalDistance * ( secondsElapsed / traversalTime ), // pixels
		angle = entity.direction === 'backward' ? self.angle : ( self.angle + Math.PI ), // radians
		now = new Date(),
		timeElapsed = now - entity.legStartTime;

	if(!entity.legStartTime){
		entity.position = self.startPosition;
		entity.direction = 'forward';
		entity.legStartTime = now;
		entity.travelDistance = 0;
		return self.startPosition;

	} else {
		if( entity.travelDistance  >= self.totalDistance ){self.turnEntity(entity);}

		entity.travelDistance += distance;

		return {
			x: entity.position.x + distance * Math.cos(angle),
			y: entity.position.y + distance * Math.sin(angle)
		}
	}
}

Line.prototype.turnEntity = function(entity){
	entity.direction = entity.direction === 'forward' ? 'backward' : 'forward';
	entity.travelDistance = 0;
	entity.legStartTime = new Date();
};

Line.prototype.draw = function(ctx){

	var self = this,
		renderStart, renderEnd;


	if(self.options.draw){
		
		renderStart = self.stage.getRenderPosition({
			position: {
				x: self.startPosition.x,
				y: self.startPosition.y
			}
		});

		renderEnd = self.stage.getRenderPosition({
			position: {
				x: self.endPosition.x,
				y: self.endPosition.y
			}
		});

		ctx.strokeStyle = 'black';
		ctx.beginPath();

		ctx.moveTo(renderStart.x,renderStart.y);
		ctx.lineTo(renderEnd.x,renderEnd.y);
		ctx.stroke();
	}
};
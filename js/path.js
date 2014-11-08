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

	self.moveX = self.endPosition.x !== self.startPosition.x;
	self.moveY = self.endPosition.y !== self.startPosition.y;

	self.xDefaultDirection = self.endPosition.x > self.startPosition.x ? 1 : -1;
	self.yDefaultDirection = self.endPosition.y > self.startPosition.y ? 1 : -1;

	self.position = {
		x: ( self.startPosition.x + self.endPosition.x ) / 2,
		y: ( self.startPosition.y + self.endPosition.y ) / 2
	}

}

Line.prototype.getPosition = function(entity,timeElapsed){
	var self = this,
		newPosition = {
			x: entity.position.x,
			y: entity.position.y
		},
		now = new Date(),
		remainingX,
		remainingY,
		travelX,
		travelY;


	if(!entity.legStartTime){
		newPosition.x = self.startPosition.x;
		newPosition.y = self.startPosition.y;
		entity.direction = 'forward';
		entity.legStartTime = now;
	} else {


		if(self.moveX){
			remainingX = Math.abs( self[ entity.direction === 'forward' ? 'endPosition' : 'startPosition' ].x - entity.position.x );
			travelX = Math.min( entity.options.speed * timeElapsed, remainingX);
			newPosition.x += ( entity.direction === 'forward' ? 1 : -1 ) * self.xDefaultDirection * travelX;
		}

		if(self.moveY){
			remainingY = Math.abs( self[ entity.direction === 'forward' ? 'endPosition' : 'startPosition' ].y - entity.position.y );
			travelY = Math.min( entity.options.speed * timeElapsed, remainingY);
			newPosition.y += ( entity.direction === 'forward' ? 1 : -1 ) * self.yDefaultDirection * travelY;
		}

		if(entity.position.x === self.endPosition.x && entity.position.y === self.endPosition.y){
			entity.direction = 'backward';
			entity.legStartTime = now;
		} else if(entity.position.x === self.startPosition.x && entity.position.y === self.startPosition.y){
			entity.direction = 'forward';
			entity.legStartTime = now;
		}

	}
	
	return newPosition;
};

Line.prototype.draw = function(){};
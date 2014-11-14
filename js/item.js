function Item(game, options){

	//todo: see if there is a way to get this to work
	// var self = this;
	// [].slice.call(arguments).forEach(function(arg){
	// 	if(arg instanceof Game){
	// 		self.game = arg;
	// 	}
	// });w
}

Item.prototype.getIntersectingObjects = function(){
	var thisItem = this,
		thisLeft = this.position.x,
		thisRight = thisLeft + this.width,
		thisTop = this.position.y,
		thisBottom = thisTop + this.height;

	return this.stage.objects.filter(function(item){
		var itemLeft = item.position.x,
			itemRight = itemLeft + item.width,
			itemTop = item.position.y,
			itemBottom = itemTop + item.height;

		return item !== thisItem
			&& thisRight >= itemLeft
			&& thisLeft <= itemRight
			&& thisTop <= itemBottom
			&& thisBottom >= itemTop;
	});

	
};

Item.prototype.sides = function(){

	var sides = {
		current: {
			top: Math.round( this.position.y ),
			left: Math.round( this.position.x ),
			right: Math.round( this.position.x ) + this.width,
			bottom: Math.round( this.position.y ) + this.height
		}
	};

	if(this.lastPosition){
		sides.last =  {
			top: Math.round( this.lastPosition.y ),
			left: Math.round( this.lastPosition.x ),
			right: Math.round( this.lastPosition.x ) + this.width,
			bottom: Math.round( this.lastPosition.y ) + this.height
		};
	}

	return sides;
};

Item.prototype.wasAbove = function(object){
	var sides = this.sides(),
		objectSides = object.sides();

	return sides.last.bottom <= objectSides[objectSides.last ? 'last' : 'current'].top;
};



Item.prototype.wasBelow = function(object){
	var sides = this.sides(),
		objectSides = object.sides();

	return sides.last.top >= objectSides[objectSides.last ? 'last' : 'current'].bottom;
};

Item.prototype.isWithinLeftRightBounds = function(object){
	var sides = this.sides(),
		objectSides = object.sides();

	return sides.current.right > objectSides.current.left
		&& sides.current.left < objectSides.current.right;
};

Item.prototype.draw = function(ctx,timeSinceLastDraw){

	var position = this.stage.getRenderPosition(this);

	this.drawTransformations && this.drawTransformations(ctx);

	if(this.sprite){
		this.sprite.draw(ctx,position,timeSinceLastDraw);
	} else {
		ctx.fillRect(position.x,position.y,this.width,this.height);
	}
};

Item.prototype.update = function(game){
	
	this.onUpdate && this.onUpdate(game);

	if(this.isMovingObject){
		this.lastPosition.x = this.position.x;
		this.lastPosition.y = this.position.y;
		this.position.x += this.momentum.x;
		this.position.y += this.momentum.y;
	}

	
};

Item.prototype.checkCollisions = function(){
	if(this.isMovingObject){
		this.checkCollisionsY && this.checkCollisionsY();
		this.checkCollisionsX && this.checkCollisionsX();
	}
};

Item.prototype.getLeadingCorner = function(position){

	position = this.lastPosition;

	return {
		// uses right edge as default, unless facing left
		x: this.direction === 'left' ? position.x: position.x + this.width,
		// if falling, bottom, else top
		y: this.momentum.y > 0 ? position.y + this.height : position.y
	};
};


Item.prototype.checkCollisionsX = function(withControls){
	var self = this,
		leadingXCoord = self.getLeadingCorner()['x'],
		intersectingItems = self.getIntersectingObjects(),
		sides = self.sides();

		intersectingItems
			.filter(function(object){

				var objectSides = object.sides();

				return object.isObstacle
					&& !object.isOneWay // one-ways don't affect x-collisions
					&& ( sides.current.bottom > objectSides.current.top )
					&& ( sides.current.top < objectSides.current.bottom );
			})
			.forEach(function(obj){
				var nearestEdge = self.direction === 'left' ? obj.position.x + obj.width : obj.position.x;

				if(self.momentum.x < 0){
					self.position.x = self.lastPosition.x + Math.max(self.momentum.x, nearestEdge - leadingXCoord);
					self.direction = 'left';
				} else if(self.momentum.x > 0){
					self.position.x = self.lastPosition.x + Math.min(self.momentum.x, obj.position.x - leadingXCoord);
					self.direction = 'right';
				}

				// trigger interaction if there is one to trigger

			});

};

Item.prototype.checkCollisionsY = function(){

	var self = this,
		leadingCoord = self.getLeadingCorner(),
		leadingYCoord = leadingCoord.y,
		isOnGround, ground,
		intersectingItems = self.getIntersectingObjects()
			.filter(function(object){

				if(typeof self.bounces !== 'undefined' && object.color === 'salmon'){
					//debugger;
				}

				return ( object.isObstacle && ( !(self instanceof Player) || ( object.isOneWay ? self.game.oneWaysEnabled : true ) ) )
					&& ( object.isOneWay ? self.momentum.y > 0 : true )
					&& ( self.momentum.y > 0 ? self.wasAbove(object) : self.wasBelow(object) );
			})
			.forEach(function(obj){

				var nearestEdge = self.momentum.y < 0 ? obj.position.y + obj.height : obj.position.y;

				if(obj.canSupportPlayer){
					if(self.momentum.y < 0){
						self.position.y = nearestEdge;
						self.momentum.y = 0;
					} else if(self.momentum.y > 0){
						self.position.y = self.lastPosition.y + Math.min( self.momentum.y, nearestEdge - leadingYCoord );
						// wait to cancel out momentum until after bounce logic
					}

					if(self.position.y + self.height === nearestEdge){
						isOnGround = true;
						ground = obj;
					}
				}				

				obj.push && obj.push(self);

			});

	if(isOnGround){

		// if falling at 75% of max fall speed or faster, bounce when hitting the ground
		if(self.isFalling && self.momentum.y > self.game.maxFallSpeed * 0.75){
			// flip momentum
			self.momentum.y = -(Math.ceil( self.momentum.y * ground.springiness) );
			// if we achieved bounce, get player off ground so they can actually bounce
			if(self.momentum.y){
				self.position.y -= 0.1;
			}
			
		} else {
			self.momentum.y = 0;
			self.isFalling = false;
		}

	} else {
		self.momentum.y += 0.2;
		// comment out to fly :)
		self.isFalling = true;
	}

};

Item.prototype.turnAround = function(){
	this.direction = this.direction === 'left' ? 'right' : 'left';
	// flip its momentum
	this.momentum.x = -(this.momentum.x);
	// get it off the wall
	this.position.x += this.momentum.x;
};

Item.prototype.isOffScreen = function(){
	if(this.position.y > this.game.height){
		return true;
	}
};

Item.prototype.isAgainstWall = function(){
	return this.position.x === this.lastPosition.x;
};

Item.prototype.die = function(){
	return this.stage.garbage.push(this);
};
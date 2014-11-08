function Item(game, options){

	//todo: see if there is a way to get this to work
	// var self = this;
	// [].slice.call(arguments).forEach(function(arg){
	// 	if(arg instanceof Game){
	// 		self.game = arg;
	// 	}
	// });
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

Item.prototype.draw = function(ctx,timeSinceLastDraw){

	this.update && this.update(this.game);
	this.onUpdate && this.onUpdate(this.game);

	if(this.isMovingObject){
		this.updateY && this.updateY();
		this.updateX && this.updateX();
	}

	var position = this.stage.getRenderPosition(this);

	this.drawTransformations && this.drawTransformations(ctx);

	if(this.sprite){
		this.sprite.draw(ctx,position,timeSinceLastDraw);
	} else {
		ctx.fillRect(position.x,position.y,this.width,this.height);
	}

	
};

Item.prototype.getLeadingCorner = function(){

	return {
		// uses right edge as default, unless facing left
		x: this.direction === 'left' ? this.position.x: this.position.x + this.width,
		// if falling, bottom, else top
		y: this.momentum.y > 0 ? this.position.y + this.height : this.position.y
	}
};


Item.prototype.updateX = function(withControls){
	var self = this,
		leadingXCoord = self.getLeadingCorner()['x'],
		closestObject = self.stage.objects
			.filter(function(object){
				return object.isObstacle && !object.isOneWay;
			})
			.filter(function(object){
				// player is not over or under object
				return self.position.y + self.height > object.position.y 
					&& self.position.y < object.position.y + object.height;
			})
			.filter(function(object){
				// object is "in front" of player
				if(self.direction === 'left'){
					return object.position.x + object.width <= leadingXCoord;
				} else {
					return object.position.x >= leadingXCoord;
				}
			})
			.sort(function(a,b){
				//need to handle them being equal
				return Math.abs(self.position.x - a.position.x) > Math.abs(self.position.x - b.position.x) ? 1 : 0;
			})[0],
		closestObjectNearestEdge = closestObject && ( self.direction === 'left' ? closestObject.position.x + closestObject.width : closestObject.position.x ),
		movementSpeed = self.isCrouching ? self.currentMovementSpeed/5 : self.currentMovementSpeed;


	self.lastPosition.x = self.position.x;

	if(self.momentum.x < 0){

		

		self.position.x = self.position.x + ( closestObject ? Math.max(self.momentum.x, closestObjectNearestEdge - leadingXCoord ) : self.momentum.x );
		self.direction = 'left';
	} else if(self.momentum.x > 0){
		self.position.x = self.position.x +  ( closestObject ? Math.min(self.momentum.x, closestObject.position.x - leadingXCoord ) : self.momentum.x );
		self.direction = 'right';
	}

};

Item.prototype.updateY = function(){

	var self = this,
		leadingCoord = self.getLeadingCorner(),
		closestObject = self.stage.objects

			.filter(function(object){
					// object can block current item we're evaluating
				return object.isObstacle && ( !(self instanceof Player) || ( object.isOneWay ? self.game.oneWaysEnabled : true ) )

					// current item we're evaluating is over object
					&& self.position.x + self.width > object.position.x
					&& self.position.x < object.position.x + object.width

					// current item we're evaluating is higher than top of object
					&& self.position.y + self.height <= object.position.y

					// current item we're evaluating was previously above object (not jumping through from bottom)
					//&& self.position.y - self.momentum.y < object.position.y;
			})
			.sort(function(a,b){
				//sort by closest to current item we're evaluating
				//need to handle them being equal
				return Math.abs(self.position.y - a.position.y) > Math.abs(self.position.y - b.position.y) ? 1 : 0;
			})[0],
		closestObjectNearestEdge = closestObject && closestObject.position.y,
		isOnGround = Math.abs(self.position.y + self.height - closestObjectNearestEdge) < 1;

	

	if(isOnGround){

		// if falling at 75% of max fall speed or faster, bounce when hitting the ground
		if(self.isFalling && self.momentum.y > self.game.maxFallSpeed * 0.75){
			// flip momentum
			self.momentum.y = -(Math.ceil( self.momentum.y * closestObject.springiness) );
			// if we achieved bounce, get player off ground so they can actually bounce
			if(self.momentum.y){
				self.position.y -= 0.1;
			}
			
		}

		//reset momentum while on ground (if player was already on ground previously)
		if(self.lastPosition.y === self.position.y){
			self.momentum.y = 0;
			self.isFalling = false;
		}

	} else {
		self.momentum.y += 0.2;
		// comment out to fly :)
		self.isFalling = true;
	}


	self.position.y = self.position.y + ( closestObject ? Math.min(self.momentum.y, closestObjectNearestEdge - leadingCoord.y ) : self.momentum.y);
	self.lastPosition.y = self.position.y;

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
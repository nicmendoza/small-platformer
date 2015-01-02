//url, position, size, speed, frames, direction, once

//todo: center sprite over entity, or maybea way to provide an offset

function Sprite(options) {
    this.position = options.position;
    this.size = options.size;
    this.speed = typeof options.speed === 'number' ? options.speed : 0;
    this.frames = options.frames;
    this.currentFrame = 0;
    this._index = 0;
    this.scalingFactor = options.scalingFactor || 1;
    this.url = options.url;
    this.direction = options.direction || 'horizontal';
    this.once = options.once;
    this.offset = options.offset;
};

Sprite.prototype.draw = function(ctx,position,elapsedTime){
	this.update(elapsedTime);

	var x = this.position.x + ( this.offset && this.offset.x ? this.offset.x : 0 ),
		y = this.position.y - ( this.offset && this.offset.y ? this.offset.y : 0 ),
		frame,max,index;

    if(this.direction === 'vertical'){
    	y += this.frames[this.currentFrame] * this.size.height;
    } else {
    	x += this.frames[this.currentFrame] * this.size.width;
    }


	ctx.drawImage( resources.get(this.url), x, y, this.size.width, this.size.height, position.x, position.y, this.size.width*this.scalingFactor, this.size.height*this.scalingFactor);
};

Sprite.prototype.update = function(elapsedTime){
	this._index += elapsedTime;

	// _index tracks time since last frame change, it increments based on speed
	if(!this.completed && this._index > 1 / this.speed){
		// go to next frame and reset index
		this.currentFrame++;
		this._index = 0;

		//however, if we've gone too far, reset to frame 0
		if(this.currentFrame === this.frames.length){
			if(this.once){
				this.completed = true;
				this.currentFrame = this.frames[this.frames.length - 1];
				if(typeof this.onCompleteOnce === 'function'){
					this.onCompleteOnce();
				}
			} else {
				this.currentFrame = 0;
			}
			
		}
	}
};

Sprite.prototype.reset = function(){
	this.currentFrame = 0;
	this.completed = false;
	return this;
}
//url, position, size, speed, frames, direction, once

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
};

Sprite.prototype.draw = function(ctx,position,elapsedTime){
	this.update(elapsedTime);

	var x = this.position.x,
		y = this.position.y,
		frame,max,index;


    if(this.direction === 'vertical'){
    	y += this.currentFrame * this.size.height;
    } else {
    	x += this.currentFrame * this.size.width;
    }


	ctx.drawImage( resources.get(this.url), x, y, this.size.width, this.size.height, position.x, position.y, this.size.width*this.scalingFactor, this.size.height*this.scalingFactor);
};

Sprite.prototype.update = function(elapsedTime){
	this._index += elapsedTime;

	// _index tracks time since last frame change, it increments based on speed
	if(this._index > 1 / this.speed){
		// go to next frame and reset index
		this.currentFrame++;
		this._index = 0;

		//however, if we've gone too far, reset to frame 0
		if(this.currentFrame === this.frames.length){
			this.currentFrame = 0;
		}
	}
};
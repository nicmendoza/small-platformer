function LevelLoader(game){
	var self = this;
}

(function(){
	LevelLoader.prototype.load = function(game,url,callback){
		var self = this;
		marmottajax(url).then(function(resp){
			
			var el = document.createElement('div');
			el.innerHTML = resp;

			game.setLevel( self.createLevel(domElementsToEntities( el.children[0].querySelectorAll('*') ) ) );
			
			typeof callback === 'function' && callback();
		});
	};

	LevelLoader.prototype.createLevel = function(entities){
		return function(game){

			game.player = entities.filter(function(entity){
				return entity instanceof Player;
			})[0];

			game.stages.push(
				new Stage(game,1,[],game.camera.playerNudging)
			);

			entities.forEach(function(entity){
				game.stages[0].addObject(entity);
			});

		};
	};


	function domElementsToEntities(domElementsArray){
		return [].slice.call(domElementsArray).map(function(domElement){

			var constructor = domElement.tagName.charAt(0).toUpperCase() + domElement.tagName.slice(1),
				options = [].slice.call(domElement.attributes).reduce(function(accumulator, curr, i, arr) {
					var asNum = parseInt(curr.value,10),
						val = isNaN(asNum) ? curr.value : asNum;

					accumulator[curr.name] = val;
					return accumulator;
				}, {});

			return new window[constructor](game,options);

		});
	}

})();
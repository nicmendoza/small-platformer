function LevelLoader(game){
	var self = this;
}

(function(){
	LevelLoader.prototype.load = function(game,url,callback){
		var self = this;
		marmottajax(url).then(function(resp){
			
			var el = document.createElement('div');
			el.innerHTML = resp;

			game.setLevel( self.createLevel( el.children[0].querySelectorAll('stage') ) );
			
			typeof callback === 'function' && callback();
		});
	};

	LevelLoader.prototype.createLevel = function(stages){
		return function(game){

			var player;

			[].slice.call(stages).forEach(function(stageElement,i){

				var stage = domElementToEntity(stageElement);

				game.stages.push(stage);

				[].slice.call(stageElement.children).map(function(domElement){
					var newObj = domElementToEntity(domElement);
					newObj.stage = game.stages[i];
					game.stages[i].addObject( newObj );

					if(newObj instanceof Player){
						game.player = newObj;
					}
				});

			});


		};
	};

	function domElementToEntity(domElement){
		var constructor = domElement.tagName.charAt(0).toUpperCase() + domElement.tagName.slice(1),
			options = [].slice.call(domElement.attributes).reduce(function(accumulator, curr, i, arr) {
				var asNum = parseFloat(curr.value,10),
					val = isNaN(asNum) ? curr.value : asNum;

				accumulator[curr.name] = val;
				return accumulator;
			}, {});

		return new window[constructor](game,options);
	}

})();
resources.load([
    'img/sprites.png',
    'audio/fireball.wav',
    'audio/coin.wav',
    'audio/jump.wav',
    'audio/power-up.wav',
    'audio/stomp.wav',
    'audio/fall-into-lava.wav',
    'audio/music-pamgaea.mp3'
]);

resources.onReady(function(){
	resources.get('audio/music-pamgaea.mp3').volume = 0.3;
	resources.get('audio/music-pamgaea.mp3').loop = true;
	//resources.get('audio/music-pamgaea.mp3').play();
	window.game = new Game(document.getElementById('game'));

	game.load('levels/level-01.svg');
});


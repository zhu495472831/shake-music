var player = null;
var socket = null;
var mediaEvts = ['loadedmetadata','ended','timeupdate','error'];
function init(){
	player = audio;
	socket = io('http://1.1.1.69:3000');
	initIOEvts();
	initMediaEvents(player);
	initVolEvts();
	nextSong();
}

function initIOEvts(){
	socket.on('connect',function(){
		console.log('websocket连接已建立...');
	});

	socket.on('next',function(data){
		getSong().then(function(val){
			var song = dealSong(val);
			socket.emit('message',{cmd:'ok',data:song});
		},function(err){
			console.log(err);
		});
	});

}

function initMediaEvents(player){
	mediaEvts.forEach(function(evt,idx,arr){
		var cb = evt+'CB';
		player.addEventListener(evt,window[cb],!1);
	});
}

function initVolEvts(){
	muted.addEventListener('click',function(e){
		player.muted = !0;
		volInner.style.width = 0;
	},!1);
	volMax.addEventListener('click',function(e){
		player.volume = 1;
		volInner.style.width = '100%';
	},!1);
	volSilder.addEventListener('click',function(e){
		var x = e.pageX,
			rect = this.getBoundingClientRect();
		var metaX = x - rect.left;
		volInner.style.width = metaX+'px';
		player.volume = (metaX/rect.width).toFixed(1);
	},!1);
}

function loadedmetadataCB(){
	var duration = ~~player.duration;
	time.innerText = formatTime(duration);
}

function formatTime(duration){
	var minutes = ~~(duration/60),
		seconds = ~~(duration%60);
	(minutes<10)&&(minutes='0'+minutes);
	(seconds<10)&&(seconds='0'+seconds);
	return minutes+':'+seconds;
}

function timeupdateCB(){
	var duration = player.duration,
		curTime  = player.currentTime;
	var percent = (curTime/duration)*100+'%';
	time.innerText = formatTime((~~(duration-curTime)));
	progress.style.width = percent;
}

function nextSong(){
	getSong().then(function(val){
		dealSong(val);
	},function(err){
		console.log(err);
	});
}

function errorCB(e){
	nextSong();
}

function endedCB(){
	nextSong();
}
function dealSong(responseText){
	var songObj = JSON.parse(responseText),
		song = songObj.song[0];
	updateUI(song);
	setMedia(song);
	return song;
}

function setMedia(song){
	var songSrc = song.url,
		lrc = song.lrc;
	player.src = songSrc;
	player.volume = 0.5;
	player.play();
}

function updateUI(song){
	var name = song.title,
		artist = song.artist,
		img = song.picture;
	songName.innerText = name;
	author.querySelector('span').innerText = artist;
	bg.style.backgroundImage = 'url('+img+')';
}

function getSong(){
	return new Promise(function(resolve,reject){
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					resolve(xhr.responseText);
				}else{
					reject('发生错误');
				}
			}
		};
		xhr.open('get', 'http://api.jirengu.com/fm/getSong.php?channel=1', !0);
		xhr.send();
	});
}

window.onload = function(){
	init();
};
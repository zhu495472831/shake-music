var player = null;
var socket = null;
var isPause = !0;
var GET_SONG_URL = 'http://api.jirengu.com/fm/getSong.php?channel=2';
var GET_LRC_URL = 'http://api.jirengu.com/fm/getLyric.php?&sid=';
var mediaEvts = ['loadedmetadata','ended','timeupdate','error'];
function init(){
	player = audio;
	socket = io('http://1.1.1.69:3000');
	initIOEvts();
	initMediaEvents(player);
	initVolEvts();
	initCtrlEvts();
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

function initCtrlEvts(){
	prev.addEventListener('click',function(e){
		nextSong();
	},!1);
	next.addEventListener('click',function(e){
		nextSong();
	},!1);
	play.addEventListener('click',function(e){
		isPause = !isPause;
		console.log(isPause);
		if(!isPause){
			player.pause();
		}else{
			player.play();
		}
	},!1);
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

function getLrcUrl(sid){
	return GET_LRC_URL+sid;
}
var Lrc  = {timeArr:null,pos:0,OFFSET:.5,isLrc:!1};
function analysisLrc(lrc) {
	var lrcTxt = lrc,
		lrcTxtArr = lrcTxt.split("\n"),
		tmp,
		lyricItemText,
		offsetTime = 0;
		lrcTxtArr.shift();

	Lrc.timeArr = new Array;

	for (var i = 0; i < lrcTxtArr.length; ++i) {
		tmp = lrcTxtArr[i].trim();
		if (tmp == "" || tmp == undefined) continue;
		if (tmp.indexOf("[ar:") == 0) continue;
		if (tmp.indexOf("[al:") == 0) continue;
		if (tmp.indexOf("[ti:") == 0) {
			Lrc.timeArr[Lrc.timeArr.length] = new Array;
			Lrc.timeArr[Lrc.timeArr.length - 1][0] = 0;
			Lrc.timeArr[Lrc.timeArr.length - 1][1] = tmp.substring(4, tmp.length - 1);
			Lrc.timeArr[Lrc.timeArr.length - 1][2] = "ti";
			Lrc.timeArr[Lrc.timeArr.length] = new Array;
			Lrc.timeArr[Lrc.timeArr.length - 1][0] = 0;
			Lrc.timeArr[Lrc.timeArr.length - 1][1] = "By ZMX";
			Lrc.timeArr[Lrc.timeArr.length - 1][2] = "by";
			continue
		}
		if (tmp.indexOf("[by:") == 0) continue;
		if (tmp.indexOf("歌曲") == 0) continue;
		if (tmp.indexOf("[offset:") == 0) {
			offsetTime = Number(tmp.substring(8, tmp.indexOf("]")));
			continue
		}
		if (tmp.indexOf("[") == 0 && tmp.indexOf(":") == 3) {
			lyricItemText = tmp.substring(tmp.lastIndexOf("]") + 1).trim();
			var lyricItemTime = tmp.substring(1, tmp.lastIndexOf("]"));

			lyricItemTime = lyricItemTime.split("][");
			for (var a = 0; a < lyricItemTime.length; ++a) {
				var minute = parseInt(lyricItemTime[a].split(":")[0]),
					second = Number(lyricItemTime[a].split(":")[1]),
					time = minute * 60 + second + offsetTime;
					Lrc.timeArr[Lrc.timeArr.length] = new Array;
					Lrc.timeArr[Lrc.timeArr.length - 1][0] = time;
					Lrc.timeArr[Lrc.timeArr.length - 1][1] = lyricItemText
			}
		}
	}
	var sortMode = function(arr1, arr2) {
		return arr1[0] - arr2[0]
	};
	Lrc.timeArr = Lrc.timeArr.sort(sortMode);
	Lrc.isLrc = !0;
	Lrc.lrcCntHeight = Lrc.timeArr.length*30;
	lrcRender(Lrc.timeArr);
}
function lrcRender(lrcArr){
	var lrcHtml = '',
		$lrcCnt= document.getElementById('lrcCnt');
	for (var i = 0,l = lrcArr.length; i < l; ++i) {
		var headClass = "";
		lrcArr[i][2] == "ti" ? headClass = "tit" : lrcArr[i][2] == "by" && (headClass = "italic");
		lrcHtml += '<p id="lrc' + i + '" class="text ' + headClass + '">' + lrcArr[i][1] + "</p>";
	}
	$lrcCnt.innerHTML = '';
	$lrcCnt.innerHTML = lrcHtml;
	$lrcCnt.style.transform = 'translate3d(0,0,0)';
}
function showLrc(currentTime){
	var $lrcCnt= document.getElementById('lrcCnt');
	var $lrcWrap = $lrcCnt.parentNode;
	if (Lrc.timeArr.length == 0) return;
	var isStart = !1;
	if (Lrc.pos == 0) {
		isStart = !0;
		if (currentTime < Lrc.timeArr[0][0] - Lrc.OFFSET) Lrc.pos = 0;
		else if (currentTime > Lrc.timeArr[Lrc.timeArr.length - 1][0]) Lrc.pos = Lrc.timeArr.length - 1;
		else for (var n = 0; n < Lrc.timeArr.length - 1; ++n) if (currentTime > Lrc.timeArr[n][0] - Lrc.OFFSET && currentTime < Lrc.timeArr[n + 1][0]) {
			Lrc.pos = n;
			break
		}
	}
	Lrc.pos + 1 < Lrc.timeArr.length && currentTime > Lrc.timeArr[Lrc.pos + 1][0] - Lrc.OFFSET && ($lrcCnt.querySelector(".text.cur").classList.remove("cur"), ++Lrc.pos, isStart = !0);
	$lrcCnt.querySelector('#lrc'+Lrc.pos).classList.add("cur");
	var scrollheight = ~~($lrcWrap.clientHeight/30)-1;
	if (Lrc.pos >= scrollheight && isStart) {
		var i = Lrc.pos - scrollheight;
		var translateY = (- i*30)+'px';
		i * 30 >  Lrc.lrcCntHeight - $lrcWrap.clientHeight? $lrcCnt.style.transform = 'translate3d(0,'+(-(Lrc.lrcCntHeight - $lrcWrap.clientHeight))+',0)' : $lrcCnt.style.transform = 'translate3d(0,'+translateY+',0)';
	}

	
	
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
	Lrc.isLrc&&showLrc(curTime);
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

function getLrc(sid){
	Lrc.isLrc = !1;
	Lrc.pos = 0;
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				analysisLrc(JSON.parse(xhr.responseText).lyric);
			} else {
				console.log('发生错误');
			}
		}
	};
	xhr.open('get', getLrcUrl(sid), !0);
	xhr.send();
}
function dealSong(responseText){
	var songObj = JSON.parse(responseText),
		song = songObj.song[0];

	updateUI(song);
	getLrc(song.sid);
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
	poster.querySelector('img').src = img;
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
		xhr.open('get', GET_SONG_URL, !0);
		xhr.send();
	});
}

window.onload = function(){
	init();
};
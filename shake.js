var lastX = null,
	lastY = null,
	lastZ = null;
var threshold = 15;
var timeout = 1000;
var lastTime = null;
var isShaking = !1;
var host = location.href;
var socket = null;
document.addEventListener('DOMContentLoaded',function(e){
	ready();
},!1);

document.addEventListener('touchstart',autoplay,!1);

([]).slice.call(document.querySelectorAll('.hand')).forEach(function(el,idx,arr){
	el.addEventListener('webkitAnimationEnd',function(e){
		isShaking = !1;
		wrap.classList.remove('active');
	},!1);
});

function autoplay(){
	shaking.play();
	found.play();
	document.removeEventListener('touchstart',autoplay);
}

function ready(){
	if(window.DeviceMotionEvent){
		socket = io('http://1.1.1.69:3000');
		initIOEvts();
		window.addEventListener('devicemotion',handler,!1);
		lastTime = new Date();
	}else{
		alert('你的浏览器不支持摇一摇功能.');
	}
}

function initIOEvts(){
	socket.on('connect',function(){
		console.log('websocket连接已建立...');
	});

	socket.on('ok',function(data){
		if(found.src!=host+'found.mp3'){
			found.src = 'found.mp3';
		}
		found.play();
		tip.innerText = '正在欣赏：'+data.artist+'--'+data.title;
		tip.classList.remove('active');
		tip.offsetWidth = tip.offsetWidth;
		tip.classList.add('active');
	});

}

function handler(e){
	var current = e.accelerationIncludingGravity;
	var currentTime;
	var timeDifference;
	var deltaX = 0;
	var deltaY = 0;
	var deltaZ = 0;

	if ((lastX === null) && (lastY === null) && (lastZ === null)) {
		lastX = current.x;
		lastY = current.y;
		lastZ = current.z;
		return;
	}

	deltaX = Math.abs(lastX - current.x);
	deltaY = Math.abs(lastY - current.y);
	deltaZ = Math.abs(lastZ - current.z);

	if (((deltaX > threshold) && (deltaY > threshold)) || ((deltaX > threshold) && (deltaZ > threshold)) || ((deltaY > threshold) && (deltaZ > threshold))) {
		currentTime = new Date();
		timeDifference = currentTime.getTime() - lastTime.getTime();
		if (timeDifference > timeout) {
			dealShake();
			lastTime = new Date();
		}
	}

	lastX = current.x;
	lastY = current.y;
	lastZ = current.z;
}

function dealShake(){
	if(isShaking) return;
	isShaking = !0;
	if(shaking.src!=host+'shaking.mp3'){
		shaking.src = 'shaking.mp3';
	}
	shaking.play();
	wrap.classList.add('active');
	setTimeout(function(){
		socket.emit('message',{cmd:'next',data:null});
	},1000);
	
}

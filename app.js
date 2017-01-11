const http = require('http');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
app.use(express.static('./'));

app.get('/',(req,res)=>{
	var userAgent = req.headers['user-agent'].toLowerCase();
	if(/(android|iphone|mobile)/.test(userAgent)){
		res.sendFile(__dirname+'/shake_m.html');
	}else{
		res.sendFile(__dirname+'/shake_pc.html');
	}
});

io.on('connection',function(socket){
	var usrname = '',
		sendData = {};
	console.log('a client connect...'+socket.id);
	socket.on('disconnect',function(){
		console.log(`设备${socket.id}断开连接.`);
	});

	socket.on('message',function(data){
		var cmd = data.cmd;
		if(cmd == 'next'){
			socket.broadcast.emit('next');
		}else if(cmd == 'ok'){
			socket.broadcast.emit('ok',data.data);
		}
	});

	
});
server.listen(3000,function(){
	console.log('start listening on 3000 port...');
});

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var circles = [];
var players = [];
var ranking = [];

if(circles.length === 0){
  createAllFood();
}

function getCircles(callback){
  callback(circles);
}

function getPlayers(callback){
  callback(players);
}

function insertCircle(circle) {
  circles.push(circle);
}

function insertPlayer(player) {
  players.push(player);
}

function updateCircle(circleChanged) {
  circles = circles.map(function(circle){
    if (circleChanged.id === circle.id){
      return circleChanged;
    }else{
      return circle;
    }
  });
}

function updatePlayer(playerChanged) {
  players = players.map(function(player){
    if (playerChanged.id === player.id){
      return playerChanged;
    }else{
      return player;
    }
  });
}

function newCircle(circle, callback){
  circle.id = getNextIdCircle();
  insertCircle(circle);
  callback(circle);
}

function getNextIdCircle(){
  var max = 0;
  circles.map(function(circle){
    if (circle.id > max)
      max = circle.id;
  });
  return parseInt(max) + 1;
}

function newPlayer(player, callback){
  player.id = getNextIdPlayer();
  insertPlayer(player);
  callback(player);
}

function getNextIdPlayer(){
  var max = 0;
  players.map(function(player){
    if (player.id > max)
      max = player.id;
  });
  return parseInt(max) + 1;
}

function load(){
  io.emit('circles', circles);
  io.emit('players', players);
}

function createAllFood(){
  for (var i = 1; i <= 500; i++){
    newFood(i, randomColors());
  }
}

function newFood(i, color){
  var x = Math.floor(Math.random() * 2990);
  var y = Math.floor(Math.random() * 1990);
  var food = { id: i, r: 6, cx: x, cy: y, fill: color, type: "FOOD"};
  insertCircle(food);
}

function randomColors(){
  var colors = ["#ff1a1a", "#3366ff", "#33cc33", "#ffff00", "#ff0066", "#ff471a", "#cc0099"];
  return colors[Math.floor(Math.random() * colors.length)];
}

app.use("/public", express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

var port = process.env.PORT || 3000;

http.listen(port, function() {
  console.log('Server listening on port 3000...');
});

io.on('connection', function(socket) {
  console.log('connected');

  getCircles(function(circles) {
    if (!circles) circles = [];
    socket.emit('circles', circles);
  });

  getPlayers(function(players) {
    if (!players) players = [];
    socket.emit('players', players);
  });

  socket.on('newCircle', function(circle){
    newCircle(circle, function(newCircle){
      socket.emit('circle', newCircle);
    });
  });

  socket.on('newPlayer', function(player){
    newPlayer(player, function(newPlayer){
      socket.emit('player', newPlayer);
    });
  });

  socket.on('updateCircle', function(circle){
    updateCircle(circle);
  });

  socket.on('updatePlayer', function(player){
    updatePlayer(player);
  });

  socket.on('load', function(){
    load();
  });

});

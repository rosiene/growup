var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');

var dbFile = 'game.db';
var dbExists = fs.existsSync(dbFile);
var db = new sqlite3.Database(dbFile);

if (!dbExists) {
  console.log("Creating database file");
  fs.openSync(dbFile, "w");
    createCircle();
    createPlayer();
    setTimeout(function() {
      createAllFood()
    }, 50);
}

function createCircle(){
  db.run("CREATE TABLE circles (" +
          "id INT PRIMARY KEY, " +
          "r INT, " +
          "cx INT, " +
          "cy INT, " +
          "fill TEXT, " +
          "type TEXT)");
}

function createPlayer(){
  db.run("CREATE TABLE players (" +
          "id INT PRIMARY KEY, " +
          "id_circle INT REFERENCES circles(id), " +
          "name TEXT, " +
          "score INT, " +
          "delay INT, " +
          "ranking INT, " +
          "alive INT)");
}

function insertCircle(circle) {
  console.log("insertCircle ", circle);
  db.run("INSERT INTO circles VALUES (?, ?, ?, ?, ?, ?)",
    [circle.id
      , circle.r
      , circle.cx
      , circle.cy
      , circle.fill
      , circle.type
    ]
  );
}

function insertPlayer(player) {
  console.log("insertPlayer ", player);
  db.run("INSERT INTO players VALUES (?, ?, ?, ?, ?, ?, ?)",
    [player.id
      , player.id_circle
      , player.name
      , player.score
      , player.delay
      , player.ranking
      , player.alive
    ]
  );
}

function updateCircle(circle) {
  db.run("UPDATE circles SET r = ?, cx =  ?, cy =  ?, fill = ? " +
          "WHERE id = ?",
    [circle.r
      , circle.cx
      , circle.cy
      , circle.fill
      , circle.id
    ]
  );
}

function updatePlayer(player) {
  console.log(player);
  db.run("UPDATE players SET score = ?, delay = ?, ranking = ?, alive = ? " +
          "WHERE id = ?",
    [player.id
      , player.score
      , player.delay
      , player.ranking
      , player.alive
    ]
  );
}

function getCircles(callback) {
  db.all("SELECT circles.* FROM circles " +
           "LEFT JOIN players ON circles.id = players.id_circle " +
          "WHERE players.alive = 1 OR circles.type = 'FOOD'"
          , function(err, circle) {
    if (err) {
      console.log("getCircles error: " + err);
      return;
    }
    callback(circle);
  });
}

function newPlayer(name, callback){

  var newCircle = {};
  var newPlayer = {};

  setCircle(function(circle){
    insertCircle(circle);
    newCircle = circle;
    setPlayer(newCircle, name, function(player){
      insertPlayer(player);
      newPlayer = player;
      callback(newPlayer, newCircle);
    });
  });
}

function setCircle(callback){
  db.all("SELECT (MAX(circles.id) + 1) id FROM circles ", function(err, next) {
    if (err) {
      console.log("getNextIdCircle error: " + err);
      return;
    }
    if (next[0].id === null){
      next[0].id = 1;
    }
    var circle = {id: next[0].id, r: 20, cx: 500, cy: 300, fill: "#ff0000", type: "PLAYER" };
    console.log("setCircle: ", circle);
    callback(circle);
  });
}

function setPlayer(circle, name, callback){
  db.all("SELECT (MAX(players.id) + 1) id FROM players ", function(err, next) {
    if (err) {
      console.log("getNextIdPlayers error: " + err);
      return;
    }
    if (next[0].id === null){
      next[0].id = 1;
    }
    var player = {id: next[0].id, id_circle: circle.id, name: name, score: 0, delay: 0, ranking: 0, alive: 1 };
    console.log("setPlayer: ", player);
    callback(player);
  });
}

function createAllFood(){
  for (var i = 1; i <= 100; i++){
    newFood(i, randomColors());
  }
}

function newFood(i, color){
  var x = Math.floor(Math.random() * 990);
  var y = Math.floor(Math.random() * 640);
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

http.listen(3000, function() {
  console.log('Server listening on port 3000...');
});

io.on('connection', function(socket) {
  console.log('connected');

  getCircles(function(circles) {
    if (!circles) circles = [];
    socket.emit('start-circles', circles);
  });

  socket.on('newPlayer', function (name) {
    newPlayer(name, function(player, circle){
      socket.emit('player-circle', player, circle);
    });
  });

  socket.on('updateCircle', function (circle) {
    updateCircle(circle);
    getCircles(function(circles) {
      if (!circles) circles = [];
      socket.emit('circles', circles);
    });
  });
});

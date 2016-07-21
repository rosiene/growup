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
          "alive INT)");
}

function insertCircle(circle) {
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
  db.run("INSERT INTO players VALUES (?, ?, ?, ?, ?, ?)",
    [player.id
      , player.id_circle
      , player.name
      , player.score
      , player.delay
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
  db.run("UPDATE players SET score = ?, delay = ?, alive = ? " +
          "WHERE id = ?",
      [player.score
      , player.delay
      , player.alive
      , player.id
    ]
  );
}

function getCircles(callback) {
  db.all("SELECT circles.* FROM circles " +
           "LEFT JOIN players ON circles.id = players.id_circle " +
          "WHERE players.alive = 1 OR circles.type = 'FOOD'"
          , function(err, circles) {
    if (err) {
      console.log("getCircles error: " + err);
      return;
    }
    callback(circles);
  });
}

function load(){
  getCircles(function(circles) {
    if (!circles) circles = [];
    io.emit('circles', circles);
  });

  getPlayers(function(players) {
    if (!players) players = [];
    io.emit('players', players);
  });
}

function getPlayer(player, callback) {
  console.log(player)
  db.all("SELECT * FROM players " +
          "WHERE id = ? ", [player.id]
          , function(err, players) {
    if (err) {
      console.log("getPlayers error: " + err);
      return;
    }
    callback(players[0]);
  });
}

function getPlayers(callback) {
  db.all("SELECT * FROM players"
          , function(err, players) {
    if (err) {
      console.log("getPlayers error: " + err);
      return;
    }
    callback(players);
  });
}

function newPlayerAndCircle(name, callback){

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
    var circle = {id: next[0].id, r: 20, cx: 500, cy: 300, fill: randomColors(), type: "PLAYER" };
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
    var player = {id: next[0].id, id_circle: circle.id, name: name, score: 0, delay: 1, alive: 1 };
    callback(player);
  });
}

function createAllFood(){
  for (var i = 1; i <= 500; i++){
    newFood(i, randomColors());
  }
}

function newFood(i, color){
  var x = Math.floor(Math.random() * 3000);
  var y = Math.floor(Math.random() * 2000);
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

  socket.on('newPlayerAndCircle', function (name, circles) {
    newPlayerAndCircle(name, function(player, circle){
      socket.emit('player-circle', player, circle);
    });
  });

  socket.on('updateCircle', function (circle) {
    updateCircle(circle);
  });

  socket.on('updatePlayer', function (player) {
    updatePlayer(player);
  });

  socket.on('load', function () {
    load();
  });

});

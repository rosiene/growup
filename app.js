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
    createCircleOnDatabase();
    createPlayerOnDatabase();
}

createAllFood();

function createCircleOnDatabase(){
  db.run("CREATE TABLE circles (" +
          "id INT PRIMARY KEY, " +
          "r INT, " +
          "cx INT, " +
          "cy INT, " +
          "nx INT, " +
          "ny INT, " +
          "fill TEXT, " +
          "stroke TEXT, " +
          "stroke_width INT)");
}

function createPlayerOnDatabase(){
  db.run("CREATE TABLE players (" +
          "id INT PRIMARY KEY, " +
          "id_circle INT REFERENCES circles(id), " +
          "name TEXT, " +
          "time_alive TEXT, " +
          "food_eaten INT, " +
          "delay INT, " +
          "ranking INT, " +
          "alive INT)");
}

function insertCircleOnDatabase(circle) {
  console.log(circle);
  db.run("INSERT INTO circles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [circle.id
      , circle.r
      , circle.cx
      , circle.cy
      , circle.nx
      , circle.ny
      , circle.fill
      , circle.stroke
      , circle.stroke_width
    ]
  );
}

function getFoodsFromDatabase(callback) {
  db.all("SELECT * FROM circles"
          , function(err, foods) {
    if (err) {
      console.log("error: " + err);
      return;
    }
    callback(foods);
  });
}

function createAllFood(){
  for (var i = 1; i <= 100; i++){
    newFood(i, randomColors());
  }
}

function newFood(i, color){
  console.log(color);
  var x = Math.floor(Math.random() * 990);
  var y = Math.floor(Math.random() * 640);
  var food = { id: i, r: 6, cx: x, cy: y, nx: x, ny: y, fill: color, stroke: color, stroke_width: 1 };
  insertCircleOnDatabase(food);
}

function randomColors(){
   var colors = ["#ff1a1a", "#3366ff", "#33cc33", "#ffff00", "#ff0066", "#ff471a", "#cc0099"];
   return colors[Math.floor(Math.random() * colors.length)];;
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

  getFoodsFromDatabase(function(foods) {
    if (!foods) foods = [];
    socket.emit('foods', foods);
  });

});

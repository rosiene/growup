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


function createCircleOnDatabase(){
  db.run("CREATE TABLE circle (" +
          "id INT PRIMARY KEY, " +
          "r INT, " +
          "cx INT, " +
          "cy INT, " +
          "nx INT, " +
          "ny INT, " +
          "fill TEXT, " +
          "stroke TEXT, " +
          "stroke_width INT);");
}

function createPlayerOnDatabase(){
  db.run("CREATE TABLE player (" +
         "id INT PRIMARY KEY, " +
         "id_circle INT REFERENCES circle(id), " +
         "food_eaten INT, " +
         "time_alive TEXT, " +
         "delay FLOAT, " +
         "status TEXT, " +
         "ranking INT);");
}

function insertCircleOnDatabase(circle) {
  db.run("INSERT INTO circle VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
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

function insertPlayerOnDatabase(player) {
  db.run("INSERT INTO circle VALUES (?, ?, ?, ?, ?, ?, ?)",
    [player.id
      , player.id_circle
      , player.food_eaten
      , player.time_alive
      , player.delay
      , player.status
      , player.ranking
    ]
  );
}


app.use("/public", express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

http.listen(3000, function() {
  console.log('Server listening on port 3000...');
});

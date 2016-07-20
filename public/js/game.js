var socket = io();
var currentCircle = {};
var currentPlayer = {};

runGame();

function runGame(){
  setTimeout(function(){
    socket.emit('updateCircle', currentCircle);
    socket.on('circles', function(circles) {
      updateGame(circles);
    });
    runGame();
  }, 100);
}

function updateGame(circles){
  circles.forEach(function(circle) {
    var circleElement = document.getElementById(circle.id);
    if(circleElement == null){
      newElement(circle)
    }else{
      updateElement(circle);
    }
  });
}

function newElement(circle){
  var svg = document.getElementById("board");
  var circleElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circleElement.setAttribute("id", circle.id);
  circleElement.setAttribute("r", circle.r);
  circleElement.setAttribute("cx", circle.cx);
  circleElement.setAttribute("cy", circle.cy);
  circleElement.setAttribute("fill", circle.fill);
  svg.appendChild(circleElement);
}

function updateElement(circle){
  var circleElement = document.getElementById(circle.id);
  circleElement.setAttribute("r", circle.r);
  circleElement.setAttribute("cx", circle.cx);
  circleElement.setAttribute("cy", circle.cy);
  circleElement.setAttribute("fill", circle.fill);
}

function setPlayer(event){
  event.preventDefault();
  var name = event.target[0].value;
  $('.form').css("display", "none");
  socket.emit('newPlayer', name);
  socket.on('player-circle', function(player, circle){
    currentPlayer = player;
    currentCircle = circle;
  });
  window.addEventListener('mousemove', function(event){
    newPosition(event.clientX, event.clientY)
  });
}

function newPosition(x, y){
  currentCircle.cx = x;
  currentCircle.cy = y;
}

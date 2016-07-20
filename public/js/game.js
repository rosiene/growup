
var currentCircles = [];
var currentPlayer = {};
var currentCircle = {};
var socket = io();

socket.on('circles', function(circles){
  currentCircles = circles;
  updateGame(circles);
});

function setPlayer(event){
  event.preventDefault();
  var name = event.target[0].value;
  $('.form').css("display", "none");
  socket.emit('newPlayerAndCircle', name);
  socket.on('player-circle', function(player, circle){
    currentPlayer = player;
    currentCircle = circle;
  });
  window.addEventListener('mousemove', function(event){
    newPosition(event.clientX, event.clientY)
  });
  runGame();
}

function runGame(){
  setTimeout(function () {
    socket.emit('updateCircle', currentCircle);
    currentCircles.forEach(function(circle){
      if(circle.id != currentCircle.id){
        currentEat(circle);
      }
    });
    socket.emit('loadCircles', currentCircles);
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
  console.log("new");
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

function deleteElement(circle){
  console.log("delete");
  var svg = document.getElementById("board");
  var circleElement = document.getElementById(circle.id);
  svg.removeChild(circleElement);
}

function newPosition(x, y){
  currentCircle.cx = x;
  currentCircle.cy = y;
}

function currentEat(circle){
  var startX = parseInt(currentCircle.cx) - parseInt(currentCircle.r);
  var startY = parseInt(currentCircle.cy) - parseInt(currentCircle.r);
  var endX = parseInt(currentCircle.cx) + parseInt(currentCircle.r);
  var endY = parseInt(currentCircle.cy) + parseInt(currentCircle.r);

  if (startX < parseInt(circle.cx) &&
       startY < parseInt(circle.cy) &&
      endX > parseInt(circle.cx) &&
      endY > parseInt(circle.cy)){
    if(circle.type == "FOOD"){
      circle.cx = Math.floor(Math.random() * 990);
      circle.cy = Math.floor(Math.random() * 640);
      circle.fill = randomColors();
      socket.emit('updateCircle', circle);
      //currentPlayer.score = 1 + parseInt(currentPlayer.score);
      //socket.emit('updatePlayer', currentPlayer);
      currentGrow(circle);
    }else{
      deleteElement(circle);
      socket.emit('killPlayer', circle);
    }
  }
}

function randomColors(){
  var colors = ["#ff1a1a", "#3366ff", "#33cc33", "#ffff00", "#ff0066", "#ff471a", "#cc0099"];
  return colors[Math.floor(Math.random() * colors.length)];
}


function currentGrow(circle){
  newSize = parseFloat(currentCircle.r) + parseFloat(circle.r)/30;
  currentCircle.r = newSize.toFixed(1);
  socket.emit('updateCircle', currentCircle);
}

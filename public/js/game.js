
var socket = io();
var circles = [];
var circlePlayer = {};
var player = {};

$('.form').css("display", "none");

var startGame = function(circles) {
  var svg = document.getElementById("board");

  circles.forEach(function(circle) {
    var circleElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circleElement.setAttribute("id", circle.id);
    circleElement.setAttribute("r", circle.r);
    circleElement.setAttribute("cx", circle.cx);
    circleElement.setAttribute("cy", circle.cy);
    circleElement.setAttribute("fill", circle.fill);
    svg.appendChild(circleElement);
  });
};

socket.on('circles', function(circles) {
  startGame(circles);
});


socket.on('circleByPlayer', function(circle) {
  circlePlayer = circle;
});

function setPlayer(event){
  event.preventDefault();
  var nome = event.target[0].value;
  $('.form').css("display", "none");
  socket.emit('newPlayer', name);
}

function newPosition(x, y){
  circlePlayer.cx = x;
  circlePlayer.cy = y;
  console.log(circlePlayer);
}

function updateElement(circle){
  var circleElement = $('#'+circle.id);
  circleElement.attr("r", circle.r);
  circleElement.attr("cx", circle.cx);
  circleElement.attr("cy", circle.cy);
  circleElement.attr("fill", circle.fill);
  circleElement.attr("stroke", circle.stroke);
  circleElement.attr("stroke_width", circle.stroke_width);
}

window.addEventListener('mousemove', function(event){
  newPosition(event.clientX, event.clientY)
});

socket.on('circle', function(circle) {
  console.log(circle);
  updateElement(circle);
});

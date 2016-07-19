$(function() {
  var socket = io();
  console.log("function");

  var showFoods = function(foods) {
    var svg = document.getElementById("board");

    foods.forEach(function(food) {
      var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", food.r);
      circle.setAttribute("cx", food.cx);
      circle.setAttribute("cy", food.cy);
      circle.setAttribute("fill", food.fill);
      svg.appendChild(circle);
    });
  };

  socket.on('foods', function(foods) {
    showFoods(foods);
  });

});

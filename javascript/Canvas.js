function draw(){
  var canvas = document.getElementById('canvas');

  if (canvas.getContext) {
    var context = canvas.getContext('2d');

    var X = 0;
    var Y = 0;

    var R = 75;
    context.beginPath();
    context.arc(X,Y,R,0,2*Math.PI, false);
    context.lineWidth = 3;
    context.strokeStyle = '#FF0000';
    context.stroke();
  }

}

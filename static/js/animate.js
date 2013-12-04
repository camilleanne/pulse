// ** USER INTERFACE **
// jQuery provides functionality for animation 
// and basic UI
var delay = 1000;

function minimizeVideo(){
  var delay = 1000;
  $( ".video" ).animate({
    width: 240,
    height: 180,
    // width: 120,
    // height: 90,
    left: "-5px",
    position: "absolute",
    margin: "10px"
  }, delay );
  $( "#border" ).animate({
    width: 225,
    height: 170,
    // width: 113,
    // height: 85,
    left: "-25px",
    top: "-25px",
    border: "22px solid #E1F1F1"
  }, delay );
  $("#buttonBar").animate({
    left: "20px",
    width: 160,
    height: 220,
    margin: "20px 0 0 10px"
  }, delay, function(){
  });
  $("button").animate({
    margin: 2,
  }, delay);
  $("#heartbeat").animate({
    width: 600,
    height: 600,
    top: "-500px",
    left: "30%"
  }, delay);
  $("#graphs").animate({
    top: "-500px"
  }, delay);
  $("#minToggle").html("Maximize Video");

}

function maximizeVideo(){
  var center = ($(window).width()/2) -  (480/2);
  $( ".video" ).animate({
    // width: 480,
    // height: 360,
    width: 380,
    height: 285,
    margin: "0 0 0 " + center + "px",
  }, delay, function(){
    $("#vid").css("position", "relative");
    $("#canvas").css("position", "relative");
    $(".video").css("margin", "0");
    $(".video").css("left", "0");
    $("#vid").css("margin", "auto");
  });
  $( "#border" ).animate({
    // width: 460,
    // height: 340,
    width: 360,
    height: 270,
    left: "-30px",
    top: "-30px",
  }, delay );
  $("#buttonBar").animate({
    left: "20px",
    width: 385,
    height: 60,
    margin: "0 0 0 " + center + "px",
  }, delay, function(){
    $("#buttonBar").css("margin", "auto");
  });
  $("button").animate({
    margin: "3.5px",
  }, delay);
  $("#heartbeat").animate({
    width: 400,
    height: 400,
    top: "-400px",
    left: "0%"
  }, delay);
  $("#graphs").animate({
    top: "-200px"
  }, delay);
  $("#minToggle").html("Minimize Video");

}
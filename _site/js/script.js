(function() {
  $(function() {
    var width;
    width = $("body").css("width").split("px")[0];
    $("#main").css("width", 1 * width * 0.618);
    return $("body").css("visibility", "visible");
  });
}).call(this);

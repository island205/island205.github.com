(function() {

  $(function() {
    var width;
    width = $("body").css("width").split("px")[0];
    return $("#main").css("width", 1 * width * 0.618);
  });

}).call(this);

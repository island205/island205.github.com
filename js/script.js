(function() {

  $(function() {
    var width;
    width = $("body").css("witdh").split("px")[0];
    return $("#main").css("wdith", 1 * width * 0.618);
  });

}).call(this);

(function() {
  $(function() {
    var body, main, mainSize;
    body = $("body");
    main = $("#main");
    mainSize = function() {
      var width;
      width = body.css("width").split("px")[0];
      if (width < 618) {
        width = 618;
      }
      main.css("width", 1 * width * 0.618);
    };
    mainSize();
    $("body").css("visibility", "visible");
    $(window).resize(mainSize);
  });
}).call(this);

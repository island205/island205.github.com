$ ->
	body=$ "body"
	main=$ "#main"
	mainSize=->
		width=body.css("width").split("px")[0]
		width=618 if width<618
		main.css "width",1*width*0.618
		return
	
	mainSize()
	$("body").css("visibility","visible")
	$(window).resize mainSize
	return

(function (lib, img, cjs) {

var p; // shortcut to reference prototypes

// library properties:
lib.properties = {
	width: 640,
	height: 836,
	fps: 24,
	color: "#FFFFFF",
	manifest: [
		{src:"images/bitmap_1.png", id:"bitmap_1"}
	]
};

// stage content:
(lib.test = function(mode,startPosition,loop) {
	this.initialize(mode,startPosition,loop,{});

	// timeline functions:
	this.frame_0 = function() {
		this.stop();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// samples
	this.instance = new lib.bitmap_1();
	this.instance.setTransform(220,710);

	this.instance_1 = new lib.graphic_1("synched",0);
	this.instance_1.setTransform(310,553);

	this.instance_2 = new lib.button_1();
	this.instance_2.setTransform(310,350);
	new cjs.ButtonHelper(this.instance_2, 0, 1, 1);

	this.instance_3 = new lib.movieclip_1();
	this.instance_3.setTransform(310,148);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.instance_3},{t:this.instance_2},{t:this.instance_1},{t:this.instance}]}).wait(1));

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(340.1,441,414.1,767);


// symbols:
(lib.bitmap_1 = function() {
	this.initialize(img.bitmap_1);
}).prototype = p = new cjs.Bitmap();
p.nominalBounds = new cjs.Rectangle(0,0,180,80);


(lib.movieclip_1 = function(mode,startPosition,loop) {
	this.initialize(mode,startPosition,loop,{});

	// レイヤー 1
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#33CC00").s().p("AuDGPIAAsdIcHAAIAAMdg");
	this.shape._off = true;

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1).to({_off:false},0).wait(1));

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = null;


(lib.graphic_1 = function() {
	this.initialize();

	// レイヤー 1
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFCC66").s().p("AuDGPIAAsdIcHAAIAAMdg");

	this.addChild(this.shape);
}).prototype = p = new cjs.Container();
p.nominalBounds = new cjs.Rectangle(-90,-40,180,80);


(lib.button_1 = function() {
	this.initialize();

	// レイヤー 1
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#33CCFF").s().p("AuDGPIAAsdIcHAAIAAMdg");

	this.addChild(this.shape);
}).prototype = p = new cjs.Container();
p.nominalBounds = new cjs.Rectangle(-90,-40,180,80);

})(lib = lib||{}, images = images||{}, createjs = createjs||{});
var lib, images, createjs;

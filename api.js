function APIs(context) {
    this.context = context;
}

APIs.prototype = {
 someAPI: function() {
    this.context.instance_1.gotoAndPlay(1);
 }
};


## FlashCC for Canvasによるflaファイルの書き出し(基本編)

サンプルとして、test.fla というファイルを作り、とりあえず4つの各種インスタンス(ムービークリップ、ボタン、グラフィック、ビットマップ)を配置する。(今回は描画部分のみにフォーカスするのでサウンドについては省略)

また、合わせて[CreateJSの公式ドキュメント](http://www.createjs.com/Docs/)にも一通り目を通す、もしくは逐一検索していくことを強く奨める。

### パブリッシュ設定

<dl>
	<dt>タイムラインをループ</dt>
	<dd>ステージのタイムラインをループさせるかどうか。デフォルトはループ。 </dd>
	<dt>HTMLをパブリッシュ</dt>
	<dd>fla の単体再生が可能な html ファイルをパブリッシュするかどうか。</dd>
	<dt>アセット書き出しオプション</dt>
	<dd>画像、サウンド、CreateJSの各アセットの書き出しパスを指定できる。
	libsは下記のホストのライブラリにチェックを入れている場合は書き出されない。</dd>
	<dt>JavaScript 名前空間</dt>
	<dd>シンボル、画像、CreateJSの各オブジェクトの名前空間をそれぞれ設定できる。
	シンボル: Flash で作成した各シンボルのオブジェクト
	イメージ: ID (ファイル名 or リンケージ) をキーにした image のインスタンス
	CreateJS: CreateJSの各クラスオブジェクト
	が入ると思っていればよい。</dd>
	<dt>(詳細)ホストのライブラリ</dt>
	<dd>チェックを入れることでCreateJSライブラリのJSファイルを http://code.createjs.com から呼ぶように
	htmlが変更される。
	ちなみにどちらにせよ最新版ではないものが読まれるので注意</dd>
	<dt>(詳細)非表示レイヤーを含める</dt>
	<dd>その名の通り。デフォルトはチェック。
	チェックを外すと、非表示にしているレイヤーの内容物は、配置されなくなる。
	しかし、前述の通り「その非表示レイヤーでしか使っていない画像も、ファイルは書き出される」ので注意。
	非表示レイヤーのJavaScriptコードは、チェックが外れていれば書き出されない。
	ちなみに、ガイドレイヤーに書いたJavaScriptも書き出されない。</dd>
	<dt>(詳細)シェイプをコンパクト化</dt>
	<dd>デフォルトはチェック。
	シェイプの描画命令を圧縮コードにするか展開するかの選択。特別な理由がない限りそのままでいいと思います。</dd>
	<dt>(詳細)各フレームでの境界を取得</dt>
	<dd>複数のフレームを持つムービークリップの1フレーム毎の描画範囲を書き出すかどうか。
	トゥイーンや描画物の変化が起こった場合は、1フレーム毎に描画範囲は変わるため、
	あらかじめそれをFlashCC側で各フレーム毎全て取得しておくことができる。
	通常は使用しないと思うが、CreateJSの機能"SpriteSheetBuilder"(動的にスプライトシートを
	生成してキャッシュする機能)を使うときに取れると便利。</dd>
	</pre></dd>
</dl>


### 出力されるもの

fla を標準設定のままパブリッシュすると、以下のようなファイルが出力される。

```
$ tree
./
├── images	   <----- fla内で使用しているビットマップ画像全て
│   └── bitmap_1.png
├── test.fla
├── test.html	<----- flaを単体再生するためのhtml
└── test.js	  <----- 1つのステージ(fla ファイル)で、1つの JavaScript が生成される。いわゆるswfファイルのようなもの
```


#### JavaScript

実際に出力される JavaScript を部分部分取り出しながら、解説していく。


##### 生成されるネームスペースと無名関数でのカプセル化

出力された JS ファイルは下記のような無名関数によってカプセル化される。

```javascript
(function (lib, img, cjs) {
	// この中では、 img.hogehoge のように外の namespace を意識せずにアクセスできる
})(lib = lib||{}, images = images||{}, createjs = createjs||{});
// パブリッシュ設定の通りに、変数が宣言される
var lib, images, createjs;
```

###### 注意

**パブリッシュ設定でネームスペースに指定できるのは変数名のみとなり、オブジェクトのプロパティは設定できない**

```javascript
// # OK
// ネームスペース設定 lib_namespace 
(function (lib, img, cjs) {
})(lib_namespace = lib_namespace||{}, images = images||{}, createjs = createjs||{});
var lib_namespace, images, createjs; 

// # NG
// ネームスペース設定 lib.namespace 
(function (lib, img, cjs) {
})(lib.namespace = lib.namespace||{}, images = images||{}, createjs = createjs||{});
// var lib.namespace という宣言になってしまうので syntax error となる
// この行を削って、あらかじめ自分で宣言しておけば動くが…
var lib.namespace, images, createjs; 
```

**複数の flash ファイルで namespace が被っている場合、その複数の flash ファイル内で使用しているシンボルや画像の名前がぶつかって、あとから読み込んだ方に上書きされてしまう**

複数ファイルを持つ場合は、createjs 以外の namespace はそれぞれの flash で分けておいた方が安全。

もしくは、プロジェクト側で統一できるようにルールを決めること。



##### プロパティ

flash ファイルの設定情報やアセットの情報は lib.properties という変数に格納される。

上にも記載したが、シンボルの namespace が被っていると properties の情報も上書きされるので注意すること。

```javascript
lib.properties = {
	width: 640,
	height: 836,
	fps: 24,
	color: "#FFFFFF",
	// manifest という配列に、flaファイル内で使用しているアセットの src と ID(画像名 or リンケージ名) が全て入る。
	// パスなどはパブリッシュ設定に準ずる
	manifest: [
		{src:"images/bitmap_1.png", id:"bitmap_1"}
	]
};
```

##### シンボル

flash 内で使用しているシンボルは全てシンボル名 or リンケージ名で lib.{シンボル名} というようにオブジェクトとして登録される。

ルートのシンボルも1つのシンボルとして登録され、flash ファイル名がシンボル名として使用される。

各種類のシンボルは、以下のように CreateJS のクラスからインスタンス化される

- createjs.MovieClip
> ビットマップシンボル以外の、タイムラインが複数存在するシンボル

- createjs.Container
> ビットマップシンボル以外の、タイムラインが1フレームだけ存在するシンボル

- createjs.Bitmap
> ビットマップシンボル

各クラスの詳細は公式が一番詳しいので合わせて確認すること。



###### ルートシンボル

```javascript
// test.fla というファイルなので lib.test がシンボル名になる
(lib.test = function(mode,startPosition,loop) {
	this.initialize(mode,startPosition,loop,{});

	// フレーム内の JavaScript は frame_{FRAME_NUM} というメンバ変数に格納される
	this.frame_0 = function() {
		this.stop();
	}

	// メンバ変数に登録されたフレーム内 JavaScript は、createjs.Tween で tween オブジェクト化され
	// その MC のタイムラインに addTween すると登録されてフレーム毎に呼ばれるようになる
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// インスタンス名を設定しないシンボルは this.instance, this.instance_1 のように後ろの数字がインクリメントされてメンバ変数になる
	// インスタンス名を設定した場合は、 this.{インスタンス名} という感じでメンバ変数になる
	// ビットマップシンボルのインスタンスを生成
	this.instance = new lib.bitmap_1();
	// 初期の配置位置を設定。他のインスタンスと x 座標の位置がずれているが
	// これはビットマップシンボルの座標基準が右上になっているため（他のシンボルは中央）
	this.instance.setTransform(220,710);

	// グラフィックシンボルのインスタンスを生成
	// グラフィックシンボルに対しては、"synched",0 の引数は固定
	// この指定があると、呼び出し側と子がタイムラインを同期するようになる
	this.instance_1 = new lib.graphic_1("synched",0);
	// 初期の配置位置を設定
	this.instance_1.setTransform(310,553);

	// ボタンシンボルのインスタンスを生成
	this.instance_2 = new lib.button_1();
	// 初期の配置位置を設定
	this.instance_2.setTransform(310,350);
	// CreateJSのButtonHelperという機能で、SWFのボタンっぽく動くようにタイムラインやイベントをよしなにしてくれる
	new cjs.ButtonHelper(this.instance_2, 0, 1, 1);

	// ムービークリップシンボルのインスタンスを生成
	this.instance_3 = new lib.movieclip_1();
	// 初期の配置位置を設定
	this.instance_3.setTransform(310,148);

	// addTween して、1フレーム目から表示されるようにインスタンスたちを登録する
	// 一見何の変哲もないが、state: [] と渡してる配列の先頭から重ね順が後ろになる
	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.instance_3},{t:this.instance_2},{t:this.instance_1},{t:this.instance}]}).wait(1));

}).prototype = p = new cjs.MovieClip();
// nominalbounds は、そのシンボルの初期の表示上の基準座標と大きさが設定される。どこかのフレームで座標や大きさが変化してもこの値は変わらない。
// ルートシンボルだけ、x, y の設定がよく分からないことになってるので調査中
p.nominalBounds = new cjs.Rectangle(340.1,441,414.1,767);
```

###### その他シンボル

```javascript
// ビットマップのオブジェクト
(lib.bitmap_1 = function() {
	// 画像の実体は、manifest に登録された id で img というネームスペースに登録しているので (HTML の方に書いてある)
	// ここでは img.bitmap_1 として画像のデータを呼んでいる
	this.initialize(img.bitmap_1);
}).prototype = p = new cjs.Bitmap();
p.nominalBounds = new cjs.Rectangle(0,0,180,80);


// ムービークリップシンボルのオブジェクト
(lib.movieclip_1 = function() {
	this.initialize();

	// 表示するシェイプを登録している
	this.shape = new cjs.Shape();
	// シェイプを定義している。p() のメソッドに食わせている圧縮文字はパスやオブジェクトを描画するためのもの
	this.shape.graphics.f("#33CC00").s().p("AuDGPIAAsdIcHAAIAAMdg");

	// このMCはタイムラインを持たないので、単純に addChild される
	// MCを持っているシンボルは、上のルートシンボルのように addTween で配置される
	this.addChild(this.shape);
}).prototype = p = new cjs.Container();
// 基準点が中心なので、-([width|height] / 2) した点を基準座標としている
p.nominalBounds = new cjs.Rectangle(-90,-40,180,80);


// グラフィックシンボルのオブジェクト
(lib.graphic_1 = function() {
	this.initialize();

	// ムービークリップの方と一緒
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFCC66").s().p("AuDGPIAAsdIcHAAIAAMdg");

	this.addChild(this.shape);
}).prototype = p = new cjs.Container();
p.nominalBounds = new cjs.Rectangle(-90,-40,180,80);


// ボタンシンボルのオブジェクト
(lib.button_1 = function() {
	this.initialize();

	// ムービークリップの方と一緒
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#33CCFF").s().p("AuDGPIAAsdIcHAAIAAMdg");

	this.addChild(this.shape);
}).prototype = p = new cjs.Container();
p.nominalBounds = new cjs.Rectangle(-90,-40,180,80);

})(lib = lib||{}, images = images||{}, createjs = createjs||{});
var lib, images, createjs;
```


###### その他諸々

- パブリッシュ時にもワーニングが出るが、CreateJS ではフレームが0からスタートすることに注意する。
- 例えば、5フレーム目から表示されるシンボルも初期化は最初に行われる。「重いシンボルだけど、5フレーム目からだから関係ないか」などと思ってるとめっちゃ初期化走って死ぬので注意。
- nonimalBoundsに設定される基準位置と大きさは、ガイドと非表示レイヤーに入っているものも含まれる。特にガイドはサイズを気にしなかったりする場合があるので注意。(パブリッシュ設定で非表示レイヤーはパブリッシュしなければ大きさに含まれません)



#### html

制作した Flash を単体再生するための html

これだけだと CSS もなにも効いていないので Flash でアプリケーション全部を作っているようなことがなければ実質使うことはないと思われる


```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>test</title>

<!-- CreateJS のコードが読み込まれる。パブリッシュ設定次第では、CreateJS の JavaScript もローカルに出力されるが、どのみちバージョンが古い -->
<!-- 地獄編で説明するが、CreateJS には読み込み順が存在するので注意すること -->
<script src="http://code.createjs.com/easeljs-0.7.0.min.js"></script>
<script src="http://code.createjs.com/tweenjs-0.5.0.min.js"></script>
<script src="http://code.createjs.com/movieclip-0.7.0.min.js"></script>
<script src="http://code.createjs.com/preloadjs-0.4.0.min.js"></script>
<!-- ここで test.js が読み込まれるので、var lib, images, createjs; のようにグローバルへ変数が宣言されていることになる -->
<script src="test.js"></script>

<script>
// この時点で泣きそうになるがまぁ察してほしい
var canvas, stage, exportRoot;

function init() {
	canvas = document.getElementById("canvas");
	// images という変数は test.js 下部で宣言されており、オブジェクトが入っているはずだが一応宣言しているのだと思われる
	images = images||{};

	// LoadQueue(PreloadJS)をインスタンス化
	var loader = new createjs.LoadQueue(false);
	// loader に各イベントを設定
	loader.addEventListener("fileload", handleFileLoad);
	loader.addEventListener("complete", handleComplete);
	// manifest を丸ごと渡すと全て読み込んでくれる
	loader.loadManifest(lib.properties.manifest);
}

function handleFileLoad(evt) {
	// ファイルが1つ読み込まれるたびに呼ばれる
	// images の変数に、manifest に書いてあった id をキーにして、HTMLImageElement の DOM インスタンスが設定される
	if (evt.item.type == "image") { images[evt.item.id] = evt.result; }
}

function handleComplete() {
	// lib.test (ルートシンボル) を初期化する
	exportRoot = new lib.test();

	// ステージを初期化して、配置
	stage = new createjs.Stage(canvas);
	stage.addChild(exportRoot);

	// ステージを手で1度アップデートしてるが意図が不明？
	// この時点で Canvas に最初の描画がされる
	stage.update();
	// mouseover, mouseout のイベントが、描画しているシンボルに適用されるようになる
	stage.enableMouseOver();

	// Ticker に FPS を設定して、tick イベントに stage 自身を登録することで、stage.update が設定した fps で呼ばれるようになる
	createjs.Ticker.setFPS(lib.properties.fps);
	createjs.Ticker.addEventListener("tick", stage);
}
</script>
</head>

<body onload="init();" style="background-color:#D4D4D4">
	<!-- 描画される canvas 。この HTML だけでは retina 対応はできない -->
	<canvas id="canvas" width="640" height="836" style="background-color:#FFFFFF"></canvas>
</body>
</html>
```



## FlashCC for Canvasによるflaファイルの書き出し(地獄編)

### 闇

- addEventListenerで、cross-originな画像にhittestすると落ちるの -> hitAreaを必ず付けようの巻 -> iOS7 on iPhone4では動かない -> 死 (iPhone4 + iOS7.0.xでhitArea(getObjectsUnderPoint)が死亡している)
- retina対応とかで、canvasにzoomをかけるとhittestの座標がずれる。回避するにはステージにscaleを設定する
- ガイド内で使ってる画像も書き出されるし、シンボルも定義される
- 中身のサイズが変わるMC、もしくは1フレーム目に何もないMCだとnonimalBounds(初期の基準位置と大きさ)上は範囲が設定されてないことになるので、大きさがなくcache領域が設定できないので死亡
- 何か CreateJS のファイルたちって読み込み順があるので minify するときも気を遣わないと死亡する。

### ノウハウ

- hitAreaにタッチさせたい範囲で設定したdisplayObjectを設定する。あと必ず表示オプションで表示をOFFに




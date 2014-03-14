
## 1ヶ月くらいCreateJSと戦ったメモ


- addEventListenerで、cross-originな画像にhittestすると落ちるのでhitAreaを必ず付けようの巻
- zoomをかけるとhittestの座標がずれる。scaleならおけ。
- オリジンの違う画像をhitareaにするとcross-originエラー出る
- hitAreaにdisplayObject食わせる。あと表示はOFFに
- ガイド画像書き出されてMCはできてるけど使ってない -> ダウト
- 中身のサイズが変わるMC、もしくは1フレーム目に何もないMCだとガイド画像を消すとキャッシュ領域がなくcache領域が取れないので死亡
- iPhone4 + iOS7.0.xでhitArea(getObjectsUnderPoint)が死亡



# FlashCC for canvas と1ヶ月くらい戯れたメモ





## FlashCC for canvasによるflaファイルの書き出し(基本編)

サンプルとして、test.flaというファイルを作り、とりあえず4つの各種インスタンス(ムービークリップ、ボタン、グラフィック、ビットマップ)を配置してみました。(今回は描画部分のみにフォーカスするのでサウンドについては省略します)

これを元に解説していきます。

また、合わせて[CreateJSの公式ドキュメント](http://www.createjs.com/Docs/)にも一通り目を通す、もしくは逐一検索していくことをおすすめします。

### パブリッシュ設定

<dl>
    <dt>タイムラインをループ</dt>
    <dd><pre>ステージのタイムラインをループさせるかどうか。デフォルトはループ。 </pre></dd>
    <dt>HTMLをパブリッシュ</dt>
    <dd><pre>flaの単体再生が可能なhtmlファイルをパブリッシュするかどうか。</pre></dd>
    <dt>アセット書き出しオプション</dt>
    <dd><pre>画像、サウンド、CreateJSの各アセットの書き出しパスを指定できる。
libsは下記のホストのライブラリにチェックを入れている場合は書き出されない。</pre></dd>
    <dt>JavaScript 名前空間</dt>
    <dd><pre>シンボル、画像、CreateJSの各オブジェクトの名前空間をそれぞれ設定できる。
シンボル: MC
イメージ: 画像のデータ
CreateJS: CreateJSの各クラス
が入ると思っていればよい。</pre></dd>
    <dt>(詳細)ホストのライブラリ</dt>
    <dd><pre>チェックを入れることでCreateJSライブラリのJSファイルを http://code.createjs.com から呼ぶように
htmlが変更される。</pre></dd>
    <dt>(詳細)非表示レイヤーを含める</dt>
    <dd><pre>その名の通り。デフォルトはチェック。
チェックを外すと、非表示にしているレイヤーの内容物は、配置されなくなる。
しかし、前述の通り「その非表示レイヤーでしか使っていない画像も、ファイルは書き出される」ので注意。
非表示レイヤーのJavaScriptコードは、チェックが外れていれば書き出されない。
ちなみに、ガイドレイヤーに書いたJavaScriptも書き出されない。</pre></dd>
    <dt>(詳細)シェイプをコンパクト化</dt>
    <dd><pre>デフォルトはチェック。
シェイプの描画命令を圧縮コードにするか展開するかの選択。特別な理由がない限りそのままでいいと思います。</pre></dd>
    <dt>(詳細)各フレームでの境界を取得</dt>
    <dd><pre>複数のフレームを持つムービークリップの1フレーム毎の描画範囲を書き出すかどうか。
トゥイーンや描画物の変化が起こった場合は、1フレーム毎に描画範囲は変わるため、
あらかじめそれをFlashCC側で各フレーム毎全て取得しておくことができる。
通常は使用しないと思うが、CreateJSの機能"SpriteSheetBuilder"(動的にスプライトシートを
生成してキャッシュする機能)を使うときに取れると便利。</pre></dd>
    </pre></dd>
</dl>


### 出力されるもの

flaを標準設定のままパブリッシュすると、以下のようなファイルが出力されます。

```
$ tree
./
├── images       <----- fla内で使用しているビットマップ画像全て
│   └── bitmap_1.png
├── test.fla
├── test.html    <----- flaを単体再生するためのhtml
└── test.js      <----- いわゆるswfファイルのようなもの
```


#### JavaScript

実際に出力されるJavaScriptを、インラインコメントで解説します。

FlashCC for CreateJSにて自動でコメントが入りますが、今回は削除しています。


```javascript 
(function (lib, img, cjs) {

var p;

// このflaファイルのプロパティ
// 必然的に1ネームスペースに1つのプロパティとなってしまうので注意
lib.properties = {
	width: 640,
	height: 836,
	fps: 24,
	color: "#FFFFFF",
    // manifestに、flaファイル内で使用しているアセットが全て入る。パスなどはパブリッシュ設定に準ずる
	manifest: [
		{src:"images/bitmap_1.png", id:"bitmap_1"}
	]
};

// このステージ自身のオブジェクト
// ファイル名 = オブジェクト名となる
(lib.test = function(mode,startPosition,loop) {
	this.initialize(mode,startPosition,loop,{});


    //========== JavaScriptの登録
    // JavaScriptはフレーム毎に function が作られる
    // フレーム2にJavaScriptを書いた場合は this.frame_1 となる(0基準なので)

    // フレーム毎のJavaScript
	this.frame_0 = function() {
        // JavaScriptは別のレイヤーに書いても、フレーム単位でひとまとめになる
		this.stop();
	}

    // フレームに書いたJavaScriptをタイムラインに登録
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));


    //========== インスタンスの登録
    // インスタンス名を設定せずに画面に配置したインスタンスは instance, instance_1, instance_2 とインクリメントされていく
    // インスタンス名を付けている場合は、 this.{INSTANCE_NAME} のようにオブジェクトに登録される

    // ビットマップのインスタンス 
	this.instance = new lib.bitmap_1();
    // 配置したインスタンスの初期位置を設定している。
	this.instance.setTransform(220,710);

    // グラフィックシンボルのインスタンス 
    // 引数については後述
	this.instance_1 = new lib.graphic_1("synched",0);
	this.instance_1.setTransform(310,553);

    // ボタンシンボルのインスタンス
	this.instance_2 = new lib.button_1();
	this.instance_2.setTransform(310,350);
    // CreateJSのButtonHelperを使って、ボタンインスタンスのタイムラインとイベントを設定する
	new cjs.ButtonHelper(this.instance_2, 0, 1, 1);

    // ムービークリップシンボルのインスタンス
	this.instance_3 = new lib.movieclip_1();
	this.instance_3.setTransform(310,148);

    // 配置された全てのインスタンスを、タイムラインに追加することでステージに反映する
	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.instance_3},{t:this.instance_2},{t:this.instance_1},{t:this.instance}]}).wait(1));

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(340.1,441,414.1,767);


// 以下、各シンボル、ビットマップのオブジェクト
// シンボルのオブジェクトの構造は、基本的にステージのそれと変わりはない(逆に言えばステージもシンボルの1つであると言うこと)

// ビットマップのオブジェクト
(lib.bitmap_1 = function() {
    // 画像の実体は、manifest の id で img というネームスペースに登録しているので(HTMLの方)
    // ここでは img.bitmap_1 として画像のデータを呼んでいる
	this.initialize(img.bitmap_1);
}).prototype = p = new cjs.Bitmap();
// nominalbounds は、そのオブジェクトが内包しているオブジェクトの基準座標とサイズを設定するもの
// また、そのオブジェクトの1フレーム目時点の大きさを取るため、2フレーム目以降では値が変わる可能性があるが nominalbounds 自体の値は変化しない
p.nominalBounds = new cjs.Rectangle(0,0,180,80);


// ムービークリップシンボルのオブジェクト
(lib.movieclip_1 = function() {
	this.initialize();

    // 表示するシェイプを登録している
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#33CC00").s().p("AuDGPIAAsdIcHAAIAAMdg");

    // シェイプはタイムラインを持たないので、単純に addChild される
	this.addChild(this.shape);
}).prototype = p = new cjs.Container();
// 基準点が中心なので、-([width|height] / 2) した点を基準座標としている
p.nominalBounds = new cjs.Rectangle(-90,-40,180,80);


// グラフィックシンボルのオブジェクト
(lib.graphic_1 = function() {
	this.initialize();

	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFCC66").s().p("AuDGPIAAsdIcHAAIAAMdg");

	this.addChild(this.shape);
}).prototype = p = new cjs.Container();
p.nominalBounds = new cjs.Rectangle(-90,-40,180,80);


// ボタンシンボルのオブジェクト
(lib.button_1 = function() {
	this.initialize();

	this.shape = new cjs.Shape();
	this.shape.graphics.f("#33CCFF").s().p("AuDGPIAAsdIcHAAIAAMdg");

	this.addChild(this.shape);
}).prototype = p = new cjs.Container();
p.nominalBounds = new cjs.Rectangle(-90,-40,180,80);

})(lib = lib||{}, images = images||{}, createjs = createjs||{});
var lib, images, createjs;
```




### パブリッシュ


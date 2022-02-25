const abcjs = window.ABCJS;

/*ゲームの根幹*/
var keyInputs = "";
var TargetLead = "";
var starttime = -1;
var firstctx_key = true;
var firstctx_se = true;
var ctx_key = null;
var ctx_se = null;
/*楽譜処理関連*/
var abc_suffix = "X:1\nK:C\nL:1/16\n|";
var lenElem = 16; //16,8,4 基本単位

var supposed_char_msc = "";//押してほしい文字
var supposed_indx_msc = 0;
var keyBuffer = "";
var output_keys = ['a','b','c','d','e','f','g','0']; //0 is 休符
var next_peace = "";
supposed_indx_abc = abc_suffix.length;
var octState = 0; //-1 means オク下 1 meansオク上

/*スコア関連*/
var score=-1;

var tmpClear = 0;
var TIMELIMIT = 60; //sec
var goodInput = 0;
var badInput = 0;
var timer1;
var isTimerActive = false;
var firstInput = true;
/* data */
var targets = [
    "c4c4g4g4|a4a4g8|f4f4e4e4|d4d4c4z4",
    "c2d2e2d2c4g,4|c2d2e2d2c8|c2d2e2f2g4a4|g2f2e2d2c8",
    "d4c4d4e4|g4e4d8|e4g4a4g2a2|d'4b4a4g4",
    "a,4c4d4c2d2|e4g,4a,4a,2g,2|a,4c4d4c2d2|e8d8",
    "c4f4e4f4|g4d4g4z4|f4e4d4e4|f8c4z4",
    "c4d4e4f4|e4d4c4z4|e4f4g4a4|g4f4e8",
    "c2g,2c2e2d4b,4|c4b,2a,2g,4g,4|a,4g,2f,2g,4c4|a,2c4e2d8",
    "f4d2c2f4d2c2|z2a4g2 f2f2g4|f4d2c2f4d2c2|z2c2a2g2 f2f1f1g4",
    "d4d2a2 g2a1g1 f2c2|d4d2a2 g2a1g1 f2g2|e4c4c4a,2c2|f2e2d2c2a,4"
]
var CLEAR_N = 3;
var targets_indx = [];

window.onload = function() {

    gameInit();
    gameReset();
    
    
}

/*game algo*/


/*
非ゲーム状態：

ゲーム状態：
target文字列のa~z,→が音符を打ち込むやつら
所望のそれが来たら次の打ち込み文字列までを打ち込んだ文字列に追加



*/

document.body.addEventListener('keypress',
    event => {
        /*キー入力*/
        if (event.key === supposedKey(supposed_char_msc)) {
            supposed_indx_msc += 1;
            
            supposed_char_msc = TargetLead_msc.charAt(supposed_indx_msc);
            /*音符入力 */
            if(output_keys.includes(event.key)){//a~g,→（休符）が来たら
                goodInput += 1;
                document.getElementById('textarea').value += keyBuffer; 
                if(keyBuffer.includes("'")){
                    octState = 1;
                }else if(keyBuffer.includes(",")){
                    octState = -1;
                }else{
                    octState = 0;
                }
                playToneSound(event.key);   
                keyBuffer = next_output_abc();//positionはglobal
                if(keyBuffer == ""){
                    document.getElementById('textarea').value += "||"; 
                }
            }
            document.getElementById('target_input').innerHTML = viewstr(abc2msc(TargetLead),supposed_indx_msc)
            abc_editor = new abcjs.Editor("textarea", { 
                canvas_id: "hypo",  
            });
            
        }else{
            if(output_keys.includes(event.key)){
                badInput += 1;
            }
        }
        
        if(firstInput){
            timerStart();
            firstInput = false;
            ctx = new AudioContext();
        }
        
        //abc版のモードに反映
        //currentLenType_abc = len_msc2abc(currentLenType);
        
        setTimeout(function(){if(keyBuffer == ""){
            sound("correct");
            
            tmpClear += 1;
            if(tmpClear == CLEAR_N){
                gameClear();
                gameInit();
                gameReset();
            }else{
                gameReset();
            }
        };}, 1); 
    
        //setTimeout(function(){document.getElementById('hypo').focus();}, 1);
        //setTimeout(function(){document.getElementById('hypo').blur();}, 100);   
        
        
        
        //alert("supposed "+ supposed_char_msc);
    });




/* functions*/
function gameInit(){
    targets_indx = [];
    for(var i = 0; i<targets.length;i++){
        targets_indx.push(i);
    }
    shuffleArray(targets_indx); 
    tmpClear = 0;
    firstInput = true;
    goodInput = 0;
    badInput = 0;  
}
function timerStart(){
    starttime = performance.now();
}
function timerStop(){
    var endtime = performance.now();
    consumetime = endtime - starttime;
    return consumetime;
}
function gameClear(){
    consumetime = timerStop(); //mili sec
    time_sec = consumetime / 1000;
    
    rank = calcRank();
    //alert("おめでとう");
    //alert(time_sec);
}

function calcBPM(){
    return Math.floor(60 * goodInput/time_sec);
}

function calcExpr(bpm){
    if(bpm<30){
        return "書け出しライター";
    }else if(bpm<40){
        return "指が慣れてきた";
    }else if(bpm<50){
        return "英語式音階の使い手";
    }else if(bpm<60){
        return "採譜完全に理解した";
    }else if(bpm<70){
        return "バラードの申し子";
    }else if(bpm<80){
        return "業務で使えるレベル";
    }else if(bpm<90){
        return "実時間を超越するポテンシャル";
    }else if(bpm<100){
        return "歴戦の譜面起こしニスト";
    }else if(bpm<110){
        return "高鳴る心臓の鼓動";
    }else if(bpm<120){
        return "音を置き去りにした";
    }else if(bpm<130){
        return "バケモノだ！";
    }else{
        return "チーターだ！";
    }
        
}
function calcRate(acc,bpm){
    if(acc >= 100){
        if(bpm>90){
            return "SSS";
        }else if(bpm>60){
            return "SS";
        }else{
            return "S";
        }
    }else if(acc > 95){
        if(bpm>90){
            return "S";
        }else if(bpm>60){
            return "A";
        }else{
            return "B";
        }
    }else if(acc>80){
        if(bpm>90){
            return "A";
        }else if(bpm>60){
            return "B";
        }else{
            return "C";
        }
    }else{
        if(bpm>90){
            return "B";
        }else if(bpm>60){
            return "C";
        }else{
            return "D";
        }
    }
}

function calcRank(){
    //https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/guides/parameter-reference1
    bpm = calcBPM();
    expr=calcExpr(bpm);
    
    //Remove existing share button, if it exists.
    var myNode = document.getElementById('tw_container');
    while (myNode.firstChild) {
    //if(myNode.firstChild){
        myNode.removeChild(myNode.firstChild);
    }
    //}
    
    twttr.widgets.createShareButton( 
        'https://hatakekazu.github.io/LeadWrite/',
        document.getElementById('tw_container'),
        {
            text: 'LeadWrite!!でBPM'+bpm+"の記譜力を発揮！"+expr +"!"
        }
    );
    
    
    acc = goodInput / (goodInput + badInput);
    acc = parseInt(acc * 10000,10)/ 100; 
    rank = calcRate(acc,bpm);
    document.getElementById('resultText').innerHTML = rank + "ランク！<br>正解率="+acc+"% (誤入力 "+badInput + " / "+(goodInput+badInput) +")<br>"+bpm +"BPM: " + expr;
    
    const overlay = document.getElementById('overlay');
    function overlayToggle() {
        overlay.classList.toggle('overlay-on');
    }
    overlayToggle();
    
    //alert("正解率："+acc+"%  (誤入力："+badInput + " / "+(badInput+goodInput) + ")");
    return "S";
}



function viewstr(sentence,pos){
    ret = "";
    for(var i = 0;i<sentence.length;i++){
        if(i==pos){
            ret += "<span>"+sentence.charAt(i);
            ret += "</span>";
        }
        else{
            ret += sentence.charAt(i);
        }
    }

    return ret;
}
function onGame(){
    supposed_char_msc = "";//押してほしい文字
    supposed_indx_msc = 0;
    keyBuffer = "";
    next_peace = "";
    supposed_indx_abc = abc_suffix.length;
    document.getElementById('target_input').innerHTML = viewstr(abc2msc(TargetLead),0);
    supposed_char_msc = TargetLead_msc.charAt(supposed_indx_msc);
    keyBuffer = next_output_abc();//positionはglobal
    //alert("buf = " + keyBuffer);
    //alert("index = " + supposed_indx_abc);
}
function gameReset(){
    //score = 0;
    //document.getElementById('timer').innerHTML = 'press space to start';
    
    score_no = targets_indx[targets_indx.length - 1];
    targets_indx.pop();
    document.getElementById('textarea').value = abc_suffix; // + "z8|z8|z8|z8||";
    TargetLead = abc_suffix + targets[score_no];
    TargetLead_msc = abc2msc(TargetLead);
    TargetLead = TargetLead += "||";
    document.getElementById('target_input').value = TargetLead_msc;
    abcjs.renderAbc("target", TargetLead);
    abc_editor = new abcjs.Editor("textarea", { 
        canvas_id: "hypo",  
    });
    onGame();
    return;
}
function isSameSheet(hypo, target) {
    return hypo == target;
}
function sheetGenerator(){
    /*
    0.前提
        ・4/4 4小節
        ・最後を除き休符を含まない
        ・(とりあえずは)小節をまたぐタイを含まない
    1.形式について
        ・このjs内ではabc形式(以下abc)とmusescore入力形式(以下msc)の2つの表現をする（どちらもstr)
        ・abcは譜面の生成や正解判定などの内部処理、mscはユーザー入力など外部に向ける場所で用いる
        ・abc記法のポイント L:1/8等で最小単位を指定、その後A~G,zで音の種類、数字で音価を指定
        ・msc記法のポイント musescoreの入力形式を表す。内部的に音価単位を持ちその状態で打たれるA~G,zで音符が確定する

    */
    let min = 0;
    let max = 8;

    return random;
}


function abc2msc(seq){//g2a2 → 5ga
    let retseq = "";
    let lastLengType = "4"; // 3=16分音符 4 = 8分音符 , 5=４分音符 6 = ２分音符 ,7 = 全音符
    let nowLengType = "";
    let tone = ['a','b','c','d','e','f','g'];
    let sptk = ["|","'",","," ","\n"]//special token
    let lenMin = 1;
    let lenMax = 8;
    let tmpTone = "";
    let asobi = true;
    for(var i = 0; i < seq.length ; i++){
        if(i < abc_suffix.length){
            continue; //最初の確定してる前情報文字列
        }
        let c = seq.charAt(i);
        if(tone.includes(c)){//A~Gの場所
            tmpTone = c;
        }else if(c == 'z'){
            tmpTone = '0';
        }else if(sptk.includes(c)){//制御文字
            //Do nothing
            asobi = !asobi;
        }else if((lenMin <= parseInt(c)) && (parseInt(c) <= lenMax)){//数字
            nowLengType = toneValueOfMsc(parseInt(c),lenElem);
            if(nowLengType == lastLengType){//前と同じ音価なら関係ない
                retseq = retseq + tmpTone;
            }else{
                retseq = retseq + nowLengType + tmpTone;
            }
            lastLengType = nowLengType;
        
        }else{
            alert("undef input of abc:" + c);
        }
    }
    return retseq;
}

function msc2abc(seq){//4ab -> a2b2
    let retseq = "";
    let tone = ["A","B","C","D","E","F","G","0"];
    let tmpTone = "";
    let toneVal = 2;
    let LengType = String();
    let lenMin = 3;
    let lenMax = 7;
    for(var i = 0 ; i < seq.length ; i++){
        let c = seq.charAt(i);
        if(tone.includes(c)){//A~G

        }else if(lenMin <= parseInt(c) && parseInt(c) <= lenMax){
            
        }
    }

}
function len_msc2abc(current_msc){
    retVal = lenElem;
    if(current_msc == 3){
        retVal /= 16;
    }
    if(current_msc == 4){
        retVal /= 8;
    }
    if(current_msc == 5){
        retVal /= 4;
    }
    if(current_msc == 6){
        retVal /= 2;
    }
    return retVal;
}

function toneValueOfMsc(abcLen,lenElem){//引数の長さがmscでは何になるか
    if(abcLen/lenElem == 1){
        return "7";
    }
    if(abcLen/lenElem == 0.75){//付点2分
        return "6."
    }
    if(abcLen/lenElem == 0.5){
        return "6";
    }
    if(abcLen/lenElem == 0.325){//付点４分
        return "5.";
    }
    if(abcLen/lenElem == 0.25){
        return "5";
    }
    if(abcLen/lenElem == 0.1875){//付点八分
        return "4.";
    }
    if(abcLen/lenElem == 0.125){
        return "4";
    }
    if(abcLen/lenElem == 0.0625){
        return "3";
    }
    alert("parse failed");
    return "";
}
function toneValueOfAbc(mscLen,lenElem){//引数の長さがabcでは何になるか
    let msc = parseInt(mscLen.charAt(0));//最初の数字:4なら８分音符など
    let toneVal = -1;
    if(msc == "3"){
        toneVal = lenElem / 16;
    }else if(msc == "4"){
        toneVal = lenElem / 8;
    }else if(msc == "5"){
        toneVal = lenElem / 4;
    }else if(msc == "6"){
        toneVal = lenElem / 2;
    }else if(msc == "7"){
        toneVal = lenElem;
    }
    
    if(mscLen.length > 1){//付点
        toneVal *= 1.5;
    }
    return String(toneVal);
}

function supposedKey(supposed_char){
    /*
    if(supposed_char == '0'){
        return 'ArrowRight';
    }
    */
    return supposed_char;
}

function next_output_abc(){
    ret = "";
    let _num = ['0','1','2','3','4','5','6','7','8','9'];
    let _tmp_sia = supposed_indx_abc;
    for(var i = _tmp_sia; i<TargetLead.length - 2;i++){ // remove "||""
        ret += TargetLead.charAt(i);
        if(_num.includes(TargetLead.charAt(i)) & ((i!=TargetLead.length -1) & !_num.includes(TargetLead.charAt(i+1)))){
            supposed_indx_abc = i+1;  
            return ret;
        }
    }
    return ret;
}


function generateRand(min,max){
    return Math.floor( Math.random() * (max - min) ) + min;
}
function shuffleArray(inputArray){
    inputArray.sort(()=> Math.random() - 0.5);
}
// setIntervalを使う方法
function sleep(waitSec, callbackFunc) {

    // 経過時間（秒）
    var spanedSec = 0;

    // 1秒間隔で無名関数を実行
    var id = setInterval(function () {

        spanedSec++;

        // 経過時間 >= 待機時間の場合、待機終了。
        if (spanedSec >= waitSec) {

            // タイマー停止
            clearInterval(id);

            // 完了時、コールバック関数を実行
            if (callbackFunc) callbackFunc();
        }
    }, 1000);

}

function getCtx(){
    if(firstctx_key){
        ctx_key = new AudioContext();
        firstctx_key = false;
    }
    if(firstctx_se){
        ctx_se = new AudioContext();
        firstctx_se = false;
    }
}

function playToneSound(tone){
    var baseFreq = 220 * Math.pow(2,3/12);
    getCtx();
    if(tone=="c"){
        playOneshot(baseFreq * Math.pow(2,octState),ctx);
    }else if(tone=="d"){
        playOneshot((baseFreq* Math.pow(2,2/12)) * Math.pow(2,octState),ctx);
    }else if(tone=="e"){
        playOneshot((baseFreq* Math.pow(2,4/12)) * Math.pow(2,octState),ctx);
    }else if(tone=="f"){
        playOneshot((baseFreq* Math.pow(2,5/12)) * Math.pow(2,octState),ctx);
    }else if(tone=="g"){
        playOneshot((baseFreq* Math.pow(2,7/12)) * Math.pow(2,octState),ctx);
    }else if(tone=="a"){
        playOneshot((baseFreq* Math.pow(2,9/12)) * Math.pow(2,octState),ctx);
    }else if(tone=="b"){
        playOneshot((baseFreq* Math.pow(2,11/12)) * Math.pow(2,octState),ctx);
    }
}


function playOneshot(freq,_ctx){

    sec = 0.1;
    
    const osc = ctx_key.createOscillator();
    osc.frequency.value = freq;
    const gainNode = ctx_key.createGain();
    osc.type = "square";
    osc.connect(gainNode);
    gainNode.gain.value = 0.1;
    gainNode.connect(ctx_key.destination);
    osc.start(0);
    osc.stop(ctx_key.currentTime + sec);
}

function sound(type) {
    //type: correct or ng
    if(type == "correct"){
        sec = 0.1;
        
        const osc = ctx_se.createOscillator();
        osc.frequency.value = 440*Math.pow(2,1/12);
        const gainNode = ctx_se.createGain();
        osc.type = "triangle";
        osc.connect(gainNode);
        gainNode.gain.value = 0.1;
        gainNode.connect(ctx_se.destination);
        osc.start(0);
        osc.stop(ctx_se.currentTime + sec);

        
        const osc2 = ctx_se.createOscillator();
        osc2.frequency.value = 220 * Math.pow(2,10/12);
        const gainNode2 = ctx_se.createGain();
        osc2.type = "sine";
        osc2.connect(gainNode2);
        gainNode2.gain.value = 0.1;
        gainNode2.connect(ctx_se.destination);
        osc2.start(ctx_se.currentTime + sec);
        osc2.stop(ctx_se.currentTime + sec + sec);
    }
    

}


document.addEventListener('DOMContentLoaded', function(){

    // オーバレイを開閉する関数
    const overlay = document.getElementById('overlay');
    function overlayToggle() {
        overlay.classList.toggle('overlay-on');
    }
    // 指定した要素に対して上記関数を実行するクリックイベントを設定
    const clickArea = document.getElementsByClassName('overlay-event');
    for(let i = 0; i < clickArea.length; i++) {
        clickArea[i].addEventListener('click', overlayToggle, false);
    }
    
    // イベントに対してバブリングを停止
    function stopEvent(event) {
        event.stopPropagation();
    }
    const overlayInner = document.getElementById('overlay-inner');
    overlayInner.addEventListener('click', stopEvent, false);
    
    }, false);

function cntStart()
{
    document.getElementById('timer').innerHTML = TIMELIMIT;
    timer1=setInterval("countDown()",1000);
}
function countDown(){
    now = document.getElementById('timer').innerHTML;
    if(parseInt(now) > 0){
        document.getElementById('timer').innerHTML = now - 1;
    }else{
        document.getElementById('timer').innerHTML = "end";
        clearInterval(timer1)
    }
}





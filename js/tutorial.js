'use strict';
// ───────── 기능 차례로 열기와 튜토리얼 ─────────
// 기록이 없는 새 사용자는 소환·진화·강화만 보고 시작한다. 나머지는 아래 시점에 하나씩 열린다.
// 이미 기록이 있으면(loadProg에서) 전부 열린 채로 시작한다.
const FEATS={
 catch:{n:'포획',at:'관장을 처음 이기면'},early:{n:'일찍 부르기',at:'관장을 처음 이기면'},shop:{n:'관장 상점과 지닌 물건',at:'관장을 처음 이기면'},
 missions:{n:'미션',at:'10웨이브에 이르면'},wild:{n:'야생 강적',at:'10웨이브에 이르면'},
 luck:{n:'운 뽑기',at:'20웨이브에 이르면'},mega:{n:'메가진화',at:'20웨이브에 이르면'},combo:{n:'특수 조합',at:'20웨이브에 이르면'},modes:{n:'도전 모드',at:'20웨이브에 이르면'},
};
const F=k=>!!(PROG.feat&&PROG.feat[k]);
const featOn=k=>F(k)||!!(state.tutShow&&state.tutShow[k]);
// 새로 열린 기능을 오박사가 한 줄로 소개한다. 버튼이 있으면 그 버튼을 비춘다
const FEAT_INTRO={
 catch:{el:'catch',say:'몬스터볼을 쓸 수 있게 됐어! 체력이 40% 아래로 떨어진 적이 있으면 이 버튼으로 잡아 보렴. 볼은 관장을 이길 때마다 하나씩 받아.'},
 early:{say:'적이 다 나온 뒤 입구 옆에 일찍 버튼이 뜨면, 눌러서 남은 시간만큼 코인을 받고 다음 웨이브로 갈 수 있어.'},
 shop:{say:'관장을 이기면 보상 화면 아래에 상점이 열려. 지닌 물건을 사서 포켓몬에게 쥐여 주렴. 포켓몬을 누르고 물건을 고르면 돼.'},
 missions:{el:'mchip',say:'이제 미션이 열렸어. 이 칸을 누르면 이번 판 목표가 나와. 이루면 코인이나 물건을 받아.'},
 wild:{el:'wildBtn',say:'야생 강적을 부를 수 있어. 25초 안에 쓰러뜨리면 물건을 받지만, 놓치면 적 8마리가 몰려와. 체육관 구간마다 한 번이야.'},
 luck:{el:'luck',say:'운 뽑기가 열렸어. 코인을 더 내면 2단계나 3단계를 노릴 수 있어. 실패하면 아무것도 안 나와.'},
 mega:{say:'메가진화와 특수 조합도 열렸어. 메가스톤을 쥔 3단계는 메가진화하고, 정해진 3단계 세 마리를 모으면 특별한 포켓몬이 나와. 조합법은 도감에 있어.'},
};
function unlockFeat(keys){
  if(!PROG.feat)PROG.feat={};const fresh=keys.filter(k=>!PROG.feat[k]);if(!fresh.length)return;
  fresh.forEach(k=>PROG.feat[k]=1);saveProg();
  const q=fresh.map(k=>FEAT_INTRO[k]).filter(Boolean).map(x=>Object.assign({btn:'알겠어요'},x));
  if(q.length&&state.mode!=='tut')spotQueue(q);
}

// ── 스포트라이트: 화면을 어둡게 하고 한 곳만 비춘다 ──
let SPOT=null,spotQ=[];
function spotQueue(steps){spotQ.push(...steps);}
function spotNext(){const st=spotQ.shift();if(!st){spotHide();return;}spotShow(st,()=>spotNext());}
function spotShow(st,done){
  SPOT={st,done};if(st.pre)st.pre();
  if(st.btn&&state.phase==='play'){SPOT.paused=!state.paused;state.paused=true;syncPause();}
  const sp=$('spot');sp.hidden=false;
  $('spotBub').innerHTML=`<span class="oak-name">오박사</span><p>${st.say}</p><div class="row">${state.mode==='tut'?'<button class="skip" id="spotSkip">연습 건너뛰기</button>':'<span></span>'}${st.btn?`<button class="gbtn summon" id="spotOk">${st.btn}</button>`:''}</div>`;
  if($('spotOk'))$('spotOk').onclick=spotAdvance;
  if($('spotSkip'))$('spotSkip').onclick=tutSkip;
  spotPlace();
}
function spotAdvance(){if(!SPOT)return;const {st,done,paused}=SPOT;if(paused){state.paused=false;syncPause();}SPOT=null;if(st.post)st.post();done&&done();}
function spotHide(){SPOT=null;$('spot').hidden=true;}
function spotRect(st){
  const sr=cv.getBoundingClientRect(),cs=G.cell;
  const cellR=i=>{if(i==null||i<0)return null;const c=cellCenter(i),sy=toSY(c.y);return {x:sr.left+c.x-cs*0.55,y:sr.top+sy-cs*0.95,w:cs*1.1,h:cs*1.3};};
  if(st.el){const e=typeof st.el==='function'?st.el():$(st.el);if(!e||e.hidden||!e.offsetParent)return null;const r=e.getBoundingClientRect();return {x:r.left-4,y:r.top-4,w:r.width+8,h:r.height+8};}
  if(st.cell)return cellR(st.cell());
  if(st.drag){const p=st.drag();if(!p)return null;const a=cellR(p[0]),b=cellR(p[1]);if(!a||!b)return null;const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);return {x,y,w:Math.max(a.x+a.w,b.x+b.w)-x,h:Math.max(a.y+a.h,b.y+b.h)-y,a,b};}
  return null;
}
function spotPlace(){
  if(!SPOT)return;const st=SPOT.st,r=spotRect(st),h=$('spotHole'),b=$('spotBub'),f=$('spotFinger'),H=innerHeight;
  if(r){h.classList.remove('none');Object.assign(h.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});}
  else{h.classList.add('none');Object.assign(h.style,{left:'50%',top:'50%',width:'0px',height:'0px'});}
  const cy=r?r.y+r.h/2:H/2;
  if(r&&cy>H*0.5){b.style.top='auto';b.style.bottom=(H-r.y+18)+'px';}else{b.style.bottom='auto';b.style.top=(r?r.y+r.h+18:H*0.35)+'px';}
  if(r&&r.a){f.hidden=false;f.textContent='👆';const ax=r.a.x+r.a.w/2,ay=r.a.y+r.a.h*0.55,bx=r.b.x+r.b.w/2,by=r.b.y+r.b.h*0.55;
    f.style.left='0px';f.style.top='0px';f.style.setProperty('--ax',ax+'px');f.style.setProperty('--ay',ay+'px');f.style.setProperty('--bx',bx+'px');f.style.setProperty('--by',by+'px');}
  else f.hidden=true;
}
function tickSpot(){if(!SPOT){if(spotQ.length&&state.phase==='play'&&$('modal').hidden&&$('layer').hidden&&!state.cut)spotNext();return;}const st=SPOT.st;spotPlace();if(st.until&&st.until())spotAdvance();}

// ── 튜토리얼: 5웨이브짜리 연습 판 ──
const TUT_DECK=['피츄','파이리','꼬부기','이상해씨','구구'];
let TUT=null;
const partnerCell=()=>board.findIndex(u=>u&&u.partner);
function pairCells(){const L=LIDX('파이리'),c=[];board.forEach((u,i)=>{if(u&&u.line===L&&u.tier===1&&!u.ball)c.push(i);});return c.length>=2?[c[0],c[1]]:null;}
// 연습용 표적: 체력을 20%로 낮추고, 잡기 전에 쓰러지지 않게 5%에서 멈춘다
function weakOne(){const e=enemies.filter(e=>!e.dead&&!e.boss).sort((a,b)=>b.p-a.p)[0];if(e){e.hp=e.max*0.2;e.hpLast=clock;e.tutKeep=true;}}
const TUT_STEPS=[
 {say:'어서 오렴! 나는 오박사란다. 길을 따라 도는 야생 포켓몬을 네 포켓몬으로 막아 보자. 4분이면 끝나.',btn:'좋아요'},
 {say:'하트가 달린 피카츄가 너의 파트너야. 같이 싸울수록 레벨이 올라 진화한단다.',cell:partnerCell,btn:'다음'},
 {say:'아래 몬스터볼을 눌러 포켓몬을 불러 보렴.',el:'summon',pre:()=>{state.tutForce=LIDX('파이리');state.tutForceN=2;},until:()=>state.summons>=1},
 {say:'한 번 더 불러 보자.',el:'summon',until:()=>state.summons>=2},
 {say:'같은 포켓몬끼리 끌어서 겹치면 진화해. 파이리를 다른 파이리 위로 끌어다 놓아 보렴.',drag:pairCells,until:()=>(state.mst.evos||0)>=1},
 {say:'잘했어! 이제 적이 몰려와. 포켓몬은 사거리 안의 적을 알아서 공격하니, 너는 소환하고 진화시키면 돼.',btn:'시작',post:()=>{state.hold=false;}},
 {at:()=>state.wave>=2&&enemies.length>=2,say:'이번 적은 물 타입이야. 전기 공격은 물 타입에 두 배로 들어가. 파트너 피카츄가 활약할 거야.',cell:partnerCell,btn:'다음'},
 {say:'코인을 조금 줄게. 아래 칸을 누르면 그 계열 포켓몬이 모두 강해져. 피카츄 칸을 눌러 보렴.',el:()=>$('ups').children[0],pre:()=>{state.coins+=60;},until:()=>state.up.some(v=>v>0)},
 {at:()=>state.wave>=3&&enemies.filter(e=>!e.dead).length>=3,say:'적이 약해지면 몬스터볼로 잡을 수 있어. 볼 버튼을 눌러 보렴. 체력이 가장 낮은 적에게 날아가.',el:'catch',
  pre:()=>{state.tutShow.catch=1;weakOne();state.balls=Math.max(1,state.balls);state.tutSure=true;},until:()=>{if(!catchable().length)weakOne();return (state.mst.caught||0)>=1||state.throws.length>0;}},
 {at:()=>(state.mst.caught||0)>=1,say:'잡았다! 잡은 포켓몬은 빈 칸에 들어와. 볼은 관장을 이길 때마다 하나씩 받아.',btn:'다음'},
 {at:()=>state.wave>=4,say:'다음 웨이브는 관장 웅이야. 바위 타입이라 물과 풀 공격이 잘 들어. 꼬부기나 이상해씨를 불러 두렴. 위쪽 막대 끝의 얼굴이 다음 관장이야.',el:'prog',btn:'알겠어요',pre:()=>{state.coins+=100;}},
 {at:()=>state.wave>=5&&state.boss&&!state.cut,say:'관장전은 50초 안에 관장을 쓰러뜨려야 해. 힘내!',el:'bossbar',btn:'시작'},
];
function startTutorial(){
  closeLayer();clearRun();
  newGame(TUT_DECK.map(LIDX),null,REGIONS[0],{mode:'tut'});
  MAXW=5;Object.assign(state,{hpMul:0.55,bossMul:0.6,hold:true,coins:100,tutShow:{},waveTypes:[null,['노말'],['물'],['풀'],['노말'],GYMS[0].t],wmods:[null,null,null,null,null,null]});
  TUT={k:0};
}
function tickTut(){
  if(!TUT||state.mode!=='tut'||state.phase!=='play'||SPOT)return;
  const st=TUT_STEPS[TUT.k];if(!st)return;
  if(st.at&&!st.at())return;
  spotShow(st,()=>{TUT.k++;if(!TUT_STEPS[TUT.k]||TUT_STEPS[TUT.k].at)spotHide();});
}
function tutSkip(){spotHide();TUT=null;PROG.tut=1;unlockFeat(['catch','early']);saveProg();state.phase='over';clearRun();showTitle();}
function tutDone(win){
  spotHide();TUT=null;state.phase='over';clearRun();
  if(win){PROG.tut=1;if(!PROG.feat)PROG.feat={};PROG.feat.catch=1;PROG.feat.early=1;saveProg();}
  showModal(`<div class="scr-head"><h2>${win?'연습 끝':'아깝다!'}</h2></div>
   <div class="scr-body"><div class="box"><b>${win?'첫 배지를 받았어요':'관장에게 졌어요'}</b><span class="sub">${win?'소환, 진화, 강화, 포획을 모두 해 봤어요. 이제 관동 모험을 떠나 보세요.':'같은 타입 포켓몬을 진화시키고 강화하면 이길 수 있어요. 한 번 더 해 볼까요?'}</span></div>
   ${win?`<div class="box"><b>앞으로 열리는 것</b><span class="sub">관장을 처음 이기면 상점과 지닌 물건 · 10웨이브에 이르면 미션과 야생 강적 · 20웨이브에 이르면 운 뽑기, 메가진화, 특수 조합, 도전 모드</span></div>`:''}</div>
   <div class="scr-foot"><button class="gbtn summon" id="tGo">${win?'모험 떠나기':'다시 하기'}</button><button class="gbtn" id="tT">타이틀</button></div>`);
  $('tGo').onclick=win?()=>showRegions({mode:'adv'}):startTutorial;$('tT').onclick=showTitle;
}
// 판 진행 중 기능이 열리는 시점
function featCheckWave(w){if(state.mode==='tut')return;if(w>=10)unlockFeat(['missions','wild']);if(w>=20)unlockFeat(['luck','mega','combo','modes']);}
function featCheckGym(){if(state.mode==='tut')return;unlockFeat(['catch','early','shop']);}
const isNewUser=()=>!PROG.tut&&!Object.keys(PROG.best).length;

'use strict';
// ───────── 효과음 ─────────
let AC=null,soundOn=store.get('pkrtd-snd')==='1';
function tone(f,t0,dur,type='square',vol=0.05,f2){const a=AC,o=a.createOscillator(),g=a.createGain(),t=a.currentTime+t0;o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+0.02);}
function sfx(k){if(!soundOn)return;try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
  if(k==='summon')tone(520,0,.08,'square',.035,880);
  else if(k==='evo')[523,659,784,1047].forEach((f,i)=>tone(f,i*.07,.12,'square',.04));
  else if(k==='gym')[196,196,262,247,330].forEach((f,i)=>tone(f,i*.13,.15,'sawtooth',.035));
  else if(k==='badge')[784,988,1175,1568].forEach((f,i)=>tone(f,i*.1,.18,'triangle',.06));
  else if(k==='legend'){tone(200,0,.7,'sawtooth',.045,1200);tone(400,.12,.55,'square',.025,1600);}
  else if(k==='boss'){tone(880,0,.12);tone(660,.12,.12);tone(440,.24,.3);}
  else if(k==='buy')tone(1200,0,.05,'square',.03);
}catch(e){}}

// ───────── 배경음악 ─────────
// 지방마다 코드 진행과 템포가 다른 짧은 루프를 오실레이터로 만든다. 관장전은 단조로 빠르게.
const MUS={on:store.get('pkrtd-bgm')==='1',song:'',next:0,bar:0,step:0,timer:null,g:null};
const SONGS={
 title:{bpm:96,root:60,minor:false,prog:[0,5,3,4],seed:3},
 kanto:{bpm:120,root:60,minor:false,prog:[0,3,4,0,5,3,1,4],seed:11},
 johto:{bpm:106,root:62,minor:false,prog:[0,5,3,4,0,2,3,4],seed:23},
 hoenn:{bpm:128,root:57,minor:false,prog:[0,4,5,3,0,4,3,4],seed:37},
 champ:{bpm:136,root:55,minor:true,prog:[0,5,3,4,0,5,6,4],seed:41},
 night:{bpm:92,root:57,minor:true,prog:[0,5,3,6],seed:53},
 boss:{bpm:152,root:57,minor:true,prog:[0,0,5,6,0,0,3,4],seed:71}};
const SCALE={maj:[0,2,4,5,7,9,11],min:[0,2,3,5,7,8,10]};
const mf=n=>440*Math.pow(2,(n-69)/12);
function note(f,t,d,type,vol){const a=AC,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(g);g.connect(MUS.g);o.start(t);o.stop(t+d+0.03);}
function songNow(){if(state.phase==='draft'||state.phase==='over')return 'title';if(state.boss&&!state.boss.dead)return 'boss';if(isNight(state.wave))return 'night';return REGION.id;}
function music(){
  if(!MUS.on){if(MUS.timer){clearInterval(MUS.timer);MUS.timer=null;}if(MUS.g)MUS.g.gain.value=0;return;}
  try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();}catch(e){return;}
  if(!MUS.g){MUS.g=AC.createGain();MUS.g.connect(AC.destination);}MUS.g.gain.value=0.55;
  if(!MUS.timer){MUS.next=AC.currentTime+0.1;MUS.timer=setInterval(schedule,60);}
}
function schedule(){if(!MUS.on||!AC)return;const want=songNow();if(want!==MUS.song){MUS.song=want;MUS.bar=0;MUS.step=0;}
  const S=SONGS[MUS.song]||SONGS.kanto,sc=S.minor?SCALE.min:SCALE.maj,spb=60/S.bpm/2;
  while(MUS.next<AC.currentTime+0.25){
    const deg=S.prog[MUS.bar%S.prog.length],st=MUS.step,t=MUS.next;
    const tone=k=>{const d=deg+k,o=Math.floor(d/7);return S.root+sc[((d%7)+7)%7]+12*o;};
    if(st%4===0)note(mf(tone(0)-24),t,spb*3.2,'triangle',0.09);
    if(st%4===2)note(mf(tone(0)-12),t,spb*1.6,'triangle',0.05);
    note(mf(tone([0,2,4,2,0,2,4,7][st])),t,spb*0.9,'square',0.012);
    // 멜로디: 곡마다 고정된 씨앗으로 만든 마디 패턴이 여덟 마디마다 되풀이된다
    let h=(S.seed*131+(MUS.bar%8)*17+st*7)%97;if(st%2===0&&h%3!==0){const k=[0,2,4,1,3,5,7,4][h%8];note(mf(tone(k)+12),t,spb*(h%5===0?1.8:0.95),'square',0.022);}
    if(MUS.song==='boss'&&st%2===1)note(2000,t,0.03,'square',0.006);
    MUS.next+=spb;MUS.step=(st+1)%8;if(MUS.step===0)MUS.bar++;}
}

// ───────── 입력 ─────────
function cellAt(ev){const r=cv.getBoundingClientRect();const x=ev.clientX-r.left,y=toWY(ev.clientY-r.top);
  const c=Math.floor((x-G.bx)/G.cell),rr=Math.floor((y-G.by)/G.cell);if(c<0||rr<0||c>=COLS||rr>=ROWS)return -1;const i=rr*COLS+c;return OPEN[i]?i:-1;}
const canEdit=()=>state.phase==='play';
cv.addEventListener('pointerdown',ev=>{hideTip();if(state.paused&&state.phase==='play'&&$('oak').hidden&&$('layer').hidden&&!SPOT){state.paused=false;syncPause();return;}if(!canEdit())return;const i=cellAt(ev);const r=cv.getBoundingClientRect();
  down={i,x:ev.clientX,y:ev.clientY,moved:false};
  if(i>=0&&board[i]){drag={from:i,x:ev.clientX-r.left,y:ev.clientY-r.top};try{cv.setPointerCapture(ev.pointerId);}catch(e){}}});
cv.addEventListener('pointermove',ev=>{if(!down||!drag)return;const r=cv.getBoundingClientRect();drag.x=ev.clientX-r.left;drag.y=ev.clientY-r.top;
  if(Math.hypot(ev.clientX-down.x,ev.clientY-down.y)>8)down.moved=true;});
cv.addEventListener('pointerup',ev=>{if(!down)return;const i=cellAt(ev);
  if(drag&&down.moved){if(i>=0&&i!==drag.from)act(drag.from,i);state.sel=-1;}
  else tap(i);
  drag=null;down=null;renderPanel();});
cv.addEventListener('pointercancel',()=>{drag=null;down=null;});
function tap(i){
  const s=state.sel;
  if(i<0){state.sel=-1;return;}
  if(s>=0&&s!==i&&board[s]){act(s,i);state.sel=-1;return;}
  if(s===i){state.sel=-1;return;}
  state.sel=board[i]?i:-1;
}
$('summon').onclick=summon;
$('speed').onclick=()=>{state.speed=state.speed>=3?1:state.speed+1;$('speed').textContent=state.speed+'×';};
$('menuBtn').onclick=showMenu;
$('catch').onclick=throwBall;
$('luck').onclick=()=>{if(!$('tip').hidden&&$('tip').querySelector('h4')&&$('tip').querySelector('h4').textContent==='운 뽑기')return hideTip();showLuck();};
$('intro').onclick=()=>{introT=0;nextIntro();};
document.addEventListener('pointerdown',()=>{if(MUS.on&&!MUS.timer)music();},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.phase==='play'&&!state.paused){state.paused=true;syncPause();}});
window.addEventListener('resize',layout);
document.addEventListener('keydown',ev=>{if(!$('modal').hidden||!$('layer').hidden)return;
  if(ev.key===' '){ev.preventDefault();summon();}else if((ev.key==='p'||ev.key==='P')&&state.phase==='play'){state.paused=!state.paused;syncPause();}else if(ev.key==='c'||ev.key==='C')throwBall();});

// ───────── 루프 ─────────
let last=0;
// 연출 중에 판을 누르면 연출만 빨리 끝내요
addEventListener('pointerdown',e=>{if(state.reveal&&e.target&&e.target.closest&&e.target.closest('#stage')){state.reveal.t=Math.min(state.reveal.t,0.22);e.stopImmediatePropagation();e.preventDefault();}},true);
function frame(ts){
  const dt=Math.min(0.05,last?(ts-last)/1000:0);last=ts;clock+=dt;
  if(state.cut){state.cut.t-=dt;if(state.cut.t<=0){state.cut=null;toast(state.cutMsg,3.4);}}
  else if(state.reveal){state.reveal.t-=dt;if(state.reveal.t<=0)state.reveal=null;}
  else if(hitStop>0)hitStop-=dt;
  else if(state.phase==='play'&&!state.paused){const sd=cutin&&cutin.T-cutin.t<0.28?dt*0.3:dt;for(let k=0;k<state.speed;k++){if(state.phase!=='play')break;update(sd);}if(state.phase==='play')logTick(dt);}
  updScene(dt);
  shake*=Math.pow(0.02,dt);
  if(recalcSoon){recalcSoon=false;recalc();}
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').dataset.off='';}
  tickIntro(dt);tickTut();tickSpot();
  {const sp=(state.phase==='play'&&!state.paused&&!state.cut)?state.speed:1;updParts(dt*sp);if(callout){callout.t-=dt;if(callout.t<=0)callout=null;}if(bumpT>0)bumpT-=dt;if(state.banner){state.banner.t-=dt;if(state.banner.t<=0)state.banner=null;}}
  for(let bi=0;bi<N;bi++){const u=board[bi];if(u&&u.ball){u.ball.t-=dt;if(u.ball.t<=0){u.ball=null;u.born=0.3;const c=cellCenter(bi);fx.push({k:'flash',x:c.x,y:c.y,r:G.cell*0.35,col:'#ffffff',t:.25,T:.25});fx.push({k:'ring',x:c.x,y:c.y+G.cell*0.18,r:G.cell*0.5,col:'#ffffff',t:.35,T:.35});burst(c.x,c.y,'페어리',8,0.9);}}}
  for(const u of board)if(u){if(u.cast>0)u.cast-=dt;if(u.born>0)u.born-=dt;if(u.pop>0)u.pop-=dt;if(u.lunge>0)u.lunge-=dt*(state.speed||1);if(u.evo){u.evo.t-=dt;if(u.evo.t<=0){u.evo=null;const bi=board.indexOf(u),c=cellCenter(bi);const big=u.tier===4||u.mega;burst(c.x,c.y-G.cell*0.2,'페어리',big?14:6,big?1.3:0.9);fx.push({k:'flash',x:c.x,y:c.y-G.cell*0.2,r:G.cell*(big?0.4:0.3),col:'#fff6c8',t:big?.3:.18,T:big?.3:.18});shake=Math.max(shake,big?6:1);
      if(u.reveal){u.reveal=0;const dd=def(u);state.reveal={t:2.1,T:2.1,id:dd.id,n:dd.n,mega:!!u.mega};}}}}
  {const nt=state.phase!=='draft'&&isNight(state.wave)?1:0;nightA+=(nt-nightA)*Math.min(1,dt*1.5);}
  if(themeIdx()!==bgTheme)buildBg();
  draw();hud();
  requestAnimationFrame(frame);
}
readCols();layout();renderPanel();requestAnimationFrame(frame);
// 글꼴도 불러오기 화면에서 기다린다(느려도 4초까지만). 글자가 뒤늦게 바뀌어 보이지 않게
const fontsReady=()=>{try{return Promise.race([Promise.all(["400 16px 'Black Han Sans'","400 16px 'IBM Plex Sans KR'","700 16px 'IBM Plex Sans KR'"].map(f=>document.fonts.load(f))),new Promise(r=>setTimeout(r,4000))]).catch(()=>{});}catch(e){return Promise.resolve();}};
Promise.all([loadSprites(f=>{const b=$('lbar');if(b)b.style.width=Math.round(f*100)+'%';}),fontsReady()]).then(([r])=>{const l=$('loading');if(l)l.remove();if(isNewUser())startTutorial();else showTitle();const bad=r.filter(x=>!x).length;if(bad)setTimeout(()=>toast(`그림 파일 ${bad}개를 불러오지 못했어요. 새로고침해 보세요.`,4),600);});
if(window.ResizeObserver){const ro=new ResizeObserver(()=>layout());ro.observe(stage);ro.observe($('dockbar'));ro.observe($('hud'));}

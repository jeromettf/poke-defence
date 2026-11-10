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

// ───────── 입력 ─────────
function cellAt(ev){const r=cv.getBoundingClientRect();const x=ev.clientX-r.left,y=ev.clientY-r.top;
  const c=Math.floor((x-G.bx)/G.cell),rr=Math.floor((y-G.by)/G.cell);if(c<0||rr<0||c>=COLS||rr>=ROWS)return -1;const i=rr*COLS+c;return OPEN[i]?i:-1;}
const canEdit=()=>state.phase==='play';
cv.addEventListener('pointerdown',ev=>{if(!canEdit())return;const i=cellAt(ev);const r=cv.getBoundingClientRect();
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
$('info').onclick=()=>{state.info=!state.info;$('info').setAttribute('aria-pressed',state.info);};
$('pause').onclick=()=>{if(state.phase!=='play')return;state.paused=!state.paused;syncPause();};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.phase==='play'&&!state.paused){state.paused=true;syncPause();}});
window.addEventListener('resize',layout);
document.addEventListener('keydown',ev=>{if(!$('modal').hidden||!$('layer').hidden)return;
  if(ev.key===' '){ev.preventDefault();summon();}else if(ev.key==='p'||ev.key==='P')$('pause').click();});

// ───────── 루프 ─────────
let last=0;
function frame(ts){
  const dt=Math.min(0.05,last?(ts-last)/1000:0);last=ts;clock+=dt;
  if(state.cut){state.cut.t-=dt;if(state.cut.t<=0){state.cut=null;toast(state.cutMsg,3.4);}}
  else if(state.phase==='play'&&!state.paused){for(let k=0;k<state.speed;k++){if(state.phase!=='play')break;update(dt);}}
  shake*=Math.pow(0.02,dt);
  if(recalcSoon){recalcSoon=false;recalc();}
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').dataset.off='';}
  {const sp=(state.phase==='play'&&!state.paused&&!state.cut)?state.speed:1;updParts(dt*sp);if(callout){callout.t-=dt;if(callout.t<=0)callout=null;}if(bumpT>0)bumpT-=dt;if(state.banner){state.banner.t-=dt;if(state.banner.t<=0)state.banner=null;}}
  for(let bi=0;bi<N;bi++){const u=board[bi];if(u&&u.ball){u.ball.t-=dt;if(u.ball.t<=0){u.ball=null;u.born=0.3;const c=cellCenter(bi);fx.push({k:'flash',x:c.x,y:c.y,r:G.cell*0.35,col:'#ffffff',t:.25,T:.25});fx.push({k:'ring',x:c.x,y:c.y+G.cell*0.18,r:G.cell*0.5,col:'#ffffff',t:.35,T:.35});burst(c.x,c.y,'페어리',8,0.9);}}}
  for(const u of board)if(u){if(u.cast>0)u.cast-=dt;if(u.born>0)u.born-=dt;if(u.pop>0)u.pop-=dt;if(u.lunge>0)u.lunge-=dt*(state.speed||1);if(u.evo){u.evo.t-=dt;if(u.evo.t<=0){u.evo=null;const bi=board.indexOf(u),c=cellCenter(bi);burst(c.x,c.y-G.cell*0.2,'페어리',14,1.3);fx.push({k:'flash',x:c.x,y:c.y-G.cell*0.2,r:G.cell*0.4,col:'#fff6c8',t:.3,T:.3});shake=Math.max(shake,u.tier===4?6:1.5);}}}
  {const nt=state.phase!=='draft'&&isNight(state.wave)?1:0;nightA+=(nt-nightA)*Math.min(1,dt*1.5);}
  if(themeIdx()!==bgTheme)buildBg();
  draw();hud();
  requestAnimationFrame(frame);
}
readCols();layout();renderPanel();requestAnimationFrame(frame);
loadSprites(f=>{const b=$('lbar');if(b)b.style.width=Math.round(f*100)+'%';}).then(()=>{const l=$('loading');if(l)l.remove();showTitle();});
if(window.ResizeObserver)new ResizeObserver(()=>layout()).observe(stage);

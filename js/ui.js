'use strict';
// ───────── 행동 ─────────
const cost=()=>Math.round(Math.min(90,20+2*state.summons)*mods.costMult);
const upCost=k=>Math.round((15+10*state.up[k])*mods.upCost);
function summon(){
  if(state.phase!=='play')return;
  if(state.luckOnly)return toast('운명의 날 규칙: 오른쪽 운 뽑기로만 포켓몬을 불러요.',1.8);
  if(state.conveyor)return toast('컨베이어 규칙: 5초마다 무료로 한 마리씩 들어와요.',1.6);
  const empty=board.map((v,i)=>v||!OPEN[i]?-1:i).filter(i=>i>=0);
  if(!empty.length)return toast('빈 칸이 없어요. 같은 포켓몬끼리 겹쳐 진화시키거나 팔아서 자리를 만드세요.',2.2);
  const c=cost();if(state.coins<c)return toast(`코인이 ${Math.ceil(c-state.coins)} 모자라요. 적을 쓰러뜨리면 모여요.`,1.6);
  state.coins-=c;logSpend('s',c);state.summons++;
  const wts=state.deck.map(l=>mods.weight[l]||1),tot=wts.reduce((a,b)=>a+b,0);let rr=Math.random()*tot,line=state.deck[0];for(let q=0;q<wts.length;q++){rr-=wts[q];if(rr<=0){line=state.deck[q];break;}}
  // 합성 압박: 30% 확률로 이미 필드에 있는 1단계와 같은 계열이 나온다
  if(Math.random()<0.3){const t1=board.filter(v=>v&&v.tier===1&&!v.partner&&!isDitto(v)&&state.deck.includes(v.line));if(t1.length)line=pick(t1).line;}
  if(state.tutForceN>0){line=state.tutForce;state.tutForceN--;}
  const ditto=LINES[line].mech==='ditto',egg=!ditto&&(state.eggs>0||Math.random()<mods.egg);if(egg&&state.eggs>0)state.eggs--;
  const u={line,tier:egg?2:1,nat:rnd(NATURES.length),form:0,cd:0.7,grow:0,born:0,ball:{t:0.42,T:0.42}};
  if(egg&&LINES[line].mech==='eevee')u.form=rnd(EEVEE.length);
  const i=pick(empty);board[i]=u;sfx('summon');tip('merge','같은 포켓몬 두 마리를 끌어서 겹치면 다음 단계로 진화해요.');
  if(egg)toast(`행운의 알: ${def(u).n}`,1.2);
  recalc();
}
function upgrade(k){
  if(state.phase!=='play'&&state.phase!=='reward')return;
  if(state.up[k]>=MAXLV)return toast('이미 최대 레벨이에요.',1);const c=upCost(k);if(state.coins<c)return toast(`코인이 ${Math.ceil(c-state.coins)} 모자라요.`,1.2);
  state.coins-=c;logSpend('u',c);state.up[k]++;sfx('buy');recalc();
  const L=LINES[state.deck[k]],lv=state.up[k];let n=0;
  for(let i=0;i<N;i++){const u=board[i];if(!u||u.line!==state.deck[k])continue;n++;const c2=cellCenter(i);
    fx.push({k:'ring',x:c2.x,y:c2.y,r:G.cell*0.5,col:'#ffd84a',t:.5,T:.5});fx.push({k:'txt',x:c2.x,y:c2.y-G.cell*0.55,s:'공격 ▲',col:'#ffe14d',t:.8,T:.8});}
  toast(`${L.n[0]} 계열 Lv${lv}: 공격 +${30*lv}%, 공격 속도 +${6*lv}%${n?` · 필드 ${n}마리에 적용`:''}`,1.6);
  const el=document.querySelector(`#ups [data-u="${k}"]`);if(el){el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');}
}
// 처음 한 번만 뜨는 안내
let TIPS={};try{TIPS=JSON.parse(store.get('pkrtd-tips')||'{}');}catch(e){}
function tip(id,msg,sec=3.2){if(TIPS[id]||state.mode==='tut')return;TIPS[id]=1;store.set('pkrtd-tips',JSON.stringify(TIPS));setTimeout(()=>toast(msg,sec),400);}
function act(a,b){
  const ua=board[a],ub=board[b];if(!ua||a===b)return;
  if(!ub){board[b]=ua;board[a]=null;}
  else if(canMerge(ua,ub)){
    let keep=ub;if(isDitto(ub)){keep=ua;}
    const oldId=def(keep).id;
    const evee=LINES[keep.line].mech==='eevee'&&keep.tier===1;
    keep.tier++;if(evee)keep.form=rnd(EEVEE.length);
    if(!isDitto(ua)&&!isDitto(ub))keep.grow=(ua.grow||0)+(ub.grow||0);
    const gone=keep===ua?ub:ua;if(gone.item){if(!keep.item)keep.item=gone.item;else giveItem(gone.item);gone.item=null;}
    board[a]=null;board[b]=keep;keep.cd=0.2;keep.evo={t:evoT(),T:evoT(),from:oldId};sfx('evo');bump('evos');
    const c=cellCenter(b);fx.push({k:'ring',x:c.x,y:c.y,r:G.cell*0.7,col:'#ffffff',t:.4,T:.4});
    setTimeout(()=>{const i2=board.indexOf(keep);if(i2<0)return;const c2=cellCenter(i2);fx.push({k:'txt',x:c2.x,y:c2.y-G.cell*0.8,s:josa(def(keep).n,'으로')+' 진화!',col:'#fff6c8',big:true,t:1.1,T:1.1});},650);
    if(evee)toast(`이브이가 ${josa(EEVEE[keep.form].n,'으로')} 진화`,1.4);
  } else {board[a]=ub;board[b]=ua;}
  recalc();
}
function legendPartners(i){
  const u=board[i];if(!u||u.tier!==3||u.partner||u.mega)return null;
  const seen=new Set([keyOf(u)]),out=[];
  const c=board.map((v,j)=>({v,j})).filter(o=>o.v&&o.j!==i&&o.v.tier===3&&!o.v.partner&&!o.v.mega).sort((p,q)=>p.v.s.dmg*p.v.s.rate-q.v.s.dmg*q.v.s.rate);
  for(const o of c){const k=keyOf(o.v);if(seen.has(k))continue;seen.add(k);out.push(o.j);if(out.length===2)break;}
  return out.length===2?out:null;
}
function fuse(i){
  const p=legendPartners(i);if(!p)return;
  const u=board[i],cc0=cellCenter(i),oldId=def(u).id;for(const j of p){const q=cellCenter(j);fx.push({k:'absorb',x1:q.x,y1:q.y,x2:cc0.x,y2:cc0.y,t:.6,T:.6});dropItem(board[j]);board[j]=null;}bump('legends');u.form=legendFor(u);u.tier=4;u.evo={t:1.1,T:1.1,from:oldId};markReveal(u);shake=7;sfx('legend');u.cd=0.3;u.pop=0.35;
  const c=cellCenter(i);fx.push({k:'ring',x:c.x,y:c.y,r:G.cell*1.2,col:'#f2c14e',t:.6,T:.6});
  toast(`전설 합체: ${LEGENDS[u.form].n}`,1.8);recalc();camP=camT=0.9;cutCD=0;cutin={id:LEGENDS[u.form].id,n:LEGENDS[u.form].n,sk:'전설 합체',col:'#ffd257',t:1.1,T:1.1,leg:true};cutCD=5;
}
// 전설 각성: 25웨이브부터 남는 코인을 전설 포켓몬에 쓴다. 단계마다 공격 +25%, 공격 속도 +10%
const AWK_FROM=25,AWK_MAX=3,awkCost=u=>[400,800,1200][u.awk||0];
const canAwk=u=>u&&u.tier===4&&state.wave>=AWK_FROM&&(u.awk||0)<AWK_MAX;
function awaken(i){const u=board[i];if(!canAwk(u))return;const c=awkCost(u);if(state.coins<c)return toast(`코인이 ${Math.ceil(c-state.coins)} 모자라요.`,1.2);
  state.coins-=c;logSpend('a',c);u.awk=(u.awk||0)+1;u.pop=0.3;sfx('legend');const p=cellCenter(i);
  fx.push({k:'ring',x:p.x,y:p.y,r:G.cell*1.1,col:'#ffd257',t:.5,T:.5});fx.push({k:'txt',x:p.x,y:p.y-G.cell*0.8,s:'각성 '+u.awk+'단계',col:'#ffe58a',big:true,t:1,T:1});
  recalc();toast(`${def(u).n} 각성 ${u.awk}단계: `+(isAura(u.s.mech)?`지원 효과 +${15*u.awk}%`:`공격 +${25*u.awk}%, 공격 속도 +${10*u.awk}%`),1.6);}
function sell(i){const u=board[i];if(!u)return;if(state.noSell)return toast('판매 금지 규칙이 붙은 판이에요.',1.4);if(u.partner)return toast('파트너는 팔 수 없어요.',1.4);
  state.coins+=REFUND[u.tier]*(u.mega?2:1);dropItem(u);board[i]=null;state.sel=-1;recalc();}

// 웨이브 보상 코인이 판 가운데서 위 코인 칸으로 날아간다. 3배속이면 개수를 줄이고 짧게.
const lowMotion=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
function waveCoins(n){
  const dst=$('coins');if(!dst||document.hidden)return;const sp=state.speed||1,dur=sp>=3?380:sp>=2?480:600;
  const pulse=()=>{dst.classList.remove('gain');void dst.offsetWidth;dst.classList.add('gain');};
  if(lowMotion()||!dst.animate)return pulse();
  const sr=$('stage').getBoundingClientRect(),dr=dst.getBoundingClientRect(),x0=sr.left+G.W/2,y0=sr.top+toSY(G.oy+G.bh*0.5),x1=dr.left+18,y1=dr.top+dr.height/2;
  const k=sp>=3?3:6;
  const lab=document.createElement('div');lab.className='cgain';lab.textContent='+'+n;lab.style.left=x0+'px';lab.style.top=y0+'px';document.body.appendChild(lab);
  lab.animate([{opacity:0,transform:'translate(-50%,-30%) scale(.8)'},{opacity:1,transform:'translate(-50%,-80%) scale(1)',offset:.25},{opacity:0,transform:'translate(-50%,-160%) scale(1)'}],{duration:dur+300,easing:'ease-out'}).onfinish=()=>lab.remove();
  for(let q=0;q<k;q++){const c=document.createElement('i');c.className='cfly';document.body.appendChild(c);
    const a=q/k*Math.PI*2,sx=x0+Math.cos(a)*22,sy=y0+Math.sin(a)*14,mx=(sx+x1)/2+(Math.random()-.5)*60,my=Math.min(sy,y1)-30;
    const an=c.animate([{transform:`translate(${sx}px,${sy}px) scale(.6)`,opacity:0},{transform:`translate(${sx}px,${sy-10}px) scale(1)`,opacity:1,offset:.15},{transform:`translate(${mx}px,${my}px) scale(.9)`,offset:.55},{transform:`translate(${x1}px,${y1}px) scale(.5)`,opacity:.9}],{duration:dur,delay:q*40,easing:'cubic-bezier(.5,0,.6,1)',fill:'backwards'});
    an.onfinish=()=>{c.remove();if(q===k-1)pulse();};}
}

// ───────── 기록과 이어하기 ─────────
// 지방별 최고 기록·배지·정복 여부는 PROG, 진행 중인 판은 웨이브가 시작될 때마다 SAVE_KEY에 남긴다
const SAVE_KEY='pkrtd-run1',PROG_KEY='pkrtd-prog';
function loadProg(){let p=null;try{p=JSON.parse(store.get(PROG_KEY)||'null');}catch(e){}
  if(!p){p={};const old=+(store.get('pkrtd-best2')||0);if(old)p={best:{kanto:old},clear:old>=MAXW?{kanto:true}:{}};}
  for(const k of ['clear','best','badges','rank','stars','endless','raid','daily','st','ach','seen'])p[k]=p[k]||{};
  // 기능 잠금은 기록이 없는 새 사용자에게만. 이미 해 본 사람은 전부 열어 둔다
  if(!p.feat){p.feat={};if(Object.keys(p.best).length){for(const k of ['catch','early','shop','missions','wild','luck','mega','combo','modes'])p.feat[k]=1;p.tut=1;}}p.dex=p.dex||{};p.dex.o=p.dex.o||{};p.dex.s=p.dex.s||{};return p;}
let PROG=loadProg();
const saveProg=()=>store.set(PROG_KEY,JSON.stringify(PROG));
function noteBadge(){if(state.mode!=='adv')return;const id=REGION.id;PROG.badges[id]=Math.max(PROG.badges[id]||0,state.badges);saveProg();}
const trUnlocked=T=>!T.need||(T.need==='kanto'?!!PROG.clear.kanto:T.need==='johto4'?(PROG.badges.johto||0)>=4:T.need==='johto'?!!PROG.clear.johto:T.need==='hoenn4'?(PROG.badges.hoenn||0)>=4:false);
const lineOpen=L=>!L.rg||(L.rg==='johto'?!!PROG.clear.kanto:!!PROG.clear.johto);
function saveRun(extra){if(state.mode==='tut')return;
  if(!state.deck||!state.deck.length||state.phase==='over')return;
  const U=u=>u&&{line:u.line,tier:u.tier,nat:u.nat,form:u.form,grow:u.grow||0,ss:u.ss||0,cnt:u.cnt||0,item:u.item||null,mega:u.mega||0,awk:u.awk||0,partner:u.partner||null,dealt:u.dealt||0};
  const E=e=>({t:e.t,name:e.name,sid:e.sid,hp:e.hp,max:e.max,sp:e.sp,p:e.p,big:e.big,fast:e.fast});
  if(dexDirty){dexDirty=false;saveProg();}
  store.set(SAVE_KEY,JSON.stringify(Object.assign({v:3,region:state.region,deck:state.deck,up:state.up,coins:state.coins,wave:state.wave,waveTypes:state.waveTypes,wmods:state.wmods,
    taken:state.taken,takenNames:state.takenNames,badges:state.badges,kills:state.kills,summons:state.summons,trIdx:state.trainer?state.trIdx:-1,speed:state.speed,mods,
    mode:state.mode,rank:state.rank,rules:state.rules,seed:state.seed,raidLeg:state.raidLeg,daily:state.daily,balls:state.balls,master:state.master,bag:state.bag,log:state.log,mst:state.mst,missions:state.missions,mDone:state.mDone,
    wildReady:state.wildReady,rerolls:state.rerolls,eggs:state.eggs,
    board:board.map(U),enemies:enemies.filter(e=>!e.dead&&!e.boss&&!e.wild&&!e.caught).map(E)},extra||{})));
}
function loadRun(){try{const s=JSON.parse(store.get(SAVE_KEY)||'null');return s&&s.v>=2&&s.deck?s:null;}catch(e){return null;}}
const clearRun=()=>store.set(SAVE_KEY,'');
function resumeRun(s){wantGroup(1);wantGroup(0);wantGroup(REGION_G[s.region]||0);
  const R=REGIONS.find(r=>r.id===s.region)||REGIONS[0];setRegion(R);
  mods=Object.assign(freshMods(),s.mods);
  state={info:state.info,phase:'play',deck:s.deck,up:s.up,coins:s.coins,wave:s.wave,waveT:0,waveLen:20,spawnLeft:0,spawnT:0,spawnGap:1,summons:s.summons,speed:s.speed||1,paused:false,
    region:R.id,waveTypes:s.waveTypes,wmods:s.wmods,boss:null,bossDown:false,taken:s.taken,takenNames:s.takenNames,badges:s.badges,kills:s.kills,sel:-1,eid:0,
    mode:s.mode||'adv',rank:s.rank||0,rules:s.rules||[],seed:s.seed||0,raidLeg:s.raidLeg,daily:s.daily||null};
  if(state.mode==='endless'||state.mode==='raid')MAXW=999;
  initRun(!s.mst);if(s.mst)Object.assign(state,{balls:s.balls,master:s.master||0,bag:s.bag||[],mst:s.mst,missions:s.missions||[],mDone:s.mDone||0,wildReady:s.wildReady,rerolls:s.rerolls||0,eggs:s.eggs||0,lastThrow:-9,conv:2});
  setVariant(variantFor(s.wave));layout();
  state.log=s.log||null;if(!state.log){logStart();state.log.cut=true;}
  if(s.trIdx>=0&&TRAINERS[s.trIdx]){state.trainer=TRAINERS[s.trIdx];state.trIdx=s.trIdx;}
  $('speed').textContent=state.speed+'×';
  board=Array(N).fill(null);s.board.forEach((u,i)=>{if(u&&i<N&&OPEN[i])board[i]=Object.assign({cd:0.5,born:0},u);});
  enemies=[];fx=[];projs=[];zones=[];for(const e of s.enemies)mkEnemy(Object.assign({},e));
  hudWave=-1;recalc();closeModal();closeLayer();
  if(s.rw!=null)openReward(s.rw>=0?GYMS[s.rw]:(s.rwRaid?gymAt(s.wave):null),true);else{startWave();toast(`${R.n} ${state.wave}웨이브부터 이어서 해요`,1.8);}
}

// ───────── 보상 ─────────
function rewardPool(){
  const cnt=id=>state.taken.filter(x=>x===id).length;
  const k=rnd(state.deck.length),L=LINES[state.deck[k]];
  return [
   state.up[k]<MAXLV&&{id:'focus',title:`${L.n[0]} 계열 집중`,desc:`${L.n[0]} 계열 강화 레벨 +2 (무료)`,ap:()=>{state.up[k]=Math.min(MAXLV,state.up[k]+2);}},
   {id:'dmg',title:'힘의 머리띠',desc:'모든 포켓몬 공격 +15%',ap:()=>{mods.dmgAll+=0.15;}},
   {id:'rate',title:'빠른 손',desc:'모든 포켓몬 공격 속도 +12%',ap:()=>{mods.rateAll+=0.12;}},
   {id:'range',title:'넓은 시야',desc:'사거리 +15%',ap:()=>{mods.rangeAll+=0.15;}},
   {id:'crit',title:'급소 노리기',desc:'치명타 확률 +10%',ap:()=>{mods.crit+=0.1;}},
   {id:'interest',title:'저금통',desc:'웨이브 시작 이자율 +5%, 상한 +6',ap:()=>{mods.intCap+=6;mods.intRate+=0.05;}},
   {id:'cost',title:'할인 쿠폰',desc:'소환 비용 -15%',ap:()=>{mods.costMult*=0.85;}},
   {id:'tm',title:'기술머신 정비',desc:'계열 강화 비용 -20%',ap:()=>{mods.upCost*=0.8;}},
   {id:'kill',title:'부적금화',desc:'적을 쓰러뜨릴 때마다 코인 +1',ap:()=>{mods.coinKill+=1;}},
   {id:'se',title:'약점 보험',desc:`효과가 굉장한 공격 배율 ${mods.se}배 → ${mods.se+0.5}배`,ap:()=>{mods.se+=0.5;}},
   cnt('nve')<2&&{id:'nve',title:'달인의 띠',desc:`효과가 별로인 공격 배율 ${mods.nve}배 → ${mods.nve+0.25}배`,ap:()=>{mods.nve+=0.25;}},
   {id:'boss',title:'관장 연구',desc:'관장 포켓몬에게 주는 피해 +35%',ap:()=>{mods.bossDmg+=0.35;}},
   cnt('egg')<3&&{id:'egg',title:'행운의 알',desc:'소환할 때 12% 확률로 2단계가 나와요',ap:()=>{mods.egg+=0.12;}},
   {id:'dot',title:'독바늘',desc:'독·화상·장판 피해 +50%',ap:()=>{mods.dot+=0.5;}},
   {id:'chain',title:'자석',desc:'연쇄 공격이 1마리 더 튀어요',ap:()=>{mods.chain+=1;}},
   {id:'splash',title:'넓은 파도',desc:'광역·장판 범위 +35%',ap:()=>{mods.splash+=0.35;}},
   cnt('slow')<2&&{id:'slow',title:'얼음 비늘',desc:'감속 +15%p, 감속 공격에 기절 확률 +6%p',ap:()=>{mods.slow+=0.15;mods.stun+=0.06;}},
   {id:'supp',title:'응원단',desc:'지원 포켓몬의 효과 +50%',ap:()=>{mods.supp+=0.5;}},
   {id:'tmskill',title:'기술머신',desc:'고유 스킬 발동 확률 +30%',ap:()=>{mods.skill+=0.3;}},
   cnt('pp')<2&&{id:'pp',title:'PP회복',desc:'스킬을 쓴 직후 25% 확률로 바로 다시 공격',ap:()=>{mods.pp+=0.25;}},
   {id:'gold',title:'금구슬',desc:'코인 150 바로 받기',ap:()=>{state.coins+=150;}},
   {id:'cap',title:'튼튼한 울타리',desc:'필드 적 제한 +15',ap:()=>{mods.cap+=15;}},
   cnt('syn')<1&&{id:'syn',title:'팀워크',desc:'타입 시너지에 필요한 수 1 감소 (3→2, 5→4)',ap:()=>{mods.synRed+=1;}},
  ].filter(Boolean);
}
const RICON={
 atk:'<svg viewBox="0 0 32 32"><path d="M8 24 22 10m0 0h-6m6 0v6M6 26l3-3" stroke="#d93b3b" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 spd:'<svg viewBox="0 0 32 32"><path d="M18 4 8 18h7l-2 10 11-15h-7z" fill="#e3ad1f"/></svg>',
 rng:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11" fill="none" stroke="#2f6fd6" stroke-width="2.5"/><circle cx="16" cy="16" r="5" fill="none" stroke="#2f6fd6" stroke-width="2.5"/><circle cx="16" cy="16" r="1.8" fill="#2f6fd6"/></svg>',
 coin:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11" fill="#f5c542" stroke="#b98a14" stroke-width="2.5"/><circle cx="16" cy="16" r="5" fill="none" stroke="#b98a14" stroke-width="2"/></svg>',
 skill:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11" fill="#9fc4ff" stroke="#2459b3" stroke-width="2.5"/><circle cx="16" cy="16" r="4" fill="#fff" stroke="#2459b3" stroke-width="2"/></svg>',
 sup:'<svg viewBox="0 0 32 32"><path d="M16 26s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12z" fill="#f08ab5"/></svg>',
 def:'<svg viewBox="0 0 32 32"><path d="M16 4 26 8v7c0 6-4.5 10.5-10 13C10.5 25.5 6 21 6 15V8z" fill="#7aa874"/></svg>',
 type:'<svg viewBox="0 0 32 32"><path d="M16 4l3.4 7.6L27 13l-6 5.4L22.6 27 16 22.6 9.4 27 11 18.4 5 13l7.6-1.4z" fill="#b25cb0"/></svg>',
 egg:'<svg viewBox="0 0 32 32"><ellipse cx="16" cy="17" rx="9" ry="11" fill="#fff6dc" stroke="#d9b45a" stroke-width="2"/><circle cx="12" cy="14" r="2" fill="#7fc97f"/><circle cx="19" cy="20" r="2.4" fill="#7fc97f"/></svg>',
 mega:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11" fill="#ffd6f3" stroke="#c0399a" stroke-width="2.5"/><path d="M16 7c3 4 6 6 6 9a6 6 0 0 1-12 0c0-3 3-5 6-9z" fill="#ff7ad9"/><path d="M16 12c1.5 2 3 3 3 5a3 3 0 0 1-6 0c0-2 1.5-3 3-5z" fill="#fff"/></svg>'};
const RMETA={focus:['epic','atk'],dmg:['common','atk'],rate:['common','spd'],range:['common','rng'],crit:['common','atk'],interest:['rare','coin'],cost:['common','coin'],tm:['rare','coin'],kill:['common','coin'],
 se:['rare','type'],nve:['rare','type'],boss:['rare','atk'],egg:['rare','egg'],dot:['common','type'],chain:['rare','spd'],splash:['common','rng'],slow:['rare','def'],supp:['rare','sup'],tmskill:['rare','skill'],
 pp:['rare','skill'],gold:['common','coin'],cap:['common','def'],syn:['epic','type']};
const RLAB={common:'일반',rare:'희귀',epic:'특별'};
function openReward(g,resumed,again){
  saveRun({rw:g?GYMS.indexOf(g):-1,rwRaid:g&&g.raid?1:0});
  state.phase='reward';if(g&&!resumed&&!again)sfx('badge');state.sel=-1;renderPanel();hideTip();
  const n=state.rewardN||3;let opts=shuffle(rewardPool()).slice(0,n);
  const stars=g&&state.lastStars&&!again?`<span class="stars">${'★'.repeat(state.lastStars)}${'☆'.repeat(3-state.lastStars)}</span>`:'';
  const got=g?`<div class="lcdcard"><svg class="bd" viewBox="0 0 56 56" aria-hidden="true"><path d="M28 4 50 17v22L28 52 6 39V17z" fill="${g.col}" stroke="#fff" stroke-width="3"/><path d="M28 15 40 22v12L28 41 16 34V22z" fill="rgba(255,255,255,.45)"/></svg><div><small>${g.raid?'전설 레이드':'배지 '+state.badges+'/'+GYMS.length} ${stars}</small><b>${g.badge}${g.raid?'':' 획득'}</b><span>${g.bd}${g.raid?'':' · 몬스터볼 +1'}</span></div></div>`:'';
  const nx=nextGym(),ng=nx&&nx.g;
  const shop=g&&!again?shopOffers():[];
  const draw=()=>{showModal(`<div class="scr-head"><h2>${g?(g.raid?`레이드 ${g.raid}단계 돌파`:`${g.lead} ${g.title?'':'체육관 '}돌파`):`웨이브 ${state.wave} 통과`}</h2></div>
   <div class="scr-body">${again?'':got}
   <p class="sub">${again?'거대 관장 규칙: 보상을 하나 더 골라요.':'보상 하나를 고르면 바로 다음 웨이브가 시작돼요.'}${ng?` 다음 상대는 ${nx.w}웨이브 ${ng.raid?'전설 '+ng.n:ng.lead}(${ng.t.join('·')}).`:''}</p>
   <div class="rew">${opts.map((o,k)=>{const [rk,ic]=RMETA[o.id]||['common','atk'];return `<button class="card rcard ${rk}" data-r="${k}"><span class="ico" aria-hidden="true">${RICON[ic]}</span><span class="rt"><span class="rk">${RLAB[rk]}</span><span class="t">${o.title}</span><span class="d">${o.desc}</span></span></button>`;}).join('')}</div>
   ${state.rerolls>0?`<button class="gbtn" id="reroll">보상 다시 뽑기 · ${state.rerolls}번 남음</button>`:''}
   ${shop.length?`<div class="shop"><div class="shop-h"><b>프렌들리숍</b><span class="coinv">${Math.floor(state.coins)}</span></div>${shop.map((o,k)=>`<button class="sitem" data-s="${k}" ${o.sold||state.coins<o.price?'disabled':''}><span class="ico">${o.iid?itemIco(o.iid):RICON[o.ic]||RICON.coin}</span><span class="rt"><b>${o.n}</b><span>${o.d}</span></span><span class="pr">${o.sold?'구입함':o.price}</span></button>`).join('')}</div>`:''}
   </div>`);
   const sh=$('sheet');
   sh.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const o=opts[+b.dataset.r];o.ap();state.taken.push(o.id);state.takenNames.push(o.title);recalc();
     if(g&&state.twice&&!again)return openReward(g,true,true);closeModal();startWave();startMissions();});
   if($('reroll'))$('reroll').onclick=()=>{state.rerolls--;opts=shuffle(rewardPool()).slice(0,n);draw();};
   sh.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{const o=shop[+b.dataset.s];if(o.sold||state.coins<o.price)return;state.coins-=o.price;logSpend('b',o.price);o.sold=true;o.buy();sfx('buy');draw();});};
  draw();
}
// 관장 보상 화면의 상점
function shopOffers(){if(!featOn('shop'))return [];const out=[],its=shuffle(ITEM_POOL.slice()).slice(0,2);
  for(const id of its){const I=ITEMS[id];out.push({n:I.n,d:I.d,iid:id,price:I.r==='rare'?140:100,buy:()=>giveItem(id)});}
  out.push({n:'몬스터볼 2개',d:'체력이 40% 아래인 적을 잡아요',ic:'egg',price:45,buy:()=>{state.balls=Math.min(9,(state.balls||0)+2);}});
  const megaOk=F('mega')&&state.deck.some(l=>MEGA[LINES[l].n[2]])&&!state.bag.includes('stone')&&!board.some(u=>u&&(u.item==='stone'));
  if(megaOk&&Math.random()<0.6)out.push({n:'메가스톤',d:ITEMS.stone.d,iid:'stone',price:170,buy:()=>giveItem('stone')});
  else if(Math.random()<0.35)out.push({n:'마스터볼',d:'야생 강적도 반드시 잡아요',ic:'egg',price:150,buy:()=>{state.master=(state.master||0)+1;}});
  return out;}

// ───────── 화면 ─────────
function showModal(html){$('sheet').innerHTML=html;$('modal').hidden=false;const b=$('sheet').querySelector('.scr-body');if(b)b.scrollTop=0;}
function closeModal(){$('modal').hidden=true;}
function showLayer(html){$('lsheet').innerHTML=html;$('layer').hidden=false;}
function closeLayer(){$('layer').hidden=true;}
const backBtn=`<button class="ibtn" data-back aria-label="뒤로"><svg viewBox="0 0 24 24"><path d="M15.5 4.5 8 12l7.5 7.5" stroke="#eef3f1" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
function draftPool(){
  const ok=LINES.map((L,i)=>i).filter(i=>lineOpen(LINES[i]));
  const by=r=>shuffle(ok.filter(i=>LINES[i].role===r));
  const out=[...by('D').slice(0,2),...by('A').slice(0,2),...by('C').slice(0,1),...by('S').slice(0,1),...by('X').slice(0,1)];
  const rest=shuffle(ok.filter(i=>!out.includes(i)));
  return shuffle(out.concat(rest.slice(0,3)));
}
function showGuide(){
  showLayer(`<div class="scr-head">${backBtn}<h2>규칙과 도감</h2></div>
   <div class="scr-body">
   <ul class="rules">
    <li>같은 포켓몬·같은 단계를 끌어다 겹치면 진화해요.</li>
    <li>코인은 소환과 계열 강화에 함께 써요. 판이 차면 소환 비용이 강화보다 비싸져요.</li>
    <li>계열 강화 1레벨마다 그 계열 전체의 공격 +30%, 공격 속도 +6%(최대 15레벨). 비용은 15 + 10×현재 레벨이에요. 강화 칸을 길게 누르면 미리 볼 수 있어요.</li>
    <li>위쪽 예보 칸에 '불리'가 뜨면 내 공격 포켓몬 절반 이상이 그 타입에 잘 안 들어간다는 뜻이에요. 칸을 누르면 자세히 나와요.</li>
    <li>필드 적이 60마리를 넘으면 패배. 5웨이브마다 관장을 50초 안에 쓰러뜨려 배지를 받아요.</li>
    <li>지원 포켓몬은 공격하지 않고 주변 칸을 강화해요. 3단계가 되면 범위가 두 칸으로 넓어져요.</li>
    <li>서로 다른 3단계 3마리로 전설 합체를 할 수 있어요. 합체 버튼을 누른 포켓몬의 타입이 전설을 정하고, 그 계열 강화를 이어받아요.</li>
    <li>2단계부터 고유 스킬을 써요. 공격 스킬은 공격 1회마다 같은 확률로 터지고 위력은 평타의 배수라, 빠른 포켓몬은 작은 스킬이 자주, 느린 포켓몬은 큰 스킬이 가끔 터져요. 얼리기·재우기·혼란·표식 같은 효과형 스킬과 지원 스킬은 몇 초마다 확정으로 나가요. 관장은 기절·얼음·잠듦 대신 감속에 걸려요.</li>
    <li>발판 둘레 링은 단계예요. 은색은 2단계, 금색은 3단계예요.</li>
    <li>하트가 붙은 포켓몬은 파트너예요. 팔거나 합칠 수 없지만, 싸울수록 레벨이 올라 Lv5에 최종 진화하고 Lv10까지 강해져요.</li>
    <li>왼쪽 아래 볼 버튼은 포획이에요. 체력이 40% 아래인 적 중 가장 약한 적에게 던지고, 잡으면 그 타입의 덱 포켓몬이 빈 칸에 들어와요.</li>
    <li>오른쪽 아래 운 버튼은 운 뽑기예요. 코인을 더 내고 2단계(55%)나 3단계(35%)를 노려요. 실패하면 아무것도 나오지 않아요.</li>
    <li>위쪽 미션 칸에 이번 판 목표 3개가 있어요. 이루면 코인, 지닌 물건, 몬스터볼, 메가스톤을 받아요.</li>
    <li>야생 칸을 누르면 강한 야생 포켓몬이 나와요. 체육관 구간마다 한 번, 25초 안에 쓰러뜨리면 지닌 물건을 받고 놓치면 적 8마리가 몰려와요.</li>
    <li>지닌 물건은 포켓몬을 누르고 '물건'에서 쥐여 줘요. 팔거나 합치면 가방으로 돌아와요.</li>
    <li>메가스톤을 쥔 3단계 포켓몬은 메가진화할 수 있어요. 한 번에 한 마리, 같은 계열 3단계를 먹이면 5단계까지 강해져요.</li>
    <li>정해진 3단계 세 마리를 모으면 특수 조합 버튼이 생겨요. 조합법은 도감의 특수 탭에 있어요.</li>
    <li>같은 줄 바로 옆에 같은 계열이 있으면 짝꿍 보너스로 공격 +10%(두 마리면 +20%).</li>
    <li>적이 다 나온 뒤 입구 옆 '일찍' 버튼을 누르면 남은 시간만큼 코인을 받고 다음 웨이브로 가요.</li>
    <li>관장을 이길 때 별을 받아요. 이기면 1개, 15초 넘게 남기면 1개, 필드 적이 15마리 이하면 1개.</li>
    <li>웨이브가 시작될 때마다 저장돼요. 창을 닫아도 타이틀에서 이어할 수 있어요.</li>
    ${REGION.ruleDesc?`<li>${REGION.n} 규칙: ${REGION.ruleDesc}</li>`:''}
   </ul>
   <h4>${REGION.n} 체육관 순서</h4>
   <div class="tiles">${GYMS.map((g,k)=>{const st=(PROG.stars[REGION.id]||[])[k]||0;return `<div>${sprTag(g.id)}<b>${(k+1)*5} ${g.lead}</b><i>${g.t.join('·')}</i><i class="stars">${'★'.repeat(st)}${'☆'.repeat(3-st)}</i></div>`;}).join('')}</div>
   <h4>전설 (합체 기준 포켓몬의 타입)</h4>
   <div class="tiles">${LEGENDS.map(L=>`<div>${sprTag(L.id)}<b>${L.n}</b><i>${L.from}</i></div>`).join('')}</div>
   </div>`);
  $('lsheet').querySelector('[data-back]').onclick=closeLayer;
}
function showDraft(tab='tr',R=REGION,opt={mode:'adv'}){
  state.phase='draft';closeLayer();let sup=null;const sups=supOpen();
  const pool=draftPool();const chosen=new Set();
  const uniq=a=>[...new Set(a)];
  const evo=L=>L.mech==='eevee'?`이브이 <em>→ 8갈래</em>`:L.mech==='ditto'?'메타몽 <em>(진화 없음)</em>':uniq(L.n).join(' <em>→</em> ')+(uniq(L.n).length<3?' <em>(3단계는 강화형)</em>':'');
  const thumbs=L=>L.mech==='eevee'?[133,134,197,700].map(sprTag).join(''):uniq(L.id).map(sprTag).join('');
  const trCards=TRAINERS.map((T,k)=>{const ls=T.lines.map(LIDX),open=trUnlocked(T);return `<button class="card tr" data-t="${k}" ${open?'':'disabled'}><span class="t">${T.n}${open?'':' <small>잠김</small>'}</span>
    <span class="thumbs">${ls.map(i=>sprTag(LINES[i].id[2])).join('')}</span><span class="d">${open?T.desc:NEED_TXT[T.need]}</span>
    <span class="chips">${Object.entries(ls.reduce((o,i)=>{const r=LINES[i].role;o[r]=(o[r]||0)+1;return o;},{})).map(([r,c])=>`<span class="role" style="background:${ROLE[r].c}">${ROLE[r].n} ${c}</span>`).join('')}</span></button>`;}).join('');
  const cuCards=pool.map(i=>{const L=LINES[i];return `<button class="card" data-l="${i}" aria-pressed="false">
     <span class="thumbs">${thumbs(L)}</span><span class="evo">${evo(L)}</span><span class="chips">${roleTag(L.role)}${L.t.map(chip).join('')}</span><span class="d">${MECH[L.mech]}</span>${(()=>{const k=L.mech==='ditto'?'메타몽':L.mech==='gyara'?'갸라도스':L.mech==='eevee'?null:L.n[2];const sk=k&&SKILL[k];return sk?`<span class="d" style="color:var(--fg)">스킬 ${sk.n}: ${sk.d}</span>`:L.mech==='eevee'?'<span class="d" style="color:var(--fg)">스킬은 진화형마다 달라요</span>':'';})()}</button>`;}).join('');
  const supRow=sups.length?`<div class="sups"><span>출발 지원</span>${sups.map(k=>`<button class="supc" data-sp="${k}" aria-pressed="false">${SUPPORTS[k].n}</button>`).join('')}</div>`:'';
  const modeTag={adv:opt.rank?`랭크 ${opt.rank}`:'',endless:'끝없는 모드',raid:'전설 레이드',rule:'규칙 도전'}[opt.mode]||'';
  showModal(`<div class="scr-head">${backBtn}<h2>${R.n} · 덱 고르기${modeTag?` <small class="mtag">${modeTag}</small>`:''}</h2><button class="ibtn" id="dGuide" aria-label="규칙과 도감"><svg viewBox="0 0 24 24"><circle cx="12" cy="6.5" r="2"/><rect x="10.2" y="10" width="3.6" height="9" rx="1.2"/></svg></button></div>
   ${supRow}<div class="tabs"><button class="tab" data-tab="tr" aria-pressed="${tab==='tr'}">트레이너 덱</button><button class="tab" data-tab="cu" aria-pressed="${tab==='cu'}">직접 고르기</button></div>
   <div class="scr-body" id="dBody"></div>
   <div class="scr-foot" id="dFoot"></div>`);
  const sh=$('sheet');
  sh.querySelector('[data-back]').onclick=()=>opt.mode==='raid'?showModes():showRegions(opt);$('dGuide').onclick=showGuide;
  sh.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{sup=sup===b.dataset.sp?null:b.dataset.sp;sh.querySelectorAll('[data-sp]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.sp===sup));});
  const go=(deck,T)=>newGame(deck,T,R,Object.assign({},opt,{support:sup}));
  const render=t=>{tab=t;sh.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.tab===t));
    if(t==='tr'){$('dBody').innerHTML=`<p class="sub">트레이너 덱은 구성이 정해진 대신 고유 효과가 있어요. 덱의 첫 포켓몬이 파트너가 돼요. 누르면 바로 시작해요.</p><div class="grid2">${trCards}</div>`;$('dFoot').innerHTML='';
      $('dBody').querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const T=TRAINERS[+b.dataset.t];if(trUnlocked(T))go(T.lines.map(LIDX),T);});}
    else{$('dBody').innerHTML=`<p class="sub">10계열 중 5계열을 고르세요. 이번 판 소환은 고른 계열에서만 나오고, 처음 고른 계열이 파트너가 돼요.</p><div class="grid2">${cuCards}</div>`;
      $('dFoot').innerHTML=`<button class="gbtn" id="dRand">무작위 5개</button><button class="gbtn summon" id="dGo" disabled>0/5 시작</button>`;
      const sync=()=>{$('dBody').querySelectorAll('[data-l]').forEach(b=>b.setAttribute('aria-pressed',chosen.has(+b.dataset.l)));$('dGo').disabled=chosen.size!==5;$('dGo').textContent=`${chosen.size}/5 시작`;};
      $('dBody').querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const i=+b.dataset.l;if(chosen.has(i))chosen.delete(i);else if(chosen.size<5)chosen.add(i);sync();});
      $('dRand').onclick=()=>{chosen.clear();shuffle([...pool]).slice(0,5).forEach(i=>chosen.add(i));sync();};
      $('dGo').onclick=()=>go([...chosen],null);sync();}
    $('dBody').scrollTop=0;};
  sh.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>render(b.dataset.tab));
  render(tab);
}
function finish(win,reason){if(state.mode==='tut')return tutDone(win);
  state.phase='over';state.sel=-1;renderPanel();closeLayer();clearRun();hideTip();
  const id=REGION.id,reached=win?MAXW:state.wave,adv=state.mode==='adv',first=adv&&win&&!PROG.clear[id];achNew=[];
  if(adv){PROG.best[id]=Math.max(reached,PROG.best[id]||0);if(win)PROG.clear[id]=true;PROG.badges[id]=Math.max(PROG.badges[id]||0,state.badges);}saveProg();
  const modeLine=recordRun(win),rec=logEnd(win,reason,reached);
  const best=adv?PROG.best[id]:state.mode==='endless'?PROG.endless[id]:state.mode==='raid'?PROG.raid[weekKey()]:state.mode==='daily'?PROG.daily[state.daily]:state.wave;
  const unlock=(first&&id==='kanto'?'<div class="box"><b>성도 지방과 챔피언로드가 열렸어요</b><span class="sub">성도 계열 8개와 트레이너 골드·크리스·실버도 이제 쓸 수 있어요. 관동 챔피언 랭크 1도 열렸어요.</span></div>':first&&id==='johto'?'<div class="box"><b>호연 지방이 열렸어요</b><span class="sub">호연 계열 3개와 트레이너 이향·휘웅이 열렸어요.</span></div>':first?`<div class="box"><b>${REGION.n} 챔피언 랭크 1이 열렸어요</b></div>`:'')
    +(achNew.length?`<div class="box"><b>업적 달성</b>${achNew.map(a=>`<span class="sub">${a.n}${a.sup?` · 출발 지원 '${SUPPORTS[a.sup].n}' 열림`:''}</span>`).join('')}</div>`:'')
    +(modeLine?`<div class="box"><b>${modeLine}</b></div>`:'');
  const legends=board.filter(u=>u&&u.tier===4).length;
  const top=board.filter(u=>u&&u.dealt).sort((a,b)=>b.dealt-a.dealt).slice(0,5),mx=top.length?top[0].dealt:1;
  const mvp=top.length?`<div class="box"><b>많이 싸운 포켓몬</b><div class="mvp">${top.map(u=>`<div class="row"><span class="face">${sprTag(u.s.id)}</span><span class="nm"><span>${u.s.n}</span><span class="barw"><i style="width:${u.dealt/mx*100}%"></i></span></span><b class="tnum">${fmt(u.dealt)}</b></div>`).join('')}</div></div>`:'';
  let flow='';if(rec&&rec.w.length>=2){const pk=rec.w.reduce((a,x)=>x[3]>a[3]?x:a);
    flow=`<div class="box"><b>웨이브 흐름</b>${logChart(rec)}${!win&&pk[3]>=rec.cap*0.5?`<span class="sub">필드 적이 가장 많이 쌓인 건 ${pk[0]}웨이브(${pk[3]}마리)예요.</span>`:''}</div>`;}
  showModal(`<div class="scr-head"><h2>${win?REGION.winTitle:'패배'}</h2></div>
   <div class="scr-body"><p class="sub">${reason}</p>${unlock}
   <div class="result"><div class="stat"><b class="num">${reached}</b><span>도달 웨이브</span></div>
   <div class="stat"><b class="num">${state.mode==='raid'?Math.max(0,state.badges-3):state.badges}</b><span>${state.mode==='raid'?'레이드 단계':'배지'}</span></div>
   <div class="stat"><b class="num">${best||0}</b><span>최고 기록</span></div></div>${mvp}${flow}
   <div class="box"><div class="badges">${GYMS.map((g,k)=>`<span class="badge ${k<state.badges?'on':''}" style="background:${g.col}"></span>`).join('')}</div>
   <p class="sub">${state.trainer?state.trainer.n+' 덱: ':'덱: '}${state.deck.map((i,k)=>`${LINES[i].n[0]} Lv${state.up[k]}`).join(', ')}${legends?` · 전설 ${legends}마리`:''} · 쓰러뜨린 적 ${state.kills}</p></div></div>
   <div class="scr-foot"><button class="gbtn" id="toTitle">타이틀</button><button class="gbtn summon" id="again">새 판 시작</button></div>`);
  const opt={mode:state.mode,rank:state.rank,rules:state.rules,raidLeg:state.raidLeg};
  $('again').onclick=()=>state.mode==='daily'?showModes():showDraft('tr',REGION,opt);$('toTitle').onclick=showTitle;
}
function misBox(){if(!state.missions)return '';return `<div class="box"><b>미션 <small class="sub">${state.mDone||0}개 완료 · 판마다 6개까지</small></b>${state.missions.length?state.missions.map(m=>{const d=misDef(m),v=Math.min(d.goal,Math.max(0,misVal(m)));return `<div class="mis"><span>${d.n}</span><span class="barw"><i style="width:${v/d.goal*100}%"></i></span><small class="tnum">${v}/${d.goal} · ${MREW[m.rw]}</small></div>`;}).join(''):'<span class="sub">이번 판 미션을 모두 끝냈어요.</span>'}</div>`;}
function partnerBox(){const u=board.find(v=>v&&v.partner);if(!u)return '';const P=u.partner;
  return `<div class="box"><b>파트너 ${def(u).n} Lv${P.lv}</b>${P.lv<10?`<span class="barw"><i style="width:${P.xp/XPN(P.lv)*100}%"></i></span><span class="sub">다음 레벨까지 ${XPN(P.lv)-P.xp} · 쓰러뜨리면 2, 웨이브를 넘기면 8, 관장은 25</span>`:'<span class="sub">최고 레벨이에요.</span>'}
   <span class="sub">${[3,5,7,10].map(l=>`${P.lv>=l?'✓':'·'} Lv${l} ${PERK[l]}`).join('<br>')}</span></div>`;}
function showMissions(){if(!state.missions)return;const wasPaused=state.paused;state.paused=true;syncPause();
  showLayer(`<div class="scr-head">${backBtn}<h2>이번 판 미션</h2></div><div class="scr-body">${misBox()}${partnerBox()}</div>`);
  $('lsheet').querySelector('[data-back]').onclick=()=>{closeLayer();state.paused=wasPaused;syncPause();};}
// 전체 화면: 설치한 앱(이미 전체 화면)이 아니고, 브라우저가 허락할 때만
const canFS=()=>{try{return !!document.fullscreenEnabled&&!matchMedia('(display-mode: fullscreen)').matches;}catch(e){return false;}};
function showMenu(){
  if(!state.deck||!state.deck.length||state.phase==='draft')return showGuide();
  const wasPaused=state.paused;state.paused=true;syncPause();
  const names=state.takenNames||[];let quit=false;
  const tg=(m,on,n,w)=>`<button class="gbtn mtog ${w?'mwide':''} ${on?'on':''}" data-m="${m}" aria-pressed="${on}"><span>${n}</span><i>${on?'켜짐':'꺼짐'}</i></button>`;
  const draw=()=>{showLayer(`<div class="scr-head"><h2>메뉴</h2><button class="ibtn" data-m="resume" aria-label="닫고 계속하기"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="#eef3f1" stroke-width="3" fill="none" stroke-linecap="round"/></svg></button></div>
   <div class="scr-body">
    <div class="mgrp"><h3>게임</h3>
     <button class="gbtn summon mwide" data-m="resume">계속하기</button>
     ${tg('info',state.info,'사거리·단계 표시',1)}${tg('mus',MUS.on,'음악')}${tg('snd',soundOn,'효과음')}${canFS()?tg('fs',!!document.fullscreenElement,'전체 화면',1):''}
     <button class="gbtn mwide ${quit?'danger':''}" data-m="quit">${quit?'한 번 더 누르면 이 판을 끝내요':'이 판 포기하기'}</button></div>
    <div class="mgrp"><h3>기록</h3>
     <button class="gbtn" data-m="guide">규칙과 도감</button>
     <button class="gbtn" data-m="log">내 기록</button></div>
    <h3 class="mhead">이번 판</h3>
    <div class="box"><div class="badges">${GYMS.map((g,k)=>`<span class="badge ${k<state.badges?'on':''}" style="background:${g.col}" title="${g.badge}: ${g.bd}"></span>`).join('')}<span class="sub">배지 ${state.badges||0}/8</span></div>
    ${GYMS.slice(0,state.badges).map(g=>`<span class="sub">${g.badge} · ${g.bd}</span>`).join('')}</div>
    ${state.trainer?`<div class="box"><b>${state.trainer.n} 덱</b><span class="sub">${state.trainer.desc}</span></div>`:''}
    ${misBox()}
    ${partnerBox()}
    <div class="box"><b>가방</b><span class="sub">몬스터볼 ${state.balls||0}개${state.master?` · 마스터볼 ${state.master}개`:''}</span>${state.bag.length?`<div class="taken">${state.bag.map(id=>`<span>${itemIco(id)}${ITEMS[id].n}</span>`).join('')}</div><span class="sub">포켓몬을 누르고 '물건'을 고르면 쥐여 줄 수 있어요.</span>`:'<span class="sub">지닌 물건이 없어요. 미션, 야생 강적, 관장 상점에서 얻어요.</span>'}</div>
    ${state.rules&&state.rules.length?`<div class="box"><b>붙은 규칙</b>${state.rules.map(r=>`<span class="sub">${RULES[r].n}: ${RULES[r].d}</span>`).join('')}</div>`:''}
    ${state.rank?`<div class="box"><b>챔피언 랭크 ${state.rank}</b><span class="sub">${RANKS.slice(1,state.rank+1).map(r=>r.d).join(' · ')}</span></div>`:''}
    ${names.length?`<div class="box"><b>받은 보상</b><div class="taken">${names.map(n=>`<span>${n}</span>`).join('')}</div></div>`:''}
    </div>`);
   $('lsheet').querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const m=b.dataset.m;
     if(m==='resume'){closeLayer();state.paused=wasPaused;syncPause();}
     else if(m==='snd'){soundOn=!soundOn;store.set('pkrtd-snd',soundOn?'1':'0');if(soundOn)sfx('summon');draw();}
     else if(m==='mus'){MUS.on=!MUS.on;store.set('pkrtd-bgm',MUS.on?'1':'0');music();draw();}
     else if(m==='info'){state.info=!state.info;draw();}
     else if(m==='fs'){const p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen({navigationUI:'hide'});Promise.resolve(p).then(draw,()=>{toast('이 화면에서는 전체 화면을 쓸 수 없어요.',2);draw();});}
     else if(m==='guide')showGuide();
     else if(m==='log')showLog(draw);
     else if(m==='quit'){if(quit){closeLayer();state.paused=false;syncPause();finish(false,'이 판을 포기했어요.');}else{quit=true;draw();}}});};
  draw();
}

// ───────── 패널·HUD ─────────
let toastT=0;
function toast(msg,sec=1.4){const t=$('toast');t.textContent=msg;delete t.dataset.off;toastT=Math.max(1.8,sec);}
function inAura(i,j){const v=board[i];if(!v)return false;const rad=Math.min(v.tier,3)>=3?2:1;return Math.max(Math.abs(i%COLS-j%COLS),Math.abs(((i/COLS)|0)-((j/COLS)|0)))<=rad;}
function auraVal(m,t,aw=0){const k=1+0.15*aw;if(m==='auraAll')return `+${Math.round(60*k)}%·+${Math.round(40*k)}%`;const v=AURA[m][t-1]*(m==='auraType'?1:(1+mods.supp)*k);return m==='auraRange'?'+'+v.toFixed(1)+'칸':m==='auraType'?'×'+v:m==='auraCrit'?'+'+Math.round(v*100)+'%':'+'+Math.round(v*100)+'%';}
function renderPanel(){
  const p=$('panel');const i=state.sel;const u=i>=0?board[i]:null;
  if(i!==radialSel){radialSel=i;state.detail=false;}
  renderRadial();
  if(!u||state.phase!=='play'||!state.detail){p.hidden=true;return;}
  p.hidden=false;hideTip();
  const s=u.s,nat=NATURES[u.nat],b=s.buff,aura=isAura(s.mech);
  const stars=u.tier===4?(LEGENDS[u.form].sp?'특수':'전설')+(u.awk?' 각성'+u.awk:''):u.mega?'메가':u.partner?'파트너':u.tier+'단계';
  const lp=u.tier===3?legendPartners(i):null;
  const pc=v=>Math.round(v*100);
  const bonus=[u.partner?['p',`파트너 Lv${u.partner.lv} 공격 +${12*(u.partner.lv-1)}%`]:null,u.mega?['p',aura?`메가 ${u.mega}단계 지원 효과 ×${(1.4+0.15*(u.mega-1)).toFixed(2)}`:`메가 ${u.mega}단계 공격 ×${(1.8+0.4*(u.mega-1)).toFixed(1)}`]:null,u.item?['b',ITEMS[u.item].n+': '+ITEMS[u.item].d]:null,u.awk?['p',aura?`각성 ${u.awk}단계 지원 효과 +${15*u.awk}%`:`각성 ${u.awk}단계 공격 +${25*u.awk}%, 속도 +${10*u.awk}%`]:null,s.pair?['g',`짝꿍 +${10*s.pair}%`]:null,s.wm&&s.wm!==1?[s.wm>1?'g':'r',`날씨 ${s.wm>1?'+':''}${pc(s.wm-1)}%`]:null,s.lv?['g',`강화 Lv${s.lv} 공격 +${30*s.lv}%`]:null,s.syn?['g',`시너지 +${pc(s.syn)}%`]:null,b.aD?['g',`응원 공격 +${pc(b.aD)}%`]:null,b.aR?['g',`응원 속도 +${pc(b.aR)}%`]:null,
    b.aC?['g',`응원 치명 +${pc(b.aC)}%`]:null,b.aG?['g',`응원 사거리 +${b.aG.toFixed(1)}`]:null,s.grow?['g',`성장 +${pc(s.grow)}%`]:null,s.nb?['g','밤 +30%']:null,mods.dmgAll?['',`보상·배지 공격 +${pc(mods.dmgAll)}%`]:null,
    ['',`성격 ${nat.n}: ${nat.d}`]].filter(Boolean);
  const mk=u.tier===1&&s.mech==='eevee'?'eevee':s.mech;
  let match='';
  if(!aura&&state.waveTypes){const ty=state.waveTypes[Math.max(1,state.wave)]||[],m=effU(u,s.t[0],ty);
    match=m>=1.5?`<div class="matchup good">지금 웨이브(${ty.join('·')})에 효과가 굉장해요 ×${m.toFixed(1)}</div>`:m<1?`<div class="matchup bad">지금 웨이브(${ty.join('·')})에는 잘 안 들어가요 ×${m.toFixed(2)}</div>`:`<div class="matchup mid">지금 웨이브(${ty.join('·')})에 보통으로 들어가요</div>`;}
  const sk=skillOf(u);
  const skTxt=!sk?(u.tier<2&&LINES[u.line].mech!=='ditto'?`<p class="nat">2단계로 진화하면 고유 스킬을 써요.</p>`:''):
    `<div class="skill"><b>고유 스킬 · ${sk.n}</b> <span style="color:var(--ink-2);font-size:12px">${aura?`${((u.tier>=3?5:7)/(1+mods.skill)).toFixed(1)}초마다`:sk.cd?`${skillCd(u,sk).toFixed(1)}초마다`:`공격마다 ${Math.round(skillChance(u)*100)}%`}</span><br>${sk.d}</div>`;
  p.innerHTML=`<div class="ph"><div class="face">${sprTag(s.id)}</div><div class="who"><h3>${s.n} <span class="tier t${u.tier}">${stars}</span></h3>
   <div class="chips" style="margin-top:5px">${roleTag(s.role)}${s.t.map(chip).join('')}</div></div><button class="dbtn x" data-a="close">닫기</button></div>
   ${aura?`<div class="stats"><div class="stat"><b>${['','1칸','1칸','2칸'][Math.min(u.tier,3)]}</b><span>범위</span></div><div class="stat"><b>${auraVal(s.mech,Math.min(u.tier,3),u.awk||0)}</b><span>효과</span></div><div class="stat"><b>${board.filter((v,j)=>v&&j!==i&&inAura(i,j)).length}</b><span>받는 아군</span></div><div class="stat"><b>×${(1+mods.supp).toFixed(1)}</b><span>응원단</span></div></div>`:
   `<div class="stats"><div class="stat"><b>${fmt(s.dmg)}</b><span>공격</span></div><div class="stat"><b>${s.rate.toFixed(2)}</b><span>초당 공격</span></div>
   <div class="stat"><b>${s.range.toFixed(1)}</b><span>사거리(칸)</span></div><div class="stat"><b>${Math.round(s.crit*100)}%</b><span>치명타</span></div></div>`}
   ${match}
   <div class="bonus">${bonus.map(([c,t])=>`<span class="${c}">${t}</span>`).join('')}</div>
   <p class="mech">${MECH[mk]||'일반 공격.'}</p>${skTxt}
   ${u.tier===4&&LEGENDS[u.form].pd?`<p class="mech">필드에 있으면: ${LEGENDS[u.form].pd}</p>`:''}
   ${(()=>{const h=comboHint(u);if(!h)return '';const r=comboFor(i),L=LEGENDS[h.to],ok=PROG.dex.o[L.id];return `<p class="nat">특수 조합 ${h.hint}${r?': 지금 할 수 있어요':': '+(h.need[0]==='eevee3'?'서로 다른 이브이 진화형 셋':h.need.join(' + '))}${ok?' → '+L.n:''}</p>`;})()}
   ${u.dealt?`<p class="nat">이번 판에 준 피해 ${fmt(u.dealt)}</p>`:''}
   <div class="actions">${u.partner?'':`<button class="dbtn" data-a="sell">팔기 +${REFUND[u.tier]*(u.mega?2:1)}</button>`}
   ${canAwk(u)?`<button class="dbtn gold" data-a="awk" ${state.coins<awkCost(u)?'disabled':''}>각성 ${(u.awk||0)+1}단계 · ${awkCost(u)}</button>`:''}
   ${u.tier===3&&!u.partner&&!u.mega?`<button class="dbtn gold" data-a="fuse" ${lp?'':'disabled'}>${lp?`전설 합체 → ${LEGENDS[legendFor(u)].n}`:`전설 합체 → ${LEGENDS[legendFor(u)].n}: 3단계 2마리 더 필요`}</button>`:''}</div>`;
}
$('panel').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,i=state.sel;
  if(a==='sell')sell(i);else if(a==='fuse')fuse(i);else if(a==='awk')awaken(i);else{state.detail=false;state.sel=-1;renderPanel();}});
function renderUps(){
  if(!state.deck||!state.deck.length){$('ups').innerHTML='';return;}
  $('ups').innerHTML=state.deck.map((li,k)=>{const L=LINES[li],lv=state.up[k],c=upCost(k),max=lv>=MAXLV;
    return `<button class="up ${max?'max':state.coins<c?'poor':'ready'}" data-u="${k}" aria-label="${L.n[0]} 계열 강화, 길게 누르면 효과 보기"><span class="ic">${sprTag(L.id[0])}</span><span class="lv">Lv${lv}</span><span class="c">${max?'최대':c}</span><span class="pb"><i style="width:${lv/MAXLV*100}%"></i></span></button>`;}).join('');
}
// 강화 칸: 누르면 강화, 길게 누르면 효과 미리보기
let upHold=null,upHeld=false;
$('ups').addEventListener('pointerdown',e=>{const b=e.target.closest('[data-u]');if(!b)return;upHeld=false;clearTimeout(upHold);upHold=setTimeout(()=>{upHeld=true;showUpTip(+b.dataset.u);},380);});
['pointerup','pointerleave','pointercancel'].forEach(t=>$('ups').addEventListener(t,()=>clearTimeout(upHold)));
$('ups').addEventListener('contextmenu',e=>e.preventDefault());
$('ups').addEventListener('click',e=>{const b=e.target.closest('[data-u]');if(!b)return;if(upHeld){upHeld=false;return;}upgrade(+b.dataset.u);});
function showUpTip(k){
  const li=state.deck[k],L=LINES[li],lv=state.up[k],max=lv>=MAXLV,c=upCost(k);
  const mine=board.filter(u=>u&&u.line===li),leg=mine.filter(u=>u.tier===4).length;
  // 다음 소환비는 남기고, 그 안에서 연달아 올릴 수 있는 만큼
  const bulk={n:0,c:0};{const keep=board.some((v,j)=>!v&&OPEN[j])?cost():0;let l=lv;while(l<MAXLV){const cc=Math.round((15+10*l)*mods.upCost);if(bulk.c+cc>state.coins-keep)break;bulk.c+=cc;bulk.n++;l++;}}
  const t=$('tip');t.hidden=false;
  t.innerHTML=`<h4><span class="face">${sprTag(L.id[0])}</span>${L.n[0]} 계열 강화 <span class="tier">Lv${lv}${max?'':' → '+(lv+1)}</span></h4>
   <div class="rows"><span>공격</span><b>+${30*lv}%</b><b class="up2">${max?'':'→ +'+30*(lv+1)+'%'}</b>
   <span>공격 속도</span><b>+${6*lv}%</b><b class="up2">${max?'':'→ +'+6*(lv+1)+'%'}</b></div>
   <p>필드의 ${L.n[0]} 계열 ${mine.length}마리${leg?`(전설 ${leg}마리 포함)`:''}에 바로 적용돼요. 앞으로 소환하거나 진화하는 같은 계열도 똑같이 받아요.</p>
   <div class="actions"><button class="dbtn blue" data-t="go" ${max||state.coins<c?'disabled':''}>${max?'최대 레벨':`강화 · ${c}`}</button>${bulk.n>1?`<button class="dbtn gold" data-t="all">${bulk.n}번 강화 · ${bulk.c}</button>`:''}<button class="dbtn x" data-t="x">닫기</button></div>`;
  t.onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;const g=b.dataset.t;if(g==='go'){upgrade(k);showUpTip(k);}else if(g==='all'){for(let q=0;q<bulk.n;q++)upgrade(k);showUpTip(k);}else hideTip();};
}
function hideTip(){$('tip').hidden=true;}
// 시너지 줄: 켜진 시너지와 한 마리만 더 있으면 켜지는 것만 보여 주고, 없으면 줄을 접는다
function renderSyn(){
  const ks=Object.keys(synCount).filter(t=>synCount[t]>=synTh(t)[0]-1).sort((a,b)=>synCount[b]-synCount[a]);
  $('syn').hidden=!ks.length;
  $('syn').innerHTML=ks.map(t=>{const c=synCount[t],[th1,th2]=synTh(t);
    return `<span class="s ${c>=th2?'on2':c>=th1?'on':''}" title="${t}: ${th1}마리 +20%, ${th2}마리 +45%">${ti(t)}${c}/${c>=th1?th2:th1}</span>`;}).join('');
}
let lastCoins=-1,hudWave=-1;
let hudKey='';
// 화면 위에 뜨는 요소들의 자리: 판 위치에 맞춰 둔다
function placeOverlays(){
  const dockH=$('dockbar').offsetHeight;
  const hb=$('hud').offsetTop+$('hud').offsetHeight;
  $('tip').style.bottom=(dockH+52)+'px';$('intro').style.bottom=(dockH+52)+'px';
  {const sub=document.querySelector('.hud-row.sub');$('bossbar').style.top=(sub?sub.offsetTop+$('hud').offsetTop-4:G.oy+6)+'px';}
  hudKey='';
}
function hud(){
  if(!state.waveTypes)return;
  $('wave').innerHTML=`<small>${state.mode==='raid'&&state.wave>RAID_FROM?'레이드':'웨이브'}</small><b>${state.mode==='raid'&&state.wave>RAID_FROM?state.wave-RAID_FROM:state.wave}<span style="font-size:14px;color:#a9b8e0">/${MAXW>=999?'∞':MAXW}</span></b>`;
  {const nb=(state.balls||0)+(state.master||0),cc=catchable().length;$('catch').hidden=!featOn('catch');$('luck').hidden=!featOn('luck');$('catch').classList.toggle('ready',nb>0&&cc>0&&state.phase==='play');$('ballN').textContent=state.master?`${state.balls||0}+${state.master}`:(state.balls||0);}
  {const e=$('early');if(featOn('early')&&canEarly()){const was=e.hidden;e.hidden=false;e.innerHTML=`일찍<b>+${earlyBonus()}</b>`;if(was)placeEarly();}else e.hidden=true;}
  {const wb=$('wildBtn'),on=state.wild&&!state.wild.dead;wb.hidden=!featOn('wild')||!(state.phase==='play'&&(canWild()||on));
   const k=on?'on'+state.wild.sid+Math.ceil(state.wild.wT):'off';if(wb.dataset.k!==k){wb.dataset.k=k;wb.classList.toggle('on',!!on);wb.innerHTML=on?`<span class="face">${sprTag(state.wild.sid)}</span><b>${Math.ceil(state.wild.wT)}</b>`:'<span class="wic">!</span><small>야생</small>';}}
  {const mc=$('mchip');mc.hidden=!featOn('missions')||!state.missions;if(!mc.hidden){const ms=state.missions.filter(m=>!m.done);const best=ms.length?Math.max(...ms.map(m=>Math.min(1,misVal(m)/misDef(m).goal))):1;
   const k=(state.mDone||0)+'-'+Math.round(best*20);if(mc.dataset.k!==k){mc.dataset.k=k;mc.innerHTML=`<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2.5" fill="#fff"/><rect x="8.5" y="2.5" width="7" height="4" rx="1.5" fill="#ffd84a"/><path d="M8 11l2 2 4-4M8 17h8" stroke="#2f6fd6" stroke-width="2" fill="none" stroke-linecap="round"/></svg><b>${state.mDone||0}</b><i style="width:${best*100}%"></i>`;}}}
  {const gw=!!gymAt(state.wave),fr=Math.max(0,Math.min(1,state.waveT/state.waveLen));
   // 관장 웨이브는 남은 시간, 그 밖에는 다음 관장까지 다섯 웨이브 중 어디쯤인지
   $('tbar').style.width=(gw?fr:(((state.wave-1)%5)+(1-fr))/5)*100+'%';$('tline').classList.toggle('gym',gw);}
  $('tsec').textContent=Math.max(0,Math.ceil(state.waveT))+'초';
  const coins=Math.floor(state.coins);$('coins').textContent=coins.toLocaleString('en-US');
  const cap=fieldCap(),n=enemies.length,r=n/cap;
  $('fcount').innerHTML=`${n}<i>/${cap}</i>`;$('fbar').style.width=Math.min(1,r)*100+'%';
  $('fbarw').className='gauge'+(r>0.8?' hot':r>0.55?' warn':'');$('foes').classList.toggle('hot',r>0.8);
  const c=cost();$('cost').textContent=c;
  $('summon').classList.toggle('off',state.phase!=='play'||state.coins<c||!board.some((v,i)=>!v&&OPEN[i])||state.luckOnly||state.conveyor);
  if(state.conveyor)$('cost').textContent=Math.ceil(Math.max(0,state.conv))+'초';
  const bb=$('bossbar'),bo=state.boss;
  $('hud').classList.toggle('bossing',!!(bo&&!bo.dead&&state.phase==='play'&&!state.cut));
  if(bo&&!bo.dead&&state.phase==='play'&&!state.cut){const g=gymAt(state.wave);bb.hidden=false;{const nm=g.raid?`전설 ${g.n} ${g.raid}단계`:`${g.lead}의 ${g.n}`;if(bb.dataset.k!==nm){bb.dataset.k=nm;$('bbn').innerHTML=(g.t||[]).map(ti).join('')+nm;}}$('bbh').style.width=Math.max(0,bo.hp/bo.max)*100+'%';$('bbh').style.background=hpCol(bo.hp/bo.max);$('bbt').textContent=(GIM_N[bo.gim]&&bo.gT<3?`${GIM_N[bo.gim]} ${Math.max(0,bo.gT).toFixed(1)} · `:'')+Math.max(0,Math.ceil(state.waveT))+'초';}else bb.hidden=true;
  if(coins!==lastCoins){lastCoins=coins;document.querySelectorAll('#ups [data-u]').forEach(b=>{const k=+b.dataset.u,mx=state.up[k]>=MAXLV,ok=!mx&&state.coins>=upCost(k);b.classList.toggle('poor',!mx&&!ok);b.classList.toggle('ready',ok);});
    if(state.deck&&state.phase==='play'&&state.wave>=2&&state.deck.some((l,k)=>state.coins>=upCost(k)+cost()))tip('up','아래 강화 칸을 누르면 그 계열 전체가 세져요. 길게 누르면 효과를 보고 한꺼번에 올릴 수도 있어요.',3.6);
    if(state.phase==='play'&&state.wave>=AWK_FROM&&board.some(u=>canAwk(u)&&state.coins>=awkCost(u)))tip('awk','이제 전설 포켓몬을 눌러 코인으로 각성시킬 수 있어요. 3단계까지 올라가요.',3.6);}
  const key=state.wave+'|'+state.badges+'|'+state.phase+'|'+board.map(u=>u?u.line*10+u.tier:'').join(',');
  if(hudKey===key)return;hudKey=key;hudWave=state.wave;
  // 길 입구 깃발: 다음 웨이브
  const w=state.wave,nw=Math.min(MAXW,w+1),en=$('entry');
  if(state.phase==='play'&&w<MAXW){const t=state.waveTypes[nw],g=gymAt(nw),wm=wmodAt(nw),ty=g?g.t:t;
    const atk=board.filter(u=>u&&u.s&&!isAura(u.s.mech)),weak=atk.length>=3?atk.filter(u=>effU(u,u.s.t[0],ty)<1).length:0,bad=weak/Math.max(1,atk.length)>=0.5;
    en.hidden=false;en.className='entry'+(bad?' bad':'');en.dataset.w=nw;en.dataset.weak=weak;
    en.innerHTML=`<span class="el">${bad?'불리':'다음'}</span>${g?`<span class="gymchip-face" style="width:24px;height:24px;border-radius:50%;background:#fff;display:inline-block">${sprTag(g.id)}</span>`:''}${ty.map(ti).join('')}${isNight(nw)?'<span class="nt">밤</span>':''}${wm?`<span class="nt" style="background:${wm.col};color:#14110b">${wm.n}</span>`:''}`;
    const [px,py]=G.pts[0];en.style.left=Math.max(6,px-G.lw*0.5)+'px';en.style.top=(toSY(py)-G.lw*0.45)+'px';
    placeEarly();}
  else en.hidden=true;
  const nx=nextGym(),gl=$('pgym');
  if(nx&&state.phase!=='draft'){gl.hidden=false;gl.innerHTML=`${sprTag(nx.g.id)}<b>${nx.w-w<=0?'지금':nx.w-w}</b>`;}
  else gl.hidden=true;
}
$('entry').addEventListener('click',()=>{const en=$('entry'),ww=+en.dataset.w,t=state.waveTypes[ww],g=gymAt(ww),wm=wmodAt(ww),weak=+en.dataset.weak;
  toast(`${ww}웨이브: ${g?`관장 ${g.lead}의 ${g.n}(${g.t.join('·')})`:t.join('·')+' 타입'}${wm?' · '+wm.n:''}${isNight(ww)?' · 밤':''}${weak?`. 내 공격 포켓몬 중 ${weak}마리의 공격이 잘 안 들어가요.`:'.'}`,2.6);});
$('prog').addEventListener('click',()=>{const nx=nextGym();if(!nx)return;const g=nx.g;toast(`${nx.w}웨이브 ${g.raid?'전설 레이드 '+g.n:g.lead+'의 '+g.n}(${g.t.join('·')}): ${g.desc}${g.raid?'':` 이기면 ${g.badge}(${g.bd}).`}`,3.4);});
$('early').addEventListener('click',callEarly);
function placeEarly(){const en=$('entry'),ea=$('early');if(en.hidden||ea.hidden)return;
  const L=en.offsetLeft,T=en.offsetTop,w=en.offsetWidth,ew=ea.offsetWidth||64;
  const eh=ea.offsetHeight||24,h=en.offsetHeight;
  // .entry는 translate(-8px,-100%)로 그려지므로 보이는 위치는 (L-8, T-h)
  if(L+w+6+ew<=G.W-6){ea.style.left=(L+w+6)+'px';ea.style.top=(T-h+(h-eh)/2)+'px';}else{ea.style.left=L+'px';ea.style.top=(T+G.lw*0.7)+'px';}}
$('wildBtn').addEventListener('click',()=>{if(state.wild&&!state.wild.dead)return toast(`야생 ${state.wild.name}: ${Math.ceil(state.wild.wT)}초 안에 쓰러뜨려요. 체력이 25% 아래면 잡을 수도 있어요.`,2.2);callWild();});
$('mchip').addEventListener('click',showMissions);
// 포켓몬을 누르면 둘레에 정보·팔기·합체
let radialSel=-1;
function renderRadial(){
  const r=$('radial'),i=state.sel,u=i>=0?board[i]:null;
  if(!u||state.phase!=='play'||state.detail){r.hidden=true;return;}
  const c=cellCenter(i),lp=u.tier===3?legendPartners(i):null;
  const items=[['info','<svg viewBox="0 0 24 24"><circle cx="12" cy="6.5" r="2.2"/><rect x="10" y="10" width="4" height="9.5" rx="1.4"/></svg>정보']];
  if(!u.partner&&!state.noSell)items.push(['sell',`팔기<b>+${REFUND[u.tier]*(u.mega?2:1)}</b>`]);
  if(state.bag.length||u.item)items.push(['item',`물건<b>${u.item?'교체':state.bag.length}</b>`]);
  const cb=comboFor(i);
  if(cb)items.push(['combo','특수<b>조합</b>']);
  else if(canMega(u))items.push(['mega','메가<b>진화</b>']);
  else if(u.mega&&megaFood(i)>=0)items.push(['feed','메가<b>먹이기</b>']);
  else if(u.tier===3&&!u.partner&&!u.mega)items.push(['fuse',`전설<b>${lp?'합체':'2마리 더'}</b>`]);
  if(canAwk(u)&&items.length<4)items.push(['awk',`각성<b>${awkCost(u)}</b>`]);
  const R=G.cell*1.0,ANG={1:[-90],2:[-145,-35],3:[-165,-90,-15],4:[-180,-120,-60,0]},ang=ANG[items.length];
  // 판 위쪽이면 버튼을 아래로 펼치고, 화면 밖으로 나가지 않게 옆으로 민다
  const cy=toSY(c.y)-G.cell*0.35,hb=$('hud').offsetTop+$('hud').offsetHeight,down=cy-R-30<hb+8,A=ang.map(v=>down?-v:v);
  const xs=A.map(v=>c.x+Math.cos(v*Math.PI/180)*R),dx=Math.max(0,32-Math.min(...xs))-Math.max(0,Math.max(...xs)-(G.W-32));
  r.hidden=false;r.style.left=(c.x+dx)+'px';r.style.top=(down?cy+G.cell*0.5:cy)+'px';
  r.innerHTML=items.map(([k,h],j)=>{const a=A[j]*Math.PI/180;return `<button data-r="${k}" class="${k==='fuse'||k==='awk'?'gold':k==='combo'||k==='mega'||k==='feed'?'pink':''}" ${k==='fuse'&&!lp?'disabled':''} style="left:${Math.cos(a)*R}px;top:${Math.sin(a)*R}px">${h}</button>`;}).join('');
}
$('radial').addEventListener('click',e=>{const b=e.target.closest('[data-r]');if(!b)return;const k=b.dataset.r,i=state.sel;
  if(k==='info'){state.detail=true;renderPanel();renderRadial();}else if(k==='sell')sell(i);else if(k==='fuse')fuse(i);else if(k==='awk'){awaken(i);renderRadial();}
  else if(k==='combo'){doCombo(i);state.sel=-1;renderPanel();}else if(k==='mega'){megaEvolve(i);renderPanel();}else if(k==='feed'){megaFeed(i);renderPanel();}else if(k==='item')showItems(i);});
// 물건 쥐여 주기
function showItems(i){const u=board[i];if(!u)return;const t=$('tip');t.hidden=false;
  t.innerHTML=`<h4><span class="face">${sprTag(def(u).id)}</span>${def(u).n}에게 쥐여 줄 물건</h4>
   ${u.item?`<p class="inm">${itemIco(u.item)}지금 쥔 물건: <b>${ITEMS[u.item].n}</b> · ${ITEMS[u.item].d}</p>`:''}
   <div class="bag">${state.bag.map((id,k)=>`<button class="dbtn ${id==='stone'?'gold':''}" data-k="${k}" ${id==='stone'&&!canHoldStone(u)?'disabled':''}><span class="inm">${itemIco(id)}${ITEMS[id].n}</span><small>${ITEMS[id].d}</small></button>`).join('')||'<p>가방이 비었어요.</p>'}</div>
   <div class="actions">${u.item&&!u.mega?'<button class="dbtn" data-k="off">내려놓기</button>':''}<button class="dbtn x" data-k="x">닫기</button></div>`;
  t.onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k;if(k==='x')return hideTip();if(k==='off'){unequip(i);return showItems(i);}equip(i,+k);hideTip();renderRadial();};}
// 운 뽑기
function showLuck(){if(state.phase!=='play')return;const t=$('tip');t.hidden=false;
  const c2=luckCost(2),c3=luckCost(3);
  t.innerHTML=`<h4>운 뽑기</h4><p>코인을 더 내고 높은 단계를 노려요. 실패하면 아무것도 나오지 않아요.${state.luckOnly?' 운명의 날 규칙으로 비용이 절반이에요.':''}</p>
   <div class="bag"><button class="dbtn blue" data-k="2" ${state.coins<c2?'disabled':''}>2단계 뽑기 · ${c2}<small>성공 55%</small></button><button class="dbtn gold" data-k="3" ${state.coins<c3?'disabled':''}>3단계 뽑기 · ${c3}<small>성공 35%</small></button></div>
   <div class="actions"><button class="dbtn x" data-k="x">닫기</button></div>`;
  t.onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k;if(k==='x')return hideTip();luckRoll(+k);showLuck();};}
const PAUSE_SVG='<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
const PLAY_SVG='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
function syncPause(){const p=$('pause');if(!p)return;p.innerHTML=state.paused?PLAY_SVG:PAUSE_SVG;p.setAttribute('aria-label',state.paused?'계속':'멈춤');}


'use strict';
// ───────── 행동 ─────────
const cost=()=>Math.round(Math.min(90,20+2*state.summons)*mods.costMult);
const upCost=k=>Math.round((15+10*state.up[k])*mods.upCost);
function summon(){
  if(state.phase!=='play')return;
  const empty=board.map((v,i)=>v||!OPEN[i]?-1:i).filter(i=>i>=0);
  if(!empty.length)return toast('빈 칸이 없어요. 같은 포켓몬끼리 겹쳐 진화시키거나 팔아서 자리를 만드세요.',2.2);
  const c=cost();if(state.coins<c)return toast(`코인이 ${Math.ceil(c-state.coins)} 모자라요. 적을 쓰러뜨리면 모여요.`,1.6);
  state.coins-=c;state.summons++;
  const wts=state.deck.map(l=>mods.weight[l]||1),tot=wts.reduce((a,b)=>a+b,0);let rr=Math.random()*tot,line=state.deck[0];for(let q=0;q<wts.length;q++){rr-=wts[q];if(rr<=0){line=state.deck[q];break;}}
  const ditto=LINES[line].mech==='ditto',egg=!ditto&&Math.random()<mods.egg;
  const u={line,tier:egg?2:1,nat:rnd(NATURES.length),form:0,cd:0.7,grow:0,born:0,ball:{t:0.42,T:0.42}};
  if(egg&&LINES[line].mech==='eevee')u.form=rnd(EEVEE.length);
  const i=pick(empty);board[i]=u;sfx('summon');tip('merge','같은 포켓몬 두 마리를 끌어서 겹치면 다음 단계로 진화해요.');
  if(egg)toast(`행운의 알: ${def(u).n}`,1.2);
  recalc();
}
function upgrade(k){
  if(state.phase!=='play'&&state.phase!=='reward')return;
  if(state.up[k]>=MAXLV)return toast('이미 최대 레벨이에요.',1);const c=upCost(k);if(state.coins<c)return toast(`코인이 ${Math.ceil(c-state.coins)} 모자라요.`,1.2);
  state.coins-=c;state.up[k]++;sfx('buy');recalc();
  const L=LINES[state.deck[k]],lv=state.up[k];let n=0;
  for(let i=0;i<N;i++){const u=board[i];if(!u||u.line!==state.deck[k])continue;n++;const c2=cellCenter(i);
    fx.push({k:'ring',x:c2.x,y:c2.y,r:G.cell*0.5,col:'#ffd84a',t:.5,T:.5});fx.push({k:'txt',x:c2.x,y:c2.y-G.cell*0.55,s:'공격 ▲',col:'#ffe14d',t:.8,T:.8});}
  toast(`${L.n[0]} 계열 Lv${lv}: 공격 +${30*lv}%, 공격 속도 +${6*lv}%${n?` · 필드 ${n}마리에 적용`:''}`,1.6);
  const el=document.querySelector(`#ups [data-u="${k}"]`);if(el){el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');}
}
// 처음 한 번만 뜨는 안내
let TIPS={};try{TIPS=JSON.parse(store.get('pkrtd-tips')||'{}');}catch(e){}
function tip(id,msg,sec=3.2){if(TIPS[id])return;TIPS[id]=1;store.set('pkrtd-tips',JSON.stringify(TIPS));setTimeout(()=>toast(msg,sec),400);}
function act(a,b){
  const ua=board[a],ub=board[b];if(!ua||a===b)return;
  if(!ub){board[b]=ua;board[a]=null;}
  else if(canMerge(ua,ub)){
    let keep=ub;if(isDitto(ub)){keep=ua;}
    const oldId=def(keep).id;
    const evee=LINES[keep.line].mech==='eevee'&&keep.tier===1;
    keep.tier++;if(evee)keep.form=rnd(EEVEE.length);
    if(!isDitto(ua)&&!isDitto(ub))keep.grow=(ua.grow||0)+(ub.grow||0);
    board[a]=null;board[b]=keep;keep.cd=0.2;keep.evo={t:0.8,T:0.8,from:oldId};sfx('evo');
    const c=cellCenter(b);fx.push({k:'ring',x:c.x,y:c.y,r:G.cell*0.7,col:'#ffffff',t:.4,T:.4});
    if(evee)toast(`이브이가 ${josa(EEVEE[keep.form].n,'으로')} 진화`,1.4);
  } else {board[a]=ub;board[b]=ua;}
  recalc();
}
function legendPartners(i){
  const u=board[i];if(!u||u.tier!==3)return null;
  const seen=new Set([keyOf(u)]),out=[];
  const c=board.map((v,j)=>({v,j})).filter(o=>o.v&&o.j!==i&&o.v.tier===3).sort((p,q)=>p.v.s.dmg*p.v.s.rate-q.v.s.dmg*q.v.s.rate);
  for(const o of c){const k=keyOf(o.v);if(seen.has(k))continue;seen.add(k);out.push(o.j);if(out.length===2)break;}
  return out.length===2?out:null;
}
function fuse(i){
  const p=legendPartners(i);if(!p)return;
  const u=board[i],cc0=cellCenter(i),oldId=def(u).id;for(const j of p){const q=cellCenter(j);fx.push({k:'absorb',x1:q.x,y1:q.y,x2:cc0.x,y2:cc0.y,t:.6,T:.6});board[j]=null;}u.form=legendFor(u);u.tier=4;u.evo={t:1.1,T:1.1,from:oldId};shake=7;sfx('legend');u.cd=0.3;u.pop=0.35;
  const c=cellCenter(i);fx.push({k:'ring',x:c.x,y:c.y,r:G.cell*1.2,col:'#f2c14e',t:.6,T:.6});
  toast(`전설 합체: ${LEGENDS[u.form].n}`,1.8);recalc();camP=camT=0.9;cutCD=0;cutin={id:LEGENDS[u.form].id,n:LEGENDS[u.form].n,sk:'전설 합체',col:'#ffd257',t:1.1,T:1.1,leg:true};cutCD=5;
}
function sell(i){const u=board[i];if(!u)return;state.coins+=REFUND[u.tier];board[i]=null;state.sel=-1;recalc();}

// ───────── 기록과 이어하기 ─────────
// 지방별 최고 기록·배지·정복 여부는 PROG, 진행 중인 판은 웨이브가 시작될 때마다 SAVE_KEY에 남긴다
const SAVE_KEY='pkrtd-run1',PROG_KEY='pkrtd-prog';
function loadProg(){let p=null;try{p=JSON.parse(store.get(PROG_KEY)||'null');}catch(e){}
  if(!p){p={};const old=+(store.get('pkrtd-best2')||0);if(old)p={best:{kanto:old},clear:old>=MAXW?{kanto:true}:{}};}
  p.clear=p.clear||{};p.best=p.best||{};p.badges=p.badges||{};return p;}
let PROG=loadProg();
const saveProg=()=>store.set(PROG_KEY,JSON.stringify(PROG));
function noteBadge(){const id=REGION.id;PROG.badges[id]=Math.max(PROG.badges[id]||0,state.badges);saveProg();}
const trUnlocked=T=>!T.need||(T.need==='kanto'?!!PROG.clear.kanto:T.need==='johto4'?(PROG.badges.johto||0)>=4:T.need==='johto'?!!PROG.clear.johto:false);
const regionOpen=R=>!R.soon&&(R.id==='kanto'||(R.id==='johto'&&!!PROG.clear.kanto));
const lineOpen=L=>!L.rg||!!PROG.clear.kanto;
function saveRun(extra){
  if(!state.deck||!state.deck.length||state.phase==='over')return;
  const U=u=>u&&{line:u.line,tier:u.tier,nat:u.nat,form:u.form,grow:u.grow||0,ss:u.ss||0,cnt:u.cnt||0};
  const E=e=>({t:e.t,name:e.name,sid:e.sid,hp:e.hp,max:e.max,sp:e.sp,p:e.p,big:e.big,fast:e.fast});
  store.set(SAVE_KEY,JSON.stringify(Object.assign({v:2,region:state.region,deck:state.deck,up:state.up,coins:state.coins,wave:state.wave,waveTypes:state.waveTypes,wmods:state.wmods,
    taken:state.taken,takenNames:state.takenNames,badges:state.badges,kills:state.kills,summons:state.summons,trIdx:state.trainer?state.trIdx:-1,speed:state.speed,mods,
    board:board.map(U),enemies:enemies.filter(e=>!e.dead&&!e.boss).map(E)},extra||{})));
}
function loadRun(){try{const s=JSON.parse(store.get(SAVE_KEY)||'null');return s&&s.v===2&&s.deck?s:null;}catch(e){return null;}}
const clearRun=()=>store.set(SAVE_KEY,'');
function resumeRun(s){
  const R=REGIONS.find(r=>r.id===s.region)||REGIONS[0];setRegion(R);layout();
  mods=Object.assign(freshMods(),s.mods);
  state={info:state.info,phase:'play',deck:s.deck,up:s.up,coins:s.coins,wave:s.wave,waveT:0,waveLen:20,spawnLeft:0,spawnT:0,spawnGap:1,summons:s.summons,speed:s.speed||1,paused:false,
    region:R.id,waveTypes:s.waveTypes,wmods:s.wmods,boss:null,bossDown:false,taken:s.taken,takenNames:s.takenNames,badges:s.badges,kills:s.kills,sel:-1,eid:0};
  if(s.trIdx>=0&&TRAINERS[s.trIdx]){state.trainer=TRAINERS[s.trIdx];state.trIdx=s.trIdx;}
  $('speed').textContent=state.speed+'×';
  board=Array(N).fill(null);s.board.forEach((u,i)=>{if(u&&i<N&&OPEN[i])board[i]=Object.assign({cd:0.5,born:0},u);});
  enemies=[];fx=[];projs=[];zones=[];for(const e of s.enemies)mkEnemy(Object.assign({},e));
  hudWave=-1;recalc();closeModal();closeLayer();
  if(s.rw!=null)openReward(s.rw>=0?GYMS[s.rw]:null,true);else{startWave();toast(`${R.n} ${state.wave}웨이브부터 이어서 해요`,1.8);}
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
 egg:'<svg viewBox="0 0 32 32"><ellipse cx="16" cy="17" rx="9" ry="11" fill="#fff6dc" stroke="#d9b45a" stroke-width="2"/><circle cx="12" cy="14" r="2" fill="#7fc97f"/><circle cx="19" cy="20" r="2.4" fill="#7fc97f"/></svg>'};
const RMETA={focus:['epic','atk'],dmg:['common','atk'],rate:['common','spd'],range:['common','rng'],crit:['common','atk'],interest:['rare','coin'],cost:['common','coin'],tm:['rare','coin'],kill:['common','coin'],
 se:['rare','type'],nve:['rare','type'],boss:['rare','atk'],egg:['rare','egg'],dot:['common','type'],chain:['rare','spd'],splash:['common','rng'],slow:['rare','def'],supp:['rare','sup'],tmskill:['rare','skill'],
 pp:['rare','skill'],gold:['common','coin'],cap:['common','def'],syn:['epic','type']};
const RLAB={common:'일반',rare:'희귀',epic:'특별'};
function openReward(g,resumed){
  saveRun({rw:g?GYMS.indexOf(g):-1});
  state.phase='reward';if(g&&!resumed)sfx('badge');state.sel=-1;renderPanel();
  const opts=shuffle(rewardPool()).slice(0,3);
  const got=g?`<div class="lcdcard"><svg class="bd" viewBox="0 0 56 56" aria-hidden="true"><path d="M28 4 50 17v22L28 52 6 39V17z" fill="${g.col}" stroke="#fff" stroke-width="3"/><path d="M28 15 40 22v12L28 41 16 34V22z" fill="rgba(255,255,255,.45)"/></svg><div><small>배지 ${state.badges}/8</small><b>${g.badge} 획득</b><span>${g.bd}</span></div></div>`:'';
  const next=GYMS[state.badges];
  showModal(`<div class="scr-head"><h2>${g?`${g.lead} 체육관 돌파`:`웨이브 ${state.wave} 통과`}</h2></div>
   <div class="scr-body">${got}
   <p class="sub">보상 하나를 고르면 바로 다음 웨이브가 시작돼요.${next?` 다음 체육관은 ${(state.badges+1)*5}웨이브 ${next.lead}(${next.t.join('·')}).`:''}</p>
   <div class="rew">${opts.map((o,k)=>{const [rk,ic]=RMETA[o.id]||['common','atk'];return `<button class="card rcard ${rk}" data-r="${k}"><span class="ico" aria-hidden="true">${RICON[ic]}</span><span class="rt"><span class="rk">${RLAB[rk]}</span><span class="t">${o.title}</span><span class="d">${o.desc}</span></span></button>`;}).join('')}</div></div>`);
  $('sheet').querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const o=opts[+b.dataset.r];o.ap();state.taken.push(o.id);state.takenNames.push(o.title);recalc();closeModal();startWave();});
}

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
function showTitle(){
  state.phase='draft';closeLayer();
  const run=loadRun(),rn=run&&(REGIONS.find(r=>r.id===run.region)||REGIONS[0]);
  const best=REGIONS.filter(R=>PROG.best[R.id]).map(R=>`${R.n} ${PROG.clear[R.id]?'정복':'웨이브 '+PROG.best[R.id]}`).join(' · ');
  showModal(`<div class="title-wrap">
    <div class="title-mons">${[6,157,150].map(sprTag).join('')}</div>
    <div class="logo">포켓몬<br>랜덤 디펜스<small>관동과 성도, 체육관 16곳</small></div>
    <div class="title-btns">${run?`<button class="gbtn summon" id="tCont">이어하기 <small>${rn.n} ${run.wave+(run.rw!=null?0:1)}웨이브</small></button>`:''}
     <button class="gbtn ${run?'':'summon'}" id="tStart">새 게임</button><button class="gbtn" id="tGuide">규칙과 도감</button></div>
    <div class="best">${best||'아직 기록이 없어요'}</div></div>`);
  if(run)$('tCont').onclick=()=>resumeRun(run);
  $('tStart').onclick=showRegions;$('tGuide').onclick=showGuide;
}
function showRegions(){
  state.phase='draft';closeLayer();const run=loadRun();
  const cards=REGIONS.map((R,k)=>{const open=regionOpen(R),gb=PROG.badges[R.id]||0;
    return `<button class="card region" data-g="${k}" ${open?'':'disabled'}><span class="t">${R.n}</span>
     <span class="thumbs">${R.face.map(sprTag).join('')}</span>
     <span class="d">${R.sub}</span>
     ${R.ruleDesc?`<span class="d rule">${R.ruleDesc}</span>`:''}
     <span class="d">${open?(PROG.clear[R.id]?'정복함':PROG.best[R.id]?`최고 웨이브 ${PROG.best[R.id]} · 배지 ${gb}개`:'첫 도전'):R.lock}</span></button>`;}).join('');
  showModal(`<div class="scr-head">${backBtn}<h2>지방 고르기</h2></div>
   <div class="scr-body"><p class="sub">${run?'새 게임을 시작하면 이어하던 판은 지워져요.':(PROG.clear.kanto?'지방마다 체육관 8곳과 규칙이 달라요.':'관동을 정복하면 성도가 열려요.')}</p><div class="grid1">${cards}</div></div>`);
  const sh=$('sheet');sh.querySelector('[data-back]').onclick=showTitle;
  sh.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{const R=REGIONS[+b.dataset.g];if(regionOpen(R))showDraft('tr',R);});
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
    <li>웨이브가 시작될 때마다 저장돼요. 창을 닫아도 타이틀에서 이어할 수 있어요.</li>
    ${REGION.ruleDesc?`<li>${REGION.n} 규칙: ${REGION.ruleDesc}</li>`:''}
   </ul>
   <h4>${REGION.n} 체육관 순서</h4>
   <div class="tiles">${GYMS.map((g,k)=>`<div>${sprTag(g.id)}<b>${(k+1)*5} ${g.lead}</b><i>${g.t.join('·')}</i></div>`).join('')}</div>
   <h4>전설 (합체 기준 포켓몬의 타입)</h4>
   <div class="tiles">${LEGENDS.map(L=>`<div>${sprTag(L.id)}<b>${L.n}</b><i>${L.from}</i></div>`).join('')}</div>
   </div>`);
  $('lsheet').querySelector('[data-back]').onclick=closeLayer;
}
function showDraft(tab='tr',R=REGION){
  state.phase='draft';closeLayer();
  const pool=draftPool();const chosen=new Set();
  const uniq=a=>[...new Set(a)];
  const evo=L=>L.mech==='eevee'?`이브이 <em>→ 8갈래</em>`:L.mech==='ditto'?'메타몽 <em>(진화 없음)</em>':uniq(L.n).join(' <em>→</em> ')+(uniq(L.n).length<3?' <em>(3단계는 강화형)</em>':'');
  const thumbs=L=>L.mech==='eevee'?[133,134,197,700].map(sprTag).join(''):uniq(L.id).map(sprTag).join('');
  const trCards=TRAINERS.map((T,k)=>{const ls=T.lines.map(LIDX),open=trUnlocked(T);return `<button class="card tr" data-t="${k}" ${open?'':'disabled'}><span class="t">${T.n}${open?'':' <small>잠김</small>'}</span>
    <span class="thumbs">${ls.map(i=>sprTag(LINES[i].id[2])).join('')}</span><span class="d">${open?T.desc:NEED_TXT[T.need]}</span>
    <span class="chips">${Object.entries(ls.reduce((o,i)=>{const r=LINES[i].role;o[r]=(o[r]||0)+1;return o;},{})).map(([r,c])=>`<span class="role" style="background:${ROLE[r].c}">${ROLE[r].n} ${c}</span>`).join('')}</span></button>`;}).join('');
  const cuCards=pool.map(i=>{const L=LINES[i];return `<button class="card" data-l="${i}" aria-pressed="false">
     <span class="thumbs">${thumbs(L)}</span><span class="evo">${evo(L)}</span><span class="chips">${roleTag(L.role)}${L.t.map(chip).join('')}</span><span class="d">${MECH[L.mech]}</span>${(()=>{const k=L.mech==='ditto'?'메타몽':L.mech==='gyara'?'갸라도스':L.mech==='eevee'?null:L.n[2];const sk=k&&SKILL[k];return sk?`<span class="d" style="color:var(--fg)">스킬 ${sk.n}: ${sk.d}</span>`:L.mech==='eevee'?'<span class="d" style="color:var(--fg)">스킬은 진화형마다 달라요</span>':'';})()}</button>`;}).join('');
  showModal(`<div class="scr-head">${backBtn}<h2>${R.n} · 덱 고르기</h2><button class="ibtn" id="dGuide" aria-label="규칙과 도감"><svg viewBox="0 0 24 24"><circle cx="12" cy="6.5" r="2"/><rect x="10.2" y="10" width="3.6" height="9" rx="1.2"/></svg></button></div>
   <div class="tabs"><button class="tab" data-tab="tr" aria-pressed="${tab==='tr'}">트레이너 덱</button><button class="tab" data-tab="cu" aria-pressed="${tab==='cu'}">직접 고르기</button></div>
   <div class="scr-body" id="dBody"></div>
   <div class="scr-foot" id="dFoot"></div>`);
  const sh=$('sheet');
  sh.querySelector('[data-back]').onclick=showRegions;$('dGuide').onclick=showGuide;
  const render=t=>{tab=t;sh.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.tab===t));
    if(t==='tr'){$('dBody').innerHTML=`<p class="sub">트레이너 덱은 구성이 정해진 대신 고유 효과가 있어요. 누르면 바로 시작해요.</p><div class="grid2">${trCards}</div>`;$('dFoot').innerHTML='';
      $('dBody').querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const T=TRAINERS[+b.dataset.t];if(trUnlocked(T))newGame(T.lines.map(LIDX),T,R);});}
    else{$('dBody').innerHTML=`<p class="sub">10계열 중 5계열을 고르세요. 이번 판 소환은 고른 계열에서만 나와요.</p><div class="grid2">${cuCards}</div>`;
      $('dFoot').innerHTML=`<button class="gbtn" id="dRand">무작위 5개</button><button class="gbtn summon" id="dGo" disabled>0/5 시작</button>`;
      const sync=()=>{$('dBody').querySelectorAll('[data-l]').forEach(b=>b.setAttribute('aria-pressed',chosen.has(+b.dataset.l)));$('dGo').disabled=chosen.size!==5;$('dGo').textContent=`${chosen.size}/5 시작`;};
      $('dBody').querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const i=+b.dataset.l;if(chosen.has(i))chosen.delete(i);else if(chosen.size<5)chosen.add(i);sync();});
      $('dRand').onclick=()=>{chosen.clear();shuffle([...pool]).slice(0,5).forEach(i=>chosen.add(i));sync();};
      $('dGo').onclick=()=>newGame([...chosen],null,R);sync();}
    $('dBody').scrollTop=0;};
  sh.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>render(b.dataset.tab));
  render(tab);
}
function finish(win,reason){
  state.phase='over';state.sel=-1;renderPanel();closeLayer();clearRun();
  const id=REGION.id,reached=win?MAXW:state.wave,first=win&&!PROG.clear[id];
  PROG.best[id]=Math.max(reached,PROG.best[id]||0);if(win)PROG.clear[id]=true;PROG.badges[id]=Math.max(PROG.badges[id]||0,state.badges);saveProg();
  const best=PROG.best[id];
  const unlock=first&&id==='kanto'?'<div class="box"><b>성도 지방이 열렸어요</b><span class="sub">새 계열 8개와 트레이너 골드·크리스·실버도 이제 쓸 수 있어요.</span></div>':first&&id==='johto'?'<div class="box"><b>트레이너 이향이 열렸어요</b></div>':'';
  const legends=board.filter(u=>u&&u.tier===4).length;
  const top=board.filter(u=>u&&u.dealt).sort((a,b)=>b.dealt-a.dealt).slice(0,5),mx=top.length?top[0].dealt:1;
  const mvp=top.length?`<div class="box"><b>많이 싸운 포켓몬</b><div class="mvp">${top.map(u=>`<div class="row"><span class="face">${sprTag(u.s.id)}</span><span class="nm"><span>${u.s.n}</span><span class="barw"><i style="width:${u.dealt/mx*100}%"></i></span></span><b class="tnum">${fmt(u.dealt)}</b></div>`).join('')}</div></div>`:'';
  showModal(`<div class="scr-head"><h2>${win?REGION.winTitle:'패배'}</h2></div>
   <div class="scr-body"><p class="sub">${reason}</p>${unlock}
   <div class="result"><div class="stat"><b class="num">${reached}</b><span>도달 웨이브</span></div>
   <div class="stat"><b class="num">${state.badges}</b><span>배지</span></div>
   <div class="stat"><b class="num">${best}</b><span>최고 기록</span></div></div>${mvp}
   <div class="box"><div class="badges">${GYMS.map((g,k)=>`<span class="badge ${k<state.badges?'on':''}" style="background:${g.col}"></span>`).join('')}</div>
   <p class="sub">${state.trainer?state.trainer.n+' 덱: ':'덱: '}${state.deck.map((i,k)=>`${LINES[i].n[0]} Lv${state.up[k]}`).join(', ')}${legends?` · 전설 ${legends}마리`:''} · 쓰러뜨린 적 ${state.kills}</p></div></div>
   <div class="scr-foot"><button class="gbtn" id="toTitle">타이틀</button><button class="gbtn summon" id="again">새 판 시작</button></div>`);
  $('again').onclick=()=>showDraft('tr',REGION);$('toTitle').onclick=showTitle;
}
function showMenu(){
  if(!state.deck||!state.deck.length||state.phase==='draft')return showGuide();
  const wasPaused=state.paused;state.paused=true;syncPause();
  const names=state.takenNames||[];let quit=false;
  const draw=()=>{showLayer(`<div class="scr-head"><h2>메뉴</h2></div>
   <div class="scr-body">
    <div class="box"><div class="badges">${GYMS.map((g,k)=>`<span class="badge ${k<state.badges?'on':''}" style="background:${g.col}" title="${g.badge}: ${g.bd}"></span>`).join('')}<span class="sub">배지 ${state.badges||0}/8</span></div>
    ${GYMS.slice(0,state.badges).map(g=>`<span class="sub">${g.badge} · ${g.bd}</span>`).join('')}</div>
    ${state.trainer?`<div class="box"><b>${state.trainer.n} 덱</b><span class="sub">${state.trainer.desc}</span></div>`:''}
    ${names.length?`<div class="box"><b>받은 보상</b><div class="taken">${names.map(n=>`<span>${n}</span>`).join('')}</div></div>`:''}
    <div class="menu-list">
     <button class="gbtn summon" data-m="resume">계속하기</button>
     <button class="gbtn" data-m="snd">${soundOn?'소리 끄기':'소리 켜기'}</button>
     <button class="gbtn" data-m="guide">규칙과 도감</button>
     <button class="gbtn ${quit?'danger':''}" data-m="quit">${quit?'한 번 더 누르면 이 판을 끝내요':'이 판 포기하기'}</button>
    </div></div>`);
   $('lsheet').querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const m=b.dataset.m;
     if(m==='resume'){closeLayer();state.paused=wasPaused;syncPause();}
     else if(m==='snd'){soundOn=!soundOn;store.set('pkrtd-snd',soundOn?'1':'0');if(soundOn)sfx('summon');draw();}
     else if(m==='guide')showGuide();
     else if(m==='quit'){if(quit){closeLayer();state.paused=false;syncPause();finish(false,'이 판을 포기했어요.');}else{quit=true;draw();}}});};
  draw();
}

// ───────── 패널·HUD ─────────
let toastT=0;
function toast(msg,sec=1.4){const t=$('toast');t.textContent=msg;delete t.dataset.off;toastT=sec;}
function inAura(i,j){const v=board[i];if(!v)return false;const rad=Math.min(v.tier,3)>=3?2:1;return Math.max(Math.abs(i%COLS-j%COLS),Math.abs(((i/COLS)|0)-((j/COLS)|0)))<=rad;}
function auraVal(m,t){if(m==='auraAll')return '+60%·+40%';const v=AURA[m][t-1]*(m==='auraType'?1:1+mods.supp);return m==='auraRange'?'+'+v.toFixed(1)+'칸':m==='auraType'?'×'+v:m==='auraCrit'?'+'+Math.round(v*100)+'%':'+'+Math.round(v*100)+'%';}
function renderPanel(){
  const p=$('panel');const i=state.sel;const u=i>=0?board[i]:null;
  if(i!==radialSel){radialSel=i;state.detail=false;}
  renderRadial();
  if(!u||state.phase!=='play'||!state.detail){p.hidden=true;return;}
  p.hidden=false;hideTip();
  const s=u.s,nat=NATURES[u.nat],b=s.buff,aura=isAura(s.mech);
  const stars=u.tier===4?'전설':u.tier+'단계';
  const lp=u.tier===3?legendPartners(i):null;
  const pc=v=>Math.round(v*100);
  const bonus=[s.lv?['g',`강화 Lv${s.lv} 공격 +${30*s.lv}%`]:null,s.syn?['g',`시너지 +${pc(s.syn)}%`]:null,b.aD?['g',`응원 공격 +${pc(b.aD)}%`]:null,b.aR?['g',`응원 속도 +${pc(b.aR)}%`]:null,
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
   ${aura?`<div class="stats"><div class="stat"><b>${['','1칸','1칸','2칸'][Math.min(u.tier,3)]}</b><span>범위</span></div><div class="stat"><b>${auraVal(s.mech,Math.min(u.tier,3))}</b><span>효과</span></div><div class="stat"><b>${board.filter((v,j)=>v&&j!==i&&inAura(i,j)).length}</b><span>받는 아군</span></div><div class="stat"><b>×${(1+mods.supp).toFixed(1)}</b><span>응원단</span></div></div>`:
   `<div class="stats"><div class="stat"><b>${fmt(s.dmg)}</b><span>공격</span></div><div class="stat"><b>${s.rate.toFixed(2)}</b><span>초당 공격</span></div>
   <div class="stat"><b>${s.range.toFixed(1)}</b><span>사거리(칸)</span></div><div class="stat"><b>${Math.round(s.crit*100)}%</b><span>치명타</span></div></div>`}
   ${match}
   <div class="bonus">${bonus.map(([c,t])=>`<span class="${c}">${t}</span>`).join('')}</div>
   <p class="mech">${MECH[mk]||'일반 공격.'}</p>${skTxt}
   ${u.dealt?`<p class="nat">이번 판에 준 피해 ${fmt(u.dealt)}</p>`:''}
   <div class="actions"><button class="dbtn" data-a="sell">팔기 +${REFUND[u.tier]}</button>
   ${u.tier===3?`<button class="dbtn gold" data-a="fuse" ${lp?'':'disabled'}>${lp?`전설 합체 → ${LEGENDS[legendFor(u)].n}`:`전설 합체 → ${LEGENDS[legendFor(u)].n}: 3단계 2마리 더 필요`}</button>`:''}</div>`;
}
$('panel').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,i=state.sel;
  if(a==='sell')sell(i);else if(a==='fuse')fuse(i);else{state.detail=false;state.sel=-1;renderPanel();}});
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
  const t=$('tip');t.hidden=false;
  t.innerHTML=`<h4><span class="face">${sprTag(L.id[0])}</span>${L.n[0]} 계열 강화 <span class="tier">Lv${lv}${max?'':' → '+(lv+1)}</span></h4>
   <div class="rows"><span>공격</span><b>+${30*lv}%</b><b class="up2">${max?'':'→ +'+30*(lv+1)+'%'}</b>
   <span>공격 속도</span><b>+${6*lv}%</b><b class="up2">${max?'':'→ +'+6*(lv+1)+'%'}</b></div>
   <p>필드의 ${L.n[0]} 계열 ${mine.length}마리${leg?`(전설 ${leg}마리 포함)`:''}에 바로 적용돼요. 앞으로 소환하거나 진화하는 같은 계열도 똑같이 받아요.</p>
   <div class="actions"><button class="dbtn blue" data-t="go" ${max?'disabled':''}>${max?'최대 레벨':`강화 · ${c}`}</button><button class="dbtn x" data-t="x">닫기</button></div>`;
  t.onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;if(b.dataset.t==='go'){upgrade(k);showUpTip(k);}else hideTip();};
}
function hideTip(){$('tip').hidden=true;}
function renderSyn(){
  const ks=Object.keys(synCount).sort((a,b)=>synCount[b]-synCount[a]);
  $('syn').innerHTML=ks.map(t=>{const c=synCount[t],[th1,th2]=synTh(t);
    return `<span class="s ${c>=th2?'on2':c>=th1?'on':''}" title="${t}: ${th1}마리 +20%, ${th2}마리 +45%">${ti(t)}${c}/${c>=th1?th2:th1}</span>`;}).join('');
}
let lastCoins=-1,hudWave=-1;
let hudKey='';
// 화면 위에 뜨는 요소들의 자리: 판 위치에 맞춰 둔다
function placeOverlays(){
  const dockH=$('dockbar').offsetHeight;
  $('toast').style.bottom=(dockH+52)+'px';$('tip').style.bottom=(dockH+52)+'px';
  {const sub=document.querySelector('.hud-row.sub');$('bossbar').style.top=(sub?sub.offsetTop+$('hud').offsetTop-4:G.oy+6)+'px';}
  hudKey='';
}
function hud(){
  if(!state.waveTypes)return;
  $('wave').innerHTML=`<small>웨이브</small><b>${state.wave}<span style="font-size:14px;color:#a9b8e0">/${MAXW}</span></b>`;
  $('tbar').style.width=Math.max(0,Math.min(1,state.waveT/state.waveLen))*100+'%';
  $('tline').classList.toggle('gym',!!gymAt(state.wave));
  $('tsec').textContent=Math.max(0,Math.ceil(state.waveT))+'초';
  const coins=Math.floor(state.coins);$('coins').textContent=coins.toLocaleString('en-US');
  const cap=fieldCap(),n=enemies.length,r=n/cap;
  $('fcount').innerHTML=`${n}<i>/${cap}</i>`;$('fbar').style.width=Math.min(1,r)*100+'%';
  $('fbarw').className='gauge'+(r>0.8?' hot':r>0.55?' warn':'');$('foes').classList.toggle('hot',r>0.8);
  const c=cost();$('cost').textContent=c;
  $('summon').classList.toggle('off',state.phase!=='play'||state.coins<c||!board.some((v,i)=>!v&&OPEN[i]));
  const bb=$('bossbar'),bo=state.boss;
  $('hud').classList.toggle('bossing',!!(bo&&!bo.dead&&state.phase==='play'&&!state.cut));
  if(bo&&!bo.dead&&state.phase==='play'&&!state.cut){const g=gymAt(state.wave);bb.hidden=false;$('bbn').textContent=`${g.lead}의 ${g.n}`;$('bbh').style.width=Math.max(0,bo.hp/bo.max)*100+'%';$('bbh').style.background=hpCol(bo.hp/bo.max);$('bbt').textContent=(GIM_N[bo.gim]&&bo.gT<3?`${GIM_N[bo.gim]} ${Math.max(0,bo.gT).toFixed(1)} · `:'')+Math.max(0,Math.ceil(state.waveT))+'초';}else bb.hidden=true;
  if(coins!==lastCoins){lastCoins=coins;document.querySelectorAll('#ups [data-u]').forEach(b=>{const k=+b.dataset.u,mx=state.up[k]>=MAXLV,ok=!mx&&state.coins>=upCost(k);b.classList.toggle('poor',!mx&&!ok);b.classList.toggle('ready',ok);});
    if(state.deck&&state.phase==='play'&&state.wave>=2&&state.deck.some((l,k)=>state.coins>=upCost(k)+cost()))tip('up','아래 강화 칸을 누르면 그 계열 전체가 세져요. 길게 누르면 효과를 미리 볼 수 있어요.',3.6);}
  const key=state.wave+'|'+state.badges+'|'+state.phase+'|'+board.map(u=>u?u.line*10+u.tier:'').join(',');
  if(hudKey===key)return;hudKey=key;hudWave=state.wave;
  // 길 입구 깃발: 다음 웨이브
  const w=state.wave,nw=Math.min(MAXW,w+1),en=$('entry');
  if(state.phase==='play'&&w<MAXW){const t=state.waveTypes[nw],g=gymAt(nw),wm=wmodAt(nw),ty=g?g.t:t;
    const atk=board.filter(u=>u&&u.s&&!isAura(u.s.mech)),weak=atk.length>=3?atk.filter(u=>effU(u,u.s.t[0],ty)<1).length:0,bad=weak/Math.max(1,atk.length)>=0.5;
    en.hidden=false;en.className='entry'+(bad?' bad':'');en.dataset.w=nw;en.dataset.weak=weak;
    en.innerHTML=`<span class="el">${bad?'불리':'다음'}</span>${g?`<span class="gymchip-face" style="width:24px;height:24px;border-radius:50%;background:#fff;display:inline-block">${sprTag(g.id)}</span>`:''}${ty.map(ti).join('')}${isNight(nw)?'<span class="nt">밤</span>':''}${wm?`<span class="nt" style="background:${wm.col};color:#14110b">${wm.n}</span>`:''}`;
    const [px,py]=G.pts[0];en.style.left=Math.max(6,px-G.lw*0.5)+'px';en.style.top=(toSY(py)-G.lw*0.45)+'px';}
  else en.hidden=true;
  const gi=state.badges<8?GYMS[state.badges]:null,gl=$('gymline');
  if(gi&&state.phase!=='draft'){const gw=(state.badges+1)*5;gl.hidden=false;
    gl.innerHTML=`<span class="face">${sprTag(gi.id)}</span>${gi.lead} <b>${gw-w<=0?'지금':gw-w+'웨이브 뒤'}</b>`;}
  else gl.hidden=true;
}
$('entry').addEventListener('click',()=>{const en=$('entry'),ww=+en.dataset.w,t=state.waveTypes[ww],g=gymAt(ww),wm=wmodAt(ww),weak=+en.dataset.weak;
  toast(`${ww}웨이브: ${g?`관장 ${g.lead}의 ${g.n}(${g.t.join('·')})`:t.join('·')+' 타입'}${wm?' · '+wm.n:''}${isNight(ww)?' · 밤':''}${weak?`. 내 공격 포켓몬 중 ${weak}마리의 공격이 잘 안 들어가요.`:'.'}`,2.6);});
$('gymline').addEventListener('click',()=>{const g=GYMS[state.badges];if(g)toast(`${g.lead}의 ${g.n}(${g.t.join('·')}): ${g.desc} 이기면 ${g.badge}(${g.bd}).`,3.2);});
// 포켓몬을 누르면 둘레에 정보·팔기·합체
let radialSel=-1;
function renderRadial(){
  const r=$('radial'),i=state.sel,u=i>=0?board[i]:null;
  if(!u||state.phase!=='play'||state.detail){r.hidden=true;return;}
  const c=cellCenter(i),lp=u.tier===3?legendPartners(i):null;
  const items=[['info','<svg viewBox="0 0 24 24"><circle cx="12" cy="6.5" r="2.2"/><rect x="10" y="10" width="4" height="9.5" rx="1.4"/></svg>정보'],['sell',`팔기<b>+${REFUND[u.tier]}</b>`]];
  if(u.tier===3)items.push(['fuse',`전설<b>${lp?'합체':'2마리 더'}</b>`]);
  const R=G.cell*0.95,ang=items.length===2?[-145,-35]:[-165,-90,-15];
  r.hidden=false;r.style.left=c.x+'px';r.style.top=(toSY(c.y)-G.cell*0.35)+'px';
  r.innerHTML=items.map(([k,h],j)=>{const a=ang[j]*Math.PI/180;return `<button data-r="${k}" class="${k==='fuse'?'gold':''}" ${k==='fuse'&&!lp?'disabled':''} style="left:${Math.cos(a)*R}px;top:${Math.sin(a)*R}px">${h}</button>`;}).join('');
}
$('radial').addEventListener('click',e=>{const b=e.target.closest('[data-r]');if(!b)return;const k=b.dataset.r,i=state.sel;
  if(k==='info'){state.detail=true;renderPanel();renderRadial();}else if(k==='sell')sell(i);else if(k==='fuse')fuse(i);});
const PAUSE_SVG='<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
const PLAY_SVG='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
function syncPause(){$('pause').innerHTML=state.paused?PLAY_SVG:PAUSE_SVG;$('pause').setAttribute('aria-label',state.paused?'계속':'멈춤');}


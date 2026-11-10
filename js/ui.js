'use strict';
// ───────── 행동 ─────────
const cost=()=>Math.round(Math.min(120,20+3*state.summons)*mods.costMult);
const upCost=k=>Math.round((15+10*state.up[k])*mods.upCost);
function summon(){
  if(state.phase!=='play')return;
  const empty=board.map((v,i)=>v||!OPEN[i]?-1:i).filter(i=>i>=0);
  if(!empty.length)return toast('빈 칸이 없어요. 합성하거나 팔아서 자리를 만드세요.',1.6);
  const c=cost();if(state.coins<c)return toast('코인이 모자라요.',1);
  state.coins-=c;state.summons++;
  const wts=state.deck.map(l=>mods.weight[l]||1),tot=wts.reduce((a,b)=>a+b,0);let rr=Math.random()*tot,line=state.deck[0];for(let q=0;q<wts.length;q++){rr-=wts[q];if(rr<=0){line=state.deck[q];break;}}
  const ditto=LINES[line].mech==='ditto',egg=!ditto&&Math.random()<mods.egg;
  const u={line,tier:egg?2:1,nat:rnd(NATURES.length),form:0,cd:0.7,grow:0,born:0,ball:{t:0.42,T:0.42}};
  if(egg&&LINES[line].mech==='eevee')u.form=rnd(EEVEE.length);
  const i=pick(empty);board[i]=u;sfx('summon');
  if(egg)toast(`행운의 알: ${def(u).n}`,1.2);
  recalc();
}
function upgrade(k){
  if(state.phase!=='play'&&state.phase!=='reward')return;
  if(state.up[k]>=MAXLV)return;const c=upCost(k);if(state.coins<c)return toast('코인이 모자라요.',1);
  state.coins-=c;state.up[k]++;sfx('buy');recalc();
}
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
  toast(`전설 합체: ${LEGENDS[u.form].n}`,1.8);recalc();
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
  store.set(SAVE_KEY,JSON.stringify(Object.assign({v:1,region:state.region,deck:state.deck,up:state.up,coins:state.coins,wave:state.wave,waveTypes:state.waveTypes,wmods:state.wmods,
    taken:state.taken,takenNames:state.takenNames,badges:state.badges,kills:state.kills,summons:state.summons,trIdx:state.trainer?state.trIdx:-1,speed:state.speed,mods,
    board:board.map(U),enemies:enemies.filter(e=>!e.dead&&!e.boss).map(E)},extra||{})));
}
function loadRun(){try{const s=JSON.parse(store.get(SAVE_KEY)||'null');return s&&s.v===1&&s.deck?s:null;}catch(e){return null;}}
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
function openReward(g,resumed){
  saveRun({rw:g?GYMS.indexOf(g):-1});
  state.phase='reward';if(g&&!resumed)sfx('badge');state.sel=-1;renderPanel();
  const opts=shuffle(rewardPool()).slice(0,3);
  const got=g?`<div class="got dlg"><span class="badge on" style="background:${g.col};width:30px;height:30px"></span><div><b>${g.badge} 획득</b><br><span style="color:var(--dlg-muted)">${g.bd}</span></div></div>`:'';
  const next=GYMS[state.badges];
  showModal(`<div class="scr-head"><h2>${g?`${g.lead} 체육관 돌파`:`웨이브 ${state.wave} 통과`}</h2></div>
   <div class="scr-body">${got}
   <p class="sub">보상 하나를 고르면 바로 다음 웨이브가 시작돼요.${next?` 다음 체육관은 ${(state.badges+1)*5}웨이브 ${next.lead}(${next.t.join('·')}).`:''}</p>
   <div class="rew">${opts.map((o,k)=>`<button class="card" data-r="${k}"><span class="t">${o.title}</span><span class="d">${o.desc}</span></button>`).join('')}</div></div>`);
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
     <span class="d">${R.sub}${R.rows&&R.closed.length?' · 아래쪽이 ㄷ자로 파인 길':''}</span>
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
  showModal(`<div class="scr-head"><h2>${win?REGION.winTitle:'패배'}</h2></div>
   <div class="scr-body"><p class="sub">${reason}</p>${unlock}
   <div class="result"><div class="stat"><b class="num">${reached}</b><span>도달 웨이브</span></div>
   <div class="stat"><b class="num">${state.badges}</b><span>배지</span></div>
   <div class="stat"><b class="num">${best}</b><span>최고 기록</span></div></div>
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
     <button class="gbtn" data-m="quit" style="${quit?'background:var(--danger);color:#1a0806':''}">${quit?'한 번 더 누르면 이 판을 끝내요':'이 판 포기하기'}</button>
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
  if(!u||state.phase!=='play'){p.hidden=true;return;}
  p.hidden=false;
  const s=u.s,nat=NATURES[u.nat],b=s.buff;
  const stars=u.tier===4?`전설 · ${LINES[u.line].n[0]} 계열 강화`:'단계 '+u.tier+'/3';
  const lp=u.tier===3?legendPartners(i):null;
  const extra=[s.lv?`강화 Lv${s.lv}`:'',s.syn?`시너지 +${Math.round(s.syn*100)}%`:'',b.aD?`공격 응원 +${Math.round(b.aD*100)}%`:'',b.aR?`속도 응원 +${Math.round(b.aR*100)}%`:'',b.aC?`치명 응원 +${Math.round(b.aC*100)}%`:'',b.aG?`사거리 응원 +${b.aG.toFixed(1)}`:'',s.grow?`성장 +${Math.round(s.grow*100)}%`:''].filter(Boolean).join(' · ');
  const mk=u.tier===1&&s.mech==='eevee'?'eevee':s.mech;
  p.innerHTML=`<div class="ph"><div class="face">${sprTag(s.id)}</div><div class="who"><h3>${s.n} <span class="tier">${stars}</span></h3>
   <div class="chips" style="margin-top:4px">${roleTag(s.role)}${s.t.map(chip).join('')}</div></div><button class="dbtn x" data-a="close" aria-label="닫기">닫기</button></div>
   <p class="nat">성격 ${nat.n}: ${nat.d}${extra?' · '+extra:''}</p>
   ${isAura(s.mech)?`<div class="stats"><div class="stat"><b>${['','1칸','1칸','2칸'][Math.min(u.tier,3)]}</b><span>범위</span></div><div class="stat"><b>${auraVal(s.mech,Math.min(u.tier,3))}</b><span>효과</span></div><div class="stat"><b>${board.filter((v,j)=>v&&j!==i&&inAura(i,j)).length}</b><span>받는 아군</span></div><div class="stat"><b>×${(1+mods.supp).toFixed(1)}</b><span>응원단</span></div></div>`:`<div class="stats"><div class="stat"><b>${fmt(s.dmg)}</b><span>공격</span></div><div class="stat"><b>${s.rate.toFixed(2)}</b><span>초당 공격</span></div>
   <div class="stat"><b>${s.range.toFixed(1)}</b><span>사거리(칸)</span></div><div class="stat"><b>${Math.round(s.crit*100)}%</b><span>치명타</span></div></div>`}
   <p class="mech">${MECH[mk]||'일반 공격.'}</p>
   ${(()=>{const sk=skillOf(u);if(!sk)return u.tier<2&&LINES[u.line].mech!=='ditto'?`<p class="nat">2단계부터 고유 스킬을 써요.</p>`:'';const ch=isAura(s.mech)?`${((u.tier>=3?5:7)/(1+mods.skill)).toFixed(1)}초마다`:sk.cd?`${skillCd(u,sk).toFixed(1)}초마다 확정`:`공격마다 ${Math.round(skillChance(u)*100)}%`;return `<p class="mech" style="margin-top:6px"><b>고유 스킬 ${sk.n}</b> · ${ch}<br>${sk.d}</p>`;})()}
   <div class="actions"><button class="dbtn" data-a="sell">판매 +${REFUND[u.tier]}</button>
   ${u.tier===3?`<button class="dbtn gold" data-a="fuse" ${lp?'':'disabled'}>${lp?`전설 합체 → ${LEGENDS[legendFor(u)].n}`:`전설 합체 → ${LEGENDS[legendFor(u)].n}: 다른 3단계 2마리 필요`}</button>`:''}</div>`;
}
$('panel').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,i=state.sel;
  if(a==='sell')sell(i);else if(a==='fuse')fuse(i);else{state.sel=-1;renderPanel();}});
function renderUps(){
  if(!state.deck||!state.deck.length){$('ups').innerHTML='';return;}
  $('ups').innerHTML=state.deck.map((li,k)=>{const L=LINES[li],lv=state.up[k],c=upCost(k),max=lv>=MAXLV;
    return `<button class="up" data-u="${k}" ${max||state.coins<c?'disabled':''} aria-label="${L.n[0]} 계열 강화"><span class="ic">${sprTag(L.id[0])}</span><span class="lv">Lv${lv}</span><span class="c">${max?'최대':c}</span><span class="pb"><i style="width:${lv/MAXLV*100}%"></i></span></button>`;}).join('');
}
$('ups').addEventListener('click',e=>{const b=e.target.closest('[data-u]');if(b)upgrade(+b.dataset.u);});
function renderSyn(){
  const ks=Object.keys(synCount).sort((a,b)=>synCount[b]-synCount[a]);
  $('syn').innerHTML=ks.map(t=>{const c=synCount[t],[th1,th2]=synTh(t);
    return `<span class="s ${c>=th2?'on2':c>=th1?'on':''}" title="${th1}마리 +20%, ${th2}마리 +45%"><i style="background:${TYPE_COLOR[t]}"></i>${t} <span class="num">${c}/${c>=th1?th2:th1}</span></span>`;}).join('');
}
let lastCoins=-1,hudWave=-1;
function hud(){
  if(!state.waveTypes)return;
  $('wave').innerHTML=`W <span class="num">${state.wave}</span><small>/${MAXW}</small>`;
  $('tbar').style.width=Math.max(0,Math.min(1,state.waveT/state.waveLen))*100+'%';
  $('tbar').style.background=gymAt(state.wave)?'var(--danger)':'';
  const coins=Math.floor(state.coins);$('coins').textContent=coins;
  const cap=fieldCap(),n=enemies.length,r=n/cap;
  $('fcount').textContent=`${n}/${cap}`;$('fbar').style.width=Math.min(1,r)*100+'%';
  $('fbarw').className='bar field'+(r>0.8?' hot':r>0.55?' warn':'');
  const c=cost();$('cost').textContent=c;
  $('summon').disabled=state.phase!=='play'||state.coins<c||!board.some((v,i)=>!v&&OPEN[i]);
  const bb=$('bossbar'),bo=state.boss;
  if(bo&&!bo.dead&&state.phase==='play'&&!state.cut){const g=gymAt(state.wave);bb.hidden=false;$('bbn').textContent=`${g.lead}의 ${g.n}`;$('bbh').style.width=Math.max(0,bo.hp/bo.max)*100+'%';$('bbh').style.background=hpCol(bo.hp/bo.max);$('bbt').textContent=Math.max(0,Math.ceil(state.waveT))+'초';}else bb.hidden=true;
  if(coins!==lastCoins){lastCoins=coins;document.querySelectorAll('#ups [data-u]').forEach(b=>{const k=+b.dataset.u;b.disabled=state.up[k]>=MAXLV||state.coins<upCost(k);});}
  if(hudWave===state.wave)return;hudWave=state.wave;
  const w=state.wave,lab=['지금','다음','그다음'];let h='';
  for(let k=0;k<3;k++){const ww=w+k;if(ww>MAXW)break;const t=state.waveTypes[ww],g=gymAt(ww);
    const wm=wmodAt(ww);h+=`<span class="fc">${lab[k]} ${isNight(ww)?'<span class="chip night">밤</span>':''}${g?`<span class="chip gym">${g.lead}</span>`:''}${wm?`<span class="chip" style="background:${wm.col}">${wm.n}</span>`:''}${t.map(chip).join('')}</span>`;}
  $('forecast').innerHTML=h;
}
const PAUSE_SVG='<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
const PLAY_SVG='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
function syncPause(){$('pause').innerHTML=state.paused?PLAY_SVG:PAUSE_SVG;$('pause').setAttribute('aria-label',state.paused?'계속':'멈춤');}


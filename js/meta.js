'use strict';
// ───────── 판 밖 성장: 도감, 업적, 챔피언 랭크, 별, 모드 ─────────
let dexDirty=false;
function dexOwn(id){if(!PROG.dex.o[id]){PROG.dex.o[id]=1;dexDirty=true;}}
function dexSeen(id){if(!PROG.dex.s[id]){PROG.dex.s[id]=1;dexDirty=true;}}
function dexCombo(k){dexOwn(LEGENDS[k].id);}
function dexAll(){const out=[],seen=new Set(),add=(id,n,g)=>{if(seen.has(id))return;seen.add(id);out.push({id,n,g});};
  LINES.forEach(L=>L.id.forEach((id,k)=>add(id,L.n[k],'계열')));EEVEE.forEach(e=>add(e.id,e.n,'계열'));
  LEGENDS.forEach((L,k)=>add(L.id,L.n,k>=12?'특수':'전설'));Object.values(MEGA).forEach(M=>add(M.id,M.n,'메가'));return out;}
const dexCount=()=>dexAll().filter(d=>PROG.dex.o[d.id]).length;
const totalStars=()=>Object.values(PROG.stars).reduce((a,S)=>a+S.reduce((x,y)=>x+(y||0),0),0);
const maxOf=o=>Math.max(0,...Object.values(o||{}));

// 업적: 달성하면 출발 지원 하나가 열린다
const ACH=[
 {id:'gym1',n:'첫 배지',d:'관장을 처음 이기기',v:()=>maxOf(PROG.badges),goal:1,sup:'coin'},
 {id:'leg',n:'전설의 시작',d:'전설 합체 1번',st:'legends',goal:1,sup:'egg'},
 {id:'catch',n:'포켓몬 트레이너',d:'포획 누적 10번',st:'caught',goal:10,sup:'ball'},
 {id:'combo',n:'숨은 조합',d:'특수 조합 하나 발견',st:'combos',goal:1,sup:'reroll'},
 {id:'mega',n:'유대의 힘',d:'메가진화 1번',st:'megas',goal:1,sup:'stone'},
 {id:'partner',n:'최고의 파트너',d:'파트너를 Lv10까지 키우기',st:'partner10',goal:1,sup:'xp'},
 {id:'mis',n:'성실한 트레이너',d:'미션 20개 완료',st:'missions',goal:20,sup:'item'},
 {id:'wild',n:'야생의 사냥꾼',d:'야생 강적 10번 잡기',st:'wilds',goal:10,sup:'master'},
 {id:'kanto',n:'관동 정복',d:'관동 40웨이브 돌파',v:()=>PROG.clear.kanto?1:0,goal:1},
 {id:'johto',n:'성도 정복',d:'성도 40웨이브 돌파',v:()=>PROG.clear.johto?1:0,goal:1},
 {id:'hoenn',n:'호연 정복',d:'호연 40웨이브 돌파',v:()=>PROG.clear.hoenn?1:0,goal:1},
 {id:'champ',n:'챔피언',d:'챔피언로드 돌파',v:()=>PROG.clear.champ?1:0,goal:1},
 {id:'stars',n:'별 수집가',d:'관장 별 30개',v:totalStars,goal:30},
 {id:'rank5',n:'랭크 5',d:'아무 지방이나 챔피언 랭크 5로 정복',v:()=>maxOf(PROG.rank),goal:5},
 {id:'raid',n:'레이드 사냥꾼',d:'전설 레이드 5단계 돌파',v:()=>maxOf(PROG.raid),goal:5},
 {id:'endless',n:'끝없는 길',d:'끝없는 모드 60웨이브',v:()=>maxOf(PROG.endless),goal:60},
 {id:'dex',n:'도감 채우기',d:'도감 100종',v:dexCount,goal:100},
 {id:'daily',n:'매일 도전',d:'오늘의 도전 3일',st:'daily',goal:3},
];
const achVal=a=>a.st?(PROG.st[a.st]||0):a.v();
let achNew=[];
function checkAch(){for(const a of ACH)if(!PROG.ach[a.id]&&achVal(a)>=a.goal){PROG.ach[a.id]=1;achNew.push(a);saveProg();if(state.phase==='play')toast(`업적 달성: ${a.n}${a.sup?`. 출발 지원 '${SUPPORTS[a.sup].n}'이 열렸어요`:''}`,2.8);}}
function progBump(k,n){PROG.st[k]=(PROG.st[k]||0)+n;dexDirty=true;checkAch();}
const supOpen=()=>ACH.filter(a=>a.sup&&PROG.ach[a.id]).map(a=>a.sup);

// ── 타이틀 ──
function showTitle(){
  state.phase='draft';closeLayer();music();
  const run=loadRun(),rn=run&&(REGIONS.find(r=>r.id===run.region)||REGIONS[0]);
  const best=REGIONS.filter(R=>PROG.best[R.id]).map(R=>`${R.n} ${PROG.clear[R.id]?'정복':'웨이브 '+PROG.best[R.id]}`).join(' · ');
  showModal(`<div class="title-wrap">
    <button class="ibtn mus" id="tMus" aria-label="음악">${MUS.on?'음악 켜짐':'음악 꺼짐'}</button>
    <div class="parade" aria-hidden="true"><i class="ground"></i>${[25,4,7,1,155,158,152,255,258,252,133,147].map((id,k)=>`<span class="walk" style="animation-delay:${-k*1.6}s">${sprTag(id)}</span>`).join('')}</div>
    <div class="logo">포켓몬<br>랜덤 디펜스<small>관동·성도·호연, 그리고 챔피언로드</small></div>
    <div class="title-btns">${run?`<button class="gbtn summon" id="tCont">이어하기 <small>${rn.n} ${run.wave+(run.rw!=null?0:1)}웨이브</small></button>`:''}
     <button class="gbtn ${run?'':'summon'}" id="tStart">모험 떠나기</button>
     <button class="gbtn" id="tMode" ${F('modes')?'':'aria-disabled="true" style="opacity:.55"'}>도전 모드${F('modes')?'':' <small>20웨이브에 열려요</small>'}</button>
     <div class="row4"><button class="gbtn" id="tTut">연습</button><button class="gbtn" id="tDex">도감</button><button class="gbtn" id="tAch">업적</button><button class="gbtn" id="tGuide">규칙</button></div></div>
    <div class="best">${best||'아직 기록이 없어요'} · 별 ${totalStars()} · 도감 ${dexCount()}/${dexAll().length}</div></div>`);
  if(run)$('tCont').onclick=()=>resumeRun(run);
  $('tStart').onclick=()=>showRegions({mode:'adv'});$('tGuide').onclick=showGuide;$('tMode').onclick=()=>F('modes')?showModes():toast('도전 모드는 모험에서 20웨이브에 이르면 열려요.',2.4);$('tTut').onclick=startTutorial;$('tDex').onclick=showDex;$('tAch').onclick=showAch;
  $('tMus').onclick=()=>{MUS.on=!MUS.on;store.set('pkrtd-bgm',MUS.on?'1':'0');music();$('tMus').textContent=MUS.on?'음악 켜짐':'음악 꺼짐';};
}

// ── 지방 고르기(모험·끝없는·규칙 도전) ──
let selRank=0;
const maxRank=R=>PROG.clear[R.id]?Math.min(10,(PROG.rank[R.id]||0)+1):0;
const regionOpen=R=>R.id==='kanto'||(R.id==='johto'&&!!PROG.clear.kanto)||(R.id==='hoenn'&&!!PROG.clear.johto)||(R.id==='champ'&&!!PROG.clear.kanto);
function showRegions(opt={mode:'adv'}){
  state.phase='draft';closeLayer();const run=loadRun(),mode=opt.mode;
  const anyRank=REGIONS.some(R=>maxRank(R)>0)&&mode==='adv';
  const title={adv:'지방 고르기',endless:'끝없는 모드',rule:'규칙 도전'}[mode];
  const draw=()=>{
  const cards=REGIONS.map((R,k)=>{let open=regionOpen(R);if(mode==='endless'&&!PROG.clear[R.id])open=false;const gb=PROG.badges[R.id]||0,S=PROG.stars[R.id]||[],st=S.reduce((a,b)=>a+(b||0),0),mr=maxRank(R);
    const recs=mode==='endless'?(PROG.endless[R.id]?`최고 ${PROG.endless[R.id]}웨이브`:'첫 도전'):PROG.clear[R.id]?`정복함 · 별 ${st}/${R.gyms.length*3}${mr?` · 랭크 ${mr}까지 열림`:''}`:PROG.best[R.id]?`최고 웨이브 ${PROG.best[R.id]} · 배지 ${gb}개 · 별 ${st}`:'첫 도전';
    return `<button class="card region" data-g="${k}" ${open?'':'disabled'}><span class="t">${R.n}${mode==='adv'&&selRank&&open?` <small>랭크 ${Math.min(selRank,mr)}</small>`:''}</span>
     <span class="thumbs">${R.face.map(sprTag).join('')}</span>
     <span class="d">${R.sub}</span>
     ${R.ruleDesc?`<span class="d rule">${R.ruleDesc}</span>`:''}
     <span class="d">${open?recs:mode==='endless'&&regionOpen(R)?'이 지방을 정복하면 열려요.':R.lock}</span></button>`;}).join('');
  const rk=anyRank?`<div class="box rankbox"><div class="rankrow"><b>챔피언 랭크</b><button class="dbtn" id="rkM">-</button><span class="num">${selRank}</span><button class="dbtn" id="rkP">+</button></div>
    <span class="sub">${selRank?RANKS.slice(1,selRank+1).map((r,i)=>`${i+1}. ${r.d}`).join(' · '):'랭크를 올리면 제약이 하나씩 붙어요. 정복한 지방만 다음 랭크가 열려요.'}</span></div>`:'';
  const rl=mode==='rule'?`<div class="box"><b>붙는 규칙</b>${opt.rules.map(id=>`<span class="sub">${RULES[id].n}: ${RULES[id].d}</span>`).join('')}</div>`:'';
  showModal(`<div class="scr-head">${backBtn}<h2>${title}</h2></div>
   <div class="scr-body"><p class="sub">${run?'새 게임을 시작하면 이어하던 판은 지워져요.':mode==='endless'?'40웨이브 뒤에도 관장이 다시 나오며 끝없이 강해져요.':(PROG.clear.kanto?'지방마다 체육관과 규칙이 달라요.':'관동을 정복하면 성도와 챔피언로드가 열려요.')}</p>${rk}${rl}<div class="grid1">${cards}</div></div>`);
  const sh=$('sheet');sh.querySelector('[data-back]').onclick=mode==='adv'?showTitle:showModes;
  if(anyRank){$('rkM').onclick=()=>{selRank=Math.max(0,selRank-1);draw();};$('rkP').onclick=()=>{selRank=Math.min(10,selRank+1);draw();};}
  sh.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{const R=REGIONS[+b.dataset.g];showDraft('tr',R,Object.assign({},opt,{rank:mode==='adv'?Math.min(selRank,maxRank(R)):0}));});};
  draw();
}

// ── 도전 모드 ──
function dailySetup(){const seed=todayKey(),R0=mulberry(seed),pk=a=>a[Math.floor(R0()*a.length)];
  const regs=REGIONS.filter(r=>regionOpen(r)&&r.id!=='champ'),R=pk(regs),trs=TRAINERS.filter(trUnlocked),T=pk(trs),rule=pk(Object.keys(RULES).filter(k=>k!=='solo'));
  return {seed,R,T,rule};}
function showModes(){
  state.phase='draft';closeLayer();
  const D=dailySetup(),dk=D.seed,L=LEGENDS[weekLegend()],wk=weekKey();
  showModal(`<div class="scr-head">${backBtn}<h2>도전 모드</h2></div>
   <div class="scr-body">
    <button class="card mode" id="mDaily"><span class="t">오늘의 도전</span><span class="thumbs">${sprTag(D.R.face[0])}${D.T.lines.slice(0,3).map(n=>sprTag(LINES[LIDX(n)].id[2])).join('')}</span>
     <span class="d">${D.R.n} · ${D.T.n} 덱 · 규칙 ${RULES[D.rule].n}: ${RULES[D.rule].d}</span><span class="d">날마다 바뀌고, 같은 날은 웨이브 순서가 같아요. ${PROG.daily[dk]?`오늘 최고 ${PROG.daily[dk]}웨이브`:'오늘 첫 도전'}</span></button>
    <button class="card mode" id="mRaid"><span class="t">이번 주 전설 레이드</span><span class="thumbs">${sprTag(L.id)}</span>
     <span class="d">15웨이브까지 덱을 키운 뒤 ${josa(L.n,'과','와')} 단계별로 싸워요. 단계마다 45초, 체력이 계속 올라가요.</span><span class="d">${PROG.raid[wk]?`이번 주 최고 ${PROG.raid[wk]}단계`:'이번 주 첫 도전'} · 관동 판에서 해요</span></button>
    <button class="card mode" id="mEnd" ${REGIONS.some(R=>PROG.clear[R.id])?'':'disabled'}><span class="t">끝없는 모드</span><span class="thumbs">${[384,382,383].map(sprTag).join('')}</span>
     <span class="d">${REGIONS.some(R=>PROG.clear[R.id])?'정복한 지방에서 끝까지 버텨요. 40웨이브 뒤에도 관장이 더 강해져 돌아와요.':'지방 하나를 정복하면 열려요.'}</span></button>
    <button class="card mode" id="mRule"><span class="t">규칙 도전</span><span class="thumbs">${[132,129,446].map(sprTag).join('')}</span>
     <span class="d">판매 금지, 컨베이어, 운명의 날 같은 규칙을 골라 붙이고 시작해요.</span></button>
   </div>`);
  const sh=$('sheet');sh.querySelector('[data-back]').onclick=showTitle;
  $('mDaily').onclick=()=>{newGame(D.T.lines.map(LIDX),D.T,D.R,{mode:'daily',rules:[D.rule],seed:D.seed,daily:D.seed});};
  $('mRaid').onclick=()=>showDraft('tr',REGIONS[0],{mode:'raid',raidLeg:weekLegend()});
  $('mEnd').onclick=()=>showRegions({mode:'endless'});
  $('mRule').onclick=showRules;
}
function showRules(){const sel=new Set();
  const draw=()=>{showModal(`<div class="scr-head">${backBtn}<h2>규칙 도전</h2></div>
   <div class="scr-body"><p class="sub">규칙을 한두 개 고르세요.</p><div class="grid2">${Object.entries(RULES).map(([k,r])=>`<button class="card" data-r="${k}" aria-pressed="${sel.has(k)}"><span class="t">${r.n}</span><span class="d">${r.d}</span></button>`).join('')}</div></div>
   <div class="scr-foot"><button class="gbtn summon" id="rGo" ${sel.size?'':'disabled'}>지방 고르기</button></div>`);
   const sh=$('sheet');sh.querySelector('[data-back]').onclick=showModes;
   sh.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const k=b.dataset.r;if(sel.has(k))sel.delete(k);else if(sel.size<2)sel.add(k);draw();});
   $('rGo').onclick=()=>showRegions({mode:'rule',rules:[...sel]});};
  draw();}

// ── 도감 ──
function showDex(){let tab='계열';
  const all=dexAll(),groups=['계열','전설','특수','메가'];
  const draw=()=>{const list=all.filter(d=>d.g===tab),own=list.filter(d=>PROG.dex.o[d.id]).length;
   showLayer(`<div class="scr-head">${backBtn}<h2>도감</h2></div>
   <div class="tabs">${groups.map(g=>`<button class="tab" data-tab="${g}" aria-pressed="${g===tab}">${g}</button>`).join('')}</div>
   <div class="scr-body"><p class="sub">${tab} ${own}/${list.length} · 전체 ${dexCount()}/${all.length} · 만난 야생 포켓몬 ${Object.keys(PROG.dex.s).length}종</p>
   ${tab==='특수'?`<div class="box"><b>특수 조합법</b>${COMBOS.map(c=>{const L=LEGENDS[c.to],ok=PROG.dex.o[L.id];return `<span class="sub">${c.hint}${ok?` → ${L.n}: ${c.need[0]==='eevee3'?'샤미드·쥬피썬더 등 서로 다른 진화형 셋':c.need.join(' + ')}. ${L.pd}`:' → ?'}</span>`;}).join('')}</div>`:''}
   ${tab==='메가'?`<div class="box"><span class="sub">메가스톤을 쥔 3단계 포켓몬이 메가진화해요. 한 번에 한 마리만 할 수 있고, 같은 계열 3단계를 먹이면 5단계까지 강해져요.</span></div>`:''}
   <div class="tiles dex">${list.map(d=>{const ok=PROG.dex.o[d.id];return `<div class="${ok?'':'no'}">${sprTag(d.id)}<b>${ok?d.n:'?'}</b></div>`;}).join('')}</div></div>`);
   const sh=$('lsheet');sh.querySelector('[data-back]').onclick=closeLayer;sh.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;draw();});};
  draw();}

// ── 업적 ──
function showAch(){checkAch();
  showLayer(`<div class="scr-head">${backBtn}<h2>업적</h2></div>
   <div class="scr-body"><p class="sub">${ACH.filter(a=>PROG.ach[a.id]).length}/${ACH.length} 달성. 업적이 여는 출발 지원은 덱을 고를 때 하나 고를 수 있어요.</p>
   <div class="achs">${ACH.map(a=>{const v=Math.min(a.goal,achVal(a)),ok=PROG.ach[a.id];return `<div class="ach ${ok?'on':''}"><div class="an"><b>${a.n}</b><span>${a.d}</span>${a.sup?`<em>출발 지원: ${SUPPORTS[a.sup].n}</em>`:''}</div><div class="ap"><span class="barw"><i style="width:${v/a.goal*100}%"></i></span><small class="tnum">${ok?'달성':v+'/'+a.goal}</small></div></div>`;}).join('')}</div></div>`);
  $('lsheet').querySelector('[data-back]').onclick=closeLayer;}

// ── 판이 끝났을 때 모드별 기록 ──
function recordRun(win){
  const id=REGION.id,m=state.mode;let line='';
  if(m==='adv'){if(win&&state.rank>=1){PROG.rank[id]=Math.max(PROG.rank[id]||0,state.rank);line=`랭크 ${state.rank} 정복`;}else if(win&&!PROG.rank[id])PROG.rank[id]=PROG.rank[id]||0;}
  else if(m==='endless'){PROG.endless[id]=Math.max(PROG.endless[id]||0,state.wave);line=`끝없는 모드 최고 ${PROG.endless[id]}웨이브`;}
  else if(m==='raid'){const st=Math.max(0,state.badges-3),wk=weekKey();PROG.raid[wk]=Math.max(PROG.raid[wk]||0,st);line=(st?`레이드 ${st}단계까지 돌파`:'레이드 첫 단계를 넘지 못했어요')+` · 이번 주 최고 ${PROG.raid[wk]}단계`;}
  else if(m==='daily'){const first=!PROG.daily[state.daily];PROG.daily[state.daily]=Math.max(PROG.daily[state.daily]||0,state.wave);if(first)progBump('daily',1);line=`오늘의 도전 최고 ${PROG.daily[state.daily]}웨이브`;}
  saveProg();checkAch();return line;
}

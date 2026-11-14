'use strict';
// ───────── 판 안 콘텐츠 ─────────
// 파트너, 지닌 물건, 포획, 미션, 야생 강적, 운 뽑기, 메가진화, 특수 조합, 길 바꾸기, 랭크와 규칙
const WM_DESC={fast:'체력은 70%지만 두 배 빠르고 1.6배 많이 와요. 감속과 광역 공격이 잘 들어요.',swarm:'체력이 절반인 적이 세 배로 몰려와요. 광역 포켓몬을 길목에 두세요.',tank:'체력이 네 배인 적이 절반만 와요. 느리니 강한 딜러로 끝까지 때리세요.'};
const RAID_FROM=15;

// 챔피언 랭크: 지방을 정복하면 1부터 하나씩 열린다. 숫자까지의 제약이 모두 붙는다
const RANKS=[null,
 {d:'적 체력 +10%',ap:s=>{s.hpMul*=1.1;}},
 {d:'관장 제한 시간 -10초',ap:s=>{s.gymT-=10;}},
 {d:'시작 코인 -40',ap:(s,m,f)=>{if(f)s.coins-=40;}},
 {d:'필드 적 제한 -10',ap:s=>{s.capBase-=10;}},
 {d:'적 속도 +10%',ap:s=>{s.spMul*=1.1;}},
 {d:'소환 비용 +15%',ap:(s,m,f)=>{if(f)m.costMult*=1.15;}},
 {d:'보상 선택지 2개',ap:s=>{s.rewardN=2;}},
 {d:'적 체력 +25%',ap:s=>{s.hpMul*=1.25;}},
 {d:'이자 없음',ap:s=>{s.noInt=true;}},
 {d:'관장 체력 +30%',ap:s=>{s.bossMul*=1.3;}},
];
// 규칙 도전과 오늘의 도전에 붙는 규칙
const RULES={
 nosell:{n:'판매 금지',d:'포켓몬을 팔 수 없어요.',ap:s=>{s.noSell=true;}},
 conveyor:{n:'컨베이어',d:'소환 버튼 대신 5초마다 무료로 한 마리가 들어와요.',ap:s=>{s.conveyor=true;}},
 glass:{n:'좁은 울타리',d:'필드 적 제한이 40마리예요.',ap:s=>{s.capBase-=20;}},
 rich:{n:'벼락부자',d:'시작 코인 400, 대신 이자가 없어요.',ap:(s,m,f)=>{if(f)s.coins=400;s.noInt=true;}},
 swift:{n:'질주',d:'모든 적이 30% 빨라요. 쓰러뜨릴 때마다 코인 +1.',ap:(s,m,f)=>{s.spMul*=1.3;if(f)m.coinKill+=1;}},
 bigboss:{n:'거대 관장',d:'관장 체력 2배. 대신 관장을 이기면 보상을 두 번 골라요.',ap:s=>{s.bossMul*=2;s.twice=true;}},
 gamble:{n:'운명의 날',d:'일반 소환이 없고 운 뽑기만 해요. 운 뽑기 비용은 절반.',ap:s=>{s.luckOnly=true;}},
 solo:{n:'외길',d:'덱이 3계열뿐이에요. 대신 계열 강화 비용 -30%.',ap:(s,m,f)=>{if(f){s.deck=s.deck.slice(0,3);s.up=s.up.slice(0,3);m.upCost*=0.7;}}},
};
// 업적으로 여는 출발 지원
const SUPPORTS={
 coin:{n:'코인 +60',ap:s=>{s.coins+=60;}},
 ball:{n:'몬스터볼 +2',ap:s=>{s.balls+=2;}},
 egg:{n:'처음 세 번 소환은 2단계',ap:s=>{s.eggs=3;}},
 reroll:{n:'보상 다시 뽑기 2번',ap:s=>{s.rerolls=2;}},
 stone:{n:'메가스톤을 들고 시작',ap:s=>{s.bag.push('stone');}},
 item:{n:'지닌 물건 하나',ap:s=>{s.bag.push(pick(ITEM_POOL));}},
 xp:{n:'파트너 Lv3으로 시작',ap:s=>{s.partnerLv0=3;}},
 master:{n:'마스터볼 하나',ap:s=>{s.master++;}},
};
function initRun(fresh){
  const s=state;Object.assign(s,{hpMul:1,spMul:1,bossMul:1,gymT:0,rewardN:3,noInt:false,capBase:60,noSell:false,conveyor:false,twice:false,luckOnly:false});
  for(let r=1;r<=s.rank;r++)RANKS[r].ap(s,mods,fresh);
  for(const id of s.rules)if(RULES[id])RULES[id].ap(s,mods,fresh);
  if(fresh)Object.assign(s,{balls:3,master:0,bag:[],mst:{},missions:pickMissions(3),mDone:0,wildReady:true,lastThrow:-9,conv:2,throws:[],capt:[],rerolls:0,eggs:0});
  s.throws=s.throws||[];s.capt=s.capt||[];
}
function applySupport(id){if(id&&SUPPORTS[id])SUPPORTS[id].ap(state);}
// 통계: 판 안(state.mst)과 평생 기록(PROG.st)에 함께 쌓는다
function bump(k,n=1){state.mst[k]=(state.mst[k]||0)+n;if(typeof progBump==='function')progBump(k,n);}

// ── 파트너 ──
const PERK={3:'공격 속도 +20%',5:'최종 진화',7:'주변 1칸 아군 공격 +15%',10:'고유 스킬 확률과 재사용 속도 2배'};
const XPN=lv=>15+lv*10;
function placePartner(){
  const li=state.deck.find(l=>LINES[l].mech!=='ditto');if(li==null)return;
  const empty=board.map((v,i)=>v||!OPEN[i]?-1:i).filter(i=>i>=0);if(!empty.length)return;
  const L=LINES[li],lv=state.partnerLv0||1;
  board[pick(empty)]={line:li,tier:lv>=5?3:2,nat:rnd(NATURES.length),form:L.mech==='eevee'?rnd(EEVEE.length):0,cd:0.7,grow:0,born:0,ball:{t:0.6,T:0.6},partner:{lv,xp:0}};
}
function partnerXp(n,who){const u=who||board.find(v=>v&&v.partner);if(!u||!u.partner||u.partner.lv>=10)return;const P=u.partner;P.xp+=n;
  while(P.lv<10&&P.xp>=XPN(P.lv)){P.xp-=XPN(P.lv);P.lv++;partnerUp(u);}}
function partnerUp(u){const P=u.partner,i=board.indexOf(u);if(i<0)return;const c=cellCenter(i);
  fx.push({k:'txt',x:c.x,y:c.y-G.cell*0.75,s:'Lv'+P.lv,col:'#ff9ec7',big:true,t:1,T:1});fx.push({k:'ring',x:c.x,y:c.y+G.cell*0.18,r:G.cell*0.6,col:'#ff9ec7',t:.5,T:.5});
  if(P.lv>=5&&u.tier<3){const old=def(u).id;u.tier=3;u.evo={t:evoT(),T:evoT(),from:old};sfx('evo');toast(`파트너가 ${josa(def(u).n,'으로')} 진화했어요`,2);}
  else toast(`파트너 Lv${P.lv}${PERK[P.lv]?': '+PERK[P.lv]:': 공격 +12%'}`,1.8);
  if(P.lv>=10)bump('partner10');
  recalcSoon=true;}

// ── 지닌 물건 ──
function giveItem(id){if(state.bag.length>=8){state.coins+=40;toast(`가방이 가득 차서 ${ITEMS[id].n} 대신 코인 +40`,1.6);return;}state.bag.push(id);}
function dropItem(u){if(u&&u.item&&!(u.item==='stone'&&u.mega)){giveItem(u.item);}if(u)u.item=null;}
const canHoldStone=u=>u&&u.tier===3&&!u.mega&&!!MEGA[def(u).n];
function equip(i,k){const u=board[i],id=state.bag[k];if(!u||id==null)return;
  if(id==='stone'&&!canHoldStone(u))return toast('메가스톤은 메가진화할 수 있는 3단계 포켓몬만 쥘 수 있어요.',2);
  if(u.mega)return toast('메가진화한 포켓몬은 메가스톤을 내려놓지 않아요.',1.6);
  state.bag.splice(k,1);if(u.item)state.bag.push(u.item);u.item=id;sfx('buy');
  const c=cellCenter(i);fx.push({k:'txt',x:c.x,y:c.y-G.cell*0.6,s:ITEMS[id].n,col:'#bfe4ff',t:.8,T:.8});recalc();}
function unequip(i){const u=board[i];if(!u||!u.item||u.mega)return;state.bag.push(u.item);u.item=null;recalc();}

// ── 메가진화 ──
const megaOnBoard=()=>board.some(v=>v&&v.mega);
const canMega=u=>featOn('mega')&&u&&u.item==='stone'&&!u.mega&&u.tier===3&&MEGA[def(u).n]&&!megaOnBoard();
function megaFood(i){const u=board[i];if(!u||!u.mega||u.mega>=5)return -1;const k=keyOf(u);
  return board.findIndex((v,j)=>j!==i&&v&&v.tier===3&&!v.partner&&!v.mega&&keyOf(v)===k);}
function megaEvolve(i){const u=board[i];if(!canMega(u))return;const old=def(u).id;u.mega=1;u.evo={t:1.1,T:1.1,from:old};markReveal(u);
  shake=6;sfx('legend');camP=camT=0.9;const D=def(u);cutCD=0;cutin={id:D.id,n:D.n,sk:'메가진화',col:'#ff7ad9',t:1.1,T:1.1,leg:true};cutCD=5;
  toast(`${D.n}! 같은 계열 3단계를 먹이면 더 강해져요(최대 5단계).`,2.4);bump('megas');recalc();}
function megaFeed(i){const j=megaFood(i);if(j<0)return;const u=board[i],v=board[j],a=cellCenter(j),b=cellCenter(i);
  fx.push({k:'absorb',x1:a.x,y1:a.y,x2:b.x,y2:b.y,t:.6,T:.6});dropItem(v);board[j]=null;u.mega++;u.pop=0.35;sfx('evo');
  fx.push({k:'txt',x:b.x,y:b.y-G.cell*0.75,s:'메가 '+u.mega+'단계',col:'#ff9be6',big:true,t:1,T:1});recalc();}

// ── 특수 조합 ──
const comboOk=v=>v&&v.tier===3&&!v.partner&&!v.mega;
function comboFor(i){const u=board[i];if(!comboOk(u)||!featOn('combo'))return null;const n=def(u).n,isE=LINES[u.line].mech==='eevee';
  for(const c of COMBOS){
    if(c.need[0]==='eevee3'){if(!isE)continue;const used=new Set([u.form]),cells=[];
      board.forEach((v,j)=>{if(j!==i&&comboOk(v)&&LINES[v.line].mech==='eevee'&&!used.has(v.form)&&cells.length<2){used.add(v.form);cells.push(j);}});
      if(cells.length===2)return {c,cells};continue;}
    if(!c.need.includes(n))continue;const cells=[];
    for(const m of c.need){if(m===n)continue;const j=board.findIndex((v,j2)=>j2!==i&&!cells.includes(j2)&&comboOk(v)&&def(v).n===m);if(j<0)break;cells.push(j);}
    if(cells.length===2)return {c,cells};}
  return null;}
function comboHint(u){if(!comboOk(u)||!featOn('combo'))return null;const n=def(u).n,isE=LINES[u.line].mech==='eevee';return COMBOS.find(c=>c.need[0]==='eevee3'?isE:c.need.includes(n))||null;}
function doCombo(i){const r=comboFor(i);if(!r)return;const u=board[i],old=def(u).id,c0=cellCenter(i);
  for(const j of r.cells){const q=cellCenter(j);fx.push({k:'absorb',x1:q.x,y1:q.y,x2:c0.x,y2:c0.y,t:.7,T:.7});dropItem(board[j]);board[j]=null;}
  u.tier=4;u.form=r.c.to;u.evo={t:1.3,T:1.3,from:old};markReveal(u);shake=8;sfx('legend');camP=camT=1.1;
  const L=LEGENDS[r.c.to];cutCD=0;cutin={id:L.id,n:L.n,sk:'특수 조합',col:'#b98cff',t:1.2,T:1.2,leg:true};cutCD=5;
  toast(`특수 조합: ${L.n}. ${L.pd}`,3);bump('combos');if(typeof dexCombo==='function')dexCombo(r.c.to);recalc();}

// ── 포획 ──
const catchLim=e=>e.wild?0.25:0.4;
const catchable=()=>enemies.filter(e=>!e.dead&&!e.boss&&!e.caught&&e.hp/e.max<catchLim(e));
function throwBall(){
  if(state.phase!=='play')return;
  if(!(state.balls>0)&&!(state.master>0))return toast('몬스터볼이 없어요. 관장을 이기면 하나씩 받아요.',1.8);
  if(clock-state.lastThrow<1)return;
  const cs=catchable();if(!cs.length)return toast('잡을 수 있는 적이 없어요. 체력이 40% 아래로 떨어진 적에게 던져져요.',2);
  const e=cs.reduce((a,b)=>b.hp/b.max<a.hp/a.max?b:a);
  const master=state.master>0&&(e.wild||!(state.balls>0));if(master)state.master--;else state.balls--;
  state.lastThrow=clock;e.caught=true;sfx('summon');
  state.throws.push({e,t:0,T:0.45,x0:G.W*0.3,y0:toWY(G.H-70),master});tip('catch','적의 체력이 낮을수록 잘 잡혀요. 잡은 포켓몬은 빈 칸에 들어와요.');
}
function lineForEnemy(e){
  if(e.wild){const k=LINES.findIndex(L=>L.id[2]===e.sid||L.id[1]===e.sid);if(k>=0)return {line:k,tier:3};return {line:pick(state.deck.filter(l=>LINES[l].mech!=='ditto')),tier:3};}
  const m=state.deck.filter(l=>LINES[l].t.some(t=>e.t.includes(t)));
  return {line:m.length?pick(m):pick(state.deck),tier:Math.random()<0.15?2:1};
}
function finishCatch(c){
  const e=c.e;
  if(!c.ok){e.caught=false;e.dead=false;enemies.push(e);fx.push({k:'puff',x:c.x,y:c.y,r:G.cell*0.5,col:'#ffffff',t:.35,T:.35});fx.push({k:'txt',x:c.x,y:c.y-G.cell*0.5,s:'빠져나왔다!',col:'#ffb0a6',big:true,t:.9,T:.9});return;}
  bump('caught');if(e.wild){state.wild=null;bump('wilds');}
  const g=lineForEnemy(e),empty=board.map((v,i)=>v||!OPEN[i]?-1:i).filter(i=>i>=0);
  fx.push({k:'txt',x:c.x,y:c.y-G.cell*0.5,s:'잡았다!',col:'#ffe14d',big:true,t:1,T:1});burst(c.x,c.y,'페어리',14,1.2);sfx('badge');
  if(!empty.length){state.coins+=30*g.tier;toast(`${josa(e.name,'을','를')} 잡았지만 빈 칸이 없어 코인 +${30*g.tier}로 바꿨어요.`,2);return;}
  const L=LINES[g.line],u={line:g.line,tier:g.tier,nat:rnd(NATURES.length),form:L.mech==='eevee'?rnd(EEVEE.length):0,cd:0.7,grow:0,born:0,ball:{t:0.42,T:0.42}};
  board[pick(empty)]=u;recalc();toast(`${josa(e.name,'을','를')} 잡았어요. ${g.tier>1?def(u).n+' '+g.tier+'단계가':josa(def(u).n,'이','가')} 합류했어요.`,2.2);
}

// ── 야생 강적 ──
const WILD=[[130,'갸라도스',['물','비행']],[149,'망나뇽',['드래곤','비행']],[248,'마기라스',['바위','악']],[445,'한카리아스',['드래곤','땅']],[373,'보만다',['드래곤','비행']],[376,'메타그로스',['강철','에스퍼']],[359,'앱솔',['악']],[143,'잠만보',['노말']]];
const canWild=()=>state.phase==='play'&&state.wildReady&&!gymAt(state.wave)&&!state.wild&&state.wave>=2;
function callWild(){
  if(!canWild()){if(state.phase==='play')toast(gymAt(state.wave)?'관장전에는 부를 수 없어요.':state.wild?'이미 야생 강적과 싸우고 있어요.':state.wave<2?'2웨이브부터 부를 수 있어요.':'다음 체육관 구간이 시작되면 다시 부를 수 있어요.',1.8);return;}
  state.wildReady=false;const [sid,name,t]=pick(WILD),hp=hpAt(state.wave)*9*(state.hpMul?1:1);
  const e=mkEnemy({t,name,sid,hp,max:hp,sp:0.8*(state.spMul||1),big:1.35,wild:true,wT:25});state.wild=e;
  fx.push({k:'ring',x:e.x,y:e.y,r:G.cell*1.2,col:'#ff5a4a',t:.8,T:.8});shake=4;sfx('gym');if(typeof dexSeen==='function')dexSeen(sid);
  if(PROG.seen&&PROG.seen.wild)toast(`야생 ${josa(name,'이','가')} 나타났다! 25초 안에 쓰러뜨리세요.`,2.2);
  introCard('wild','야생 강적','체육관 구간마다 한 번 부를 수 있어요. 25초 안에 쓰러뜨리면 지닌 물건과 코인을 받고, 놓치면 적 8마리가 몰려와요. 체력이 25% 아래면 몬스터볼로 잡을 수도 있어요.');
}
function wildDown(e){state.wild=null;const c=30+state.wave*3;state.coins+=c;const it=pick(ITEM_POOL);giveItem(it);bump('wilds');sfx('badge');toast(`야생 ${e.name} 격파! 코인 +${c}, ${ITEMS[it].n}`,2.4);}

// ── 운 뽑기 ──
const luckCost=k=>Math.round(cost()*(k===3?3.2:1.6)*(state.luckOnly?0.5:1));
function luckRoll(k){
  if(state.phase!=='play')return;
  const empty=board.map((v,i)=>v||!OPEN[i]?-1:i).filter(i=>i>=0);if(!empty.length)return toast('빈 칸이 없어요.',1.4);
  const c=luckCost(k);if(state.coins<c)return toast(`코인이 ${Math.ceil(c-state.coins)} 모자라요.`,1.4);
  state.coins-=c;logSpend('l',c);
  const ok=Math.random()<(k===3?0.35:0.55);
  if(!ok){toast('꽝! 이번엔 아무도 나오지 않았어요.',1.4);const p=$('luck');if(p){p.classList.remove('miss');void p.offsetWidth;p.classList.add('miss');}return false;}
  const line=pick(state.deck.filter(l=>LINES[l].mech!=='ditto'));const L=LINES[line];
  const u={line,tier:k,nat:rnd(NATURES.length),form:L.mech==='eevee'?rnd(EEVEE.length):0,cd:0.7,grow:0,born:0,ball:{t:0.42,T:0.42}};
  board[pick(empty)]=u;bump('lucky');sfx('evo');recalc();toast(`대박! ${def(u).n} ${k}단계`,1.8);return true;
}

// ── 미션 ──
const MISSIONS=[
 {id:'evo',n:'진화 8번 하기',goal:8,stat:'evos'},
 {id:'t3',n:'3단계 포켓몬 3마리 모으기',goal:3,live:()=>board.filter(u=>u&&u.tier>=3&&!u.partner).length},
 {id:'wavek',n:'한 웨이브에 적 40마리 쓰러뜨리기',goal:40,live:()=>state.waveKills||0},
 {id:'catch',n:'포획 3번 성공',goal:3,stat:'caught'},
 {id:'leg',n:'전설 합체 1번',goal:1,stat:'legends'},
 {id:'fastgym',n:'관장을 25초 안에 쓰러뜨리기',goal:1,stat:'fastGym'},
 {id:'lv',n:'계열 하나를 Lv8까지 강화',goal:8,live:()=>Math.max(0,...state.up)},
 {id:'wild',n:'야생 강적 2번 잡기',goal:2,stat:'wilds'},
 {id:'syn',n:'타입 시너지 2단계 켜기',goal:1,live:()=>Object.values(synB).some(v=>v>=0.45)?1:0},
 {id:'luck',n:'운 뽑기 2번 성공',goal:2,stat:'lucky'},
 {id:'rich',n:'코인 400개 모으기',goal:400,live:()=>Math.floor(state.coins)},
 {id:'early',n:'웨이브 일찍 부르기 5번',goal:5,stat:'early'},
 {id:'item',n:'지닌 물건 3개 쥐여 주기',goal:3,live:()=>board.filter(u=>u&&u.item).length},
];
const MREW={coin:'코인',item:'지닌 물건',ball:'몬스터볼 2개',master:'마스터볼',stone:'메가스톤'};
function pickMissions(n,have=[]){const ids=have.map(m=>m.id),pool=shuffle(MISSIONS.filter(m=>!ids.includes(m.id)));
  return pool.slice(0,n).map(m=>({id:m.id,rw:pick(['coin','coin','item','item','ball','master','stone']),b:null}));}
const misDef=m=>MISSIONS.find(x=>x.id===m.id);
function misVal(m){const d=misDef(m);return d.live?d.live():(state.mst[d.stat]||0)-(m.b||0);}
function startMissions(){for(const m of state.missions){const d=misDef(m);if(d.stat&&m.b==null)m.b=state.mst[d.stat]||0;}}
function checkMissions(){
  if(!state.missions)return;
  for(let k=0;k<state.missions.length;k++){const m=state.missions[k],d=misDef(m);if(m.done)continue;if(d.stat&&m.b==null)m.b=state.mst[d.stat]||0;
    if(misVal(m)>=d.goal){m.done=true;state.mDone++;bump('missions');giveMission(m);
      const nx=state.mDone<6?pickMissions(1,state.missions)[0]:null;if(nx){const d2=misDef(nx);if(d2.stat)nx.b=state.mst[d2.stat]||0;state.missions[k]=nx;}else state.missions.splice(k,1),k--;}}
}
function giveMission(m){const d=misDef(m);let txt='';
  if(m.rw==='coin'){const c=50+state.wave*3;state.coins+=c;txt=`코인 +${c}`;}
  else if(m.rw==='item'){const it=pick(ITEM_POOL);giveItem(it);txt=ITEMS[it].n;}
  else if(m.rw==='ball'){state.balls=Math.min(9,(state.balls||0)+2);txt='몬스터볼 2개';}
  else if(m.rw==='master'){state.master=(state.master||0)+1;txt='마스터볼';}
  else if(m.rw==='stone'){if(F('mega')){giveItem('stone');txt='메가스톤';}else{state.coins+=80;txt='코인 80';}}
  sfx('badge');toast(`미션 완료: ${d.n}. ${josa(txt,'을','를')} 받았어요.`,2.6);
  const el=$('mchip');if(el){el.classList.remove('done');void el.offsetWidth;el.classList.add('done');}
}

// ── 웨이브 일찍 부르기 ──
const canEarly=()=>state.phase==='play'&&!gymAt(state.wave)&&state.spawnLeft===0&&state.waveT>2&&state.wave<MAXW&&!state.wild;
const earlyBonus=()=>Math.ceil(state.waveT*(0.5+state.wave*0.04));
function callEarly(){if(!canEarly())return;const b=earlyBonus();state.coins+=b;bump('early');sfx('buy');toast(`일찍 불러서 코인 +${b}`,1.2);endWave();}

// ── 길 바꾸기 ──
function switchVariant(k){
  const keep=board.slice();setVariant(k);const moved=[];
  for(let i=0;i<N;i++)if(keep[i]&&!OPEN[i]){moved.push(keep[i]);board[i]=null;}
  for(const u of moved){const e=board.map((v,i)=>v||!OPEN[i]?-1:i).filter(i=>i>=0);if(e.length)board[pick(e)]=u;else{state.coins+=REFUND[u.tier]||0;dropItem(u);}}
  zones=[];state.sel=-1;layout();recalc();
  const vn=(REGION.variants[VAR]||{}).n||'';setTimeout(()=>{if(state.phase==='play')toast(`길이 바뀌었어요: ${vn}${moved.length?`. 길에 걸린 ${moved.length}마리는 빈 칸으로 옮겼어요`:''}`,2.4);},900);
}

// ── 매 프레임: 포획 진행, 야생 강적 시간, 컨베이어, 미션 ──
let misT=0;
function updRun(dt){
  for(const t of state.throws){t.t+=dt;if(t.t>=t.T){t.done=true;const e=t.e;if(e.dead&&!e.caught)continue;
    e.dead=true;const lim=catchLim(e),f=e.hp/e.max;
    const ok=t.master||state.tutSure||Math.random()<Math.min(0.95,(0.35+(1-f/lim)*0.6+mods.catchB)*(e.wild?0.75:1));
    state.capt.push({e,x:e.x,y:e.y,t:1.1,T:1.1,ok,master:t.master});}}
  state.throws=state.throws.filter(t=>!t.done);
  for(const c of state.capt){c.t-=dt;if(c.t<=0){c.done=true;finishCatch(c);}}
  state.capt=state.capt.filter(c=>!c.done);
  const W=state.wild;
  if(W&&!W.dead&&!W.caught){W.wT-=dt;if(W.wT<=0){W.dead=true;state.wild=null;fx.push({k:'puff',x:W.x,y:W.y,r:G.cell*0.8,col:'#ffffff',t:.5,T:.5});
    for(let k=0;k<8;k++)spawnEnemy(false);shake=4;toast(`야생 ${josa(W.name,'이','가')} 도망쳤어요. 소란에 적 8마리가 몰려와요.`,2.4);}}
  else if(W&&W.dead&&!W.caught)state.wild=null;
  if(state.conveyor){state.conv-=dt;if(state.conv<=0){state.conv=5;freeSummon();}}
  misT-=dt;if(misT<=0){misT=0.5;if(featOn('missions'))checkMissions();}
}
function freeSummon(){const empty=board.map((v,i)=>v||!OPEN[i]?-1:i).filter(i=>i>=0);if(!empty.length)return;
  const line=pick(state.deck),L=LINES[line];board[pick(empty)]={line,tier:1,nat:rnd(NATURES.length),form:0,cd:0.7,grow:0,born:0,ball:{t:0.42,T:0.42}};sfx('summon');recalc();}

// ── 관장 별 ──
function gymStars(g){
  if(g.raid||g.lap)return;const k=GYMS.indexOf(g);if(k<0)return;
  const left=state.waveT,n=1+(left>=15?1:0)+(enemies.filter(e=>!e.dead&&!e.boss).length<=15?1:0);
  if(state.waveLen-left<=25)bump('fastGym');
  state.lastStars=n;
  if(state.mode!=='adv'&&state.mode!=='endless')return;
  const S=PROG.stars[REGION.id]=PROG.stars[REGION.id]||[];S[k]=Math.max(S[k]||0,n);saveProg();
}
// 다음 관장: {g,w}
function nextGym(){for(let w=Math.max(1,state.wave);w<=state.wave+12;w++){const g=gymAt(w);if(g&&(w>state.wave||(state.boss&&!state.boss.dead)))return {g,w};}return null;}

// ── 레이드 ──
const RAID_GIM={'불꽃':'blaze','물':'recover','전기':'paralyze','에스퍼':'teleport','드래곤':'ddance','땅':'sturdy','얼음':'hail','강철':'iron','고스트':'hypnosis','독':'seed','노말':'bulk','풀':'recover'};
const RGYM={};
function raidGym(stage){const L=LEGENDS[state.raidLeg||0],key=(state.raidLeg||0)+'-'+stage;
  if(!RGYM[key])RGYM[key]={lead:'전설',n:L.n,id:L.id,t:L.t,hp:13*Math.pow(1.12,stage-1),sp:0.5,gim:RAID_GIM[L.t[0]]||'recover',
    desc:`레이드 ${stage}단계. ${(GIM_DESC[RAID_GIM[L.t[0]]]||'')}`,badge:`레이드 ${stage}단계 돌파`,bd:'다음 단계가 열려요',ap:()=>{},col:TYPE_COLOR[L.t[0]],raid:stage,
    title:`전설 레이드 ${stage}단계`,title2:`${josa(L.n,'이','가')} 나타났다!`};
  return RGYM[key];}
const GIM_DESC={blaze:'감속·기절·잠듦에 걸리지 않아요.',recover:'8초마다 체력 15% 회복.',paralyze:'6초마다 가까운 포켓몬들을 마비시켜요.',teleport:'7초마다 순간이동.',ddance:'10초마다 빨라지고 단단해져요.',sturdy:'효과가 굉장한 공격이 아니면 피해 40% 감소.',hail:'싸라기눈으로 공격 속도를 늦춰요.',iron:'효과가 굉장한 공격이 아니면 피해 45% 감소.',hypnosis:'포켓몬을 재워요.',seed:'부하를 불러요.',bulk:'8초마다 단단해져요.'};
const weekKey=()=>{const d=new Date(),j=new Date(d.getFullYear(),0,1);return d.getFullYear()+'-'+Math.ceil(((d-j)/864e5+j.getDay()+1)/7);};
const weekLegend=()=>{const k=weekKey().split('-');return (+k[0]*53+ +k[1])%12;};
const todayKey=()=>{const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();};

// ── 처음 보는 것 안내 카드 ──
let introQ=[],introT=0;
function introCard(key,title,body){if(!PROG.seen)PROG.seen={};if(PROG.seen[key])return;PROG.seen[key]=1;saveProg();introQ.push({title,body});if(introT<=0)nextIntro();}
function nextIntro(){const el=$('intro');const c=introQ.shift();if(!c){el.hidden=true;introT=0;return;}
  el.innerHTML=`<b>${c.title}</b><span>${c.body}</span>`;el.hidden=false;introT=5.5;}
function tickIntro(dt){if(introT>0){introT-=dt;if(introT<=0)nextIntro();}}

// ── 오박사 첫 안내 ──
const OAK=[
 '어서 오렴! 나는 오박사란다. 길을 따라 몰려오는 야생 포켓몬을 네 포켓몬들이 막아 줄 거야.',
 '아래 몬스터볼을 누르면 덱의 포켓몬이 무작위로 나와. 하트가 붙은 포켓몬은 너의 파트너야. 같이 싸울수록 레벨이 올라 진화한단다.',
 '같은 포켓몬 두 마리를 끌어다 겹치면 진화해. 서로 다른 3단계 세 마리로는 전설 포켓몬을 부를 수 있지.',
 '적이 많이 약해지면 왼쪽 볼 버튼으로 잡아 보렴. 위쪽 미션 칸을 누르면 이번 판 목표와 보상이 나와.',
 '필드에 적이 60마리를 넘으면 진다. 5웨이브마다 관장이 나오니 미리 대비하렴. 음악은 메뉴에서 켤 수 있어. 자, 시작해 볼까!'];
function oakIntro(){return;if(store.get('pkrtd-oak'))return;store.set('pkrtd-oak','1');state.paused=true;syncPause();let k=0;const el=$('oak');
  const show=()=>{el.hidden=false;el.innerHTML=`<div class="oak-box"><span class="oak-name">오박사</span><p>${OAK[k]}</p><button class="gbtn summon" id="oakNext">${k<OAK.length-1?'다음':'시작하기'}</button><button class="oak-skip" id="oakSkip">건너뛰기</button></div>`;
    $('oakNext').onclick=()=>{k++;if(k<OAK.length)show();else done();};$('oakSkip').onclick=done;};
  const done=()=>{el.hidden=true;state.paused=false;syncPause();};
  show();}

// ── 지닌 물건 아이콘: 화면(DOM)에는 SVG로, 전장(캔버스)에는 같은 SVG를 이미지로 바꿔 그린다 ──
const ITEM_SVG={
 scarf:'<path d="M6 9c4-3 16-3 20 0l-2 4c-4-2-12-2-16 0z" fill="#4f8ff7" stroke="#1d3f8a" stroke-width="1.6"/><path d="M19 12l3 13-5-1-1-11z" fill="#3a74d6" stroke="#1d3f8a" stroke-width="1.6"/><path d="M17 23l5 1M17.5 20l4 1" stroke="#9fc4ff" stroke-width="1.2"/>',
 orb:'<circle cx="16" cy="16" r="11" fill="#b8337a" stroke="#4a0f30" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="#ff7ab5" opacity=".7"/><circle cx="12" cy="11" r="3" fill="#fff" opacity=".75"/>',
 left:'<path d="M16 9c5-3 11 1 10 8-1 6-5 9-10 9s-9-3-10-9c-1-7 5-11 10-8z" fill="#e8423a" stroke="#7a1712" stroke-width="1.8"/><path d="M22 12c3 2 3 7 1 10" fill="#fff6dc" stroke="#7a1712" stroke-width="1.4"/><path d="M16 9c0-3 1-5 3-6" stroke="#5a3a1a" stroke-width="2" fill="none"/><path d="M17 5c3-1 5 0 6 2-3 1-5 0-6-2z" fill="#5bb04f"/>',
 ribbon:'<path d="M16 15c-4-6-11-6-10-1 1 4 6 3 10 1zM16 15c4-6 11-6 10-1-1 4-6 3-10 1z" fill="#ff7ab5" stroke="#8a1d57" stroke-width="1.6"/><path d="M14 16l-4 11 4-2 2 3 1-12z" fill="#e85a9c" stroke="#8a1d57" stroke-width="1.4"/><circle cx="16" cy="15" r="2.6" fill="#ffd0e4" stroke="#8a1d57" stroke-width="1.4"/>',
 scope:'<circle cx="16" cy="16" r="10" fill="#cfe8ff" stroke="#1d3f8a" stroke-width="2.4"/><path d="M16 6v6M16 20v6M6 16h6M20 16h6" stroke="#d7392f" stroke-width="2"/><circle cx="16" cy="16" r="2" fill="#d7392f"/>',
 wide:'<circle cx="14" cy="14" r="8" fill="#e3f4ff" stroke="#2b3f6a" stroke-width="2.4"/><path d="M20 20l7 7" stroke="#2b3f6a" stroke-width="3.6" stroke-linecap="round"/><path d="M10 12a5 5 0 0 1 5-4" stroke="#fff" stroke-width="2" fill="none"/>',
 amulet:'<path d="M10 4l6 7 6-7" stroke="#d7392f" stroke-width="2.4" fill="none"/><circle cx="16" cy="19" r="9" fill="#f5c542" stroke="#9a720f" stroke-width="2"/><circle cx="16" cy="19" r="4.5" fill="none" stroke="#9a720f" stroke-width="1.8"/>',
 band:'<path d="M4 15c6-3 18-3 24 0v4c-6-3-18-3-24 0z" fill="#e8413a" stroke="#7a1712" stroke-width="1.6"/><path d="M25 17l4 6-4-1-1 4-2-8z" fill="#c22d24" stroke="#7a1712" stroke-width="1.4"/><circle cx="16" cy="16.5" r="2.4" fill="#fff"/>',
 stone:'<circle cx="16" cy="16" r="11" fill="#ffd6f3" stroke="#8a1d6e" stroke-width="2"/><path d="M11 10c6 2 4 10 10 12M21 10c-6 2-4 10-10 12" stroke="#c0399a" stroke-width="2.2" fill="none"/><circle cx="12" cy="11" r="2.2" fill="#fff"/>',
};
const itemIco=(id,cls='ii')=>`<svg class="${cls}" viewBox="0 0 32 32" aria-hidden="true">${ITEM_SVG[id]||''}</svg>`;
const ITEM_IMG={};
for(const k in ITEM_SVG){const im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="64" height="64">${ITEM_SVG[k]}</svg>`);ITEM_IMG[k]=im;}

// ───────── 6단계 콘텐츠 ─────────
// 주간 레이드 규칙: 주마다 레이드에 규칙 하나가 붙는다
const RAID_RULES=['swift','bigboss','glass','rich','nosell','conveyor'];
const weekRaidRule=()=>{const k=weekKey().split('-');return RAID_RULES[(+k[0]*7+ +k[1]*3)%RAID_RULES.length];};

// 관장 2페이즈: 지방 마지막 관장과 챔피언로드(사천왕·챔피언)는 체력이 절반 아래로 내려가면 진심을 낸다
// 빨라지고, 기술 간격이 30% 짧아지고, 부하 셋을 부른다
const ph2Gym=g=>!!g&&!g.raid&&(REGION.id==='champ'||GYMS.indexOf(g)===GYMS.length-1);
(function(){
  const sp=spawnEnemy;
  spawnEnemy=function(isBoss){
    const w=state.wave;
    if(!isBoss&&state.wmods&&state.wmods[w]==='rival')return rivalSpawn(w);
    const r=sp.apply(this,arguments);
    if(isBoss&&state.boss)state.boss.ph2ok=ph2Gym(gymAt(w));
    return r;};
  const bt=bossTick;
  bossTick=function(e,dt){
    if(e.ph2ok&&!e.ph2&&e.hp<e.max*0.5){
      e.ph2=true;e.sp0*=1.2;e.sp=Math.max(e.sp,e.sp0);e.gT=Math.min(e.gT||0,1.2);e.hp=Math.min(e.max*0.5,e.hp+e.max*0.06);
      const g=gymAt(state.wave);
      for(let k=0;k<3;k++){const t=e.t||g.t,[name,sid]=pick(ENEMY[t[0]]),hp=hpAt(state.wave)*1.3;mkEnemy({t,name,sid,hp,max:hp,sp:1.2*(state.spMul||1),p:Math.max(0,(e.p||0)-0.015*(k+1))});}
      fx.push({k:'ring',x:e.x,y:e.y,r:G.cell*1.2,col:'#ff5a4a',t:.7,T:.7});fx.push({k:'txt',x:e.x,y:e.y-G.cell*0.8,s:'2페이즈',col:'#ffb0a8',big:true,t:1.2,T:1.2});
      state.banner={t:1.5,T:1.5,s:'2페이즈',sub:`${g?josa(g.lead,'이','가'):'관장이'} 진심을 낸다`};shake=Math.max(shake,6);sfx('gym');
      introCard('ph2','관장 2페이즈','지방 마지막 관장과 챔피언로드의 강자는 체력이 절반 아래로 내려가면 빨라지고, 기술을 더 자주 쓰고, 부하 셋을 불러요. 대장이 남은 시간 안에 쓰러지도록 화력을 아껴 두세요.');}
    const before=e.gT;const r=bt.apply(this,arguments);
    if(e.ph2&&e.gT>before)e.gT*=0.7;return r;};
})();

// 라이벌 웨이브: 12웨이브와 27웨이브(챔피언로드는 22)에 라이벌이 내 덱과 같은 포켓몬을 데리고 나온다
WMOD.rival={n:'라이벌',hp:1.15,sp:1.1,cnt:1,col:'#ff6f61'};
WM_DESC.rival='라이벌이 내 덱과 같은 포켓몬을 데리고 나와요. 맨 앞 대장은 체력이 많아요. 이기면 코인과 몬스터볼을 줘요.';
const RIVAL_N={kanto:'그린',johto:'실버',hoenn:'하리',champ:'그린'};
const rivalName=()=>RIVAL_N[REGION.id]||'라이벌';
const rivalWaves=()=>MAXW>=40||MAXW>100?[12,27]:[12,22];
function rivalSpawn(w){
  const wm=WMOD.rival,lead=!state.rivalLed,li=pick(state.deck),L=LINES[li],tier=w<15?1:2,sid=L.id[Math.min(tier,L.id.length-1)];
  state.rivalLed=true;
  const hp=hpAt(w)*wm.hp*(lead?6:1);
  mkEnemy({t:L.t,name:lead?`${rivalName()}의 ${L.n[Math.min(tier,L.n.length-1)]}`:L.n[Math.min(tier,L.n.length-1)],sid,hp,max:hp,sp:(lead?0.85:wm.sp)*1.15*(state.spMul||1),big:lead?1.35:1});
  if(typeof dexSeen==='function')dexSeen(sid);
}
(function(){
  const ng=newGame;
  newGame=function(deck,tr,R,opt={}){
    const r=ng.apply(this,arguments);
    if(['adv','endless','rule'].includes(state.mode)&&state.deck&&state.deck.length){
      for(const w of rivalWaves()){if(w>MAXW||gymAt(w))continue;state.wmods[w]='rival';
        const ts=[...new Set(state.deck.map(i=>LINES[i].t[0]))];state.waveTypes[w]=ts.sort(()=>Math.random()-.5).slice(0,2);}}
    dexStartBonus();return r;};
  const sw=startWave;
  startWave=function(){
    const r=sw.apply(this,arguments),w=state.wave;
    if(state.wmods&&state.wmods[w]==='rival'){state.rivalLed=false;
      if(state.banner)state.banner.sub=`라이벌 ${rivalName()} 등장`;}
    return r;};
  const ew=endWave;
  endWave=function(){
    const w=state.wave,riv=state.wmods&&state.wmods[w]==='rival';
    if(riv){const c=15+w;state.coins+=c;state.balls=Math.min(6,(state.balls||0)+1);toast(`라이벌 ${rivalName()}을 이겼어요! 코인 +${c}, 몬스터볼 +1`,2.4);}
    return ew.apply(this,arguments);};
})();

// 도감 보상: 도감을 채울수록 판을 시작할 때 코인과 볼을 더 받는다 (오늘의 도전과 연습은 빼요)
const DEX_REW=[{at:20,n:'시작 코인 +15',ap:s=>{s.coins+=15;}},{at:45,n:'시작 몬스터볼 +1',ap:s=>{s.balls=(s.balls||0)+1;}},
  {at:70,n:'시작 코인 +20',ap:s=>{s.coins+=20;}},{at:100,n:'시작 몬스터볼 +1',ap:s=>{s.balls=(s.balls||0)+1;}},
  {at:130,n:'시작 코인 +25',ap:s=>{s.coins+=25;}},{at:176,n:'시작 마스터볼 1개',ap:s=>{s.master=(s.master||0)+1;}}];
function dexStartBonus(){if(['tut','daily'].includes(state.mode))return;const n=dexCount();DEX_REW.forEach(r=>{if(n>=r.at)r.ap(state);});}

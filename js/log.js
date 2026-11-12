'use strict';
// ───────── 판 기록 ─────────
// 판마다 흐름을 이 기기 안에만 남긴다(최근 30판). '내 기록' 화면에서 보고, 글로 복사해 밸런스 조정에 쓴다.
// 웨이브 표본: [웨이브, 웨이브 끝 남은 코인, 강화 레벨 합, 그 웨이브 최대 필드 적 수]
const LOG_KEY='pkrtd-log',LOG_MAX=30;
let LOGS=(()=>{try{const a=JSON.parse(store.get(LOG_KEY)||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}})();
const saveLogs=()=>store.set(LOG_KEY,JSON.stringify(LOGS));
const MODE_N={adv:'모험',endless:'끝없는 모드',raid:'레이드',daily:'오늘의 도전',rule:'규칙 도전'};
const WHY_N={cap:'필드 초과',boss:'관장 시간 초과',quit:'포기',win:'승리'};
const FEAT_N={caught:'포획',lucky:'운 뽑기 성공',missions:'미션',megas:'메가진화',combos:'특수 조합',wilds:'야생 강적',early:'일찍 부르기',evos:'진화',legends:'전설 합체'};

function logStart(){state.log={t0:Date.now(),play:0,spd:[0,0,0],sp:{s:0,u:0,l:0,b:0},c0:state.coins,w:[],peak:0};}
function logSpend(k,n){const L=state.log;if(L)L.sp[k]=(L.sp[k]||0)+n;}
function logTick(dt){const L=state.log;if(!L)return;L.play+=dt;L.spd[Math.min(3,state.speed||1)-1]+=dt;}
function logWave(){const L=state.log;if(!L)return;L.w.push([state.wave,Math.round(state.coins),state.up.reduce((a,b)=>a+b,0),L.peak]);L.peak=0;}
function whyCode(win,reason){return win?'win':/포기/.test(reason)?'quit':/제한 시간/.test(reason)?'boss':'cap';}
function logEnd(win,reason,reached){
  const L=state.log;if(!L||state.mode==='tut')return;
  const d=new Date(L.t0),p=n=>String(n).padStart(2,'0');
  const top=board.filter(u=>u&&u.dealt).sort((a,b)=>b.dealt-a.dealt).map(u=>def(u).n).filter((n,i,a)=>a.indexOf(n)===i).slice(0,3);
  LOGS.push({d:`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`,
    rg:REGION.id,m:state.mode,rk:state.rank||0,tr:state.trainer?state.trainer.n:'',deck:state.deck.map(i=>LINES[i].n[0]),up:state.up.slice(),
    why:whyCode(win,reason),wv:reached,b:state.badges,k:state.kills,s:state.summons,coin:Math.round(state.coins),c0:L.c0,sp:L.sp,
    cap:fieldCap(),play:Math.round(L.play),spd:L.spd.map(Math.round),f:Object.assign({},state.mst),leg:board.filter(u=>u&&u.tier===4).length,top,w:L.w,cut:!!L.cut});
  while(LOGS.length>LOG_MAX)LOGS.shift();saveLogs();state.log=null;
}

// ── 글로 옮기기 ──
const mmss=s=>`${Math.floor(s/60)}분 ${s%60}초`;
const rgN=id=>(REGIONS.find(r=>r.id===id)||{n:id}).n;
function logText(r,k){
  const tot=r.spd.reduce((a,b)=>a+b,0)||1,pc=v=>Math.round(v/tot*100);
  const f=Object.keys(FEAT_N).filter(x=>r.f[x]).map(x=>FEAT_N[x]+' '+r.f[x]).join(', ')||'없음';
  return `#${k} ${r.d} ${rgN(r.rg)} ${MODE_N[r.m]||r.m}${r.rk?' 랭크'+r.rk:''}${r.tr?' '+r.tr:''} | ${WHY_N[r.why]} ${r.wv}웨이브, 배지 ${r.b}, 필드 한도 ${r.cap||60}${r.cut?' (이어하기로 일부 빠짐)':''}
 시간 ${mmss(r.play)} (1배 ${pc(r.spd[0])}%, 2배 ${pc(r.spd[1])}%, 3배 ${pc(r.spd[2])}%)
 덱 ${r.deck.map((n,i)=>n+' Lv'+r.up[i]).join(', ')} | 전설 ${r.leg} | 많이 싸운 포켓몬 ${r.top.join(', ')||'없음'}
 쓴 코인: 소환 ${r.sp.s}, 강화 ${r.sp.u}, 운 뽑기 ${r.sp.l}, 상점 ${r.sp.b} | 남은 코인 ${r.coin} | 소환 ${r.s}번, 쓰러뜨린 적 ${r.k}
 쓴 기능: ${f}
 웨이브(번호,남은 코인,강화 합,최대 적): ${r.w.map(x=>x.join(',')).join(' / ')}`;
}
function logsText(list){return `포켓몬 랜덤 디펜스 기록 (${list.length}판)\n`+list.map((r,i)=>logText(r,i+1)).join('\n\n');}

// ── 내 기록 화면 ──
function logChart(r){
  const W=300,H=86,w=r.w;if(w.length<2)return '';
  const w0=w[0][0],mx=Math.max(w0+1,w[w.length-1][0]),cm=Math.max(1,...w.map(x=>x[1])),X=v=>((v-w0)/(mx-w0)*(W-8)+4).toFixed(1);
  const line=(i,top)=>w.map(x=>`${X(x[0])},${(H-4-x[i]/top*(H-10)).toFixed(1)}`).join(' ');
  const cap=r.cap||60,fm=Math.max(cap+10,...w.map(x=>x[3])),capY=(H-4-cap/fm*(H-10)).toFixed(1);
  return `<svg class="lchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="웨이브별 남은 코인과 필드 적 수">
   <line x1="4" x2="${W-4}" y1="${capY}" y2="${capY}" class="cap"/>
   <polyline points="${line(3,fm)}" class="lc-foe"/><polyline points="${line(1,cm)}" class="lc-coin"/></svg>
   <div class="lleg"><span class="lc-coin">남은 코인 (최대 ${cm})</span><span class="lc-foe">필드 적 (점선이 한도 ${cap})</span></div>`;
}
function showLog(back){
  let open=-1,wipe=false,copied='',ok=false;
  const draw=()=>{
    const L=LOGS.slice().reverse(),n=L.length,wins=L.filter(r=>r.why==='win').length;
    const why={};L.forEach(r=>{if(r.why!=='win')why[r.why]=(why[r.why]||0)+1;});
    const topWhy=Object.keys(why).sort((a,b)=>why[b]-why[a])[0];
    const avg=n?Math.round(L.reduce((a,r)=>a+r.wv,0)/n):0;
    showLayer(`<div class="scr-head">${backBtn}<h2>내 기록</h2></div>
    <div class="scr-body">${n?`
     <div class="result"><div class="stat"><b class="num">${n}</b><span>기록된 판</span></div><div class="stat"><b class="num">${wins}</b><span>이긴 판</span></div><div class="stat"><b class="num">${avg}</b><span>평균 웨이브</span></div></div>
     ${topWhy?`<p class="sub lsum">가장 많이 진 이유는 ${WHY_N[topWhy]}(${why[topWhy]}판)예요. 최근 ${LOG_MAX}판까지 이 기기에만 남아요.</p>`:''}
     <div class="logs">${L.map((r,i)=>`<div class="lrow ${open===i?'on':''}">
       <button class="lhead" data-o="${i}" aria-expanded="${open===i}"><span class="lres ${r.why==='win'?'win':''}">${r.why==='win'?'승리':'패배'}</span>
        <span class="lmain"><b>${rgN(r.rg)} ${MODE_N[r.m]||''}${r.rk?' R'+r.rk:''} · ${r.wv}웨이브</b><small>${r.d} · ${r.why==='win'?mmss(r.play):WHY_N[r.why]}</small></span></button>
       ${open===i?`<div class="ldet">${logChart(r)}<pre class="ltxt">${logText(r,n-i).split('\n').slice(1,-1).map(s=>s.trim()).join('\n')}</pre></div>`:''}</div>`).join('')}</div>`
     :'<div class="box"><b>아직 남은 기록이 없어요</b><span class="sub">판이 끝날 때마다 웨이브별 코인, 강화, 필드 적 수가 여기에 쌓여요.</span></div>'}
     ${copied?`<textarea class="lcopy" readonly>${copied}</textarea><p class="sub">자동 복사가 막혀서 글을 펼쳐 뒀어요. 길게 눌러 전체 선택한 뒤 복사하세요.</p>`:''}
    </div>
    ${n?`<div class="scr-foot"><button class="gbtn ${wipe?'danger':''}" id="lWipe">${wipe?'한 번 더 누르면 지워요':'기록 지우기'}</button><button class="gbtn summon" id="lCopy">${ok?'복사했어요':open>=0?'이 판 글로 복사':'전체 글로 복사'}</button></div>`:''}`);
    const sh=$('lsheet');sh.querySelector('[data-back]').onclick=back||closeLayer;
    sh.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{const i=+b.dataset.o;open=open===i?-1:i;wipe=false;copied='';ok=false;draw();});
    if(!n)return;
    $('lWipe').onclick=()=>{if(wipe){LOGS=[];saveLogs();open=-1;wipe=false;}else wipe=true;draw();};
    $('lCopy').onclick=()=>{const txt=open>=0?logsText([L[open]]):logsText(LOGS);
      const fail=()=>{copied=txt.replace(/&/g,'&amp;').replace(/</g,'&lt;');draw();const t=sh.querySelector('.lcopy');if(t){t.focus();t.select();}};
      try{navigator.clipboard.writeText(txt).then(()=>{ok=true;draw();},fail);}catch(e){fail();}};
  };
  draw();
}

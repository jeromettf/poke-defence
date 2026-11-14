'use strict';
// ───────── 이미지 ─────────
// 움직이는 스프라이트는 큰 묶음(anim-*.webp) 몇 장에 모아 두고 ANI 좌표로 잘라 그린다
const AIMG=ATLAS.map(()=>new Image()),THIMG=new Image();
// 묶음 그림을 불러오고 디코딩까지 끝낸다. 실패하면 한 번 더 받아 본다.
function loadImg(im,src){return new Promise(res=>{let tried=0;const go=()=>{im.onload=()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).then(()=>res(true));};
  im.onerror=()=>{if(tried++<1)setTimeout(()=>{im.src=src+(src.includes('?')?'&':'?')+'r='+Date.now();},300);else res(false);};im.src=src;};go();});}
// 시작할 때는 정지 썸네일 한 장만 기다린다. 움직이는 묶음은 뒤에서 받고, 오기 전까지는 썸네일로 그린다.
// 묶음은 그룹(0 관동, 1 전설·메가, 2 성도, 3 호연·챔피언로드)으로 나뉘어 있고, 지금 판에 필요한 그룹부터 받는다.
const ALOAD=ATLAS.map(()=>0);let aPrio=[0,1,2,3],aBusy=0,aFailT=false;
function loadSprites(onProg){onProg(0.3);return loadImg(THIMG,THUMBS.src).then(ok=>{onProg(1);bgLoad();return [ok];});}
function nextAtlas(){for(const g of aPrio){const k=ATLAS.findIndex((s,i)=>ALOAD[i]===0&&ATLAS_G[i]===g);if(k>=0)return k;}return -1;}
function bgLoad(){while(aBusy<3){const k=nextAtlas();if(k<0)return;ALOAD[k]=1;aBusy++;
  loadImg(AIMG[k],ATLAS[k]).then(ok=>{ALOAD[k]=ok?2:-1;aBusy--;if(!ok&&!aFailT){aFailT=true;toast('움직이는 그림 일부를 받지 못해 멈춘 그림으로 보여요. 새로고침하면 다시 받아요.',3);}bgLoad();});}}
function wantGroup(g){aPrio=[g,...aPrio.filter(x=>x!==g)];bgLoad();}
const REGION_G={kanto:0,johto:2,hoenn:3,champ:3};
document.documentElement.style.setProperty('--thsz',`${THUMBS.cols*100}% ${THUMBS.rows*100}%`);
document.documentElement.style.setProperty("--thimg",`url("${new URL(THUMBS.src,document.baseURI).href}")`);
const sprTag=id=>{const k=THUMB_IX[id];if(k==null)return '';const c=k%THUMBS.cols,r=(k/THUMBS.cols)|0;
  return `<i class="th" style="background-position:${(c/(THUMBS.cols-1)*100).toFixed(3)}% ${(r/(THUMBS.rows-1)*100).toFixed(3)}%"></i>`;};

// ───────── 유틸 ─────────
const $=id=>document.getElementById(id);
const rnd=n=>Math.floor(Math.random()*n);
const pick=a=>a[rnd(a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const fmt=v=>v>=1000?(v/1000).toFixed(v>=10000?0:1)+'k':v>=100?Math.round(v)+'':v.toFixed(v<10?1:0);
// 타입 아이콘: 색 원 위에 흰 기호
const TYPE_GLYPH={
 '노말':'M12 6.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 3a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
 '불꽃':'M12 4.5c1 2.8 4.6 4.3 4.6 8.4a4.6 4.6 0 0 1-9.2 0c0-1.9.9-3.2 2-4.1.2 1.6 1 2.4 1.9 2.7C10.8 9.3 10.9 6.6 12 4.5z',
 '물':'M12 5c2.9 3.8 4.8 6.3 4.8 9a4.8 4.8 0 0 1-9.6 0c0-2.7 1.9-5.2 4.8-9z',
 '전기':'M13.2 4 6.8 13h4.6l-1 7 6.8-9.6h-4.7z',
 '풀':'M6.5 17.5C6.2 10.5 10.6 6.4 17.8 6.2c.2 7.2-4.1 11.4-11.3 11.3zm2-1.4 6.2-6.2-.7-.7-6.2 6.2z',
 '얼음':'M11.2 4.5h1.6v4.3l3.1-2.6 1 1.2-4.1 3.5v1.3l1.1.6 5-1.8.5 1.5-3.9 1.4 3.9 1.4-.5 1.5-5-1.8-1.1.6v1.3l4.1 3.5-1 1.2-3.1-2.6v4.3h-1.6v-4.3l-3.1 2.6-1-1.2 4.1-3.5v-1.3l-1.1-.6-5 1.8-.5-1.5 3.9-1.4-3.9-1.4.5-1.5 5 1.8 1.1-.6v-1.3L7.1 7.4l1-1.2 3.1 2.6z',
 '격투':'M7.5 9.5a1.5 1.5 0 0 1 3 0V9a1.5 1.5 0 0 1 3 0 1.5 1.5 0 0 1 3 .5v4.2A4.3 4.3 0 0 1 12.2 18h-1A3.7 3.7 0 0 1 7.5 14.3z',
 '독':'M12 5.2a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2zM8.4 15.6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7.4.6a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2z',
 '땅':'M4.5 17.5 9.3 9l3 4.6 2-2.7 5.2 6.6z',
 '비행':'M5 15.2c3.9-1 6.1-3.6 8-8 1 3.4.1 6-1.4 7.5 2.4.1 4.4-.6 7.4-2.3-1.6 3.6-4.8 5.9-8.8 5.9-2 0-3.6-1-5.2-3.1z',
 '에스퍼':'M2.8 12C4.9 8.4 8.1 6.5 12 6.5s7.1 1.9 9.2 5.5c-2.1 3.6-5.3 5.5-9.2 5.5S4.9 15.6 2.8 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
 '벌레':'M12 8.2c2.4 0 4.2 2.2 4.2 5s-1.8 5.3-4.2 5.3-4.2-2.5-4.2-5.3 1.8-5 4.2-5zM9 4.8l2.2 3-.8.6-2.2-3zm6 0 .8.6-2.2 3-.8-.6z',
 '바위':'M6 17.5 7.8 9l4.9-3.3 4.9 3.8 1 8z',
 '고스트':'M6.5 19.2v-7.6a5.5 5.5 0 0 1 11 0v7.6l-1.9-1.6-1.8 1.6-1.8-1.6-1.8 1.6-1.8-1.6zM9.8 10.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm4.4 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z',
 '드래곤':'M5 18.2c3.2-1 5.4-4 6.2-12.2 1 5 3 7.2 7.8 8.1-4 1-6 2.2-7 5.1-2.1-.9-4-1-7-1z',
 '악':'M14.8 4.6a7.6 7.6 0 1 0 4.8 12.8 6.7 6.7 0 0 1-4.8-12.8z',
 '강철':'M12 4.6l6.4 3.7v7.4L12 19.4l-6.4-3.7V8.3zm0 4.6a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z',
 '페어리':'M12 4.5l1.8 5.7 5.7 1.8-5.7 1.8-1.8 5.7-1.8-5.7-5.7-1.8 5.7-1.8z',
};
const ti=t=>`<span class="ti" title="${t}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11.2" fill="${TYPE_COLOR[t]||'#999'}" stroke="rgba(0,0,0,.35)" stroke-width="1"/><path d="${TYPE_GLYPH[t]||''}" fill="#fff" fill-rule="evenodd"/></svg></span>`;
const chip=t=>`<span class="chip" style="background:${TYPE_COLOR[t]}">${ti(t)}${t}</span>`;
const roleTag=r=>`<span class="role" style="background:${ROLE[r].c}">${ROLE[r].n}</span>`;
const josa=(w,a,b)=>{const c=w.charCodeAt(w.length-1)-0xAC00;const bat=c>=0&&c<11172?c%28:0;if(a==='으로')return bat&&bat!==8?w+'으로':w+'로';return bat?w+a:w+b;};
const store={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};

// ───────── 상태 ─────────
let mods,state,board=Array(N).fill(null),enemies=[],fx=[],projs=[],zones=[],synCount={},synB={};
function freshMods(){return {skill:0,pp:0,typeBonus:{},lineBonus:{},weight:{},synRedT:{},t3:0,guardAll:false,dmgAll:0,rateAll:0,rangeAll:0,crit:0,se:2,nve:0.5,bossDmg:0,egg:0,dot:0,chain:0,splash:0,slow:0,stun:0,coinKill:0,intCap:8,intRate:0.1,costMult:1,upCost:1,cap:0,synRed:0,supp:0,catchB:0,weather:0};}
mods=freshMods();
state={phase:'draft',sel:-1,speed:1,paused:false,wave:0,coins:0,deck:[],up:[],taken:[],badges:0};

function eff(a,defs){const c=CHART[a];let m=1;for(const d of defs){if(c[0].includes(d))m*=mods.se;else if(c[1].includes(d))m*=mods.nve;else if(c[2].includes(d))m*=0.25;}return m;}

function def(u){
  if(u.tier===4)return LEGENDS[u.form];
  const L=LINES[u.line];
  if(L.mech==='eevee'&&u.tier>=2){const f=EEVEE[u.form],B=MECH_BASE[f.mech];
    return {n:f.n,id:f.id,t:f.t,role:f.role,mech:f.mech,dmg:B.dmg*1.2,rate:B.rate,range:B.range};}
  const nm=L.n[u.tier-1];
  if(u.mega){const M=MEGA[nm];if(M)return {n:M.n,id:M.id,t:M.t||L.t,role:L.role,mech:L.mech,dmg:L.dmg,rate:L.rate,range:L.range,mega:true};}
  return {n:nm,id:L.id[u.tier-1],t:L.t,role:L.role,mech:L.mech,dmg:L.dmg,rate:L.rate,range:L.range};
}
function effU(u,a,defs){const c=CHART[a],nf=u.s.nveFix||0,sa=u.s.seAdd||0;let m=1;for(const d of defs){if(c[0].includes(d))m*=mods.se+sa;else if(c[1].includes(d))m*=Math.max(mods.nve,nf);else if(c[2].includes(d))m*=Math.max(0.25,nf*0.5);}return m;}
const AURA={auraSkill:[.5,1,1.5],auraAll:[.6,.6,.6],auraRate:[.15,.3,.5],auraDmg:[.2,.4,.7],auraCrit:[.1,.2,.35],auraRange:[.4,.8,1.2],auraType:[.75,1,1],auraGuard:[.15,.3,.5]};
const isAura=m=>m in AURA;
const isDitto=u=>u&&u.tier<4&&LINES[u.line].mech==='ditto';
const keyOf=u=>u.tier===4?'L'+u.form:(LINES[u.line].mech==='eevee'&&u.tier>=2?'e'+u.form:'l'+u.line);
function canMerge(a,b){
  if(!a||!b||a===b||a.tier>=3||b.tier>=3||a.partner||b.partner)return false;
  const da=isDitto(a),db=isDitto(b);
  if(da&&db)return false;
  if(da||db)return true;
  return a.tier===b.tier&&keyOf(a)===keyOf(b);
}
const lineLv=line=>{const k=state.deck.indexOf(line);return k>=0?state.up[k]:0;};

function calcStats(u,i){
  const d=def(u),nat=NATURES[u.nat],tr=Math.min(u.tier,3),sb=1+mods.supp;
  let tm=u.tier===4?1:TIERM[u.tier];
  if(d.mech==='gyara')tm*=u.tier===1?0.1:1.8;
  if(d.mech==='hugepower'&&u.tier>=2)tm*=2;
  const night=isNight(state.wave),nb=night&&d.t.some(t=>t==='고스트'||t==='악')?0.3:0,noct=d.mech==='nocturnal';
  let aR=0,aD=0,aC=0,aG=0,aS=0,cD=0,nveFix=0,seAdd=0,guard=false,bossB=0,pair=0;
  const c=i%COLS,r=(i/COLS)|0;
  if(u.mega)tm*=1.8+0.4*(u.mega-1);
  // 짝꿍: 같은 줄 바로 옆 칸에 같은 계열
  if(u.tier<4)for(const dc of [-1,1]){const cc=c+dc;if(cc<0||cc>=COLS)continue;const v=board[r*COLS+cc];if(v&&v.tier<4&&v.line===u.line&&!isDitto(v))pair++;}
  for(let j=0;j<N;j++){const v=board[j];if(!v||j===i)continue;
    if(v.partner&&v.partner.lv>=7&&Math.max(Math.abs(j%COLS-c),Math.abs(((j/COLS)|0)-r))<=1)aD=Math.max(aD,0.15);
    const m=def(v).mech;if(!isAura(m))continue;
    const vt=Math.min(v.tier,3),rad=vt>=3?2:1,cc=j%COLS,rr=(j/COLS)|0;
    if(Math.max(Math.abs(cc-c),Math.abs(rr-r))>rad)continue;const awM=1+0.15*(v.awk||0),val=AURA[m][vt-1]*(v.mega&&m!=='auraType'?1.4+0.15*(v.mega-1):1)*(m!=='auraType'?awM:1);
    if(m==='auraRate')aR=Math.max(aR,val*sb);
    else if(m==='auraDmg')aD=Math.max(aD,val*sb);
    else if(m==='auraCrit'){aC=Math.max(aC,val*sb);cD=Math.max(cD,[0.25,0.5,1][vt-1]*sb);}
    else if(m==='auraRange')aG=Math.max(aG,val*sb);
    else if(m==='auraSkill')aS=Math.max(aS,val*sb);
    else if(m==='auraAll'){aD=Math.max(aD,0.6*sb*awM);aR=Math.max(aR,0.4*sb*awM);}
    else if(m==='auraType'){nveFix=Math.max(nveFix,val);if(vt>=3)seAdd=0.5;}
    else if(m==='auraGuard'){guard=true;bossB=Math.max(bossB,val*sb);}}
  const syn=Math.max(0,...d.t.map(t=>synB[t]||0));
  const lv=lineLv(u.line);
  const grow=d.mech==='grow'?Math.min(1,(u.grow||0)*0.01):0;
  const lb=mods.lineBonus[u.line]||0,tb=mods.typeBonus[d.t[0]]||0,t3=u.tier>=3?mods.t3:0;
  const it=u.item,P=state.pass||{},pl=u.partner?u.partner.lv:0;
  // 날씨
  let wm=1;const wk=weatherAt(state.wave);if(wk){const W=WEATHER[wk],k=1+mods.weather;if(d.t.some(t=>W.up.includes(t)))wm+=(wk==='sand'?0.35:0.4)*k;if(d.t.some(t=>W.down.includes(t)))wm-=0.25;}
  return {n:d.n,id:d.id,t:d.t,role:d.role,mech:d.mech,
    dmg:d.dmg*tm*nat.dmg*(1+mods.dmgAll)*(1+syn)*(1+aD)*(1+0.3*lv)*(1+grow)*(1+lb)*(1+tb)*(1+t3)*(1+nb)*(noct&&night?2:1)*(it==='orb'?1.35:1)*(1+0.1*pair)*(pl?1+0.12*(pl-1):1)*wm*(P.mew?1.15:1)*(1+0.25*(u.awk||0)),
    rate:d.rate*(1+0.12*(tr-1))*nat.rate*(1+mods.rateAll)*(1+aR)*(1+0.06*lv)*(noct&&!night?1.2:1)*(it==='scarf'?1.3:1)*(pl>=3?1.2:1)*(1+0.1*(u.awk||0)),
    range:(d.range+(d.range?0.25*(tr-1)+aG:0)+(noct&&!night?1:0)+(d.range&&it==='wide'?0.8:0)+(d.range&&u.mega?0.3:0))*nat.range*(1+mods.rangeAll),
    crit:d.mech==='alwayscrit'?1:mods.crit+nat.crit+aC+(d.mech==='crit'?0.15+0.05*tr:0)+(it==='scope'?0.25:0)+(P.latios?0.1:0),
    critM:(d.mech==='crit'?3:2)+cD,
    buff:{aR,aD,aC,aG,aS,nveFix,guard},skB:aS+(it==='left'?0.6:0)+(pl>=10?1:0),nb,nveFix,seAdd,guard:guard||mods.guardAll,bossB,syn,lv,grow,pair,wm};
}
const synTh=t=>{const r=mods.synRed+(mods.synRedT[t]||0);return [Math.max(1,3-r),Math.max(2,5-r)];};
function recalc(){
  const cnt={};state.pass={};for(const u of board)if(u){if(!isDitto(u))for(const t of def(u).t)cnt[t]=(cnt[t]||0)+(u.item==='ribbon'?2:1);if(u.tier===4&&LEGENDS[u.form].pass)state.pass[LEGENDS[u.form].pass]=1;if(typeof dexOwn==='function')dexOwn(def(u).id);}
  synCount=cnt;synB={};for(const t in cnt){const [th1,th2]=synTh(t);synB[t]=cnt[t]>=th2?0.45:cnt[t]>=th1?0.2:0;}
  for(let i=0;i<N;i++){const u=board[i];if(u)u.s=calcStats(u,i);}
  for(let i=0;i<N;i++){const u=board[i];if(u)u.canM=!isDitto(u)&&board.some((v,j)=>j!==i&&canMerge(u,v));}
  renderPanel();renderSyn();renderUps();
}

// ───────── 기하 ─────────
const cv=$('cv'),ctx=cv.getContext('2d'),stage=$('stage');
const G={W:300,H:300,cell:40,bx:0,by:0,m:0,pw:0,ph:0,per:1,dpr:1};
const bg=document.createElement('canvas'),bgc=bg.getContext('2d');
const themeIdx=()=>{const k=Math.max(0,Math.floor((((state&&state.wave)||1)-1)/5));return (typeof THEMES!=='undefined'?k%THEMES.length:Math.min(7,k));};
let bgTheme=-1;
const RATIO=()=>{const cell=(1-2*(0.115+0.025))/COLS;return cell*ROWS+2*(0.115+0.065);};
// 3/4 시점: 시뮬레이션은 위에서 본 '세계 좌표' 그대로 두고, 화면에 그릴 때만 세로를 KY배로 누른다.
// 화면 y = Y0 + (세계 y − Y0)·KY. 포켓몬과 글자는 누르지 않고 세워서 그린다.
const KY=0.78;
const toSY=y=>G.Y0+(y-G.Y0)*KY, toWY=y=>G.Y0+(y-G.Y0)/KY;
function layout(){
  // 캔버스는 화면 전체, 판은 위 HUD와 아래 독 사이 빈 곳의 가운데
  const W=Math.round(stage.clientWidth||390),H=Math.round(stage.clientHeight||844);
  const hudH=($('hud')||{}).offsetHeight||0,dockH=($('dockbar')||{}).offsetHeight||0,zt=hudH+14,zh=Math.max(120,H-hudH-dockH-40);
  const bw=Math.floor(Math.min(W,zh/(RATIO()*KY),560)),side=bw*0.025,top=bw*0.065,g=bw*0.115,cell=(bw-2*(g+side))/COLS,bh=cell*ROWS+2*(g+top);
  const ox=Math.round((W-bw)/2),oy=Math.round(zt+Math.max(0,(zh-bh*KY)/2));
  Object.assign(G,{W,H,bw,bh,ox,oy,Y0:oy,ky:KY,wTop:oy-oy/KY,wH:H/KY,cell,bx:ox+side+g,by:oy+top+g,mx:ox+side+g*0.5,my:oy+top+g*0.5,pw:bw-2*side-g,ph:bh-2*top-g,lw:g*0.72,side,top,dpr:Math.min(window.devicePixelRatio||1,2)});
  // 길: 칸 좌표 점 목록 → 화면 좌표 선분
  const o=(G.bx-G.mx)/cell,pts=REGION.path(o,COLS,ROWS).map(([x,y])=>[G.bx+x*cell,G.by+y*cell]);
  G.pts=pts;G.seg=[];let acc=0;
  for(let k=0;k<pts.length;k++){const [x1,y1]=pts[k],[x2,y2]=pts[(k+1)%pts.length],len=Math.hypot(x2-x1,y2-y1);G.seg.push({x:x1,y:y1,dx:(x2-x1)/len,dy:(y2-y1)/len,len,acc});acc+=len;}
  G.per=acc;
  cv.width=Math.round(W*G.dpr);cv.height=Math.round(H*G.dpr);cv.style.width=W+'px';cv.style.height=H+'px';
  buildBg();
  if(typeof placeOverlays==='function'){placeOverlays();renderRadial();}
}
function pathPos(f){let p=((f%1)+1)%1*G.per;const S=G.seg;let k=S.length-1;for(let j=0;j<S.length;j++)if(p<S[j].acc+S[j].len){k=j;break;}
  const s=S[k],q=p-s.acc;return {x:s.x+s.dx*q,y:s.y+s.dy*q,dx:Math.round(s.dx),dy:Math.round(s.dy)};}
function tracePath(c){c.beginPath();G.pts.forEach(([x,y],k)=>k?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
const cellCenter=i=>({x:G.bx+(i%COLS+0.5)*G.cell,y:G.by+(((i/COLS)|0)+0.5)*G.cell});
// 매끈한 일러스트 배경: 3D 렌더 포켓몬과 같은 해상도로 그린다
function hexA(h,a){const n=parseInt(h.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`;}
function shade(h,k){const n=parseInt(h.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(k>0?v+(255-v)*k:v*(1+k))));return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('');}
function ell(c,x,y,rx,ry){c.beginPath();c.ellipse(x,y,Math.max(.5,rx),Math.max(.5,ry),0,0,7);}
const fg=document.createElement('canvas');
function buildBg(){
  bgTheme=themeIdx();const th=THEMES[bgTheme];
  // 배경은 세계 좌표로 그리고(세로로 더 길게), 화면에 옮길 때 KY배로 누른다
  bg.width=cv.width;bg.height=Math.round(G.wH*G.dpr);fg.width=bg.width;fg.height=bg.height;
  const b=bgc;b.setTransform(G.dpr,0,0,G.dpr,0,-G.wTop*G.dpr);b.imageSmoothingEnabled=true;
  const f=fg.getContext('2d');f.setTransform(G.dpr,0,0,G.dpr,0,-G.wTop*G.dpr);f.clearRect(0,G.wTop,G.W,G.wH);
  const {W,cell,mx,my,pw,ph,lw}=G,H=G.wH,hl=lw/2;
  let seed=11+bgTheme*97;const rr=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const [g0,g1,gl,gd]=th.g,[p0,p1,pl,pd]=th.p;
  // 바닥: 단색 위에 넓고 옅은 얼룩
  b.save();b.translate(0,G.wTop);
  b.fillStyle=g0;b.fillRect(0,0,W,H);
  for(let k=0;k<20;k++){const x=rr()*W,y=rr()*H,r=cell*(0.8+rr()*1.6);const gr=b.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,hexA(rr()<.5?gl:gd,0.18));gr.addColorStop(1,hexA(g0,0));b.fillStyle=gr;b.fillRect(x-r,y-r,r*2,r*2);}
  groundMotif(b,th,rr,W,H,cell);
  b.restore();
  if(th.island&&REGION.path===RECT_PATH){const m=G.lw*0.5+cell*0.08,x=G.mx+m,y=G.my+m,w=G.pw-m*2,h=G.ph-m*2;
    b.save();b.beginPath();b.roundRect(x-4,y-4,w+8,h+8,cell*0.35);b.fillStyle=th.island.shore;b.fill();
    b.beginPath();b.roundRect(x,y,w,h,cell*0.3);b.fillStyle=th.island.ground;b.fill();b.clip();
    b.lineCap='round';for(let i=0;i<w*h/(cell*cell)*2.5;i++){const px=x+rr()*w,py=y+rr()*h,q=cell*0.07;b.strokeStyle=hexA(rr()<.5?th.island.dark:th.island.light,0.55);b.lineWidth=1.4;b.beginPath();b.moveTo(px-q*.6,py);b.quadraticCurveTo(px-q*.5,py-q,px-q*.9,py-q*1.5);b.moveTo(px+q*.4,py);b.quadraticCurveTo(px+q*.4,py-q,px+q*.8,py-q*1.4);b.stroke();}
    b.restore();}
  gymCrest(b,th);
  // 가장자리: 판 둘레만
  b.save();b.translate(G.ox,G.oy);border(b,th,rr,G.bw,G.bh,cell);b.restore();
  drawProps(b,th,rr);gradeBg(b,th);
  // 길: 둥근 모서리 띠
  b.save();b.lineJoin='round';tracePath(b);b.shadowColor='rgba(0,0,0,.28)';b.shadowBlur=6;b.shadowOffsetY=2;b.lineWidth=lw+3;b.strokeStyle=hexA(pd,0.55);b.stroke();b.restore();
  b.save();b.lineJoin='round';tracePath(b);b.lineWidth=lw;b.strokeStyle=p0;b.stroke();b.restore();
  {const t=document.createElement('canvas');t.width=bg.width;t.height=bg.height;const tc=t.getContext('2d');tc.setTransform(G.dpr,0,0,G.dpr,0,-G.wTop*G.dpr);
   pathMotif(tc,th,rr,cell);tc.globalCompositeOperation='destination-in';tc.lineJoin='round';tracePath(tc);tc.lineWidth=lw;tc.strokeStyle='#000';tc.stroke();
   b.save();b.setTransform(1,0,0,1,0,0);b.drawImage(t,0,0);b.restore();}
  // 시작점 풀숲
  if(th.tall)tallGrass(b,f,rr,mx-hl,my-hl,lw*2.4,lw*1.9);
  // 빈 발판 자리
  for(let i=0;i<N;i++){if(!OPEN[i])continue;const c=cellCenter(i),cy=c.y+cell*0.18,rx=cell*0.42,ry=rx*0.56;ell(b,c.x,cy,rx,ry);b.fillStyle=hexA(gd,0.16);b.fill();b.lineWidth=1;b.strokeStyle=hexA(gd,0.22);b.stroke();}
  buildPlat(th);
}
// 체육관마다 판 가운데에 그 관장 타입의 문장을 옅게 새긴다 (배경과 함께 3/4 시점으로 눌려요)
const TPATH={};const tPath=t=>TPATH[t]||(TPATH[t]=new Path2D(TYPE_GLYPH[t]||''));
function gymCrest(b,th){
  const gm=(typeof GYMS!=='undefined')&&GYMS[bgTheme];if(!gm||!gm.t)return;
  const cx=G.ox+G.bw/2,cy=G.oy+G.bh/2,r=Math.min(G.bw,G.bh)*0.3,gd=th.g[3],col=gm.col||TYPE_COLOR[gm.t[0]];
  b.save();
  b.beginPath();b.arc(cx,cy,r,0,7);b.fillStyle=hexA(col,0.10);b.fill();
  b.lineWidth=G.cell*0.1;b.strokeStyle=hexA(gd,0.28);b.stroke();
  b.beginPath();b.arc(cx,cy,r*0.86,0,7);b.lineWidth=G.cell*0.04;b.strokeStyle=hexA(col,0.35);b.stroke();
  b.translate(cx-r*0.75,cy-r*0.75);b.scale(r*1.5/24,r*1.5/24);b.fillStyle=hexA(gd,0.3);b.fill(tPath(gm.t[0]),'evenodd');
  b.restore();
}
function groundMotif(b,th,rr,W,H,cell){
  const [g0,g1,gl,gd]=th.g,n=Math.round(W*H/(cell*cell)*1.6);
  const k=th.ground;
  if(k==='grass'){b.lineCap='round';for(let i=0;i<n*2;i++){const x=rr()*W,y=rr()*H,s=cell*0.07;b.strokeStyle=hexA(rr()<.5?gd:gl,0.55);b.lineWidth=1.4;b.beginPath();b.moveTo(x-s*.6,y);b.quadraticCurveTo(x-s*.5,y-s,x-s*.9,y-s*1.5);b.moveTo(x+s*.4,y);b.quadraticCurveTo(x+s*.4,y-s,x+s*.8,y-s*1.4);b.stroke();}
    if(th.flowers)for(let i=0;i<n*0.9;i++){const x=rr()*W,y=rr()*H,r=cell*0.04,c=['#ff8fa3','#ffe27a','#ffffff'][i%3];for(let q=0;q<5;q++){const a=q*1.2566;ell(b,x+Math.cos(a)*r,y+Math.sin(a)*r,r*0.75,r*0.75);b.fillStyle=c;b.fill();}ell(b,x,y,r*0.55,r*0.55);b.fillStyle='#f2a33a';b.fill();}}
  else if(k==='rock'){for(let i=0;i<n;i++){const x=rr()*W,y=rr()*H,r=cell*(0.04+rr()*0.07);ell(b,x,y+r*0.3,r*1.1,r*0.55);b.fillStyle=hexA(gd,0.5);b.fill();ell(b,x,y,r,r*0.7);const gr=b.createLinearGradient(x,y-r,x,y+r);gr.addColorStop(0,gl);gr.addColorStop(1,g1);b.fillStyle=gr;b.fill();}}
  else if(k==='water'){b.lineCap='round';for(let i=0;i<n*1.2;i++){const x=rr()*W,y=rr()*H,w=cell*(0.12+rr()*0.18);b.strokeStyle=hexA(gl,0.55);b.lineWidth=1.6;b.beginPath();b.moveTo(x-w,y);b.quadraticCurveTo(x,y-w*0.25,x+w,y);b.stroke();}}
  else if(k==='metal'){const s=cell*0.8;for(let y=0;y<H;y+=s)for(let x=0;x<W;x+=s){b.fillStyle=hexA(gl,0.25);b.fillRect(x+1,y+1,s-2,2);b.fillStyle=hexA(gd,0.35);b.fillRect(x,y+s-1,s,1);b.fillRect(x+s-1,y,1,s);for(const [a,c] of [[.12,.12],[.88,.12],[.12,.88],[.88,.88]]){ell(b,x+s*a,y+s*c,1.6,1.6);b.fillStyle=hexA(gd,0.55);b.fill();}}}
  else if(k==='swamp'){for(let i=0;i<n*0.5;i++){const x=rr()*W,y=rr()*H,r=cell*(0.05+rr()*0.08);ell(b,x,y,r,r);b.strokeStyle=hexA(gl,0.4);b.lineWidth=1.2;b.stroke();ell(b,x-r*0.35,y-r*0.35,r*0.2,r*0.2);b.fillStyle=hexA('#ffffff',0.35);b.fill();}
    b.strokeStyle=hexA(gd,0.35);b.lineWidth=2;b.setLineDash([cell*0.25,cell*0.15]);for(let k2=0;k2<5;k2++){const y=rr()*H;b.beginPath();b.moveTo(0,y);b.lineTo(W,y);b.stroke();}b.setLineDash([]);}
  else if(k==='gym'){const s=cell*0.9;for(let y=0;y<H;y+=s)for(let x=0;x<W;x+=s){if(((x+y)/s|0)&1){b.fillStyle=hexA(g1,0.6);b.fillRect(x,y,s,s);}b.fillStyle=hexA(gl,0.5);b.fillRect(x,y,s,1);b.fillStyle=hexA(gd,0.25);b.fillRect(x,y+s-1,s,1);}}
  else if(k==='wood'){const s=cell*0.42;for(let y=0;y<H;y+=s){b.fillStyle=hexA(gd,0.35);b.fillRect(0,y,W,1.2);b.fillStyle=hexA(gl,0.25);b.fillRect(0,y+1.2,W,1);let x=-rr()*cell*2;while(x<W){x+=cell*(1.2+rr()*1.4);b.fillStyle=hexA(gd,0.35);b.fillRect(x,y,1.2,s);}
      for(let q=0;q<W/cell;q++){const x2=rr()*W;ell(b,x2,y+s*0.5,cell*0.06,s*0.12);b.strokeStyle=hexA(gd,0.25);b.lineWidth=1;b.stroke();}}}
  else if(k==='sand'){for(let i=0;i<n*2.5;i++){const x=rr()*W,y=rr()*H;ell(b,x,y,0.9,0.9);b.fillStyle=hexA(rr()<.5?gd:gl,0.6);b.fill();}
    b.lineCap='round';for(let i=0;i<n*0.25;i++){const x=rr()*W,y=rr()*H,w=cell*(0.3+rr()*0.4);b.strokeStyle=hexA(gl,0.6);b.lineWidth=1.4;b.beginPath();b.moveTo(x-w,y);b.quadraticCurveTo(x,y-w*0.18,x+w,y);b.stroke();}}
  else if(k==='ice'){b.lineCap='round';for(let i=0;i<n*0.2;i++){let x=rr()*W,y=rr()*H;b.beginPath();b.moveTo(x,y);for(let q=0;q<3;q++){x+=(rr()-.5)*cell*0.5;y+=(rr()-.5)*cell*0.5;b.lineTo(x,y);}b.strokeStyle=hexA(gd,0.4);b.lineWidth=1;b.stroke();}
    for(let i=0;i<n*0.5;i++){const x=rr()*W,y=rr()*H,r=cell*0.03;b.fillStyle=hexA('#ffffff',0.8);b.fillRect(x-r,y-0.5,r*2,1);b.fillRect(x-0.5,y-r,1,r*2);}}
  else if(k==='volcano'){b.lineCap='round';for(let i=0;i<n*0.18;i++){let x=rr()*W,y=rr()*H;b.beginPath();b.moveTo(x,y);for(let q=0;q<4;q++){x+=(rr()-.5)*cell*0.35;y+=rr()*cell*0.2;b.lineTo(x,y);}b.save();b.shadowColor='#ff7a2a';b.shadowBlur=6;b.strokeStyle='#ff9a4a';b.lineWidth=1.6;b.stroke();b.restore();}
    for(let i=0;i<n*0.6;i++){const x=rr()*W,y=rr()*H,r=cell*0.05;ell(b,x,y,r,r*0.6);b.fillStyle=hexA(gd,0.55);b.fill();}}
}
function border(b,th,rr,W,H,cell){
  const top=G.top,side=G.side;
  if(th.border==='trees'){
    const tree=(x,y,r)=>{ell(b,x,y+r*0.95,r*0.9,r*0.25);b.fillStyle='rgba(0,0,0,.25)';b.fill();b.fillStyle='#6b4a2a';b.fillRect(x-r*0.12,y+r*0.4,r*0.24,r*0.5);
      ell(b,x,y,r,r*0.9);const gr=b.createRadialGradient(x-r*0.35,y-r*0.4,r*0.1,x,y,r);gr.addColorStop(0,'#6fc266');gr.addColorStop(0.6,'#3f8f45');gr.addColorStop(1,'#2a6a33');b.fillStyle=gr;b.fill();};
    const r=top*0.55;for(let x=-r;x<W+r*2;x+=r*1.25){tree(x+rr()*3,top*0.42,r);tree(x+r*0.6,H-top*0.5,r);}
    for(let y=top;y<H-top;y+=r*1.1){tree(-side*0.2,y,side*1.6);tree(W+side*0.2,y,side*1.6);}}
  else if(th.border==='wall'){const wall=(y,h,down)=>{const gr=b.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'#6c6774');gr.addColorStop(1,'#4b4753');b.fillStyle=gr;b.fillRect(0,y,W,h);b.fillStyle='rgba(0,0,0,.35)';b.fillRect(0,down?y+h-3:y,W,3);
      b.fillStyle='rgba(255,255,255,.08)';for(let x=0;x<W;x+=cell*0.7)b.fillRect(x,y+3,1,h-6);};
    wall(0,top,true);wall(H-top,top,false);b.fillStyle='#4b4753';b.fillRect(0,0,side,H);b.fillRect(W-side,0,side,H);}
  else if(th.border==='rocks'){const rock=(x,y,r)=>{ell(b,x,y+r*0.4,r*1.1,r*0.5);b.fillStyle='rgba(0,0,0,.3)';b.fill();ell(b,x,y,r,r*0.8);const gr=b.createLinearGradient(x,y-r,x,y+r);gr.addColorStop(0,'#7a5a4c');gr.addColorStop(1,'#3a2a24');b.fillStyle=gr;b.fill();};
    const r=top*0.5;for(let x=-r;x<W+r*2;x+=r*1.3){rock(x+rr()*4,top*0.45,r*(0.8+rr()*0.3));rock(x+r*0.6,H-top*0.45,r*(0.8+rr()*0.3));}
    for(let y=top;y<H-top;y+=r){rock(-side*0.1,y,side*1.4);rock(W+side*0.1,y,side*1.4);}}
}
function pathMotif(b,th,rr,cell){
  const [p0,p1,pl,pd]=th.p,{mx,my,pw,ph,lw,W,H}=G,hl=lw/2,k=th.path;
  const along=(fn,step)=>{for(let d=0;d<G.per;d+=step){const q=pathPos(d/G.per);fn(q.x,q.y,q.dx,q.dy);}};
  if(k==='dirt'||k==='ash'||k==='stone'){along((x,y,dx,dy)=>{const o=(rr()-.5)*lw*0.75,px=x+(dy?o:0),py=y+(dx?o:0),r=cell*(0.025+rr()*0.03);ell(b,px,py,r*1.3,r);b.fillStyle=hexA(rr()<.5?pl:pd,0.6);b.fill();},cell*0.12);
    if(k==='stone')along((x,y,dx,dy)=>{b.strokeStyle=hexA(pd,0.35);b.lineWidth=1;b.beginPath();b.moveTo(x-dy*hl,y-dx*hl);b.lineTo(x+dy*hl,y+dx*hl);b.stroke();},lw*0.9);}
  else if(k==='bridge'){along((x,y,dx,dy)=>{const w=lw*0.16;b.fillStyle=hexA(pd,0.45);if(dx)b.fillRect(x-1,y-hl,2,lw);else b.fillRect(x-hl,y-1,lw,2);},lw*0.32);
    b.fillStyle=hexA(pl,0.35);along((x,y,dx,dy)=>{if(dx)b.fillRect(x,y-hl+2,lw*0.3,1.5);else b.fillRect(x-hl+2,y,1.5,lw*0.3);},lw*0.32);}
  else if(k==='catwalk'){const s=lw*0.35;along((x,y,dx,dy)=>{b.fillStyle=pd;if(dx){b.fillRect(x,y-hl,s*0.5,lw*0.18);b.fillRect(x,y+hl-lw*0.18,s*0.5,lw*0.18);}else{b.fillRect(x-hl,y,lw*0.18,s*0.5);b.fillRect(x+hl-lw*0.18,y,lw*0.18,s*0.5);}},s);}
  else if(k==='carpet'){b.lineJoin='round';tracePath(b);b.lineWidth=lw*0.64+1.6;b.strokeStyle='#f2c14e';b.stroke();tracePath(b);b.lineWidth=lw*0.64-1.6;b.strokeStyle=p0;b.stroke();}
  else if(k==='arrows'){const sz=lw*0.72,arrow=(x,y,dx,dy)=>{b.beginPath();b.roundRect(x-sz/2,y-sz/2,sz,sz,sz*0.18);b.fillStyle=hexA(p1,0.55);b.fill();b.strokeStyle=hexA(pd,0.6);b.lineWidth=1;b.stroke();
      const a=sz*0.26;b.beginPath();b.moveTo(x+dx*a,y+dy*a);b.lineTo(x-dx*a*0.5-dy*a,y-dy*a*0.5-dx*a);b.lineTo(x-dx*a*0.5+dy*a,y-dy*a*0.5+dx*a);b.closePath();b.fillStyle='rgba(255,255,255,.6)';b.fill();};
    const side=(x0,y0,len,dx,dy)=>{const n=Math.max(1,Math.floor((len-lw)/(lw*1.7)));for(let q=0;q<n;q++){const t=lw*0.5+(len-lw)*(q+0.5)/n;arrow(x0+dx*t,y0+dy*t,dx,dy);}};
    for(const sg of G.seg)side(sg.x,sg.y,sg.len,sg.dx,sg.dy);}
}
function tallGrass(b,f,rr,x0,y0,w,h){
  const s=G.cell*0.16,pts=[];
  for(let y=y0+s*0.5;y<y0+h;y+=s*0.7)for(let x=x0+s*0.5;x<x0+w;x+=s*0.7){const u=(x-x0)/w,v=(y-y0)/h;if(u*u+v*v<0.95+rr()*0.12)pts.push([x+(rr()-.5)*s*0.3,y+(rr()-.5)*s*0.3]);}
  b.fillStyle='rgba(0,0,0,.22)';for(const [x,y] of pts){ell(b,x,y+s*0.25,s*0.62,s*0.5);b.fill();}
  b.fillStyle='#2f6f34';for(const [x,y] of pts){ell(b,x,y,s*0.6,s*0.52);b.fill();}
  f.lineCap='round';
  for(const [x,y] of pts){
    for(const [ox,lean,c] of [[-s*0.22,-0.35,'#3f9a40'],[0,0.05,'#5cb552'],[s*0.22,0.4,'#3f9a40']]){f.strokeStyle=c;f.lineWidth=2;f.beginPath();f.moveTo(x+ox,y+s*0.3);f.quadraticCurveTo(x+ox+lean*s*0.3,y-s*0.2,x+ox+lean*s*0.8,y-s*0.65);f.stroke();}
    f.strokeStyle='#8fd77c';f.lineWidth=1;f.beginPath();f.moveTo(x,y-s*0.2);f.lineTo(x+s*0.04,y-s*0.6);f.stroke();}
}
const PLAT={};
function buildPlat(th){
  const pk=th.plat,d=G.dpr,rx=G.cell*0.42,ry=rx*0.56,dep=G.cell*0.13,W=Math.ceil((rx*2+8)*d),H=Math.ceil((ry*2+dep+10)*d),cx=W/d/2,cy=ry+4;
  PLAT.W=W;PLAT.H=H;PLAT.cy=cy;PLAT.d=d;
  const mk=fn=>{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.scale(d,d);fn(x);return c;};
  PLAT.base=mk(x=>{
    ell(x,cx,cy+dep+1.5,rx+1,ry+1);x.fillStyle='rgba(0,0,0,.28)';x.fill();
    ell(x,cx,cy+dep,rx,ry);x.fillStyle=pk.side;x.fill();x.fillRect(cx-rx,cy,rx*2,dep);
    ell(x,cx,cy,rx,ry);const gr=x.createLinearGradient(0,cy-ry,0,cy+ry);gr.addColorStop(0,shade(pk.top,0.18));gr.addColorStop(1,shade(pk.top,-0.08));x.fillStyle=gr;x.fill();
    x.lineWidth=1.2;x.strokeStyle=hexA(pk.rim,0.9);x.stroke();
    x.strokeStyle=hexA(pk.tex,0.9);x.fillStyle=hexA(pk.tex,0.9);x.lineWidth=1.2;
    if(pk.kind==='metal'||pk.kind==='stone'){ell(x,cx,cy,rx*0.62,ry*0.62);x.stroke();}
    else if(pk.kind==='warp'){ell(x,cx,cy,rx*0.62,ry*0.62);x.stroke();ell(x,cx,cy,rx*0.32,ry*0.32);x.stroke();}
    else if(pk.kind==='grass'){x.lineCap='round';for(const [a,c] of [[-.5,0],[.1,-.3],[.45,.3],[-.15,.45]]){const px=cx+a*rx,py=cy+c*ry;x.beginPath();x.moveTo(px-1.5,py+1.5);x.lineTo(px,py-1.5);x.lineTo(px+1.5,py+1.5);x.stroke();}}
    else if(pk.kind==='rock'){ell(x,cx-rx*0.4,cy,rx*0.13,ry*0.25);x.fill();ell(x,cx+rx*0.35,cy+ry*0.3,rx*0.09,ry*0.18);x.fill();}
    else if(pk.kind==='sand'){for(const [a,c] of [[-.5,.1],[-.1,-.3],[.3,.2],[.55,-.1],[.05,.5]]){ell(x,cx+a*rx,cy+c*ry,0.9,0.9);x.fill();}}
  });
  const ring=(col,w)=>mk(x=>{ell(x,cx,cy,rx+0.5,ry+0.5);x.lineWidth=w+2;x.strokeStyle='rgba(20,24,22,.55)';x.stroke();x.lineWidth=w;x.strokeStyle=col;x.stroke();});
  PLAT.r2=ring('#5aa0ff',2.6);PLAT.r3=ring('#b678ff',3);PLAT.r4=ring('#ffd257',3.2);
  PLAT.buff=mk(x=>{ell(x,cx,cy+1,rx+3,ry+3);const gr=x.createRadialGradient(cx,cy,ry,cx,cy,rx+3);gr.addColorStop(0,'rgba(140,255,150,.0)');gr.addColorStop(1,'rgba(140,255,150,.55)');x.fillStyle=gr;x.fill();});
}
function drawTiles(){
  if(!PLAT.base)return;const w=PLAT.W/PLAT.d,h=PLAT.H/PLAT.d;ctx.imageSmoothingEnabled=true;
  for(let i=0;i<N;i++){const u=board[i];if(!u)continue;const c=cellCenter(i),x=c.x-w/2,y=c.y+G.cell*0.18-PLAT.cy;
    const b=u.s&&u.s.buff;if(b&&(b.aD||b.aR||b.aC||b.aG||b.nveFix||b.guard))ctx.drawImage(PLAT.buff,x,y,w,h);
    ctx.drawImage(PLAT.base,x,y,w,h);
    if(u.tier>=2){if(u.tier===4)ctx.globalAlpha=0.75+0.25*Math.sin(clock*4);ctx.drawImage(u.tier===4?PLAT.r4:u.tier===3?PLAT.r3:PLAT.r2,x,y,w,h);ctx.globalAlpha=1;}
  }
}
function rrectC(b,x,y,w,h,r){b.beginPath();b.moveTo(x+r,y);b.arcTo(x+w,y,x+w,y+h,r);b.arcTo(x+w,y+h,x,y+h,r);b.arcTo(x,y+h,x,y,r);b.arcTo(x,y,x+w,y,r);b.closePath();}

// ───────── 진행 ─────────
const WMOD={fast:{n:'빠른 무리',hp:0.7,sp:2.0,cnt:1.6,col:'#6fd3ff'},swarm:{n:'대군',hp:0.55,sp:1.15,cnt:3.0,col:'#ffb347'},tank:{n:'단단한 적',hp:4,sp:0.72,cnt:0.5,col:'#c9a0ff',big:1.3}};
// 웨이브 타입표. seed가 있으면(오늘의 도전) 같은 날 같은 순서. 끝없는 모드와 레이드는 넉넉히 만들어 둔다
function genWaves(seed){const R=seed?mulberry(seed):Math.random,pk=a=>a[Math.floor(R()*a.length)],w=[null],m=[null],L=Math.min(400,MAXW);
  for(let i=1;i<=L;i++){const g=gymAt(i);if(g){w.push(g.t);m.push(null);continue;}
  const a=isNight(i)&&R()<0.6?pk(['고스트','악']):pk(TYPES);if(i>=12&&R()<0.45){let b=pk(TYPES);while(b===a)b=pk(TYPES);w.push([a,b]);}else w.push([a]);
  m.push(i>=6&&R()<0.5?pk(['fast','swarm','tank']):null);}genWaves.m=m;return w;}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const wmodAt=w=>state.wmods&&state.wmods[w]?WMOD[state.wmods[w]]:null;
function newGame(deck,tr,R=REGION,opt={}){
  wantGroup(1);wantGroup(0);wantGroup(REGION_G[R.id]||0);
  setRegion(R);layout();mods=freshMods();
  state={info:state.info,phase:'play',deck,up:deck.map(()=>0),coins:100,wave:0,waveT:0,waveLen:20,spawnLeft:0,spawnT:0,spawnGap:1,summons:0,speed:state.speed||1,paused:false,
    region:R.id,mode:opt.mode||'adv',rank:opt.rank||0,rules:opt.rules||[],seed:opt.seed||0,raidLeg:opt.raidLeg,daily:opt.daily||null,
    boss:null,bossDown:false,taken:[],takenNames:[],badges:0,kills:0,sel:-1,eid:0};
  if(state.mode==='endless')MAXW=999;if(state.mode==='raid')MAXW=999;
  initRun(true);
  state.waveTypes=genWaves(opt.seed);state.wmods=genWaves.m;
  board=Array(N).fill(null);enemies=[];fx=[];projs=[];zones=[];
  if(tr){tr.ap(mods,deck,state);state.trainer=tr;state.trIdx=TRAINERS.indexOf(tr);}
  applySupport(opt.support);
  placePartner();logStart();
  hudWave=-1;recalc();startWave();closeModal();
  oakIntro();
}
function startWave(){
  saveRun();
  const wasNight=isNight(state.wave),wasW=weatherAt(state.wave),oldVar=variantFor(state.wave);state.wave++;
  if(variantFor(state.wave)!==oldVar&&REGION.variants.length>1)switchVariant(variantFor(state.wave));
  if(state.wave>1&&!state.noInt){const it=Math.min(mods.intCap,Math.floor(state.coins*mods.intRate));if(it>0){state.coins+=it;toast(`이자 +${it}`,1.1);}}
  if(state.wave>1&&state.pass&&state.pass.jirachi){state.coins+=25;}
  for(const u of board)if(u)u.sb=0;
  state.waveKills=0;if((state.wave-1)%5===0)state.wildReady=true;
  if(state.mode==='adv'||state.mode==='rule')featCheckWave(state.wave);
  let gl=0;for(const u of board)if(u&&u.tier<4&&def(u).mech==='glutton')gl+=[3,7,15][Math.min(u.tier,3)-1];
  if(gl&&state.wave>1){state.coins+=gl;toast(`먹보 코인 +${gl}`,1);}
  const w=state.wave,g=gymAt(w);
  const wm=wmodAt(w);state.spawnLeft=g?Math.floor(countAt(w)/2):Math.round(countAt(w)*(wm?wm.cnt:1));
  state.spawnGap=12/Math.max(1,state.spawnLeft);state.spawnT=0;
  state.waveT=g?Math.max(20,(g.raid?45:50)+(state.gymT||0)+(state.pass&&state.pass.dialga?10:0)):20;state.waveLen=state.waveT;
  if(g){spawnEnemy(true);state.cut={t:1.8,T:1.8,g};camP=camT=1.2;state.cutMsg=`${g.lead}의 ${g.n}. ${g.desc}`;shake=4;sfx('gym');}
  else state.banner={t:1.2,T:1.2,s:`WAVE ${w}`,sub:wmodAt(w)?wmodAt(w).n+(((w-1)%5===0)?' · '+THEMES[themeIdx()].n:''):(w-1)%5===0?THEMES[themeIdx()].n:(gymAt(w+1)?'다음은 관장전':'')};
  if(REGION.rule==='daynight'&&isNight(w)!==wasNight&&w>1){recalc();if(state.banner)state.banner.sub=(isNight(w)?'밤이 됐어요':'날이 밝았어요')+' · '+THEMES[themeIdx()].n;}
  {const wk=weatherAt(w);if(wk&&wk!==wasW){recalc();if(state.banner)state.banner.sub='날씨: '+WEATHER[wk].n+' · '+THEMES[themeIdx()].n;introCard('w_'+wk,'날씨: '+WEATHER[wk].n,WEATHER[wk].d+'. 5웨이브 동안 이어져요.');}}
  if(wm)introCard('wm_'+state.wmods[w],wm.n,WM_DESC[state.wmods[w]]);
  if(isNight(w)&&!wasNight)introCard('night','밤',REGION.ruleDesc);
  recalc();
  state.phase='play';
}
function mkEnemy(o){
  const e=Object.assign({zapT:0,id:++state.eid,p:0,slowT:0,slowV:0,stunT:0,sleep:false,poisT:0,poisD:0,burnT:0,burnD:0,debT:0,debV:0,age:0,x:0,y:0,dx:1,dead:false,boss:false,gim:null,gT:4,smokeT:0},o);
  const q=pathPos(e.p);e.x=q.x;e.y=q.y;enemies.push(e);return e;
}
function spawnEnemy(isBoss){
  const w=state.wave,t=state.waveTypes[w];
  const spm=state.spMul||1;
  if(isBoss){const g=gymAt(w),hp=hpAt(w)*g.hp*0.85*(state.bossMul||1);
    state.boss=mkEnemy({t:g.t,name:g.n,sid:g.id,hp,max:hp,sp:g.sp*spm,boss:true,gim:g.gim,gT:{seed:4,paralyze:6,recover:8,tailwind:5,hypnosis:5,detect:4,hail:6,ddance:10,bulk:8,truant:3}[g.gim]||7,sp0:g.sp*spm});
    if(typeof dexSeen==='function')dexSeen(g.id);
    return;}
  const wm=wmodAt(w),hp=hpAt(w)*(wm?wm.hp:1),[name,sid]=pick(ENEMY[t[0]]);
  mkEnemy({t,name,sid,hp,max:hp,sp:(wm?wm.sp:1.15)*spm,big:wm&&wm.big?wm.big:1,fast:wm===WMOD.fast});
  if(typeof dexSeen==='function')dexSeen(sid);
}
function endWave(){
  const w=state.wave;state.coins+=8+w;logWave();if(typeof waveCoins==="function")waveCoins(8+w);
  const g=gymAt(w);
  partnerXp(8);
  if(g){g.ap(mods);state.badges++;state.balls=Math.min(6,(state.balls||0)+1);recalc();noteBadge();gymStars(g);featCheckGym();}
  if(w>=MAXW)return finish(true,REGION.win);
  if(g||w===2)openReward(g);else startWave();
}
const fieldCap=()=>(state.capBase||60)+mods.cap;

function update(dt){
  const w=state.wave;
  if(state.hold)state.waveT+=dt;
  state.waveT-=dt;if(state.windT>0)state.windT-=dt;if(state.hailT>0)state.hailT-=dt;
  if(state.spawnLeft>0&&!state.hold){state.spawnT-=dt;while(state.spawnT<=0&&state.spawnLeft>0){spawnEnemy(false);state.spawnLeft--;state.spawnT+=state.spawnGap;}}
  for(const e of enemies){
    if(e.dead)continue;e.age+=dt;
    if(e.yawnT>0){e.yawnT-=dt;if(e.yawnT<=0&&!e.boss){e.stunT=Math.max(e.stunT,e.yawnS||3);e.sleep=true;}}
    if(e.confT>0)e.confT-=dt;if(e.markT>0)e.markT-=dt;if(e.frzT>0)e.frzT-=dt;
    if(e.zapT>0)e.zapT-=dt;
    const v=e.stunT>0||e.rest?0:e.sp*(1-(e.slowT>0?e.slowV:0))*(e.confT>0?-0.8:1)*(state.windT>0?1.5:1)*(state.pass.lugia?0.88:1)*(weatherAt(w)==='hail'?0.9:1);
    e.p=(e.p+v*G.cell/G.per*dt+1)%1;const q=pathPos(e.p);if(q.dx)e.dx=q.dx;e.mdx=q.dx;e.mdy=q.dy;e.x=q.x;e.y=q.y;
    e.slowT-=dt;e.debT-=dt;if(e.hitT>0)e.hitT-=dt;if(e.kb>0)e.kb=Math.max(0,e.kb-dt*G.cell*1.2);if(e.dT>0){e.dT-=dt;if(e.dT<=0)flushPop(e);}if(e.popT>0)e.popT-=dt;if(e.critT>0)e.critT-=dt;if(e.stunT>0){e.stunT-=dt;if(e.stunT<=0)e.sleep=false;}
    if(e.poisT>0){e.poisT-=dt;dmgRaw(e,e.poisD*dt,null);}
    if(e.burnT>0&&!e.dead){e.burnT-=dt;dmgRaw(e,e.burnD*dt,null);}
    if(e.boss&&!e.dead)bossTick(e,dt);
  }
  for(const z of zones){z.t-=dt;if(z.once){for(const e of enemies)if(!e.dead&&!z.hit.has(e.id)&&Math.hypot(e.x-z.x,e.y-z.y)<=z.r){z.hit.add(e.id);hit(z.u,e,z.dmg,'바위','rocks');burst(e.x,e.y-G.cell*0.1,'바위',3,0.7);}continue;}
    for(const e of enemies)if(!e.dead&&Math.hypot(e.x-z.x,e.y-z.y)<=z.r)dmgRaw(e,z.dps*dt*(e.debT>0?1+e.debV:1),z.u);}
  zones=zones.filter(z=>z.t>0);
  updRun(dt);
  for(let i=0;i<N;i++){
    const u=board[i];if(!u)continue;
    if(u.ball)continue;
    if(u.bf){u.bf.t-=dt;if(u.bf.t<=0)u.bf=null;}
    if(isAura(u.s.mech)){const sk=skillOf(u);if(sk){u.sk=(u.sk==null?4:u.sk)-dt;if(u.sk<=0&&enemies.length){castBuff(u,i,sk);u.sk=(u.tier>=3?5:7)/(1+mods.skill);}}continue;}
    if(u.charge){u.charge.t-=dt;if(u.charge.t<=0){const go=u.charge.go;u.charge=null;go();}continue;}
    {const sk0=skillOf(u);if(sk0&&sk0.cd&&u.sk!=null&&u.sk>0)u.sk-=dt;}
    if(u.parT>0){u.parT-=dt;if(u.parT<=0)u.slp=false;continue;}
    u.cd-=dt*(state.hailT>0&&!u.s.t.includes('얼음')?0.6:1);if(u.cd>0)continue;
    const c=cellCenter(i),R=(u.s.range+(u.bf&&u.bf.range?1:0))*G.cell;
    const inR=enemies.filter(e=>!e.dead&&!e.caught&&Math.hypot(e.x-c.x,e.y-c.y)<=R);
    if(!inR.length){u.cd=0;continue;}
    const rate=u.s.rate*(1+(u.bf&&u.bf.rate||0))*(u.s.mech==='speedboost'?1+0.03*(u.sb||0):1);
    const sk=skillOf(u);
    if(sk&&sk.cd){u.sk=(u.sk==null?sk.cd*0.5:u.sk)-0;}
    if(sk&&sk.cd){if(u.sk<=0){if(castSkill(u,i,c,inR,sk)){u.sk=skillCd(u,sk);u.cd=1/rate;continue;}}}
    else if(sk&&Math.random()<skillChance(u)){u.pity=0;if(castSkill(u,i,c,inR,sk)){u.cd=Math.random()<mods.pp?0.05:1/rate;continue;}}
    else if(sk)u.pity=Math.min(0.06,(u.pity||0)+0.004);
    attack(u,c,inR);u.cd=1/rate;
  }
  updateProjs(dt);
  enemies=enemies.filter(e=>!e.dead);if(state.log&&enemies.length>state.log.peak)state.log.peak=enemies.length;
  for(const f of fx)f.t-=dt;fx=fx.filter(f=>f.t>0);
  if(enemies.length>fieldCap())return finish(false,`필드의 적이 ${fieldCap()}마리를 넘었어요.`);
  if(state.bossDown){state.bossDown=false;return endWave();}
  if(state.boss&&state.waveT<=0){const g=gymAt(w);return finish(false,`제한 시간 안에 ${g.lead}의 ${josa(g.n,'을','를')} 쓰러뜨리지 못했어요.`);}
  if(!gymAt(w)&&state.waveT<=0)endWave();
}
function bossTick(e,dt){
  const g=e.gim;
  if(g==='final'&&e.hp<e.max*0.5)e.hp=Math.min(e.max*0.6,e.hp+e.max*0.015*dt);
  if(g==='smoke'){e.smokeT-=dt;}
  if(e.protT>0)e.protT-=dt;
  if(g==='milk'){e.sp=e.sp0*(1+Math.min(1,e.age/40));if(!e.milked&&e.hp<e.max*0.5){e.milked=true;e.hp+=e.max*0.4;fx.push({k:'ring',x:e.x,y:e.y,r:G.cell*0.9,col:'#ffffff',t:.6,T:.6});fx.push({k:'txt',x:e.x,y:e.y-G.cell*0.6,s:'우유마시기',col:'#fff',big:true,t:.9,T:.9});}return;}
  if(g==='truant'){e.gT-=dt;if(e.gT<=0){e.rest=!e.rest;e.gT=3;if(e.rest&&!(e.popT>0)){fx.push({k:'txt',x:e.x,y:e.y-G.cell*0.6,s:'게으름',col:'#e8dcc0',t:.8,T:.8});}}return;}
  if(g==='iron'||g==='armor')return;
  if(g==='sturdy'||g==='blaze'||g==='final')return;
  e.gT-=dt;if(e.gT>0)return;
  if(g==='recover'){e.hp=Math.min(e.max,e.hp+e.max*0.15);e.gT=8;fx.push({k:'ring',x:e.x,y:e.y,r:G.cell*0.8,col:'#7bd88f',t:.6,T:.6});}
  else if(g==='paralyze'){e.gT=6;for(let i=0;i<N;i++){const u=board[i];if(!u)continue;const c=cellCenter(i);
      if(Math.hypot(c.x-e.x,c.y-e.y)<=2.2*G.cell&&!u.s.guard&&!isAura(u.s.mech)){u.parT=2;fx.push(mkBolt(e,c,'#f5d43a',.35));}}}
  else if(g==='seed'){e.gT=4;for(let k=0;k<2;k++){const hp=hpAt(state.wave)*0.7,[name,sid]=pick(ENEMY['풀']);mkEnemy({t:['풀','독'],name,sid,hp,max:hp,sp:1.15,p:(e.p+0.01*k)%1});}}
  else if(g==='smoke'){e.gT=7;e.smokeT=3;}
  else if(g==='tailwind'){e.gT=8;state.windT=4;fx.push({k:'txt',x:e.x,y:e.y-G.cell*0.6,s:'순풍',col:'#cfe8ff',big:true,t:.9,T:.9});for(let k=0;k<12;k++)burst(Math.random()*G.W,Math.random()*G.H,'비행',1,1.5);}
  else if(g==='hypnosis'){e.gT=7;const us=[];for(let i=0;i<N;i++){const u=board[i];if(!u||u.s.guard||isAura(u.s.mech))continue;const c=cellCenter(i);us.push({u,c,d:Math.hypot(c.x-e.x,c.y-e.y)});}
    us.sort((a,b)=>a.d-b.d).slice(0,2).forEach(o=>{o.u.parT=3;o.u.slp=true;fx.push(mkBolt(e,o.c,'#b28ce0',.4));fx.push({k:'txt',x:o.c.x,y:o.c.y-G.cell*0.5,s:'쿨쿨',col:'#d9c6ff',t:1,T:1});});}
  else if(g==='detect'){e.gT=6;e.protT=1.5;fx.push({k:'ring',x:e.x,y:e.y,r:G.cell*0.7,col:'#ffe08a',t:1.5,T:1.5});}
  else if(g==='hail'){e.gT=9;state.hailT=3;fx.push({k:'txt',x:e.x,y:e.y-G.cell*0.6,s:'싸라기눈',col:'#e8fbff',big:true,t:.9,T:.9});for(let k=0;k<16;k++)burst(Math.random()*G.W,Math.random()*G.H*0.6,'얼음',1,1);}
  else if(g==='bulk'){e.gT=8;if((e.dd||0)<3){e.dd=(e.dd||0)+1;fx.push({k:'txt',x:e.x,y:e.y-G.cell*0.6,s:'벌크업',col:'#ffb0a0',big:true,t:.9,T:.9});fx.push({k:'ring',x:e.x,y:e.y,r:G.cell*0.8,col:'#d4473f',t:.5,T:.5});}}
  else if(g==='ddance'){e.gT=10;if((e.dd||0)<3){e.dd=(e.dd||0)+1;e.sp=e.sp0*Math.pow(1.2,e.dd);fx.push({k:'txt',x:e.x,y:e.y-G.cell*0.6,s:'용의춤',col:'#9fb2ff',big:true,t:.9,T:.9});fx.push({k:'ring',x:e.x,y:e.y,r:G.cell*0.8,col:'#8256f7',t:.5,T:.5});}}
  else if(g==='teleport'){e.gT=7;fx.push({k:'puff',x:e.x,y:e.y,r:G.cell*0.6,col:'#f76693',t:.4,T:.4});e.p=(e.p+0.25+Math.random()*0.35)%1;}
}
function chooseTarget(inR,mech){
  if(mech==='snipe')return inR.reduce((a,b)=>b.hp>a.hp?b:a);
  const bo=inR.find(e=>e.boss);if(bo)return bo;
  return inR.reduce((a,b)=>b.age>a.age?b:a);
}
function attack(u,c,inR){
  const s=u.s,mech=s.mech,at=s.t[0];
  if(mech==='slowstart')u.ss=(u.ss||0)+1;
  if(mech==='speedboost')u.sb=Math.min(30,(u.sb||0)+1);
  {const ft=inR.find(e=>e.boss)||inR[0],dx=ft.x-c.x,dy=ft.y-c.y,L=Math.hypot(dx,dy)||1;u.face=dx>0?1:-1;if(!isAura(mech)&&mech!=='quake'&&mech!=='rain'&&mech!=='glutton'&&mech!=='sing'){u.lunge=0.18;u.lx=dx/L;u.ly=dy/L;}}
  if(mech==='quake'||mech==='rain'||mech==='glutton'){
    for(const e of inR)hit(u,e,s.dmg,at,mech);
    shake=Math.max(shake,3);for(const e of inR.slice(0,6))burst(e.x,e.y-G.cell*0.1,mech==='rain'?'물':'땅',4,0.9);
    fx.push({k:mech==='rain'?'wave':'crack',x:c.x,y:c.y,r:s.range*G.cell,col:TYPE_COLOR[at],t:.45,T:.45,seed:Math.random()});return;}
  if(mech==='sing'){
    const dur=0.5+0.5*Math.min(u.tier,3);
    for(const e of inR){if(e.gim!=='blaze'){if(e.boss){e.slowV=Math.max(e.slowV,0.4);e.slowT=dur;}else{e.stunT=Math.max(e.stunT,dur);e.sleep=true;}}hit(u,e,s.dmg,at,mech);}
    fx.push({k:'notes',x:c.x,y:c.y,r:s.range*G.cell,col:TYPE_COLOR['페어리'],t:.8,T:.8});return;}
  const tg=chooseTarget(inR,mech);
  if(mech==='snipe'){const m=hit(u,tg,s.dmg,at,mech);fx.push({k:'beam',x1:c.x,y1:c.y,x2:tg.x,y2:tg.y,col:TYPE_COLOR[at],w:m>=2?5:3.5,t:.22,T:.22});burst(tg.x,tg.y-G.cell*0.15,at,7,1.2);fx.push({k:'ring',x:tg.x,y:tg.y,r:G.cell*0.35,col:TYPE_COLOR[at],t:.25,T:.25});return;}
  if(mech==='chain'){
    let m=hit(u,tg,s.dmg,at,mech);fx.push(mkBolt(c,tg,TYPE_COLOR[at],.16));burst(tg.x,tg.y-G.cell*0.15,'전기',4,1);
    let n=Math.min(u.tier,3)+mods.chain,prev=tg,d=s.dmg;const seen=new Set([tg]);
    while(n-->0){d*=0.7;let best=null,bd=1.6*G.cell;
      for(const e of enemies){if(e.dead||seen.has(e))continue;const dd=Math.hypot(e.x-prev.x,e.y-prev.y);if(dd<bd){bd=dd;best=e;}}
      if(!best)break;seen.add(best);hit(u,best,d,at,mech);fx.push(mkBolt(prev,best,TYPE_COLOR[at],.16));burst(best.x,best.y-G.cell*0.15,'전기',3,0.8);prev=best;}
    return;}
  if(mech==='punch'){hit(u,tg,s.dmg,at,mech);burst(tg.x,tg.y-G.cell*0.15,'격투',4,1);fx.push({k:'punch',x:tg.x,y:tg.y,r:G.cell*0.3,col:TYPE_COLOR[at],t:.2,T:.2});return;}
  if(mech==='combo'){u.cnt=(u.cnt||0)+1;const big=u.cnt%3===0;hit(u,tg,s.dmg*(big?3:1),at,mech);fx.push({k:'punch',x:tg.x,y:tg.y,r:G.cell*(big?0.55:0.28),col:big?'#e4e6f2':TYPE_COLOR[at],t:big?.35:.2,T:big?.35:.2});if(big)fx.push({k:'ring',x:tg.x,y:tg.y,r:G.cell*0.6,col:'#9fb6ff',t:.3,T:.3});return;}
  if(mech==='pierce'){const dx=tg.x-c.x,dy=tg.y-c.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,R2=s.range*G.cell;
    for(const e of enemies){if(e.dead)continue;const px=e.x-c.x,py=e.y-c.y,t=px*ux+py*uy;if(t<0||t>R2)continue;if(Math.abs(px*uy-py*ux)<=G.cell*0.35)hit(u,e,s.dmg,at,mech);}
    fx.push({k:'beam',x1:c.x,y1:c.y,x2:c.x+ux*R2,y2:c.y+uy*R2,col:'#6fa8ff',w:5,t:.22,T:.22});fx.push({k:'puff',x:tg.x,y:tg.y,r:G.cell*0.25,col:'#9fc4ff',t:.25,T:.25});return;}
  if(mech==='double'){const n=u.tier>=3?3:2,ts=[...inR].sort((a,b)=>b.age-a.age).slice(0,n);while(ts.length<n)ts.push(ts[0]);
    for(const t2 of ts){const dist=Math.hypot(t2.x-c.x,t2.y-c.y);projs.push({x:c.x,y:c.y,tg:t2,lx:t2.x,ly:t2.y,spd:Math.max(dist/0.12,G.cell*8),ty:'드래곤',u,mech,trail:[],rot:0,dart:true});}return;}
  // 투사체
  const ty=at,dist=Math.hypot(tg.x-c.x,tg.y-c.y),spd=Math.max(dist/0.15,G.cell*7);
  const from=ty==='바위'?{x:tg.x,y:tg.y-G.cell*1.4}:{x:c.x,y:c.y};
  projs.push({x:from.x,y:from.y,tg,lx:tg.x,ly:tg.y,spd,ty,u,mech,trail:[],rot:Math.random()*6});
}
function updateProjs(dt){
  for(const p of projs){
    if(p.tg.dead){let best=null,bd=G.cell;for(const e of enemies){if(e.dead)continue;const dd=Math.hypot(e.x-p.lx,e.y-p.ly);if(dd<bd){bd=dd;best=e;}}
      if(!best){p.done=true;fx.push({k:'puff',x:p.x,y:p.y,r:G.cell*0.15,col:TYPE_COLOR[p.ty],t:.2,T:.2});continue;}p.tg=best;}
    const tg=p.tg;p.lx=tg.x;p.ly=tg.y;
    const dx=tg.x-p.x,dy=tg.y-p.y,d=Math.hypot(dx,dy),step=p.spd*dt;
    p.trail.push({x:p.x,y:p.y});if(p.trail.length>8)p.trail.shift();p.rot+=dt*14;p.ang=Math.atan2(dy,dx);
    if(d<=step+2){p.done=true;impact(p.u,tg,p.mech,p.ty);}
    else{p.x+=dx/d*step;p.y+=dy/d*step;}
  }
  projs=projs.filter(p=>!p.done);
}
function impact(u,tg,mech,at){
  if(at==='전기'&&Math.random()<0.3&&fx.length<170)fx.push(mkBolt({x:tg.x+(Math.random()-.5)*G.cell*0.4,y:tg.y-G.cell*2.4},{x:tg.x,y:tg.y-G.cell*0.1},'#fff4a0',.16));
  const s=u.s,tier=Math.min(u.tier,3);
  let crowd=1;if(mech==='eruption'){let n=0;for(const e of enemies)if(!e.dead&&Math.hypot(e.x-tg.x,e.y-tg.y)<=G.cell*1.3)n++;crowd=1+Math.min(0.8,0.08*n);}
  const area=mech==='eruption'||mech==='splash'||(mech==='gyara'&&u.tier>=2)||(mech==='dragon'&&u.tier>=3)||(mech==='slow'&&u.tier>=3)||(mech==='burn'&&u.tier>=2)||(mech==='powder'&&u.tier>=2);
  if(area){
    hit(u,tg,s.dmg*crowd,at,mech);
    const frac=mech==='eruption'?0.5*crowd:mech==='gyara'?0.7:mech==='splash'?0.6:mech==='powder'?0.3:0.45,r=0.85*G.cell*(1+mods.splash);
    for(const e of enemies)if(e!==tg&&!e.dead&&Math.hypot(e.x-tg.x,e.y-tg.y)<=r)hit(u,e,s.dmg*frac,at,mech);
    fx.push({k:'blast',x:tg.x,y:tg.y,r,col:TYPE_COLOR[at],t:.3,T:.3});
    burst(tg.x,tg.y-G.cell*0.15,at,10,1.1);
  } else {hit(u,tg,s.dmg,at,mech);fx.push({k:'flash',x:tg.x,y:tg.y-G.cell*0.15,r:G.cell*0.22,col:TYPE_COLOR[at],t:.14,T:.14});burst(tg.x,tg.y-G.cell*0.15,at,4,0.9);}
  if(mech==='rocks'&&zones.length<40){const mine=zones.filter(z=>z.u===u);if(mine.length>=2)mine[0].t=0;zones.push({x:tg.x,y:tg.y,r:0.55*G.cell*(1+mods.splash),once:true,hit:new Set(),dmg:s.dmg*0.3,t:3,T:3,u,col:'#b8a070',rock:true});}
  if(mech==='zone'&&zones.length<40)zones.push({x:tg.x,y:tg.y,r:0.7*G.cell*(1+mods.splash),dps:s.dmg*0.9*(1+mods.dot),t:2.5,T:2.5,u,col:TYPE_COLOR['독']});
}
function hit(u,e,base,at,mech){
  if(e.dead||e.caught)return 1;
  let m=effU(u,at,e.t);if(u.bf&&u.bf.se&&m<2)m=2;let d=base*m*(u.bf&&u.bf.dmg?2:1);e.hitT=0.08;e.hpLast=clock;
  if(!(e.popT>0)&&fx.length<200){if(m>=2){const long=seCD<=0;if(long)seCD=4;fx.push({k:'txt',x:e.x,y:e.y-G.cell*0.45,s:long?'효과가 굉장했다!':'굉장!',big:long,col:'#ffd36b',t:.6,T:.6});e.popT=0.8;}else if(m<1){fx.push({k:'txt',x:e.x,y:e.y-G.cell*0.45,s:'별로…',col:'#a9b4ae',t:.6,T:.6});e.popT=0.8;}}
  if(e.debT>0)d*=1+e.debV;
  if(e.sleep&&e.stunT>0)d*=state.pass.darkrai?2:1.5;
  if((e.boss||e.wild)&&u.item==='band')d*=1.5;if(e.confT>0)d*=1.25;if(e.zapT>0)d*=1.3;
  if(mech==='jaws'&&e.hp>e.max*0.5)d*=1.6;
  if(mech==='slowstart')d*=1+Math.min(3,(u.ss||0)/40);
  if(mech==='punch'){if(u.pT===e.id)u.pS=Math.min(5,(u.pS||0)+1);else{u.pT=e.id;u.pS=0;}d*=1+0.15*u.pS;}
  if(e.boss){d*=(1+mods.bossDmg)*(1+u.s.bossB);if(mech==='curse')d*=1.6;const g=e.gim;
    if((g==='sturdy'||g==='final')&&m<2)d*=0.6;
    if(g==='teleport'&&e.hp<e.max*0.5)d*=0.7;
    if(g==='armor'&&at!=='불꽃')d*=0.7;if(g==='iron'&&m<2)d*=0.55;if(e.dd)d*=Math.pow(0.85,e.dd);
    if(e.protT>0){if(!(e.popT>0)){fx.push({k:'txt',x:e.x,y:e.y-G.cell*0.4,s:'판별',col:'#ffe08a',t:.5,T:.5});e.popT=0.5;}return m;}
    if(g==='smoke'&&e.smokeT>0&&!u.s.guard&&Math.random()<0.4){if(Math.random()<0.3)fx.push({k:'txt',x:e.x,y:e.y-G.cell*0.4,s:'빗나감',col:'#c9c2d6',t:.5,T:.5});return m;}}
  if(e.boss&&u.bf&&u.bf.boss)d*=2;
  if(e.frzT>0)d*=1.5;
  const crit=(u.bf&&u.bf.crit)||e.markT>0||Math.random()<u.s.crit;if(crit)d*=u.s.critM;
  const tr=Math.min(u.tier,3),immune=e.gim==='blaze';
  if(mech==='burn'){const v=d*0.5*(1+mods.dot);if(e.burnT<=0||v>=e.burnD)e.burnD=v;e.burnT=2;}
  if(mech==='slow'&&!immune){e.slowV=Math.min(0.75,0.3+mods.slow);e.slowT=1.5;}
  if(mech==='toxic'){e.tox=Math.min(5,(e.poisT>0?e.tox||0:0)+1);e.poisD=e.tox*d*0.25*(1+mods.dot);e.poisT=4;}
  if(mech==='shred'){e.debV=Math.max(e.debT>0?e.debV:0,0.25);e.debT=Math.max(e.debT,3);}
  if(mech==='shock'&&!immune&&Math.random()<0.25+0.05*tr){if(e.boss){e.slowV=Math.max(e.slowT>0?e.slowV:0,0.35);e.slowT=1;}else e.stunT=Math.max(e.stunT,1);e.zapT=1;}
  if(mech==='flinch'&&!e.boss&&!immune&&Math.random()<0.2+0.05*tr){e.stunT=Math.max(e.stunT,0.6);e.sleep=false;}
  if(mech==='powder'){e.debV=Math.max(e.debT>0?e.debV:0,0.1+0.05*tr);e.debT=4;}
  if(mech==='quake'&&u.tier>=3&&!e.boss&&!immune&&Math.random()<0.1+mods.stun)e.stunT=Math.max(e.stunT,0.5);
  if(mech==='slow'&&mods.stun>0&&!e.boss&&!immune&&Math.random()<mods.stun)e.stunT=Math.max(e.stunT,0.4);
  e.kb=Math.min(G.cell*0.16,(e.kb||0)+G.cell*(e.boss?0.02:0.07));
  if(crit&&stopCD<=0&&(e.boss||d>e.max*0.35)){hitStop=0.05;stopCD=0.6;}
  if(crit){if(!(e.critT>0)){fx.push({k:'txt',x:e.x,y:e.y-G.cell*0.62,s:'급소!',col:'#ffe14d',big:true,t:.55,T:.55});e.critT=0.5;}shake=Math.max(shake,2.2);burst(e.x,e.y-G.cell*0.15,'전기',5,1.2);}
  dmgPop(e,d,m,crit);
  dmgRaw(e,d,u);
  if(mech==='execute'&&!e.dead&&!e.boss&&e.hp<e.max*(0.12+0.04*tr)){dmgRaw(e,e.hp+1,u);fx.push({k:'slash',x:e.x,y:e.y,r:G.cell*0.35,col:'#ffffff',t:.25,T:.25});}
  return m;
}
function dmgRaw(e,d,u){
  if(e.dead||e.caught)return;if(e.tutKeep)d=Math.min(d,Math.max(0,e.hp-e.max*0.05));if(u)u.dealt=(u.dealt||0)+Math.min(d,Math.max(0,e.hp));e.hp-=d;
  if(e.hp<=0){e.dead=true;state.kills++;
    let c=1+Math.floor(state.wave/8)+mods.coinKill;
    if(u&&u.s.mech==='coin')c+=Math.min(u.tier,3);
    if(u&&u.item==='amulet')c+=2;
    state.waveKills=(state.waveKills||0)+1;
    if(u&&u.partner)partnerXp(e.boss?25:2,u);
    if(e.wild)wildDown(e);
    if(u&&u.s.mech==='grow'&&(u.grow||0)<100){u.grow=(u.grow||0)+1;if(u.grow%10===0)recalcSoon=true;}
    state.coins+=c;flushPop(e);
    if(e.spread&&e.poisT>0){let n=0;for(const o of enemies){if(o===e||o.dead||n>=3)continue;if(Math.hypot(o.x-e.x,o.y-e.y)<=G.cell*1.1){o.poisD=Math.max(o.poisT>0?o.poisD:0,e.poisD*0.8);o.poisT=3;o.spread=true;o.tox=e.tox;n++;fx.push({k:'skbeam',x1:e.x,y1:e.y,x2:o.x,y2:o.y,w:G.cell*0.06,col:'#b25cb0',t:.3,T:.3});}}}
    const sz=sizeFor(e.sid,e.boss?G.cell*1.35:G.cell*0.74);
    if(fx.length<240)fx.push({k:'die',sid:e.sid,x:e.x,y:e.y+G.cell*0.14,size:sz,flip:e.dx>0,t:.28,T:.28});
    fx.push({k:'ring',x:e.x,y:e.y,r:sz*0.45,col:'#ffffff',t:.25,T:.25});
    burst(e.x,e.y-sz*0.25,e.t[0],e.boss?26:7,e.boss?1.6:0.9);coinFly(e.x,e.y-sz*0.3,e.boss?4:Math.min(3,c));
    if(e.boss){state.coins+=40+state.wave*3;state.boss=null;state.bossDown=true;toast(`${e.name} 쓰러뜨림`,1.6);shake=6;sfx('boss');}
  }
}
let recalcSoon=false;
function mkBolt(a,b,col,t){const pts=[];const n=6;for(let k=0;k<=n;k++){const f=k/n;pts.push({x:a.x+(b.x-a.x)*f+(k&&k<n?(Math.random()-.5)*G.cell*0.35:0),y:a.y+(b.y-a.y)*f+(k&&k<n?(Math.random()-.5)*G.cell*0.35:0)});}return {k:'bolt',pts,col,t,T:t};}


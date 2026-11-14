'use strict';
// ───────── 전장 연출: 떠다니는 것, 구름 그림자, 빛과 색, 판 가장자리 소품, 스킬 컷인, 카메라 ─────────
// 화면 좌표로 그리는 것은 draw()의 '화면 변환' 구간에서 부른다.

// 바닥 종류별 떠다니는 것과 색 보정
const AMB_KIND={grass:'leaf',gym:'spark',volcano:'ash',ice:'snow',water:'glint',swamp:'spore',metal:'dust',wood:'dust',rock:'dust',sand:'dust'};
const GRADE={grass:'#ffe8b0',water:'#cfe6ff',volcano:'#ff8a40',ice:'#cdeeff',swamp:'#c7a2ff',gym:'#ffe6f0',metal:'#d0dcea',wood:'#ffcf8a',rock:'#ffd9a0',sand:'#ffe2a0'};
let amb=[],ambKind='',cutin=null,cutCD=0,camP=0,camT=1,hitStop=0,stopCD=0,seCD=0;
const GIM_N={recover:'자기재생',paralyze:'10만볼트',seed:'씨뿌리기',smoke:'연막',teleport:'순간이동',tailwind:'순풍',hypnosis:'최면술',detect:'판별',hail:'싸라기눈',ddance:'용의춤'};

function newAmb(k,init){
  const {W,H}=G,r=Math.random;
  const a={k,x:r()*W,y:init?r()*H:-10,t:0,L:6+r()*6,vx:0,vy:0,rot:r()*6,vr:(r()-.5)*3,s:1+r()*1.2,ph:r()*6};
  if(k==='leaf'){a.vx=8+r()*14;a.vy=16+r()*14;}
  else if(k==='snow'){a.vx=(r()-.5)*10;a.vy=18+r()*20;}
  else if(k==='ash'){a.y=init?r()*H:H+10;a.vx=(r()-.5)*8;a.vy=-(10+r()*14);}
  else if(k==='spore'){a.y=init?r()*H:H+10;a.vx=(r()-.5)*6;a.vy=-(5+r()*7);}
  else if(k==='glint'||k==='spark'){a.y=G.oy+r()*(H-G.oy-60);a.L=1.2+r()*1.6;}
  else{a.vx=4+r()*6;a.vy=(r()-.5)*4;a.L=8;}
  return a;
}
function updScene(dt){
  if(!G.W)return;
  const k=AMB_KIND[THEMES[themeIdx()].ground]||'dust';
  if(k!==ambKind){ambKind=k;amb=[];}
  const want=k==='snow'?40:k==='glint'||k==='spark'?16:k==='dust'?10:22;
  while(amb.length<want)amb.push(newAmb(k,true));
  for(let i=0;i<amb.length;i++){const a=amb[i];a.t+=dt;a.x+=a.vx*dt+(k==='leaf'||k==='snow'?Math.sin(a.t*1.6+a.ph)*6*dt:0);a.y+=a.vy*dt;a.rot+=a.vr*dt;
    if(a.t>a.L||a.y>G.H+12||a.y<-14||a.x<-20||a.x>G.W+20)amb[i]=newAmb(k,false);}
  if(cutin){cutin.t-=dt;if(cutin.t<=0)cutin=null;}
  if(cutCD>0)cutCD-=dt;if(stopCD>0)stopCD-=dt;if(seCD>0)seCD-=dt;
  if(camP>0)camP=Math.max(0,camP-dt);
}
function drawAmb(){
  for(const a of amb){const f=Math.min(1,a.t/0.6,(a.L-a.t)/0.8);if(f<=0)continue;ctx.globalAlpha=f;
    switch(a.k){
      case 'leaf':ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.rot);ctx.fillStyle=a.ph>3?'#7cc35a':'#f0b0c8';ctx.beginPath();ctx.ellipse(0,0,4*a.s,1.8*a.s,0,0,7);ctx.fill();ctx.restore();break;
      case 'snow':ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(a.x,a.y,1.3*a.s,0,7);ctx.fill();break;
      case 'ash':ctx.fillStyle=a.ph>3?'rgba(255,150,70,.85)':'rgba(70,60,60,.6)';ctx.fillRect(a.x,a.y,1.6*a.s,1.6*a.s);break;
      case 'spore':ctx.fillStyle='rgba(210,180,255,.7)';ctx.beginPath();ctx.arc(a.x,a.y,1.6*a.s,0,7);ctx.fill();break;
      case 'glint':case 'spark':{const tw=Math.sin(a.t/a.L*Math.PI);ctx.globalAlpha=tw*0.8;star(a.x,a.y,2.2*a.s,4,'#ffffff');break;}
      default:ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(a.x,a.y,1.2,1.2);}
  }
  ctx.globalAlpha=1;
}
// 무거운 그라데이션은 한 번만 그려 두고 이미지로 찍는다
const SC={};
function mkC(w,h,fn){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));fn(c.getContext('2d'),c.width,c.height);return c;}
function sceneCache(){
  const key=G.W+'x'+G.H+'@'+G.dpr;if(SC.key===key)return SC;SC.key=key;const d=G.dpr,W=G.W*d,H=G.H*d;
  SC.vig=mkC(W,H,(x,w,h)=>{const v=x.createRadialGradient(w/2,h*0.52,Math.min(w,h)*0.38,w/2,h*0.52,Math.max(w,h)*0.75);v.addColorStop(0,'rgba(8,12,30,0)');v.addColorStop(1,'rgba(8,12,30,.42)');x.fillStyle=v;x.fillRect(0,0,w,h);
    const s=x.createLinearGradient(0,0,w*0.8,h*0.7);s.addColorStop(0,'rgba(255,244,214,.16)');s.addColorStop(0.5,'rgba(255,244,214,0)');x.fillStyle=s;x.fillRect(0,0,w,h);});
  SC.cloud=mkC(256,256,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(30,40,70,.13)');g.addColorStop(1,'rgba(30,40,70,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});
  const lamp=col=>mkC(128,128,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});
  SC.warm=lamp('rgba(255,214,150,.5)');SC.dark=lamp('rgba(170,110,255,.7)');
  return SC;
}
// 구름 그림자: 천천히 판을 가로지르는 옅은 그늘
function drawClouds(){
  const {W,H}=G,th=THEMES[themeIdx()];if(th.ground==='gym'||th.ground==='metal'||th.ground==='wood')return;
  const C=sceneCache();
  for(let k=0;k<2;k++){const sp=12+k*7,x=((clock*sp+k*W*0.9)%(W*2.2))-W*0.6,y=G.oy+(H-G.oy)*(0.25+k*0.4),rx=W*0.55,ry=W*0.22;ctx.drawImage(C.cloud,x-rx,y-ry,rx*2,ry*2);}
}
// 빛: 가장자리 그늘과 왼쪽 위 햇빛(미리 그린 한 장), 바닥 색 보정은 배경에 구워 둔다
function drawLight(){
  const C=sceneCache();ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.drawImage(C.vig,0,0);ctx.restore();
}
function gradeBg(b,th){b.save();b.globalCompositeOperation='soft-light';b.globalAlpha=0.35;b.fillStyle=GRADE[th.ground]||'#ffe8b0';b.fillRect(0,G.wTop,G.W,G.wH);b.restore();}
// 밤: 포켓몬 둘레만 밝게, 고스트·악은 보랏빛
// 챔피언로드 사천왕·챔피언전: 둘레를 어둡게 하고 관장에게 위에서 빛줄기
let arenaA=0;
function drawArena(){
  const want=REGION&&REGION.id==='champ'&&state.boss&&!state.boss.dead&&state.phase==='play'?1:0;
  arenaA+=(want-arenaA)*0.04;if(arenaA<0.02)return;
  const {W,H,cell}=G,b=state.boss,bx=b?b.x:W/2,by=b?toSY(b.y):H/2;
  ctx.save();
  const g=ctx.createRadialGradient(bx,by-cell*0.3,cell*0.7,bx,by,Math.max(W,H)*0.8);
  g.addColorStop(0,'rgba(4,6,18,0)');g.addColorStop(0.25,`rgba(4,6,18,${0.3*arenaA})`);g.addColorStop(1,`rgba(4,6,18,${0.62*arenaA})`);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='lighter';const top=Math.max(0,G.oy*0.3),lg=ctx.createLinearGradient(bx,top,bx,by);
  lg.addColorStop(0,'rgba(255,240,205,0)');lg.addColorStop(1,`rgba(255,240,205,${0.16*arenaA})`);ctx.fillStyle=lg;
  ctx.beginPath();ctx.moveTo(bx-cell*0.2,top);ctx.lineTo(bx+cell*0.2,top);ctx.lineTo(bx+cell*0.7,by);ctx.lineTo(bx-cell*0.7,by);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.ellipse(bx,by+cell*0.08,cell*0.7,cell*0.22,0,0,7);ctx.fillStyle=`rgba(255,240,205,${0.2*arenaA})`;ctx.fill();
  ctx.restore();
}
function drawNightLights(){
  if(nightA<0.05)return;const C=sceneCache();
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=nightA*0.6;
  for(let i=0;i<N;i++){const u=board[i];if(!u||!u.s)continue;const c=cellCenter(i),x=c.x,y=toSY(c.y)-G.cell*0.15,r=G.cell*(u.tier>=3?1.1:0.8);
    ctx.drawImage(u.s.t.some(t=>t==='고스트'||t==='악')?C.dark:C.warm,x-r,y-r,r*2,r*2);}
  ctx.restore();
}

// 3단계·전설 스킬 컷인: 사선 띠에 포켓몬과 기술 이름. 5초에 한 번까지
function startCutin(u,sk){
  if(cutCD>0||state.cut)return false;
  const d=def(u);cutin={id:d.id,n:d.n,sk:sk.n,col:TYPE_COLOR[d.t[0]]||'#ffffff',t:0.9,T:0.9,leg:u.tier>=4};cutCD=5;return true;
}
function drawCutin(){
  const c=cutin,{W,H}=G,p=1-c.t/c.T,ein=Math.min(1,p/0.18),eout=p>0.78?(p-0.78)/0.22:0,al=ein*(1-eout);
  ctx.save();
  ctx.fillStyle=`rgba(6,10,24,${0.38*al})`;ctx.fillRect(0,0,W,H);
  const cy=H*0.46,bh=Math.min(120,H*0.15),sk=bh*0.45,slide=(1-Math.pow(1-ein,3))*W-W+eout*eout*W*1.2;
  ctx.translate(slide,0);
  // 사선 띠
  ctx.beginPath();ctx.moveTo(-20,cy-bh/2+sk);ctx.lineTo(W+20,cy-bh/2-sk);ctx.lineTo(W+20,cy+bh/2-sk);ctx.lineTo(-20,cy+bh/2+sk);ctx.closePath();
  const g=ctx.createLinearGradient(0,0,W,0);g.addColorStop(0,'#0b1226');g.addColorStop(0.35,c.col);g.addColorStop(1,'#0b1226');ctx.fillStyle=g;ctx.globalAlpha=0.95;ctx.fill();
  ctx.globalAlpha=1;ctx.strokeStyle=c.leg?'#ffd257':'#ffffff';ctx.lineWidth=3;ctx.stroke();
  // 속도선
  ctx.globalAlpha=0.35;ctx.strokeStyle='#ffffff';ctx.lineWidth=2;for(let k=0;k<7;k++){const y=cy-bh/2+bh*(k+0.5)/7,x=((clock*900+k*170)%(W*1.4))-W*0.2;ctx.beginPath();ctx.moveTo(x,y+sk*(1-2*x/W)*0.9);ctx.lineTo(x+W*0.18,y+sk*(1-2*(x+W*0.18)/W)*0.9);ctx.stroke();}
  ctx.globalAlpha=1;
  // 포켓몬
  drawAni(c.id,W*0.22,cy+bh*0.62,bh*1.45,false,1,null,0);
  // 이름
  ctx.textAlign='left';ctx.textBaseline='middle';ctx.lineJoin='round';
  ctx.font=`400 ${Math.round(Math.min(W*0.095,bh*0.42))}px 'Black Han Sans',sans-serif`;ctx.lineWidth=7;ctx.strokeStyle='#0b1226';ctx.strokeText(c.sk,W*0.42,cy+2);ctx.fillStyle='#ffffff';ctx.fillText(c.sk,W*0.42,cy+2);
  ctx.font=`700 ${Math.round(bh*0.17)}px 'IBM Plex Sans KR',sans-serif`;ctx.lineWidth=4;ctx.strokeText(c.n+(c.leg?' · 전설':''),W*0.43,cy-bh*0.3);ctx.fillStyle=c.leg?'#ffd257':'#dfe7ff';ctx.fillText(c.n+(c.leg?' · 전설':''),W*0.43,cy-bh*0.3);
  ctx.restore();
}

// 판 가장자리 소품: 바닥 종류에 맞는 꽃, 연잎, 등불, 수정, 바위
function drawProps(b,th,rr){
  const {cell,bx,by,bw,ox,oy,bh}=G,k=th.ground,spots=[];
  const fl=(x,y)=>{for(let q=0;q<5;q++){const a=q*1.2566;ell(b,x+Math.cos(a)*2.4,y+Math.sin(a)*2.4,2.2,2.2);b.fillStyle=['#ff8fb1','#ffd84a','#ffffff','#b8a4ff'][Math.floor(rr()*4)];b.fill();}ell(b,x,y,1.6,1.6);b.fillStyle='#ffb020';b.fill();};
  const lily=(x,y)=>{ell(b,x,y,cell*0.16,cell*0.1);b.fillStyle='#5aa65a';b.fill();b.strokeStyle='#3c7f3c';b.lineWidth=1;b.beginPath();b.moveTo(x,y);b.lineTo(x+cell*0.14,y-cell*0.03);b.stroke();if(rr()<.4){ell(b,x-2,y-2,2.4,2.4);b.fillStyle='#ffc0d8';b.fill();}};
  const lamp=(x,y)=>{b.fillStyle='rgba(0,0,0,.25)';ell(b,x,y+2,5,2);b.fill();b.fillStyle='#4a3a2a';b.fillRect(x-1,y-cell*0.32,2,cell*0.32);const g=b.createRadialGradient(x,y-cell*0.36,0,x,y-cell*0.36,8);g.addColorStop(0,'#fff3c0');g.addColorStop(1,'rgba(255,200,90,0)');b.fillStyle=g;b.fillRect(x-8,y-cell*0.36-8,16,16);b.fillStyle='#ffcf5a';b.fillRect(x-2.5,y-cell*0.4,5,5);};
  const crystal=(x,y)=>{b.fillStyle='#bfe8ff';b.beginPath();b.moveTo(x,y-cell*0.22);b.lineTo(x+4,y);b.lineTo(x-4,y);b.closePath();b.fill();b.fillStyle='rgba(255,255,255,.7)';b.beginPath();b.moveTo(x,y-cell*0.22);b.lineTo(x+1,y);b.lineTo(x-2,y);b.closePath();b.fill();};
  const pebble=(x,y)=>{ell(b,x,y,4+rr()*3,3);b.fillStyle=rr()<.5?'#8d8273':'#a39886';b.fill();};
  const pick=k==='grass'?fl:k==='water'?lily:k==='swamp'||k==='wood'||k==='gym'?lamp:k==='ice'?crystal:pebble;
  // 판 바깥 테두리 띠(위·아래·좌우 여백)에 고르게
  const n=10;for(let q=0;q<n;q++){const t=(q+0.5)/n;spots.push([ox+bw*t+(rr()-.5)*8,oy+G.top*0.55],[ox+bw*t+(rr()-.5)*8,oy+bh-G.top*0.45]);}
  for(const [x,y] of spots)if(rr()<0.75)pick(x,y);
}

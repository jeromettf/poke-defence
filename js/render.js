'use strict';
// ───────── 그리기 ─────────
const CSSV=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const COL={};function readCols(){for(const k of ['field','cell','path','path-edge','fg','muted','coin','danger','ok','bg'])COL[k]=CSSV('--'+k);}
let drag=null,down=null,clock=0,UPR=1;
// 세계 변환 안에서 (x,y)를 기준으로 세로 눌림을 되돌린다
function upright(x,y){ctx.translate(x,y);ctx.scale(1,UPR);ctx.translate(-x,-y);}
const TC={};
function tinted(id,c){const key=id+c;if(TC[key])return TC[key];const A=ANI[id],im=A&&AIMG[A.a];if(!im||!im.complete||!im.naturalWidth)return null;
  const t=document.createElement('canvas');t.width=A.w*A.n;t.height=A.h;const x=t.getContext('2d');
  x.drawImage(im,A.x,A.y,t.width,t.height,0,0,t.width,t.height);x.globalCompositeOperation='source-in';x.fillStyle=c;x.fillRect(0,0,t.width,t.height);TC[key]=t;return t;}
const sizeFor=(id,base)=>{const A=ANI[id];if(!A)return base;return base*(0.6+0.55*Math.min(1,Math.max(0,(A.s-45)/130)));};
const aniH=(id,size)=>{const A=ANI[id];return A?size*A.h/Math.max(A.h,A.w*0.62):size;};
// 발밑(x,y) 기준으로 그림. tint={c,a}
function drawAni(id,x,y,size,flip,alpha=1,tint=null,ph=0,sx=1,sy=1){
  const A=ANI[id],im=A&&AIMG[A.a];
  if(!A||!im||!im.complete||!im.naturalWidth){
    // 움직이는 그림이 없으면 정지 썸네일로라도 그린다
    const k=THUMB_IX[id];if(k==null||!THIMG.naturalWidth)return false;const cs=THIMG.naturalWidth/THUMBS.cols;
    ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(flip?-sx:sx,sy*UPR);ctx.drawImage(THIMG,(k%THUMBS.cols)*cs,((k/THUMBS.cols)|0)*cs,cs,cs,-size/2,-size,size,size);ctx.restore();return true;}
  const n=A.n,fi=Math.floor(((clock+ph)/Math.max(0.6,A.d))*n)%n;
  const k=size/Math.max(A.h,A.w*0.62),dw=A.w*k,dh=A.h*k;
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(flip?-sx:sx,sy*UPR);
  ctx.imageSmoothingEnabled=true;
  if(!(tint&&tint.a>=1))ctx.drawImage(im,A.x+fi*A.w,A.y,A.w,A.h,-dw/2,-dh,dw,dh);
  if(tint&&tint.a>0){const t=tinted(id,tint.c);if(t){ctx.globalAlpha=alpha*Math.min(1,tint.a);ctx.drawImage(t,fi*A.w,0,A.w,A.h,-dw/2,-dh,dw,dh);}}
  ctx.restore();return true;
}
function rrect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function star(x,y,r,n,col){ctx.beginPath();for(let k=0;k<n*2;k++){const a=k*Math.PI/n-Math.PI/2,rr=k%2?r*0.45:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.closePath();ctx.fillStyle=col;ctx.fill();}
const hpCol=f=>f>0.5?'#5fd16b':f>0.2?'#f2c14e':'#ff6b5a';
function roleIcon(r,x,y,s){
  ctx.beginPath();ctx.arc(x,y,s,0,7);ctx.fillStyle=ROLE[r].c;ctx.fill();ctx.strokeStyle='#10140f';ctx.fillStyle='#10140f';ctx.lineWidth=Math.max(1.2,s*0.22);ctx.lineCap='round';
  const q=s*0.55;ctx.beginPath();
  if(r==='D'){ctx.moveTo(x-q,y+q);ctx.lineTo(x+q,y-q);ctx.moveTo(x-q*0.6,y-q*0.1);ctx.lineTo(x+q*0.1,y+q*0.6);ctx.stroke();}
  else if(r==='A'){for(let k=0;k<4;k++){const a=k*Math.PI/4;ctx.moveTo(x-Math.cos(a)*q,y-Math.sin(a)*q);ctx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}ctx.stroke();}
  else if(r==='C'){for(let k=0;k<3;k++){const a=k*Math.PI/3+Math.PI/2;ctx.moveTo(x-Math.cos(a)*q,y-Math.sin(a)*q);ctx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}ctx.stroke();}
  else if(r==='S'){ctx.moveTo(x-q,y);ctx.lineTo(x+q,y);ctx.moveTo(x,y-q);ctx.lineTo(x,y+q);ctx.stroke();}
  else star(x,y,q*1.1,5,'#10140f');
  ctx.lineCap='butt';
}
function mergeSource(){if(drag&&down&&down.moved&&board[drag.from])return board[drag.from];return state.sel>=0?board[state.sel]:null;}
function drawUnit(u,i,x,y,a,ghost){
  const d=def(u),cs=G.cell,src=mergeSource(),hi=!ghost&&src&&canMerge(src,u);
  const fy=y+cs*0.26;
  if(u.ball&&!ghost){const p=1-u.ball.t/u.ball.T,sx0=G.W/2,sy0=G.wTop+G.wH+cs*0.2,bx=sx0+(x-sx0)*p,by=sy0+(fy-cs*0.2-sy0)*p-Math.sin(p*Math.PI)*cs*1.6;drawBall(bx,by,cs*0.13,p*12);return;}
  if(u.tier===4&&!ghost){ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(x,fy-cs*0.35);ctx.rotate(clock*0.6);for(let k=0;k<8;k++){ctx.rotate(Math.PI/4);ctx.fillStyle='rgba(255,220,120,.10)';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-cs*0.07,-cs*0.55);ctx.lineTo(cs*0.07,-cs*0.55);ctx.closePath();ctx.fill();}ctx.restore();}
  if(!ghost){ctx.beginPath();ctx.ellipse(x,fy,cs*0.27,cs*0.075,0,0,7);ctx.fillStyle='rgba(0,0,0,.38)';ctx.fill();
    if(hi){ctx.beginPath();ctx.ellipse(x,fy,cs*0.36,cs*0.11,0,0,7);ctx.strokeStyle=COL.ok;ctx.lineWidth=2;ctx.stroke();}
    if(u.tier===4){ctx.beginPath();ctx.ellipse(x,fy,cs*0.38,cs*0.12,0,0,7);ctx.strokeStyle='rgba(242,193,78,'+(0.5+0.3*Math.sin(clock*3))+')';ctx.lineWidth=2;ctx.stroke();}
    if(u.mega){ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(x,fy-cs*0.35,0,x,fy-cs*0.35,cs*0.62);g.addColorStop(0,'rgba(255,120,220,0)');g.addColorStop(0.75,`rgba(255,120,220,${0.18+0.08*Math.sin(clock*4)})`);g.addColorStop(1,'rgba(255,120,220,0)');ctx.fillStyle=g;ctx.fillRect(x-cs*0.65,fy-cs,cs*1.3,cs*1.3);ctx.restore();
      ctx.beginPath();ctx.ellipse(x,fy,cs*0.38,cs*0.12,0,0,7);ctx.strokeStyle='#ff7ad9';ctx.lineWidth=2;ctx.stroke();}
    if(u.partner){ctx.beginPath();ctx.ellipse(x,fy,cs*0.34,cs*0.1,0,0,7);ctx.strokeStyle='rgba(255,158,199,.85)';ctx.lineWidth=1.6;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);}}
  let ox=0,oy=0;if(u.lunge>0){const f=Math.sin(u.lunge/0.18*Math.PI);ox=(u.lx||0)*f*cs*0.14;oy=(u.ly||0)*f*cs*0.14;}
  let bob=ghost?0:Math.sin(clock*2.4+i)*cs*0.012;if(hi)bob-=Math.abs(Math.sin(clock*9))*cs*0.09;
  if(!ghost&&(u.cast>0||u.bf)){ctx.save();ctx.globalCompositeOperation='lighter';const cc=u.cast>0?TYPE_COLOR[d.t[0]]:'#9dffa8',al=u.cast>0?u.cast/0.35:0.35+0.15*Math.sin(clock*8);ctx.globalAlpha=al;ctx.beginPath();ctx.ellipse(x,fy,cs*0.42,cs*0.14,0,0,7);ctx.lineWidth=3;ctx.strokeStyle=cc;ctx.stroke();if(u.cast>0){const g=ctx.createRadialGradient(x,fy-cs*0.35,0,x,fy-cs*0.35,cs*0.6);g.addColorStop(0,hexA(cc,0.5));g.addColorStop(1,hexA(cc,0));ctx.fillStyle=g;ctx.fillRect(x-cs*0.6,fy-cs*0.95,cs*1.2,cs*1.2);}ctx.restore();}
  let sc=1,sxs=1,sys=1;if(u.born>0){const q=1-u.born/0.3;sc=q<0.7?q/0.7*1.15:1.15-(q-0.7)/0.3*0.15;}else if(u.pop>0)sc=1+u.pop/0.35*0.15;
  if(u.cast>0)sc*=1+Math.sin(u.cast/0.35*Math.PI)*0.16;
  if(u.lunge>0){const q=u.lunge/0.18;if(q>0.7){sxs=1+(q-0.7)/0.3*0.14;sys=1-(q-0.7)/0.3*0.12;}else{sxs=1-q*0.06;sys=1+q*0.1;}}
  let id=d.id,tint=null;
  if(u.evo&&u.evo.T<=0.35){const p=1-u.evo.t/u.evo.T;id=p<0.5?u.evo.from:d.id;tint={c:'#ffffff',a:p<0.5?p/0.5:(1-p)/0.5};sc*=1+0.14*Math.sin(p*Math.PI);}
  else if(u.evo){const p=1-u.evo.t/u.evo.T;const on=Math.sin(p*p*46)>0;if(p<0.82){id=on?d.id:u.evo.from;tint={c:'#ffffff',a:1};sc*=1+0.18*Math.sin(p*Math.PI);}else tint={c:'#ffffff',a:(1-p)/0.18};}
  else if(u.parT>0)tint=u.slp?{c:'#8f7ad9',a:0.35}:{c:'#f5d43a',a:0.35+0.3*Math.sin(clock*25)};
  const size=sizeFor(id,cs*1.18)*sc*(u.tier===4||u.mega?1.1:1);
  if(!drawAni(id,x+ox,fy+oy+bob,size,(u.face||-1)>0,a,tint,i*0.37,sxs,sys)){ctx.beginPath();ctx.arc(x,y,cs*0.3,0,7);ctx.fillStyle=TYPE_COLOR[d.t[0]];ctx.fill();}
  if(!ghost&&u.tier>=3&&!u.evo){const ph=(clock*0.6+i*0.37)%2.4;if(ph<0.35){const h=aniH(id,size);star(x+cs*0.22,fy-h*0.85,cs*0.07*(1-Math.abs(ph-0.17)/0.17),4,'#fff6d0');}}
  if(!ghost){const h=aniH(id,size);ctx.save();upright(x,fy);
    if(u.parT>0&&u.slp){ctx.font=`400 ${Math.round(cs*0.22)}px 'Black Han Sans',sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#1b1340';
      for(let k=0;k<3;k++){const q=((clock*0.8+k/3)%1),zx=x+cs*(0.18+q*0.18),zy=fy-h*0.8-q*cs*0.4;ctx.globalAlpha=1-q;ctx.font=`400 ${Math.round(cs*(0.14+0.08*q))}px 'Black Han Sans',sans-serif`;ctx.strokeText('Z',zx,zy);ctx.fillStyle='#d9ccff';ctx.fillText('Z',zx,zy);}ctx.globalAlpha=1;}
    if(u.partner){const hx=x-cs*0.3,hy=fy-cs*0.12,r=cs*0.09;ctx.beginPath();ctx.moveTo(hx,hy+r*0.9);ctx.bezierCurveTo(hx-r*1.4,hy-r*0.1,hx-r*0.6,hy-r*1.2,hx,hy-r*0.4);ctx.bezierCurveTo(hx+r*0.6,hy-r*1.2,hx+r*1.4,hy-r*0.1,hx,hy+r*0.9);ctx.fillStyle='#ff6fae';ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle='#5a1033';ctx.stroke();
      ctx.font=`400 ${Math.round(cs*0.15)}px 'Black Han Sans',sans-serif`;ctx.textAlign='left';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#0b1226';ctx.strokeText(u.partner.lv,hx+r*1.1,hy+r*0.1);ctx.fillStyle='#ffd0e4';ctx.fillText(u.partner.lv,hx+r*1.1,hy+r*0.1);}
    if(u.item){const ix=x+cs*0.3,iy=fy-cs*0.12,r=cs*0.12;ctx.beginPath();ctx.arc(ix,iy,r,0,7);ctx.fillStyle='rgba(255,255,255,.92)';ctx.fill();ctx.lineWidth=1.4;ctx.strokeStyle='#0b1226';ctx.stroke();
      const im=ITEM_IMG[u.item];if(im&&im.complete)ctx.drawImage(im,ix-r*0.85,iy-r*0.85,r*1.7,r*1.7);}
    if(u.mega>1){ctx.font=`400 ${Math.round(cs*0.15)}px 'Black Han Sans',sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#3d0a2c';ctx.strokeText('M'+u.mega,x,fy+cs*0.02);ctx.fillStyle='#ffc2ee';ctx.fillText('M'+u.mega,x,fy+cs*0.02);}
    ctx.restore();}
}
const platEllipse=(i,grow=0)=>{const c=cellCenter(i),cs=G.cell;ctx.beginPath();ctx.ellipse(c.x,c.y+cs*0.18,cs*0.42+grow,cs*0.42*0.56+grow,0,0,7);};
const TIER_PILL={1:'rgba(10,14,12,.78)',2:'rgba(34,84,170,.92)',3:'rgba(104,52,170,.92)',4:'rgba(150,108,20,.95)'};
function drawInfo(){
  const cs=G.cell,fs=Math.round(cs*0.16);
  const pill=(x,y,w,h)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,h/2);ctx.fillStyle='rgba(10,14,12,.78)';ctx.fill();};
  for(let i=0;i<N;i++){const u=board[i];if(!u||!u.s)continue;const c=cellCenter(i),top=c.y-cs*0.62,bot=c.y+cs*0.24;ctx.save();upright(c.x,c.y);
    ctx.font=`700 ${fs}px 'IBM Plex Sans KR',sans-serif`;ctx.textBaseline='middle';ctx.textAlign='left';
    const t=u.tier===4?'전설'+(u.awk?'+'+u.awk:''):'★'+u.tier,tw=ctx.measureText(t).width,w1=fs*1.3+tw+6;
    const tw1=w1+fs*1.25,tx0=c.x-tw1/2;ctx.beginPath();ctx.roundRect(tx0,top,tw1,fs*1.35,fs*0.675);ctx.fillStyle=TIER_PILL[u.tier]||TIER_PILL[1];ctx.fill();
    roleIcon(u.s.role,tx0+fs*0.7,top+fs*0.68,fs*0.5);ctx.fillStyle='#ffffff';ctx.fillText(t,tx0+fs*1.35,top+fs*0.7);
    {const ty=u.s.t[0],r=fs*0.52,ix=tx0+tw1-fs*0.72,iy=top+fs*0.675;ctx.beginPath();ctx.arc(ix,iy,r,0,7);ctx.fillStyle=TYPE_COLOR[ty]||'#999';ctx.fill();ctx.save();ctx.translate(ix-r,iy-r);ctx.scale(r*2/24,r*2/24);ctx.fillStyle='#fff';ctx.fill(tPath(ty),'evenodd');ctx.restore();}
    const b=u.s.buff,ic=[];if(b.aD)ic.push('#ff8fb1');if(b.aR)ic.push('#6fb6ff');if(b.aC)ic.push('#f2c14e');if(b.aG)ic.push('#81c784');if(b.nveFix)ic.push('#7fe3e3');if(b.guard)ic.push('#d0d0dc');
    const lv='Lv'+(u.s.lv||0),lw2=ctx.measureText(lv).width,w2=lw2+8+ic.length*(fs*0.6);
    pill(c.x-w2/2,bot,w2,fs*1.3);ctx.fillStyle=COL.coin;ctx.fillText(lv,c.x-w2/2+4,bot+fs*0.68);
    ic.forEach((col,k)=>{ctx.beginPath();ctx.arc(c.x-w2/2+lw2+6+fs*0.3+k*fs*0.6,bot+fs*0.65,fs*0.22,0,7);ctx.fillStyle=col;ctx.fill();});
    if(u.canM){ctx.beginPath();ctx.arc(c.x+cs*0.38,top+fs*0.68,fs*0.32,0,7);ctx.fillStyle=COL.ok;ctx.fill();}
    ctx.restore();
  }
}
function drawProj(p){
  const c=TYPE_COLOR[p.ty],cs=G.cell,r=cs*0.12;
  {const tr=p.trail.concat([{x:p.x,y:p.y}]);ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';for(let k=1;k<tr.length;k++){const a=k/tr.length;ctx.globalAlpha=a*0.7;ctx.strokeStyle=p.ty==='전기'?'#fff4a0':c;ctx.lineWidth=r*1.6*a;ctx.beginPath();
    if(p.ty==='전기'){const mx=(tr[k-1].x+tr[k].x)/2+(Math.random()-.5)*r*1.6,my=(tr[k-1].y+tr[k].y)/2+(Math.random()-.5)*r*1.6;ctx.moveTo(tr[k-1].x,tr[k-1].y);ctx.lineTo(mx,my);ctx.lineTo(tr[k].x,tr[k].y);}else{ctx.moveTo(tr[k-1].x,tr[k-1].y);ctx.lineTo(tr[k].x,tr[k].y);}ctx.stroke();}ctx.restore();}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='lighter';{const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*3.2);g.addColorStop(0,hexA(c,0.55));g.addColorStop(1,hexA(c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r*3.2,0,7);ctx.fill();}ctx.globalCompositeOperation='source-over';
  ctx.save();ctx.translate(p.x,p.y);
  if(p.dart){ctx.rotate(p.ang||0);ctx.fillStyle='#b9a3ff';ctx.beginPath();ctx.moveTo(r*2,0);ctx.lineTo(-r*1.2,r*0.6);ctx.lineTo(-r*0.6,0);ctx.lineTo(-r*1.2,-r*0.6);ctx.closePath();ctx.fill();ctx.restore();return;}
  switch(p.ty){
    case '불꽃':{const g=ctx.createRadialGradient(0,0,0,0,0,r*1.6);g.addColorStop(0,'#fff3b0');g.addColorStop(0.5,'#f08a3c');g.addColorStop(1,'rgba(240,80,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*1.6,0,7);ctx.fill();break;}
    case '물':ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,0,r*1.1,0,7);ctx.fill();ctx.fillStyle='#e8f1ff';ctx.beginPath();ctx.arc(-r*0.35,-r*0.35,r*0.35,0,7);ctx.fill();break;
    case '풀':ctx.rotate(p.rot);ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,r*1.5,r*0.6,0,0,7);ctx.fill();ctx.strokeStyle='#2f6b1e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-r*1.4,0);ctx.lineTo(r*1.4,0);ctx.stroke();break;
    case '얼음':ctx.rotate(p.ang||0);ctx.fillStyle='#dff7f6';ctx.beginPath();ctx.moveTo(r*1.8,0);ctx.lineTo(0,r*0.6);ctx.lineTo(-r*1.2,0);ctx.lineTo(0,-r*0.6);ctx.closePath();ctx.fill();ctx.strokeStyle=c;ctx.stroke();break;
    case '독':ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*1.1,0,7);ctx.stroke();ctx.fillStyle=c+'88';ctx.fill();break;
    case '비행':ctx.rotate(p.ang||0);ctx.strokeStyle='#f4f1ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(-r,0,r*1.6,-1.1,1.1);ctx.stroke();break;
    case '고스트':{const w=Math.sin(p.rot)*r*0.3;ctx.fillStyle='#2b1c3d';ctx.beginPath();ctx.arc(0,w,r*1.3,0,7);ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();break;}
    case '드래곤':ctx.rotate(p.ang||0);ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,r*2,r*0.8,0,0,7);ctx.fill();ctx.fillStyle='#d9c8ff';ctx.beginPath();ctx.ellipse(r*0.4,0,r*0.9,r*0.35,0,0,7);ctx.fill();break;
    case '악':ctx.rotate(p.ang||0);ctx.strokeStyle='#3a2c22';ctx.lineWidth=3;ctx.beginPath();ctx.arc(-r,0,r*1.5,-1,1);ctx.stroke();ctx.strokeStyle=c;ctx.lineWidth=1;ctx.stroke();break;
    case '강철':ctx.rotate(p.rot);star(0,0,r*1.5,4,'#e4e6f2');break;
    case '페어리':ctx.rotate(p.rot*0.5);star(0,0,r*1.6,4,'#ffd1ea');star(0,0,r*0.7,4,'#ffffff');break;
    case '벌레':ctx.fillStyle=c;for(let k=0;k<4;k++){const a=p.rot+k*1.57;ctx.beginPath();ctx.arc(Math.cos(a)*r*0.8,Math.sin(a)*r*0.8,r*0.45,0,7);ctx.fill();}break;
    case '바위':ctx.rotate(p.rot*0.3);ctx.fillStyle='#8a7340';ctx.beginPath();for(let k=0;k<6;k++){const a=k*1.047,rr=r*(1.3+(k%2)*0.3);ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fill();ctx.strokeStyle=c;ctx.stroke();break;
    case '격투':star(0,0,r*1.5,5,c);break;
    case '땅':ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,0,r*1.1,0,7);ctx.fill();break;
    case '에스퍼':ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*(1+0.4*Math.sin(p.rot)),0,7);ctx.stroke();break;
    case '전기':star(0,0,r*1.4,4,'#fff4a0');break;
    default:star(0,0,r*1.3,5,'#ffffff');
  }
  ctx.restore();
}
function drawFx(f){
  const a=Math.max(0,f.t/f.T),p=1-a;ctx.globalAlpha=a;
  switch(f.k){
    case 'beam':ctx.strokeStyle=f.col;ctx.lineWidth=f.w;ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();ctx.strokeStyle='#ffffff';ctx.lineWidth=f.w*0.35;ctx.stroke();break;
    case 'bolt':ctx.strokeStyle=f.col;ctx.lineWidth=2.5;ctx.beginPath();f.pts.forEach((q,k)=>k?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();ctx.strokeStyle='#ffffff';ctx.lineWidth=1;ctx.stroke();break;
    case 'ring':ctx.strokeStyle=f.col;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(0.85+0.25*p),0,7);ctx.stroke();break;
    case 'blast':ctx.fillStyle=f.col+'55';ctx.beginPath();ctx.arc(f.x,f.y,f.r*(0.5+0.5*p),0,7);ctx.fill();ctx.strokeStyle=f.col;ctx.lineWidth=2;ctx.stroke();break;
    case 'puff':ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(0.6+0.8*p),0,7);ctx.fill();break;
    case 'wave':ctx.strokeStyle=f.col;ctx.lineWidth=3;for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(f.x,f.y,f.r*Math.min(1,p+k*0.15),0,7);ctx.stroke();}break;
    case 'crack':{ctx.strokeStyle=f.col;ctx.lineWidth=2.5;let s=f.seed*1000;for(let k=0;k<8;k++){const ang=k*0.785+(s%1);s=s*1.7+0.3;const r=f.r*Math.min(1,p*1.6);ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x+Math.cos(ang)*r*0.5+Math.sin(ang*3)*4,f.y+Math.sin(ang)*r*0.5);ctx.lineTo(f.x+Math.cos(ang)*r,f.y+Math.sin(ang)*r);ctx.stroke();}
      ctx.globalAlpha=a*0.25;ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(f.x,f.y,f.r*Math.min(1,p*1.6),0,7);ctx.fill();break;}
    case 'notes':{ctx.fillStyle=f.col;ctx.font=`700 ${Math.round(G.cell*0.28)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';for(let k=0;k<6;k++){const ang=k*1.047+p*1.5;const r=f.r*(0.3+0.6*p);ctx.fillText(k%2?'♪':'♫',f.x+Math.cos(ang)*r,f.y+Math.sin(ang)*r);}
      ctx.globalAlpha=a*0.12;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,7);ctx.fill();break;}
    case 'punch':star(f.x,f.y,f.r*(0.7+0.6*p),6,f.col);star(f.x,f.y,f.r*0.4,6,'#ffffff');break;
    case 'txt':{ctx.save();upright(f.x,f.y);ctx.fillStyle=f.col;ctx.strokeStyle='#0b1226';ctx.lineWidth=4;ctx.lineJoin='round';ctx.font=`400 ${Math.round(G.cell*(f.big?0.3:0.22)*(p<0.12?1.4-p/0.12*0.4:1))}px 'Black Han Sans',sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeText(f.s,f.x,f.y-p*G.cell*0.35);ctx.fillText(f.s,f.x,f.y-p*G.cell*0.35);ctx.restore();break;}
    case 'num':{const pop=p<0.15?1+(0.15-p)/0.15*0.6:1,fs=Math.round(G.cell*(f.big?0.36:f.minor?0.2:0.26)*pop);ctx.save();if(f.minor)ctx.globalAlpha*=0.72;upright(f.x,f.y);ctx.font=`400 ${fs}px 'Black Han Sans',sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      const yy=f.y-p*G.cell*0.45;ctx.lineWidth=Math.max(f.minor?2:3,fs*0.24);ctx.strokeStyle='#0b1226';ctx.lineJoin='round';ctx.strokeText(f.s,f.x,yy);ctx.fillStyle=f.col;ctx.fillText(f.s,f.x,yy);ctx.restore();break;}
    case 'flash':ctx.globalCompositeOperation='lighter';ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(f.x,f.y,f.r*(0.6+p*0.8),0,7);ctx.fill();ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(1+p*0.9),0,7);ctx.globalAlpha=a*0.5;ctx.fill();ctx.globalCompositeOperation='source-over';break;
    case 'die':ctx.globalAlpha=1;drawAni(f.sid,f.x,f.y,f.size*(1-p*0.6),f.flip,a,{c:'#ffffff',a:Math.min(1,0.4+p)},0,1+p*0.4,1-p*0.5);break;
    case 'skbeam':{const T2=f.T-(f.delay||0),lt=f.t;if(lt>T2)break;const q=lt/T2,w=f.w*(0.4+0.6*q);ctx.globalAlpha=Math.min(1,q*1.6);ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
      ctx.strokeStyle=hexA(f.col,0.55);ctx.lineWidth=w*2;ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();
      ctx.strokeStyle=f.col;ctx.lineWidth=w;ctx.stroke();ctx.strokeStyle='#ffffff';ctx.lineWidth=w*0.4;ctx.stroke();ctx.globalCompositeOperation='source-over';ctx.lineCap='butt';break;}
    case 'nova':{ctx.globalCompositeOperation='lighter';const r=f.r*(0.3+0.7*Math.min(1,p*2.2));ctx.globalAlpha=a*0.35;ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(f.x,f.y,r,0,7);ctx.fill();
      ctx.globalAlpha=a;ctx.strokeStyle='#ffffff';ctx.lineWidth=4*a+1;ctx.beginPath();ctx.arc(f.x,f.y,r,0,7);ctx.stroke();ctx.strokeStyle=f.col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x,f.y,r*0.7,0,7);ctx.stroke();ctx.globalCompositeOperation='source-over';break;}
    case 'charge':{ctx.globalAlpha=1;ctx.globalCompositeOperation='lighter';const r=f.r*(0.3+0.9*p);const g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,r);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(0.4,hexA(f.col,0.6));g.addColorStop(1,hexA(f.col,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,r,0,7);ctx.fill();
      for(let k=0;k<8;k++){const an=k*0.785+clock*4,d=f.r*1.6*(1-p);ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(f.x+Math.cos(an)*d,f.y+Math.sin(an)*d,2,0,7);ctx.fill();}ctx.globalCompositeOperation='source-over';break;}
    case 'slash':ctx.strokeStyle=f.col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(f.x-f.r,f.y-f.r);ctx.lineTo(f.x+f.r,f.y+f.r);ctx.moveTo(f.x+f.r,f.y-f.r);ctx.lineTo(f.x-f.r,f.y+f.r);ctx.stroke();break;
    case 'absorb':for(let k=0;k<6;k++){const q=Math.max(0,Math.min(1,p*1.3-k*0.06));ctx.beginPath();ctx.arc(f.x1+(f.x2-f.x1)*q,f.y1+(f.y2-f.y1)*q,G.cell*0.07*(1-k*0.12),0,7);ctx.fillStyle=k%2?'#ffe9a8':'#f2c14e';ctx.fill();}break;
  }
  ctx.globalAlpha=1;
}
// 처음 얻은 전설·메가: 화면을 어둡게 하고 빛줄기 가운데에 크게. 누르면 넘어가요
const evoT=()=>{const s=(state&&state.speed)||1;return s>=3?0.18:s>=2?0.22:0.3;};
function markReveal(u){if(!u||state.mode==='tut')return;const k='rv'+def(u).id;if(!PROG.seen)PROG.seen={};if(PROG.seen[k])return;PROG.seen[k]=1;saveProg();u.reveal=1;}
function drawReveal(){
  const r=state.reveal,{W,H,cell}=G,p=1-r.t/r.T,a=Math.min(1,p*5)*(p>0.85?(1-p)/0.15:1),e=1-Math.pow(1-Math.min(1,p*2.2),3),col=r.mega?'255,130,225':'255,214,110';
  ctx.save();ctx.fillStyle=`rgba(6,8,22,${0.82*a})`;ctx.fillRect(0,0,W,H);
  const cx=W/2,cy=H*0.5;ctx.globalCompositeOperation='lighter';ctx.translate(cx,cy);ctx.rotate(clock*0.35);
  for(let k=0;k<12;k++){ctx.rotate(Math.PI/6);ctx.fillStyle=`rgba(${col},${0.10*a})`;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-W*0.09,-H*0.6);ctx.lineTo(W*0.09,-H*0.6);ctx.closePath();ctx.fill();}
  ctx.setTransform(G.dpr,0,0,G.dpr,0,0);
  const g=ctx.createRadialGradient(cx,cy,0,cx,cy,W*0.45);g.addColorStop(0,`rgba(${col},${0.35*a})`);g.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.restore();
  drawAni(r.id,cx,cy+cell*1.3,sizeFor(r.id,cell*2.8)*(0.75+0.25*e),false,a);
  ctx.save();ctx.globalAlpha=a;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.lineJoin='round';
  ctx.font=`700 ${Math.round(W*0.042)}px 'IBM Plex Sans KR',sans-serif`;ctx.fillStyle=r.mega?'#ffc2ee':'#ffe08a';ctx.fillText(r.mega?'처음 보는 메가진화':'처음 만난 전설',cx,H*0.2);
  ctx.font=`400 ${Math.round(W*0.11)}px 'Black Han Sans',sans-serif`;ctx.lineWidth=8;ctx.strokeStyle='#0b1226';ctx.strokeText(r.n,cx,H*0.2+W*0.13);ctx.fillStyle='#ffffff';ctx.fillText(r.n,cx,H*0.2+W*0.13);
  ctx.font=`500 ${Math.round(W*0.034)}px 'IBM Plex Sans KR',sans-serif`;ctx.globalAlpha=a*0.7;ctx.fillStyle='#dfe6ff';ctx.fillText('도감에 새로 올랐어요 · 눌러서 넘기기',cx,H*0.82);
  ctx.restore();
}
function drawCut(){
  const c=state.cut,{W,H,cell}=G,p=1-c.t/c.T,g=c.g;
  let h=H*0.3*Math.min(1,p*6);if(p>0.86)h*=1-(p-0.86)/0.14;
  ctx.fillStyle='#050706';ctx.fillRect(0,0,W,h);ctx.fillRect(0,H-h,W,h);
  const band=Math.min(1,p*5)*(p>0.86?1-(p-0.86)/0.14:1);
  if(band>0){ctx.globalAlpha=band;ctx.fillStyle=g.col;ctx.fillRect(0,H/2-H*0.2,W,H*0.4);
    ctx.fillStyle='rgba(0,0,0,.25)';for(let k=0;k<8;k++)ctx.fillRect(((k*W/6+clock*W*0.6)%(W*1.4))-W*0.2,H/2-H*0.2,W*0.04,H*0.4);
    const e=Math.min(1,p*2.4),ease=1-Math.pow(1-e,3),bx=W*1.25-W*0.5*ease;
    drawAni(g.id,bx,H/2+H*0.18,sizeFor(g.id,cell*1.9),false,band);
    const tx=-W*0.4+W*0.46*ease;
    ctx.fillStyle='#10140f';ctx.textAlign='left';ctx.textBaseline='alphabetic';
    ctx.font=`400 ${Math.round(W*0.075)}px 'Black Han Sans',sans-serif`;ctx.fillText(g.title||`체육관 관장 ${g.lead}`,tx,H/2-H*0.02);
    ctx.font=`700 ${Math.round(W*0.042)}px 'IBM Plex Sans KR',sans-serif`;ctx.fillText(g.title2||`${josa(g.lead,'이','가')} 승부를 걸어왔다!`,tx,H/2+H*0.09);
    ctx.globalAlpha=1;}
}
// ───────── 타격감: 파티클·숫자·몬스터볼 ─────────
let parts=[];
const PSTYLE={'불꽃':'ember','물':'drop','전기':'spark','풀':'leaf','얼음':'shard','바위':'debris','땅':'debris','고스트':'smoke','악':'smoke','독':'smoke','에스퍼':'star','페어리':'star','드래곤':'spark','격투':'spark','노말':'spark','비행':'spark','강철':'spark','벌레':'leaf'};
function burst(x,y,ty,n,pow=1){
  if(parts.length>420)n=Math.min(n,3);
  const st=PSTYLE[ty]||'spark',col=TYPE_COLOR[ty]||'#ffffff',cs=G.cell;
  for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,sp=cs*(1.2+Math.random()*2.2)*pow;
    const p={x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,g:0,L:0.35+Math.random()*0.25,size:cs*0.05*(0.7+Math.random()*0.7),col,st,rot:Math.random()*6,vr:(Math.random()-.5)*14,add:false};
    if(st==='ember'){p.vy-=cs*1.5;p.g=-cs*1.5;p.add=true;p.col=Math.random()<.5?'#ffd36b':'#ff8a3a';}
    else if(st==='drop'){p.vy-=cs*1.8;p.g=cs*9;p.col=Math.random()<.5?'#cfe4ff':col;}
    else if(st==='spark'){p.add=true;p.L*=0.7;p.vx*=1.4;p.vy*=1.4;p.col=ty==='전기'?'#fff4a0':Math.random()<.5?'#ffffff':col;}
    else if(st==='leaf'){p.g=cs*2;p.L+=0.2;p.size*=1.3;}
    else if(st==='shard'){p.g=cs*5;p.col=Math.random()<.5?'#ffffff':'#bff3f1';p.size*=1.2;}
    else if(st==='debris'){p.vy-=cs*2;p.g=cs*10;p.col=Math.random()<.5?'#8a7340':'#5f4c2c';p.size*=1.3;}
    else if(st==='smoke'){p.vx*=0.35;p.vy=p.vy*0.35-cs*0.6;p.size*=2.4;p.L+=0.25;}
    else if(st==='star'){p.add=true;p.col=Math.random()<.5?'#ffd1ea':'#ffffff';}
    parts.push(p);}
}
function coinFly(x,y,n){for(let k=0;k<Math.min(n,4);k++)if(parts.length<460)parts.push({x:x+(Math.random()-.5)*8,y,vx:(Math.random()-.5)*G.cell*2,vy:-G.cell*(2+Math.random()),g:0,L:0.9,size:G.cell*0.07,col:'#f5c542',st:'coin',rot:0,vr:0,home:0.25+k*0.04,add:false});}
function updParts(dt){
  const tx=G.W-70,ty=toWY(24);
  for(const p of parts){p.L-=dt;
    if(p.st==='coin'){p.home-=dt;if(p.home<=0){const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy)||1,sp=G.cell*14;p.vx+=(dx/d*sp-p.vx)*Math.min(1,dt*10);p.vy+=(dy/d*sp-p.vy)*Math.min(1,dt*10);if(d<18){p.L=0;coinBump();}}else{p.vy+=G.cell*6*dt;}}
    else{p.vy+=p.g*dt;p.vx*=Math.pow(0.12,dt);p.vy*=Math.pow(0.35,dt);}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;}
  parts=parts.filter(p=>p.L>0);
}
let bumpT=0;function coinBump(){if(bumpT>0)return;bumpT=0.12;const c=$('coins');c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump');}
function drawParts(){
  for(const p of parts){const a=Math.min(1,p.L/0.25);ctx.globalAlpha=a;if(p.add)ctx.globalCompositeOperation='lighter';
    switch(p.st){
      case 'spark':{const sp=Math.hypot(p.vx,p.vy)*0.035+1;ctx.strokeStyle=p.col;ctx.lineWidth=p.size*0.9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx/(Math.hypot(p.vx,p.vy)||1)*sp*p.size*2,p.y-p.vy/(Math.hypot(p.vx,p.vy)||1)*sp*p.size*2);ctx.stroke();break;}
      case 'leaf':ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.col;ctx.beginPath();ctx.ellipse(0,0,p.size*1.4,p.size*0.6,0,0,7);ctx.fill();ctx.restore();break;
      case 'shard':case 'debris':ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.col;ctx.beginPath();ctx.moveTo(0,-p.size);ctx.lineTo(p.size*0.8,p.size*0.6);ctx.lineTo(-p.size*0.8,p.size*0.5);ctx.closePath();ctx.fill();ctx.restore();break;
      case 'smoke':ctx.globalAlpha=a*0.45;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size*(1.6-a*0.6),0,7);ctx.fill();break;
      case 'star':ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);star(0,0,p.size*1.4,4,p.col);ctx.restore();break;
      case 'coin':ctx.globalAlpha=1;ctx.fillStyle='#b98a14';ctx.beginPath();ctx.arc(p.x,p.y+1,p.size,0,7);ctx.fill();ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,7);ctx.fill();ctx.fillStyle='#fff3c4';ctx.fillRect(p.x-p.size*0.4,p.y-p.size*0.5,p.size*0.35,p.size*0.35);break;
      default:ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,7);ctx.fill();}
    ctx.globalCompositeOperation='source-over';}
  ctx.globalAlpha=1;
}
// 피해 숫자: 적마다 0.2초씩 모아서 띄운다
function dmgPop(e,d,m,crit){e.dAcc=(e.dAcc||0)+d;e.dEff=Math.max(e.dEff||0,m>=2?2:m<1?0:1);if(crit)e.dCrit=true;if(!(e.dT>0))e.dT=0.2*(state.speed||1);}
// 적 상태 아이콘: 둥근 배지 안에 작은 그림
const ST_COL={burn:'#f08a3c',pois:'#b25cb0',zap:'#f5d43a',frz:'#7fd8f0',sleep:'#8f7ad9',stun:'#f2c14e',yawn:'#b7a8e8',conf:'#ffb347',deb:'#5b8fd6',mark:'#e8413a'};
function statusIcon(k,x,y,r){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fillStyle=ST_COL[k]||'#888';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#0b1226';ctx.stroke();
  ctx.fillStyle='#fff';ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(1.2,r*0.22);ctx.lineCap='round';ctx.lineJoin='round';const s=r*0.62;ctx.beginPath();
  if(k==='burn'){ctx.moveTo(x,y-s);ctx.bezierCurveTo(x+s,y-s*0.1,x+s*0.8,y+s,x,y+s);ctx.bezierCurveTo(x-s*0.8,y+s,x-s,y-s*0.1,x,y-s);ctx.fill();}
  else if(k==='pois'){ctx.moveTo(x,y-s);ctx.quadraticCurveTo(x+s,y+s*0.2,x,y+s);ctx.quadraticCurveTo(x-s,y+s*0.2,x,y-s);ctx.fill();}
  else if(k==='zap'){ctx.moveTo(x+s*0.3,y-s);ctx.lineTo(x-s*0.5,y+s*0.1);ctx.lineTo(x+s*0.05,y+s*0.1);ctx.lineTo(x-s*0.3,y+s);ctx.lineTo(x+s*0.5,y-s*0.1);ctx.lineTo(x-s*0.05,y-s*0.1);ctx.closePath();ctx.fillStyle='#3b2b00';ctx.fill();}
  else if(k==='frz'){for(let a=0;a<3;a++){const t=a*Math.PI/3;ctx.moveTo(x-Math.cos(t)*s,y-Math.sin(t)*s);ctx.lineTo(x+Math.cos(t)*s,y+Math.sin(t)*s);}ctx.stroke();}
  else if(k==='sleep'||k==='yawn'){ctx.moveTo(x-s*0.6,y-s*0.6);ctx.lineTo(x+s*0.6,y-s*0.6);ctx.lineTo(x-s*0.6,y+s*0.6);ctx.lineTo(x+s*0.6,y+s*0.6);ctx.stroke();}
  else if(k==='stun'){for(let a=0;a<5;a++){const t=a*Math.PI*2/5-Math.PI/2,t2=t+Math.PI/5;ctx.lineTo(x+Math.cos(t)*s,y+Math.sin(t)*s);ctx.lineTo(x+Math.cos(t2)*s*0.45,y+Math.sin(t2)*s*0.45);}ctx.closePath();ctx.fill();}
  else if(k==='conf'){ctx.arc(x,y,s*0.75,Math.PI,Math.PI*2.6);ctx.stroke();}
  else if(k==='deb'){ctx.moveTo(x,y-s);ctx.lineTo(x,y+s*0.7);ctx.moveTo(x-s*0.6,y+s*0.1);ctx.lineTo(x,y+s*0.8);ctx.lineTo(x+s*0.6,y+s*0.1);ctx.stroke();}
  else if(k==='mark'){ctx.arc(x,y,s*0.75,0,7);ctx.moveTo(x+s*0.25,y);ctx.arc(x,y,s*0.25,0,7);ctx.stroke();}
  ctx.restore();}
function flushPop(e){if(!(e.dAcc>0))return;let n=0;for(const f of fx)if(f.k==='num')n++;
  const sp=state.speed||1;
  // 배속이 높을수록 숫자를 덜 띄운다: 동시에 뜨는 개수를 줄이고, 체력의 2%도 안 되는 작은 피해는 3배속에서 생략
  if(n<36/sp&&!(sp>=3&&!e.dCrit&&e.dAcc<e.max*0.02&&!e.boss)){const col=e.dCrit?'#ffe14d':e.dEff===2?'#ffb347':e.dEff===0?'#b9c3c0':'#ffffff';
    fx.push({k:'num',x:Math.min(G.W-G.cell*0.3,Math.max(G.cell*0.3,e.x+(Math.random()-.5)*G.cell*0.3)),y:Math.max(G.cell*0.55,e.y-G.cell*0.35),s:fmt(e.dAcc)+(e.dCrit?'!':''),col,big:e.dCrit||e.dAcc>e.max*0.4,minor:!e.dCrit&&e.dEff!==2&&!(e.dAcc>e.max*0.4),t:.7,T:.7});}
  e.dAcc=0;e.dCrit=false;e.dEff=0;e.dT=0;}
// 포획: 던진 볼이 포물선으로 날아가고, 잡힌 자리에서 세 번 흔들린다
function drawCatch(){const cs=G.cell;
  for(const t of state.throws||[]){const p=Math.min(1,t.t/t.T),e=t.e,x=t.x0+(e.x-t.x0)*p,y=t.y0+(e.y-cs*0.3-t.y0)*p-Math.sin(p*Math.PI)*cs*2.2;
    if(t.master){ctx.save();ctx.translate(x,y);ctx.rotate(p*14);ctx.beginPath();ctx.arc(0,0,cs*0.15,Math.PI,0);ctx.fillStyle='#7b3fc4';ctx.fill();ctx.beginPath();ctx.arc(0,0,cs*0.15,0,Math.PI);ctx.fillStyle='#f4f4f4';ctx.fill();ctx.restore();}
    else drawBall(x,y,cs*0.15,p*14);}
  for(const c of state.capt||[]){const p=1-c.t/c.T,wob=p<0.85?Math.sin(p*3*Math.PI*2)*0.5*(1-p):0;
    ctx.save();upright(c.x,c.y);if(p<0.12){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(255,120,120,${0.6*(1-p/0.12)})`;ctx.beginPath();ctx.arc(c.x,c.y-cs*0.2,cs*0.5*(1-p/0.12)+cs*0.1,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';}
    drawBall(c.x,c.y-cs*0.12,cs*0.16,wob);if(p>0.85&&c.ok){for(let k=0;k<3;k++)star(c.x+(k-1)*cs*0.22,c.y-cs*0.42-(p-0.85)*cs*1.2,cs*0.06,4,'#fff6c8');}ctx.restore();}
}
function drawBall(x,y,r,rot){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);
  ctx.beginPath();ctx.arc(0,0,r,Math.PI,0);ctx.fillStyle='#e8413a';ctx.fill();
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI);ctx.fillStyle='#f4f4f4';ctx.fill();
  ctx.fillStyle='#1c1c1c';ctx.fillRect(-r,-r*0.13,r*2,r*0.26);
  ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.lineWidth=Math.max(1.2,r*0.14);ctx.strokeStyle='#1c1c1c';ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,r*0.32,0,7);ctx.fillStyle='#f4f4f4';ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(-r*0.35,-r*0.5,r*0.18,0,7);ctx.fillStyle='rgba(255,255,255,.7)';ctx.fill();
  ctx.restore();
}
function drawCallout(){const c=callout,{W,H}=G,p=1-c.t/c.T,a=p<0.12?p/0.12:p>0.8?(1-p)/0.2:1,sm=H<720,h=W*(sm?0.07:0.085),sb=$('summon'),floor=Math.min(H-(($('dockbar')||{}).offsetHeight||0),sb?sb.getBoundingClientRect().top-stage.getBoundingClientRect().top:H);
  const yy=Math.min(toSY(G.oy+G.bh)-h*0.5,floor-h-(sm?2:4))+(1-Math.min(1,p/0.12))*10;
  ctx.save();ctx.globalAlpha=a;ctx.font=`900 ${Math.round(W*(sm?0.04:0.046))}px 'IBM Plex Sans KR',sans-serif`;const tw=ctx.measureText(c.s).width,w=tw+W*0.08,x=(W-w)/2;
  ctx.beginPath();ctx.roundRect(x,yy,w,h,10);ctx.fillStyle='#fbf7ea';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#3d4a6b';ctx.stroke();ctx.fillStyle=c.col;ctx.fillRect(x+8,yy+h-6,w-16,2.5);
  ctx.fillStyle='#24303e';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(c.s,W/2,yy+h/2);ctx.restore();}
function drawBanner(){
  const b=state.banner,{W,H}=G,p=1-b.t/b.T;
  const ein=Math.min(1,p/0.22),eout=p>0.75?(p-0.75)/0.25:0;
  const x=-W+W*(1-Math.pow(1-ein,3))+W*eout*eout,y=H*0.5;
  ctx.save();ctx.globalAlpha=1-eout;ctx.translate(x,0);
  ctx.fillStyle='rgba(10,14,16,.72)';ctx.beginPath();ctx.moveTo(W*0.08,y-H*0.09);ctx.lineTo(W*1.0,y-H*0.09);ctx.lineTo(W*0.92,y+H*0.09);ctx.lineTo(0,y+H*0.09);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f5c542';ctx.fillRect(W*0.06,y+H*0.09-3,W*0.88,3);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`400 ${Math.round(W*0.11)}px 'Black Han Sans',sans-serif`;
  ctx.fillStyle='#000';ctx.fillText(b.s,W/2+2,y+3);ctx.fillStyle='#ffffff';ctx.fillText(b.s,W/2,y);
  if(b.sub){ctx.font=`700 ${Math.round(W*0.035)}px 'IBM Plex Sans KR',sans-serif`;ctx.fillStyle='#f5c542';ctx.fillText(b.sub,W/2,y+H*0.065);}
  ctx.restore();
}

let shake=0,nightA=0;
function drawRocks(){
  const cell=G.cell;
  for(const i of state.rocks){const c=cellCenter(i),x=c.x,y=c.y+cell*0.12,s=cell*0.34,arm=state.rockArm===i;
    ctx.save();upright(x,y);
    ctx.beginPath();ctx.ellipse(x,y+s*0.15,s*1.05,s*0.32,0,0,7);ctx.fillStyle='rgba(0,0,0,.28)';ctx.fill();
    const g=ctx.createLinearGradient(x-s,y-s*1.3,x+s,y);g.addColorStop(0,'#b9ab95');g.addColorStop(1,'#6f6352');
    ctx.beginPath();ctx.moveTo(x-s,y);ctx.lineTo(x-s*0.85,y-s*0.7);ctx.lineTo(x-s*0.3,y-s*1.15);ctx.lineTo(x+s*0.45,y-s*1.05);ctx.lineTo(x+s*0.95,y-s*0.55);ctx.lineTo(x+s,y);ctx.closePath();
    ctx.fillStyle=g;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#3e352a';ctx.stroke();
    ctx.beginPath();ctx.moveTo(x-s*0.2,y-s*1.0);ctx.lineTo(x-s*0.05,y-s*0.55);ctx.lineTo(x+s*0.25,y-s*0.35);ctx.moveTo(x-s*0.05,y-s*0.55);ctx.lineTo(x-s*0.4,y-s*0.3);ctx.lineWidth=1.4;ctx.stroke();
    ctx.beginPath();ctx.moveTo(x-s*0.7,y-s*0.65);ctx.lineTo(x-s*0.3,y-s*1.0);ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=2;ctx.stroke();
    if(arm){ctx.beginPath();ctx.ellipse(x,y+s*0.15,s*1.2,s*0.4,0,0,7);ctx.strokeStyle=`rgba(255,216,74,${0.6+0.4*Math.sin(clock*8)})`;ctx.lineWidth=3;ctx.stroke();}
    ctx.restore();}
}
function drawWeather(){const wk=state.phase!=='draft'?weatherAt(state.wave):null;if(!wk)return;const {W,H}=G;
  if(wk==='rain'){ctx.strokeStyle='rgba(190,215,255,.35)';ctx.lineWidth=1.2;ctx.beginPath();for(let k=0;k<70;k++){const x=((k*53.3+clock*90)%(W+60))-30,y=((k*97.1+clock*620)%(H+40))-20;ctx.moveTo(x,y);ctx.lineTo(x-4,y+14);}ctx.stroke();ctx.fillStyle='rgba(40,60,110,.12)';ctx.fillRect(0,0,W,H);}
  else if(wk==='sun'){const g=ctx.createRadialGradient(W*0.85,0,0,W*0.85,0,H*0.7);g.addColorStop(0,'rgba(255,230,150,.28)');g.addColorStop(1,'rgba(255,230,150,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
  else if(wk==='sand'){ctx.fillStyle='rgba(214,180,120,.16)';ctx.fillRect(0,0,W,H);ctx.fillStyle='rgba(235,205,150,.55)';for(let k=0;k<60;k++){const x=((k*71.7+clock*260)%(W+40))-20,y=(k*37.3+Math.sin(clock*2+k)*12)%H;ctx.fillRect(x,y,2.4,1.2);}}
  else if(wk==='snow'){ctx.fillStyle='rgba(225,238,255,.10)';ctx.fillRect(0,0,W,H);ctx.fillStyle='rgba(255,255,255,.9)';for(let k=0;k<70;k++){const s=1.2+(k%4)*0.7,x=((k*47.3+clock*(12+k%5*4)+Math.sin(clock*0.8+k)*14)%W+W)%W,y=((k*53.9+clock*(28+s*14))%(H+20))-10;ctx.beginPath();ctx.arc(x,y,s,0,7);ctx.fill();}}
  else if(wk==='hail'){ctx.fillStyle='rgba(235,248,255,.85)';for(let k=0;k<50;k++){const x=((k*61.1+Math.sin(clock+k)*20)%W+W)%W,y=((k*43.9+clock*120)%(H+20))-10;ctx.beginPath();ctx.arc(x,y,1.6,0,7);ctx.fill();}ctx.fillStyle='rgba(200,230,255,.08)';ctx.fillRect(0,0,W,H);}
}
function draw(){
  const {W,H,cell}=G;
  const sx=shake>0.2?(Math.random()-.5)*shake:0,sy=shake>0.2?(Math.random()-.5)*shake:0;
  // 카메라: 관장 등장·전설 합체 때 잠깐 확대
  const z=camP>0?1+0.07*Math.sin(Math.PI*(1-camP/camT)):1,Cx=W/2,Cy=G.Y0+(H-G.Y0)*0.45,d=G.dpr;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,cv.width,cv.height);
  ctx.drawImage(bg,0,0,bg.width,bg.height,(Cx*(1-z)+z*sx)*d,(Cy*(1-z)+z*sy)*d,cv.width*z,cv.height*z);
  // 세계 변환: 세로를 KY배로
  ctx.setTransform(d*z,0,0,d*G.ky*z,(Cx*(1-z)+z*sx)*d,(Cy*(1-z)+z*(G.Y0*(1-G.ky)+sy))*d);UPR=1/G.ky;
  drawTiles();
  for(const z of zones){const a=Math.min(1,z.t/0.6);
    if(z.rock){ctx.globalAlpha=a;for(let k=0;k<4;k++){const ang=k*1.57+z.x,rx=z.x+Math.cos(ang)*z.r*0.5,ry=z.y+Math.sin(ang)*z.r*0.35-cell*0.12+Math.sin(clock*3+k)*cell*0.03,s=cell*0.08;
      ctx.beginPath();ctx.moveTo(rx,ry-s*1.4);ctx.lineTo(rx+s,ry+s*0.6);ctx.lineTo(rx-s,ry+s*0.6);ctx.closePath();ctx.fillStyle=k&1?'#c9b07a':'#9a8455';ctx.fill();ctx.strokeStyle='#4a3d24';ctx.lineWidth=1;ctx.stroke();}ctx.globalAlpha=1;continue;}
    ctx.globalAlpha=0.28*a;ctx.fillStyle=z.col;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,7);ctx.fill();ctx.globalAlpha=1;}
  const sel=state.sel,su=sel>=0?board[sel]:null;
  if(su){const c=cellCenter(sel);
    if(!isAura(su.s.mech)){ctx.beginPath();ctx.arc(c.x,c.y,su.s.range*cell,0,7);ctx.fillStyle='rgba(242,193,78,.07)';ctx.fill();ctx.strokeStyle='rgba(242,193,78,.45)';ctx.lineWidth=1;ctx.stroke();}
    else{ctx.fillStyle='rgba(129,199,132,.22)';const c0=sel%COLS,r0=(sel/COLS)|0,rad=su.tier>=3?2:1;
      for(let dr=-rad;dr<=rad;dr++)for(let dc=-rad;dc<=rad;dc++){if(!dr&&!dc)continue;const cc=c0+dc,rr=r0+dr;if(cc<0||rr<0||cc>=COLS||rr>=ROWS||!OPEN[rr*COLS+cc])continue;platEllipse(rr*COLS+cc,3);ctx.fill();}}
    platEllipse(sel,4);ctx.strokeStyle=COL.coin;ctx.lineWidth=3;ctx.stroke();}
  if(state.rocks&&state.rocks.length)drawRocks();
  const dragging=drag&&down&&down.moved;
  for(let i=0;i<N;i++){const u=board[i];if(!u)continue;const c=cellCenter(i);drawUnit(u,i,c.x,c.y,dragging&&drag.from===i?0.3:1,false);}
  const es=enemies.slice().sort((a,b)=>a.y-b.y);
  for(const e of es){
    const size=sizeFor(e.sid,e.boss?cell*1.6:cell*0.88)*(e.big||1),kb=e.kb||0,ex=e.x-(e.mdx||0)*kb,fy=e.y+cell*0.14-(e.mdy||0)*kb,h=aniH(e.sid,size),sq=e.hitT>0?e.hitT/0.08:0;
    ctx.beginPath();ctx.ellipse(e.x,fy,size*0.3,size*0.1,0,0,7);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=hexA(TYPE_COLOR[e.t[0]]||'#ffffff',0.85);ctx.stroke();
    if(e.ph2){ctx.beginPath();ctx.ellipse(e.x,fy,size*0.42,size*0.14,0,0,7);ctx.lineWidth=3;ctx.strokeStyle=`rgba(255,80,70,${0.55+0.35*Math.sin(clock*8)})`;ctx.stroke();}
    if(e.wild){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(255,90,74,${0.5+0.35*Math.sin(clock*8)})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(e.x,fy,size*0.46,size*0.16,0,0,7);ctx.stroke();ctx.restore();}
    if(e.boss||(e.big||1)>1){ctx.save();ctx.globalCompositeOperation='lighter';const ar=size*(0.42+0.04*Math.sin(clock*5)),gg=ctx.createRadialGradient(e.x,fy,0,e.x,fy,ar);gg.addColorStop(0,'rgba(0,0,0,0)');gg.addColorStop(0.7,e.boss?hexA((gymAt(state.wave)||{col:'#ff5a4a'}).col,0.28):'rgba(255,90,70,.22)');gg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gg;ctx.beginPath();ctx.arc(e.x,fy,ar,0,7);ctx.fill();ctx.restore();}
    if(e.boss&&GIM_N[e.gim]&&e.gT<1.6&&e.gT>0){const q=1-e.gT/1.6;ctx.strokeStyle=`rgba(255,80,70,${0.5+0.4*Math.sin(clock*18)})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(e.x,fy,size*(0.7-0.25*q),size*(0.7-0.25*q)*0.5,0,0,7);ctx.stroke();}
    if(e.boss&&e.smokeT>0){ctx.fillStyle='rgba(150,140,160,.35)';ctx.beginPath();ctx.arc(e.x,fy-h*0.5,size*0.7,0,7);ctx.fill();}
    const hop=e.stunT>0?0:Math.abs(Math.sin(e.age*7))*cell*0.03;
    const tint=e.hitT>0?{c:'#ffffff',a:0.7}:e.frzT>0?{c:'#9fe8ff',a:0.6}:e.markT>0?{c:'#ff5a5a',a:0.25+0.15*Math.sin(clock*12)}:null;
    if(e.fast&&!(e.stunT>0)){ctx.globalAlpha=0.25;drawAni(e.sid,ex-(e.mdx||0)*cell*0.18,fy-(e.mdy||0)*cell*0.18,size,e.dx>0,0.35,null,e.id*0.13);ctx.globalAlpha=1;}
    if(!drawAni(e.sid,ex,fy-hop,size,e.dx>0,e.stunT>0&&e.sleep?0.65:1,tint,e.id*0.13,1+sq*0.12,1-sq*0.14)){ctx.beginPath();ctx.arc(e.x,e.y,cell*0.15,0,7);ctx.fillStyle=TYPE_COLOR[e.t[0]];ctx.fill();}
    ctx.save();upright(e.x,fy);const top=fy-h-hop;
    if(e.slowT>0){ctx.strokeStyle='rgba(159,222,219,.85)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(e.x,fy,size*0.34,size*0.1,0,0,7);ctx.stroke();}
    if(e.rest){ctx.fillStyle='#e8dcc0';ctx.font=`700 ${Math.round(cell*0.18)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('zz',e.x+size*0.3,top+cell*0.05);}
    {let ix=e.x-size*0.32;const iy=top-cell*0.16,fs=Math.round(cell*0.17);ctx.font=`900 ${fs}px 'IBM Plex Sans KR',sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      const ic=k=>{statusIcon(k,ix,iy,fs*0.66);ix+=fs*1.3;};
      if(e.burnT>0)ic('burn');if(e.poisT>0)ic('pois');if(e.zapT>0)ic('zap');if(e.frzT>0)ic('frz');if(e.stunT>0)ic(e.sleep?'sleep':'stun');if(e.yawnT>0)ic('yawn');if(e.confT>0)ic('conf');if(e.debT>0)ic('deb');if(e.markT>0)ic('mark');}
    if(e.frzT>0){ctx.strokeStyle='rgba(191,243,255,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(ex,fy,size*0.36,size*0.11,0,0,7);ctx.stroke();}

    const bw=e.boss?cell*1.1:cell*0.44,f=Math.max(0,e.hp/e.max),by=top-5;
    if(e.wild){ctx.font=`400 ${Math.round(cell*0.2)}px 'Black Han Sans',sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineWidth=3.5;ctx.strokeStyle='#0b1226';const lb=`야생 ${e.name} ${Math.ceil(e.wT)}초`;ctx.strokeText(lb,e.x,by-6);ctx.fillStyle='#ffb0a6';ctx.fillText(lb,e.x,by-6);
      ctx.fillStyle='rgba(11,18,38,.8)';ctx.fillRect(e.x-cell*0.45-1,by-1,cell*0.9+2,6);ctx.fillStyle=f<0.25?'#ffe14d':hpCol(f);ctx.fillRect(e.x-cell*0.45,by,cell*0.9*f,4);if(f<0.25){ctx.fillStyle='#fff';ctx.fillRect(e.x-cell*0.45+cell*0.9*0.25,by-2,1.5,8);}}
    else if(e.boss||clock-(e.hpLast||-9)<2.5){ctx.fillStyle='rgba(11,18,38,.8)';ctx.fillRect(e.x-bw/2-1,by-1,bw+2,e.boss?7:5);ctx.fillStyle=hpCol(f);ctx.fillRect(e.x-bw/2,by,bw*f,e.boss?5:3);}
    if(e.boss&&GIM_N[e.gim]&&e.gT<1.6&&e.gT>0){ctx.font=`400 ${Math.round(cell*0.26)}px 'Black Han Sans',sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineWidth=4;ctx.strokeStyle='#0b1226';ctx.strokeText(`${GIM_N[e.gim]}!`,e.x,by-cell*0.3);ctx.fillStyle='#ff8a7a';ctx.fillText(`${GIM_N[e.gim]}!`,e.x,by-cell*0.3);}
    if(e.boss){const g=gymAt(state.wave);if(g){ctx.fillStyle=COL.fg;ctx.font=`700 ${Math.round(cell*0.2)}px 'IBM Plex Sans KR',sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(`${g.lead}의 ${g.n}`,e.x,by-3);}}
    ctx.restore();
  }
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(fg,0,0,fg.width,fg.height,(Cx*(1-z)+z*sx)*d,(Cy*(1-z)+z*sy)*d,cv.width*z,cv.height*z);ctx.restore();
  for(const p of projs)drawProj(p);
  for(const f of fx)drawFx(f);
  drawCatch();
  drawParts();
  if(state.info&&state.phase!=='draft')drawInfo();
  if(dragging&&board[drag.from])drawUnit(board[drag.from],drag.from,drag.x,toWY(drag.y),0.85,true);
  // 화면 변환: 밤, 날씨, 배너는 화면 전체에
  ctx.setTransform(G.dpr,0,0,G.dpr,0,0);UPR=1;
  drawClouds();
  {const gw=gymAt(state.wave);if(gw&&state.boss&&state.phase==='play'){ctx.globalAlpha=0.55+0.35*Math.sin(clock*4);ctx.strokeStyle=gw.col;ctx.lineWidth=4;ctx.strokeRect(2,2,W-4,H-4);ctx.globalAlpha=1;}}
  // 성도의 밤: 푸른 그늘을 곱해서 깐다
  if(nightA>0.01){ctx.save();ctx.globalCompositeOperation='multiply';ctx.fillStyle=`rgba(40,52,120,${nightA*0.6})`;ctx.fillRect(-10,-10,W+20,H+20);ctx.globalCompositeOperation="source-over";ctx.fillStyle=`rgba(40,70,170,${nightA*0.1})`;ctx.fillRect(-10,-10,W+20,H+20);ctx.restore();
    ctx.globalAlpha=nightA*0.7;for(let k=0;k<14;k++){const x=(k*97.3)%W,y=(k*53.7)%Math.max(20,G.oy*0.9),tw=0.5+0.5*Math.sin(clock*2+k);ctx.fillStyle=`rgba(255,250,220,${tw})`;ctx.fillRect(x,y,1.5,1.5);}ctx.globalAlpha=1;}
  drawNightLights();drawArena();drawLight();drawAmb();drawWeather();
  if(state.windT>0&&state.phase==='play'){ctx.strokeStyle='rgba(230,245,255,.35)';ctx.lineWidth=1.2;for(let k=0;k<10;k++){const y=(k*41+clock*30)%H,x=((clock*420+k*137)%(W+120))-60;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+cell*0.9,y-cell*0.05);ctx.stroke();}}
  if(state.hailT>0&&state.phase==='play'){ctx.fillStyle='rgba(240,250,255,.8)';for(let k=0;k<40;k++){const x=(k*73.1+clock*20)%W,y=(k*29.7+clock*260)%H;ctx.fillRect(x,y,2,2);}}
  if(state.banner)drawBanner();
  if(callout)drawCallout();
  if(cutin)drawCutin();
  if(state.cut)drawCut();
  if(state.reveal)drawReveal();
  if(state.paused&&state.phase==='play'&&!SPOT&&$('oak').hidden){ctx.fillStyle='rgba(10,14,12,.55)';ctx.fillRect(0,0,W,H);ctx.fillStyle=COL.fg;ctx.font=`400 ${Math.round(W*0.08)}px 'Black Han Sans',sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('멈춤',W/2,H/2);}
}


'use strict';
// ───────── 고유 스킬 ─────────
// k: line 일직선 / multi 여러 대상 / nova 범위 / big 강타 / buff 지원 / splash 튀기기(잉어킹)
// x: 평타 배수. 공격 1회당 발동 확률은 모두 같고, 위력은 평타의 배수라 빠른 포켓몬은 작은 스킬이 자주 터진다.
const SKILL={
 '후딘':{n:'사이코키네시스',k:'multi',x:3,cnt:3,sort:'hp',d:'체력이 많은 적 3마리를 평타 3배로 동시에 공격'},
 '괴력몬':{n:'폭발펀치',k:'big',x:7,stun:1,d:'평타 7배 강타, 일반 적은 1초 혼란'},
 '망나뇽':{n:'파괴광선',k:'line',x:5,w:0.5,d:'굵은 일직선 광선, 평타 5배'},
 '팬텀':{n:'저주',cd:7,k:'big',x:2,mark:4,deb:0.4,debT:5,d:'대상에 표식(4초 동안 모든 아군 공격이 치명타)과 받는 피해 +40% 5초'},
 '피죤투':{n:'날려버리기',k:'nova',x:0.6,r:1.0,at:'tg',knock:0.06,d:'대상 주변 적을 길 뒤쪽으로 크게 날려 보냄'},
 '보만다':{n:'역린',k:'multi',x:1.2,cnt:4,sort:'rand',crit:true,d:'무작위 적 4마리에게 평타 1.2배 확정 치명타(급소 3배)'},
 '한카리아스':{n:'드래곤다이브',k:'big',x:6,exec:0.25,d:'평타 6배, 체력 25% 아래 일반 적은 바로 쓰러뜨림'},
 '거북왕':{n:'하이드로펌프',k:'line',x:4,w:0.42,knock:0.04,d:'일직선 물줄기 평타 4배, 적을 뒤로 밀어냄'},
 '딱구리':{n:'스톤에지',k:'nova',x:3,r:1.4,at:'self',stun:0.8,d:'주변에 바위 기둥, 평타 3배와 0.8초 기절'},
 '리자몽':{n:'화염방사',k:'line',x:4,w:0.4,burn:true,d:'일직선 불길 평타 4배, 화상'},
 '이상해꽃':{n:'솔라빔',k:'line',x:9,w:0.5,charge:0.35,d:'잠깐 빛을 모았다가 굵은 광선, 평타 9배'},
 '라이츄':{n:'10만볼트',k:'line',x:5,w:0.36,stun:0.6,d:'일직선 번개 평타 5배, 0.6초 마비'},
 '맘모꾸리':{n:'눈보라',cd:6,k:'nova',x:0.5,r:1.6,at:'self',freeze:2,d:'주변 전체를 2초 얼림. 얼어 있는 동안 받는 피해 +50%'},
 '푸크린':{n:'하품',cd:5,k:'nova',x:0,r:2.3,at:'self',yawn:1,yawnS:3.5,d:'넓은 범위 적이 1초 뒤 3.5초 동안 잠듦. 잠든 적은 받는 피해 +50%'},
 '버터플':{n:'독가루',cd:4.5,k:'nova',x:0.3,r:1.6,at:'tg',tox:4,spread:true,d:'넓은 범위 맹독 4중첩. 중독된 적이 쓰러지면 주변 3마리에게 옮음'},
 '가디안':{n:'사이코필드',k:'buff',b:'rate',v:1,d:'주변 아군 공격 속도 2배, 3초'},
 '픽시':{n:'손가락흔들기',k:'buff',b:'dmg',v:1,d:'주변 아군 공격력 2배, 3초'},
 '해피너스':{n:'럭키찬스',k:'buff',b:'crit',v:1,d:'주변 아군 모든 공격이 치명타, 3초'},
 '전룡':{n:'플래시',k:'buff',b:'range',v:1,d:'주변 아군 사거리 +1칸, 공격 속도 +50%, 3초'},
 '자포코일':{n:'전자포',k:'big',x:6,stun:1,coin:3,d:'평타 6배와 1초 마비, 이 스킬로 쓰러뜨리면 코인 +3'},
 '라우드본':{n:'섀도본',k:'big',x:5,grow:3,d:'평타 5배, 성장 +3'},
 '메타몽':{n:'변신',k:'copy',d:'옆 칸 포켓몬의 스킬을 따라 써요'},
 '토게키스':{n:'천사의키스',cd:4.5,k:'nova',x:0.3,r:1.4,at:'tg',confuse:3,d:'대상 주변 적이 3초 동안 혼란에 빠져 길을 거꾸로 걷고, 받는 피해 +25%'},
 '로즈레이드':{n:'독압정',k:'nova',x:0.8,r:1.1,at:'tg',tox:5,spread:true,d:'대상 주변 맹독 5중첩, 쓰러지면 주변으로 옮음'},
 '루카리오':{n:'파동탄 연사',k:'line',x:2,w:0.3,times:3,d:'관통하는 파동탄 3발, 각 평타 2배'},
 '밀로틱':{n:'신비의비늘',k:'buff',b:'se',v:1,d:'주변 아군의 모든 공격이 효과가 굉장, 3초'},
 '메타그로스':{n:'코멧펀치',k:'big',x:8,d:'평타 8배 강타'},
 '보스로라':{n:'철벽',k:'buff',b:'boss',v:1,d:'주변 아군 관장 피해 2배, 마비 해제, 3초'},
 '잠만보':{n:'하품',k:'nova',x:2,r:1.3,at:'self',yawn:1,yawnS:3,d:'주변 전체 평타 2배, 1초 뒤 3초 동안 잠듦'},
 '갸라도스':{n:'역린',k:'multi',x:3,cnt:5,sort:'rand',d:'무작위 적 5마리 평타 3배'},
 '잉어킹':{n:'튀어오르기',k:'splash',d:'그러나 아무 일도 일어나지 않았다'},
 '거대코뿌리':{n:'뿔드릴',cd:7,k:'big',x:2,deb:0.6,debT:6,d:'평타 2배, 6초 동안 받는 피해 +60%'},
 '윈디':{n:'신속',k:'multi',x:1.5,cnt:5,sort:'near',d:'가까운 적 5마리를 순식간에 평타 1.5배로 공격'},
 '마스카나':{n:'트릭플라워',k:'multi',x:2.5,cnt:3,sort:'hp',crit:true,d:'체력이 많은 적 3마리에게 평타 2.5배 확정 치명타'},
 '드래펄트':{n:'드래곤애로우',k:'multi',x:2.2,cnt:6,sort:'rand',d:'드라꼰 6발이 무작위 적을 평타 2.2배로 공격'},
 '웨이니발':{n:'아쿠아스텝',k:'nova',x:2,r:1.0,at:'tg',selfRate:1,d:'대상 주변 평타 2배, 3초 동안 자신의 공격 속도 +50%'},
 // 성도
 '메가니움':{n:'아로마테라피',k:'buff',b:'skill',v:1,d:'주변 아군의 고유 스킬을 바로 다시 쓸 수 있게 채워 줘요'},
 '블레이범':{n:'분화',k:'nova',x:3,r:1.5,at:'self',burn:true,d:'주변 전체 평타 3배와 화상'},
 '장크로다일':{n:'아쿠아테일',k:'big',x:7,knock:0.05,d:'평타 7배, 적을 뒤로 밀어냄'},
 '마릴리':{n:'치근거리기',k:'big',x:5,deb:0.3,debT:4,d:'평타 5배, 4초 동안 받는 피해 +30%'},
 '핫삼':{n:'불릿펀치',k:'multi',x:2.2,cnt:3,sort:'near',d:'가까운 적 3마리를 평타 2.2배로 재빨리 때림'},
 '마기라스':{n:'스톤샤워',k:'nova',x:3,r:1.3,at:'tg',stun:0.5,d:'대상 주변 평타 3배, 0.5초 기절'},
 '에레키블':{n:'번개펀치',cd:6,k:'nova',x:1,r:1.7,at:'self',stun:1.5,d:'주변 전체 1.5초 마비, 평타 1배'},
 '야부엉':{n:'최면술',cd:5,k:'nova',x:0,r:1.5,at:'tg',sleep:3,d:'대상 주변 적을 3초 재움. 잠든 적은 받는 피해 +50%'},
 // 이브이 진화형
 '샤미드':{n:'하이드로펌프',k:'line',x:4,w:0.42,knock:0.04,d:'일직선 물줄기 평타 4배, 적을 뒤로 밀어냄'},
 '쥬피썬더':{n:'10만볼트',k:'line',x:4,w:0.36,stun:0.6,d:'일직선 번개 평타 4배, 0.6초 마비'},
 '부스터':{n:'플레어드라이브',k:'big',x:7,burn:true,d:'평타 7배 돌진, 화상'},
 '에브이':{n:'사이코키네시스',k:'multi',x:3.5,cnt:3,sort:'hp',d:'체력이 많은 적 3마리를 평타 3.5배로 동시에 공격'},
 '블래키':{n:'검은눈빛',cd:6,k:'big',x:1,bind:4,d:'대상을 4초 묶음. 관장은 받는 피해 +30%와 감속'},
 '리피아':{n:'리프블레이드',k:'line',x:4.5,w:0.35,d:'일직선 잎날 평타 4.5배'},
 '글레이시아':{n:'눈보라',cd:6,k:'nova',x:0.5,r:1.6,at:'self',freeze:2,d:'주변 전체를 2초 얼림. 얼어 있는 동안 받는 피해 +50%'},
 '님피아':{n:'매지컬샤인',k:'buff',b:'dmg',v:1,d:'주변 아군 공격력 2배, 3초'},
 // 전설
 '칠색조':{n:'성스러운불',k:'line',x:5,w:0.6,burn:true,d:'성스러운 불길 평타 5배, 화상'},
 '가이오가':{n:'근원의파동',k:'nova',x:4,r:3,at:'self',knock:0.04,d:'사거리 안 전체 평타 4배, 뒤로 밀어냄'},
 '제크로무':{n:'크로스썬더',k:'line',x:6,w:0.5,stun:0.8,d:'일직선 번개 평타 6배, 0.8초 마비'},
 '뮤츠':{n:'사이코브레이크',k:'multi',x:4,cnt:4,sort:'hp',d:'체력이 많은 적 4마리 평타 4배'},
 '레쿠쟈':{n:'화룡점정',k:'big',x:9,splash:1.2,d:'평타 9배, 주변에도 절반 피해'},
 '그란돈':{n:'단애의칼',k:'nova',x:4,r:3,at:'self',stun:1,d:'사거리 안 전체 평타 4배, 1초 기절'},
 '큐레무':{n:'글레이시에이트',k:'nova',x:2,r:3,at:'self',freeze:2.5,d:'사거리 안 전체 평타 2배와 2.5초 얼림'},
 '코바르온':{n:'성스러운칼',k:'big',x:10,d:'평타 10배 일격'},
 '기라티나':{n:'섀도다이브',k:'big',x:8,deb:0.4,d:'평타 8배, 받는 피해 +40%'},
 '무한다이노':{n:'다이맥스포',k:'line',x:6,w:0.7,tox:5,d:'거대한 광선 평타 6배, 맹독 5중첩'},
 '레지기가스':{n:'크러시그립',k:'big',x:7,d:'평타 7배, 슬로스타트 단계가 높을수록 강함'},
 '세레비':{n:'시간여행',k:'buff',b:'all',v:1,d:'주변 아군 공격력·공격 속도 2배, 4초'},
 // 호연
 '나무킹':{n:'리프스톰',k:'line',x:5,w:0.45,d:'일직선 잎 폭풍 평타 5배'},
 '번치코':{n:'블레이즈킥',k:'big',x:6,burn:true,crit:true,d:'평타 6배 확정 치명타, 화상'},
 '대짱이':{n:'탁류',k:'nova',x:3,r:1.6,at:'self',slow:0.4,d:'주변 전체 평타 3배, 2초 동안 40% 감속'},
 // 특수 조합
 '뮤':{n:'원시의힘',k:'multi',x:4,cnt:5,sort:'hp',d:'체력이 많은 적 5마리를 평타 4배로 공격'},
 '루기아':{n:'에어로블라스트',k:'line',x:7,w:0.7,crit:true,d:'굵은 바람 광선 평타 7배, 확정 치명타'},
 '디아루가':{n:'시간의포효',k:'nova',x:5,r:3,at:'self',stun:1.2,d:'사거리 안 전체 평타 5배, 1.2초 기절'},
 '지라치':{n:'파멸의소원',k:'buff',b:'all',v:1,d:'주변 아군 공격력·공격 속도 2배, 4초'},
 '다크라이':{n:'다크홀',cd:6,k:'nova',x:1,r:3,at:'self',sleep:3,d:'사거리 안 적을 3초 재워요. 잠든 적은 받는 피해 +50%'},
 '라티오스':{n:'라스트퍼지',k:'big',x:9,splash:1.2,d:'평타 9배, 주변에도 절반 피해'},
};
function skillOf(u){if(!u)return null;const d=def(u);if(u.tier<4&&LINES[u.line].mech==='ditto')return SKILL['메타몽'];if(u.tier<2){return LINES[u.line].mech==='gyara'?SKILL['잉어킹']:null;}
  if(d.mech==='gyara')return SKILL[u.tier>=2?'갸라도스':'잉어킹'];
  if(LINES[u.line]&&LINES[u.line].mech==='ditto')return SKILL['메타몽'];
  return SKILL[d.n]||SKILL[LINES[u.line].n[2]]||null;}
const SK_BASE=0.05;
const skillCd=(u,sk)=>sk.cd*(u.tier>=3?0.75:1)/(1+mods.skill+(u.s.skB||0));
function skillChance(u){return (u.tier>=4?0.08:u.tier>=3?0.06:SK_BASE)*(1+mods.skill+(u.s.skB||0))*(u.s.mech==='technician'?2:1)+(u.pity||0);}
let callout=null;
function shout(u,sk,big){const nm=def(u).n;
  if(big){if(!startCutin(u,sk))callout={t:1.0,T:1.0,s:`${josa(nm,'의','의')} ${sk.n}!`,col:TYPE_COLOR[def(u).t[0]]};}
  else{const i=board.indexOf(u),c=cellCenter(i);fx.push({k:'txt',x:c.x,y:c.y-G.cell*0.55,s:sk.n,col:'#ffffff',t:.6,T:.6});}
  u.cast=0.35;}
function skHit(u,e,mult,sk){if(e.dead)return;const at=u.s.t[0];const base=u.s.dmg*Math.max(mult,0.3);
  if(mult>0){const keep=u.s.crit;if(sk.crit)u.s.crit=1;hit(u,e,u.s.dmg*mult,at,'skill');u.s.crit=keep;}else e.hitT=0.08;
  if(e.dead){if(sk.coin){state.coins+=sk.coin;coinFly(e.x,e.y,2);}return;}
  const imm=e.gim==='blaze',slowBoss=t=>{if(!imm){e.slowV=Math.max(e.slowT>0?e.slowV:0,0.5);e.slowT=Math.max(e.slowT,t*0.6);}};
  if(sk.stun){if(e.boss)slowBoss(sk.stun);else if(!imm)e.stunT=Math.max(e.stunT,sk.stun);}
  if(sk.sleep){if(e.boss)slowBoss(sk.sleep);else if(!imm){e.stunT=Math.max(e.stunT,sk.sleep);e.sleep=true;}}
  if(sk.freeze){if(e.boss)slowBoss(sk.freeze);else if(!imm){e.stunT=Math.max(e.stunT,sk.freeze);e.sleep=false;}e.frzT=Math.max(e.frzT||0,sk.freeze);}
  if(sk.bind){if(e.boss){e.debV=Math.max(e.debT>0?e.debV:0,0.3);e.debT=Math.max(e.debT,sk.bind);slowBoss(1.5);}else if(!imm)e.stunT=Math.max(e.stunT,sk.bind);}
  if(sk.yawn&&!e.boss&&!imm&&!(e.yawnT>0)&&!(e.stunT>0)){e.yawnT=sk.yawn;e.yawnS=sk.yawnS||3;}
  if(sk.confuse&&!e.boss&&!imm)e.confT=Math.max(e.confT||0,sk.confuse);
  if(sk.mark)e.markT=Math.max(e.markT||0,sk.mark);
  if(sk.spread)e.spread=true;
  if(sk.slow&&e.gim!=='blaze'){e.slowV=Math.max(e.slowT>0?e.slowV:0,sk.slow);e.slowT=2;}
  if(sk.deb){e.debV=Math.max(e.debT>0?e.debV:0,sk.deb);e.debT=Math.max(e.debT,sk.debT||4);}
  if(sk.burn){const v=base*0.5*(1+mods.dot);if(e.burnT<=0||v>=e.burnD)e.burnD=v;e.burnT=2.5;}
  if(sk.tox){e.tox=Math.min(5,sk.tox);e.poisD=e.tox*base*0.08*(1+mods.dot);e.poisT=4;}
  if(sk.knock&&!e.boss){e.p=(e.p-sk.knock+1)%1;e.kb=G.cell*0.15;}
  if(sk.exec&&!e.boss&&e.hp<e.max*sk.exec){dmgRaw(e,e.hp+1,u);}
}
function castSkill(u,i,c,inR,sk){
  const at=u.s.t[0],col=TYPE_COLOR[at],cs=G.cell;
  if(sk.k==='copy'){const cc=i%COLS,rr=(i/COLS)|0;const nb=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const x=cc+dc,y=rr+dr;if((dr||dc)&&x>=0&&y>=0&&x<COLS&&y<ROWS){const v=board[y*COLS+x];const s2=skillOf(v);if(s2&&s2.k!=='copy'&&s2.k!=='splash')nb.push(s2);}}
    if(!nb.length)return false;sk=pick(nb);}
  if(sk.k==='splash'){fx.push({k:'txt',x:c.x,y:c.y-cs*0.55,s:'튀어오르기!',col:'#9fc4ff',t:.8,T:.8});u.cast=0.5;callout={t:1.2,T:1.2,s:'그러나 아무 일도 일어나지 않았다',col:'#9fc4ff'};return true;}
  const big=u.tier>=3;shout(u,sk,big);
  const tg=chooseTarget(inR,u.s.mech==='snipe'?'snipe':'');
  if(sk.k==='line'){
    const go=()=>{for(let t=0;t<(sk.times||1);t++){const tgt=t===0?tg:pick(inR.filter(e=>!e.dead).concat([tg]));if(!tgt)continue;
      const dx=tgt.x-c.x,dy=tgt.y-c.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,len=Math.max(G.W,G.H)*1.2,w=cs*sk.w;
      for(const e of enemies){if(e.dead)continue;const px=e.x-c.x,py=e.y-c.y,tt=px*ux+py*uy;if(tt<0||tt>len)continue;if(Math.abs(px*uy-py*ux)<=w)skHit(u,e,sk.x,sk);}
      fx.push({k:'skbeam',x1:c.x,y1:c.y-cs*0.2,x2:c.x+ux*len,y2:c.y-cs*0.2+uy*len,w,col,t:.38,T:.38,delay:t*0.12});
      for(let q=0;q<10;q++){const f=Math.random()*L*1.5;burst(c.x+ux*f,c.y-cs*0.2+uy*f,at,1,0.7);}}
      shake=Math.max(shake,big?3.5:2);};
    if(sk.charge){u.charge={t:sk.charge,go};fx.push({k:'charge',x:c.x,y:c.y-cs*0.3,r:cs*0.5,col,t:sk.charge,T:sk.charge});}else go();
  }
  else if(sk.k==='multi'){let ts=inR.filter(e=>!e.dead);
    if(sk.sort==='hp')ts.sort((a,b)=>b.hp-a.hp);else if(sk.sort==='near')ts.sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y));else shuffle(ts);
    ts=ts.slice(0,sk.cnt);
    ts.forEach((e,k)=>{skHit(u,e,sk.x,sk);fx.push({k:'skbeam',x1:c.x,y1:c.y-cs*0.2,x2:e.x,y2:e.y-cs*0.15,w:cs*0.12,col,t:.28,T:.28,delay:k*0.05});fx.push({k:'flash',x:e.x,y:e.y-cs*0.15,r:cs*0.3,col,t:.22,T:.22});burst(e.x,e.y-cs*0.15,at,5,1.1);});
    shake=Math.max(shake,big?2.5:1.2);}
  else if(sk.k==='nova'){const o=sk.at==='self'?{x:c.x,y:c.y}:{x:tg.x,y:tg.y},R=cs*(sk.at==='self'?Math.max(sk.r,u.s.range):sk.r);
    for(const e of enemies)if(!e.dead&&Math.hypot(e.x-o.x,e.y-o.y)<=R)skHit(u,e,sk.x,sk);
    fx.push({k:'nova',x:o.x,y:o.y,r:R,col,t:.5,T:.5});burst(o.x,o.y,at,big?22:12,1.6);shake=Math.max(shake,big?4:2.5);
    if(sk.selfRate){u.bf={rate:0.5,t:3};}}
  else if(sk.k==='big'){skHit(u,tg,sk.x*(def(u).mech==='slowstart'?1+Math.min(3,(u.ss||0)/40):1),sk);
    if(sk.splash)for(const e of enemies)if(e!==tg&&!e.dead&&Math.hypot(e.x-tg.x,e.y-tg.y)<=cs*sk.splash)skHit(u,e,sk.x*0.5,sk);
    if(sk.grow)u.grow=Math.min(100,(u.grow||0)+sk.grow);
    fx.push({k:'skbeam',x1:c.x,y1:c.y-cs*0.2,x2:tg.x,y2:tg.y-cs*0.15,w:cs*0.18,col,t:.25,T:.25});
    fx.push({k:'flash',x:tg.x,y:tg.y-cs*0.15,r:cs*0.6,col,t:.3,T:.3});fx.push({k:'ring',x:tg.x,y:tg.y,r:cs*0.8,col:'#ffffff',t:.35,T:.35});
    burst(tg.x,tg.y-cs*0.15,at,big?20:12,1.7);shake=Math.max(shake,big?5:3);u.lunge=0.18;}
  return true;
}
function castBuff(u,i,sk){
  const rad=u.tier>=3?2:1,cc=i%COLS,rr=(i/COLS)|0,dur=sk.b==='all'?4:3;
  shout(u,sk,u.tier>=3);
  for(let j=0;j<N;j++){const v=board[j];if(!v||j===i||isAura(v.s.mech))continue;const x=j%COLS,y=(j/COLS)|0;if(Math.max(Math.abs(x-cc),Math.abs(y-rr))>rad)continue;
    v.bf={t:dur};if(sk.b==='rate')v.bf.rate=1;else if(sk.b==='dmg')v.bf.dmg=1;else if(sk.b==='crit')v.bf.crit=1;else if(sk.b==='range'){v.bf.range=1;v.bf.rate=0.5;}else if(sk.b==='se')v.bf.se=1;else if(sk.b==='boss'){v.bf.boss=1;v.parT=0;}else if(sk.b==='all'){v.bf.rate=1;v.bf.dmg=1;}else if(sk.b==='skill'){v.sk=0;v.pity=1;}
    const q=cellCenter(j);fx.push({k:'ring',x:q.x,y:q.y+G.cell*0.18,r:G.cell*0.45,col:'#9dffa8',t:.45,T:.45});burst(q.x,q.y,'페어리',3,0.7);}
  const c=cellCenter(i);fx.push({k:'nova',x:c.x,y:c.y,r:G.cell*(rad+0.5),col:'#9dffa8',t:.5,T:.5});
}


# 배포 전 화면 점검: 29개 스테이지와 주요 화면을 휴대폰 크기로 찍어 한 장(qa.png)으로 모으고,
# 겹침·가로 넘침·스크립트 오류를 글로 알려 준다.
# 사용: python3 tools/qa.py [출력 폴더]   (playwright, Pillow 필요. 이 폴더를 직접 띄운다)
import sys,os,threading,functools,http.server,socketserver
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=sys.argv[1] if len(sys.argv)>1 else os.path.join(R,'qa')
os.makedirs(OUT,exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
H=functools.partial(Q,directory=R)
srv=socketserver.TCPServer(('127.0.0.1',0),H);port=srv.server_address[1]
threading.Thread(target=srv.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{port}/index.html'
PROG="{clear:{kanto:true,johto:true,hoenn:true,sinnoh:true},best:{kanto:40,johto:40,hoenn:40},badges:{kanto:8,johto:8,hoenn:8},tut:1}"
W,HH=390,844
shots=[];warn=[]

# 겹치면 안 되는 DOM 쌍과, 화면 밖으로 나가면 안 되는 요소
OVERLAP=[('#early','#entry'),('#early','#hud'),('#entry','#hud'),('#intro','#dockbar'),('#bossbar','#hud')]
CHECK_JS="""(pairs)=>{const out=[],vis=e=>e&&!e.hidden&&e.offsetParent!==null,box=s=>{const e=document.querySelector(s);return vis(e)?e.getBoundingClientRect():null;};
  for(const [a,b] of pairs){const A=box(a),B=box(b);if(A&&B&&A.left<B.right-2&&B.left<A.right-2&&A.top<B.bottom-2&&B.top<A.bottom-2)out.push(a+' 와 '+b+' 가 겹침');}
  const sw=document.documentElement.scrollWidth;if(sw>innerWidth+1)out.push('가로 넘침 '+sw+'px');
  document.querySelectorAll('.scr-body,.box,.card,.lrow').forEach(e=>{if(vis(e)&&e.scrollWidth>e.clientWidth+2)out.push((e.className||e.tagName)+' 안 글이 가로로 넘침');});
  return out;}"""

seen=set()
def shot(pg,name,clip=None):
    p=os.path.join(OUT,name+'.png');pg.screenshot(path=p,clip=clip);shots.append((name,p))
    seen.update(pg.evaluate("document.body.innerText"))
    for m in pg.evaluate(CHECK_JS,OVERLAP):warn.append(f'{name}: {m}')

with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':W,'height':HH},device_scale_factor=1)
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.add_init_script(f"localStorage.setItem('pkrtd-prog',JSON.stringify({PROG}))")
    pg.goto(URL);pg.wait_for_function("!document.getElementById('loading')",timeout=20000);pg.wait_for_timeout(1500)
    ok=pg.evaluate("[\"400 16px 'Black Han Sans'\",\"400 16px 'IBM Plex Sans KR'\",\"700 16px 'IBM Plex Sans KR'\"].every(f=>document.fonts.check(f))")
    if not ok:warn.append('직접 실은 글꼴이 불러와지지 않음')
    shot(pg,'01_타이틀')
    pg.evaluate("showRegions({mode:'adv'})");pg.wait_for_timeout(200);shot(pg,'02_지방')
    pg.evaluate("showDraft('tr',REGIONS[0],{mode:'adv'})");pg.wait_for_timeout(200);shot(pg,'03_덱')
    # 전투 중: 유닛을 채우고 적과 말풍선, 피해 숫자가 같이 뜬 순간
    pg.evaluate("""newGame(TRAINERS[0].lines.map(LIDX),TRAINERS[0],REGIONS[0]);state.coins=5000;for(let k=0;k<14;k++)summon();
      state.wave=11;startWave();state.cut=null;state.banner=null;state.speed=2;$('intro').hidden=true;""")
    pg.wait_for_timeout(3500)
    pg.evaluate("callout={t:50,T:99,s:'로즈레이드의 독압정!',col:'#b06ad6'};state.paused=true;syncPause&&syncPause();")
    pg.wait_for_timeout(200);shot(pg,'04_전투')
    pg.evaluate("callout=null;state.spawnLeft=0;state.waveT=15;hudKey='';");pg.wait_for_timeout(300);shot(pg,'04b_일찍',clip={'x':0,'y':80,'width':W,'height':300})
    pg.evaluate("callout=null;state.paused=false;syncPause&&syncPause();state.sel=board.findIndex(u=>u);renderPanel();");pg.wait_for_timeout(300);shot(pg,'05_유닛선택')
    pg.evaluate("state.sel=-1;renderPanel();showMenu()");pg.wait_for_timeout(200);shot(pg,'06_메뉴')
    pg.evaluate("closeLayer();state.paused=false;openReward(GYMS[0])");pg.wait_for_timeout(300);shot(pg,'07_보상')
    pg.evaluate("closeModal();showDex()");pg.wait_for_timeout(300);shot(pg,'08_도감')
    pg.evaluate("closeLayer();showLog()");pg.wait_for_timeout(200);shot(pg,'09_기록')
    pg.evaluate("closeLayer();state.phase='play';finish(false,'필드의 적이 60마리를 넘었어요.')");pg.wait_for_timeout(300);shot(pg,'10_결과')
    # 스테이지 배치: 지방마다 체육관 구간별 길
    for rg,nt in [(0,8),(1,8),(2,8),(3,5),(4,8)]:
        for k in range(nt):
            pg.evaluate(f"closeModal();newGame(TRAINERS[0].lines.map(LIDX),TRAINERS[0],REGIONS[{rg}]);board=Array(N).fill(null);state.wave={k*5};startWave();state.banner=null;state.cut=null;enemies=[];state.hold=true;state.boss=null;$('toast').dataset.off='';$('intro').hidden=true;")
            pg.wait_for_timeout(200);shot(pg,f's{rg}_{k}',clip={'x':0,'y':100,'width':W,'height':620})
    # 작은 휴대폰(375x667)에서 전투 화면: 말풍선이 판 맨 아래 줄을 가리지 않는지
    q=b.new_page(viewport={'width':375,'height':667});q.on('pageerror',lambda e:errs.append(str(e)))
    q.add_init_script(f"localStorage.setItem('pkrtd-prog',JSON.stringify({PROG}))")
    q.goto(URL);q.wait_for_function("!document.getElementById('loading')",timeout=20000);q.wait_for_timeout(800)
    q.evaluate("newGame(TRAINERS[0].lines.map(LIDX),TRAINERS[0],REGIONS[0]);state.coins=5000;for(let k=0;k<14;k++)summon();state.cut=null;state.banner=null;$('intro').hidden=true;callout={t:50,T:99,s:'로즈레이드의 독압정!',col:'#b06ad6'};")
    q.wait_for_timeout(400);shot(q,'11_작은화면')
    for e in errs:warn.append('스크립트 오류: '+e)
    cf=os.path.join(R,'fonts','chars.txt')
    if os.path.exists(cf):
        have=set(open(cf,encoding='utf-8').read())
        import glob
        for g in glob.glob(os.path.join(R,'js','*.js')):seen.update(c for c in open(g,encoding='utf-8').read() if c.isprintable())
        miss=sorted(c for c in seen if c not in have and not c.isspace())
        if miss:warn.append('글꼴에 없는 글자(tools/build_fonts.py 다시 돌리기): '+''.join(miss[:40]))
    else:warn.append('fonts/chars.txt가 없어 글자 점검을 못 했어요(tools/build_fonts.py 다시 돌리기)')
    b.close()
srv.shutdown()

# 한 장으로 모으기: 주요 화면 5열, 스테이지는 8열 축소
def font(s):
    for f in ['/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc','/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc']:
        if os.path.exists(f):return ImageFont.truetype(f,s)
    return ImageFont.load_default()
F=font(18)
main=[s for s in shots if not s[0].startswith('s')];stg=[s for s in shots if s[0].startswith('s')]
mw,mh=W//2,HH//2;sw,sh=W//3,620//3
cols1,cols2=5,8
rows1=(len(main)+cols1-1)//cols1;rows2=(len(stg)+cols2-1)//cols2
CW=max(cols1*(mw+10),cols2*(sw+8))+10
img=Image.new('RGB',(CW,rows1*(mh+34)+rows2*(sh+30)+20),'#20263a');d=ImageDraw.Draw(img)
for i,(n,pth) in enumerate(main):
    x=10+(i%cols1)*(mw+10);y=10+(i//cols1)*(mh+34);im=Image.open(pth).convert('RGB');img.paste(im.resize((mw,min(mh,round(im.height*mw/im.width)))),(x,y+26));d.text((x,y),n,fill='#ffffff',font=F)
y0=10+rows1*(mh+34)
for i,(n,pth) in enumerate(stg):
    x=10+(i%cols2)*(sw+8);y=y0+(i//cols2)*(sh+30);img.paste(Image.open(pth).convert('RGB').resize((sw,sh)),(x,y+24));d.text((x,y),n,fill='#ffffff',font=F)
img.save(os.path.join(OUT,'qa.png'))
print('찍은 화면',len(shots),'장 →',os.path.join(OUT,'qa.png'))
print('경고 없음' if not warn else '경고 '+str(len(warn))+'개\n- '+'\n- '.join(warn))

# gifs/{id}.gif → sprites/anim-*.webp(움직이는 프레임 묶음), sprites/thumbs.webp(정지 썸네일), js/sprites.js(좌표)
import json,os,sys,hashlib
from PIL import Image,ImageSequence
SRC,OUT=sys.argv[1],sys.argv[2]
ids=json.load(open(sys.argv[3]))
# 4번째 인자: {도감번호: 묶음 그룹}. 그룹마다 따로 묶어, 판에 필요한 그룹부터 받을 수 있게 한다
GRP={int(k):v for k,v in json.load(open(sys.argv[4])).items()} if len(sys.argv)>4 else {}
NF,MAXD,AW,TS,TC=10,88,1024,96,16  # 묶음 그림은 1024px까지: 일부 휴대폰 브라우저는 큰 이미지를 캔버스에 못 그린다
sheets={};meta={}
for i in ids:
    p=f'{SRC}/{i}.gif'
    if not os.path.exists(p):continue
    g=Image.open(p);fr=[f.convert('RGBA') for f in ImageSequence.Iterator(g)]
    durs=[f.info.get('duration',50) or 50 for f in ImageSequence.Iterator(Image.open(p))]
    bb=None
    for f in fr:
        b=f.getbbox()
        if b:bb=b if bb is None else (min(bb[0],b[0]),min(bb[1],b[1]),max(bb[2],b[2]),max(bb[3],b[3]))
    fr=[f.crop(bb) for f in fr];w,h=fr[0].size;sz=max(w,h)
    n=min(NF,len(fr));pk=[fr[int(k*len(fr)/n)] for k in range(n)]
    k=min(1,MAXD/sz);W,H=max(1,round(w*k)),max(1,round(h*k))
    sh=Image.new('RGBA',(W*n,H),(0,0,0,0))
    for j,f in enumerate(pk):sh.paste(f.resize((W,H),Image.LANCZOS),(j*W,0))
    sheets[i]=sh;meta[i]={'n':n,'w':W,'h':H,'s':sz,'d':round(sum(durs)/1000,2),'first':fr[0]}
# 선반 채우기: 그룹마다 높이순으로 줄을 채우고, 1024 높이를 넘으면 다음 장
atlases=[];agrp=[]
for gi in sorted(set(GRP.get(i,0) for i in sheets)):
    order=sorted([i for i in sheets if GRP.get(i,0)==gi],key=lambda i:-sheets[i].size[1])
    x=y=rowh=0;cur=[]
    for i in order:
        sw,sh_=sheets[i].size
        if x+sw>AW:x=0;y+=rowh+1;rowh=0
        if y+sh_>AW:atlases.append((cur,y+rowh));agrp.append(gi);cur=[];x=y=rowh=0
        cur.append((i,x,y));meta[i]['pos']=(len(atlases),x,y);x+=sw+1;rowh=max(rowh,sh_)
    atlases.append((cur,y+rowh));agrp.append(gi)
tot=0
for a,(items,hh) in enumerate(atlases):
    im=Image.new('RGBA',(AW,hh+1),(0,0,0,0))
    for i,x,y in items:im.paste(sheets[i],(x,y))
    fn=f'{OUT}/sprites/anim-{a}.webp';im.save(fn,'WEBP',quality=72,method=6,alpha_quality=70);tot+=os.path.getsize(fn)
# 썸네일 묶음
tid=[i for i in ids if i in meta];rows=(len(tid)+TC-1)//TC
th=Image.new('RGBA',(TC*TS,rows*TS),(0,0,0,0));tix={}
for k,i in enumerate(tid):
    f=meta[i]['first'];f=f.crop(f.getbbox());w,h=f.size;s=min((TS-4)/w,(TS-4)/h,2.0)
    f=f.resize((max(1,round(w*s)),max(1,round(h*s))),Image.LANCZOS)
    cx,cy=(k%TC)*TS,(k//TC)*TS;th.paste(f,(cx+(TS-f.size[0])//2,cy+TS-2-f.size[1]),f);tix[i]=k
th.save(f'{OUT}/sprites/thumbs.webp','WEBP',quality=72,method=6,alpha_quality=60);tot+=os.path.getsize(f'{OUT}/sprites/thumbs.webp')
ani={i:[m['pos'][0],m['pos'][1],m['pos'][2],m['n'],m['w'],m['h'],m['s'],m['d']] for i,m in meta.items()}
js='// 자동 생성: tools/build_sprites.py\n'
# 파일 이름에 내용 해시를 넣어, 새로 배포하면 브라우저가 옛 그림을 쓰지 않게 한다
import glob,shutil
for f in glob.glob(f'{OUT}/sprites/*.*.webp'):os.remove(f)
def hashed(name):
    f=f'{OUT}/sprites/{name}.webp';h=hashlib.md5(open(f,'rb').read()).hexdigest()[:8];shutil.move(f,f'{OUT}/sprites/{name}.{h}.webp');return f'sprites/{name}.{h}.webp'
js+=f'const ATLAS={json.dumps([hashed(f"anim-{a}") for a in range(len(atlases))])};\n'
js+=f'const ATLAS_G={json.dumps(agrp)};\n'
js+=f'const THUMBS={{src:"{hashed("thumbs")}",cols:{TC},rows:{rows}}};\n'
js+='const ANI={};(function(r){for(const k in r){const v=r[k];ANI[k]={a:v[0],x:v[1],y:v[2],n:v[3],w:v[4],h:v[5],s:v[6],d:v[7]};}})('+json.dumps(ani,separators=(',',':'))+');\n'
js+='const THUMB_IX='+json.dumps(tix,separators=(',',':'))+';\n'
open(f'{OUT}/js/sprites.js','w').write(js)
print(len(meta),'sprites',len(atlases),'atlases',round(tot/1e6,2),'MB', [hh for _,hh in atlases])

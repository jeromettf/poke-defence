# src/head.html + src/body.html → index.html(일반 웹페이지, GitHub Pages) / artifact.html(claude.ai 아티팩트용 본문)
import os,hashlib
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS=['sprites','data','regions','core','skills','content','ui','meta','log','tutorial','render','scene','main']
head=open(f'{R}/src/head.html').read().strip()
body=open(f'{R}/src/body.html').read().strip()
loading='<div class="loading" id="loading"><div class="logo">포켓몬<br>랜덤 디펜스</div><div class="lbar"><i id="lbar"></i></div><p>스프라이트 불러오는 중</p></div>'
# 파일 내용 해시를 주소 뒤에 붙여, 새로 배포하면 브라우저가 옛 파일을 쓰지 않게 한다
v=lambda f:hashlib.md5(open(f'{R}/{f}','rb').read()).hexdigest()[:8]
inner=f'{head}\n<link rel="stylesheet" href="css/game.css?v={v("css/game.css")}">\n\n{body}\n{loading}\n'+'\n'.join(f'<script src="js/{j}.js?v={v(f"js/{j}.js")}"></script>' for j in JS)+'\n'
import re
open(f'{R}/artifact.html','w').write(re.sub(r'\?v=[0-9a-f]{8}','',inner))  # 아티팩트는 구글 글꼴 링크도 남겨 둔다(직접 실은 글꼴이 막힐 때 대비)
# 일반 웹페이지는 직접 실은 글꼴만 쓴다: 구글 글꼴 줄을 빼고 자주 쓰는 두 글꼴을 미리 받는다
gf=[l for l in head.split('\n') if 'fonts.g' in l]
pre='\n'.join(f'<link rel="preload" href="fonts/{n}.woff2" as="font" type="font/woff2" crossorigin>' for n in ['plex-400','bhs-400','plex-700'])
for l in gf:inner=inner.replace(l+'\n','')
inner=inner.replace('<link rel="stylesheet" href="css/game.css',pre+'\n<link rel="stylesheet" href="css/game.css',1)  # 아티팩트는 주소 뒤 꼬리표 없이
# 앱으로 설치·오프라인(GitHub 버전만. 아티팩트는 서비스 워커를 못 쓴다)
pwa='<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
inner=inner.replace('<link rel="preload"',pwa+'<link rel="preload"',1)
inner+="<script>if('serviceWorker' in navigator&&isSecureContext)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>\n"
open(f'{R}/index.html','w').write('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'+inner.replace('\n\n<div class="app">','\n</head>\n<body>\n<div class="app">',1)+'</body>\n</html>\n')
# 서비스 워커: 처음 열 때 게임 파일을 모두 받아 두고, 다음부터는 인터넷이 없어도 열린다
import glob,json
pre=['./','index.html','manifest.webmanifest',f'css/game.css?v={v("css/game.css")}']+[f'js/{j}.js?v={v(f"js/{j}.js")}' for j in JS]
pre+=sorted(os.path.relpath(f,R) for f in glob.glob(f'{R}/fonts/*.woff2')+glob.glob(f'{R}/sprites/*')+glob.glob(f'{R}/icons/*.png'))
# 미리 받는 파일 내용이 하나라도 바뀌면 버전이 바뀌어 새로 받는다
hx=hashlib.md5(open(f'{R}/index.html','rb').read())
for f in pre:
    q=f.split('?')[0]
    if q not in ('./','index.html'):hx.update(open(f'{R}/{q}','rb').read())
ver=hx.hexdigest()[:10]
open(f'{R}/sw.js','w').write(open(f'{R}/src/sw.tpl.js',encoding='utf-8').read().replace('__V__',ver).replace('__PRE__',json.dumps(pre)))
print('ok',len(inner),'sw',ver,len(pre))

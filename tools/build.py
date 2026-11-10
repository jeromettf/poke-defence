# src/head.html + src/body.html → index.html(일반 웹페이지, GitHub Pages) / artifact.html(claude.ai 아티팩트용 본문)
import os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS=['sprites','data','regions','core','skills','ui','render','main']
head=open(f'{R}/src/head.html').read().strip()
body=open(f'{R}/src/body.html').read().strip()
loading='<div class="loading" id="loading"><div class="logo">포켓몬<br>랜덤 디펜스</div><div class="lbar"><i id="lbar"></i></div><p>스프라이트 불러오는 중</p></div>'
inner=f'{head}\n<link rel="stylesheet" href="css/game.css">\n\n{body}\n{loading}\n'+'\n'.join(f'<script src="js/{j}.js"></script>' for j in JS)+'\n'
open(f'{R}/artifact.html','w').write(inner)
open(f'{R}/index.html','w').write('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'+inner.replace('\n\n<div class="app">','\n</head>\n<body>\n<div class="app">',1)+'</body>\n</html>\n')
print('ok',len(inner))

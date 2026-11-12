# 게임에 실제로 나오는 글자만 남겨 글꼴을 작게 만든다(woff2). 글을 고치거나 포켓몬을 더하면 다시 돌린다.
# 사용: python3 tools/build_fonts.py <원본 ttf 폴더>
#   원본: github.com/google/fonts 의 ofl/blackhansans/BlackHanSans-Regular.ttf,
#         ofl/ibmplexsanskr/IBMPlexSansKR-{Regular,Medium,SemiBold,Bold}.ttf  (모두 SIL OFL)
import sys,os,glob,subprocess
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=sys.argv[1]
text=set()
for f in glob.glob(f'{R}/js/*.js')+glob.glob(f'{R}/src/*.html')+[f'{R}/css/game.css',f'{R}/tools/build.py']:
    text|=set(open(f,encoding='utf-8').read())
text|=set(''.join(chr(c) for c in range(0x20,0x7f)))
text|=set('을를이가은는과와으로의도만께에서·…×▲▼←→↑↓★☆♥%')
text={c for c in text if c.isprintable() or c==' '}
os.makedirs(f'{R}/fonts',exist_ok=True)
tf=f'{R}/fonts/chars.txt'  # qa.py가 화면 글자와 대조한다
open(tf,'w',encoding='utf-8').write(''.join(sorted(text)))
JOBS=[('BlackHanSans-Regular.ttf','bhs-400'),('IBMPlexSansKR-Regular.ttf','plex-400'),('IBMPlexSansKR-Medium.ttf','plex-500'),
      ('IBMPlexSansKR-SemiBold.ttf','plex-600'),('IBMPlexSansKR-Bold.ttf','plex-700')]
for src,out in JOBS:
    subprocess.run(['pyftsubset',f'{SRC}/{src}',f'--text-file={tf}','--flavor=woff2',f'--output-file={R}/fonts/{out}.woff2',
                    '--layout-features=*','--no-hinting','--desubroutinize'],check=True)
    print(out,os.path.getsize(f'{R}/fonts/{out}.woff2')//1024,'KB')
print('글자 수',len(text))

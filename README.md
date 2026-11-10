# 포켓몬 랜덤 디펜스

포켓몬을 소환하고 합성해 길 위의 적을 막는 랜덤 타워 디펜스. 관동과 성도 체육관 8곳씩, 지방마다 40웨이브.

## 실행

정적 파일이라 아무 웹 서버로 열면 된다. 스프라이트를 따로 불러오므로 `file://`보다 서버가 안전하다.

```
python3 -m http.server 8000
# http://localhost:8000/
```

## 파일 구조

| 경로 | 내용 |
|---|---|
| `index.html` | 일반 웹페이지(GitHub Pages). `tools/build.py`가 만든다 |
| `artifact.html` | claude.ai 아티팩트용 본문(문서 머리 없이). 같은 스크립트를 쓴다 |
| `src/head.html`, `src/body.html` | 위 두 페이지의 원본 |
| `css/game.css` | 화면 전체 스타일 |
| `js/sprites.js` | 스프라이트 좌표(자동 생성) |
| `js/data.js` | 타입 상성, 계열(LINES), 특성, 트레이너 덱, 전설, 성격 |
| `js/regions.js` | 지방 데이터: 체육관, 도시 배경, 적 풀, 판 모양, 규칙(성도 낮과 밤) |
| `js/core.js` | 상태, 능력치 계산, 판·길 기하와 배경, 웨이브 진행, 공격과 피해 |
| `js/skills.js` | 고유 스킬 표와 발동 |
| `js/ui.js` | 소환·합성·판매, 보상, 기록과 이어하기, 타이틀·지방·덱·결과·메뉴 화면, HUD |
| `js/render.js` | 캔버스 그리기(3/4 시점 변환), 투사체, 파티클, 배너 |
| `js/scene.js` | 전장 연출: 떠다니는 것, 구름 그림자, 빛, 밤 조명, 테두리 소품, 스킬 컷인, 카메라 |
| `js/main.js` | 효과음, 입력, 메인 루프(짧은 정지·컷인 느리게), 시작 |
| `sprites/anim-*.webp` | 움직이는 스프라이트 묶음(1024px, 파일 이름에 내용 해시) |
| `sprites/thumbs.*.webp` | 정지 썸네일 묶음(96px 칸). 움직이는 그림을 못 불러오면 이걸로 대신 그린다 |

스크립트는 모듈이 아닌 일반 스크립트로, 위 순서대로 읽는다. 맨 위 `const`/`let`은 파일끼리 공유된다.

## 스프라이트 다시 만들기

PokeAPI/sprites의 Showdown 움직이는 GIF를 `gifs/{도감번호}.gif`로 받아 둔 뒤:

```
python3 tools/build_sprites.py gifs . ids.json
python3 tools/build.py
```

## 지방 추가하기

`js/regions.js`의 `REGIONS`에 항목을 넣는다. 판은 5×8이고 3/4 시점으로 그린다(시뮬레이션은 위에서 본 좌표, 그릴 때만 세로를 0.78배). 판 모양은 `path(o,C,R)`가 돌려주는 닫힌 점 목록(칸 단위)이고, 길이 지나가는 칸은 `closed`에 칸 번호로 막는다. 어느 칸이든 길에서 두 칸 안에 들도록 길을 판 안쪽으로 넣는다.

'use strict';
// ───────── 지방 ─────────
// 지방마다 체육관 8곳, 도시 배경 8장, 적 풀, 판 모양, 규칙이 다르다.
const KANTO_GYMS=[
 {lead:'웅',n:'롱스톤',id:95,t:['바위','땅'],hp:7,sp:0.55,gim:'sturdy',desc:'옹골참: 효과가 굉장한 공격이 아니면 피해 40% 감소.',badge:'회색배지',bd:'필드 적 제한 +10',ap:m=>{m.cap+=10;},col:'#a3a3a3'},
 {lead:'이슬',n:'아쿠스타',id:121,t:['물','에스퍼'],hp:14,sp:0.7,gim:'recover',desc:'자기재생: 8초마다 체력 15% 회복.',badge:'블루배지',bd:'이자 상한 +5',ap:m=>{m.intCap+=5;},col:'#4f8ff7'},
 {lead:'마티스',n:'라이츄',id:26,t:['전기'],hp:18,sp:0.75,gim:'paralyze',desc:'10만볼트: 6초마다 가까운 포켓몬들을 2초 마비시켜요.',badge:'오렌지배지',bd:'모든 포켓몬 공격 속도 +8%',ap:m=>{m.rateAll+=0.08;},col:'#f39c33'},
 {lead:'민화',n:'라플레시아',id:45,t:['풀','독'],hp:22,sp:0.55,gim:'seed',desc:'씨뿌리기: 4초마다 부하 2마리를 불러요.',badge:'무지개배지',bd:'독·화상·장판 피해 +30%',ap:m=>{m.dot+=0.3;},col:'#c77dde'},
 {lead:'독수',n:'또도가스',id:110,t:['독'],hp:25,sp:0.6,gim:'smoke',desc:'연막: 7초마다 3초 동안 공격의 40%가 빗나가요.',badge:'핑크배지',bd:'강화 비용 -15%',ap:m=>{m.upCost*=0.85;},col:'#f48fb1'},
 {lead:'초련',n:'후딘',id:65,t:['에스퍼'],hp:28,sp:0.6,gim:'teleport',desc:'순간이동: 7초마다 길 위 다른 곳으로 이동. 체력 절반 아래에서 받는 피해 30% 감소.',badge:'골드배지',bd:'사거리 +10%',ap:m=>{m.rangeAll+=0.1;},col:'#e8c547'},
 {lead:'강연',n:'윈디',id:59,t:['불꽃'],hp:30,sp:1.3,gim:'blaze',desc:'신속: 아주 빠르고 감속·기절·잠듦에 걸리지 않아요.',badge:'크림슨배지',bd:'치명타 확률 +8%',ap:m=>{m.crit+=0.08;},col:'#e05248'},
 {lead:'비주기',n:'코뿌리',id:112,t:['땅','바위'],hp:34,sp:0.5,gim:'final',desc:'효과가 굉장한 공격이 아니면 피해 40% 감소. 체력 절반 아래에서 초당 1.5% 회복.',badge:'그린배지',bd:'관동 정복',ap:()=>{},col:'#5fae5b'},
];
const KANTO_ENEMY={'노말':[['꼬렛',19],['레트라',20],['지그제구리',263],['비버니',399]],'불꽃':[['포니타',77],['식스테일',37],['불꽃숭이',390],['염버니',813]],'물':[['고라파덕',54],['발챙이',60],['수댕이',501],['왕눈해',72]],'전기':[['찌리리공',100],['썬더라이',309],['에몽가',587],['파치리스',417]],'풀':[['뚜벅쵸',43],['모다피',69],['체리버',420],['주리비얀',495]],'얼음':[['델리버드',225],['눈꼬마',361],['바닐프티',582]],'격투':[['망키',56],['배루키',236],['마크탕',296]],'독':[['아보',23],['또가스',109],['스컹뿡',434]],'땅':[['모래두지',27],['디그다',50],['우파',194]],'비행':[['깨비참',21],['부우부',163],['찌르꼬',396],['콩둘기',519]],'에스퍼':[['슬리프',96],['야돈',79],['요가랑',307]],'벌레':[['뿔충이',13],['콘팡',48],['개무소',265]],'바위':[['암나이트',138],['코코파스',299],['두개도스',408]],'고스트':[['무우마',200],['흔들풍손',425],['해골몽',355]],'드래곤':[['음뱃',714],['미끄메라',704]],'악':[['포챠나',261],['델빌',228],['포푸니',215]],'강철':[['무장조',227],['기어르',599]],'페어리':[['블루',209],['슈쁘',682],['마릴',183]]};

const KANTO_THEMES=[
 {n:'회색시티 바위길',ground:'rock',g:['#a9a08c','#9c937f','#c4bca8','#7a715e'],border:'trees',path:'dirt',p:['#c9aa78','#b59766','#dcc08f','#8a6f45'],tall:true,
  plat:{rim:'#e2d9c6',top:'#a89c86',side:'#6f6553',tex:'#8f846f',kind:'rock'}},
 {n:'블루시티 물가',ground:'water',island:{ground:'#8cc670',shore:'#efdca6',dark:'#5f9c4b',light:'#b1df98'},g:['#5d9fe0','#5293d4','#8cc0f0','#3f7cc0'],border:'trees',path:'bridge',p:['#c3925a','#a87a46','#dcae76','#6e4a26'],tall:false,
  plat:{rim:'#fbf2cf',top:'#ead9a6',side:'#a98f55',tex:'#d4bd7e',kind:'sand'}},
 {n:'갈색시티 발전소',ground:'metal',g:['#9aa4b0','#8e98a4','#b4bdc8','#6c7681'],border:'wall',path:'catwalk',p:['#d4b84c','#c2a63e','#ead27a','#3a3426'],tall:false,
  plat:{rim:'#e6ebf0',top:'#b7c0ca',side:'#717b86',tex:'#97a1ac',kind:'metal'}},
 {n:'무지개시티 꽃밭',ground:'grass',g:['#86c46a','#79b75e','#a9db8e','#5a9a47'],border:'trees',path:'dirt',p:['#e2c98f','#d2b87c','#f0dcaa','#a88a52'],tall:true,flowers:true,
  plat:{rim:'#e8f4d4',top:'#88c96a',side:'#4f8a3a',tex:'#a3da84',kind:'grass'}},
 {n:'연분홍시티 미로',ground:'swamp',g:['#a88ac0','#9c7eb4','#bea3d4','#7a5f92'],border:'wall',path:'stone',p:['#d8c9b0','#c8b89e','#e8dcc6','#8e7e66'],tall:false,
  plat:{rim:'#f1e6f8',top:'#b59cc9',side:'#76608a',tex:'#a088b6',kind:'stone'}},
 {n:'노랑시티 순간이동',ground:'gym',g:['#dcc690','#cfb882','#ead9aa','#a8915c'],border:'wall',path:'carpet',p:['#cd5f5f','#b84f4f','#e08080','#7c2e2e'],tall:false,warp:true,
  plat:{rim:'#ffe3f0',top:'#e98fb6',side:'#a3557a',tex:'#f4b3cf',kind:'warp'}},
 {n:'홍련섬 화산',ground:'volcano',g:['#7a5446','#6d483b','#8e6655','#4f322a'],border:'rocks',path:'ash',p:['#a8917e','#9a8370','#bca591','#6a5546'],tall:false,
  plat:{rim:'#e2cfc2',top:'#8a6a5c',side:'#523a30',tex:'#7a5a4c',kind:'rock'}},
 {n:'상록시티 회전 바닥',ground:'gym',g:['#cdb98e','#c0ac80','#ddcca4','#94805a'],border:'wall',path:'arrows',p:['#5a86c8','#4c76b6','#86aee4','#2c4a7a'],tall:false,
  plat:{rim:'#fff1c2',top:'#d8b85a',side:'#957a2c',tex:'#c9a748',kind:'metal'}},
];

const JOHTO_GYMS=[
 {lead:'비상',n:'피죤',id:17,t:['노말','비행'],hp:7,sp:0.8,gim:'tailwind',desc:'순풍: 8초마다 4초 동안 필드의 모든 적이 1.5배 빨라져요.',badge:'윙배지',bd:'소환 비용 -10%',ap:m=>{m.costMult*=0.9;},col:'#b9c7d6'},
 {lead:'호일',n:'핫삼',id:212,t:['벌레','강철'],hp:13,sp:0.65,gim:'armor',desc:'강철 몸: 불꽃 공격이 아니면 피해 30% 감소.',badge:'인섹트배지',bd:'치명타 확률 +6%',ap:m=>{m.crit+=0.06;},col:'#8fbf3f'},
 {lead:'꼭두',n:'밀탱크',id:241,t:['노말'],hp:17,sp:0.7,gim:'milk',desc:'우유마시기: 체력이 절반 아래로 떨어지면 한 번 40% 회복해요. 시간이 갈수록 빨라져요.',badge:'플레인배지',bd:'이자 상한 +5',ap:m=>{m.intCap+=5;},col:'#f2a0bd'},
 {lead:'유빈',n:'팬텀',id:94,t:['고스트','독'],hp:21,sp:0.6,gim:'hypnosis',desc:'최면술: 7초마다 가까운 포켓몬 2마리를 3초 재워요.',badge:'팬텀배지',bd:'고스트·악 포켓몬 공격 +20%',ap:m=>{m.typeBonus['고스트']=(m.typeBonus['고스트']||0)+0.2;m.typeBonus['악']=(m.typeBonus['악']||0)+0.2;},col:'#8b72ad'},
 {lead:'사도',n:'강챙이',id:62,t:['물','격투'],hp:24,sp:0.6,gim:'detect',desc:'판별: 6초마다 1.5초 동안 피해를 받지 않아요.',badge:'쇼크배지',bd:'모든 포켓몬 공격 +10%',ap:m=>{m.dmgAll+=0.1;},col:'#e0a33a'},
 {lead:'규리',n:'강철톤',id:208,t:['강철','땅'],hp:27,sp:0.5,gim:'iron',desc:'단단한 바위: 효과가 굉장한 공격이 아니면 피해 45% 감소.',badge:'스틸배지',bd:'관장 포켓몬에게 주는 피해 +20%',ap:m=>{m.bossDmg+=0.2;},col:'#a9b2c3'},
 {lead:'류옹',n:'메꾸리',id:221,t:['얼음','땅'],hp:30,sp:0.6,gim:'hail',desc:'싸라기눈: 9초마다 3초 동안 얼음 타입이 아닌 포켓몬의 공격 속도가 40% 느려져요.',badge:'아이스배지',bd:'필드 적 제한 +10',ap:m=>{m.cap+=10;},col:'#9fdedb'},
 {lead:'이향',n:'킹드라',id:230,t:['물','드래곤'],hp:33,sp:0.55,gim:'ddance',desc:'용의춤: 10초마다 빨라지고 받는 피해가 15%씩 줄어요(3번까지).',badge:'라이징배지',bd:'성도 정복',ap:()=>{},col:'#5b6fd6'},
];
const JOHTO_ENEMY={'노말':[['꼬리선',161],['깜지곰',216],['에이팜',190]],'불꽃':[['마그마그',218],['마그비',240]],'물':[['우파',194],['총어',223],['초라기',170]],'전기':[['초라기',170],['에레키드',239]],'풀':[['통통코',187],['해너츠',191]],'얼음':[['포푸니',215],['뽀뽀라',238]],'격투':[['배루키',236]],'독':[['페이검',167],['침바루',211]],'땅':[['코코리',231],['우파',194]],'비행':[['부우부',163],['니로우',198]],'에스퍼':[['네이티',177],['키링키',203]],'벌레':[['레디바',165],['왕자리',193],['단단지',213]],'바위':[['단단지',213],['꼬마돌',74]],'고스트':[['무우마',200],['고오스',92]],'드래곤':[['미뇽',147]],'악':[['니로우',198],['델빌',228],['포푸니',215]],'강철':[['무장조',227]],'페어리':[['블루',209],['토게피',175],['마릴',183]]};
const JOHTO_THEMES=[
 {n:'도라지시티 모다피의 탑',ground:'wood',g:['#b98c5e','#a97d51','#d1a77a','#7d5a36'],border:'wall',path:'stone',p:['#cfc2a6','#bdb093','#e2d8c0','#8a7d62'],tall:false,
  plat:{rim:'#f3e3c8',top:'#c49a6c',side:'#7d5a36',tex:'#a97d51',kind:'stone'}},
 {n:'고동마을 너도밤나무숲',ground:'grass',g:['#5f9a4c','#558f43','#7eb866','#3c6e30'],border:'trees',path:'dirt',p:['#b89a68','#a68a5a','#cdb383','#7a6440'],tall:true,
  plat:{rim:'#dcefc9',top:'#6fae55',side:'#3c6e30',tex:'#8bc56f',kind:'grass'}},
 {n:'금빛시티 백화점',ground:'gym',g:['#e6c9d6','#dbbccb','#f2dde6','#b391a2'],border:'wall',path:'carpet',p:['#c94f6d','#b5435f','#e07a92','#7a2a3e'],tall:false,
  plat:{rim:'#fff1f6',top:'#e7a5bd',side:'#a3557a',tex:'#f4c3d4',kind:'stone'}},
 {n:'인주시티 불탄탑',ground:'swamp',g:['#6e6080','#625574','#867a98','#463b56'],border:'wall',path:'stone',p:['#a8a0b4','#9890a4','#bcb5c6','#625a70'],tall:false,
  plat:{rim:'#e2dcea',top:'#8a7d9e',side:'#4f4560',tex:'#a397b6',kind:'stone'}},
 {n:'진청시티 바닷가',ground:'sand',g:['#e8d4a0','#dcc792','#f4e6bc','#b59f68'],border:'rocks',path:'bridge',p:['#c3925a','#a87a46','#dcae76','#6e4a26'],tall:false,
  plat:{rim:'#fbf2cf',top:'#ead9a6',side:'#a98f55',tex:'#d4bd7e',kind:'sand'}},
 {n:'담청시티 등대',ground:'metal',g:['#8fa2b4','#8396a8','#aabbcc','#5f7286'],border:'wall',path:'catwalk',p:['#e0c25a','#cdb04c','#f0da8a','#3a3426'],tall:false,
  plat:{rim:'#e6ebf0',top:'#b7c0ca',side:'#717b86',tex:'#97a1ac',kind:'metal'}},
 {n:'황토마을 얼음길',ground:'ice',g:['#cfe6f2','#c0dbea','#e8f5fb','#8fb3c8'],border:'rocks',path:'stone',p:['#f2f6f8','#e4ebef','#ffffff','#a9bac4'],tall:false,
  plat:{rim:'#ffffff',top:'#bfe0ee',side:'#7aa2b8',tex:'#e4f3fa',kind:'stone'}},
 {n:'검은먹시티 용의 굴',ground:'water',g:['#2f5f8a','#2a557d','#4a7eaa','#1b3c5a'],border:'rocks',path:'bridge',p:['#8a7a66','#7a6a56','#a2927c','#4a3e30'],tall:false,
  plat:{rim:'#d6e2ee',top:'#6d8aa6',side:'#3a5068',tex:'#86a2bc',kind:'rock'}},
];
const HOENN_GYMS=[
 {lead:'원규',n:'코코파스',id:299,t:['바위'],hp:7,sp:0.5,gim:'sturdy',desc:'옹골참: 효과가 굉장한 공격이 아니면 피해 40% 감소.',badge:'스톤배지',bd:'필드 적 제한 +10',ap:m=>{m.cap+=10;},col:'#b08a5a'},
 {lead:'철구',n:'하리뭉',id:297,t:['격투'],hp:13,sp:0.65,gim:'bulk',desc:'벌크업: 8초마다 받는 피해가 15%씩 줄어요(3번까지).',badge:'너클배지',bd:'모든 포켓몬 공격 +8%',ap:m=>{m.dmgAll+=0.08;},col:'#d4473f'},
 {lead:'암페어',n:'썬더볼트',id:310,t:['전기'],hp:17,sp:0.8,gim:'paralyze',desc:'방전: 6초마다 가까운 포켓몬들을 2초 마비시켜요.',badge:'다이나모배지',bd:'이자 상한 +5',ap:m=>{m.intCap+=5;},col:'#f5d43a'},
 {lead:'민지',n:'코터스',id:324,t:['불꽃'],hp:21,sp:0.45,gim:'smoke',desc:'연막: 7초마다 3초 동안 공격의 40%가 빗나가요.',badge:'히트배지',bd:'독·화상·장판 피해 +30%',ap:m=>{m.dot+=0.3;},col:'#f08a3c'},
 {lead:'종길',n:'게을킹',id:289,t:['노말'],hp:30,sp:0.75,gim:'truant',desc:'게으름: 3초 걷고 3초 쉬어요. 대신 체력이 아주 많아요.',badge:'밸런스배지',bd:'소환 비용 -10%',ap:m=>{m.costMult*=0.9;},col:'#c9b48a'},
 {lead:'은송',n:'파비코리',id:334,t:['드래곤','비행'],hp:27,sp:0.7,gim:'tailwind',desc:'순풍: 8초마다 4초 동안 필드의 모든 적이 1.5배 빨라져요.',badge:'페더배지',bd:'사거리 +10%',ap:m=>{m.rangeAll+=0.1;},col:'#9fd0f5'},
 {lead:'풍&란',n:'솔록',id:338,t:['에스퍼','바위'],hp:30,sp:0.6,gim:'teleport',desc:'순간이동: 7초마다 길 위 다른 곳으로 이동. 체력 절반 아래에서 받는 피해 30% 감소.',badge:'마인드배지',bd:'치명타 확률 +8%',ap:m=>{m.crit+=0.08;},col:'#f76693'},
 {lead:'아단',n:'밀로틱',id:350,t:['물'],hp:34,sp:0.6,gim:'recover',desc:'자기재생: 8초마다 체력 15% 회복.',badge:'레인배지',bd:'호연 정복',ap:()=>{},col:'#5b8fd6'},
];
const HOENN_ENEMY={'노말':[['지그제구리',263],['소곤룡',293],['에나비',300]],'불꽃':[['둔타',322],['불꽃숭이',390]],'물':[['연꽃몬',270],['샤프니아',318],['고래왕자',320],['가재군',341]],'전기':[['썬더라이',309]],'풀':[['도토링',273],['버섯꼬',285]],'얼음':[['눈꼬마',361],['대굴레오',363]],'격투':[['마크탕',296],['요가랑',307]],'독':[['아보',23],['스컹뿡',434]],'땅':[['톱치',328],['둔타',322],['미꾸리',339]],'비행':[['갈모매',278],['파비코',333]],'에스퍼':[['오뚝군',343],['요가랑',307]],'벌레':[['개무소',265]],'바위':[['코코파스',299]],'고스트':[['해골몽',355],['어둠대신',353]],'드래곤':[['미끄메라',704],['파비코',333]],'악':[['깜까미',302],['포챠나',261],['앱솔',359]],'강철':[['기어르',599]],'페어리':[['마릴',183]]};
const HOENN_THEMES=[
 {n:'바위 체육관',ground:'rock',g:['#b5a688','#a8997b','#cdbfa2','#857559'],border:'rocks',path:'dirt',p:['#cdb07e','#b99c6b','#e0c695','#8c714a'],tall:false,plat:{rim:'#efe3c8',top:'#b19f80',side:'#74654c',tex:'#968569',kind:'rock'}},
 {n:'파도 동굴',ground:'swamp',g:['#5f7d8c','#55727f','#7c99a6','#3c5562'],border:'rocks',path:'stone',p:['#b9b2a2','#a9a292','#cdc7b8','#7a7466'],tall:false,plat:{rim:'#dfe8ec',top:'#7f98a4',side:'#46606c',tex:'#98afba',kind:'stone'}},
 {n:'발전 체육관',ground:'metal',g:['#a2a9b8','#959cab','#bcc3d0','#6f7685'],border:'wall',path:'catwalk',p:['#e0c25a','#cdb04c','#f0da8a','#3a3426'],tall:false,plat:{rim:'#e6ebf0',top:'#b7c0ca',side:'#717b86',tex:'#97a1ac',kind:'metal'}},
 {n:'용암 온천',ground:'volcano',g:['#82584a','#744c3f','#966a59','#55362c'],border:'rocks',path:'ash',p:['#ab947f','#9d8672','#bfa893','#6c5747'],tall:false,plat:{rim:'#e2cfc2',top:'#8a6a5c',side:'#523a30',tex:'#7a5a4c',kind:'rock'}},
 {n:'도장 마루',ground:'wood',g:['#c49a68','#b58c5c','#d8b384','#87653f'],border:'wall',path:'carpet',p:['#4f7ac9','#4369b4','#7aa0e0','#26407a'],tall:false,plat:{rim:'#f3e3c8',top:'#c49a6c',side:'#7d5a36',tex:'#a97d51',kind:'stone'}},
 {n:'나무 위 하늘길',ground:'grass',g:['#7fc06a','#72b35e','#a2d88d','#55974a'],border:'trees',path:'bridge',p:['#c3925a','#a87a46','#dcae76','#6e4a26'],tall:true,flowers:true,plat:{rim:'#e8f4d4',top:'#88c96a',side:'#4f8a3a',tex:'#a3da84',kind:'grass'}},
 {n:'별의 체육관',ground:'gym',g:['#c9b7e0','#bcaad4','#ddd0ee','#9483b0'],border:'wall',path:'arrows',p:['#6a5acd','#5a4bbb','#9183e0','#352a7a'],tall:false,warp:true,plat:{rim:'#ffe3f0',top:'#c9a3e0',side:'#7a5598',tex:'#e0c3f0',kind:'warp'}},
 {n:'물의 체육관',ground:'ice',g:['#bfe0f0','#b0d4e8','#dcf0fa','#7fa8c0'],border:'rocks',path:'stone',p:['#f2f6f8','#e4ebef','#ffffff','#a9bac4'],tall:false,plat:{rim:'#ffffff',top:'#bfe0ee',side:'#7aa2b8',tex:'#e4f3fa',kind:'stone'}},
];
// 챔피언로드: 사천왕 넷과 챔피언
const CHAMP_GYMS=[
 {lead:'칸나',n:'라프라스',id:131,t:['얼음','물'],hp:11,sp:0.55,gim:'hail',desc:'싸라기눈: 9초마다 3초 동안 얼음 타입이 아닌 포켓몬의 공격 속도가 40% 느려져요.',badge:'칸나의 인정',bd:'모든 포켓몬 공격 +10%',ap:m=>{m.dmgAll+=0.1;},col:'#9fdedb'},
 {lead:'시바',n:'괴력몬',id:68,t:['격투'],hp:17,sp:0.6,gim:'bulk',desc:'벌크업: 8초마다 받는 피해가 15%씩 줄어요(3번까지).',badge:'시바의 인정',bd:'관장 피해 +20%',ap:m=>{m.bossDmg+=0.2;},col:'#d4473f'},
 {lead:'국화',n:'팬텀',id:94,t:['고스트','독'],hp:25,sp:0.6,gim:'hypnosis',desc:'최면술: 7초마다 가까운 포켓몬 2마리를 3초 재워요.',badge:'국화의 인정',bd:'치명타 확률 +8%',ap:m=>{m.crit+=0.08;},col:'#8b72ad'},
 {lead:'목호',n:'망나뇽',id:149,t:['드래곤','비행'],hp:34,sp:0.6,gim:'ddance',desc:'용의춤: 10초마다 빨라지고 받는 피해가 15%씩 줄어요(3번까지).',badge:'목호의 인정',bd:'필드 적 제한 +10',ap:m=>{m.cap+=10;},col:'#8256f7'},
 {lead:'그린',n:'리자몽',id:6,t:['불꽃','비행'],hp:52,sp:0.55,gim:'final',desc:'효과가 굉장한 공격이 아니면 피해 40% 감소. 체력 절반 아래에서 초당 1.5% 회복.',badge:'챔피언',bd:'챔피언로드 돌파',ap:()=>{},col:'#f2c14e'},
];
CHAMP_GYMS.forEach((g,k)=>{g.title=k<4?`사천왕 ${g.lead}`:`챔피언 ${g.lead}`;});
const CHAMP_THEMES=[JOHTO_THEMES[6],KANTO_THEMES[6],KANTO_THEMES[4],JOHTO_THEMES[7],JOHTO_THEMES[2]].map((t,k)=>Object.assign({},t,{n:['칸나의 방','시바의 방','국화의 방','목호의 방','챔피언의 방'][k]}));
// 판 모양: 칸 좌표(0..COLS, 0..ROWS) 위의 닫힌 길. o는 판 바깥 여백(칸 단위)으로 layout에서 정해진다.
// 지방마다 길 모양이 2~3가지 있고, 관장을 하나 이길 때마다 다음 모양으로 바뀐다.
const RECT_PATH=(o,C,R)=>[[-o,-o],[C+o,-o],[C+o,R+o],[-o,R+o]];
const V=(path,closed,n)=>({path,closed,n});
const REGIONS=[
 {id:'kanto',n:'관동',sub:'관동 체육관 8곳, 40웨이브 · 관장마다 바뀌는 길',gyms:KANTO_GYMS,themes:KANTO_THEMES,enemy:KANTO_ENEMY,cols:5,rows:8,hpMul:1.12,
  variants:[
   V((o,C,R)=>[[-o,-o],[C+o,-o],[C+o,R+o],[2.5,R+o],[2.5,2.5],[-o,2.5]],[10,11,12,17,22,27,32,37],'ㄱ자 길'),
   V((o,C,R)=>[[-o,-o],[C+o,-o],[C+o,2.5],[2.5,2.5],[2.5,R+o],[-o,R+o]],[12,13,14,17,22,27,32,37],'거꾸로 ㄱ자 길'),
   V((o,C,R)=>[[-o,-o],[C+o,-o],[C+o,5.5],[1.5,5.5],[1.5,R+o],[-o,R+o]],[26,27,28,29,31,36],'아래로 꺾인 길')],
  rule:null,win:'여덟 체육관을 모두 돌파했어요. 그린배지까지 손에 넣었어요.',winTitle:'관동 정복',face:[6,25,150]},
 {id:'johto',n:'성도',sub:'성도 체육관 8곳, 40웨이브 · 낮과 밤',gyms:JOHTO_GYMS,themes:JOHTO_THEMES,enemy:JOHTO_ENEMY,cols:5,rows:8,hpMul:1.26,
  variants:[
   V((o,C,R)=>[[-o,-o],[C+o,-o],[C+o,R+o],[3.5,R+o],[3.5,4.5],[1.5,4.5],[1.5,R+o],[-o,R+o]],[21,22,23,26,28,31,33,36,38],'아래가 파인 ㄷ자 길'),
   V((o,C,R)=>[[-o,-o],[1.5,-o],[1.5,3.5],[3.5,3.5],[3.5,-o],[C+o,-o],[C+o,R+o],[-o,R+o]],[1,6,11,16,17,18,3,8,13],'위가 파인 ㄷ자 길'),
   V((o,C,R)=>[[-o,-o],[C+o,-o],[C+o,2.5],[1.5,2.5],[1.5,5.5],[C+o,5.5],[C+o,R+o],[-o,R+o]],[11,12,13,14,16,21,26,27,28,29],'옆이 파인 ㄷ자 길')],
  rule:'daynight',ruleDesc:'5웨이브마다 낮과 밤이 바뀌어요. 밤에는 고스트·악 포켓몬 공격 +30%, 고스트·악 적이 자주 나와요.',
  win:'여덟 체육관을 모두 돌파했어요. 라이징배지까지 손에 넣었어요.',winTitle:'성도 정복',face:[157,160,154],lock:'관동을 정복하면 열려요.'},
 {id:'hoenn',n:'호연',sub:'호연 체육관 8곳, 40웨이브 · 날씨와 지그재그 길',gyms:HOENN_GYMS,themes:HOENN_THEMES,enemy:HOENN_ENEMY,cols:5,rows:8,hpMul:1.24,
  variants:[
   V((o,C,R)=>[[-o,-o],[C+o,-o],[C+o,R+o],[3.5,R+o],[3.5,5.5],[1.5,5.5],[1.5,2.5],[-o,2.5]],[10,11,16,21,26,27,28,33,38],'지그재그 길'),
   V((o,C,R)=>[[-o,-o],[C+o,-o],[C+o,2.5],[3.5,2.5],[3.5,5.5],[1.5,5.5],[1.5,R+o],[-o,R+o]],[13,14,18,23,28,26,27,31,36],'거꾸로 지그재그 길')],
  rule:'weather',ruleDesc:'5웨이브마다 날씨가 바뀌어요. 쾌청은 불꽃, 비는 물, 모래바람은 바위·땅·강철, 싸라기눈은 얼음 포켓몬이 세져요.',
  win:'여덟 체육관을 모두 돌파했어요. 레인배지까지 손에 넣었어요.',winTitle:'호연 정복',face:[254,257,260],lock:'성도를 정복하면 열려요.'},
 {id:'champ',n:'챔피언로드',sub:'사천왕 넷과 챔피언, 25웨이브 · 8자로 엇갈리는 길',gyms:CHAMP_GYMS,themes:CHAMP_THEMES,enemy:KANTO_ENEMY,cols:5,rows:8,hpMul:1.55,maxw:25,
  variants:[V((o,C,R)=>[[2.5,-o],[C+o,-o],[C+o,3.5],[-o,3.5],[-o,R+o],[2.5,R+o]],[2,7,12,15,16,17,18,19,22,27,32,37],'8자 길')],
  rule:null,ruleDesc:'5웨이브마다 사천왕이 나오고, 25웨이브에서 챔피언과 싸워요. 적이 처음부터 강해요.',
  win:'사천왕과 챔피언을 모두 이겼어요. 이제 당신이 챔피언이에요.',winTitle:'챔피언',face:[131,149,6],lock:'관동을 정복하면 열려요.'},
];
let REGION=REGIONS[0],GYMS=KANTO_GYMS,THEMES=KANTO_THEMES,ENEMY=KANTO_ENEMY,OPEN=[],VAR=0;
function setRegion(R){
  REGION=R;GYMS=R.gyms;THEMES=R.themes;ENEMY=R.enemy;COLS=R.cols;ROWS=R.rows;N=COLS*ROWS;MAXW=R.maxw||40;
  setVariant(0);
}
// 길 모양 바꾸기(관장 구간마다)
function setVariant(k){const R=REGION,v=R.variants[k%R.variants.length];VAR=k%R.variants.length;R.path=v.path;R.closed=v.closed;
  OPEN=Array.from({length:N},(_,i)=>!v.closed.includes(i));}
const variantFor=w=>Math.floor(((w||1)-1)/5)%REGION.variants.length;
const isOpen=i=>i>=0&&i<N&&OPEN[i];
// 밤: 6~10, 16~20, 26~30, 36~40웨이브
const isNight=w=>REGION.rule==='daynight'&&Math.floor(((w||1)-1)/5)%2===1;
// 호연 날씨
const WEATHER={sun:{n:'쾌청',d:'불꽃 포켓몬 공격 +40%, 물 포켓몬 공격 -25%',up:['불꽃'],down:['물']},rain:{n:'비',d:'물 포켓몬 공격 +40%, 불꽃 포켓몬 공격 -25%',up:['물'],down:['불꽃']},
 sand:{n:'모래바람',d:'바위·땅·강철 포켓몬 공격 +35%',up:['바위','땅','강철'],down:[]},hail:{n:'싸라기눈',d:'얼음 포켓몬 공격 +40%, 모든 적 속도 -10%',up:['얼음'],down:[]}};
const weatherAt=w=>REGION.rule==='weather'?['sun','rain','sand','hail'][Math.floor(((w||1)-1)/5)%4]:null;
setRegion(REGIONS[0]);

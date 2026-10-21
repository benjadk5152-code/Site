/* Bubu & Dudu: the site logic.
   Names and texts live in settings.js, the Firebase keys in firebase-config.js. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

if(!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('PASTE')){
  document.body.className = '';
  document.body.innerHTML = '<p style="font:16px Inter,sans-serif;padding:40px;text-align:center">Almost there ♡<br>Paste your Firebase config into <b>firebase-config.js</b> (SETUP.md, step 2).</p>';
  throw new Error('firebase-config.js is not filled in yet');
}
const fb = initializeApp(firebaseConfig);
const auth = getAuth(fb);
const db = getFirestore(fb);

// Each of you logs in with a 6-digit code. In Firebase, the account's password is exactly that code.
const CODE_LENGTH = 6;

const cap = s => s.charAt(0).toUpperCase()+s.slice(1);
const fill = s => s.replaceAll('{her}', SETTINGS.herName).replaceAll('{me}', SETTINGS.myName)
                   .replaceAll('{Her}', cap(SETTINGS.herName)).replaceAll('{Me}', cap(SETTINGS.myName));
const T = key => fill(SETTINGS.texts[key] || '');
const NAME = { bubu: SETTINGS.herName, dudu: SETTINGS.myName };
const STYLES = {
  hey:      { e:'👀', name:'Hey you…',   desc:'typed out like a text' },
  date:     { e:'💌', name:'Date?',      desc:'words bounce in + hearts' },
  ink:      { e:'🖋️', name:'Love letter', desc:'handwritten ink' },
  surprise: { e:'🎉', name:'Surprise!',  desc:'heart burst + zoom' },
};
const $ = s => document.querySelector(s);

/* ---------- bears (original drawings in the bubu & dudu style) ---------- */
function bearSVG(kind, headOnly, sleepy=false){
  const brown = kind==='dudu';
  const line = '#3b2420';
  const fur = brown ? '#d3a08a' : '#ffffff';
  const blush = brown ? '#f6c27c' : '#f8b6c0';
  const s = `stroke="${line}" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"`;
  // head + body are one chubby blob, like the stickers
  const blob = 'M60 12 C93 12 113 31 113 56 C113 72 105 82 95 87 C97 97 96 106 91 112 L29 112 C24 106 23 97 25 87 C15 82 7 72 7 56 C7 31 27 12 60 12 Z';
  const ears = brown
    ? `<circle cx="24" cy="24" r="13" fill="${fur}" ${s}/><circle cx="96" cy="24" r="13" fill="${fur}" ${s}/>
       <path d="M18 27 Q22 18 30 21" fill="none" ${s} stroke-width="2.6"/><path d="M102 27 Q98 18 90 21" fill="none" ${s} stroke-width="2.6"/>`
    : `<circle cx="22" cy="23" r="12" fill="${line}" ${s}/><circle cx="101" cy="30" r="12" fill="${line}" ${s}/>`;
  const limbs = headOnly ? '' : `
    <ellipse cx="15" cy="88" rx="15" ry="9" fill="${fur}" ${s} transform="rotate(-12 15 88)"/>
    <ellipse cx="105" cy="88" rx="15" ry="9" fill="${fur}" ${s} transform="rotate(12 105 88)"/>`;
  const feet = headOnly ? '' : `
    <ellipse cx="42" cy="113" rx="11" ry="6.5" fill="${brown ? fur : line}" ${s}/>
    <ellipse cx="78" cy="113" rx="11" ry="6.5" fill="${fur}" ${s}/>`;
  const bow = (headOnly || brown) ? '' : `
    <path d="M60 91 L50 85 Q47.5 91 50 97 Z M60 91 L70 85 Q72.5 91 70 97 Z" fill="${line}" ${s} stroke-width="2"/>`;
  return `<svg class="bear-svg" viewBox="${headOnly ? '4 6 112 82' : '-2 6 124 116'}" aria-hidden="true">
    ${limbs}${ears}
    <path d="${blob}" fill="${fur}"/>
    <ellipse cx="22" cy="68" rx="11" ry="9" fill="${blush}"/><ellipse cx="98" cy="68" rx="11" ry="9" fill="${blush}"/>
    <path d="${blob}" fill="none" ${s}/>
    ${feet}${bow}
    ${sleepy
      ? `<path d="M34 56 Q41 62 48 56 M72 56 Q79 62 86 56" fill="none" ${s} stroke-width="3"/>
         <path d="M55 64 Q60 68.5 65 64" fill="none" ${s} stroke-width="2.4"/>`
      : `<circle cx="41" cy="55" r="5.2" fill="${line}"/><circle cx="79" cy="55" r="5.2" fill="${line}"/>
         <path d="M52.5 59 Q56.2 63.5 60 59 Q63.8 63.5 67.5 59 L66.5 66 Q60 75 53.5 66 Z" fill="#7d2b33" ${s} stroke-width="2.4"/>
         <ellipse cx="60" cy="68.6" rx="3.8" ry="2.7" fill="#f28fa0"/>`}
  </svg>`;
}
function paintBears(root=document){ root.querySelectorAll('[data-bear]').forEach(n=>{ if(!n.firstChild) n.innerHTML = bearSVG(n.dataset.bear, 'head' in n.dataset); }); }
function bearEl(kind, cls='b', headOnly=false){ const d = el('div',cls); d.dataset.bear = kind; d.innerHTML = bearSVG(kind, headOnly); return d; }

/* ---------- date scenes ---------- */
const SEASONS = {
  spring:{ e:'🌸', name:'spring' }, summer:{ e:'☀️', name:'summer' },
  fall:{ e:'🍂', name:'fall' },     winter:{ e:'❄️', name:'winter' },
};
const DATES = {
  none:      { e:'💌', name:'just a letter' },
  restaurant:{ e:'🍝', name:'restaurant' },
  movie:     { e:'🎬', name:'movie' },
  museum:    { e:'🖼️', name:'museum' },
  dancing:   { e:'💃', name:'dancing' },
  cooking:   { e:'🍳', name:'cooking at home' },
  games:     { e:'🎲', name:'board games at home' },
  gamecafe:  { e:'🧩', name:'board game café' },
  study:     { e:'📚', name:'study date' },
  music:     { e:'🎧', name:'spotify together' },
  sims:      { e:'💎', name:'sims date' },
  skating:   { e:'⛸️', name:'ice skating' },
  cocoa:     { e:'☕', name:'hot chocolate' },
  starbucks: { e:'🥤', name:'starbucks' },
};
// a trailing * means "starts with" (danc* = dance, dancing…)
const TYPE_WORDS = {
  gamecafe:  ['board game café','board game cafe','boardgame café','boardgame cafe','game café','game cafe','brætspilscafé','brætspilscafe','spillecafé','spillecafe'],
  games:     ['board game*','boardgame*','game night','games night','brætspil*','spilaften'],
  cocoa:     ['hot chocolate','hot cocoa','cocoa','kakao','varm kakao'],
  starbucks: ['starbucks','frappuccino','latte','coffee','kaffe'],
  skating:   ['ice skating','skating','skate*','skøjte*'],
  restaurant:['restaurant*','dinner','sushi','pizza','pasta','italian','burger*','lunch','brunch','spise ude'],
  movie:     ['movie*','cinema','film*','biograf*','kino'],
  museum:    ['museum*','gallery','exhibition','udstilling'],
  dancing:   ['danc*','dans*','salsa','disco'],
  cooking:   ['cook*','bake','baking','lave mad','bage','homemade'],
  study:     ['study','studying','uni','university','library','exam*','homework','læse','studere','bibliotek','eksamen'],
  music:     ['spotify','playlist*','music','song*','musik','sang*'],
  sims:      ['sims'],
};
const SEASON_WORDS = {
  winter:['winter','snow*','christmas','xmas','jul','vinter','sne'],
  summer:['summer','beach','sunny','sommer','strand'],
  fall:  ['autumn','halloween','efterår','leaves','pumpkin*'],
  spring:['spring','blossom*','forår','picnic','flower*','blomst*'],
};
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function wordRe(w){ return w.endsWith('*') ? new RegExp('(?<!\\p{L})'+esc(w.slice(0,-1)),'iu') : new RegExp('(?<!\\p{L})'+esc(w)+'(?!\\p{L})','iu'); }
function firstHit(text, table){        // the keyword that appears earliest in the text wins
  let best = null, at = Infinity;
  for(const [k, words] of Object.entries(table)) for(const w of words){
    const m = text.match(wordRe(w)); if(m && m.index < at){ at = m.index; best = k; }
  }
  return best;
}
const seasonOf = d => ['winter','winter','spring','spring','spring','summer','summer','summer','fall','fall','fall','winter'][d.getMonth()];

// little svg helpers (stage is 400 x 230)
const LINE = '#3b2420';
const E = (e, x, y, size, cls='', fill='') => `<g class="${cls}"><text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="central"${fill?` fill="${fill}"`:''}>${e}</text></g>`;
function bearAt(kind, x, y, w, cls='', extra='', sleepy=false){
  return `<g class="${cls}">${bearSVG(kind, false, sleepy).replace('<svg class="bear-svg" ', `<svg x="${x}" y="${y}" width="${w}" height="${(w*116/124).toFixed(1)}" `)}${extra}</g>`;
}
const pair = (x, y, w=74, a='a-bob', b='a-bob2') => bearAt('dudu', x, y, w, a) + bearAt('bubu', x+w*0.8, y, w, b);
const hearts = (x, y) => [0,1,2].map(i=>`<g class="a-float d${i}" style="--fx:${[-10,8,-2][i]}px"><text x="${x+[-12,10,0][i]}" y="${y}" font-size="${[12,10,14][i]}" fill="#ec7f9c" text-anchor="middle">♥</text></g>`).join('');
const musicNotes = (pts) => pts.map(([x,y],i)=>`<g class="a-float d${i%3}" style="--fx:${i%2?8:-8}px"><text x="${x}" y="${y}" font-size="18" fill="#7b5cc6" text-anchor="middle">${i%2?'♫':'♪'}</text></g>`).join('');
const steam = (x, y) => [0,1,2].map(i=>`<g class="a-steam d${i}"><path d="M${x+(i-1)*6} ${y} q-5 -7 0 -14 q5 -7 0 -14" fill="none" stroke="#c9b3d6" stroke-width="2.5" stroke-linecap="round"/></g>`).join('');
const S = `stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round"`;

function platform(season){
  const c = { spring:['#c9eab6','#a8d796'], summer:['#bfe79f','#94cf73'], fall:['#f2c48f','#d99a5b'], winter:['#ffffff','#cfdff3'], morning:['#ffe2c4','#f4c49b'], night:['#4a3d7a','#2f2763'] }[season];
  const decor = {
    spring: E('🌷',30,186,22) + E('🌸',372,188,20),
    summer: E('🌻',28,182,26) + E('🌼',372,190,18),
    fall:   E('🍂',30,192,20) + E('🎃',370,188,22),
    winter: E('⛄',28,178,30) + E('🌲',372,176,30),
  }[season] || '';
  return `<ellipse cx="200" cy="213" rx="190" ry="19" fill="${c[1]}"/><ellipse cx="200" cy="205" rx="190" ry="19" fill="${c[0]}"/>${decor}`;
}

const SCENES = {
  none: () => '',
  restaurant: () =>
    bearAt('dudu',96,122,74,'a-lean-r') + bearAt('bubu',230,122,74,'a-lean-l') +
    `<rect x="146" y="164" width="108" height="38" rx="6" fill="#fff" ${S}/><path d="M147 174 H253" stroke="#f3b6c6" stroke-width="5"/>` +
    E('🍝',174,158,20) + E('🍝',226,158,20) +
    `<rect x="196" y="140" width="8" height="22" rx="2" fill="#fff6dc" ${S} stroke-width="2"/><g class="a-flicker"><ellipse cx="200" cy="133" rx="4" ry="7" fill="#ffb347"/></g>` +
    E('🍷',160,140,18,'a-clink-r') + E('🍷',240,140,18,'a-clink-l') + hearts(200,112),
  movie: () =>
    `<rect x="100" y="12" width="200" height="88" rx="8" fill="#2d2440"/><rect class="a-screen" x="108" y="20" width="184" height="72" rx="5" fill="#ffd1dd"/>` + E('💕',200,56,26,'a-bob') +
    `<rect x="104" y="142" width="88" height="60" rx="16" fill="#e46a7e" ${S}/><rect x="208" y="142" width="88" height="60" rx="16" fill="#e46a7e" ${S}/>` +
    bearAt('dudu',112,128,72,'a-reach') + bearAt('bubu',216,128,72,'a-bob2') +
    E('🍿',200,178,30) +
    `<g class="a-hop"><circle cx="193" cy="160" r="3.2" fill="#fff8dc" stroke="${LINE}" stroke-width="1.2"/></g><g class="a-hop d1"><circle cx="207" cy="158" r="3.2" fill="#fff8dc" stroke="${LINE}" stroke-width="1.2"/></g>` + hearts(200,118),
  museum: () => {
    const frame = (x, y, e) => `<rect x="${x}" y="${y}" width="62" height="54" rx="3" fill="#fffaf0" stroke="#d6a756" stroke-width="5"/>` + E(e, x+31, y+27, 26);
    return frame(70,22,'🌻') + frame(169,14,'🌊') + frame(268,22,'🌙') +
      `<g class="a-stroll">${pair(133,131)}<g class="a-bubble"><rect x="236" y="100" width="54" height="24" rx="12" fill="#fff" ${S} stroke-width="2"/><text x="263" y="116" font-size="11" text-anchor="middle" fill="${LINE}">ooh ♡</text></g></g>`;
  },
  dancing: () =>
    `<line x1="200" y1="0" x2="200" y2="14" stroke="#9a8fa3" stroke-width="2"/>` +
    `<polygon points="200,40 128,200 168,200" fill="#ffb6c9" class="a-twinkle" opacity=".4"/><polygon points="200,40 232,200 272,200" fill="#cdb8ff" class="a-twinkle d1" opacity=".4"/>` +
    `<g class="a-spin"><circle cx="200" cy="30" r="16" fill="#e3e7ee" ${S} stroke-width="2"/><ellipse cx="200" cy="30" rx="7" ry="16" fill="none" stroke="#9aa3b3" stroke-width="1.5"/><line x1="184" y1="30" x2="216" y2="30" stroke="#9aa3b3" stroke-width="1.5"/></g>` +
    E('✦',150,44,13,'a-twinkle','#c79bff') + E('✦',256,34,15,'a-twinkle d1','#ff9ab8') + E('✦',118,86,11,'a-twinkle d2','#ffd56a') + E('✦',288,80,12,'a-twinkle','#8fd3ff') +
    `<g class="a-sway">${pair(133,131,74,'a-hop','a-hop d1')}</g>` + musicNotes([[140,120],[262,112],[300,140]]),
  cooking: () =>
    bearAt('dudu',104,118,74,'a-bob') + bearAt('bubu',224,118,74,'a-bob2') +
    `<rect x="70" y="160" width="260" height="44" rx="8" fill="#fff" ${S}/><rect x="71" y="161" width="258" height="8" fill="#f3d3dd"/>` +
    steam(200,132) + E('🍲',200,148,32) + E('🥄',180,138,20,'a-stir') +
    E('🥕',100,152,18) + E('🧁',258,150,18) + E('🍅',300,152,18) + hearts(200,98),
  games: () =>
    `<rect x="62" y="92" width="276" height="70" rx="26" fill="#cbb8ea" ${S}/>` +
    bearAt('dudu',100,120,74,'a-lean-r') + bearAt('bubu',226,120,74,'a-lean-l') +
    `<rect x="148" y="170" width="104" height="30" rx="6" fill="#f6d7b0" ${S}/><rect x="166" y="160" width="68" height="12" rx="2" fill="#fff" ${S} stroke-width="2"/>` +
    E('♟️',180,152,15) + E('♟️',220,152,15) + E('🎲',200,138,22,'a-roll') + E('🪴',358,166,30) + hearts(200,104),
  gamecafe: () => {
    const lights = [120,150,180,210,240,270].map((x,i)=>`<g class="a-twinkle d${i%3}"><circle cx="${x}" cy="${58+Math.abs(195-x)/9}" r="4" fill="${['#ffd56a','#ff9ab8','#9fd7ff'][i%3]}"/></g>`).join('');
    return `<rect x="110" y="8" width="180" height="30" rx="15" fill="#fff" ${S} stroke-width="2"/><text x="200" y="28" font-size="14" text-anchor="middle" fill="#7b5cc6" style="font-family:'Dancing Script',cursive">board game café</text>` +
      `<path d="M100 56 Q200 84 300 56" fill="none" stroke="#9a8fa3" stroke-width="1.5"/>` + lights +
      `<rect x="306" y="62" width="70" height="104" rx="4" fill="#e7c7a0" ${S} stroke-width="2"/><path d="M306 96 H376 M306 130 H376" stroke="${LINE}" stroke-width="2"/>` +
      `<rect x="312" y="74" width="24" height="20" fill="#ff9ab8"/><rect x="340" y="80" width="30" height="14" fill="#9fd7ff"/><rect x="314" y="108" width="30" height="20" fill="#cdf2df"/><rect x="348" y="104" width="22" height="24" fill="#ffd56a"/>` +
      bearAt('dudu',96,122,74,'a-lean-r') + bearAt('bubu',220,122,74,'a-lean-l') +
      `<rect x="194" y="178" width="12" height="24" fill="#d9b48a" ${S} stroke-width="2"/><ellipse cx="200" cy="176" rx="60" ry="12" fill="#f6d7b0" ${S}/>` +
      E('🎲',196,150,20,'a-roll') + E('🃏',172,166,16) + steam(232,150) + E('☕',232,164,17) + hearts(200,108);
  },
  study: () =>
    `<path d="M118 14 L282 14 L272 29 L282 44 L118 44 L128 29 Z" fill="#cfe3ff" ${S} stroke-width="2"/><text x="200" y="34" font-size="13" text-anchor="middle" fill="${LINE}" font-weight="600">study date ♡</text>` +
    bearAt('dudu',100,120,74,'a-bob') + bearAt('bubu',226,120,74,'a-bob2') +
    `<rect x="108" y="164" width="184" height="38" rx="6" fill="#f3e2c7" ${S}/>` +
    E('📚',134,150,26) + E('💻',202,150,28) + E('✏️',170,162,14,'a-scribble') + E('📖',250,154,22,'a-flip') + E('💌',176,140,14,'a-pass') +
    steam(282,138) + E('☕',282,154,16) + hearts(200,100),
  music: () =>
    `<rect x="122" y="14" width="156" height="48" rx="12" fill="#191414"/><circle cx="146" cy="38" r="12" fill="#1ed760"/>` +
    `<path d="M140 34 Q146 31 153 35 M141 39 Q146 37 152 40 M142 43 Q146 42 150 44" stroke="#191414" stroke-width="2" fill="none" stroke-linecap="round"/>` +
    `<text x="166" y="33" font-size="10.5" fill="#fff" font-weight="600">now playing ♡</text>` +
    [0,1,2,3,4,5].map(i=>`<g class="a-eq d${i%3}"><rect x="${166+i*8}" y="40" width="5" height="12" rx="1.5" fill="#1ed760"/></g>`).join('') +
    `<path d="M186 152 Q192 186 200 190 M214 152 Q208 186 200 190" fill="none" stroke="#fff" stroke-width="2.2"/>` +
    pair(133,131,74,'a-bob','a-bob2') +
    `<circle cx="186" cy="152" r="4" fill="#fff" ${S} stroke-width="1.8"/><circle cx="214" cy="152" r="4" fill="#fff" ${S} stroke-width="1.8"/>` +
    E('📱',200,196,14) + musicNotes([[120,118],[282,110],[96,150],[306,146]]),
  sims: () => {
    const plumb = (cx, cy, d='') => `<g class="a-plumb ${d}"><polygon points="${cx},${cy-15} ${cx+9},${cy} ${cx},${cy+15} ${cx-9},${cy}" fill="#62d84e" stroke="#2e8b2e" stroke-width="2"/><polygon points="${cx},${cy-15} ${cx+9},${cy} ${cx},${cy}" fill="#9cf08c"/></g>`;
    return E('🌳',54,160,42) + E('🏡',344,158,44) +
      `<rect x="12" y="12" width="122" height="46" rx="10" fill="#fff" stroke="#cfe9c9" stroke-width="2"/><text x="22" y="29" font-size="10.5" fill="${LINE}" font-weight="600">romance</text>` +
      `<rect x="22" y="38" width="100" height="9" rx="4.5" fill="#e9f6e6"/><g class="a-bar"><rect x="22" y="38" width="100" height="9" rx="4.5" fill="#62d84e"/></g>` +
      plumb(170,104) + plumb(230,104,'d1') + pair(133,131) +
      `<g class="a-bubble"><rect x="258" y="106" width="58" height="24" rx="12" fill="#fff" ${S} stroke-width="2"/><text x="287" y="122" font-size="11" text-anchor="middle" fill="${LINE}">sul sul!</text></g>` +
      E('+♡',250,120,14,'a-float','#3fae3f') + hearts(200,112);
  },
  skating: () =>
    `<ellipse cx="200" cy="198" rx="168" ry="20" fill="#e4f6ff" stroke="#a9d8f0" stroke-width="3"/><path d="M90 196 Q140 190 180 196 M230 200 Q270 194 310 199" stroke="#fff" stroke-width="2" fill="none"/>` +
    E('✦',110,196,10,'a-twinkle','#9fd7ff') + E('✦',300,192,12,'a-twinkle d1','#9fd7ff') + E('✦',210,206,9,'a-twinkle d2','#9fd7ff') +
    `<g class="a-glide">${pair(133,124)}${E('⛸️',160,196,14)}${E('⛸️',226,196,14)}</g>` + hearts(200,108),
  cocoa: () =>
    `<rect x="292" y="96" width="82" height="106" rx="6" fill="#e8b4a0" ${S}/><rect x="306" y="132" width="54" height="70" rx="4" fill="#5a3b2c"/>` + E('🔥',333,180,26,'a-flicker') +
    bearAt('dudu',104,118,74,'a-bob') + bearAt('bubu',190,118,74,'a-bob2') +
    `<rect x="84" y="164" width="196" height="38" rx="14" fill="#f4b6c6" ${S}/>` +
    [100,130,160,190,220,250].map(x=>`<circle cx="${x+6}" cy="${178+(x%60?6:0)}" r="3" fill="#fff" opacity=".8"/>`).join('') +
    steam(164,140) + steam(224,140) + E('☕',164,158,20,'a-sip-r') + E('☕',224,158,20,'a-sip-l') + hearts(194,104),
  starbucks: () => {
    const cup = (x, y, cls) => `<g class="${cls}"><path d="M${x-8} ${y} L${x+8} ${y} L${x+6} ${y+22} L${x-6} ${y+22} Z" fill="#fff" ${S} stroke-width="2"/><rect x="${x-10}" y="${y-5}" width="20" height="6" rx="2" fill="#fff" ${S} stroke-width="2"/><circle cx="${x}" cy="${y+11}" r="4.5" fill="#00704a"/><line x1="${x+3}" y1="${y-5}" x2="${x+7}" y2="${y-17}" stroke="#00704a" stroke-width="2.5" stroke-linecap="round"/></g>`;
    const stripes = [0,1,2,3,4,5,6,7,8,9].map(i=>`<rect x="${100+i*20}" y="10" width="20" height="26" fill="${i%2?'#fff':'#00704a'}"/>`).join('');
    const scallop = [0,1,2,3,4,5,6,7,8,9].map(i=>`<circle cx="${110+i*20}" cy="36" r="10" fill="${i%2?'#fff':'#00704a'}"/>`).join('');
    return stripes + scallop + `<rect x="100" y="10" width="200" height="26" fill="none" stroke="${LINE}" stroke-width="2"/>` +
      `<rect x="138" y="54" width="124" height="24" rx="12" fill="#00704a"/><text x="200" y="70" font-size="11" text-anchor="middle" fill="#fff" font-weight="600">starbucks date ♡</text>` +
      bearAt('dudu',100,122,74,'a-lean-r') + bearAt('bubu',226,122,74,'a-lean-l') +
      `<rect x="194" y="178" width="12" height="24" fill="#d9b48a" ${S} stroke-width="2"/><ellipse cx="200" cy="176" rx="60" ry="12" fill="#f6d7b0" ${S}/>` +
      cup(176,144,'a-clink-r') + cup(224,144,'a-clink-l') + E('🥐',200,164,18) + hearts(200,108);
  },
};

// good morning / good night scenes: the two of them in bed
function bedScene(night){
  const blanket = night ? '#8f7fd6' : '#ffc9d6', head = night ? '#c9bde8' : '#f6d7b0';
  let s = `<rect x="104" y="98" width="192" height="72" rx="20" fill="${head}" ${S}/>` +
    `<rect x="96" y="150" width="208" height="52" rx="10" fill="#fff" ${S}/>` +
    `<ellipse cx="160" cy="152" rx="34" ry="12" fill="#fff" ${S} stroke-width="2"/><ellipse cx="240" cy="152" rx="34" ry="12" fill="#fff" ${S} stroke-width="2"/>`;
  s += night
    ? bearAt('dudu',124,112,74,'a-breathe','',true) + bearAt('bubu',202,112,74,'a-breathe d1','',true)
    : bearAt('dudu',124,108,74,'a-stretch') + bearAt('bubu',202,110,74,'a-bob2');
  s += `<rect x="100" y="162" width="200" height="42" rx="12" fill="${blanket}" ${S}/>` +
    [120,150,180,210,240,270].map((x,i)=>`<circle cx="${x+4}" cy="${176+(i%2)*12}" r="3.2" fill="#fff" opacity=".75"/>`).join('') +
    `<rect x="312" y="174" width="44" height="28" rx="4" fill="${head}" ${S}/>`;
  if(night){
    s += E('🧸',62,178,30) + E('🕯️',334,160,20,'a-flicker') +
      [0,1,2].map(i=>`<g class="a-float d${i}" style="--fx:${10+i*4}px"><text x="${206+i*12}" y="${118-i*10}" font-size="${12+i*4}" fill="#e9e1ff" font-weight="600">z</text></g>`).join('');
  } else {
    s += steam(334,150) + E('☕',334,164,20) + E('🌼',60,186,20) +
      E('☁️',80,40,30,'a-drift') + E('☁️',320,58,24,'a-drift d1') + E('🐦',200,40,18,'a-fly') + hearts(200,100);
  }
  return s;
}
SCENES.morning = () => bedScene(false);
SCENES.night = () => bedScene(true);
const KINDS = {
  date:    { e:'💌', name:'date invitation', openers:SETTINGS.openers.date.map(fill), placeholder:SETTINGS.placeholders.date },
  morning: { e:'☀️', name:'good morning',   openers:SETTINGS.openers.morning.map(fill), placeholder:SETTINGS.placeholders.morning },
  night:   { e:'🌙', name:'good night',     openers:SETTINGS.openers.night.map(fill), placeholder:SETTINGS.placeholders.night },
};

function spawnParticles(box, season, n){
  if(season==='night'){
    for(let i=0;i<n*1.5;i++){ const p = el('span','pt star'); const s = (1.5+Math.random()*3)+'px'; p.style.width = p.style.height = s;
      p.style.top = (Math.random()*60)+'%'; p.style.left = (Math.random()*100)+'%'; p.style.animationDelay = (-Math.random()*1.8)+'s'; box.appendChild(p); }
    box.appendChild(el('div','moon')); box.appendChild(el('div','shoot'));
    return;
  }
  if(season==='morning'){ box.appendChild(el('div','sunrise')); season = 'summer'; n = Math.round(n/2); }
  for(let i=0;i<n;i++){
    let p;
    if(season==='summer'){
      p = el('span','pt spark','✦'); p.style.top = (Math.random()*55)+'%'; p.style.fontSize = (8+Math.random()*10)+'px';
      p.style.animationDelay = (-Math.random()*1.6)+'s';
    } else {
      if(season==='winter'){ p = el('span','pt snow'); const s = (3+Math.random()*6)+'px'; p.style.width = p.style.height = s; }
      else { p = el('span','pt', season==='spring' ? '🌸' : (Math.random()<.5?'🍂':'🍁')); p.style.fontSize = (9+Math.random()*9)+'px'; p.style.opacity = .85; }
      const dur = 6+Math.random()*7; p.style.animationDuration = dur+'s'; p.style.animationDelay = (-Math.random()*dur)+'s';
      p.style.setProperty('--dx', (Math.random()*120-60)+'px'); p.style.setProperty('--rot', (Math.random()*540-270)+'deg');
    }
    p.style.left = (Math.random()*100)+'%';
    box.appendChild(p);
  }
}
function renderScene(box, season, type, mini=false){
  const daily = KINDS[type];                       // good morning / good night have their own sky
  if(daily) season = type;
  box.innerHTML = ''; box.className = 'scene s-'+season+(mini?' mini':'');
  if(season==='summer') box.appendChild(el('div','sun'));
  spawnParticles(box, season, mini ? 14 : 38);
  box.insertAdjacentHTML('beforeend', `<svg class="stage" viewBox="0 0 400 230" preserveAspectRatio="xMidYMax meet">${platform(season)}${(SCENES[type]||SCENES.none)()}</svg>`);
  if(mini) box.appendChild(el('div','label', daily ? daily.e+' '+daily.name : SEASONS[season].e+' '+SEASONS[season].name+' · '+DATES[type].e+' '+DATES[type].name));
}

/* ---------- shared data (Firebase, live for both of you) ---------- */
let messages = [], notes = [], unsubs = [];
const oops = () => toast('something went wrong, try again 🥺');
function listen(){
  stopListening();
  unsubs = [
    onSnapshot(query(collection(db,'letters'), orderBy('createdAt','desc')), snap=>{
      messages = snap.docs.map(d=>({ id:d.id, ...d.data() }));
      role==='bubu' ? renderBubu() : renderDudu();
    }, oops),
    onSnapshot(query(collection(db,'notes'), orderBy('createdAt','desc')), snap=>{
      notes = snap.docs.map(d=>({ id:d.id, ...d.data() }));
      renderBoard();
    }, oops),
  ];
}
function stopListening(){ unsubs.forEach(u=>u()); unsubs = []; }
const data = {
  addLetter:    d => addDoc(collection(db,'letters'), { ...d, createdAt: Date.now() }).catch(oops),
  answer:       (m, status) => updateDoc(doc(db,'letters',m.id), { status, answeredAt: Date.now() }).catch(oops),
  removeLetter: m => deleteDoc(doc(db,'letters',m.id)).catch(oops),
  addNote:      n => addDoc(collection(db,'notes'), { ...n, createdAt: Date.now() }).catch(oops),
  toggleNote:   n => updateDoc(doc(db,'notes',n.id), { done: !n.done }).catch(oops),
  removeNote:   n => deleteDoc(doc(db,'notes',n.id)).catch(oops),
};

/* ---------- helpers ---------- */
function el(tag, cls, text){ const e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
function fmt(iso){ return iso ? new Date(iso).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ''; }
function toast(t){ const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(e._t); e._t = setTimeout(()=>e.classList.remove('show'), 2200); }
function burst(x, y, n=18){
  for(let i=0;i<n;i++){
    const h = el('span','burst','♥'); const a = Math.random()*Math.PI*2, d = 60+Math.random()*110;
    h.style.left = x+'px'; h.style.top = y+'px'; h.style.fontSize = (12+Math.random()*18)+'px';
    h.style.setProperty('--dx', Math.cos(a)*d+'px'); h.style.setProperty('--dy', Math.sin(a)*d-40+'px'); h.style.setProperty('--rot', (Math.random()*90-45)+'deg');
    document.body.appendChild(h); setTimeout(()=>h.remove(), 1000);
  }
}
function floatHeart(parent){
  const h = el('span','float','♥'); h.style.left = Math.random()*100+'vw'; h.style.fontSize = (10+Math.random()*24)+'px';
  h.style.setProperty('--o', (.3+Math.random()*.5).toFixed(2)); h.style.setProperty('--dx', (Math.random()*120-60)+'px'); h.style.setProperty('--rot', (Math.random()*80-40)+'deg');
  h.style.animationDuration = (6+Math.random()*6)+'s'; parent.appendChild(h); setTimeout(()=>h.remove(), 12500);
}
const graphemes = s => (window.Intl && Intl.Segmenter) ? [...new Intl.Segmenter().segment(s)].map(x=>x.segment) : [...s];

/* plays text in a style; returns ms when it finishes */
const STEP = { hey:55, date:150, ink:40, surprise:24 };
function playText(target, text, style, start){
  target.innerHTML = '';
  const units = style==='date' ? text.split(/\s+/).length : graphemes(text).length;
  const step = Math.min(STEP[style], 3200/Math.max(units,1));
  let t = start;
  text.split(/(\s+)/).forEach(part=>{
    if(!part) return;
    if(/^\s+$/.test(part)){ target.appendChild(document.createTextNode(part)); return; }
    const w = el('span','w');
    if(style==='date'){ w.classList.add('u'); w.textContent = part; w.style.animationDelay = t+'ms'; t += step; }
    else graphemes(part).forEach(ch=>{ const s = el('span','u',ch); s.style.animationDelay = t+'ms'; w.appendChild(s); t += step; });
    target.appendChild(w);
  });
  return t;
}

/* ---------- login ---------- */
let floatTimer, viaForm = false;
function startLogin(){
  $('#login').hidden = false; $('#app').style.display = 'none';
  $('#pwStage').classList.remove('unlocking');
  $('#pw').value = ''; $('#err').textContent = ''; setTimeout(()=>$('#pw').focus(), 50);
  clearInterval(floatTimer);
}
$('#pwForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const typed = $('#pw').value.replace(/\D/g,'');
  if(typed.length !== CODE_LENGTH) return;
  const btn = $('#pwForm button'); btn.disabled = true;
  viaForm = true;
  let ok = false, tooMany = false;
  // the password decides who you are: try her account, then yours
  for(const account of [SETTINGS.herAccount, SETTINGS.myAccount]){
    try{ await signInWithEmailAndPassword(auth, account, typed); ok = true; break; }
    catch(err){ if(err.code==='auth/too-many-requests'){ tooMany = true; break; } }
  }
  btn.disabled = false;
  if(!ok){
    viaForm = false;
    const c = $('#pwForm'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
    $('#err').textContent = tooMany ? 'too many tries, wait a minute 🥺' : T('wrongPassword'); $('#pw').value = ''; $('#pw').focus();
  }
});
// digits only, and log in as soon as the 6th digit is typed
$('#pw').addEventListener('input', ()=>{
  const pw = $('#pw'); pw.value = pw.value.replace(/\D/g,'').slice(0, CODE_LENGTH);
  if(pw.value.length === CODE_LENGTH) $('#pwForm').requestSubmit();
});
// stays signed in on that phone/computer until "lock" is pressed
onAuthStateChanged(auth, user=>{
  document.body.classList.remove('booting');
  if(!user){ stopListening(); startLogin(); return; }
  const r = user.email.toLowerCase()===SETTINGS.herAccount.toLowerCase() ? 'bubu' : 'dudu';
  const show = ()=>{ $('#login').hidden = true; $('#app').style.display = 'block'; enterApp(r); listen(); };
  if(viaForm){ viaForm = false; $('#pwStage').classList.add('unlocking'); setTimeout(show, 950); } else show();
});

/* ---------- app ---------- */
let role = 'bubu';
function enterApp(r){
  role = r;
  $('#bubuView').hidden = r!=='bubu'; $('#duduView').hidden = r!=='dudu';
  $('#whoLabel').textContent = 'signed in as '+NAME[r];
  r==='bubu' ? renderBubu() : renderDudu(); renderBoard(); window.scrollTo(0,0);
}
$('#logout').onclick = ()=>signOut(auth);

/* ----- bubu: envelopes ----- */
function renderBubu(){
  const pending = messages.filter(m=>m.status==='pending');
  const zone = $('#envZone'); zone.innerHTML = '';
  if(!pending.length){
    const e = el('div','empty'); e.appendChild(bearEl('dudu','b wiggle')); e.appendChild(el('div',null,T('noLetters')));
    zone.appendChild(e);
  } else {
    const m = pending[0];
    const env = el('div','env'); env.setAttribute('role','button'); env.setAttribute('aria-label','Open letter');
    env.innerHTML = '<div class="env-back"></div><div class="env-letter"></div><div class="env-front"></div><div class="env-flap"></div><div class="env-seal">♥</div>';
    env.querySelector('.env-letter').textContent = T(m.kind==='morning' ? 'envelopeMorning' : m.kind==='night' ? 'envelopeNight' : 'envelopeDate');
    env.onclick = ()=>{ if(env.classList.contains('open')) return; env.classList.add('open'); setTimeout(()=>openLetter(m,'answer'), 1100); };
    zone.appendChild(env);
    zone.appendChild(el('div','tiny',T('tapToOpen')));
    if(pending.length > 1) zone.appendChild(el('div','count', pending.length+' letters waiting'));
  }
  const hist = $('#bubuHistory'); hist.innerHTML = '';
  const done = messages.filter(m=>m.status!=='pending');
  if(!done.length) hist.appendChild(el('div','empty','your answered letters will live here'));
  done.forEach(m=>hist.appendChild(row(m, false)));
}

/* ----- the letter ----- */
let timers = [], heartTimer, letterMode = null;
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
function closeLetter(){
  timers.forEach(clearTimeout); timers = []; clearInterval(heartTimer);
  $('#overlay').classList.remove('show'); letterMode = null;
  setTimeout(()=>{ if(!letterMode){ $('#overlay').classList.remove('has-scene'); $('#sceneBox').innerHTML = ''; } }, 400);
  role==='bubu' ? renderBubu() : renderDudu();
}
$('#closeLetter').onclick = closeLetter;
$('#overlay').addEventListener('click', e=>{ if(e.target.id==='overlay' && letterMode!=='answer') closeLetter(); });

function openLetter(m, mode){
  timers.forEach(clearTimeout); timers = []; clearInterval(heartTimer);
  const paper = $('#paper'), ans = $('#lAnswer'), when = $('#lWhen');
  paper.className = 'paper fx-'+m.style;
  $('#lHl').innerHTML = ''; $('#lBody').innerHTML = ''; ans.innerHTML = ''; ans.className = 'answer';
  when.className = 'when'; when.textContent = m.when ? '📅 '+fmt(m.when) : ''; when.hidden = !m.when;
  letterMode = mode;
  $('#closeLetter').hidden = mode==='answer';          // she has to answer first
  const themed = m.type && m.type!=='none';
  $('#overlay').classList.toggle('has-scene', themed);
  if(themed) renderScene($('#sceneBox'), m.season || 'spring', m.type); else $('#sceneBox').innerHTML = '';
  $('#overlay').classList.add('show');

  if(m.style==='surprise') later(()=>{ const r = paper.getBoundingClientRect(); burst(r.left+r.width/2, r.top+r.height/2, 34); }, 450);
  if(m.style==='date'){ heartTimer = setInterval(()=>floatHeart($('#overlay')), 260); later(()=>clearInterval(heartTimer), 4500); }

  const t1 = playText($('#lHl'), m.headline || '', m.style, 550);
  const t2 = playText($('#lBody'), m.text, m.style, t1+400);
  if(m.style==='hey') later(()=>$('#lBody').appendChild(el('span','caret')), t2);
  later(()=>when.classList.add('in'), t2+200);
  later(()=>{ buildAnswer(m, mode); ans.classList.add('in'); }, t2+500);
}

function buildAnswer(m, mode){
  const ans = $('#lAnswer');
  if(mode==='replay'){
    const y = el('div','yay'); const p = el('div','pair'); p.append(bearEl('dudu'), bearEl('bubu')); y.appendChild(p);
    y.appendChild(el('div',null, m.status==='accepted' ? 'you said yes ♡' : m.status==='declined' ? 'maybe another time' : m.status==='hearted' ? 'you sent a ♡ back' : 'waiting for her answer…'));
    ans.appendChild(y); return;
  }
  // good morning / good night: one button to send a heart back
  if(m.kind==='morning' || m.kind==='night'){
    const night = m.kind==='night';
    const back = el('button','btn', T(night ? 'nightReply' : 'morningReply'));
    ans.appendChild(back);
    back.onclick = e=>{
      back.disabled = true; burst(e.clientX, e.clientY, 26);
      if(mode!=='preview') data.answer(m, 'hearted');
      later(()=>{
        ans.innerHTML = ''; const y = el('div','yay happy'); y.appendChild(bearEl('dudu'));
        y.appendChild(el('div',null, T(night ? 'nightAfter' : 'morningAfter'))); ans.appendChild(y);
      }, 500);
      later(closeLetter, 3200);
    };
    return;
  }
  const yes = el('button','btn',T('yesButton'));
  const no = el('button','btn ghost',T('noButton'));
  ans.append(yes, no);
  // YES: "yeah!!", hearts all over the screen, very happy dudu
  yes.onclick = ()=>{
    if(yes.disabled) return;
    yes.disabled = no.disabled = true;
    yes.textContent = T('yesClicked'); yes.classList.add('yeah');
    heartRain();
    if(mode!=='preview') data.answer(m, 'accepted');
    later(()=>{
      ans.innerHTML = '';
      const y = el('div','yay happy'); y.appendChild(bearEl('dudu'));
      y.appendChild(el('div',null,T('yesHappy'))); ans.appendChild(y);
    }, 700);
    later(closeLetter, 4200);
  };

  // NO: 1st "try again", 2nd + 3rd it jumps somewhere else on the screen, 4th gives up
  let presses = 0;
  no.onclick = ()=>{
    presses++;
    if(presses===1){ no.textContent = T('noTryAgain'); yes.classList.add('bigger'); return; }
    if(presses<=3){ jumpAway(no, yes); return; }
    no.remove(); yes.disabled = true;
    if(mode!=='preview') data.answer(m, 'declined');
    ans.innerHTML = '';
    const y = el('div','yay sad'); y.appendChild(bearEl('dudu'));
    y.appendChild(el('div',null,T('noGiveUp'))); ans.appendChild(y);
    later(closeLetter, 3000);
  };
}

/* moves the no-button to a random spot on the screen that isn't on top of yes */
function jumpAway(btn, avoid){
  const r = btn.getBoundingClientRect(), a = avoid.getBoundingClientRect(), pad = 20;
  if(!btn.classList.contains('loose')){            // lift it out of the letter, from where it is now
    btn.classList.add('loose'); btn.style.left = r.left+'px'; btn.style.top = r.top+'px'; void btn.offsetWidth;
  }
  let x, y;
  for(let k=0;k<40;k++){
    x = 12 + Math.random()*(innerWidth - r.width - 24);
    y = 12 + Math.random()*(innerHeight - r.height - 24);
    const farFromOld = Math.hypot(x-r.left, y-r.top) > 140;
    const clearOfYes = x+r.width+pad < a.left || x > a.right+pad || y+r.height+pad < a.top || y > a.bottom+pad;
    if(farFromOld && clearOfYes) break;
  }
  btn.style.left = x+'px'; btn.style.top = y+'px';
}

/* small hearts popping up all over the screen */
function heartRain(n=90){
  const colors = ['#ec7f9c','#f7a8bc','#e85d86','#ffc2d1','#c86fd0'];
  for(let i=0;i<n;i++){
    const h = el('span','rain','♥');
    h.style.left = Math.random()*100+'vw'; h.style.top = Math.random()*100+'vh';
    h.style.fontSize = (10+Math.random()*16)+'px'; h.style.color = colors[i % colors.length];
    h.style.animationDelay = (Math.random()*1400)+'ms';
    document.body.appendChild(h); setTimeout(()=>h.remove(), 4000);
  }
}

function row(m, removable){
  const r = el('div','row'); r.tabIndex = 0;
  const left = el('div'); left.style.minWidth = 0;
  const icon = KINDS[m.type] && m.type!=='date' ? KINDS[m.type].e
    : (m.type && m.type!=='none') ? SEASONS[m.season||'spring'].e+DATES[m.type].e : (STYLES[m.style]?.e || '💌');
  left.appendChild(el('div','t', icon+'  '+(m.headline || 'Letter')));
  left.appendChild(el('div','s', m.text));
  if(m.when) left.appendChild(el('div','d', fmt(m.when)));
  const right = el('div'); right.style.cssText = 'display:flex;align-items:center;gap:4px';
  right.appendChild(el('span','badge '+m.status, {pending:'waiting',accepted:'yes ♡',declined:'no',hearted:'♡ back'}[m.status]));
  if(removable){ const x = el('button','rm','×'); x.title = 'Remove'; x.onclick = e=>{ e.stopPropagation(); if(confirm('Remove this letter?')) data.removeLetter(m); }; right.appendChild(x); }
  r.append(left, right);
  r.onclick = ()=>openLetter(m,'replay');
  r.onkeydown = e=>{ if(e.key==='Enter') openLetter(m,'replay'); };
  return r;
}

/* ----- dudu: compose ----- */
let pickedStyle = 'date', pickedKind = 'date';
// what kind of letter: date invitation / good morning / good night
Object.entries(KINDS).forEach(([k,v])=>{
  const b = el('button','kind'); b.type = 'button'; b.dataset.k = k;
  b.append(el('span','e',v.e), document.createTextNode(v.name));
  b.onclick = ()=>setKind(k); $('#kindChips').appendChild(b);
});
function setKind(k){
  pickedKind = k; const v = KINDS[k];
  mark($('#kindChips'), k);
  $('#hlChips').innerHTML = '';
  v.openers.forEach(o=>{ const c = el('button','chip',o); c.type = 'button'; c.onclick = ()=>{ $('#hlInput').value = o; autoPick(); }; $('#hlChips').appendChild(c); });
  $('#hlInput').value = v.openers[0]; $('#msgText').placeholder = v.placeholder;
  $('#dateOnly').hidden = k!=='date';
  if(k!=='date') pickStyle(k==='night' ? 'ink' : 'hey'); else pickStyle('date');
  autoPick();
}
function pickStyle(k){ pickedStyle = k; [...$('#styles').children].forEach(x=>x.classList.toggle('on', x.dataset.k===k)); }
Object.entries(STYLES).forEach(([k,s])=>{
  const b = el('button','style'+(k===pickedStyle?' on':'')); b.type = 'button'; b.dataset.k = k;
  b.append(el('div','e',s.e), el('b',null,s.name), el('small',null,s.desc));
  b.onclick = ()=>pickStyle(k);
  $('#styles').appendChild(b);
});
// season + date type: auto-picked from the message, until you pick one yourself
let pickedSeason = seasonOf(new Date()), pickedType = 'none', seasonManual = false, typeManual = false;
function chipRow(box, table, onPick){
  Object.entries(table).forEach(([k,v])=>{
    const c = el('button','chip',v.e+' '+v.name); c.type = 'button'; c.dataset.k = k;
    c.onclick = ()=>onPick(k); box.appendChild(c);
  });
}
const mark = (box, k) => [...box.children].forEach(c=>c.classList.toggle('on', c.dataset.k===k));
chipRow($('#seasonChips'), SEASONS, k=>{ seasonManual = true; pickedSeason = k; autoPick(); });
chipRow($('#typeChips'), DATES, k=>{ typeManual = true; pickedType = k; autoPick(); });
let miniT;
function autoPick(){
  if(pickedKind!=='date'){ clearTimeout(miniT); miniT = setTimeout(()=>renderScene($('#miniScene'), pickedKind, pickedKind, true), 150); return; }
  const txt = $('#hlInput').value+' '+$('#msgText').value;
  const found = [];
  if(!typeManual){ const t = firstHit(txt, TYPE_WORDS); pickedType = t || 'none'; if(t) found.push('date'); }
  if(!seasonManual){
    const s = firstHit(txt, SEASON_WORDS);
    if(s){ pickedSeason = s; found.push('season'); }
    else { const w = $('#msgWhen').value; pickedSeason = seasonOf(w ? new Date(w) : new Date()); }
  }
  mark($('#seasonChips'), pickedSeason); mark($('#typeChips'), pickedType);
  $('#autoNote').textContent = found.length ? '✨ '+found.join(' & ')+' picked from your message' : '';
  clearTimeout(miniT); miniT = setTimeout(()=>renderScene($('#miniScene'), pickedSeason, pickedType, true), 250);
}
['#hlInput','#msgText','#msgWhen'].forEach(s=>$(s).addEventListener('input', autoPick));
setKind('date');

function draft(){
  const w = pickedKind==='date' ? $('#msgWhen').value : '';
  return { id:Date.now(), kind:pickedKind, headline:$('#hlInput').value.trim(), text:$('#msgText').value.trim(), when: w ? new Date(w).toISOString() : '', style:pickedStyle,
           season:pickedSeason, type: pickedKind==='date' ? pickedType : pickedKind, status:'pending' };
}
$('#previewBtn').onclick = ()=>{ const d = draft(); if(!d.text) d.text = $('#msgText').placeholder; openLetter(d,'preview'); };
$('#sendBtn').onclick = e=>{
  const d = draft(); if(!d.text){ $('#msgText').focus(); toast('write her a little message first ♡'); return; }
  delete d.id; data.addLetter(d); burst(e.clientX, e.clientY, 16); toast(T('sent'));
  $('#msgText').value = ''; $('#msgWhen').value = ''; seasonManual = typeManual = false; setKind(pickedKind); renderDudu();
};
function renderDudu(){
  const list = $('#sentList'); list.innerHTML = '';
  if(!messages.length) list.appendChild(el('div','empty','no letters sent yet'));
  messages.forEach(m=>list.appendChild(row(m, true)));
}

/* ---------- shared board ---------- */
const COLORS = { yellow:'#fff0b3', pink:'#ffd1dd', mint:'#cdf2df', lav:'#e3d8ff', peach:'#ffdcc4' };
let filter = 'all', newType = 'plan', newColor = 'pink';
Object.entries(COLORS).forEach(([k,v])=>{
  const s = el('button','sw'+(k===newColor?' on':'')); s.type = 'button'; s.style.background = v; s.title = k;
  s.onclick = ()=>{ newColor = k; document.querySelectorAll('.sw').forEach(x=>x.classList.toggle('on', x===s)); };
  $('#swatches').appendChild(s);
});
$('#filter').onclick = e=>{ const b = e.target.closest('button'); if(!b) return; filter = b.dataset.f; [...$('#filter').children].forEach(x=>x.classList.toggle('on', x===b)); renderBoard(); };
$('#noteType').onclick = e=>{ const b = e.target.closest('button'); if(!b) return; newType = b.dataset.t; [...$('#noteType').children].forEach(x=>x.classList.toggle('on', x===b)); };
$('#noteForm').addEventListener('submit', e=>{
  e.preventDefault(); const text = $('#noteText').value.trim(); if(!text) return;
  data.addNote({ text, type:newType, color:newColor, author:role, done:false, r:+(Math.random()*6-3).toFixed(1) });
  $('#noteText').value = '';
});
const seenNotes = new Set();   // only new post-its pop in, not the whole board on every change
function renderBoard(){
  const wrap = $('#notes'); wrap.innerHTML = '';
  const shown = notes.filter(n=>filter==='all' || n.type===filter);
  if(!shown.length){ wrap.appendChild(el('div','empty','no post-its here yet, stick the first one ♡')); return; }
  shown.forEach(n=>{
    const d = el('div','note c-'+n.color+(n.done?' done':'')+(seenNotes.has(n.id)?'':' new')); d.style.setProperty('--r', n.r+'deg');
    seenNotes.add(n.id);
    d.appendChild(el('div','txt',n.text));
    const meta = el('div','meta'); const tag = el('span','tag');
    tag.append(bearEl(n.author,'b',true),document.createTextNode((n.type==='goal'?'goal':'plan')+' · '+NAME[n.author]));
    meta.appendChild(tag);
    const ctrl = el('div','ctrl');
    if(n.type==='goal'){ const c = el('button',null,n.done?'↺':'✓'); c.title = n.done?'Undo':'Mark done'; c.onclick = ev=>{ if(!n.done) burst(ev.clientX, ev.clientY, 12); data.toggleNote(n); }; ctrl.appendChild(c); }
    const x = el('button',null,'×'); x.title = 'Remove'; x.onclick = ()=>{ if(confirm('Remove this post-it?')) data.removeNote(n); }; ctrl.appendChild(x);
    meta.appendChild(ctrl); d.appendChild(meta); wrap.appendChild(d);
  });
}

// put the texts from SETTINGS on the page
document.title = T('siteTitle');
document.querySelectorAll('[data-text]').forEach(n=>{ n.textContent = T(n.dataset.text); });
paintBears();

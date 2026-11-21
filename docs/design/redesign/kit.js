
/* ============================================================
   THEMES — copied from apps/mobile/src/design-system/theme/themes.ts
   ============================================================ */
const FAM_LIGHT={sky:["#98C1E9","#E7F5F9","#1D5A8C"],butter:["#FED57D","#FDF1D3","#876029"],tomato:["#EF6F3C","#FCE3D9","#C62A29"],pink:["#F29CC3","#FCEDED","#6D1F42"],purple:["#D3B6D3","#E6E3F7","#5E4394"],orange:["#F0A351","#FDE6CC","#8A4700"],green:["#5BA881","#E4F1DC","#25533F"],teal:["#008471","#D6EEE9","#006B5C"]};
const FAM_DARK={sky:["#98C1E9","#1F2D39","#A9CDEF"],butter:["#FED57D","#352B1B","#FED57D"],tomato:["#EF6F3C","#3B231C","#F5A58F"],pink:["#F29CC3","#3B2631","#F4AECD"],purple:["#D3B6D3","#2C2540","#D8C6F0"],orange:["#F0A351","#3B2B1B","#F3B26A"],green:["#5BA881","#1D3327","#8FD1AE"],teal:["#008471","#16302C","#5FD1BD"]};
const T={
 postcard:{label:"Ink & butter",
  light:{canvas:"#FCF9F2",paper:"#FFFEFA",sunken:"#F0EDE5",line:"#DDDCD5","line-strong":"#7B8796",ink:"#202B3B","ink-secondary":"#465365","ink-tertiary":"#596477","on-ink":"#FFFEFA",shadow:"#202B3B",scrim:"rgba(20,28,39,.4)",action:"#244B82","on-action":"#FFFEFA","action-soft":"#E1EAF5","on-action-soft":"#244B82",highlight:"#F2CD70","highlight-ink":"#202B3B","identity-you":"#244B82","identity-partner":"#865419",kraft:"#E9D8BC"},
  dark:{canvas:"#141C27",paper:"#1D2836",sunken:"#263342",line:"#394756","line-strong":"#74859A",ink:"#F7F5ED","ink-secondary":"#D0D9E3","ink-tertiary":"#B6C2CF","on-ink":"#141C27",shadow:"#000000",scrim:"rgba(0,0,0,.55)",action:"#A9C8F0","on-action":"#141C27","action-soft":"#263D5B","on-action-soft":"#C4DAF7",highlight:"#F2CD70","highlight-ink":"#202B3B","identity-you":"#A9C8F0","identity-partner":"#F2CD70",kraft:"#4A3E2E"}},
 rose:{label:"Rosewater",
  light:{canvas:"#FFF6F5",paper:"#FFFCFA",sunken:"#F4E7E5",line:"#E4CFCE","line-strong":"#986877",ink:"#35242B","ink-secondary":"#624A53","ink-tertiary":"#765D67","on-ink":"#FFFCFA",shadow:"#35242B",scrim:"rgba(53,36,43,.4)",action:"#A13E64","on-action":"#FFFCFA","action-soft":"#F8E0E8","on-action-soft":"#8C3054",highlight:"#F4B8C6","highlight-ink":"#35242B","identity-you":"#8C3054","identity-partner":"#315F76",kraft:"#E9D8BC"},
  dark:{canvas:"#25191F",paper:"#33232B",sunken:"#402E37",line:"#56404B","line-strong":"#A17A8D",ink:"#FFF0F2","ink-secondary":"#E9CCD4","ink-tertiary":"#D3B1BE","on-ink":"#25191F",shadow:"#000000",scrim:"rgba(0,0,0,.55)",action:"#F3B0C9","on-action":"#351725","action-soft":"#542A3C","on-action-soft":"#F8C5D8",highlight:"#F4B8C6","highlight-ink":"#35242B","identity-you":"#F3B0C9","identity-partner":"#A9CFDF",kraft:"#4A3A33"}},
 garden:{label:"Evergreen",
  light:{canvas:"#F7F8F0",paper:"#FEFFF8",sunken:"#EAEFE3",line:"#D6DED1","line-strong":"#72866F",ink:"#26342B","ink-secondary":"#455A4B","ink-tertiary":"#5C6C60","on-ink":"#FEFFF8",shadow:"#26342B",scrim:"rgba(38,52,43,.4)",action:"#235D4F","on-action":"#FEFFF8","action-soft":"#DEEBDD","on-action-soft":"#235D4F",highlight:"#DDE79D","highlight-ink":"#26342B","identity-you":"#235D4F","identity-partner":"#865419",kraft:"#E9D8BC"},
  dark:{canvas:"#151F1A",paper:"#202E26",sunken:"#2A3B30",line:"#3C5042","line-strong":"#7E9A85",ink:"#F6F5E9","ink-secondary":"#D1DED0","ink-tertiary":"#B6C7BA","on-ink":"#151F1A",shadow:"#000000",scrim:"rgba(0,0,0,.55)",action:"#B6DCC5","on-action":"#151F1A","action-soft":"#2B4939","on-action-soft":"#C9E6D4",highlight:"#DDE79D","highlight-ink":"#26342B","identity-you":"#B6DCC5","identity-partner":"#EAD496",kraft:"#3D3F2E"}},
 sunroom:{label:"Apricot",
  light:{canvas:"#FFF7EF",paper:"#FFFDFA",sunken:"#F5E8DA",line:"#E0D3C6","line-strong":"#8E745F",ink:"#342921","ink-secondary":"#604A3B","ink-tertiary":"#766356","on-ink":"#FFFDFA",shadow:"#342921",scrim:"rgba(52,41,33,.4)",action:"#A4472C","on-action":"#FFFDFA","action-soft":"#F5DFD0","on-action-soft":"#8A3C25",highlight:"#F2C784","highlight-ink":"#342921","identity-you":"#8A3C25","identity-partner":"#315F76",kraft:"#E9D8BC"},
  dark:{canvas:"#241B17",paper:"#30231C",sunken:"#3D2F25",line:"#594338","line-strong":"#A88B74",ink:"#FFF2E8","ink-secondary":"#E9D1BE","ink-tertiary":"#D3BAA7","on-ink":"#241B17",shadow:"#000000",scrim:"rgba(0,0,0,.55)",action:"#F0AB8B","on-action":"#241B17","action-soft":"#563322","on-action-soft":"#F7C1A8",highlight:"#F2C784","highlight-ink":"#342921","identity-you":"#F0AB8B","identity-partner":"#A9CFDF",kraft:"#4A3626"}}
};
let cur={id:"postcard",mode:"light"};
function applyTheme(){
  const t=T[cur.id][cur.mode], fam=cur.mode==="dark"?FAM_DARK:FAM_LIGHT, r=document.documentElement.style;
  for(const k in t) r.setProperty("--"+k,t[k]);
  for(const f in fam){r.setProperty(`--${f}-base`,fam[f][0]);r.setProperty(`--${f}-soft`,fam[f][1]);r.setProperty(`--${f}-deep`,fam[f][2]);}
  document.querySelectorAll(".sw").forEach(b=>b.setAttribute("aria-pressed",b.dataset.id===cur.id));
  const mb=document.getElementById("mode"); if(mb) mb.textContent=cur.mode==="dark"?"Dark":"Light";
}

/* ============================================================
   ILLUSTRATION KIT — clean shapes + one shade crescent (DESIGN §8)
   ============================================================ */
const ART=FAM_LIGHT, INK="#1D1A17", PAPER="#FFFDF8";
let _id=0; const uid=()=>"s"+(++_id);
function mix(a,b,t){const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const A=p(a),B=p(b);return"#"+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,"0")).join("")}
const shadeOf=f=>mix(f,INK,.13);
function soft(shape,fill,hl=true,hx=0,hy=0){const id=uid();return`<defs><clipPath id="${id}">${shape}</clipPath></defs><g fill="${shadeOf(fill)}">${shape}</g><g clip-path="url(#${id})"><g fill="${fill}" transform="translate(-3 -3.5)">${shape}</g></g>${hl?`<ellipse cx="${hx}" cy="${hy}" rx="7" ry="4.5" fill="${PAPER}" opacity=".38" transform="rotate(-30 ${hx} ${hy})"/>`:""}`}
function face(cx,cy,kind="open",col=INK,s=1){
  const e=11*s, y=cy;
  let eyes = kind==="closed"||kind==="sleepy"
    ? `<path d="M${cx-e-4} ${y} q4 3.5 8 0 M${cx+e-4} ${y} q4 3.5 8 0" stroke="${col}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    : kind==="happy" ? `<path d="M${cx-e-4} ${y+1} q4 -5 8 0 M${cx+e-4} ${y+1} q4 -5 8 0" stroke="${col}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="${cx-e}" cy="${y}" rx="${3.2*s}" ry="${4.2*s}" fill="${col}"/><ellipse cx="${cx+e}" cy="${y}" rx="${3.2*s}" ry="${4.2*s}" fill="${col}"/><circle cx="${cx-e+1}" cy="${y-1.6}" r="1.1" fill="${PAPER}"/><circle cx="${cx+e+1}" cy="${y-1.6}" r="1.1" fill="${PAPER}"/>`;
  const m = kind==="sad"?`<path d="M${cx-5} ${y+12} q5 -4 10 0" stroke="${col}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    : kind==="flat"?`<path d="M${cx-4} ${y+11} h8" stroke="${col}" stroke-width="2.4" stroke-linecap="round"/>`
    : `<path d="M${cx-5} ${y+9} q5 5 10 0" stroke="${col}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  const ch = col===INK?`<circle cx="${cx-e-6}" cy="${y+8}" r="4" fill="#F29CC3" opacity=".55"/><circle cx="${cx+e+6}" cy="${y+8}" r="4" fill="#F29CC3" opacity=".55"/>`:"";
  return eyes+m+ch;
}
function starPts(cx,cy,n,ro,ri){let p=[];for(let i=0;i<n*2;i++){const r=i%2?ri:ro,a=Math.PI*i/n-Math.PI/2;p.push((cx+r*Math.cos(a)).toFixed(1)+","+(cy+r*Math.sin(a)).toFixed(1))}return p.join(" ")}
const MOODS={
 joyful:{label:"Joyful",fam:"butter"},calm:{label:"Calm",fam:"sky"},excited:{label:"Excited",fam:"orange"},grateful:{label:"Grateful",fam:"pink"},
 connected:{label:"Connected",fam:"tomato"},tired:{label:"Tired",fam:"tired"},sensitive:{label:"Sensitive",fam:"purple"},confused:{label:"Confused",fam:"purple"},
 stressed:{label:"Stressed",fam:"teal"},insecure:{label:"Insecure",fam:"sky"},hurt:{label:"Hurt",fam:"pink"},angry:{label:"Angry",fam:"tomato"}};
function mood(k,size=88){
  let s="";
  if(k==="joyful"){let rays="";for(let i=0;i<8;i++)rays+=`<rect x="47" y="6" width="6" height="14" rx="3" fill="${ART.butter[0]}" transform="rotate(${i*45} 50 50)"/>`;s=rays+soft(`<circle cx="50" cy="52" r="28"/>`,ART.butter[0],true,38,38)+face(50,50,"happy")}
  else if(k==="calm")s=soft(`<ellipse cx="50" cy="56" rx="38" ry="26"/>`,ART.sky[0],true,30,44)+face(50,54,"closed");
  else if(k==="excited")s=soft(`<polygon points="${starPts(50,52,8,40,27)}" stroke-linejoin="round"/>`,ART.orange[0],true,36,36)+face(50,50,"open");
  else if(k==="grateful")s=soft(`<path d="M16 44 h68 a34 34 0 0 1 -68 0z"/>`,ART.pink[0],true,30,52)+face(50,54,"closed");
  else if(k==="connected")s=soft(`<circle cx="38" cy="54" r="24"/><circle cx="62" cy="54" r="24"/>`,ART.tomato[0],true,26,42)+face(50,52,"happy");
  else if(k==="tired")s=soft(`<path d="M14 66 a36 36 0 0 1 72 0 q0 8 -6 8 q-6 0 -6 8 a5 5 0 0 1 -10 0 v-4 q0 -4 -4 -4 h-34 q-12 0 -12 -8z"/>`,"#E5DCCC",true,30,46)+face(50,58,"sleepy");
  else if(k==="sensitive")s=soft(`<circle cx="50" cy="32" r="19"/><circle cx="50" cy="70" r="19"/><circle cx="31" cy="51" r="19"/><circle cx="69" cy="51" r="19"/>`,ART.purple[0],true,34,36)+face(50,50,"open");
  else if(k==="confused")s=soft(`<circle cx="50" cy="52" r="32"/>`,ART.purple[1],true,36,38)+face(50,52,"flat")+`<path d="M34 37 q6 -5 12 -1" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  else if(k==="stressed")s=soft(`<polygon points="${starPts(50,52,12,38,32)}"/>`,ART.teal[0],false)+face(50,50,"open",PAPER)+"";
  else if(k==="insecure")s=`<rect x="10" y="62" width="80" height="4" rx="2" fill="${INK}" opacity=".18"/>`+soft(`<ellipse cx="54" cy="58" rx="24" ry="20"/>`,ART.sky[1],true,44,48)+face(54,54,"open",INK,.8)+`<rect x="8" y="64" width="84" height="26" fill="var(--canvas)" opacity="0"/>`;
  else if(k==="hurt")s=soft(`<ellipse cx="50" cy="54" rx="34" ry="30"/>`,ART.pink[1],true,34,40)+face(50,52,"sad")+`<rect x="58" y="30" width="22" height="9" rx="4" fill="${ART.butter[0]}" transform="rotate(-25 69 34)"/>`;
  else if(k==="angry")s=soft(`<path d="M50 14 Q54 14 57 19 L86 72 Q89 80 80 80 H20 Q11 80 14 72 L43 19 Q46 14 50 14z"/>`,ART.tomato[0],true,40,40)+face(50,58,"flat")+`<path d="M34 49 l10 4 M66 49 l-10 4" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${MOODS[k].label}">${s}</svg>`;
}
const B=ART.butter[0], O=ART.orange[0];
function pet({size=140,mood:m="content",note=false,bowl=false}={}){
  const ear=(x,flip)=>`<g transform="translate(${x} 30) scale(${flip?-1:1} 1) rotate(${flip?-18:-18})">${soft(`<path d="M0 0 C-12 4 -16 26 -5 34 C4 39 12 28 9 14 C7 5 4 0 0 0z"/>`,O,false)}</g>`;
  const ek = m==="sleepy"?"sleepy":m==="happy"?"happy":"open";
  const zs = m==="sleepy"?`<text x="98" y="26" font-family="Fraunces" font-weight="600" font-size="16" fill="${INK}" opacity=".55">z</text><text x="108" y="14" font-family="Fraunces" font-weight="600" font-size="11" fill="${INK}" opacity=".4">z</text>`:"";
  const env = note?`<g transform="translate(44 82) rotate(-6)"><rect width="34" height="22" rx="2" fill="${PAPER}"/><path d="M0 1 L17 12 L34 1" stroke="#E5DCCC" stroke-width="2" fill="none"/><circle cx="17" cy="12" r="4.5" fill="#C62A29"/></g>`:"";
  const bw = bowl?`<g transform="translate(96 88)"><path d="M0 0 h24 a12 9 0 0 1 -24 0z" fill="${ART.sky[0]}"/><circle cx="8" cy="-2" r="3" fill="#8A4700"/><circle cx="15" cy="-3" r="3" fill="#8A4700"/></g>`:"";
  return `<svg width="${size}" height="${size*0.86}" viewBox="0 0 130 112" role="img" aria-label="Mochi, ${m}">
   <path d="M98 74 q16 -2 12 -18" stroke="${shadeOf(B)}" stroke-width="8" fill="none" stroke-linecap="round"/>
   ${ear(32,false)}${ear(92,true)}
   <ellipse cx="46" cy="101" rx="10" ry="5.5" fill="${shadeOf(B)}"/><ellipse cx="78" cy="101" rx="10" ry="5.5" fill="${shadeOf(B)}"/>
   ${soft(`<path d="M62 30 C92 30 108 50 108 70 C108 90 90 100 62 100 C34 100 16 90 16 70 C16 50 32 30 62 30z"/>`,B,true,38,48)}
   ${face(62,64,ek)}
   <ellipse cx="62" cy="70" rx="4.5" ry="3.2" fill="${INK}"/>
   ${zs}${env}${bw}</svg>`;
}
function egg(size=110){return `<svg width="${size}" height="${size*1.15}" viewBox="0 0 100 115">${soft(`<path d="M50 6 C76 6 90 48 90 72 C90 96 72 110 50 110 C28 110 10 96 10 72 C10 48 24 6 50 6z"/>`,ART.butter[1],true,34,34)}<circle cx="40" cy="58" r="4" fill="${ART.sky[0]}"/><circle cx="62" cy="44" r="3" fill="${ART.pink[0]}"/><circle cx="64" cy="78" r="4.5" fill="${ART.butter[0]}"/><circle cx="34" cy="86" r="3" fill="${ART.pink[0]}"/></svg>`}
function rug(w=220,h=34,c="var(--orange-soft)"){return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><ellipse cx="${w/2}" cy="${h/2}" rx="${w/2}" ry="${h/2}" fill="${c}"/></svg>`}
function envelope(w=150,stock=PAPER,seal="#C62A29"){const h=w*.64;return `<svg width="${w}" height="${h}" viewBox="0 0 150 96"><rect x="0" y="0" width="150" height="96" rx="4" fill="${stock}"/><path d="M0 4 L75 56 L150 4" fill="${mix(stock,INK,.05)}"/><path d="M0 96 L58 46 M150 96 L92 46" stroke="${mix(stock,INK,.08)}" stroke-width="2"/><circle cx="75" cy="54" r="12" fill="${seal}"/><circle cx="75" cy="54" r="6" fill="${mix(seal,"#ffffff",.25)}"/></svg>`}
function qmark(size=70,fill=ART.purple[0]){return `<svg width="${size}" height="${size}" viewBox="0 0 100 100">${soft(`<circle cx="50" cy="54" r="34"/>`,fill,true,36,40)}<text x="50" y="68" text-anchor="middle" font-family="Fraunces" font-weight="600" font-size="40" fill="${INK}">?</text></svg>`}
function photo(seed,w="100%",h="100%"){const pal=[["#98C1E9","#FED57D","#5BA881"],["#F0A351","#FCEDED","#6D1F42"],["#D6EEE9","#008471","#FED57D"],["#FDF1D3","#EF6F3C","#98C1E9"],["#E6E3F7","#D3B6D3","#F29CC3"],["#E4F1DC","#5BA881","#25533F"]][seed%6];
  return `<svg width="${w}" height="${h}" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style="display:block"><rect width="100" height="100" fill="${pal[0]}"/><circle cx="${30+seed*7%40}" cy="34" r="12" fill="${pal[1]}"/><path d="M0 78 Q30 ${50+seed*3%20} 60 70 T100 66 V100 H0z" fill="${pal[2]}"/><path d="M0 92 Q40 80 100 90 V100 H0z" fill="${mix(pal[2],INK,.2)}"/></svg>`}
function cat(k,size=64){const m={about:[ "#008471","#F4D242"],fav:["#F4D242","#EF6F3C"],pers:["#6D1F42","#FF7BAC"],us:["#FF7BAC","#FFFDF8"],chaos:["#C62A29","#F4D242"],daily:["#D6D35F","#008471"]}[k][1];
  let sh = k==="about"?`<circle cx="50" cy="52" r="30"/>`:k==="fav"?`<polygon points="${starPts(50,52,5,38,18)}"/>`:k==="pers"?`<circle cx="36" cy="56" r="20"/><circle cx="58" cy="44" r="22"/><circle cx="68" cy="62" r="18"/><rect x="30" y="56" width="44" height="22" rx="11"/>`:k==="us"?`<circle cx="38" cy="54" r="22"/><circle cx="62" cy="54" r="22"/>`:k==="chaos"?`<polygon points="${starPts(50,52,8,38,24)}"/>`:`<circle cx="50" cy="52" r="30"/>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100">${soft(sh,m,true,38,38)}${face(50,52,k==="chaos"?"open":"happy",k==="about"||k==="pers"?INK:INK,.85)}</svg>`}

/* ============================================================
   ICONS — Phosphor-like, bold strokes
   ============================================================ */
const ICON={
 sun:"M3 18h18M7 18a5 5 0 0 1 10 0M12 5v3M5 10.5l2 1.5M19 10.5l-2 1.5",
 know:"M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .9-1 1.6v.5M12 16.8v.1",
 env:"M3.5 6h17v12h-17zM3.5 7l8.5 6 8.5-6",
 book:"M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5v13",
 ticket:"M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM15 7.5v1.5M15 11.2v1.6M15 15v1.5",
 gear:"M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8",
 plus:"M12 5v14M5 12h14", back:"M15 5l-7 7 7 7", chev:"M9.5 5.5l6.5 6.5-6.5 6.5", check:"M5 12.5l4.5 4.5L19 7.5", x:"M6 6l12 12M18 6L6 18",
 lock:"M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3", heart:"M12 19.5s-7-4.3-7-9.7a4 4 0 0 1 7-2.6 4 4 0 0 1 7 2.6c0 5.4-7 9.7-7 9.7z",
 camera:"M4 8h3l2-2.5h6L17 8h3v11H4zM12 10.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7", bowl:"M4 12h16a8 8 0 0 1-16 0zM9.5 8.5c0-2 2-2 2-4M14 8.5c0-2 2-2 2-4",
 ball:"M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16M4.5 10.5c3 1.5 12 1.5 15 0M4.5 13.5c3-1.5 12-1.5 15 0", paw:"M7 13.5c1-2.5 3-3.5 5-3.5s4 1 5 3.5c1 2.5-1 5-5 5s-6-2.5-5-5zM6 8.5h.1M10 5.5h.1M14 5.5h.1M18 8.5h.1",
 spark:"M12 3l1.9 5.3L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.7z", pen:"M4 20l4.2-1L19 8.2 15.8 5 5 15.8zM13.5 7.3l3.2 3.2",
 image:"M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 8.5h.1", share:"M12 4v11M7.5 8.5L12 4l4.5 4.5M5 13.5V20h14v-6.5", copy:"M8 8h11v12H8zM5 16V4h11",
 bell:"M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4", moon:"M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z", down:"M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14",
 cal:"M4 6h16v14H4zM4 10h16M8.5 3.5v4M15.5 3.5v4", clock:"M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16M12 8v4.5l3 2", pin:"M12 21s-6-5.5-6-10.5a6 6 0 0 1 12 0C18 15.5 12 21 12 21zM12 8a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5",
 palette:"M12 3.5a8.5 8.5 0 1 0 0 17c1.5 0 2-1 1.5-2.2-.6-1.4.3-2.8 1.8-2.8H18a2.5 2.5 0 0 0 2.5-2.5c0-5.3-3.8-9.5-8.5-9.5zM8 10h.1M12 7.5h.1M16 10h.1",
 shield:"M12 3.5l7 3v5.5c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6.5z", out:"M14 4h5v16h-5M10 8l-4 4 4 4M6 12h9", more:"M6 12h.1M12 12h.1M18 12h.1",
 people:"M9 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 1 0 0 7M3 20c.5-3.5 3-5.5 6-5.5s5.5 2 6 5.5M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5c2 .7 3 2.6 3.3 5.5", compass:"M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17M15.5 8.5l-2 5-5 2 2-5z",
 arrow:"M5 12h14M13 6l6 6-6 6", sliders:"M5 7h9M18 7h1M5 17h3M12 17h7M16 4.5v5M10 14.5v5"
};
const ic=(n,s=22,c="currentColor",w=2.2)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${ICON[n].split("M").filter(Boolean).map(d=>`<path d="M${d}"/>`).join("")}</svg>`;
const icf=(n,s=22,c="currentColor")=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" stroke="${c}" stroke-width="1.6" stroke-linejoin="round" style="flex:none"><path d="${ICON[n]}"/></svg>`;

/* ============================================================
   PHONE SHELL
   ============================================================ */
const TABS5=[["today","Today","sun","sky"],["know","Know","know","purple"],["notes","Notes","env","pink"],["remember","Memories","book","butter"],["future","Plans","ticket","green"]];
const TABS4=[["today","Today","sun","sky"],["discover","Discover","compass","purple"],["notes","Notes","env","pink"],["remember","Memories","book","butter"]];
function tabbar(active,set=TABS5){return `<nav class="tabbar">${set.map(([k,l,i,f])=>`<div class="tab ${k===active?"on":""}" style="--fam-deep:var(--${f}-deep);--fam-base:var(--${f}-base)">${k===active?ic(i,24,"currentColor",2.8):ic(i,24)}<span>${l}</span></div>`).join("")}</nav>`}
function phone(body,{tab=null,tabs=TABS5,overlay="",notab=false,bg=""}={}){
  return `<div class="phone"><div class="screen" ${bg?`style="background:${bg}"`:""}>
   <div class="island"></div>
   <div class="status"><span>9:41</span><span class="sb-r"><i style="width:17px;height:10px;opacity:.9"></i><i style="width:15px;height:10px;opacity:.9;border-radius:3px"></i><i style="width:24px;height:11px;border-radius:3px"></i></span></div>
   <div class="scroll ${tab?"":"notab"}">${body}</div>
   ${tab?tabbar(tab,tabs):""}${overlay}</div></div>`;
}
const header=(title,sub,act="plus",fam="pink")=>`<div class="hz sb g16" style="padding-top:8px"><div class="v g4 f1"><div class="dm" role="heading">${title}</div>${sub?`<div class="bs c2">${sub}</div>`:""}</div>${act?`<button class="ibtn big" style="background:var(--${fam}-base);color:${INK}" aria-label="Add">${ic(act,22,INK,2.4)}</button>`:""}</div>`;
const pushed=(right="")=>`<div class="hz sb" style="padding-top:6px"><button class="ibtn" aria-label="Back">${ic("back",20)}</button>${right}</div>`;
const av=(who,l,cls="")=>`<div class="av ${who} ${cls}">${l}</div>`;

/* ============================================================
   SCREENS
   ============================================================ */
const SECTIONS=[];
const sec=(id,n,title,desc,shots,extra="")=>SECTIONS.push({id,n,title,desc,shots,extra});
const shot=(tag,title,notes,html,cls="")=>({tag,title,notes,html,cls});

/* ---------------- HOME ---------------- */
const vibePair=(a="calm",b="joyful")=>`
 <div class="grid2" style="padding:6px 4px 0">
  <div class="tilt-l v g8" style="background:var(--sky-soft);border-radius:24px;padding:16px 14px;align-items:center;aspect-ratio:1/1.1;justify-content:center">
   ${mood(a,76)}<div class="dm" style="font-size:22px;line-height:26px">${MOODS[a].label}</div><div class="labs c3 hz g4"><span class="dot" style="background:var(--identity-you)"></span>You · shared</div></div>
  <div class="tilt-r v g8" style="background:var(--butter-soft);border-radius:24px;padding:16px 14px;align-items:center;aspect-ratio:1/1.1;justify-content:center">
   ${mood(b,76)}<div class="dm" style="font-size:22px;line-height:26px">${MOODS[b].label}</div><div class="labs c3 hz g4"><span class="dot" style="background:var(--identity-partner)"></span>Ananya</div></div>
 </div>`;

const homeA = phone(`
 <div class="v g24">
  <div class="v g12" style="padding-top:8px">
   <div class="hz sb"><span class="lab c3">Sat 21 Nov · <span style="color:var(--green-deep)">Ananya is here</span></span><button class="ca" aria-label="Settings">${ic("gear",22)}</button></div>
   <div class="dl">Good evening,<br>Kabir.</div>
  </div>

  <div style="position:relative;background:var(--pink-soft);border-radius:32px;padding:22px 20px 20px;overflow:hidden">
   <div class="lab" style="color:var(--pink-deep)">From Ananya · 2h ago</div>
   <div class="dm mt8" style="max-width:250px">A little note is waiting for you</div>
   <div style="position:absolute;right:-26px;bottom:-14px;transform:rotate(-10deg)">${envelope(124,"#FFFDF8")}</div>
   <div class="hz g12" style="margin-top:22px"><button class="btn pri md">Open it ${ic("arrow",18)}</button></div>
  </div>

  <div class="v g12">
   <div class="hz sb"><span class="lab c3">Today's vibes</span><span class="cap ca">History</span></div>
   ${vibePair()}
  </div>

  <div class="v">
   <div class="lab c3" style="margin-bottom:6px">Also today</div>
   <div class="row-i"><div class="ibtn" style="background:var(--purple-soft);color:var(--purple-deep)">${ic("know",20)}</div><div class="f1"><div class="bss">Who's the better cook?</div><div class="cap c3">Today's question · Ananya answered</div></div>${ic("chev",18)}</div>
   <div class="hair"></div>
   <div class="row-i"><div class="ibtn" style="background:var(--orange-soft);color:var(--orange-deep)">${ic("bowl",20)}</div><div class="f1"><div class="bss">Mochi is a bit peckish</div><div class="cap c3">Last fed this morning</div></div>${ic("chev",18)}</div>
  </div>

  <div class="v g12 center" style="align-items:center;padding:8px 0 4px">
   <div style="position:relative">${pet({size:120,mood:"content"})}</div>
   <div style="margin-top:-14px">${rug(170,26)}</div>
   <div class="h">That's everything for today</div>
   <div class="bs c2">Mochi will keep an eye on things.</div>
   <button class="btn quiet">${ic("pen",18)} Leave a little note</button>
  </div>
 </div>`,{tab:"today"});

const homeB = phone(`
 <div class="v g24">
  <div class="hz sb" style="padding-top:8px"><div class="hz g8">${av("you","K","s28")}<div style="margin-left:-14px">${av("them","A","s28")}</div><span class="cap c2" style="margin-left:4px">Day 214 together</span></div><span class="ca">${ic("gear",22)}</span></div>
  <div class="hz g16" style="align-items:flex-end">
   <div class="num" style="font-size:96px;line-height:84px;color:var(--action)">21</div>
   <div class="v" style="padding-bottom:6px"><div class="lab c3">November</div><div class="dm it" style="font-size:30px">Saturday</div></div>
  </div>

  <div class="hz g12" style="background:var(--paper);border-radius:999px;padding:6px 16px 6px 6px">
   <div class="hz" style="gap:0">${mood("calm",44)}<div style="margin-left:-8px">${mood("joyful",44)}</div></div>
   <div class="f1 bs"><b>Calm</b> &amp; <b>joyful</b><div class="cap c3">Your vibes today</div></div>${ic("chev",18,"var(--ink-tertiary)")}
  </div>

  <div class="v g4">
   <div class="hz sb"><div class="lab c3">Three small things</div><div class="cap c3">1 of 3 done</div></div>
   ${[["01","Open Ananya's note","She left it this afternoon.","pink",false,true],["02","Answer today's question","\"Who's the better cook?\"","purple",false,false],["03","Check in","You both shared your vibe.","sky",true,false]].map(([n,t,s,f,done,first])=>`
   <div class="hz g16" style="padding:14px 0;border-bottom:1px solid var(--line);${done?"opacity:.55":""}">
    <div style="font-family:Fraunces;font-weight:600;font-size:26px;color:var(--${f}-deep);width:34px">${n}</div>
    <div class="f1"><div class="h" style="${done?"text-decoration:line-through":""}">${t}</div><div class="bs c2">${s}</div></div>
    ${done?`<span style="color:var(--green-deep)">${ic("check",22)}</span>`:first?`<button class="btn pri sm">Open</button>`:ic("chev",18,"var(--ink-tertiary)")}
   </div>`).join("")}
  </div>

  <div class="card v g12">
   <div class="hz sb"><div class="lab" style="color:var(--butter-deep)">Our week</div><span class="cap c3">16–21 Nov</span></div>
   <div class="hz" style="gap:6px">${["M","T","W","T","F","S","S"].map((d,i)=>`<div class="v g4 center f1" style="align-items:center"><div style="width:26px;height:26px;border-radius:99px;${i<6?(i===2?"background:var(--sunken)":"background:var(--butter-base)"):"border:1.5px dashed var(--line-strong)"}"></div><span class="cap c3">${d}</span></div>`).join("")}</div>
   <div class="hz g12">
    <div style="width:64px;height:64px;border-radius:3px;overflow:hidden;transform:rotate(-3deg);border:4px solid var(--paper);box-shadow:0 2px 8px #0002">${photo(0)}</div>
    <div class="f1"><div class="hm">"best dosa of my life"</div><div class="cap c3">Ananya · Tuesday's page</div></div>
   </div>
   <div class="bs c2">5 notes, 1 plan done, 4 questions answered.</div>
  </div>
  <div class="center cap c3" style="padding-bottom:8px">You're up to date. See you tomorrow.</div>
 </div>`,{tab:"today"});

const homeC = phone(`
 <div class="v g20">
  <div class="hz sb" style="padding-top:8px"><span class="lab c3">Saturday 21</span><span class="ca">${ic("gear",22)}</span></div>
  <div class="hz sb" style="align-items:flex-end">
   <div class="v g8 center" style="align-items:center">${av("you","K","s56")}<span class="cap">Kabir</span></div>
   <div class="v center" style="align-items:center;margin-bottom:-6px">${pet({size:118,mood:"happy"})}<div style="margin-top:-10px">${rug(120,18)}</div></div>
   <div class="v g8 center" style="align-items:center"><div class="av them s56">A<span class="on"></span></div><span class="cap">Ananya</span></div>
  </div>
  <div class="center bs c2" style="margin-top:-6px">Mochi is happy you're both here</div>

  <div class="grid2" style="gap:10px">
   ${[["You","you",[["Vibe",mood("calm",30),"Calm"],["Question",ic("check",18,"var(--green-deep)"),"Answered"],["Notes",ic("env",18),"1 sent"]]],["Ananya","them",[["Vibe",mood("joyful",30),"Joyful"],["Question",ic("check",18,"var(--green-deep)"),"Answered"],["Notes",`<span class="dot" style="background:#C62A29"></span>`,"1 for you"]]]].map(([n,w,rows])=>`
   <div class="card c16 v g8" style="border-top:4px solid var(--identity-${w==="you"?"you":"partner"});border-radius:20px">
    <div class="lab c3">${n}</div>
    ${rows.map(([k,i,v])=>`<div class="hz g8" style="min-height:34px"><div style="width:30px;display:grid;place-items:center">${i}</div><div class="v"><span class="cap c3">${k}</span><span class="bss">${v}</span></div></div>`).join("")}
   </div>`).join("")}
  </div>

  <div style="background:var(--purple-soft);border-radius:24px;padding:18px 18px 18px;position:relative;overflow:visible;margin-top:14px">
   <div style="position:absolute;right:16px;top:-26px">${qmark(56)}</div>
   <div class="lab" style="color:var(--purple-deep)">Both answered</div>
   <div class="dm mt8" style="font-size:22px;line-height:27px;padding-right:40px">Who's the better cook?</div>
   <button class="btn acc full mt16">Reveal together ${ic("spark",18)}</button>
  </div>

  <div class="v g8">
   <div class="lab c3">Coming up</div>
   <div class="ticket lift1"><div class="f1"><div class="bss">Pottery class</div><div class="cap c3">Sat 28 Nov · 3 pm</div></div><div class="perf"></div><div style="width:56px;text-align:center" class="cap c3">in 7d</div></div>
  </div>
 </div>`,{tab:"today"});

const homeEmpty = phone(`
 <div class="v g24">
  <div class="hz sb" style="padding-top:8px"><span class="lab c3">Sat 21 Nov</span><span class="ca">${ic("gear",22)}</span></div>
  <div class="dl">Your corner is ready.</div>
  <div class="card v g16 lift1" style="border-radius:32px">
   <div class="lab" style="color:var(--pink-deep)">Step 1 of 2 · invite Ananya</div>
   <div class="b c2">Share this code. Between only opens up once you're both in.</div>
   <div class="code" style="justify-content:center">${"MOCH".split("").map(c=>`<b>${c}</b>`).join("")}<span class="c3" style="font-weight:700">–</span>${"7K2Q".split("").map(c=>`<b>${c}</b>`).join("")}</div>
   <button class="btn pri full">${ic("share",18)} Share our invite</button>
   <button class="btn quiet" style="align-self:center">${ic("copy",16)} Copy code</button>
  </div>
  <div class="v g12">
   <div class="lab c3">While you wait</div>
   ${[["pen","Write the first note","It'll be waiting when they arrive.","pink"],["know","Try a 5-question quiz","Your answers stay hidden until they finish.","purple"],["palette","Pick your colours","Make it feel like yours.","sky"]].map(([i,t,s,f])=>`
   <div class="hz g12 card c16" style="border-radius:16px"><div class="ibtn" style="background:var(--${f}-soft);color:var(--${f}-deep)">${ic(i,20)}</div><div class="f1"><div class="bss">${t}</div><div class="cap c3">${s}</div></div>${ic("chev",18,"var(--ink-tertiary)")}</div>`).join("")}
  </div>
 </div>`,{tab:"today"});

const homeDone = phone(`
 <div class="v g24">
  <div class="hz sb" style="padding-top:8px"><span class="lab c3">Sat 21 Nov · 11:48 pm</span><span class="ca">${ic("gear",22)}</span></div>
  <div class="v center g8" style="align-items:center;padding-top:30px">
   ${pet({size:170,mood:"sleepy"})}<div style="margin-top:-16px">${rug(230,32)}</div>
   <div class="dm mt16">You're all caught up</div>
   <div class="b c2" style="max-width:260px">Nothing else needs you today. Just a little space for the two of you.</div>
  </div>
  <div class="well v g12">
   <div class="lab c3">Today, between you</div>
   ${[["env","Ananya opened your note","pink"],["know","You both said ‘dal makhani’","purple"],["camera","2 photos on today's page","butter"]].map(([i,t,f])=>`<div class="hz g12"><span style="color:var(--${f}-deep)">${ic(i,18)}</span><span class="bs">${t}</span></div>`).join("")}
  </div>
  <button class="btn sec full">${ic("pen",18)} Leave a note for tomorrow</button>
 </div>`,{tab:"today"});

const homeNotice = phone(`
 <div class="v g24" style="filter:saturate(.9)">
  <div class="hz sb" style="padding-top:60px"><span class="lab c3">Sat 21 Nov</span><span class="ca">${ic("gear",22)}</span></div>
  <div class="dl">Good evening,<br>Kabir.</div>
  ${vibePair("tired","grateful")}
 </div>`,{tab:"today",overlay:`<div class="notice lift2"><div style="width:48px;height:48px;border-radius:99px;background:var(--pink-soft);display:grid;place-items:center;overflow:visible;flex:none">${pet({size:56,note:true})}</div><div class="v g4 f1"><span class="labs" style="color:var(--pink-deep)">Notes</span><span class="h">Mochi is holding something for you</span><span class="bs c2">Ananya left a note. Tap to open it.</span></div></div>`});

sec("home","01","Home · Today",
 "The current Today screen stacks equal-weight MomentCards. Below are three new directions plus the states each one needs. <b>A · Letterbox</b> is the recommendation: one hero moment, the vibe pair as the signature tilt, and a quiet list for everything else.",
 [shot("rec","A · The Letterbox",["Hero takes the single most important pending moment (note → reveal → check-in → question)","Vibe pair keeps the ±2° tilt as the screen's one bit of asymmetry","Secondary moments shrink to rows; the pet closes the feed as a stopping point"],homeA),
  shot("alt","B · The Spread",["Editorial: big date numeral, italic weekday, ‘Day 214 together’","‘Three small things’: a finite, numbered list that strikes items off","Brings in the roadmap's ‘Our week’ recap without adding a new tab"],homeB),
  shot("alt","C · Two sides",["Two side-by-side columns with the pet between you","Shows each person's progress at a glance, never as a score","The reveal becomes a shared event: ‘Reveal together ✦’"],homeC),
  shot("state","State · Not paired yet",["The invite code is the hero and the primary action","‘While you wait’ offers solo actions that pay off later","Replaces the separate waiting screen as the place you land"],homeEmpty),
  shot("state","State · All caught up",["Mochi asleep on the rug: a calm, finished screen","A three-line recap of what happened between you today","One secondary action only, no pressure"],homeDone),
  shot("state","State · Notice arriving",["The NoticeCard drops in from the top, with pink tape for Notes","Mochi holds the envelope in the messenger badge","Copy never includes private content"],homeNotice)]);

/* ---------------- ONBOARDING ---------------- */
const welcome = phone(`
 <div class="v" style="min-height:660px;justify-content:space-between">
  <div class="v g16" style="padding-top:40px">
   <div class="lab c3">Between</div>
   <div class="dxl">A little world<br><span class="it" style="font-weight:400">for two.</span></div>
   <div class="b c2" style="max-width:270px">Notes, questions, memories and plans, private to you and one person.</div>
  </div>
  <div class="v center" style="align-items:center;position:relative">
   <div style="position:absolute;left:8px;top:-6px;transform:rotate(-8deg)" class="paper lift1"><div style="padding:10px 14px" class="hm">you up?</div></div>
   <div style="position:absolute;right:4px;top:30px;transform:rotate(6deg);width:70px;border:5px solid var(--paper);border-radius:3px" class="lift1">${photo(3)}</div>
   ${pet({size:180,note:true,mood:"happy"})}<div style="margin-top:-18px">${rug(240,34)}</div>
  </div>
  <div class="v g8"><button class="btn pri full">Start our space</button><button class="btn sec full">I have an invite code</button><button class="btn quiet" style="align-self:center">Already have an account? Sign in</button></div>
 </div>`,{});

const preview = phone(`
 <div class="v g20" style="min-height:660px">
  <div class="hz sb" style="padding-top:6px"><div class="hz g4">${[1,0,0].map(o=>`<span style="width:${o?22:8}px;height:8px;border-radius:9px;background:${o?"var(--action)":"var(--line)"}"></span>`).join("")}</div><span class="bss c3">Skip</span></div>
  <div class="v g8"><div class="lab" style="color:var(--pink-deep)">Try it · 1 of 3</div><div class="dl">Open a note</div><div class="b c2">This is how notes from your person arrive. Tap the envelope.</div></div>
  <div class="v center" style="align-items:center;padding:20px 0;position:relative">
   <div style="transform:rotate(-3deg)" class="lift2">${envelope(240,"#FCEDED")}</div>
   <div class="cap c3 mt16 hz g4">${ic("spark",14)} sample note, not sent anywhere</div>
  </div>
  <div style="margin-top:auto" class="v g8"><button class="btn pri full">Next</button></div>
 </div>`,{});

const email = phone(`
 <div class="v g24" style="min-height:660px">
  ${pushed()}
  <div class="v g8"><div class="dl">What's your email?</div><div class="b c2">We'll send a 6-digit code. No passwords to remember.</div></div>
  <div class="v g8"><div class="lab c3">Email</div><div class="field focus">kabir@<span class="ph">example.com</span></div><div class="cap c3">Only used to sign in. Never shared with Ananya.</div></div>
  <div style="margin-top:auto" class="v g12"><button class="btn pri full">Send me a code</button><div class="cap c3 center">By continuing you agree to the terms &amp; privacy policy.</div></div>
 </div>`,{});

const otp = phone(`
 <div class="v g24" style="min-height:660px">
  ${pushed()}
  <div class="v g8"><div class="dl">Check your email</div><div class="b c2">We sent a code to <b style="color:var(--ink)">kabir@example.com</b></div></div>
  <div class="code" style="gap:8px">${["4","2","9","","",""].map((c,i)=>`<b class="${i===3?"f":""}" style="width:44px;height:56px;font-size:26px">${c}</b>`).join("")}</div>
  <div class="hz g8 bs c2">${ic("clock",16)} Resend in 0:24</div>
  <div style="margin-top:auto" class="well hz g12"><span style="color:var(--sky-deep)">${ic("env",20)}</span><span class="bs c2">Can't find it? Look in Promotions or Spam. It's from Between.</span></div>
 </div>`,{});

const nameS = phone(`
 <div class="v g24" style="min-height:660px">
  ${pushed()}
  <div class="v g8"><div class="dl">What should Ananya call you?</div><div class="b c2">This is how you'll appear on notes and answers.</div></div>
  <div class="v g8"><div class="lab c3">Your name</div><div class="field focus">Kabir</div></div>
  <div class="v center g8" style="align-items:center;padding-top:20px">
   <div class="paper lift1" style="padding:18px 20px;transform:rotate(-2deg);width:220px"><div class="tape"></div><div class="hl">miss you already</div><div class="cap c3 mt8 hz g4"><span class="dot" style="background:var(--identity-you)"></span> Kabir</div></div>
   <span class="cap c3 mt8">Preview of how it shows up</span>
  </div>
  <div style="margin-top:auto"><button class="btn pri full">Continue</button></div>
 </div>`,{});

const start = phone(`
 <div class="v g24" style="min-height:660px">
  ${pushed()}
  <div class="v g8"><div class="dl">How are you starting?</div></div>
  <div class="card v g12 lift1" style="border:2px solid var(--action);border-radius:24px">
   <div class="hz sb"><div class="ibtn" style="background:var(--pink-soft);color:var(--pink-deep)">${ic("spark",20)}</div><span style="width:22px;height:22px;border-radius:99px;background:var(--action);display:grid;place-items:center;color:var(--on-action)">${ic("check",14,"currentColor",3)}</span></div>
   <div class="h">Start a new space</div><div class="bs c2">You'll get a code to send to your person.</div>
  </div>
  <div class="card v g12" style="border:1.5px solid var(--line);border-radius:24px">
   <div class="ibtn" style="background:var(--sky-soft);color:var(--sky-deep)">${ic("people",20)}</div>
   <div class="h">Join my person</div><div class="bs c2">They already sent you an 8-character code.</div>
  </div>
  <div style="margin-top:auto"><button class="btn pri full">Continue</button></div>
 </div>`,{});

const joinS = phone(`
 <div class="v g24" style="min-height:660px">
  ${pushed()}
  <div class="v g8"><div class="dl">Enter their code</div><div class="b c2">Pasting works too. We'll split it up for you.</div></div>
  <div class="code" style="justify-content:center">${"MOCH".split("").map(c=>`<b>${c}</b>`).join("")}<span class="c3" style="font-weight:700">–</span>${"7K".split("").map(c=>`<b>${c}</b>`).join("")}<b class="f"></b><b></b></div>
  <div class="card hz g12 lift1"><div class="av them">A</div><div class="f1"><div class="bss">Ananya's space</div><div class="cap c3">Created 2 days ago · waiting for you</div></div></div>
  <div style="margin-top:auto"><button class="btn pri full">Join Ananya</button></div>
 </div>`,{});

const waiting = phone(`
 <div class="v g24 center" style="min-height:660px;align-items:center;justify-content:center">
  <div style="position:relative">${pet({size:170,mood:"content"})}<div style="position:absolute;left:140px;top:-6px;white-space:nowrap" class="bubble">any minute…</div></div>
  <div style="margin-top:-16px">${rug(220,30)}</div>
  <div class="dm">Waiting for Ananya</div>
  <div class="b c2" style="max-width:270px">We'll ping you the moment they join. You can close the app.</div>
  <div class="card c16 hz g12" style="width:100%"><div class="code" style="gap:4px">${"MOCH7K2Q".split("").map(c=>`<b style="width:24px;height:32px;font-size:16px">${c}</b>`).join("")}</div><span class="ca">${ic("copy",20)}</span></div>
  <button class="btn sec full">${ic("share",18)} Share again</button>
  <button class="btn quiet">Write their first note while you wait</button>
 </div>`,{});

const petChoice = phone(`
 <div class="v g24" style="min-height:660px">
  <div class="v g8" style="padding-top:20px"><div class="lab" style="color:var(--orange-deep)">Optional</div><div class="dl">Raise a little one together?</div><div class="b c2">A pet that grows when you show up for each other. Pause it any time; it never gets sad or sick.</div></div>
  <div class="v center" style="align-items:center">${egg(120)}<div style="margin-top:-14px">${rug(180,26)}</div></div>
  <div class="v g8"><div class="lab c3">Ananya suggested a name</div><div class="hz g8 wr"><span class="chip on">${ic("check",14)} Mochi</span><span class="chip out">Biscuit</span><span class="chip out">Dumpling</span><span class="chip out">${ic("pen",14)} Other</span></div></div>
  <div style="margin-top:auto" class="v g8"><button class="btn pri full">Hatch Mochi</button><button class="btn quiet" style="align-self:center">Continue without a pet</button></div>
 </div>`,{});

sec("onboarding","02","First run",
 "A shorter path from opening the app to sending a first real note. The roadmap's three-slide local preview comes first; asking for details comes after the value is clear. Each step asks for one thing and uses one primary button.",
 [shot("new","Welcome",["Display-xl headline with an italic ‘for two’","The pet holding a note, with a hand-written scrap and a taped photo around it","Three clear doors: start, join, sign in"],welcome),
  shot("new","Preview · try it",["Interactive sample (no network) before any account","Progress pill, Skip always visible","Labelled as a sample so nothing feels sent"],preview),
  shot("re","Email",["Field focus uses the action ring","Privacy reassurance right below the field"],email),
  shot("re","Verify code",["6 large boxes, auto-advance, paste-split","A calm resend timer and a tip on where to look"],otp),
  shot("re","Your name",["Live preview of a note signed with your name","Makes the reason for asking obvious"],nameS),
  shot("re","Start / join",["Two choice cards, the selected one with ring and check","Replaces the separate create and join entry points"],start),
  shot("re","Join with a code",["Shows whose space you're joining before you commit","Code boxes with a dash after the fourth"],joinS),
  shot("re","Waiting for partner",["Pet with a ‘…’ speech bubble","Code always copyable, plus something useful to do"],waiting),
  shot("re","Pet choice",["Clearly optional, with no-guilt copy","Partner's name suggestion shown as chips"],petChoice)]);

/* ---------------- KNOW ---------------- */
const tile=(k,cat_,title,meta,fill,text)=>`<div style="background:${fill};color:${text};border-radius:24px;padding:16px;aspect-ratio:3/4;display:flex;flex-direction:column;justify-content:space-between"><div class="labs" style="opacity:.9">${cat_}</div><div>${cat(k,58)}</div><div><div class="h" style="font-size:16px;line-height:20px">${title}</div><div class="cap" style="opacity:.85">${meta}</div></div></div>`;
const knowLib = phone(`
 <div class="v g24">
  ${header("Know each other","",null)}
  <div style="background:var(--purple-soft);border-radius:24px;padding:18px;position:relative;margin-top:18px">
   <div style="position:absolute;right:18px;top:-28px">${qmark(60)}</div>
   <div class="lab" style="color:var(--purple-deep)">Today's question</div>
   <div class="dm mt8" style="font-size:23px;line-height:28px;padding-right:30px">What would Ananya order at a new café?</div>
   <div class="hz sb mt16"><div class="hz g8">${av("them","A","s28")}<span class="cap c2">Ananya answered</span></div><button class="btn pri sm">Answer</button></div>
  </div>
  <div class="hz g8" style="overflow:hidden"><span class="chip on">All</span><span class="chip">New</span><span class="chip">Quick · 5 min</span><span class="chip">Played</span></div>
  <div class="v g12"><div class="hz sb"><span class="lab c3">Pick up where you left off</span></div>
   <div class="card c16 hz g12" style="border-radius:16px"><div style="width:44px;height:44px;border-radius:12px;background:#6D1F42;display:grid;place-items:center">${cat("pers",36)}</div><div class="f1"><div class="bss">Love languages</div><div class="cap c3">You · 4 of 8 · Ananya finished</div><div class="bar mt8" style="background:var(--sunken);height:6px"><i style="width:50%;background:var(--action)"></i></div></div></div>
  </div>
  <div class="v g12"><span class="lab c3">Packs</span>
   <div class="grid2">
    ${tile("about","About me","Childhood, the basics","6 questions","#008471","#FFFDF8")}
    ${tile("fav","Favorites","Food, songs, places","8 questions","#F4D242","#6D1F42")}
    ${tile("us","Us","How we work","6 questions","#FF7BAC","#6D1F42")}
    ${tile("chaos","Chaos","Who's more likely…","10 questions","#C62A29","#FCEDED")}
   </div></div>
 </div>`,{tab:"know"});

const quizPlay = phone(`
 <div class="v g20" style="min-height:660px">
  <div class="hz sb" style="padding-top:6px"><button class="ibtn">${ic("x",20)}</button><div class="hz g4">${[1,1,1,0,0,0].map((d,i)=>`<span style="width:${i===2?20:8}px;height:8px;border-radius:9px;background:${d?"var(--action)":"var(--line)"}"></span>`).join("")}</div><span class="cap c3">3 / 6</span></div>
  <div style="background:#F4D242;color:#6D1F42;border-radius:24px;padding:20px 20px 24px" class="v g12">
   <div class="hz sb"><span class="labs">Favorites</span>${cat("fav",40)}</div>
   <div class="dm" style="font-size:25px">Ananya's comfort food after a long day?</div>
   <div class="cap">Guess for her · she answered about herself</div>
  </div>
  <div class="v g8">
   ${[["Masala chai & toast",0],["Dal makhani",1],["Instant noodles",0],["Whatever you're cooking",0]].map(([o,s])=>`<div class="hz g12" style="height:56px;border-radius:16px;background:var(--paper);padding:0 16px;${s?"box-shadow:0 0 0 2px var(--action) inset;background:var(--action-soft)":"border:1.5px solid var(--line)"}"><span class="b f1" style="${s?"font-weight:600;color:var(--on-action-soft)":""}">${o}</span>${s?`<span style="color:var(--action)">${ic("check",20)}</span>`:""}</div>`).join("")}
  </div>
  <div class="hz sb" style="margin-top:auto"><button class="btn quiet">${ic("back",16)} Previous</button><button class="btn pri md">Next</button></div>
 </div>`,{});

const reveal = phone(`
 <div class="v g20" style="min-height:660px">
  ${pushed(`<span class="cap c3">Favorites · results</span>`)}
  <div class="v center g4" style="align-items:center;padding-top:8px">
   <div class="lab c3">You matched on</div>
   <div class="hz" style="align-items:baseline;gap:4px"><span class="num" style="color:var(--action)">6</span><span class="dm c3">/8</span></div>
   <div class="dxl" style="font-size:40px">Same brain.</div>
  </div>
  <div class="v g12">
   <div class="bss c2">Ananya's comfort food after a long day?</div>
   <div class="grid2">
    <div class="tilt-l" style="background:var(--ink);color:var(--on-ink);border-radius:20px;padding:14px"><div class="labs" style="opacity:.75">Your guess</div><div class="hl mt8" style="font-size:24px">dal makhani</div></div>
    <div class="tilt-r" style="background:var(--paper);border-radius:20px;padding:14px;box-shadow:0 0 0 2px var(--green-base) inset"><div class="labs" style="color:var(--green-deep)">Ananya ✓</div><div class="hl mt8" style="font-size:24px">dal makhani</div></div>
   </div>
  </div>
  <div class="v g8">
   ${[["Dream trip","Kyoto","Lisbon",false],["Go-to song","Kesariya","Kesariya",true]].map(([q,a,b,m])=>`<div class="hz g12 card c16" style="border-radius:16px"><span style="color:${m?"var(--green-deep)":"var(--tomato-deep)"}">${ic(m?"check":"x",18)}</span><div class="f1"><div class="bss">${q}</div><div class="cap c3">You: ${a} · Ananya: ${b}</div></div></div>`).join("")}
  </div>
  <button class="btn sec full">Talk about Lisbon ${ic("pen",16)}</button>
 </div>`,{});

const daily = phone(`
 <div class="v g24" style="min-height:660px">
  ${pushed()}
  <div class="v g8"><div class="lab" style="color:var(--purple-deep)">Today's question · Sat 21</div><div class="dl">What would Ananya order at a new café?</div></div>
  <div class="paper ruled lift1" style="padding:20px;min-height:180px;transform:rotate(-1deg)"><div class="tape"></div><div class="hl">a cortado and the weirdest pastry on the menu</div></div>
  <div class="hz g8 cap c3">${ic("lock",14)} Hidden until you've both answered</div>
  <div class="well hz g12"><div class="av them s28">A</div><span class="bs c2 f1">Ananya answered this morning</span><span class="cap" style="color:var(--green-deep)">Ready</span></div>
  <div style="margin-top:auto"><button class="btn pri full">Lock in my answer</button></div>
 </div>`,{});

sec("know","03","Know · quizzes",
 "The Daily question gets its own warm purple object; packs stay as saturated paint chips. Play mode keeps the swatch as the question card, and the reveal turns into a real result page with a ‘what next’ that leads back into conversation.",
 [shot("re","Library",["Daily card with the ‘?’ creature peeking over the edge","Resume row with partner status and progress","Filter chips stay quiet until selected"],knowLib),
  shot("re","Daily question",["Free-text answer written on lined paper in hand type","The lock state is spelled out in words, not only an icon"],daily),
  shot("re","Quiz play",["Paint-chip card carries the prompt","Selection = ring + soft tint + check, never colour alone","Clear guess-for-them context line"],quizPlay),
  shot("re","Reveal",["Score numeral + display headline","Answer pairs in hand type, tilted opposite each other","A mismatch becomes a conversation starter"],reveal)]);

/* ---------------- NOTES ---------------- */
const notesInbox = phone(`
 <div class="v g24">
  ${header("Notes","For each other, in your own words.","plus","pink")}
  <div class="seg"><span class="on">For you · 2</span><span>From you</span></div>
  <div class="v center g8" style="align-items:center;padding:6px 0 4px;position:relative">
   <div style="position:absolute;top:10px;transform:rotate(5deg);opacity:.85">${envelope(230,"#E9D8BC")}</div>
   <div style="position:relative;transform:rotate(-3deg)" class="lift2">${envelope(230,"#FCEDED")}</div>
   <div class="h mt12">2 sealed notes from Ananya</div>
   <button class="btn pri md">Open the newest</button>
  </div>
  <div class="v g12"><div class="lab c3">Opened</div>
   <div class="grid2" style="align-items:start">
    ${[["you looked so happy at the market today",PAPER,-1.5,"Thu"],["thank you for waiting up for me",ART.sky[1],1.2,"Tue"],["remember to drink water, genius","#E9D8BC",1,"Mon"],["dosa rematch on sunday?",ART.pink[1],-1,"Sun"]].map(([t,c,r,d])=>`<div class="paper lift1" style="background:${c};color:${INK};padding:16px 14px 12px;transform:rotate(${r}deg);margin-top:8px"><div class="tape" style="width:44px;margin-left:-22px"></div><div class="hm">${t}</div><div class="hz sb mt8"><span class="cap" style="opacity:.6">${d}</span><span style="color:#C62A29">${icf("heart",14,"#C62A29")}</span></div></div>`).join("")}
   </div></div>
  <div class="center cap c3">That's every note from this month.</div>
 </div>`,{tab:"notes"});

const noteCompose = phone(`
 <div class="v g20" style="min-height:660px">
  <div class="hz sb" style="padding-top:6px"><button class="ibtn">${ic("x",20)}</button><span class="bss">To Ananya</span><span class="cap c3">Saved</span></div>
  <div class="paper lift1" style="background:var(--pink-soft);padding:26px 20px 20px;min-height:300px;transform:rotate(-1deg)">
   <div class="tape"></div>
   <div class="hl" style="color:var(--ink)">i know this week has been a lot. dinner is on me tonight, and the playlist too.<span style="border-left:2px solid var(--action);margin-left:2px"></span></div>
  </div>
  <div class="v g8"><div class="lab c3">Paper</div>
   <div class="hz g12">${[[PAPER,"Cream"],[ART.pink[1],"Blush",1],["#E9D8BC","Kraft"],[ART.sky[1],"Sky"]].map(([c,l,s])=>`<div class="v g4 center" style="align-items:center"><div style="width:44px;height:44px;border-radius:12px;background:${c};${s?"box-shadow:0 0 0 2px var(--canvas),0 0 0 4px var(--action)":"border:1.5px solid var(--line)"}"></div><span class="cap ${s?"":"c3"}">${l}</span></div>`).join("")}</div></div>
  <div class="row-i"><span style="color:var(--orange-deep)">${ic("paw",22)}</span><div class="f1"><div class="bss">Mochi delivers it</div><div class="cap c3">Arrives with a little trot</div></div><div class="toggle on"></div></div>
  <div style="margin-top:auto"><button class="btn pri full">Seal &amp; send</button></div>
 </div>`,{});

const noteOpen = phone(`
 <div class="v g20" style="min-height:660px">
  ${pushed(`<button class="ibtn">${ic("more",20)}</button>`)}
  <div class="v center" style="align-items:center;position:relative;padding-top:40px">
   <div style="position:absolute;top:150px;opacity:.9">${envelope(260,"#FCEDED")}</div>
   <div class="paper lift2" style="position:relative;width:270px;padding:26px 20px 20px;transform:rotate(1.5deg)"><div class="tape"></div>
    <div class="hl">you looked so happy at the market today. i want more saturdays like that.</div>
    <div class="hz sb mt16"><span class="cap c3 hz g4"><span class="dot" style="background:var(--identity-partner)"></span>Ananya · 4:12 pm</span></div>
   </div>
  </div>
  <div style="margin-top:auto" class="v g12">
   <div class="hz g12" style="justify-content:center"><button class="ibtn big" style="background:var(--pink-soft);color:#C62A29">${icf("heart",22,"#C62A29")}</button><span class="bs c2">Loved · Ananya will see a little heart</span></div>
   <button class="btn pri full">Write back</button>
  </div>
 </div>`,{});

const notesEmpty = phone(`
 <div class="v g24">
  ${header("Notes","For each other, in your own words.","plus","pink")}
  <div class="seg"><span class="on">For you</span><span>From you</span></div>
  <div class="v center g12" style="align-items:center;padding-top:30px">
   <div style="position:relative">${pet({size:150,note:true})}</div><div style="margin-top:-14px">${rug(200,28,"var(--pink-soft)")}</div>
   <div class="dm">No notes yet</div>
   <div class="b c2" style="max-width:250px">The first one doesn't need to be big. ‘thinking of you’ is plenty.</div>
   <button class="btn sec">Write the first note</button>
  </div>
 </div>`,{tab:"notes"});

sec("notes","04","Notes",
 "Sealed notes now look like envelopes waiting to be opened, rather than list items. Opened notes become a pinboard of real paper, and the composer is the paper itself.",
 [shot("re","Inbox",["Sealed envelopes stacked, with one clear ‘Open the newest’","Opened notes as tilted paper with tape, seeded by note id","The feed ends: ‘That's every note from this month’"],notesInbox),
  shot("re","Compose",["You write straight onto the chosen stock","4 paper stocks as swatches; the selected one has a ring and a label","Draft ‘Saved’ indicator (roadmap A3)"],noteCompose),
  shot("re","Open note",["Paper slides up out of the envelope","Hearts are the only reaction, so the heart test holds","‘Write back’ is the single primary action"],noteOpen),
  shot("state","Empty",["Pet holding a note on a pink rug","Specific, warm copy and one secondary button"],notesEmpty)]);

/* ---------------- REMEMBER ---------------- */
const journal = phone(`
 <div class="v g24">
  ${header("Memories","Your days, in words and photos.","plus","butter")}
  <div class="seg"><span class="on">Pages</span><span>Photos</span></div>
  <div class="hz g12 card c16" style="border:1.5px dashed var(--line-strong);background:transparent;border-radius:16px"><div class="ibtn" style="background:var(--butter-soft);color:var(--butter-deep)">${ic("pen",20)}</div><div class="f1"><div class="bss">What happened today?</div><div class="cap c3">Ananya added a photo · your turn</div></div></div>
  ${[["Tue 17 Nov","Dosa night",[["them","Ananya","best dosa of my life. the chutney!!"],["you","Kabir","she ate three. i counted."]],1],["Sun 15 Nov","The long way home",[["you","Kabir","we took the coast road and stopped at every viewpoint."]],4]].map(([d,t,blocks,p])=>`
  <div class="paper lift1 v g12" style="padding:18px">
   <div class="hz sb"><div class="v"><div class="lab c3">${d}</div><div class="dm" style="font-size:24px">${t}</div></div></div>
   <div style="position:relative;border:6px solid var(--paper);box-shadow:0 2px 8px #0002;transform:rotate(-1deg);aspect-ratio:4/3;overflow:hidden">${photo(p)}</div>
   ${blocks.map(([w,n,txt])=>`<div style="border-left:4px solid var(--identity-${w==="you"?"you":"partner"});padding-left:12px" class="v g4"><span class="cap c3">${n}</span><span class="b">${txt}</span></div>`).join("")}
  </div>`).join("")}
 </div>`,{tab:"remember"});

const photos = phone(`
 <div class="v g20">
  ${header("Memories","Your days, in words and photos.","plus","butter")}
  <div class="seg"><span>Pages</span><span class="on">Photos</span></div>
  <div class="v g8"><div class="hz sb"><span class="h">November</span><span class="cap c3">14 photos</span></div>
   <div class="pgrid">${[0,1,2,3,4,5,1,3].map(s=>`<div class="ph-img">${photo(s)}</div>`).join("")}<div class="ph-img cap" style="background:var(--sunken);display:grid;place-items:center;color:var(--ink-tertiary)">+6</div></div></div>
  <div class="v g8"><div class="hz sb"><span class="h">October</span><span class="cap c3">22 photos</span></div>
   <div class="pgrid">${[5,2,0,4,3,1].map(s=>`<div class="ph-img">${photo(s)}</div>`).join("")}</div></div>
 </div>`,{tab:"remember"});

const pageDetail = phone(`
 <div class="v g20">
  ${pushed(`<button class="ibtn">${ic("pen",18)}</button>`)}
  <div class="v g4"><div class="lab c3">Tuesday · 17 November</div><div class="dl">Dosa night</div></div>
  <div style="border:6px solid var(--paper);transform:rotate(1.5deg);box-shadow:0 2px 8px #0002;position:relative">
   <span style="position:absolute;top:-8px;left:-10px;width:40px;height:16px;background:color-mix(in srgb,var(--highlight) 70%,transparent);transform:rotate(-30deg);z-index:1"></span>
   <span style="position:absolute;top:-8px;right:-10px;width:40px;height:16px;background:color-mix(in srgb,var(--highlight) 70%,transparent);transform:rotate(30deg);z-index:1"></span>
   <div style="aspect-ratio:4/3">${photo(1)}</div></div>
  <div class="hm center c2">the corner place on 5th</div>
  <div class="paper ruled" style="padding:16px 18px" >
   <div style="border-left:4px solid var(--identity-partner);padding-left:12px" class="v g4"><span class="cap c3">Ananya</span><span class="b" style="line-height:28px">best dosa of my life. the chutney!! we have to go back with Riya.</span></div>
   <div style="border-left:4px solid var(--identity-you);padding-left:12px;margin-top:16px" class="v g4"><span class="cap c3">Kabir</span><span class="b" style="line-height:28px">she ate three. i counted. i also ate three.</span></div>
  </div>
  <button class="btn sec full">Add your side</button>
 </div>`,{});

const pageNew = phone(`
 <div class="v g20" style="min-height:660px">
  <div class="hz sb" style="padding-top:6px"><button class="ibtn">${ic("x",20)}</button><span class="bss">Today's page</span><span class="cap c3">Draft</span></div>
  <div class="v g4"><div class="lab c3">Saturday · 21 November</div><div class="dm c3">Title (optional)</div></div>
  <div class="hz g8"><div style="width:96px;height:96px;border-radius:10px;overflow:hidden;position:relative">${photo(2)}<span style="position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:99px;background:#0008;display:grid;place-items:center;color:#fff">${ic("x",12,"#fff",3)}</span></div><div style="width:96px;height:96px;border-radius:10px;border:1.5px dashed var(--line-strong);display:grid;place-items:center;color:var(--ink-tertiary)">${ic("camera",24)}</div></div>
  <div style="border-left:4px solid var(--identity-you);padding-left:12px;min-height:160px" class="b">farmers' market, then the long nap. Ananya found the honey guy again<span style="border-left:2px solid var(--action);margin-left:1px"></span></div>
  <div class="well bs c2 hz g8">${ic("people",18)} Ananya can add her side to this page too.</div>
  <div style="margin-top:auto"><button class="btn pri full">Save to our journal</button></div>
 </div>`,{});

sec("remember","05","Memories · journal",
 "Pages read like a shared scrapbook: a taped photo, then each person's words marked with their identity rule. Photos is a tight, borderless grid grouped by month. A dashed ‘today’ prompt shows when it's your turn.",
 [shot("re","Pages",["Dashed prompt card when there's no page today","Each page is a paper object with both voices on it","Photo framed with a paper border and a slight tilt"],journal),
  shot("re","Photos",["Borderless 3-column grid with 4px gaps, full bleed","Month headers with counts, and a ‘+6’ cell to cap long months"],photos),
  shot("re","Page detail",["Two tape corners return in the detail view","Faint ruling behind the text, 28px","‘Add your side’ invites the other person in"],pageDetail),
  shot("re","New page",["Photo strip first, then words","Author rule shows whose words these are","Draft-safe (roadmap A3)"],pageNew)]);

/* ---------------- FUTURE ---------------- */
const ticket=(t,m,stub,done=false)=>`<div class="ticket lift1" style="${done?"background:var(--green-soft)":""}"><div class="f1 v g4"><div class="h" style="font-size:16px">${t}</div><div class="cap c3">${m}</div></div><div class="perf"></div><div style="width:64px;display:grid;place-items:center;font-size:26px">${done?"":stub}</div>${done?`<div class="stamp">DONE<br>14 NOV</div>`:""}</div>`;
const future = phone(`
 <div class="v g24">
  ${header("Our plans","A little of what comes next, together.","plus","green")}
  <div class="hz g8"><span class="chip on">${ic("check",14)} Soon</span><span class="chip">Someday</span><span class="chip">Done · 12</span></div>
  <div class="v g12"><div class="lab c3">This week</div>
   ${ticket("Pottery class","Sat 28 Nov · 3 pm · Ananya's idea","🏺")}
   ${ticket("Call Nani together","Sun · any time","📞")}</div>
  <div class="v g12"><div class="lab c3">Just done</div>
   ${ticket("Watch the meteor shower","You & Ananya","",true)}
   <div class="well hz g12" style="background:var(--butter-soft)"><span style="color:var(--butter-deep)">${ic("camera",20)}</span><div class="f1 bs">Keep this moment? Turn it into a journal page.</div><button class="btn sm soft">Keep it</button></div></div>
  <div class="v g12"><div class="lab c3">Someday</div>
   ${ticket("Kyoto in cherry season","Dream · added by Kabir","🌸")}
   ${ticket("Learn to make momos","Dream","🥟")}</div>
 </div>`,{tab:"future"});

const futureAdd = phone(`
 <div class="v g24" style="filter:blur(0)">
  ${header("Our plans","A little of what comes next, together.","plus","green")}
  ${ticket("Pottery class","Sat 28 Nov · 3 pm","🏺")}
 </div>`,{tab:"future",overlay:`<div class="scrim"></div><div class="sheet v g16"><div class="grab"></div><div class="dm">Make a plan</div>
  <div class="v g8"><div class="lab c3">What is it?</div><div class="field focus">Sunrise hike at Nandi Hills</div></div>
  <div class="v g8"><div class="lab c3">When</div><div class="hz g8 wr"><span class="chip out">This week</span><span class="chip on">${ic("cal",14)} Sat 5 Dec</span><span class="chip out">Someday</span></div></div>
  <div class="v g8"><div class="lab c3">Stub</div><div class="hz g8">${["⛰️","🌅","🥾","☕","＋"].map((e,i)=>`<div style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:20px;${i===0?"box-shadow:0 0 0 2px var(--action) inset;background:var(--action-soft)":"background:var(--sunken)"}">${e}</div>`).join("")}</div></div>
  <button class="btn pri full">Save our plan</button></div>`});

sec("future","06","Plans · future",
 "Tickets stay the signature object. New here: time-grouped sections, the ‘DONE’ stamp, and the roadmap's plan → memory bridge as one small inline prompt rather than a new destination.",
 [shot("re","Plans",["Grouped into This week / Just done / Someday","Who suggested it lives on the ticket","‘Keep this moment’ bridge into Memories"],future),
  shot("re","Make a plan · sheet",["Bottom sheet: 3 fields, quick date chips","Stub picker uses user-content emoji only"],futureAdd)]);

/* ---------------- PET + VIBES ---------------- */
const petRoom = phone(`
 <div class="v g24">
  ${pushed(`<span class="cap c3">Baby · day 41</span>`)}
  <div class="v center" style="align-items:center;position:relative;padding-top:20px">
   <div class="bubble" style="position:absolute;top:0;left:14px;max-width:200px">Ananya fed me this morning! I could eat again though.</div>
   <div style="margin-top:56px">${pet({size:200,mood:"happy",bowl:true})}</div><div style="margin-top:-20px">${rug(260,36)}</div>
   <div class="dm mt12">Mochi</div>
  </div>
  <div class="hz g16" style="justify-content:center">${[["bowl","Feed"],["ball","Play"],["heart","Pet"]].map(([i,l])=>`<div class="v g4 center" style="align-items:center"><button class="ibtn big" style="width:56px;height:56px;color:var(--orange-deep)">${ic(i,24)}</button><span class="cap">${l}</span></div>`).join("")}</div>
  <div class="card v g12">
   ${[["Fullness","orange",.45,"peckish"],["Energy","sky",.8,"bouncy"],["Love","pink",.9,"so loved"]].map(([l,f,v,w])=>`<div class="hz g12"><span class="bs" style="width:64px">${l}</span><div class="bar" style="background:var(--${f}-soft)"><i style="width:${v*100}%;background:var(--${f}-base)"></i></div><span class="hm" style="color:var(--${f}-deep);width:72px;text-align:right;padding-right:4px">${w}</span></div>`).join("")}
   <div class="cap c3">Ananya fed Mochi · 6h ago</div>
  </div>
  <div class="v g12"><div class="lab c3">Mochi's story</div>
   <div style="border-left:2px solid var(--line);margin-left:11px;padding-left:20px" class="v g16">
    <div style="position:relative"><span style="position:absolute;left:-33px;top:0;width:24px;height:24px;border-radius:99px;background:var(--orange-base);display:grid;place-items:center">${icf("spark",13,INK)}</span><div class="h">First 30 days together</div><div class="bs c2">Mochi learned your names.</div><div class="cap c3">Oct 11</div></div>
    <div style="position:relative"><span style="position:absolute;left:-25px;top:6px;width:8px;height:8px;border-radius:99px;background:var(--line-strong)"></span><div class="bs c2">You played with Mochi · twice</div><div class="cap c3">Yesterday</div></div>
   </div></div>
 </div>`,{});

const checkin = phone(`
 <div class="v g24"><div class="dl" style="padding-top:60px">Good evening,<br>Kabir.</div></div>`,{tab:"today",overlay:`<div class="scrim"></div><div class="sheet v g16" style="padding-bottom:24px"><div class="grab"></div>
  <div class="v g4"><div class="dm">How are you feeling?</div><div class="bs c2">Pick one. You choose who sees it.</div></div>
  <div class="grid3" style="gap:6px 8px">${["joyful","excited","grateful","connected","calm","tired","sensitive","stressed","hurt"].map(k=>`<div class="v center g4" style="align-items:center;padding:6px 0;border-radius:16px;${k==="tired"?"background:var(--action-soft);box-shadow:0 0 0 2px var(--action) inset":""}">${mood(k,50)}<span class="cap" style="${k==="tired"?"font-weight:700;color:var(--on-action-soft)":""}">${MOODS[k].label}</span></div>`).join("")}</div>
  <div class="field"><span class="ph">A few words (optional)</span></div>
  <div class="seg"><span class="on">Share with Ananya</span><span>${ic("lock",13)} Just for me</span></div>
  <button class="btn pri full">Share my vibe</button></div>`});

const vibes = phone(`
 <div class="v g20">
  ${pushed()}
  <div class="v g4"><div class="dl">Shared vibes</div><div class="bs c2">Only moods you both chose to share.</div></div>
  <div class="hz sb lab c3"><span>${av("you","K","s28")}</span><span>This week</span><span>${av("them","A","s28")}</span></div>
  ${[["Sat 21","calm","joyful"],["Fri 20","tired","grateful"],["Thu 19","excited","excited"],["Wed 18",null,"calm"],["Tue 17","connected","connected"]].map(([d,a,b])=>`
  <div class="hz sb" style="padding:8px 0;border-bottom:1px solid var(--line)">
   <div class="hz g8" style="width:110px">${a?mood(a,40):`<div style="width:40px;height:40px;border-radius:99px;border:1.5px dashed var(--line-strong)"></div>`}<span class="bss ${a?"":"c3"}">${a?MOODS[a].label:"—"}</span></div>
   <span class="cap c3">${d}${a===b?`<div style="color:var(--green-deep);font-weight:700">in sync</div>`:""}</span>
   <div class="hz g8" style="width:110px;justify-content:flex-end"><span class="bss">${MOODS[b].label}</span>${mood(b,40)}</div>
  </div>`).join("")}
  <div class="center cap c3">Private check-ins never appear here.</div>
 </div>`,{});

const hatch = phone(`
 <div class="v center g20" style="min-height:660px;align-items:center;justify-content:center">
  <div style="position:relative">${pet({size:190,mood:"happy"})}
   ${[[-30,10,"#98C1E9"],[180,0,"#F29CC3"],[-10,120,"#FED57D"],[200,110,"#5BA881"],[90,-30,"#F0A351"]].map(([x,y,c])=>`<span style="position:absolute;left:${x}px;top:${y}px;width:12px;height:12px;background:${c};border-radius:${Math.random()>.5?"99px":"3px"};transform:rotate(25deg)"></span>`).join("")}</div>
  <div style="margin-top:-24px">${rug(240,34)}</div>
  <div class="lab" style="color:var(--orange-deep)">It's a baby dog!</div>
  <div class="dxl center">Hi, Mochi.</div>
  <div class="b c2 center" style="max-width:260px">Mochi grows when you two show up for each other. No chores, no guilt.</div>
  <button class="btn pri full" style="margin-top:20px">Say hi to Mochi</button>
 </div>`,{});

sec("pet","07","Pet, vibes &amp; check-in",
 "The pet room stands on its rug rather than inside a card. Check-in is a single sheet: pick a mood, add optional words, choose who sees it. Shared vibes reads as a two-column diary.",
 [shot("re","Pet room",["Speech bubble in body type, never hand","Feed / Play / Pet as three round actions","Well-being bars never empty, never red"],petRoom),
  shot("re","Check-in sheet",["3×3 creature grid, selected = ring + tint + bold label","Privacy as a segmented choice with a lock","One primary: ‘Share my vibe’"],checkin),
  shot("re","Shared vibes",["Mirrored You | Ananya columns by day","‘in sync’ only for days when you both shared","An explicit note about private check-ins"],vibes),
  shot("re","Hatch",["Confetti made of geometric shapes in three families","Display-xl greeting with the pet's name"],hatch)]);

/* ---------------- SETTINGS ---------------- */
const setRow=(i,t,s,right=ic("chev",18,"var(--ink-tertiary)"),col="var(--ink)")=>`<div class="row-i"><span style="color:${col}">${ic(i,20)}</span><div class="f1"><div class="bss" style="color:${col}">${t}</div>${s?`<div class="cap c3">${s}</div>`:""}</div>${right}</div>`;
const settings = phone(`
 <div class="v g24">
  ${pushed()}
  <div class="dl">Settings</div>
  <div class="card hz g12" style="border-radius:20px">${av("you","K","s56")}<div class="f1"><div class="h">Kabir</div><div class="cap c3">kabir@example.com</div></div><span class="cap ca">Edit</span></div>
  <div class="v"><div class="lab c3">Appearance</div>
   <div class="hz g8 mt12">${Object.entries(T).map(([id,t])=>`<div class="v g4 center f1" style="align-items:center"><div style="width:100%;aspect-ratio:1;border-radius:16px;background:${t.light.canvas};${id===cur.id?"box-shadow:0 0 0 2px var(--canvas),0 0 0 4px var(--action)":"border:1.5px solid var(--line)"};display:flex;flex-direction:column;justify-content:flex-end;padding:8px;gap:4px"><span style="height:6px;width:70%;border-radius:4px;background:${t.light.ink}"></span><span style="height:14px;border-radius:5px;background:${t.light.action}"></span><span style="height:6px;width:40%;border-radius:4px;background:${t.light.highlight}"></span></div><span class="cap" style="font-size:11px">${t.label}</span></div>`).join("")}</div>
   <div class="seg mt12"><span>System</span><span class="on">Light</span><span>Dark</span></div></div>
  <div class="v"><div class="lab c3">Notifications</div>
   ${setRow("bell","Notes & reveals","When Ananya leaves you something",`<div class="toggle on"></div>`)}
   ${setRow("paw","Pet updates","Good news only · max once a day",`<div class="toggle"></div>`)}
   ${setRow("moon","Quiet hours","11 pm – 8 am",`<span class="cap c3">On</span>`)}</div>
  <div class="v"><div class="lab c3">Our space</div>
   ${setRow("people","Ananya & Kabir","Together since 21 Apr")}
   ${setRow("paw","Mochi","Rename, pause or retire")}
   ${setRow("down","Export this space","Notes, pages, photos & answers")}</div>
  <div class="v"><div class="lab c3">Account</div>
   ${setRow("out","Sign out","")}
   ${setRow("x","Leave this space","Ananya keeps her copy",ic("chev",18,"var(--tomato-deep)"),"var(--tomato-deep)")}</div>
 </div>`,{});

const errorS = phone(`
 <div class="v g24">
  ${header("Memories","Your days, in words and photos.","plus","butter")}
  <div class="v center g12" style="align-items:center;padding-top:50px">
   <div style="transform:rotate(-8deg)">${pet({size:150,mood:"content"})}</div><div style="margin-top:-14px">${rug(200,26,"var(--sunken)")}</div>
   <div class="h mt12">Couldn't load your pages</div>
   <div class="bs c2" style="max-width:250px">You seem to be offline. Everything you saved is safe and will show up once you're back.</div>
   <button class="btn sec">Try again</button>
  </div>
 </div>`,{tab:"remember"});

const closed = phone(`
 <div class="v g24">
  ${pushed()}
  <div class="v g8"><div class="dl">Closed spaces</div><div class="bs c2">Read-only for 30 days after a space closes. Export anything you want to keep.</div></div>
  <div class="card v g12" style="border-radius:20px"><div class="hz g12"><div class="av them" style="opacity:.7">M</div><div class="f1"><div class="h">Meera &amp; Kabir</div><div class="cap c3">Closed 4 Nov · readable until 4 Dec</div></div></div>
   <div class="bar" style="background:var(--sunken);height:6px"><i style="width:55%;background:var(--line-strong)"></i></div>
   <div class="hz g8"><button class="btn sec sm f1">Read</button><button class="btn sm soft f1">${ic("down",16)} Export</button></div></div>
 </div>`,{});

sec("settings","08","Settings &amp; system states",
 "Settings is grouped by what you're deciding, with live palette previews. System states (error, closed spaces) use the same quiet language: what happened, and what to do next.",
 [shot("re","Settings",["Profile card at the top","Real palette chips + System/Light/Dark","Destructive row in tomato, last"],settings),
  shot("state","Error state",["Puzzled, tilted pet on a sunken rug","What happened + what to do + Try again"],errorS),
  shot("re","Closed spaces",["Reading window shown as a quiet bar","Read and Export side by side"],closed)]);

/* ---------------- NAV ---------------- */
const navExtra=`<div class="row" style="gap:32px">
 <div class="tabproto"><div><span class="tag">Today · 5 tabs</span><h3 style="margin-top:6px">Current</h3></div>
  <div style="position:relative;height:84px;border-radius:20px;overflow:hidden;background:var(--canvas)">${tabbar("today",TABS5)}</div>
  <div class="legend">Today · Know · Notes · Memories · Plans. Every pillar gets a tab, so Plans and Know compete for attention with Notes.</div></div>
 <div class="tabproto"><div><span class="tag rec">Prototype · 4 tabs</span><h3 style="margin-top:6px">From the roadmap</h3></div>
  <div style="position:relative;height:84px;border-radius:20px;overflow:hidden;background:var(--canvas)">${tabbar("discover",TABS4)}</div>
  <div class="legend">Today · Discover (quizzes + daily) · Notes · Memories (pages, photos, plans). Plans stay one tap away from Today's ‘Coming up’. Only ship if a usability test finds every feature in no more steps.</div></div>
</div>
<table class="compare"><tr><th>Screen</th><th>Today</th><th>This redesign</th></tr>
<tr><td>Home</td><td>Equal MomentCards stacked in priority order</td><td>One hero moment, the vibe pair, compact rows and a pet stopping point</td></tr>
<tr><td>Notes</td><td>List with a waiting state</td><td>Sealed envelope stack, opened notes as a pinboard of paper</td></tr>
<tr><td>Know</td><td>Library of tiles</td><td>Daily object + resume row + paint chips, and a reveal with a next step</td></tr>
<tr><td>Memories</td><td>Pages/photos segmented</td><td>Scrapbook pages with both voices, month-grouped grid, a ‘your turn’ prompt</td></tr>
<tr><td>Plans</td><td>Ticket list</td><td>Time sections, DONE stamp, and the plan → memory bridge</td></tr>
<tr><td>Onboarding</td><td>Welcome → sign-in → create/join</td><td>Welcome → 3-slide local preview → email → code → name → start/join</td></tr></table>`;
sec("nav","09","Navigation","Two tab-bar options, shown at the same size, plus a summary of what changes on each screen.",[],navExtra);


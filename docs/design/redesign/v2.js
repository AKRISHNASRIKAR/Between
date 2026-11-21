/* ============================================================
   V2 — second-round options. Uses helpers from kit.js.
   Direction for this round: thumb-zone primary actions, fewer
   elements per screen, one clear lead per screen, and a real
   object (deck, thread, calendar, boarding pass) per pillar.
   ============================================================ */

/* ---------- HOME · D · The Deck ---------- */
const deckBody = () => `
 <div class="v g20">
  <div class="hz sb" style="padding-top:8px">
   <div class="hz g8">${av("you","K","s28")}<div style="margin-left:-14px"><div class="av them s28">A<span class="on" style="width:10px;height:10px"></span></div></div><span class="bs c2" style="margin-left:4px">Ananya is here</span></div>
   <span class="ca">${ic("gear",22)}</span>
  </div>
  <div class="v g4"><div class="lab c3">Saturday · 21 November</div><div class="dl">Three little things</div></div>

  <div style="position:relative;height:300px;margin-top:4px">
   <div style="position:absolute;left:30px;right:30px;top:40px;bottom:-26px;border-radius:32px;background:var(--sky-base);opacity:.55"></div>
   <div style="position:absolute;left:15px;right:15px;top:20px;bottom:-13px;border-radius:32px;background:var(--purple-base);opacity:.6"></div>
   <div class="lift2" style="position:absolute;inset:0;border-radius:32px;background:var(--pink-soft);padding:22px 20px;overflow:hidden">
    <div class="hz sb"><span class="lab" style="color:var(--pink-deep)">From Ananya</span><span class="cap c3">1 of 3</span></div>
    <div class="dm mt12" style="max-width:220px">Something sealed, just for you</div>
    <div class="bs c2 mt8" style="max-width:200px">Left this afternoon, while you were out.</div>
    <div style="position:absolute;right:-20px;bottom:-12px;transform:rotate(-9deg)">${envelope(150,"#FFFDF8")}</div>
   </div>
  </div>
  <div class="hz g8" style="justify-content:center;margin-top:24px">${[1,0,0].map(o=>`<span style="width:${o?18:6}px;height:6px;border-radius:9px;background:${o?"var(--ink)":"var(--line-strong)"}"></span>`).join("")}</div>

  <div class="hz g8"><button class="btn sec md" style="flex:0 0 auto">Later</button><button class="btn pri md f1">Open the note</button></div>

  <div class="v g8">
   <div class="lab c3">Today's vibes</div>
   <div class="grid2" style="gap:8px">
    <div class="hz g8" style="background:var(--sky-soft);border-radius:999px;padding:4px 14px 4px 4px">${mood("calm",40)}<div class="v"><span class="bss">Calm</span><span class="cap c3">You</span></div></div>
    <div class="hz g8" style="background:var(--butter-soft);border-radius:999px;padding:4px 14px 4px 4px">${mood("joyful",40)}<div class="v"><span class="bss">Joyful</span><span class="cap c3">Ananya</span></div></div>
   </div>
  </div>
  <div class="hz g12" style="padding:4px 0 8px">
   <div style="width:64px;flex:none">${pet({size:64})}</div>
   <div class="bubble f1" style="font-size:13px">I'm guarding the note. Go on, open it!</div>
  </div>
 </div>`;
const homeD = phone(deckBody(),{tab:"today"});

/* ---------- WELCOME · Table spread ---------- */
const welcome2 = phone(`
 <div class="v" style="min-height:670px;justify-content:space-between">
  <div style="position:relative;height:360px;margin:0 -20px;background:var(--sunken);border-radius:0 0 32px 32px;overflow:hidden">
   <div style="position:absolute;left:22px;top:40px;transform:rotate(-12deg)" class="lift1">${envelope(150,"#FCEDED")}</div>
   <div style="position:absolute;right:20px;top:24px;width:118px;border:6px solid ${PAPER};transform:rotate(8deg)" class="lift1">${photo(0)}</div>
   <div style="position:absolute;left:30px;top:180px;transform:rotate(4deg);background:${PAPER};color:${INK};padding:10px 14px;border-radius:3px" class="lift1"><div class="hm">bring snacks x</div></div>
   <div style="position:absolute;right:30px;top:178px;transform:rotate(-5deg);width:150px" class="ticket lift1"><div class="f1"><div class="bss" style="color:${INK}">Kyoto</div><div class="cap" style="color:#596477">someday</div></div><div class="perf" style="left:70%"></div><div style="width:28px">🌸</div></div>
   <div style="position:absolute;left:50%;bottom:-6px;transform:translateX(-50%)">${pet({size:150,mood:"happy"})}</div>
  </div>
  <div class="v g12" style="padding-top:22px">
   <div class="dxl">Between</div>
   <div class="b c2">A private little world for two: notes, questions, memories and plans.</div>
  </div>
  <div class="v g8 mt16"><button class="btn pri full">Start our space</button><button class="btn quiet" style="align-self:center">I have a code · Sign in</button></div>
 </div>`,{});

/* ---------- KNOW · Today first ---------- */
const know2 = phone(`
 <div class="v g24">
  <div class="dm" style="padding-top:8px">Know each other</div>
  <div style="background:var(--purple-soft);border-radius:32px;padding:22px 20px 20px;position:relative;overflow:hidden;min-height:270px" class="v sb">
   <div style="position:absolute;right:-18px;top:-14px;opacity:.95">${qmark(120)}</div>
   <div class="lab" style="color:var(--purple-deep)">Today's question</div>
   <div class="dl" style="font-size:30px;line-height:34px;padding-right:40px;margin-top:40px">What would Ananya order at a new café?</div>
   <div class="hz sb mt16"><div class="hz g8">${av("them","A","s28")}<span class="cap c2">Answered · waiting on you</span></div></div>
   <button class="btn pri full mt12">Answer</button>
  </div>
  <div class="v g12">
   <div class="hz sb"><span class="h">Packs</span><span class="cap ca">See all</span></div>
   <div class="hz g12" style="overflow-x:auto;margin:0 -20px;padding:0 20px 4px;scroll-snap-type:x mandatory;scrollbar-width:none">
    ${[["about","About me","#008471","#FFFDF8",6],["fav","Favorites","#F4D242","#6D1F42",8],["us","Us","#FF7BAC","#6D1F42",6],["chaos","Chaos","#C62A29","#FCEDED",10],["pers","Personality","#6D1F42","#D3B6D3",8]].map(([k,t,f,c,n])=>`<div style="flex:0 0 128px;scroll-snap-align:start;background:${f};color:${c};border-radius:20px;padding:14px;height:170px;display:flex;flex-direction:column;justify-content:space-between">${cat(k,48)}<div><div class="bss">${t}</div><div class="cap" style="opacity:.85">${n} questions</div></div></div>`).join("")}
   </div>
  </div>
  <div class="v g8">
   <span class="h">Lately</span>
   ${[["Favorites","6 of 8 matched","Same brain",true],["Love languages","You're 4 of 8 in","Keep going",false]].map(([t,s,b,done])=>`<div class="hz g12" style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="f1"><div class="bss">${t}</div><div class="cap c3">${s}</div></div><span class="chip" style="background:${done?"var(--green-soft)":"var(--sunken)"};color:${done?"var(--green-deep)":"var(--ink-secondary)"}">${b}</span></div>`).join("")}
  </div>
 </div>`,{tab:"know"});

/* ---------- NOTES · Correspondence ---------- */
const bubbleNote=(side,txt,stock,meta)=>`<div style="display:flex;justify-content:${side==="l"?"flex-start":"flex-end"}"><div class="paper lift1" style="max-width:76%;background:${stock};color:${INK};padding:12px 14px 8px;transform:rotate(${side==="l"?-1:1}deg)"><div class="hm" style="font-size:21px;line-height:24px">${txt}</div><div class="cap" style="opacity:.55;margin-top:4px;text-align:${side==="l"?"left":"right"}">${meta}</div></div></div>`;
const notes2 = phone(`
 <div class="v g16" style="padding-bottom:70px">
  <div class="hz sb" style="padding-top:8px"><div class="v"><div class="dm">Notes</div><div class="cap c3">You &amp; Ananya · 48 notes</div></div><button class="ibtn">${ic("image",20)}</button></div>
  <div class="center cap c3">Thursday</div>
  ${bubbleNote("l","you looked so happy at the market today",PAPER,"Ananya · 4:12 pm")}
  ${bubbleNote("r","you were the reason",ART.sky[1],"You · 4:30 pm · ♥")}
  <div class="center cap c3">Today</div>
  ${bubbleNote("r","dinner is on me tonight. and the playlist.","#E9D8BC","You · 6:02 pm · opened")}
  <div style="display:flex"><div class="lift2" style="position:relative;transform:rotate(-2deg)">${envelope(200,"#FCEDED")}<div style="position:absolute;left:0;right:0;bottom:-34px" class="hz g8"><span class="cap c3">Ananya · sealed</span></div></div></div>
  <div style="height:20px"></div>
 </div>`,{tab:"notes",overlay:`<div style="position:absolute;left:12px;right:12px;bottom:94px;z-index:16" class="hz g8"><div class="field f1 lift1" style="border-radius:999px;height:48px;border-color:var(--line)"><span class="ph">Write to Ananya…</span></div><button class="ibtn big" style="background:var(--action);color:var(--on-action)" aria-label="Write a note">${ic("pen",20)}</button></div>`});

/* ---------- MEMORIES · Month mosaic ---------- */
const days=[...Array(30)].map((_,i)=>i+1), photoDays={3:2,7:5,10:0,15:4,17:1,19:3,21:-1};
const memories2 = phone(`
 <div class="v g20">
  ${header("Memories","",  "plus","butter")}
  <div class="hz sb"><button class="ibtn">${ic("back",18)}</button><div class="h">November 2026</div><button class="ibtn">${ic("chev",18)}</button></div>
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">
   ${["M","T","W","T","F","S","S"].map(d=>`<div class="cap c3 center">${d}</div>`).join("")}
   <div></div><div></div><div></div><div></div><div></div><div></div>
   ${days.map(d=>{const p=photoDays[d];return `<div style="aspect-ratio:1;border-radius:10px;overflow:hidden;position:relative;${p===-1?"border:1.5px dashed var(--action)":p===undefined?"background:var(--sunken)":""};${d===17?"box-shadow:0 0 0 2px var(--canvas),0 0 0 4px var(--action)":""}">${p>=0&&p!==undefined?photo(p):""}<span class="cap" style="position:absolute;left:5px;top:3px;font-size:10px;font-weight:700;${p>=0&&p!==undefined?"color:#fff;text-shadow:0 1px 2px #0006":"color:var(--ink-tertiary)"}">${d}</span></div>`}).join("")}
  </div>
  <div class="card c16 v g8 lift1" style="border-radius:20px">
   <div class="hz sb"><div class="v"><span class="lab c3">Tue 17 Nov</span><span class="h">Dosa night</span></div><div class="hz">${av("them","A","s28")}<div style="margin-left:-8px">${av("you","K","s28")}</div></div></div>
   <div class="bs c2">"best dosa of my life. the chutney!!" · 2 photos</div>
  </div>
 </div>`,{tab:"remember"});

/* ---------- PLANS · Next up ---------- */
const plans2 = phone(`
 <div class="v g24">
  ${header("Our plans","","plus","green")}
  <div class="lift2" style="position:relative;background:var(--paper);border-radius:6px;overflow:hidden">
   <div style="background:var(--green-base);color:${INK};padding:16px 18px" class="hz sb"><span class="lab">Next up</span><span class="lab">Sat 28 Nov</span></div>
   <div style="padding:18px" class="v g12">
    <div class="dm">Pottery class</div>
    <div class="hz g16"><div class="v"><span class="cap c3">Time</span><span class="bss">3:00 pm</span></div><div class="v"><span class="cap c3">Where</span><span class="bss">Clay Co.</span></div><div class="v"><span class="cap c3">Idea</span><span class="bss">Ananya</span></div></div>
   </div>
   <div style="border-top:2px dashed var(--line);margin:0 14px;position:relative"><span style="position:absolute;left:-23px;top:-10px;width:18px;height:18px;border-radius:99px;background:var(--canvas)"></span><span style="position:absolute;right:-23px;top:-10px;width:18px;height:18px;border-radius:99px;background:var(--canvas)"></span></div>
   <div class="hz sb" style="padding:14px 18px"><div class="hz" style="align-items:baseline;gap:6px"><span class="num" style="font-size:40px;line-height:40px;color:var(--green-deep)">7</span><span class="bss c2">days to go</span></div><span style="font-size:30px">🏺</span></div>
  </div>
  <div class="v"><div class="lab c3" style="margin-bottom:4px">Then</div>
   ${[["30","Nov","Call Nani together","Sunday · any time"],["12","Dec","Sunrise hike","Nandi Hills · 5 am"]].map(([d,m,t,s])=>`<div class="hz g16" style="padding:12px 0;border-bottom:1px solid var(--line)"><div class="v center" style="width:40px"><span style="font-family:Fraunces;font-weight:600;font-size:22px;line-height:24px">${d}</span><span class="labs c3">${m}</span></div><div class="f1"><div class="bss">${t}</div><div class="cap c3">${s}</div></div>${ic("chev",18,"var(--ink-tertiary)")}</div>`).join("")}
  </div>
  <div class="v g8"><div class="hz sb"><span class="lab c3">Someday</span><span class="cap ca">12 done</span></div>
   <div class="hz g8 wr">${["🌸 Kyoto","🥟 Momos","🎻 A concert","🏕️ Camping"].map(t=>`<span class="chip" style="background:var(--sunken);color:var(--ink)">${t}</span>`).join("")}</div></div>
 </div>`,{tab:"future"});

/* ---------- PET · Room scene ---------- */
const pet2 = phone(`
 <div style="position:absolute;inset:0 0 auto 0;height:430px;background:var(--orange-soft)">
  <div style="position:absolute;left:36px;top:70px;width:90px;height:110px;border-radius:45px 45px 8px 8px;background:var(--sky-soft);box-shadow:inset 0 0 0 6px var(--paper)"></div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:90px;background:color-mix(in srgb,var(--orange-base) 22%,var(--orange-soft))"></div>
 </div>
 <div class="v g16" style="position:relative">
  ${pushed(`<span class="chip" style="background:var(--paper);color:var(--ink)">Baby · day 41</span>`)}
  <div class="v center" style="align-items:center;position:relative;height:300px;justify-content:flex-end">
   <div class="bubble" style="position:absolute;top:10px;right:0;max-width:170px">Ananya fed me! I could eat again though.</div>
   ${pet({size:210,mood:"happy",bowl:true})}
  </div>
  <div class="card v g16 lift2" style="border-radius:28px;margin-top:6px">
   <div class="hz sb"><div class="dm">Mochi</div><span class="cap c3">Happy · loved</span></div>
   <div class="grid3" style="gap:8px">${[["Fullness","orange",.45,"peckish"],["Energy","sky",.8,"bouncy"],["Love","pink",.9,"so loved"]].map(([l,f,v,w])=>`<div class="v g4"><span class="cap c3">${l}</span><div class="bar" style="background:var(--${f}-soft);flex:none;height:8px"><i style="width:${v*100}%;background:var(--${f}-base)"></i></div><span class="hm" style="font-size:19px;color:var(--${f}-deep)">${w}</span></div>`).join("")}</div>
   <div class="grid3" style="gap:8px">${[["bowl","Feed",1],["ball","Play"],["heart","Pet"]].map(([i,l,p])=>`<button class="btn md ${p?"pri":"soft"}" style="padding:0">${ic(i,18)} ${l}</button>`).join("")}</div>
  </div>
 </div>`,{});

/* ---------- CHECK-IN · Full screen ---------- */
const checkin2 = phone(`
 <div class="v g20" style="min-height:670px">
  <div class="hz sb" style="padding-top:6px"><button class="ibtn">${ic("x",20)}</button><span class="cap c3">Check-in</span><span style="width:44px"></span></div>
  <div class="dl">How are you, Kabir?</div>
  <div class="v center" style="align-items:center;padding:6px 0"><div style="background:var(--purple-soft);border-radius:999px;padding:18px">${mood("sensitive",120)}</div><div class="dm mt12">Sensitive</div></div>
  <div class="hz g8" style="overflow-x:auto;margin:0 -20px;padding:4px 20px;scrollbar-width:none">
   ${["joyful","calm","excited","grateful","connected","sensitive","tired","stressed","hurt","confused","insecure","angry"].map(k=>`<div class="v center g4" style="flex:0 0 62px;align-items:center;padding:6px 0;border-radius:16px;${k==="sensitive"?"background:var(--action-soft);box-shadow:0 0 0 2px var(--action) inset":""}">${mood(k,44)}<span class="cap" style="font-size:11px;${k==="sensitive"?"font-weight:700;color:var(--on-action-soft)":""}">${MOODS[k].label}</span></div>`).join("")}
  </div>
  <div class="field"><span class="ph">A few words, if you like</span></div>
  <div class="v g8" style="margin-top:auto">
   <div class="seg"><span class="on">Share with Ananya</span><span>${ic("lock",13)} Just me</span></div>
   <button class="btn pri full">Save check-in</button>
  </div>
 </div>`,{});

/* ---------- SETTINGS · Inset groups ---------- */
const group=(rows)=>`<div style="background:var(--paper);border-radius:20px;padding:0 16px">${rows.map((r,i)=>(i?`<div class="hair" style="margin-left:44px"></div>`:"")+r).join("")}</div>`;
const tileRow=(i,f,t,right=ic("chev",18,"var(--ink-tertiary)"),col="var(--ink)")=>`<div class="row-i" style="min-height:52px"><span style="width:30px;height:30px;border-radius:9px;background:var(--${f}-soft);color:var(--${f}-deep);display:grid;place-items:center;flex:none">${ic(i,17)}</span><span class="bss f1" style="color:${col}">${t}</span>${right}</div>`;
const settings2 = phone(`
 <div class="v g20">
  ${pushed()}
  <div class="v center g8" style="align-items:center">
   <div class="hz">${av("you","K","s56")}<div style="margin-left:-14px">${av("them","A","s56")}</div></div>
   <div class="dm">Kabir &amp; Ananya</div><div class="cap c3">Together on Between for 214 days</div>
  </div>
  <div class="v g8"><span class="lab c3" style="padding-left:4px">Look</span>
   ${group([tileRow("palette","pink","Colours",`<span class="cap c3">${T[cur.id].label}</span>`),tileRow("moon","purple","Brightness",`<span class="cap c3">System</span>`)])}</div>
  <div class="v g8"><span class="lab c3" style="padding-left:4px">Notifications</span>
   ${group([tileRow("bell","sky","Notes &amp; reveals",`<div class="toggle on"></div>`),tileRow("paw","orange","Pet updates",`<div class="toggle"></div>`),tileRow("clock","green","Quiet hours",`<span class="cap c3">11 pm–8 am</span>`)])}</div>
  <div class="v g8"><span class="lab c3" style="padding-left:4px">Our space</span>
   ${group([tileRow("paw","butter","Mochi"),tileRow("down","teal","Export everything"),tileRow("shield","sky","Privacy")])}</div>
  ${group([tileRow("out","purple","Sign out",""),tileRow("x","tomato","Leave this space","", "var(--tomato-deep)")])}
 </div>`,{});

/* ---------- NAV options (same home, different tab bars) ---------- */
const nav5 = phone(deckBody(),{tab:"today",tabs:TABS5});
const nav4 = phone(deckBody(),{tab:"today",tabs:TABS4});

/* ============================================================
   PAGES — decisions for the studio. Options compete; "flow" are
   supporting screens shown under the decision (not chosen).
   ============================================================ */
const V1 = id => Object.fromEntries((SECTIONS.find(s=>s.id===id)||{shots:[]}).shots.map((x,i)=>[i,x]));
const opt=(id,label,round,notes,html)=>({id,label,round,notes,html});
const flow=(label,html)=>({label,html});
const h=V1("home"), on=V1("onboarding"), kn=V1("know"), nt=V1("notes"), rm=V1("remember"), fu=V1("future"), pe=V1("pet"), se=V1("settings");

const PAGES=[
 {id:"home",title:"Home · Today",q:"Which home layout should Between lead with?",
  options:[opt("A","Letterbox",1,h[0].notes,h[0].html),opt("B","The Spread",1,h[1].notes,h[1].html),opt("C","Two sides",1,h[2].notes,h[2].html),
   opt("D","The Deck",2,["One moment at a time as a card deck; the next two peek behind","Primary action sits in the thumb zone, with a ‘Later’ escape","Vibes shrink to two pills; the pet gives a single line of voice"],homeD)],
  flow:[flow("Not paired yet",h[3].html),flow("All caught up",h[4].html),flow("Notice arriving",h[5].html)]},
 {id:"welcome",title:"Welcome",q:"Which first impression?",
  options:[opt("A","Headline first",1,on[0].notes,on[0].html),
   opt("B","Table spread",2,["The app's objects scattered on a table: envelope, photo, note, ticket","Brand name as the hero, with a single primary action","Sign in and the invite code share one quiet link"],welcome2)],
  flow:[1,2,3,4,5,6,7,8].map(i=>flow(on[i].title,on[i].html))},
 {id:"know",title:"Know · quizzes",q:"How should the Know tab open?",
  options:[opt("A","Library",1,kn[0].notes,kn[0].html),
   opt("B","Today first",2,["Today's question becomes the hero, answerable in one tap","Packs move to a horizontal shelf of paint chips","‘Lately’ shows results as words (‘Same brain’), not scores"],know2)],
  flow:[1,2,3].map(i=>flow(kn[i].title,kn[i].html))},
 {id:"notes",title:"Notes",q:"Pinboard or correspondence?",
  options:[opt("A","Envelopes & pinboard",1,nt[0].notes,nt[0].html),
   opt("B","Correspondence",2,["A thread of paper notes: hers on the left, yours on the right","The sealed note sits at the end of the thread, waiting","Docked compose bar, so writing back is always one tap away"],notes2)],
  flow:[1,2,3].map(i=>flow(nt[i].title,nt[i].html))},
 {id:"memories",title:"Memories",q:"Scrapbook feed or month mosaic?",
  options:[opt("A","Scrapbook pages",1,rm[0].notes,rm[0].html),
   opt("B","Month mosaic",2,["A calendar where every day with a page shows its photo","Today is a dashed cell, an open invitation","Tap a day for a preview card with both authors"],memories2)],
  flow:[1,2,3].map(i=>flow(rm[i].title,rm[i].html))},
 {id:"plans",title:"Plans",q:"Ticket list or next-up boarding pass?",
  options:[opt("A","Ticket list",1,fu[0].notes,fu[0].html),
   opt("B","Next up",2,["The next plan as a boarding pass with a countdown","Upcoming plans as a date column; dreams as chips","Done count stays a quiet link"],plans2)],
  flow:[flow(fu[1].title,fu[1].html)]},
 {id:"pet",title:"Pet room",q:"Pet on a rug, or a room of its own?",
  options:[opt("A","On the rug",1,pe[0].notes,pe[0].html),
   opt("B","Room scene",2,["A full-bleed room with a window: Mochi has a place","Well-being as three compact columns","Feed / Play / Pet docked as buttons, Feed as the primary"],pet2)],
  flow:[flow(pe[3].title,pe[3].html),flow(pe[2].title,pe[2].html)]},
 {id:"checkin",title:"Check-in",q:"Quick sheet or a full-screen moment?",
  options:[opt("A","Bottom sheet",1,pe[1].notes,pe[1].html),
   opt("B","Full screen",2,["The chosen mood is large and centred, so it feels considered","All 12 moods on one swipeable shelf","Privacy choice sits right above the save button"],checkin2)],
  flow:[]},
 {id:"settings",title:"Settings",q:"Which settings layout?",
  options:[opt("A","Flat list",1,se[0].notes,se[0].html),
   opt("B","Inset groups",2,["Opens on the two of you, not an account","Rows sit in rounded groups with coloured icon tiles","Destructive actions get a group of their own, last"],settings2)],
  flow:[flow(se[1].title,se[1].html),flow(se[2].title,se[2].html)]},
 {id:"nav",title:"Navigation",q:"Five tabs or four?",
  options:[opt("A","5 tabs (today)",1,["Every pillar has a tab","Plans and Know compete with Notes for attention"],nav5),
   opt("B","4 tabs (roadmap)",2,["Discover = quizzes + daily; Memories holds pages, photos and plans","Fewer choices; Plans stay one tap from Today","Only ship if a usability test finds every feature in no more steps"],nav4)],
  flow:[]}
];

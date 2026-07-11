/* =====================================================================
   STILL BREATHING — engine.js
   State, scenario select, rendering, choice resolution, the Grip mirage,
   vitals/kit HUD, day clock, persistence, galleries, the three-ordeal
   meta, debug (~).
   ===================================================================== */
(() => {
const NODES=STORY.nodes, ENDINGS=STORY.endings, REGIONS=STORY.regions,
      ITEMS=STORY.items, LOGS=STORY.logs, REALS=STORY.reals,
      SCENARIOS=STORY.scenarios, H=STORY.helpers;
const VITALS=['grip','warmth','water','food','body'];
const NIGHT=new Set(['night','raftnight','slotnight','sinking','stormnight']);
const NSCEN=Object.keys(SCENARIOS).length;
const K_PERSIST='sb_persist', K_RUN='sb_run';
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------------- persistent state ---------------- */
function loadP(){
  try{ const p=JSON.parse(localStorage.getItem(K_PERSIST)); if(p) return Object.assign(defP(),p); }catch(e){}
  return defP();
}
function defP(){ return { runs:0, endings:{}, survived:{}, winter:{}, logbook:[], reals:[],
  lastEnding:null, lastEndingTitle:null, lastKind:null, playerName:'', bestDays:{},
  badges:{}, comboWins:{}, diedIn:{}, causeCounts:{}, readDebrief:false }; }
function saveP(){ localStorage.setItem(K_PERSIST, JSON.stringify(P)); }
let P=loadP();

/* ---------------- run state ---------------- */
function newRun(name, scen, picks, winter){
  const s=SCENARIOS[scen];
  const run={ name:name||P.playerName||'you', scenario:scen, node:s.start,
    v:Object.assign({grip:4,warmth:4,water:4,food:4,body:4}, s.vitals||{}),
    kit:(s.kit||[]).slice(), rescue:0, goal:s.goal, days:1, flags:{}, log:[],
    trail:[], winter:!!winter, usedPocket:false,
    picks:(picks||[]).slice().sort().join('+') };
  (picks||[]).forEach(id=>{ if(!run.kit.includes(id)) run.kit.push(id); });
  if(run.kit.includes('wool')) run.v.warmth=clamp(run.v.warmth+1,0,6);
  if(run.kit.includes('bars')) run.flags.bars=2;
  if(winter) VITALS.forEach(k=>run.v[k]=Math.max(2,run.v[k]-1));
  run.lows=Object.assign({},run.v);
  return run;
}
let S=null;
function saveRun(){ if(S) localStorage.setItem(K_RUN, JSON.stringify(S)); }
function clearRun(){ localStorage.removeItem(K_RUN); }
function loadRun(){ try{ return JSON.parse(localStorage.getItem(K_RUN)); }catch(e){ return null; } }

/* ---------------- helpers ---------------- */
const fmt=(t)=> String(typeof t==='function'?t(S,P):t).replace(/\{NAME\}/g, S?S.name:'you');
function rngStr(seed){ let h=2166136261;
  for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619);}
  return ()=>{ h=Math.imul(h^h>>>15,2246822507); h=Math.imul(h^h>>>13,3266489909);
    return ((h^=h>>>16)>>>0)/4294967296; }; }

/* the mind wanders: at low Grip the words waver (hypothermic / dehydrated cognition).
   In the Long Winter the wavering never fully leaves. */
function mirage(text, seed){
  if(!S) return text;
  const thr=S.winter?6:2;
  if(S.v.grip>thr) return text;
  const p=S.v.grip<=0?.22:S.v.grip===1?.14:S.v.grip===2?.08:.04;
  const r=rngStr(seed);
  return text.split(' ').map(w=>{
    if(w.length<4 || /[<>]/.test(w) || r()>p) return w;
    const chars=w.split(''); const i=1+Math.floor(r()*(chars.length-2));
    const sw={a:'â',e:'ê',i:'î',o:'ô',u:'û',s:'ʃ',n:'ñ',r:'ř',t:'ţ',l:'ĺ'};
    chars[i]=sw[chars[i].toLowerCase()]||chars[chars.length-2];
    return `<span class="corrupt-word">${chars.join('')}</span>`;
  }).join(' ');
}
const MIRAGE_LURE=['your body is already sure','this is the sensible thing','it would feel so good',
  'the easy way, right there','yes — this one','nothing could be simpler'];

/* ---------------- screens ---------------- */
function show(id){ ['title-screen','game-screen','ending-screen','name-screen','select-screen','loadout-screen','gallery']
  .forEach(s=>$(s).classList.toggle('hidden', s!==id)); }

/* ---------------- scene painter: generated still first, SVG fallback,
   crossfading between scenes; the same scene keeps drifting untouched -- */
function paintScene(el, key, seed){
  if (typeof IMAGES!=='undefined' && IMAGES.has(key)){
    const cur=el.querySelector('img.scene-img');
    if (cur && cur.dataset.key===key) return;
    const img=document.createElement('img');
    img.className='scene-img'; img.dataset.key=key; img.alt='';
    img.style.opacity='0';
    img.onerror=()=>ART.paint(el, key, seed);
    const reveal=()=>{ setTimeout(()=>{ img.style.opacity='1'; }, 30);
      setTimeout(()=>{ [...el.children].forEach(c=>{ if(c!==img) c.remove(); }); }, 1000); };
    img.onload=reveal;
    img.src=IMAGES.url(key);
    el.appendChild(img);
    if (img.complete && img.naturalWidth>0) reveal();
  } else ART.paint(el, key, seed);
}

/* ---------------- title ---------------- */
function titleScreen(){
  show('title-screen');
  paintScene($('title-art'),'title','run'+P.runs);
  AUDIO.setScene('title',0,4);
  $('btn-continue').classList.toggle('hidden', !loadRun());
  const res=$('title-residue'); const done=Object.values(P.survived).filter(Boolean).length;
  if(P.runs>0){
    let m = P.lastKind==='death'
      ? `Last time, it ended: “${P.lastEndingTitle}.”`
      : P.lastEndingTitle ? `Last time, you made it. “${P.lastEndingTitle}.”` : 'You have been out there before.';
    if(done>0) m+=`<br>${done} of ${NSCEN} ordeals survived. ${done===NSCEN?'You know now what the survivors know.':'The others are still waiting.'}`;
    res.innerHTML=m;
  } else res.textContent='';
}
$('btn-begin').onclick=openSelect;
$('select-close').onclick=titleScreen;
function openSelect(){
  show('select-screen');
  const grid=$('scenario-grid'); grid.innerHTML='';
  Object.keys(SCENARIOS).forEach(k=>{
    const s=SCENARIOS[k]; const done=P.survived[k];
    const card=document.createElement('div'); card.className='scn-card';
    const artHost=document.createElement('div'); artHost.className='scn-art';
    const cardUrl = typeof IMAGES!=='undefined' && IMAGES.card(k);
    if (cardUrl){ artHost.innerHTML=`<img class="scene-img" src="${cardUrl}" alt="">`;
      artHost.firstChild.onerror=()=>ART.paint(artHost, s.art, k+'card'); }
    else ART.paint(artHost, s.art, k+'card');
    card.appendChild(artHost);
    card.insertAdjacentHTML('beforeend',
      `<div class="scn-body"><div class="scn-tag">${s.tag}</div>
       <div class="scn-name">${s.name}</div><div class="scn-desc">${s.desc}</div>
       <div class="scn-status ${done?'done':''}">${done?'✓ survived — '+(P.bestDays[k]||1)+' day'+((P.bestDays[k]||1)>1?'s':''):'not yet survived'}${P.winter[k]?' <span class="scn-winter" title="survived the Long Winter">❄</span>':''}</div></div>`);
    card.onclick=()=>{ pendingScen=k; $('name-input').value=P.playerName||''; show('name-screen'); $('name-input').focus(); };
    grid.appendChild(card);
  });
}
let pendingScen='white', pendingName='you', picks=new Set(), winterOn=false;
$('name-go').onclick=toLoadout;
$('name-input').addEventListener('keydown',e=>{ if(e.key==='Enter') toLoadout(); });
function toLoadout(){
  pendingName=($('name-input').value.trim()||'you').slice(0,16);
  P.playerName=pendingName; saveP();
  picks=new Set(); winterOn=false;
  paintLoadout(); show('loadout-screen');
}
/* ---------------- the pocket kit ---------------- */
function limit(){ return winterOn?2:3; }
function paintLoadout(){
  const unlocked=!!P.survived[pendingScen];
  const wt=$('winter-toggle');
  wt.classList.toggle('hidden', !unlocked);
  wt.classList.toggle('on', winterOn);
  $('loadout-sub').textContent = winterOn
    ? 'The Long Winter. You were carrying less, and the cold had a head start. Choose two.'
    : 'Before it went wrong, you had room in your pockets for three small things. Choose what you were carrying.';
  const grid=$('loadout-grid'); grid.innerHTML='';
  STORY.loadout.forEach(id=>{
    const it=ITEMS[id];
    const card=document.createElement('button'); card.type='button';
    card.className='load-item'+(picks.has(id)?' picked':'');
    card.innerHTML=`<span class="li-name">${it.name}</span><span class="li-desc">${it.desc}</span>`;
    card.onclick=()=>{
      if(picks.has(id)) picks.delete(id);
      else if(picks.size<limit()) picks.add(id);
      paintLoadout();
    };
    grid.appendChild(card);
  });
  $('loadout-count').textContent=`${picks.size} of ${limit()} chosen`;
  const go=$('loadout-go');
  go.disabled=picks.size!==limit();
  go.textContent = picks.size===limit() ? (winterOn?'Into the Long Winter':'Begin') : `Choose ${limit()-picks.size} more`;
}
$('winter-toggle').onclick=()=>{ winterOn=!winterOn;
  while(picks.size>limit()){ picks.delete([...picks].pop()); }
  paintLoadout(); };
$('loadout-back').onclick=()=>openSelect();
$('loadout-go').onclick=()=>{
  if(picks.size!==limit()) return;
  S=newRun(pendingName, pendingScen, [...picks], winterOn);
  show('game-screen'); render(S.node);
};
$('btn-continue').onclick=()=>{ const r=loadRun(); if(!r) return titleScreen();
  S=r; show('game-screen'); render(S.node); };

/* ---------------- galleries ---------------- */
let galleryReturn=null;
function gallery(title, sub, bodyHTML){
  $('gallery-title').textContent=title;
  $('gallery-body').innerHTML=`<div class="gallery-sub">${sub}</div>`+bodyHTML;
  show('gallery');
}
$('gallery-close').onclick=()=>{ if(galleryReturn==='ending'){ galleryReturn=null; return show('ending-screen'); }
  galleryReturn=null; titleScreen(); };
$('btn-outcomes').onclick=()=>{
  const ids=Object.keys(ENDINGS);
  const found=ids.filter(i=>P.endings[i]).length;
  gallery('Ways It Ended', `${found} of ${ids.length} outcomes reached`,
    `<div class="grid-cells">`+ids.map(i=>{
      const e=ENDINGS[i];
      return P.endings[i]
        ? `<div class="cell k-${e.kind}"><span class="ek">${e.kind==='survive'?'survived':e.kind==='true'?'the truth':'died'}</span>${e.title}<span style="opacity:.5;font-size:10px"> ×${P.endings[i]}</span></div>`
        : `<div class="cell locked">— not yet —</div>`;
    }).join('')+`</div>`);
};
$('btn-log').onclick=()=>{
  const ids=Object.keys(LOGS);
  gallery('The Log', 'The lines you wrote to keep your head. A survivor keeps a record — it is how the mind stays a mind.',
    `<div class="log-list">`+ids.map(id=>{
      const l=LOGS[id]; const got=P.logbook.includes(id);
      return got
        ? `<div class="log-item">“${l.line}”<span class="log-src">${l.src}</span></div>`
        : `<div class="log-item locked">— a page not yet written —</div>`;
    }).join('')+`</div>`);
};
$('btn-notes').onclick=()=>{
  const got=Object.keys(P.badges).length;
  gallery('Field Notes', `${got} of ${STORY.badges.length} notes earned — the unglamorous proofs of competence.`,
    `<div class="badge-grid">`+STORY.badges.map(b=>{
      const has=!!P.badges[b.id];
      return has
        ? `<div class="badge-cell"><span class="bt-ico">${b.icon}</span><b>${b.name}</b><span>${b.desc}</span></div>`
        : `<div class="badge-cell locked"><span class="bt-ico">·</span><b>— unearned —</b><span>${b.desc}</span></div>`;
    }).join('')+`</div>`);
};
$('btn-real').onclick=()=>{
  const ids=Object.keys(REALS);
  gallery('They Came Back',
    'Every ordeal here is built from a real one. These people did the small, unglamorous, clear-headed things — and lived. Survive an ordeal to uncover the one behind it.',
    ids.map(id=>{
      const rl=REALS[id]; const got=P.reals.includes(id);
      return got
        ? `<div class="real-entry"><div class="real-name">${rl.name}</div><div class="real-what">${rl.what}</div><div class="real-body">${rl.body}</div></div>`
        : `<div class="real-entry locked">someone came back from this. survive it, and learn who.</div>`;
    }).join(''));
};

/* ---------------- day clock rail: the carved tally wall ---------------- */
function paintRail(){
  const night=NIGHT.has(NODES[S.node].region);
  const r=rngStr('rail'+S.scenario+S.days);
  let s=`<svg viewBox="0 0 42 500" preserveAspectRatio="xMidYMin meet">`;
  // old scratches in the wall behind the count
  for(let i=0;i<6;i++){ const x=5+r()*32;
    s+=`<path d="M${x},${34+r()*70} q${(r()-.5)*5},${160+r()*180} ${(r()-.5)*7},${300+r()*150}" stroke="#131a21" stroke-width="${.8+r()*.8}" fill="none" opacity="${.35+r()*.35}"/>`; }
  // sky disc: sun, or a crescent cut from the dark
  if(night){
    s+=`<circle cx="21" cy="29" r="9.5" fill="#cfd8e0"/><circle cx="26" cy="26" r="8.5" fill="#070b0f"/>`
     +Array.from({length:5},()=>`<circle cx="${8+r()*28}" cy="${12+r()*32}" r="${.6+r()*.7}" fill="#8fa8c0" opacity="${.4+r()*.5}"/>`).join('');
  } else {
    s+=`<circle cx="21" cy="29" r="8.2" fill="none" stroke="#f2b24a" stroke-width="1.6" opacity=".9"/><circle cx="21" cy="29" r="4.2" fill="#f2b24a"/>`
     +Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;
       return `<line x1="${21+Math.cos(a)*11.5}" y1="${29+Math.sin(a)*11.5}" x2="${21+Math.cos(a)*14.5}" y2="${29+Math.sin(a)*14.5}" stroke="#f2b24a" stroke-width="1.4" opacity=".8"/>`;}).join('');
  }
  s+=`<text x="21" y="60" text-anchor="middle" font-size="7.5" fill="#5f6a72" font-family="sans-serif" font-weight="600" letter-spacing="2.5">DAY</text>`;
  s+=`<text x="21" y="80" text-anchor="middle" font-size="19" fill="#e6603a" font-family="sans-serif" font-weight="800" letter-spacing="1">${S.days}</text>`;
  s+=`<line x1="10" y1="90" x2="32" y2="90" stroke="#1d2833" stroke-width="1"/>`;
  // the count, carved: groups of five, the fifth cut struck across; today's cut is fresh
  const shown=Math.min(S.days,20);
  for(let i=0;i<shown;i++){
    const grp=(i/5)|0, k=i%5, y=104+grp*27;
    const fresh = i===S.days-1;
    const col = fresh ? '#e7e3d8' : '#77827b';
    const op = fresh ? 1 : .38+.4*(i/Math.max(1,shown-1));
    const jx=(r()-.5)*2.6, jy=(r()-.5)*2.4;
    if(k===4){
      s+=`<path d="M6,${y-2+jy} L${20+jx},${y+6} L34,${y+13+jy}" stroke="${col}" stroke-width="${fresh?2.6:2}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
    } else {
      const x=9.5+k*5.6;
      s+=`<path d="M${x},${y} q${jx*.4},${7} ${jx},${13+jy}" stroke="${col}" stroke-width="${fresh?2.6:2}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
    }
    if(fresh) s+=`<circle cx="${k===4?34:9.5+k*5.6+jx}" cy="${y+(k===4?13:13+jy)+3.5}" r="1.3" fill="#e6603a" opacity=".9"/>`;
  }
  if(S.days>20) s+=`<text x="21" y="${104+4*27+18}" text-anchor="middle" font-size="10" fill="#77827b" font-family="sans-serif">+${S.days-20}</text>`;
  $('clock-rail').innerHTML=s+`</svg>`;
}

/* ---------------- HUD: field gauges ---------------- */
const ICO={
  grip:['M12 3c-1.1 3-2.6 4.7-3.9 6.4C6.8 11.1 6 12.7 6 14.5 6 18 8.7 20.5 12 20.5s6-2.5 6-6c0-1.8-.8-3.4-2.1-5.1C14.6 7.7 13.1 6 12 3Z',
        'M12 12.6c-1.5 1.2-2.3 2.3-2.3 3.5 0 1.4 1 2.4 2.3 2.4s2.3-1 2.3-2.4c0-1.2-.8-2.3-2.3-3.5Z'],
  warmth:['M10.4 5a1.6 1.6 0 0 1 3.2 0v8.2a4.2 4.2 0 1 1-3.2 0ZM15.5 7.5h2.5M15.5 10.5h2.5',
        'M11.2 9h1.6v6.2a2.4 2.4 0 1 1-1.6 0Z'],
  water:['M12 3.5C9.8 7 7.4 9.9 7.4 13.1a4.6 4.6 0 0 0 9.2 0C16.6 9.9 14.2 7 12 3.5Z',
        'M10.4 13.2c0 1.4.7 2.4 1.8 2.7-1.9.3-3.2-.9-3.2-2.6 0-1 .5-2.2 1.4-3.6-.1 1.3 0 2.5 0 3.5Z'],
  food:['M3 12q4.5-5.5 10.3-5.5 3 0 5.2 2.6L22 6.8v10.4l-3.5-2.3q-2.2 2.6-5.2 2.6Q7.5 17.5 3 12Z',
        'M8 11.2a1 1 0 1 1 0 .1Z'],
  body:['M9.6 3.6h4.8v6h6v4.8h-6v6H9.6v-6h-6V9.6h6Z',null],
  rescue:['M12 21v-9M12 8.3V4.6M14.8 9.5l2.6-2M9.2 9.5l-2.6-2M15.5 12l3 .8M8.5 12l-3 .8',
        'M12 8.3a1.6 1.6 0 1 1 0 .1Z'],
};
const VTIP={
  grip:'The Grip — your will to live. When it goes, so do you. Panic and despair kill more people than cold or thirst.',
  warmth:'Core — your body’s heat. Zero is hypothermia in the cold, heatstroke in the sun. Both stop the heart.',
  water:'Water — you have about three days. Every myth about drinking will cost you more than it gives.',
  food:'Food — the long clock, three weeks. It steals your strength and your judgement long before it kills you.',
  body:'Body — blood, bone, whatever’s broken. Stop the bleeding first. Always first.',
  rescue:'Rescue — how close you are to being found, or to walking out alive.',
};
const VCOL={grip:'#7cc47a',warmth:'#8fb8d6',water:'#4aa8c4',food:'#d9a441',body:'#e6603a',rescue:'#7cc47a'};
function icoSvg(k,glow){
  const [line,fill]=ICO[k];
  return `<svg class="v-ico" viewBox="0 0 24 24"${glow?` style="filter:drop-shadow(0 0 ${glow}px currentColor)"`:''}>`
    +(fill?`<path d="${fill}" fill="currentColor" stroke="none" opacity=".85"/>`:'')
    +`<path d="${line}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function segRow(n,max,color){
  let h='<div class="v-segs">';
  for(let i=0;i<max;i++) h+=`<i class="${i<n?'on':''}"${i<n?` style="background:${color};box-shadow:0 0 5px ${color}66"`:''}></i>`;
  return h+'</div>';
}
function paintHUD(){
  let h='<div class="hud-panel">';
  VITALS.forEach(k=>{
    const v=clamp(S.v[k],0,6), c=VCOL[k];
    h+=`<div class="vital${v<=1?' low':''}${k==='grip'?' master':''}" id="v-${k}" title="${VTIP[k]}" style="color:${c}">`
      +icoSvg(k, k==='grip'? .5+v*.9 : 0)+segRow(v,6,c)+`</div>`;
  });
  h+='<div class="hud-sep"></div>';
  h+=`<div class="vital rescue" id="v-rescue" title="${VTIP.rescue}" style="color:${VCOL.rescue}">`
    +icoSvg('rescue', S.rescue>=S.goal?4:0)+segRow(clamp(S.rescue,0,S.goal),S.goal,VCOL.rescue)+`</div>`;
  h+=`<div id="hud-kit" class="hud-kit">`
    +S.kit.map(id=>`<span class="kit-chip" title="${ITEMS[id]?ITEMS[id].desc:''}">${ITEMS[id]?ITEMS[id].name:id}</span>`).join('')
    +`</div></div>`;
  $('hud').innerHTML=h;
}

/* ---------------- render node ---------------- */
function render(nodeId){
  const n=NODES[nodeId];
  if(!n){ console.error('missing node',nodeId); return titleScreen(); }
  S.node=nodeId;
  if(n.enter) n.enter(S,P);
  const reg=REGIONS[n.region]||{name:''};
  paintScene($('scene-art'), n.region, nodeId+S.days);
  AUDIO.setScene(n.region, S.days, S.v.grip);
  paintRail(); paintHUD();
  $('region-name').textContent=reg.name;
  $('node-title').textContent=fmt(n.title);
  const txt=$('node-text');
  txt.innerHTML=mirage(fmt(n.text), nodeId);
  txt.classList.toggle('mirage', S.winter || S.v.grip<=2);
  const box=$('choices'); box.innerHTML='';
  n.choices.forEach((c,ix)=>{
    if(c.req && !c.req(S,P)) return;
    if(c.item && !S.kit.includes(c.item)) return;
    const b=document.createElement('button'); b.className='choice';
    let pre = c.pre ? `<span class="c-pre">${c.pre}</span>` : '';
    if(c.item){ b.classList.add('kit-use'); if(!c.pre) pre=`<span class="c-pre">${ITEMS[c.item].name}</span>`; }
    if(c.myth) b.classList.add('myth');
    if((S.winter || S.v.grip<=2) && c.myth){ b.classList.add('mirage');
      pre=`<span class="c-pre">${MIRAGE_LURE[ix%MIRAGE_LURE.length]}</span>`; }
    b.innerHTML = pre + mirage(fmt(c.t), nodeId+'c'+ix);
    b.onclick=()=>choose(c);
    box.appendChild(b);
  });
  const gs=$('game-screen'); gs.classList.remove('fade-in'); void gs.offsetWidth; gs.classList.add('fade-in');
  $('text-panel').scrollTop=0;
  saveRun();
}

/* ---------------- choice resolution ---------------- */
function checkVitals(){
  if(S.v.grip<=0) return H.DEATHS[S.scenario].grip;
  if(S.v.warmth<=0) return H.DEATHS[S.scenario].thermal;
  if(S.v.water<=0) return H.DEATHS[S.scenario].water;
  if(S.v.body<=0) return H.DEATHS[S.scenario].body;
  if(S.v.food<=0) return H.DEATHS[S.scenario].food;
  return null;
}
function choose(c){
  // the debrief remembers everything
  if(S.trail){ const d={};
    VITALS.forEach(k=>{ if(c[k]) d[k]=c[k]; }); if(c.rescue) d.rescue=c.rescue;
    S.trail.push({ n:String(fmt(NODES[S.node].title)).replace(/<[^>]+>/g,''),
      c:String(fmt(c.t)).replace(/<[^>]+>/g,''), m:!!c.myth, d, day:S.days });
    if(S.trail.length>60) S.trail.shift();
  }
  VITALS.forEach(k=>{ if(c[k]!==undefined) S.v[k]=clamp(S.v[k]+c[k],0,6); });
  // in the Long Winter, every lie you believe costs extra will
  if(S.winter && c.myth) S.v.grip=clamp(S.v.grip-1,0,6);
  if(S.lows) VITALS.forEach(k=>{ if(S.v[k]<S.lows[k]) S.lows[k]=S.v[k]; });
  if(c.item && STORY.loadout.includes(c.item)) S.usedPocket=true;
  if(c.rescue) S.rescue=clamp(S.rescue+c.rescue,0,S.goal);
  if(c.day) S.days+=c.day;
  if(c.find && !S.kit.includes(c.find)){ S.kit.push(c.find); AUDIO.sting('find'); }
  if(c.log && !S.log.includes(c.log)) S.log.push(c.log);
  if(c.fx) c.fx(S,P);
  if(c.grip!==undefined) AUDIO.setGrip(S.v.grip);
  if(c.myth) AUDIO.sting('myth');
  else if((c.grip||0)>0 || c.find) AUDIO.sting('hope');
  else if((c.body||0)<0 || (c.grip||0)<-1) AUDIO.sting('hurt');

  // explicit ending wins
  const endId = typeof c.end==='function' ? c.end(S,P) : c.end;
  if(endId) return ending(endId);
  // vital collapse safety net (unless the choice is navigating to its own death node)
  const vd=checkVitals();
  if(vd && !c.noDeath) return ending(vd);
  let next = typeof c.go==='function' ? c.go(S,P) : c.go;
  if(next) render(next);
  else titleScreen();
}

/* ---------------- endings ---------------- */
let metaPending=false;
function ending(id){
  const e=ENDINGS[id];
  if(!e){ console.error('missing ending',id); return titleScreen(); }
  P.runs++; P.endings[id]=(P.endings[id]||0)+1;
  P.lastEnding=id; P.lastEndingTitle=e.title; P.lastKind=e.kind;
  const survived = e.kind==='survive'||e.kind==='true';
  let inscribe='';
  if(survived){
    const scen=e.scen||S.scenario;
    if(scen && !P.survived[scen]){ P.survived[scen]=true; }
    if(scen) P.bestDays[scen]=Math.max(P.bestDays[scen]||0, S?S.days:1);
    if(scen && S && S.winter && !P.winter[scen]){ P.winter[scen]=true;
      inscribe='❄ Survived in the Long Winter — carrying less, against a world that lied harder. ';
    } else if(S && S.winter){ inscribe='❄ The Long Winter, again. '; }
    // inscribe log pages gathered this run
    if(S){ const newly=S.log.filter(l=>!P.logbook.includes(l)); newly.forEach(l=>P.logbook.push(l));
      inscribe += newly.length ? `Pages added to the Log: ${newly.length}. (${P.logbook.length}/${Object.keys(LOGS).length})` : ''; }
    // reveal the real survivor behind this ordeal
    if(e.real && !P.reals.includes(e.real)) P.reals.push(e.real);
  } else if(S && S.log.length){
    inscribe = `The pages in your pocket go unread.`;
  }
  const trio = Object.values(P.survived).filter(Boolean).length;
  const trioNow = survived && trio>=NSCEN && !P.endings['e_stillbreathing'] && id!=='e_stillbreathing';
  saveP(); clearRun();
  AUDIO.sting(e.kind==='death'?'death':'hope');
  paintScene($('ending-art'), e.art, id+P.runs);
  AUDIO.setScene(e.art, 6, e.kind==='death'?0:6);
  $('ending-kind').textContent = e.kind==='death'?'this is how it ends':(e.kind==='true'?'what the survivors know':'you made it out');
  $('ending-kind').className='k-'+e.kind;
  $('ending-title').textContent=e.title;
  $('ending-text').innerHTML=fmt(e.text);
  $('ending-inscribe').textContent=inscribe;
  const realBox=$('ending-real');
  if(e.real && REALS[e.real]){ const rl=REALS[e.real];
    realBox.innerHTML=`<b>${rl.name}</b> — ${rl.what}. ${rl.body}`; realBox.style.display='block'; }
  else { realBox.style.display='none'; }
  metaPending=trioNow;
  $('btn-again').textContent = trioNow ? 'One more thing' : (survived?'Begin again':'Try again');
  $('btn-debrief').classList.toggle('hidden', e.kind!=='death' || !S || !S.trail || !S.trail.length);
  // ---- field notes: update counters, run badge checks, toast the new ones
  let causeKey=null;
  if(S){
    const deaths=H.DEATHS[S.scenario]||{};
    for(const k in deaths) if(deaths[k]===id) causeKey=k;
    if(!survived){
      P.diedIn[S.scenario]=true;
      if(causeKey) P.causeCounts[causeKey]=(P.causeCounts[causeKey]||0)+1;
    } else if(S.picks){
      P.comboWins[S.picks]=P.comboWins[S.picks]||{};
      P.comboWins[S.picks][S.scenario]=true;
    }
  }
  const ctx={ S, P, e:id, survived, causeKey,
    mythCount:S&&S.trail?S.trail.filter(t=>t.m).length:0, comboKey:S&&S.picks };
  const earned=[];
  STORY.badges.forEach(b=>{ if(!P.badges[b.id]){
    try{ if(b.check(ctx)){ P.badges[b.id]=Date.now(); earned.push(b); } }catch(err){} } });
  saveP();
  $('ending-badges').innerHTML = earned.length
    ? `<div class="badge-toast-head">field notes earned</div>`+earned.map(b=>
        `<div class="badge-toast"><span class="bt-ico">${b.icon}</span><b>${b.name}</b><span>${b.desc}</span></div>`).join('')
    : '';
  show('ending-screen');
}
$('btn-again').onclick=()=>{ if(metaPending){ metaPending=false; return ending('e_stillbreathing'); } titleScreen(); };

/* ---------------- the debrief: a report nobody wanted to write -------- */
const CAUSE={ thermal:'core temperature — exposure', water:'dehydration',
  food:'energy collapse — starvation', body:'trauma', grip:'psychological — the will stopped' };
function debrief(){
  if(!S || !S.trail) return;
  const scen=S.scenario, deaths=H.DEATHS[scen]||{};
  let cause='misadventure';
  for(const k in deaths) if(deaths[k]===P.lastEnding) cause=CAUSE[k];
  const firstMyth=S.trail.findIndex(t=>t.m);
  const mythCount=S.trail.filter(t=>t.m).length;
  const dl=d=>Object.keys(d).map(k=>`${d[k]>0?'+':''}${d[k]} ${k==='warmth'?'core':k}`).join(' · ');
  const rows=S.trail.map((t,i)=>{
    const div=i===firstMyth;
    return `<div class="db-row${t.m?' db-myth':''}${div?' db-div':''}">
      <span class="db-num">${String(i+1).padStart(2,'0')}</span>
      <div class="db-body"><span class="db-node">${t.n}${t.day>1?` — day ${t.day}`:''}</span>
      <span class="db-choice">“${t.c}”</span>
      ${Object.keys(t.d).length?`<span class="db-delta">${dl(t.d)}</span>`:''}
      ${div?`<span class="db-flag div">◆ first departure from doctrine</span>`:(t.m?`<span class="db-flag">myth believed</span>`:'')}</div>
    </div>`; }).join('');
  if(!P.readDebrief){ P.readDebrief=true; saveP(); }
  galleryReturn='ending';
  gallery('Incident Debrief',
    `${SCENARIOS[scen].name} · ${S.days} day${S.days>1?'s':''} · subject: ${S.name}${S.winter?' · the Long Winter':''}`,
    `<div class="db-report">
      <div class="db-head"><span class="db-stamp">NOT RECOVERED IN TIME</span>
        <div class="db-cause">determined cause: <b>${cause}</b> — “${P.lastEndingTitle}”</div>
        <div class="db-cause">departures from doctrine: <b>${mythCount}</b>${firstMyth<0?' — none recorded. Sometimes the margin belongs to the terrain.':''}</div></div>
      <div class="db-rows">${rows}</div>
      <div class="db-doctrine"><b>what the doctrine says</b>${H.DOCTRINE[scen]||''}</div>
    </div>`);
}
$('btn-debrief').onclick=debrief;

/* ---------------- debug (~) & mute (m) ---------------- */
function debugPanel(){
  const d=$('debug-panel'); d.classList.toggle('hidden');
  if(d.classList.contains('hidden')) return;
  const opts=Object.keys(NODES).map(k=>`<option ${S&&S.node===k?'selected':''}>${k}</option>`).join('');
  d.innerHTML=`<b>~ field lantern</b>
  <div class="dbg-row">node <select id="dbg-node">${opts}</select> <button id="dbg-go">go</button></div>
  <div class="dbg-row">${VITALS.map(k=>`${k.slice(0,4)} <input id="dbg-${k}" size="1" value="${S?S.v[k]:4}">`).join(' ')}</div>
  <div class="dbg-row">rescue <input id="dbg-rescue" size="1" value="${S?S.rescue:0}">/${S?S.goal:3} day <input id="dbg-day" size="1" value="${S?S.days:1}"> <button id="dbg-apply">apply</button></div>
  <div class="dbg-row"><button id="dbg-kit">all kit</button> <button id="dbg-win">survived all</button> <button id="dbg-wipe">WIPE</button></div>
  <div class="dbg-row">runs ${P.runs} · survived ${Object.values(P.survived).filter(Boolean).length}/${NSCEN} · outcomes ${Object.keys(P.endings).length}/${Object.keys(ENDINGS).length}</div>`;
  $('dbg-go').onclick=()=>{ if(!S){S=newRun(P.playerName,'white');show('game-screen');} render($('dbg-node').value); };
  $('dbg-apply').onclick=()=>{ if(!S)return;
    VITALS.forEach(k=>S.v[k]=clamp(+$('dbg-'+k).value||0,0,6));
    S.rescue=clamp(+$('dbg-rescue').value||0,0,S.goal); S.days=Math.max(1,+$('dbg-day').value||1);
    render(S.node); };
  $('dbg-kit').onclick=()=>{ if(!S)return; S.kit=Object.keys(ITEMS); render(S.node); };
  $('dbg-win').onclick=()=>{ P.survived={}; Object.keys(SCENARIOS).forEach(k=>P.survived[k]=true);
    P.reals=Object.keys(REALS); saveP(); titleScreen(); };
  $('dbg-wipe').onclick=()=>{ localStorage.removeItem(K_PERSIST); localStorage.removeItem(K_RUN);
    P=loadP(); S=null; d.classList.add('hidden'); titleScreen(); };
}
document.addEventListener('keydown',e=>{
  if(e.key==='`'||e.key==='~') debugPanel();
  else if(e.key==='m' && !e.target.matches('input')) AUDIO.toggleMute();
});

/* ---------------- boot ---------------- */
titleScreen();
})();

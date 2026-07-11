/* =====================================================================
   STILL BREATHING — art.js
   Procedural SVG scene painter. No image assets. One lone figure — you.
   ART.paint(container, regionKey, seedString)
   ===================================================================== */
const ART = (() => {
const W=900, H=500;

function rng(seedStr){ let h=1779033703^String(seedStr).length;
  for(let i=0;i<String(seedStr).length;i++){h=Math.imul(h^String(seedStr).charCodeAt(i),3432918353);h=h<<13|h>>>19;}
  return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);
    return ((h^=h>>>16)>>>0)/4294967296;};}

const G=(id,stops,x1=0,y1=0,x2=0,y2=1)=>`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">`+
  stops.map(s=>`<stop offset="${s[0]}" stop-color="${s[1]}"${s[2]!==undefined?` stop-opacity="${s[2]}"`:''}/>`).join('')+`</linearGradient>`;
const RG=(id,stops,cx=.5,cy=.5,r=.5)=>`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">`+
  stops.map(s=>`<stop offset="${s[0]}" stop-color="${s[1]}"${s[2]!==undefined?` stop-opacity="${s[2]}"`:''}/>`).join('')+`</radialGradient>`;
const rect=(x,y,w,h,f,o)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${o!==undefined?` opacity="${o}"`:''}/>`;
const circ=(x,y,r,f,o)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"${o!==undefined?` opacity="${o}"`:''}/>`;
const path=(d,f,o,extra)=>`<path d="${d}" fill="${f}"${o!==undefined?` opacity="${o}"`:''}${extra||''}/>`;

/* the lone survivor — small, hunched, no companion */
function person(x,y,s=1,col='#0a0a0c',pose='stand'){
  let g=`<g transform="translate(${x},${y}) scale(${s})">`;
  if(pose==='sit'){
    g+=path(`M-8,0 q-2,-16 6,-20 q3,-14 8,-16 q6,-1 6,6 q0,8 -3,14 q7,2 8,10 q1,6 -3,6 z`,col);
    g+=circ(11,-32,5,col);
  } else if(pose==='down'){
    g+=path(`M-18,0 q4,-8 20,-9 q16,-1 24,3 q4,2 -2,4 q-22,3 -40,4 z`,col);
    g+=circ(-16,-4,5,col);
  } else {
    g+=path(`M0,0 c-2,-15 -1,-27 2,-35 c1,-6 6,-9 9,-6 c4,3 4,9 3,15 c-1,9 -2,16 -1,26 z`,col);
    g+=circ(8,-45,5.5,col);
  }
  return g+`</g>`;
}
function fog(y,h,c,op,dur=26,amp=40){
  return `<g opacity="${op}"><rect x="-100" y="${y}" width="${W+200}" height="${h}" fill="${c}"/>`+
    `<animateTransform attributeName="transform" type="translate" values="0,0;${amp},0;0,0" dur="${dur}s" repeatCount="indefinite"/></g>`;
}
function stars(r,n,maxY,c='#e8e2d2'){ let s='';
  for(let i=0;i<n;i++){ const x=r()*W,y=r()*maxY,rad=r()*1.3+.3;
    s+=`<circle cx="${x}" cy="${y}" r="${rad}" fill="${c}" opacity="${.3+r()*.7}">`+
      (r()<.3?`<animate attributeName="opacity" values="1;.2;1" dur="${3+r()*5}s" repeatCount="indefinite"/>`:'')+`</circle>`;}
  return s;}
function pine(x,base,h,col='#0c140f',snow=false){
  const w=h*.34; let s=`<path d="M${x},${base-h} L${x-w},${base} L${x+w},${base} Z" fill="${col}"/>`;
  s+=`<path d="M${x},${base-h} L${x-w*.7},${base-h*.42} L${x+w*.7},${base-h*.42} Z" fill="${col}"/>`;
  if(snow){ s+=`<path d="M${x},${base-h} L${x-w*.34},${base-h*.72} L${x+w*.34},${base-h*.72} Z" fill="#dfe8ee" opacity=".85"/>`;
    s+=`<path d="M${x},${base-h*.58} l${-w*.5},${h*.2} l${w},0 z" fill="#cfdbe4" opacity=".5"/>`; }
  return s;}
function snowfall(r,n=60,c='#dfe8ee'){ let s='<g>';
  for(let i=0;i<n;i++){ const x=r()*W,y=r()*H,rad=.6+r()*1.6;
    s+=`<circle cx="${x}" cy="${y}" r="${rad}" fill="${c}" opacity="${.4+r()*.5}"><animate attributeName="cy" values="${y};${y+H}" dur="${5+r()*7}s" repeatCount="indefinite"/><animate attributeName="cx" values="${x};${x+30*(r()-.5)}" dur="${5+r()*7}s" repeatCount="indefinite"/></circle>`;}
  return s+'</g>';}
function waves(r,topY,c1,c2,rows=8){ let s=`<rect x="0" y="${topY}" width="${W}" height="${H-topY}" fill="${c2}"/>`;
  for(let i=0;i<rows;i++){ const y=topY+i*((H-topY)/rows), amp=4+i*1.6, dur=6+i*.8;
    s+=`<g opacity="${.5-i*.03}"><path d="M-40,${y} q120,${-amp} 240,0 t240,0 t240,0 t240,0 t240,0" stroke="${c1}" stroke-width="${1.6+i*.3}" fill="none"/>`+
       `<animateTransform attributeName="transform" type="translate" values="0,0;${-60-i*8},${i*.6};0,0" dur="${dur}s" repeatCount="indefinite"/></g>`;}
  return s;}
function fire(x,base,scale=1,r){ let s=`<g transform="translate(${x},${base}) scale(${scale})">`;
  s+=`<ellipse cx="0" cy="2" rx="34" ry="8" fill="#1a0f08"/>`;
  for(let i=0;i<7;i++){ const px=(-24+i*8), lh=18+((r?r():Math.random())*26);
    s+=`<path d="M${px},0 q${-4},${-lh*.6} 0,${-lh} q4,${lh*.4} 0,${lh} z" fill="${i%2?'#e6603a':'#f4a23a'}" opacity=".9"><animate attributeName="opacity" values=".5;1;.5" dur="${.5+(r?r():Math.random())}s" repeatCount="indefinite"/></path>`;}
  s+=`<path d="M-8,0 q0,-30 6,-44 q4,16 2,44 z" fill="#ffe08a" opacity=".85"/>`;
  return s+`</g>`;}
function sun(x,y,rad,c='#f2b24a',glow='#e6603a'){
  return RG('sg',[[0,c,.9],[.4,glow,.5],[1,'#000',0]],.5,.5,.5)+circ(x,y,rad*3,'url(#sg)')+circ(x,y,rad,c,.95);}

/* ------------------------------------------------------------------ */
const P = {

title(r){ return G('t',[[0,'#04070c'],[.55,'#0a1018'],[1,'#141a12']])+rect(0,0,W,H,'url(#t)')
  +stars(r,70,240)
  +Array.from({length:5},(_,i)=>`<path d="M${-50+i*230},260 q120,${-70-i*10} 240,0" stroke="#1a3a48" stroke-width="2" fill="none" opacity="${.5-i*.06}"><animateTransform attributeName="transform" type="translate" values="0,0;20,0;0,0" dur="${12+i*3}s" repeatCount="indefinite"/></path>`).join('')
  +Array.from({length:9},(_,i)=>pine(60+i*100+r()*40,H+8,150+r()*120,'#08110c',r()<.5)).join('')
  +fog(300,180,'#0a1016',.4,30)
  +fire(450,455,1.15,r)
  +person(492,452,1,'#050506','sit');},

select(r){ return this.title(r); },

/* ---------------- WHITE MILE ---------------- */
crash(r){ return G('cr',[[0,'#8a97a2'],[.5,'#aeb8bf'],[1,'#d3dade']])+rect(0,0,W,H,'url(#cr)')
  +rect(0,300,W,200,'#e9eef1')
  +Array.from({length:8},(_,i)=>pine(40+i*120+r()*30,320+r()*10,110+r()*80,'#20302a',true)).join('')
  /* broken fuselage */
  +`<g transform="translate(430,300) rotate(-9)">`
  +path(`M-190,0 q-10,-56 40,-64 l260,4 q40,4 30,60 z`,'#b9bcc0')
  +path(`M-150,-40 l0,40 M-100,-52 l0,52 M-50,-56 l0,56 M10,-56 l0,56 M70,-52 l0,52`,'none',1,` stroke="#6b7176" stroke-width="2"`)
  +path(`M60,-58 q28,-6 40,10 l-4,50 q-30,4 -40,-6 z`,'#9aa0a4')
  +circ(-130,-24,7,'#33383c')+circ(-96,-30,7,'#33383c')+circ(-58,-34,7,'#33383c')+circ(-8,-34,7,'#33383c')
  +path(`M-190,-4 q-70,10 -120,58`,'none',1,` stroke="#8c9296" stroke-width="14" stroke-linecap="round"`)  /* torn wing */
  +`</g>`
  +path(`M120,470 q120,-30 260,-6`,'none',.6,` stroke="#c6ccd0" stroke-width="24" stroke-linecap="round"`) /* gouge in snow */
  +snowfall(r,40)+fog(360,120,'#c9d2d7',.4,28)
  +person(330,430,1.05,'#1a1c1f','down');},

forest(r){ return G('fr',[[0,'#233028'],[.5,'#1a251d'],[1,'#0e150f']])+rect(0,0,W,H,'url(#fr)')
  +RG('fl',[[0,'#cdd6cf',.14],[1,'#000',0]],.5,.3,.5)+circ(450,150,300,'url(#fl)')
  +rect(0,380,W,120,'#e4ebe6')
  +Array.from({length:16},(_,i)=>pine(i*60+r()*30,H+10,220+r()*160,'#0b140e',r()<.6)).join('')
  +Array.from({length:6},(_,i)=>`<line x1="${80+i*140}" y1="${H}" x2="${80+i*140-8}" y2="120" stroke="#141b15" stroke-width="${9+r()*7}"/>`).join('')
  +snowfall(r,30)+fog(300,130,'#161f18',.5,30)
  +person(440,470,1,'#080a09');},

river(r){ return G('rv',[[0,'#2c3a3f'],[.5,'#20302f'],[1,'#141c18']])+rect(0,0,W,H,'url(#rv)')
  +Array.from({length:10},(_,i)=>pine(i*95+r()*30,300+r()*8,120+r()*80,'#0e1712',true)).join('')
  +path(`M0,320 Q300,300 460,360 T900,340 L900,500 L0,500 Z`,'#26424a')
  +waves(r,360,'#3d6b74','#1c343a',6)
  +Array.from({length:14},()=>{const x=r()*W,y=360+r()*120;return circ(x,y,1+r()*2.5,'#9fd0d6',.5+r()*.4);}).join('')
  +rect(0,300,W,26,'#e4ebe6',.9)
  +fog(300,120,'#1a2622',.4,26)
  +person(150,318,.95,'#090b0a');},

ridge(r){ return G('rd',[[0,'#f3c98a'],[.35,'#e79a63'],[.7,'#9a6f6a'],[1,'#4a4658']])+rect(0,0,W,H,'url(#rd)')
  +sun(690,120,34)
  +path(`M0,300 L150,180 L300,260 L460,150 L620,240 L780,140 L900,220 L900,500 L0,500 Z`,'#2b2e3a')
  +path(`M0,360 L200,280 L380,340 L560,270 L760,330 L900,290 L900,500 L0,500 Z`,'#191b24')
  +path(`M0,300 L150,180 L300,260 L460,150 L620,240 L780,140 L900,220`,'none',1,` stroke="#f0d0a0" stroke-width="2" opacity=".5"`)
  +fog(300,120,'#c98f6a',.3,30)
  +person(450,430,1.1,'#0a0a0d');},

night(r){ return G('nt',[[0,'#05070f'],[.5,'#080b16'],[1,'#0c1014']])+rect(0,0,W,H,'url(#nt)')
  +stars(r,110,300)
  /* aurora */
  +Array.from({length:4},(_,i)=>`<path d="M${-40+i*40},${120+i*20} q220,${-60} 440,${-10} t440,20" stroke="${['#4fd0a0','#5fe0b0','#7ad0e0','#a0f0c0'][i]}" stroke-width="${26-i*4}" fill="none" opacity="${.22-i*.03}"><animateTransform attributeName="transform" type="translate" values="0,0;40,10;0,0" dur="${16+i*4}s" repeatCount="indefinite"/></path>`).join('')
  +rect(0,400,W,100,'#eef2f4',.9)
  +Array.from({length:10},(_,i)=>pine(i*95+r()*30,412,120+r()*70,'#04080a',true)).join('')
  +fire(470,452,.85,r)
  +person(500,450,.9,'#04060a','sit');},

camp(r){ return G('cp',[[0,'#0e1216'],[.5,'#141014'],[1,'#1c1410']])+rect(0,0,W,H,'url(#cp)')
  +stars(r,50,180)
  +rect(0,410,W,90,'#e9eef0',.9)
  /* lean-to shelter */
  +`<g transform="translate(250,300)">`+path(`M0,110 L120,-30 L250,110 Z`,'#1a130c')
  +path(`M0,110 L120,-30 L130,-24 L14,110 Z`,'#2a2016')
  +path(`M120,-30 L250,110 L236,110 L112,-24 Z`,'#0f0b07')+`</g>`
  +fire(560,452,1.2,r)
  +RG('cw',[[0,'#e6603a',.4],[1,'#000',0]],.5,.5,.5)+circ(560,430,150,'url(#cw)')
  +person(430,448,1,'#0a0705','sit')
  +snowfall(r,14);},

/* ---------------- THE RAFT ---------------- */
sinking(r){ return G('sk',[[0,'#0a0f18'],[.5,'#0c1420'],[1,'#050a10']])+rect(0,0,W,H,'url(#sk)')
  +stars(r,60,220)+circ(700,90,30,'#c9d2da',.5)
  +path(`M0,300 Q450,280 900,300 L900,500 L0,500 Z`,'#0a141c')
  +waves(r,300,'#1c3644','#0a141c',9)
  /* sinking sailboat, bow up */
  +`<g transform="translate(300,300) rotate(-24)">`
  +path(`M-120,0 q10,50 130,50 l60,-4 q30,-40 -10,-52 z`,'#141a20')
  +`<line x1="30" y1="-4" x2="30" y2="-160" stroke="#2a3138" stroke-width="4"/>`
  +path(`M30,-150 q50,20 40,90 l-40,-6 z`,'#20282f',.8)+`</g>`
  +fog(320,110,'#0c1620',.4,22)
  +person(560,318,.8,'#04070a');},

raft(r){ return G('rf',[[0,'#7fb4cf'],[.42,'#b9d6e2'],[.62,'#2f6f88'],[1,'#134055']])+rect(0,0,W,H,'url(#rf)')
  +sun(180,110,30)
  +path(`M0,300 Q450,286 900,300 L900,500 L0,500 Z`,'#1c5570')
  +waves(r,300,'#3f8aa6','#164a62',9)
  /* round life raft, canopy */
  +`<g transform="translate(560,318)">`
  +`<ellipse cx="0" cy="34" rx="130" ry="26" fill="#0e2f3f" opacity=".5"/>`
  +path(`M-120,26 q-14,-30 20,-40 l200,0 q34,10 20,40 z`,'#c9522f')
  +path(`M-100,-14 q100,-40 200,0 l0,10 q-100,-34 -200,0 z`,'#e2732f')
  +`<ellipse cx="0" cy="26" rx="120" ry="22" fill="#e08a3a" opacity=".9"/>`
  +`<ellipse cx="0" cy="20" rx="96" ry="15" fill="#3a2a1c"/>`+`</g>`
  +person(540,300,.7,'#1a1410','sit')
  +Array.from({length:5},()=>{const x=r()*W,y=60+r()*120;return path(`M${x},${y} q6,-5 12,0 q-6,-3 -12,0`,'#20303a',.6);}).join('');},

raftnight(r){ return G('rn',[[0,'#050912'],[.5,'#081420'],[1,'#02060c']])+rect(0,0,W,H,'url(#rn)')
  +stars(r,130,300)+RG('mn',[[0,'#e8eef2',.9],[1,'#000',0]],.5,.5,.5)+circ(730,90,60,'url(#mn)')+circ(730,90,26,'#eef2f5',.95)
  +path(`M0,300 Q450,288 900,300 L900,500 L0,500 Z`,'#04101a')
  +waves(r,300,'#12303f','#04101a',8)
  +`<path d="M500,330 q-14,-24 18,-32 l180,0 q30,8 16,32 z" fill="#0a1a22"/>`
  +Array.from({length:16},()=>{const x=500+r()*220,y=110+r()*180;return circ(x,y,1,'#bfe0ff',.6);}).join('')
  +person(560,314,.68,'#02060c','sit');},

open(r){ return G('op',[[0,'#cfe0e4'],[.4,'#e6d6b0'],[.6,'#5c8a94'],[1,'#25545f']])+rect(0,0,W,H,'url(#op)')
  +sun(450,120,40,'#f6e0a0','#e6a03a')
  +path(`M0,320 Q450,314 900,320 L900,500 L0,500 Z`,'#2a6472')
  +waves(r,320,'#4f96a6','#1f5563',7)
  +`<g opacity=".5"><path d="M0,318 Q450,312 900,318" stroke="#f0d090" stroke-width="3" fill="none"/></g>`
  +person(450,332,.6,'#20303a','down')
  +Array.from({length:3},(_,i)=>`<path d="M${200+i*250},${120} q40,20 0,40 q-40,-20 0,-40" fill="none" stroke="#3a4a52" stroke-width="2" opacity=".5"><animateTransform attributeName="transform" type="translate" values="0,0;30,8;0,0" dur="${9+i*2}s" repeatCount="indefinite"/></path>`).join('');},

storm(r){ return G('st',[[0,'#141820'],[.5,'#0c1016'],[1,'#05080c']])+rect(0,0,W,H,'url(#st)')
  +path(`M0,280 Q450,250 900,290 L900,500 L0,500 Z`,'#0a1218')
  +waves(r,280,'#2a3f4a','#0a1218',10)
  +Array.from({length:9},(_,i)=>`<path d="M${r()*W},0 l${-10-r()*10},${140+r()*80} l14,4 l${-8},${120}" stroke="#9fb8c8" stroke-width="1.4" fill="none" opacity=".5"/>`).join('')
  +(r()<.6?`<path d="M420,20 l-30,120 l30,-16 l-20,110" stroke="#eef2ff" stroke-width="2.5" fill="none" opacity=".9"/>`:'')
  +fog(200,160,'#0e141a',.5,10,90)
  +person(500,330,.7,'#03060a','down');},

/* ---------------- THE PINCH ---------------- */
slot(r){ return G('sl',[[0,'#c98a52'],[.3,'#8a4f30'],[.6,'#4a2818'],[1,'#1a0e08']])+rect(0,0,W,H,'url(#sl)')
  +path(`M0,0 Q220,60 180,260 Q160,420 260,500 L0,500 Z`,'#3a2013')  /* left wall */
  +path(`M900,0 Q660,80 700,300 Q720,430 620,500 L900,500 Z`,'#2a160c') /* right wall */
  +path(`M180,260 Q160,420 260,500`,'none',1,` stroke="#6a3f24" stroke-width="3" opacity=".5"`)
  +Array.from({length:6},(_,i)=>path(`M${200+i*8},${80+i*60} q40,10 60,-4`,'none',.4,` stroke="#5a3320" stroke-width="${8-i}"`)).join('')
  +RG('sky',[[0,'#f4e0a0',.7],[1,'#c98a52',0]],.5,0,.6)+`<ellipse cx="440" cy="10" rx="120" ry="60" fill="url(#sky)"/>`
  /* the chockstone */
  +path(`M360,300 q-30,-40 20,-56 q50,-14 80,10 q30,26 6,54 q-40,26 -106,-8 z`,'#5a3420')
  +path(`M360,300 q-30,-40 20,-56 q50,-14 80,10`,'none',1,` stroke="#7a4a2e" stroke-width="2"`)
  +person(410,392,.9,'#140a06','stand')
  +path(`M430,360 L456,318`,'none',1,` stroke="#140a06" stroke-width="6" stroke-linecap="round"`);}, /* pinned arm reaching into stone */

slotday(r){ return G('sd',[[0,'#f6d98a'],[.3,'#d99a52'],[.6,'#8a4f30'],[1,'#3a2013']])+rect(0,0,W,H,'url(#sd)')
  +path(`M0,0 Q200,40 170,280 L0,500 Z`,'#4a2818')+path(`M900,0 Q700,60 720,300 L900,500 Z`,'#3a1e10')
  +sun(440,60,30,'#fff0c0','#f6b24a')
  +Array.from({length:5},(_,i)=>path(`M${190+i*10},${60+i*70} q50,6 74,-6`,'none',.35,` stroke="#6a3f24" stroke-width="6"`)).join('')
  +person(430,400,.9,'#160b06','stand');},

slotnight(r){ return G('sn',[[0,'#0a0c14'],[.4,'#0e0a10'],[1,'#05040a']])+rect(0,0,W,H,'url(#sn)')
  +path(`M0,0 Q200,40 170,280 L0,500 Z`,'#120a0c')+path(`M900,0 Q700,60 720,300 L900,500 Z`,'#0d0709')
  +`<ellipse cx="440" cy="6" rx="110" ry="40" fill="#0a0e1a"/>`+stars(r,26,60,'#cfe0ff')
  +person(430,400,.9,'#040308','stand');},

canyonout(r){ return G('co',[[0,'#f4d492'],[.35,'#e0a860'],[.65,'#a06844'],[1,'#5a3826']])+rect(0,0,W,H,'url(#co)')
  +path(`M0,0 L160,0 Q120,200 200,500 L0,500 Z`,'#7a4a2e')
  +path(`M900,0 L740,0 Q800,220 700,500 L900,500 Z`,'#6a3f28')
  +sun(450,90,36,'#fff0c0','#f6b24a')
  +path(`M200,500 Q400,470 700,500`,'none',1,` stroke="#c89a5a" stroke-width="20" stroke-linecap="round" opacity=".6"`)
  +person(400,470,1,'#1a0f08','stand');},

rim(r){ return G('rm',[[0,'#bfe0ea'],[.4,'#f0d9a8'],[.7,'#c98a52'],[1,'#7a4a2e']])+rect(0,0,W,H,'url(#rm)')
  +sun(650,120,38,'#fff4d0','#f6b24a')
  +path(`M0,340 L250,300 L480,350 L720,290 L900,340 L900,500 L0,500 Z`,'#8a5a34')
  +path(`M0,400 L200,370 L460,410 L720,360 L900,400 L900,500 L0,500 Z`,'#5a3826')
  +Array.from({length:5},(_,i)=>path(`M${100+i*180},${380-i*4} q6,-30 12,0`,'#3a2416')).join('')
  +person(440,340,1.1,'#1a0f08','stand');},

/* ---------------- THE TRAILHEAD ---------------- */
trailday(r){ return G('td',[[0,'#bcd3de'],[.45,'#d9c9a0'],[1,'#4a5a3f']])+rect(0,0,W,H,'url(#td)')
  +sun(660,100,30,'#fff0c0','#f2c46a')
  +path(`M0,360 L200,330 L430,365 L680,325 L900,355 L900,500 L0,500 Z`,'#3a4a34')
  +Array.from({length:12},(_,i)=>pine(i*80+r()*40,H+8,140+r()*140,'#2a3a28')).join('')
  /* switchback trail */
  +path(`M80,500 Q300,430 220,380 Q160,340 420,330 Q640,322 560,290`,'none',1,` stroke="#c9b78a" stroke-width="7" stroke-linecap="round" fill="none" opacity=".8"`)
  +fog(280,120,'#c9d4c2',.25,32)
  +person(300,436,.95,'#20281c');},

offtrail(r){ return G('ot',[[0,'#31402f'],[.5,'#25301f'],[1,'#141a10']])+rect(0,0,W,H,'url(#ot)')
  +RG('otl',[[0,'#c9d4a0',.12],[1,'#000',0]],.5,.25,.5)+circ(450,120,280,'url(#otl)')
  +Array.from({length:20},(_,i)=>pine(i*48+r()*26,H+10,180+r()*220,'#0f150c')).join('')
  /* deadfall */
  +Array.from({length:6},()=>{const x=r()*W,y=400+r()*80;
    return `<line x1="${x-60-r()*60}" y1="${y+10}" x2="${x+60+r()*60}" y2="${y-8-r()*14}" stroke="#1c2415" stroke-width="${5+r()*6}" stroke-linecap="round"/>`;}).join('')
  +fog(300,160,'#1a2416',.5,26)
  +person(430,470,1,'#0a0e08');},

creekbed(r){ return G('cb',[[0,'#4a5a52'],[.5,'#2c3a32'],[1,'#101a14']])+rect(0,0,W,H,'url(#cb)')
  +path(`M0,0 Q170,80 150,300 L110,500 L0,500 Z`,'#22301f')
  +path(`M900,0 Q740,100 760,320 L800,500 L900,500 Z`,'#1b2819')
  +Array.from({length:7},()=>{const x=180+r()*540,y=280+r()*180,rad=26+r()*44;
    return `<ellipse cx="${x}" cy="${y}" rx="${rad}" ry="${rad*.6}" fill="#3a4a44" opacity=".9"/>`;}).join('')
  +path(`M300,220 Q420,260 380,340 Q350,420 480,500`,'none',1,` stroke="#9fd0d6" stroke-width="10" fill="none" opacity=".5"`)
  +Array.from({length:12},()=>circ(300+r()*300,240+r()*240,1.2+r()*2,'#cfe8ea',.5+r()*.4)).join('')
  +fog(340,140,'#20302a',.4,20)
  +person(430,410,.9,'#0c120e');},

stormnight(r){ return G('sn2',[[0,'#0a0f12'],[.6,'#0c1210'],[1,'#05080a']])+rect(0,0,W,H,'url(#sn2)')
  +Array.from({length:12},(_,i)=>pine(i*80+r()*40,H+8,160+r()*180,'#060a06')).join('')
  +path(`M540,500 L640,360 L760,500 Z`,'#0d0f0a')
  +path(`M540,500 L640,360 L660,378 L570,500 Z`,'#161a10')
  +RG('ph',[[0,'#f2c46a',.5],[1,'#000',0]],.5,.5,.5)+circ(640,440,40,'url(#ph)')
  +rain(r,'#5a707d',110,10)
  +fog(260,200,'#0a100c',.5,16,70)
  +person(628,462,.85,'#0a0c08','sit');},

ridgeview(r){ return G('rv2',[[0,'#c3d4dc'],[.45,'#9fb4be'],[1,'#5a6a64']])+rect(0,0,W,H,'url(#rv2)')
  +Array.from({length:4},(_,i)=>path(`M${-80+i*60},${240+i*46} Q450,${210+i*50} ${W+80},${245+i*44} L${W+80},500 L-80,500 Z`,
    ['#5a7a6a','#46604f','#33493a','#22331f'][i],1)).join('')
  +path(`M240,500 Q450,300 700,500 Z`,'#8a97a0')
  +path(`M240,500 Q450,300 700,500`,'none',1,` stroke="#b8c4ca" stroke-width="3" opacity=".6"`)
  +fog(260,140,'#aebfc7',.35,30)
  +person(452,368,.95,'#1a2220')
  +path(`M462,340 L462,326`,'none',1,` stroke="#1a2220" stroke-width="3" stroke-linecap="round"`);},

meadow(r){ return G('md',[[0,'#8aa4b4'],[.4,'#b4c4a4'],[1,'#5a6a44']])+rect(0,0,W,H,'url(#md)')
  +Array.from({length:11},(_,i)=>pine(i*90+r()*40,300+r()*14,110+r()*90,'#2c3a26')).join('')
  +rect(0,330,W,170,'#7a8a54')
  +Array.from({length:40},()=>{const x=r()*W,y=340+r()*150;
    return `<line x1="${x}" y1="${y}" x2="${x+(r()-.5)*6}" y2="${y-8-r()*10}" stroke="#93a464" stroke-width="1.4" opacity=".7"/>`;}).join('')
  /* the orange X */
  +`<g transform="translate(430,420) rotate(-4)"><path d="M-70,-34 L70,34 M-70,34 L70,-34" stroke="#e6603a" stroke-width="26" stroke-linecap="round" opacity=".95"/></g>`
  +path(`M620,380 q6,-40 14,-56 q8,26 4,56 z`,'#5a6a58',.8)
  +`<path d="M627,330 q20,-40 8,-70" stroke="#9aa89a" stroke-width="7" fill="none" opacity=".5"/>`
  +person(300,436,.9,'#232c1c','down');},

faded(r){ return G('fd',[[0,'#9aa5a8'],[.5,'#7f8a8c'],[1,'#5a6466']])+rect(0,0,W,H,'url(#fd)')
  +Array.from({length:16},(_,i)=>`<line x1="${i*60+r()*30}" y1="${H}" x2="${i*60+r()*30-6}" y2="${60+r()*80}" stroke="#4a5456" stroke-width="${6+r()*8}" opacity="${.4+r()*.3}"/>`).join('')
  +rain(r,'#b8c2c4',80,6)
  +fog(200,300,'#8f9a9c',.5,22)
  /* the bandana */
  +`<g transform="translate(560,260)"><path d="M0,0 q14,6 22,20 q-16,2 -26,-4 z" fill="#e6603a"/><line x1="-4" y1="-2" x2="30" y2="-8" stroke="#3f4a4c" stroke-width="3"/></g>`;},

/* ---------------- THE CREVASSE ---------------- */
hangface(r){ return G('hf',[[0,'#2a3644'],[.5,'#1a2430'],[1,'#0c1218']])+rect(0,0,W,H,'url(#hf)')
  +path(`M0,0 L${W},0 L${W},120 Q450,220 0,140 Z`,'#3a4a5c',.5)
  +Array.from({length:30},()=>{const x=r()*W,y=r()*H;return `<line x1="${x}" y1="${y}" x2="${x-30}" y2="${y+18}" stroke="#c9d4de" stroke-width="1" opacity="${.2+r()*.4}"/>`;}).join('')
  +path(`M0,80 L260,140 L200,500 L0,500 Z`,'#18222c')+path(`M900,60 L640,150 L720,500 L900,500 Z`,'#141c26')
  +`<line x1="452" y1="0" x2="450" y2="300" stroke="#8a7a5a" stroke-width="2.5"/>`
  +person(444,332,.9,'#0a0e12')
  +fog(200,220,'#1a2430',.5,14,80);},

crevasse(r){ return G('cv',[[0,'#0a1620'],[.35,'#10394c'],[.7,'#0c2a3c'],[1,'#04101a']])+rect(0,0,W,H,'url(#cv)')
  +RG('cvl',[[0,'#bfe8f4',.8],[.4,'#5ab8d4',.25],[1,'#000',0]],.5,0,.7)+`<ellipse cx="450" cy="-30" rx="140" ry="180" fill="url(#cvl)"/>`
  +path(`M0,0 Q240,120 200,300 Q180,430 260,500 L0,500 Z`,'#0d3040',.9)
  +path(`M900,0 Q660,140 700,320 Q720,440 640,500 L900,500 Z`,'#0a2836',.9)
  +Array.from({length:8},(_,i)=>path(`M${210+i*10},${60+i*54} q60,14 90,-6`,'none',.3,` stroke="#7ac8dc" stroke-width="${1+r()*1.5}"`)).join('')
  +path(`M300,360 Q450,330 620,365 L600,410 Q450,380 320,405 Z`,'#cfe4ea',.85)
  +person(440,372,.85,'#08141a','down')
  +rect(0,440,W,60,'#020a10',.9);},

glacierfield(r){ return G('gf',[[0,'#a8bcc8'],[.4,'#cfdde4'],[1,'#e8f0f2']])+rect(0,0,W,H,'url(#gf)')
  +path(`M0,180 L180,120 L400,170 L640,110 L900,160 L900,500 L0,500 Z`,'#dce8ec')
  +Array.from({length:9},()=>{const x=r()*W,y=240+r()*220,w=40+r()*120;
    return path(`M${x},${y} q${w/2},${6+r()*8} ${w},0 q${-w/2},${10+r()*10} ${-w},0 z`,'#7fa8b8',.5+r()*.3);}).join('')
  +path(`M100,500 Q300,420 460,380`,'none',.5,` stroke="#b8ccd4" stroke-width="10" stroke-linecap="round"`)
  +person(470,378,.8,'#26323a','down')
  +fog(140,120,'#cfdde4',.4,26);},

moraine(r){ return G('mo',[[0,'#8a97a0'],[.4,'#6a7880'],[1,'#3a4650']])+rect(0,0,W,H,'url(#mo)')
  +path(`M0,160 L220,90 L430,150 L650,80 L900,140 L900,240 L0,260 Z`,'#4c5a66')
  +Array.from({length:40},()=>{const x=r()*W,y=260+r()*230,s=8+r()*34;
    return path(`M${x},${y} l${s},${-s*.4} l${s*.8},${s*.5} l${-s*.7},${s*.45} z`,['#5a6870','#4a565e','#6a7880'][Math.floor(r()*3)],.9);}).join('')
  +person(430,420,.9,'#1c2428','down')
  +fog(120,120,'#8a97a0',.35,30);},

crawlnight(r){ return G('cn',[[0,'#05080c'],[.6,'#0a0e14'],[1,'#060a0e']])+rect(0,0,W,H,'url(#cn)')
  +stars(r,30,140,'#8fa8c0')
  +Array.from({length:20},()=>{const x=r()*W,y=200+r()*280,s=10+r()*40;
    return path(`M${x},${y} l${s},${-s*.3} l${s*.7},${s*.5} l${-s*.6},${s*.4} z`,'#0e141a',.9);}).join('')
  +snowfall(r,70,'#9fb4c4')
  +person(430,420,.9,'#040608','down')
  +fog(160,220,'#0a1016',.5,12,90);},

campnight(r){ return G('cm',[[0,'#060a12'],[.55,'#0a1018'],[1,'#0c1014']])+rect(0,0,W,H,'url(#cm)')
  +stars(r,80,220)
  +path(`M0,230 L200,150 L420,220 L660,140 L900,210 L900,500 L0,500 Z`,'#0a0e14')
  +RG('tg',[[0,'#f2b24a',.9],[.6,'#c96a2a',.4],[1,'#000',0]],.5,.5,.5)
  +`<ellipse cx="700" cy="420" rx="34" ry="20" fill="url(#tg)"/>`
  +path(`M685,428 l15,-22 l15,22 z`,'#e8b06a',.9)
  +person(180,450,.85,'#04070a','down');},

icegrave(r){ return rect(0,0,W,H,'#dfe8ee')+rect(0,0,W,H,'#eef4f6',.5)
  +Array.from({length:12},()=>{const x=r()*W,y=r()*H;
    return `<line x1="${x}" y1="${y}" x2="${x+30+r()*60}" y2="${y+4}" stroke="#c8d6dc" stroke-width="${1+r()*2}" opacity=".5"/>`;}).join('')
  +path(`M120,240 Q450,200 780,270 Q640,290 460,285 Q260,280 120,240 Z`,'#0a2836')
  +path(`M140,244 Q450,208 760,270`,'none',.7,` stroke="#5ab8d4" stroke-width="2"`)
  +`<path d="M420,255 q-30,-40 -60,-60" stroke="#8a7a5a" stroke-width="3" fill="none"/>`
  +snowfall(r,20,'#fff');},

/* ---------------- THE FURNACE ---------------- */
sandstorm(r){ return G('ss',[[0,'#8a5c34'],[.45,'#b07840'],[1,'#6a4426']])+rect(0,0,W,H,'url(#ss)')
  +circ(450,140,44,'#e8d4b0',.25)
  +Array.from({length:8},(_,i)=>fog(i*60,90,'#9a6838',.35+r()*.2,6+i*2,120)).join('')
  +Array.from({length:60},()=>{const x=r()*W,y=r()*H;
    return `<line x1="${x}" y1="${y}" x2="${x-24}" y2="${y+3}" stroke="#d4a86a" stroke-width="1" opacity="${.2+r()*.4}"/>`;}).join('')
  +person(380,440,.95,'#2a1a10');},

dunes(r){ return G('du',[[0,'#e8dcc4'],[.4,'#e0c89a'],[1,'#b08e5c']])+rect(0,0,W,H,'url(#du)')
  +sun(690,90,30,'#fff4d8','#f0d8a0')
  +Array.from({length:5},(_,i)=>path(`M${-100+i*40},${180+i*70} Q${300+i*60},${140+i*70} ${W+100},${200+i*66} L${W+100},500 L-100,500 Z`,
    ['#d8bc88','#c8a970','#b8975e','#a8854e','#987540'][i],1)).join('')
  +Array.from({length:4},(_,i)=>path(`M${-80+i*60},${200+i*68} Q${320+i*50},${158+i*70} ${W+80},${218+i*64}`,'none',.4,` stroke="#8a6c3e" stroke-width="1.5"`)).join('')
  +person(450,300,.8,'#3a2a16');},

shrine(r){ return G('sh',[[0,'#c9a878'],[.5,'#a8875a'],[1,'#5c4426']])+rect(0,0,W,H,'url(#sh)')
  +circ(180,110,26,'#f4e4c0',.8)
  +path(`M330,420 L340,300 Q360,260 450,255 Q540,260 560,300 L570,420 Z`,'#8a6c46')
  +`<ellipse cx="450" cy="262" rx="66" ry="40" fill="#c9b490"/>`
  +path(`M420,420 L424,340 Q450,330 476,340 L480,420 Z`,'#241608')
  +Array.from({length:12},()=>{const x=430+r()*60,y=180+r()*80;
    return path(`M${x},${y} q4,-4 8,0 q-4,-2 -8,0`,'#1a1008',.7);}).join('')
  +rect(0,420,W,80,'#9a7c50')
  +person(250,448,.9,'#2c1c0c');},

duskwalk(r){ return G('dk',[[0,'#0c1224'],[.55,'#1c2440'],[.8,'#4c3050'],[1,'#8a4838']])+rect(0,0,W,H,'url(#dk)')
  +stars(r,120,300,'#cfe0ff')
  +Array.from({length:4},(_,i)=>path(`M${-100+i*30},${260+i*60} Q${350+i*40},${230+i*58} ${W+100},${275+i*56} L${W+100},500 L-100,500 Z`,
    ['#141a2e','#101526','#0c111e','#080d16'][i],1)).join('')
  +path(`M-50,470 Q450,430 950,478`,'none',.6,` stroke="#2a3452" stroke-width="2" stroke-dasharray="3 9"`)
  +person(450,330,.75,'#04060c');},

noonshade(r){ return G('ns',[[0,'#f6ecd0'],[.5,'#f0dca8'],[1,'#d8b878']])+rect(0,0,W,H,'url(#ns)')
  +sun(450,90,54,'#fffef0','#f6e8b0')
  +fog(240,180,'#f0dca8',.5,10,60)
  +path(`M560,430 L580,300 Q620,270 680,290 L700,430 Z`,'#8a744c')
  +path(`M560,430 L700,430 L760,470 L520,470 Z`,'#6a5636',.5)
  +person(640,450,.85,'#3a2c16','sit')
  +rect(0,460,W,40,'#e0c890');},

planepass(r){ return G('pp',[[0,'#c8d8e0'],[.6,'#e8dcc0'],[1,'#d0b484']])+rect(0,0,W,H,'url(#pp)')
  +`<g transform="translate(620,110) rotate(-6)"><path d="M-16,0 L16,0 M0,-4 L0,4 M-6,-1 L-6,1" stroke="#4a5560" stroke-width="3" stroke-linecap="round"/></g>`
  +path(`M0,340 Q450,300 900,350 L900,500 L0,500 Z`,'#c8a870')
  +`<path d="M330,380 q10,-60 4,-110 q14,50 26,108" fill="#2a2018" opacity=".8"/>`
  +RG('fireg',[[0,'#f2b24a',.9],[1,'#000',0]],.5,.5,.5)+circ(345,392,26,'url(#fireg)')
  +person(400,420,.95,'#3a2a16');},

oasis(r){ return G('oa',[[0,'#e8d4a8'],[.5,'#d8bc84'],[1,'#a88854']])+rect(0,0,W,H,'url(#oa)')
  +circ(200,110,30,'#f8ecc8',.7)
  +path(`M0,330 Q450,300 900,335 L900,500 L0,500 Z`,'#b89860')
  +rect(0,360,W,60,'#4a6a3a',.7)
  +Array.from({length:8},(_,i)=>{const x=140+i*95+r()*30,h=40+r()*30;
    return `<line x1="${x}" y1="${400}" x2="${x}" y2="${400-h}" stroke="#3a4a26" stroke-width="4"/>`+
      Array.from({length:5},(_,j)=>path(`M${x},${400-h} q${(j-2)*16},${-8-r()*8} ${(j-2)*26},${4+r()*6}`,'none',.9,` stroke="#4a6a34" stroke-width="3" stroke-linecap="round"`)).join('');}).join('')
  +Array.from({length:5},()=>path(`M${300+r()*300},${408+r()*20} q4,-5 8,0 q-4,6 -8,0`,'#e8e2d2',.8)).join('')
  +`<path d="M600,395 q2,-30 0,-50 q10,24 6,50" fill="#8a97a0" opacity=".5"/>`
  +person(150,340,.85,'#3a2a16');},

/* ---------------- DEATH / META ARTS ---------------- */
whiteout(r){ return rect(0,0,W,H,'#c9d2d7')+rect(0,0,W,H,'#dfe6ea',.6)
  +snowfall(r,120)+fog(0,H,'#e4ebef',.6,16,80)
  +person(440,340,1,'#3a4046','down',);},

deepsea(r){ return G('ds',[[0,'#0a2430'],[.5,'#062028'],[1,'#020c10']])+rect(0,0,W,H,'url(#ds)')
  +Array.from({length:20},()=>{const x=r()*W,y=r()*H;return circ(x,y,1+r()*2,'#3a7080',.4);}).join('')
  +Array.from({length:8},(_,i)=>`<path d="M${100+i*100},500 q10,-200 0,-400" stroke="#0e3040" stroke-width="1" fill="none" opacity=".3"/>`).join('')
  +person(450,240,.8,'#04141a','down');},

baked(r){ return G('bk',[[0,'#f6e0a0'],[.4,'#f0b25a'],[.7,'#c96a3a'],[1,'#7a3a24']])+rect(0,0,W,H,'url(#bk)')
  +sun(450,180,60,'#fff6d0','#f6a03a')
  +fog(300,200,'#e8b060',.4,20)
  +Array.from({length:6},(_,i)=>`<path d="M${150+i*120},500 q0,-40 6,-60 q-6,20 -6,60" stroke="#c98a4a" stroke-width="2" fill="none" opacity=".4"><animateTransform attributeName="transform" type="translate" values="0,0;6,-6;0,0" dur="${3+i}s" repeatCount="indefinite"/></path>`).join('')
  +person(450,430,1,'#3a2414','down');},

gone(r){ return G('gn',[[0,'#0a0d10'],[1,'#020304']])+rect(0,0,W,H,'url(#gn)')
  +stars(r,40,H,'#4a5058')
  +RG('gg',[[0,'#1a2028',.5],[1,'#000',0]],.5,.6,.5)+circ(450,320,260,'url(#gg)')
  +person(450,360,1,'#0a0d10','sit');},

dawn(r){ return G('dw',[[0,'#f6d0a0'],[.3,'#f0a878'],[.55,'#c98a8a'],[.8,'#7a7a9a'],[1,'#3a4a6a']])+rect(0,0,W,H,'url(#dw)')
  +sun(450,300,46,'#fff0c8','#f6a85a')
  +path(`M0,360 L220,320 L440,360 L680,318 L900,360 L900,500 L0,500 Z`,'#2a3448',.9)
  +Array.from({length:30},()=>{const x=r()*W,y=r()*200;return circ(x,y,.8,'#fff',.4+r()*.4);}).join('')
  +person(448,360,1,'#1a2028');},

};

function paint(container, key, seed){
  const r=rng(seed||key);
  const body=(P[key]||P.gone)(r);
  container.innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}
return { paint };
})();

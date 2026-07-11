/* =====================================================================
   STILL BREATHING — audio.js
   Generative WebAudio. No files.
   - Each environment is a bed of shaped noise (wind / ocean / rain / fire /
     canyon drip) over a low drone.
   - A small "held-on" motif (like a distant bell, or a remembered song)
     plays only while the Grip is up. When Grip guts out, the tuning wanders
     and the motif stops — the sound of a mind letting go.
   AUDIO.setScene(regionKey, dayLevel, grip) ; AUDIO.setGrip(g) ; AUDIO.sting(kind)
   ===================================================================== */
const AUDIO = (() => {
let ctx=null, master=null, lp=null, current=null, muted=false;
let grip=4, motifTimer=null, pulseTimer=null;

const REGION_CFG = {
  // key: noise bed, filter, drone intervals, root(midi), motif(0-3), extra
  title:   { noise:'wind',  nf:[ 'bandpass',420,.7], root:50, drone:[0,7],    motif:2 },
  select:  { noise:'wind',  nf:[ 'bandpass',380,.7], root:48, drone:[0,7],    motif:1 },
  // ---- white mile (subarctic wreck) ----
  crash:   { noise:'wind',  nf:[ 'bandpass',300,.5], root:46, drone:[0,1],    motif:0, tick:1 },
  forest:  { noise:'wind',  nf:[ 'bandpass',500,.8], root:48, drone:[0,7],    motif:1 },
  river:   { noise:'water', nf:[ 'lowpass',600,.9],  root:47, drone:[0,7,12], motif:1 },
  ridge:   { noise:'wind',  nf:[ 'bandpass',900,.4], root:52, drone:[0,7],    motif:2, warm:1 },
  night:   { noise:'wind',  nf:[ 'bandpass',240,.6], root:43, drone:[0,3],    motif:0, tick:1 },
  camp:    { noise:'fire',  nf:[ 'bandpass',1200,.7],root:50, drone:[0,7],    motif:2, warm:1, crackle:1 },
  // ---- the raft (open ocean) ----
  sinking: { noise:'ocean', nf:[ 'lowpass',700,.8],  root:41, drone:[0,1],    motif:0, tick:1 },
  raft:    { noise:'ocean', nf:[ 'lowpass',480,.9],  root:47, drone:[0,7],    motif:1 },
  raftnight:{noise:'ocean', nf:[ 'lowpass',360,1],   root:44, drone:[0,7,12], motif:1 },
  open:    { noise:'ocean', nf:[ 'lowpass',300,1.1], root:45, drone:[0,5],    motif:0 },
  storm:   { noise:'storm', nf:[ 'bandpass',600,.4], root:40, drone:[0,1],    motif:0 },
  // ---- the pinch (slot canyon) ----
  slot:    { noise:'drip',  nf:[ 'bandpass',1600,3], root:45, drone:[0,1],    motif:0, tick:1 },
  slotday: { noise:'wind',  nf:[ 'bandpass',700,1.4],root:49, drone:[0,6],    motif:0 },
  slotnight:{noise:'drip',  nf:[ 'bandpass',1400,3], root:42, drone:[0,3],    motif:0, tick:1 },
  canyonout:{noise:'wind',  nf:[ 'bandpass',560,.8], root:50, drone:[0,7],    motif:2, warm:1 },
  rim:     { noise:'wind',  nf:[ 'bandpass',900,.5], root:55, drone:[0,7,12], motif:3, warm:1 },
  // ---- the trailhead (national park) ----
  trailday:{ noise:'wind',  nf:[ 'bandpass',900,.5], root:52, drone:[0,7,12], motif:2, warm:1 },
  offtrail:{ noise:'wind',  nf:[ 'bandpass',480,.9], root:47, drone:[0,6],    motif:0 },
  creekbed:{ noise:'water', nf:[ 'lowpass',800,.8],  root:45, drone:[0,3],    motif:0 },
  stormnight:{noise:'rain', nf:[ 'highpass',1600,.5],root:43, drone:[0,3],    motif:0, tick:1 },
  ridgeview:{noise:'wind',  nf:[ 'bandpass',1000,.4],root:50, drone:[0,7],    motif:1 },
  meadow:  { noise:'wind',  nf:[ 'bandpass',700,.6], root:50, drone:[0,7],    motif:2, warm:1 },
  faded:   { noise:'rain',  nf:[ 'highpass',1400,.4],root:42, drone:[0,1],    motif:0 },
  // ---- the crevasse (andes) ----
  hangface:{ noise:'storm', nf:[ 'bandpass',700,.4], root:41, drone:[0,1],    motif:0 },
  crevasse:{ noise:'drip',  nf:[ 'bandpass',1800,3], root:44, drone:[0,7,12], motif:0, tick:1 },
  glacierfield:{noise:'wind',nf:['bandpass',600,.6], root:46, drone:[0,7],    motif:1 },
  moraine: { noise:'water', nf:[ 'lowpass',900,.7],  root:47, drone:[0,5],    motif:1 },
  crawlnight:{noise:'storm',nf:[ 'bandpass',500,.5], root:42, drone:[0,3],    motif:0, tick:1 },
  campnight:{noise:'wind',  nf:[ 'bandpass',400,.6], root:48, drone:[0,7,12], motif:2, warm:1 },
  icegrave:{ noise:'wind',  nf:[ 'bandpass',300,.5], root:42, drone:[0,1],    motif:0 },
  // ---- the furnace (sahara) ----
  sandstorm:{noise:'storm', nf:[ 'bandpass',900,.3], root:40, drone:[0,1],    motif:0 },
  dunes:   { noise:'wind',  nf:[ 'bandpass',1100,.3],root:49, drone:[0,6],    motif:0 },
  shrine:  { noise:'wind',  nf:[ 'bandpass',500,.9], root:45, drone:[0,3,7],  motif:1, tick:1 },
  duskwalk:{ noise:'wind',  nf:[ 'bandpass',700,.4], root:50, drone:[0,7,12], motif:2 },
  noonshade:{noise:'wind',  nf:[ 'bandpass',1600,.2],root:47, drone:[0,6],    motif:0 },
  planepass:{noise:'wind',  nf:[ 'bandpass',800,.4], root:46, drone:[0,5],    motif:1 },
  oasis:   { noise:'wind',  nf:[ 'bandpass',600,.5], root:52, drone:[0,7,12], motif:3, warm:1 },
  // ---- meta ----
  dawn:    { noise:'wind',  nf:[ 'bandpass',800,.4], root:57, drone:[0,7,12,16], motif:3, warm:1 },
};
const HOLD_MOTIF = [0,7,12,7,15,12];     // the "still here" phrase, semitones above root
/* each ordeal holds on in its own voice */
const MOTIFS = {
  white:  [0,7,12,7,15,12],     // rising fifths — cold hope
  raft:   [0,5,7,5,0,-5],      // a swell that rocks and falls away
  pinch:  [0,1,0,1,3,1],       // the semitone grind of stone
  trail:  [0,4,7,9,7,4],       // pastoral pentatonic, fraying
  crev:   [0,3,7,10,12,10],    // a minor climb, twenty minutes at a time
  furnace:[0,2,3,7,3,2],       // phrygian shimmer off the sand
};
const midiHz = m => 440*Math.pow(2,(m-69)/12);
let motifNotes = HOLD_MOTIF, danger = 6, heartTimer = null;

function ensure(){
  if (ctx) return true;
  try{
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    master=ctx.createGain(); master.gain.value=muted?0:.5;
    lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=2400;
    lp.connect(master); master.connect(ctx.destination);
    return true;
  }catch(e){ return false; }
}
function noiseBuf(){
  const b=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  return b;
}
function stopCurrent(){
  if(motifTimer){clearTimeout(motifTimer);motifTimer=null;}
  if(pulseTimer){clearInterval(pulseTimer);pulseTimer=null;}
  if(!current) return;
  const t=ctx.currentTime;
  current.gains.forEach(g=>{try{g.gain.setTargetAtTime(0,t,.6);}catch(e){}});
  const dead=current;
  setTimeout(()=>dead.nodes.forEach(n=>{try{n.stop?n.stop():n.disconnect();}catch(e){}}),2200);
  current=null;
}
function osc(type,freq,gainVal,dest){
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type=type; o.frequency.value=freq; g.gain.value=0;
  g.gain.setTargetAtTime(gainVal,ctx.currentTime,1.6);
  o.connect(g); g.connect(dest); o.start();
  return {o,g};
}
function bell(freq,vol=.12,dur=2.2,type='sine'){
  if(!ctx||muted) return;
  const o=ctx.createOscillator(), g=ctx.createGain(), t=ctx.currentTime;
  o.type=type; o.frequency.value=freq;
  const o2=ctx.createOscillator(), g2=ctx.createGain();
  o2.type='sine'; o2.frequency.value=freq*2.005; g2.gain.value=vol*.3;
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.02);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  g2.gain.setValueAtTime(vol*.35,t); g2.gain.exponentialRampToValueAtTime(.0001,t+dur*.5);
  o.connect(g); o2.connect(g2); g.connect(lp); g2.connect(lp);
  o.start(t); o2.start(t); o.stop(t+dur+.1); o2.stop(t+dur+.1);
}
function scheduleMotif(cfg, root){
  if(motifTimer) clearTimeout(motifTimer);
  const go=()=>{
    if(!current) return;
    const lvl=Math.max(0,grip);
    // the motif only holds while the mind holds. warm scenes ring purer.
    if(cfg.motif>0 && lvl>=2){
      const span=2+Math.min(4,lvl-1)+(cfg.motif>=2?1:0);
      const notes=motifNotes.slice(0,span);
      const detune = grip<=3 ? (Math.random()-.5)*14 : 0;  // wavering when worn down
      notes.forEach((n,i)=>setTimeout(()=>bell(midiHz(root+12+n)*Math.pow(2,detune/1200),
        .045+.011*lvl,2.4,cfg.warm?'triangle':'sine'), i*420));
    }
    const wait=9000 - lvl*850 - cfg.motif*1400 + Math.random()*4500;
    motifTimer=setTimeout(go,Math.max(3800,wait));
  };
  motifTimer=setTimeout(go,1600);
}
function setScene(regionKey, dayLvl, gripLvl, scenario){
  grip=gripLvl;
  if(scenario && MOTIFS[scenario]) motifNotes=MOTIFS[scenario];
  else if(!scenario) motifNotes=HOLD_MOTIF;
  if(!ensure()) return;
  if(ctx.state==='suspended') ctx.resume();
  const cfg=REGION_CFG[regionKey]||REGION_CFG.title;
  stopCurrent();
  const rootMidi=cfg.root;
  lp.frequency.setTargetAtTime(cfg.warm?3600:Math.max(360,1900-(dayLvl||0)*120),ctx.currentTime,1.2);
  const nodes=[], gains=[];
  // drone
  cfg.drone.forEach((iv,ix)=>{
    const f=midiHz(rootMidi+iv);
    const a=osc(cfg.warm?'triangle':'sawtooth', f,(ix===0?.05:.026)*(cfg.warm?1.3:1),lp);
    a.o.detune.value=(ix%2?5:-5); nodes.push(a.o); gains.push(a.g);
    if(!cfg.warm){ const b=osc('sine',f/2,.038,lp); nodes.push(b.o); gains.push(b.g); }
  });
  // noise bed
  const src=ctx.createBufferSource(); src.buffer=noiseBuf(); src.loop=true;
  const f=ctx.createBiquadFilter(), g=ctx.createGain(); g.gain.value=0;
  f.type=cfg.nf[0]; f.frequency.value=cfg.nf[1]; f.Q.value=cfg.nf[2];
  const bedLvl={wind:.06,water:.09,ocean:.1,storm:.14,fire:.08,drip:.03}[cfg.noise]||.06;
  src.connect(f); f.connect(g); g.connect(lp);
  g.gain.setTargetAtTime(bedLvl,ctx.currentTime,2);
  // weather movement LFO
  const lfo=ctx.createOscillator(), lg=ctx.createGain();
  lfo.frequency.value=cfg.noise==='storm'?.16:cfg.noise==='ocean'?.09:.05;
  lg.gain.value=cfg.nf[1]*.55; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
  src.start(); nodes.push(src,lfo); gains.push(g);
  current={nodes,gains};
  // texture pulses
  if(pulseTimer) clearInterval(pulseTimer);
  if(cfg.crackle){
    pulseTimer=setInterval(()=>{ if(muted)return;
      for(let i=0;i<2+Math.random()*3;i++) setTimeout(()=>bell(1400+Math.random()*1600,.02,.05,'square'),Math.random()*900);
    },700);
  } else if(cfg.noise==='drip'){
    pulseTimer=setInterval(()=>{ if(muted)return;
      bell(midiHz(rootMidi+24+Math.floor(Math.random()*4)*5),.05,.6); },1900+Math.random()*1500);
  } else if(cfg.tick){
    pulseTimer=setInterval(()=>{ if(muted)return; bell(midiHz(rootMidi-12),.05,.5); },1600);
  }
  scheduleMotif(cfg,rootMidi);
}
function setGrip(g){ grip=g; }
/* the heartbeat: rises out of the mix as the worst vital falls */
function setDanger(minVital){
  danger=minVital;
  if(heartTimer){ clearInterval(heartTimer); heartTimer=null; }
  if(!ctx || danger>=3) return;
  const rate = danger<=0 ? 700 : danger===1 ? 950 : 1350;
  const vol  = danger<=0 ? .34 : danger===1 ? .24 : .13;
  heartTimer=setInterval(()=>{ if(muted) return;
    bell(41,vol,.22); setTimeout(()=>bell(36,vol*.8,.26),180);
  }, rate);
}
function sting(kind){
  if(!ctx||muted) return;
  if(kind==='find'){ [0,4,7].forEach((n,i)=>setTimeout(()=>bell(midiHz(52+n),.09,1.4,'triangle'),i*110)); }
  else if(kind==='hope'){ bell(midiHz(60),.13,2.6,'triangle'); setTimeout(()=>bell(midiHz(67),.1,2.8,'triangle'),240); }
  else if(kind==='hurt'){ bell(midiHz(33),.28,.5,'sawtooth'); }
  else if(kind==='death'){ if(heartTimer){clearInterval(heartTimer);heartTimer=null;}
    bell(midiHz(31),.32,3.4); setTimeout(()=>bell(midiHz(30),.2,4.5),900); }
  else if(kind==='survive'){ if(heartTimer){clearInterval(heartTimer);heartTimer=null;}
    [0,4,7,12].forEach((n,i)=>setTimeout(()=>bell(midiHz(57+n),.11,2.2,'triangle'),i*170)); }
  else if(kind==='true'){ if(heartTimer){clearInterval(heartTimer);heartTimer=null;}
    [0,4,7,12,16,19,24].forEach((n,i)=>setTimeout(()=>bell(midiHz(57+n),.1,2.8,'triangle'),i*210)); }
  else if(kind==='myth'){ bell(midiHz(46),.1,1.6,'sawtooth'); }
  else bell(midiHz(55),.06,.8);
}
function toggleMute(){ muted=!muted;
  if(master) master.gain.setTargetAtTime(muted?0:.5,ctx.currentTime,.2);
  return muted; }
return { setScene, setGrip, setDanger, sting, toggleMute, get muted(){return muted;} };
})();

/* =====================================================================
   STILL BREATHING — images.js
   Manifest of generated art (frostbitten-realism stills, Higgsfield
   nano_banana_pro, sliced from 2K sheets). The engine tries these first
   and falls back to ART.paint's procedural SVG if a file is missing —
   the game never breaks without its assets.
   ===================================================================== */
const IMAGES = (() => {
  const scenes = ['title','crash','forest','river','ridge','night','camp',
    'sinking','raft','raftnight','open','storm',
    'slot','slotday','slotnight','canyonout','rim',
    'trailday','offtrail','creekbed','stormnight','ridgeview','meadow','faded',
    'hangface','crevasse','glacierfield','moraine','crawlnight','campnight','icegrave',
    'sandstorm','dunes','shrine','duskwalk','noonshade','planepass','oasis',
    'whiteout','deepsea','baked','gone','dawn'];
  const cards = { white:'assets/cards/white.jpg', raft:'assets/cards/raft.jpg',
    pinch:'assets/cards/pinch.jpg', trail:'assets/cards/trail.jpg',
    crev:'assets/cards/crev.jpg', furnace:'assets/cards/furnace.jpg' };
  return {
    has: k => scenes.includes(k),
    url: k => `assets/scenes/${k}.jpg`,
    card: s => cards[s] || null,
  };
})();

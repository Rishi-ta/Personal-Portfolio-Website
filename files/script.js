/* ============================================
   LOADER
============================================ */
const loaderStatusEl = document.getElementById('loader-status');
const loaderMessages = ['Spinning up the web…','Mapping the skyline…','Almost there…'];
let lm = 0;
const loaderInterval = setInterval(()=>{
  lm = (lm+1) % loaderMessages.length;
  if(loaderStatusEl) loaderStatusEl.textContent = loaderMessages[lm];
},700);

window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    clearInterval(loaderInterval);
    document.getElementById('main-nav').classList.add('in');
    playHeroIntro();
  }, 1900);
});

/* ============================================
   REDUCED MOTION CHECK
============================================ */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================
   CUSTOM WEB CURSOR
============================================ */
const cursorDot = document.getElementById('cursor-dot');
const webLine = document.getElementById('web-line');
let mouseX = innerWidth/2, mouseY = innerHeight/2;
let anchorPoints = [];

function collectAnchors(){
  anchorPoints = Array.from(document.querySelectorAll('.nav-logo, .section-title, .hero-name'))
    .map(el=>{
      const r = el.getBoundingClientRect();
      return {x:r.left+r.width/2, y:r.top+r.height/2, el};
    });
}
collectAnchors();
window.addEventListener('resize', collectAnchors);
window.addEventListener('scroll', collectAnchors, {passive:true});

if(!prefersReducedMotion){
  window.addEventListener('mousemove', e=>{
    mouseX = e.clientX; mouseY = e.clientY;
    cursorDot.style.left = mouseX+'px';
    cursorDot.style.top = mouseY+'px';

    // find nearest anchor within range
    let nearest = null, nd = 220;
    for(const a of anchorPoints){
      const dx = a.x-mouseX, dy = a.y-mouseY;
      const dist = Math.sqrt(dx*dx+dy*dy);
      if(dist < nd){ nd = dist; nearest = a; }
    }
    if(nearest){
      webLine.setAttribute('x1', nearest.x);
      webLine.setAttribute('y1', nearest.y);
      webLine.setAttribute('x2', mouseX);
      webLine.setAttribute('y2', mouseY);
      webLine.classList.add('active');
      cursorDot.classList.add('anchor-near');
    } else {
      webLine.classList.remove('active');
      cursorDot.classList.remove('anchor-near');
    }
  });

  // hover state for interactive elements
  document.querySelectorAll('a, button, .project-card, .skill-node-group').forEach(el=>{
    el.addEventListener('mouseenter', ()=>cursorDot.classList.add('anchor-near'));
    el.addEventListener('mouseleave', ()=>cursorDot.classList.remove('anchor-near'));
  });
}

/* ============================================
   HERO INTRO (orchestrated, one-time)
============================================ */
function playHeroIntro(){
  if(prefersReducedMotion){
    document.querySelectorAll('.hero-eyebrow,.hero-sub,.hero-tags,.hero-cta,.scroll-cue').forEach(el=>el.style.opacity=1);
    return;
  }
  const tl = gsap.timeline();
  tl.to('.hero-eyebrow', {opacity:1, y:0, duration:.5, ease:'power2.out'})
    .from('.hero-name .line', {yPercent:110, duration:.8, stagger:.08, ease:'power4.out'}, '-=.2')
    .to('.hero-sub', {opacity:1, duration:.5}, '-=.3')
    .to('.hero-tags', {opacity:1, duration:.5}, '-=.2')
    .to('.hero-cta', {opacity:1, duration:.5}, '-=.2')
    .to('.scroll-cue', {opacity:1, duration:.5}, '-=.1');
}

/* ============================================
   NAV SHOW/HIDE ON SCROLL DIRECTION
============================================ */
let lastScrollY = window.scrollY;
const navEl = document.getElementById('main-nav');
window.addEventListener('scroll', ()=>{
  const y = window.scrollY;
  if(y > lastScrollY && y > 200){ navEl.classList.add('nav-hide'); }
  else { navEl.classList.remove('nav-hide'); }
  lastScrollY = y;
}, {passive:true});

/* ============================================
   SMOOTH ANCHOR SCROLL
============================================ */
document.querySelectorAll('[data-anchor]').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if(target) target.scrollIntoView({behavior:'smooth'});
  });
});

/* ============================================
   SCROLL REVEAL
============================================ */
const revealObserver = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, {threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));

/* ============================================
   3D SKYLINE BACKDROP (three.js)
   Subtle, low-poly buildings the camera drifts past
   as the user scrolls — depth, not noise.
============================================ */
(function initSkyline(){
  const canvas = document.getElementById('skyline-canvas');
  if(!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 200);
  camera.position.set(0, 4, 18);

  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth, innerHeight);

  // building field
  const buildingGroup = new THREE.Group();
  const redMat = new THREE.MeshBasicMaterial({color:0xD32F2F, transparent:true, opacity:0.18, wireframe:true});
  const blueMat = new THREE.MeshBasicMaterial({color:0x1A237E, transparent:true, opacity:0.22, wireframe:true});

  const buildingCount = 60;
  for(let i=0;i<buildingCount;i++){
    const w = 1 + Math.random()*2.5;
    const h = 3 + Math.random()*14;
    const d = 1 + Math.random()*2.5;
    const geo = new THREE.BoxGeometry(w,h,d);
    const mat = Math.random() > 0.5 ? redMat : blueMat;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random()-0.5)*60,
      h/2 - 10 - Math.random()*40,
      (Math.random()-0.5)*40 - 10
    );
    buildingGroup.add(mesh);
  }
  scene.add(buildingGroup);

  // faint particle "stars/web dust"
  const starGeo = new THREE.BufferGeometry();
  const starCount = 300;
  const positions = new Float32Array(starCount*3);
  for(let i=0;i<starCount;i++){
    positions[i*3] = (Math.random()-0.5)*80;
    positions[i*3+1] = (Math.random()-0.5)*120;
    positions[i*3+2] = (Math.random()-0.5)*60 - 10;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions,3));
  const starMat = new THREE.PointsMaterial({color:0xF5F5F5, size:0.06, transparent:true, opacity:0.4});
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  function resize(){
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }
  window.addEventListener('resize', resize);

  let targetMouseX = 0, targetMouseY = 0;
  window.addEventListener('mousemove', e=>{
    targetMouseX = (e.clientX/innerWidth - 0.5);
    targetMouseY = (e.clientY/innerHeight - 0.5);
  });

  let scrollProgress = 0;
  function updateScroll(){
    const docHeight = document.documentElement.scrollHeight - innerHeight;
    scrollProgress = docHeight > 0 ? window.scrollY / docHeight : 0;
  }
  window.addEventListener('scroll', updateScroll, {passive:true});
  updateScroll();

  let camX=0, camY=4;
  function animate(){
    requestAnimationFrame(animate);

    // camera drifts downward through the "skyline" as user scrolls
    camY = 4 - scrollProgress*36;
    camX += ((targetMouseX*2) - camX) * 0.03;

    camera.position.y += (camY - camera.position.y) * 0.08;
    camera.position.x += (camX - camera.position.x) * 0.04;
    camera.rotation.z = targetMouseX * 0.02;
    camera.lookAt(0, camera.position.y - 2, 0);

    buildingGroup.rotation.y += 0.0006;
    stars.rotation.y += 0.0002;

    renderer.render(scene, camera);
  }
  if(!prefersReducedMotion){
    animate();
  } else {
    renderer.render(scene, camera);
  }
})();

/* ============================================
   SKILLS — WEB MAP (SVG, generated)
============================================ */
(function buildSkillWeb(){
  const svg = document.getElementById('skill-web');
  if(!svg) return;

  const W = 1000, H = 640, CX = W/2, CY = H/2;
  const skills = [
    {name:'C', sub:'systems', level:0.85, angle:-90, fact:'Core programming foundation'},
    {name:'Backend Dev', sub:'server-side', level:0.9, angle:-50, fact:'Building scalable APIs and server logic'},
    {name:'Python', sub:'scripting & AI', level:0.95, angle:-10, fact:'Primary language for AI/ML & backend'},
    {name:'DSA', sub:'algorithms', level:0.85, angle:30, fact:'Data structures & algorithm design'},
    {name:'SQL', sub:'databases', level:0.85, angle:70, fact:'Relational database management & queries'},
    {name:'HTML & CSS', sub:'frontend', level:0.8, angle:110, fact:'The foundation of modern web design'},
    {name:'C++', sub:'OOP & logic', level:0.85, angle:150, fact:'Competitive programming and system design'},
    {name:'AI & ML', sub:'machine learning', level:0.95, angle:190, fact:'Artificial Intelligence & Machine Learning'},
    {name:'Cyber Security', sub:'security', level:0.8, angle:230, fact:'Systems defense, vulnerability analysis & secure code'},
  ];

  const radius = 215;
  let svgMarkup = '';

  // strands from center to each node
  skills.forEach((s,i)=>{
    const rad = s.angle * Math.PI/180;
    const x = CX + Math.cos(rad)*radius;
    const y = CY + Math.sin(rad)*radius;
    s._x = x; s._y = y;
    svgMarkup += `<path class="web-strand" data-i="${i}" d="M${CX},${CY} L${x},${y}"/>`;
  });

  // connecting ring strands (skills relate to each other)
  skills.forEach((s,i)=>{
    const next = skills[(i+1)%skills.length];
    svgMarkup += `<path class="web-strand" data-ring="${i}" d="M${s._x},${s._y} L${next._x},${next._y}"/>`;
  });

  // center node
  svgMarkup += `
    <circle class="skill-center-circle" cx="${CX}" cy="${CY}" r="46"/>
    <text class="skill-center-label" x="${CX}" y="${CY+7}">RJ</text>
  `;

  // outer nodes
  skills.forEach((s,i)=>{
    const r = s.name.length > 10 ? 46 : (32 + s.level*14);
    const fontSize = s.name.length > 10 ? '11px' : '13px';
    svgMarkup += `
      <g class="skill-node-group" data-i="${i}" tabindex="0" role="img" aria-label="${s.name}, ${s.sub}">
        <circle class="skill-node-circle" cx="${s._x}" cy="${s._y}" r="${r}"/>
        <text class="skill-node-label" x="${s._x}" y="${s._y - 2}" style="font-size:${fontSize}">${s.name}</text>
        <text class="skill-node-sub" x="${s._x}" y="${s._y + 16}">${s.sub}</text>
      </g>
    `;
  });

  svg.innerHTML = svgMarkup;

  // draw-in on scroll into view
  const webObserver = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        svg.querySelectorAll('.web-strand').forEach((line,idx)=>{
          setTimeout(()=>line.classList.add('drawn'), idx*60);
        });
        webObserver.unobserve(e.target);
      }
    });
  }, {threshold:.2});
  webObserver.observe(svg);

  // light up strands on node hover
  svg.querySelectorAll('.skill-node-group').forEach(g=>{
    const i = g.getAttribute('data-i');
    g.addEventListener('mouseenter', ()=>{
      svg.querySelector(`.web-strand[data-i="${i}"]`)?.classList.add('lit');
    });
    g.addEventListener('mouseleave', ()=>{
      svg.querySelector(`.web-strand[data-i="${i}"]`)?.classList.remove('lit');
    });
  });
})();

/* ============================================
   PROJECT DETAIL OVERLAY
============================================ */
const projectData = {
  whatsapp:{
    eyebrow:'01 · AI Agent',
    title:'WhatsApp AI Agent',
    desc:"An AI-powered agent integrated with WhatsApp to handle intelligent conversations, automate responses, and assist users in real time — bridging everyday messaging with the power of modern AI.",
    stack:'Python, WhatsApp API, AI/ML, Backend Development.',
    challenge:'Integrating a seamless AI response loop within WhatsApp\'s messaging constraints while keeping latency low and responses contextually accurate.',
    contribution:'Designed and built the full agent pipeline: message handling, AI integration, and deployment.',
    links:[{label:'View on GitHub', href:'https://github.com/Rishi-ta/whatsapp-ai-agent'}]
  },
  rag:{
    eyebrow:'02 · AI / RAG System',
    title:'Enterprise Knowledge Base RAG',
    desc:'A Retrieval-Augmented Generation (RAG) system built for enterprise use — enabling organizations to query their internal knowledge base using natural language and get accurate, context-aware answers powered by LLMs.',
    stack:'Python, LLMs, Vector Database, Backend Development, SQL.',
    challenge:'Designing an efficient retrieval pipeline that keeps answers grounded in the actual knowledge base and scales with large document sets.',
    contribution:'Contributed to the RAG pipeline architecture, document ingestion, and query flow.',
    links:[{label:'View on GitHub', href:'https://github.com/edulinkup-interns/Enterprise-knowledge-base-rag'}]
  },
  bachat:{
    eyebrow:'03 · Finance App',
    title:'BachatBhaiya',
    desc:'A personal finance management application designed to help users track their savings, expenses, and budgets — making financial planning simple and accessible.',
    stack:'Python, Backend Development, SQL, Data management.',
    challenge:'Building an intuitive finance tracking experience that encourages consistent usage and gives users meaningful insights into their spending habits.',
    contribution:'Collaborated on the core finance logic, data modeling, and backend architecture.',
    links:[{label:'View on GitHub', href:'https://github.com/AryanV-Coder/BachatBhaiya'}]
  }
};

const overlay = document.getElementById('project-overlay');
const overlayContent = document.getElementById('overlay-content');

document.querySelectorAll('.project-card').forEach(card=>{
  card.addEventListener('click', ()=>{
    const key = card.getAttribute('data-project');
    const p = projectData[key];
    if(!p) return;
    overlayContent.innerHTML = `
      <div class="overlay-eyebrow">${p.eyebrow}</div>
      <h3 class="overlay-title">${p.title}</h3>
      <p class="overlay-desc">${p.desc}</p>
      <div class="overlay-grid">
        <div>
          <div class="overlay-block-label">Tech Stack</div>
          <div class="overlay-block-content">${p.stack}</div>
        </div>
        <div>
          <div class="overlay-block-label">Main Challenge</div>
          <div class="overlay-block-content">${p.challenge}</div>
        </div>
        <div>
          <div class="overlay-block-label">My Contribution</div>
          <div class="overlay-block-content">${p.contribution}</div>
        </div>
      </div>
      <div class="overlay-links">
        ${p.links.map(l=>`<a class="overlay-link" href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join('')}
      </div>
    `;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

document.getElementById('overlay-close').addEventListener('click', closeOverlay);
overlay.addEventListener('click', e=>{ if(e.target === overlay) closeOverlay(); });
window.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeOverlay(); });

function closeOverlay(){
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ============================================
   AI CHAT
   NOTE: This calls a placeholder /api/chat endpoint.
   See the note left for Rishita in the README about
   wiring this to a real serverless backend safely.
============================================ */
const messagesEl = document.getElementById('chat-messages');
const typingEl = document.getElementById('typing');
const inputEl = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
let chatHistory = [];

function addMsg(text, role){
  const div = document.createElement('div');
  div.className = `msg ${role === 'user' ? 'user' : 'bot'}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage(presetText){
  const text = (presetText || inputEl.value).trim();
  if(!text) return;
  inputEl.value = '';
  sendBtn.disabled = true;
  addMsg(text, 'user');
  chatHistory.push({role:'user', content:text});
  typingEl.style.display = 'flex';
  messagesEl.scrollTop = messagesEl.scrollHeight;

  try{
    // IMPORTANT: this must point to YOUR OWN backend endpoint
    // (e.g. a Vercel/Netlify serverless function) that holds the
    // Anthropic API key server-side. Never call api.anthropic.com
    // directly from this file — see README.
    const res = await fetch('/api/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({messages: chatHistory})
    });
    if(!res.ok) throw new Error('Backend not configured');
    const data = await res.json();
    const reply = data.reply || "Sorry, I had trouble responding. Try again!";
    chatHistory.push({role:'assistant', content:reply});
    typingEl.style.display = 'none';
    addMsg(reply, 'bot');
  }catch(e){
    typingEl.style.display = 'none';
    const lower = text.toLowerCase();
    let reply = "";
    if(lower.includes('skill')) {
      reply = "Rishita's core skills include: C, Backend Development, Python, DSA, SQL, HTML & CSS, C++, Artificial Intelligence & Machine Learning, and Cyber Security. 🕸️";
    } else if(lower.includes('project') || lower.includes('built') || lower.includes('work')) {
      reply = "Rishita's top projects are:\n1. WhatsApp AI Agent (github.com/Rishi-ta/whatsapp-ai-agent2nd)\n2. Enterprise Knowledge Base RAG (github.com/edulinkup-interns/Enterprise-knowledge-base-rag)\n3. BachatBhaiya (github.com/AryanV-Coder/BachatBhaiya)";
    } else if(lower.includes('study') || lower.includes('education') || lower.includes('college')) {
      reply = "Rishita is pursuing her B.Tech in Computer Science Engineering at Jaypee Institute of Information Technology (2024–2028).";
    } else if(lower.includes('contact') || lower.includes('email') || lower.includes('reach')) {
      reply = "You can reach out to Rishita at jharishita23@gmail.com, or connect via GitHub (github.com/Rishi-ta) and LinkedIn!";
    } else {
      reply = "Ask me about Rishita's skills, top projects, education, or contact info using the buttons above! 🕸️";
    }
    chatHistory.push({role:'assistant', content:reply});
    addMsg(reply, 'bot');
  }
  sendBtn.disabled = false;
}

sendBtn.addEventListener('click', ()=>sendMessage());
inputEl.addEventListener('keydown', e=>{ if(e.key === 'Enter') sendMessage(); });
document.querySelectorAll('.ai-chip').forEach(chip=>{
  chip.addEventListener('click', ()=>sendMessage(chip.getAttribute('data-q')));
});

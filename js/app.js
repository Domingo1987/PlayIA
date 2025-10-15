/* utilidades */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

/* año footer */
$('#y').textContent = new Date().getFullYear();

/* -------- scroll infinito (sección ¿qué es?) -------- */
const stream = $('#infinite-stream');
const sentinel = $('#stream-sentinel');
let streamBatch = 0;

function addStreamBatch(){
  const n = 6; // 6 tarjetas por batch
  for(let i=0;i<n;i++){
    const card = document.createElement('article');
    card.className = 'card-note';
    card.innerHTML = `<h3>idea #${streamBatch*n + (i+1)}</h3>
      <p>ejemplo de uso del mazo para una dinámica rápida en clase.</p>`;
    stream.appendChild(card);
  }
  streamBatch++;
}

const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ addStreamBatch(); }
  })
}, {rootMargin:'1000px'});

io.observe(sentinel);
addStreamBatch(); // primer lote

/* -------- mazo de IA (flip al hover) -------- */
const IA_CARDS = [
  { id:'gpt',  nombre:'gpt',  img:'tapa-gpt.png',    back:'fondo-gpt.png',   desc:'modelo conversacional y de razonamiento.' },
  { id:'gem',  nombre:'gemini',img:'tapa-gemini.png',back:'fondo-gemini.png',desc:'multimodal rápido para prototipos.' },
  { id:'cla',  nombre:'claude',img:'tapa-claude.png',back:'fondo-claude.png',desc:'redacción y análisis extensos.' },
  { id:'mid',  nombre:'midjourney',img:'tapa-mid.png',back:'fondo-mid.png',desc:'generación de imágenes.' },
  { id:'flux', nombre:'flux', img:'tapa-flux.png',   back:'fondo-flux.png',  desc:'imagen y estilo creativo.' },
  { id:'sdxl', nombre:'stable diffusion',img:'tapa-sdxl.png',back:'fondo-sdxl.png',desc:'imagen local/auto-hospedada.' },
  { id:'suno', nombre:'suno', img:'tapa-suno.png',   back:'fondo-suno.png',  desc:'música con ia.' },
  { id:'whis', nombre:'whisper',img:'tapa-whisper.png',back:'fondo-whisper.png',desc:'transcripción de audio.' },
  { id:'ras',  nombre:'rasa', img:'tapa-rasa.png',   back:'fondo-rasa.png',  desc:'chatbots on‑premise.' },
  { id:'hf',   nombre:'hugging face',img:'tapa-hf.png',back:'fondo-hf.png',  desc:'ecosistema de modelos.' },
];

function dataImg(path, label='carta'){
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 900'>\n`+
    `<defs><linearGradient id='g' x1='0' x2='0' y1='0' y2='1'><stop offset='0' stop-color='#0e1a33'/><stop offset='1' stop-color='#132248'/></linearGradient></defs>`+
    `<rect rx='36' ry='36' width='100%' height='100%' fill='url(#g)' stroke='#1f2c4f'/>`+
    `<g fill='#e6edf3' font-family='system-ui,Segoe UI,Arial' text-anchor='middle'>`+
    `<text x='50%' y='48%' font-size='64' font-weight='700'>${label}</text>`+
    `</g></svg>`);
  return `data:image/svg+xml;charset=utf-8,${svg}`;
}

function buildIaGrid(){
  const grid = $('#ia-grid');
  grid.innerHTML = '';
  IA_CARDS.forEach(c => {
    const flip = document.createElement('article');
    flip.className = 'flip';
    flip.setAttribute('role','listitem');
    flip.innerHTML = `
      <div class='flip-inner'>
        <div class='flip-face front'>
          <div class='card'>
            <img src='./assets/mazo-ia/${c.img}' alt='${c.nombre}' onerror="this.src='${dataImg('', c.nombre)}'"/>
          </div>
        </div>
        <div class='flip-face back'>
          <div class='card'>
            <img src='./assets/mazo-ia/${c.back}' alt='${c.nombre} reverso' onerror="this.src='${dataImg('', 'reverso')}'"/>
          </div>
          <div class='flip-meta'>
            <h3>${c.nombre}</h3>
            <p>${c.desc}</p>
          </div>
        </div>
      </div>`;
    grid.appendChild(flip);
  })
}

buildIaGrid();

/* -------- mazo de problemas (simulación 4s) -------- */
const PROB_FILES = Array.from({length: 20}, (_,i)=>`fondo-${String(i+1).padStart(2,'0')}.png`);
const PROB_BACK = 'tapa-prob.png';

const probState = { deck: [], drawn: [], busy: false };

function buildProbDeck(){
  // baraja simple
  probState.deck = PROB_FILES.map(name => ({ name, path:`./assets/mazo-prob/${name}` }));
  // mezclar
  for(let i=probState.deck.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [probState.deck[i], probState.deck[j]] = [probState.deck[j], probState.deck[i]];
  }
  probState.drawn = [];
  renderProb();
}

function renderProb(){
  const deckEl = $('#prob-deck');
  const drawnEl = $('#prob-drawn');
  const currentEl = $('#prob-current');

  deckEl.innerHTML = '';
  const layers = Math.min(probState.deck.length, 12);
  for(let i=0;i<layers;i++){
    const z = i; // profundidad
    const card = document.createElement('div');
    card.className = 'card card--mini';
    card.style.setProperty('--tx', `${i*1.2}px`);
    card.style.setProperty('--ty', `${i*1.2}px`);
    card.style.setProperty('--rot', `${(i%3-1)*1.5}deg`);
    const img = document.createElement('img');
    img.alt = 'carta (reverso)';
    img.src = `./assets/mazo-prob/${PROB_BACK}`;
    img.onerror = ()=> img.src = dataImg('', 'reverso');
    card.appendChild(img);
    deckEl.appendChild(card);
  }

  drawnEl.innerHTML = '';
  probState.drawn.slice(-10).forEach(c => {
    const d = document.createElement('div');
    d.className = 'card card--mini';
    const img = document.createElement('img');
    img.alt = c.name;
    img.src = c.path;
    img.onerror = ()=> img.src = dataImg('', 'carta');
    d.appendChild(img);
    drawnEl.appendChild(d);
  });

  currentEl.innerHTML = '';
  if(probState.drawn.length){
    const top = probState.drawn[probState.drawn.length-1];
    const big = document.createElement('div');
    big.className = 'card';
    const img = document.createElement('img');
    img.alt = top.name;
    img.src = top.path;
    img.onerror = ()=> img.src = dataImg('', 'seleccionada');
    big.appendChild(img);
    currentEl.appendChild(big);
  }
}

async function simularRobo4s(){
  if(probState.busy || probState.deck.length === 0) return;
  probState.busy = true;
  const tTotal = 4000; // 4s
  const steps = 12;    // pasos de animación
  const delay = Math.floor(tTotal / steps);

  // pre-animación: "hojear" cartas
  for(let k=0;k<steps-1;k++){
    // pequeña animación visual: reordenar sutilmente la pila
    const deckEl = $('#prob-deck');
    deckEl.style.transition = 'transform .12s';
    deckEl.style.transform = `translateY(${(k%2? -4:4)}px)`;
    await new Promise(r=>setTimeout(r, Math.max(60, delay-60)));
    deckEl.style.transform = 'translateY(0)';
  }

  // robo final
  const card = probState.deck.pop();
  if(card){ probState.drawn.push(card); }
  renderProb();

  probState.busy = false;
}

$('#btnSimular').addEventListener('click', simularRobo4s);
$('#btnReiniciarProb').addEventListener('click', buildProbDeck);

buildProbDeck();

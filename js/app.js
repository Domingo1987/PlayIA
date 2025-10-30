/* utilidades */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

/* -------- scroll infinito (sección ¿qué es?) -------- */
const stream = $('#infinite-stream');
const sentinel = $('#stream-sentinel');


/* -------- mazo de IA (flip al hover) -------- */
const IA_CARDS = [
  { id:'gpt',  nombre:'gpt',  img:'prob-chatgpt.png',    back:'back-ChatGPT.png',   desc:'modelo conversacional y de razonamiento.' },
  { id:'clau',  nombre:'claude',img:'prob-claude.png',back:'back-Claude.png',desc:'multimodal rápido para prototipos.' },
  { id:'flow',  nombre:'flow',img:'prob-flow.png',back:'back-Flow.png',desc:'redacción y análisis extensos.' },
  { id:'gam',  nombre:'gamma',img:'prob-gamma.png',back:'back-Gamma.png',desc:'generación de imágenes.' },
  { id:'hey', nombre:'heygen', img:'prob-heygen.png',   back:'back-Heygen.png',  desc:'imagen y estilo creativo.' },
  { id:'nan', nombre:'nanobanana',img:'prob-nanobanana.png',back:'back-NanoBanana.png',desc:'imagen local/auto-hospedada.' },
  { id:'note', nombre:'notebookLM', img:'prob-notebookLM.png',   back:'back-NotebookLM.png',  desc:'música con ia.' },
  { id:'perp', nombre:'perplexity',img:'prob-perplexity.png',back:'back-Perplexity.png',desc:'transcripción de audio.' },
  { id:'pre',  nombre:'presenti', img:'prob-presenti.png',   back:'back-Presenti.ai.png',  desc:'chatbots on‑premise.' },
  { id:'ren',   nombre:'renderforest',img:'prob-renderforest.png',back:'back-Renderforest.png',  desc:'ecosistema de modelos.' },
    { id:'sun',   nombre:'suno',img:'prob-suno.png',back:'back-Suno.png',  desc:'ecosistema de modelos.' },
      { id:'udi',   nombre:'udio',img:'prob-udio.png',back:'back-Udio.png',  desc:'ecosistema de modelos.' },
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

/* -------- mazo de problemas (simulación estilo card-deck-simulation) -------- */
const PROB_BACK = 'tapa-prob.png';

// Variable global para los problemas (se cargará del JSON)
let problemas = [];

const probState = { 
  problemas_mazo: [],  // Mazo mezclado
  drawn: [],           // Cartas extraídas
  busy: false,
  currentCard: null,
  selectedCard: null,
  carta_azar: null     // Posición aleatoria de la carta seleccionada
};

// Cargar problemas desde el JSON
async function cargarProblemas() {
  try {
    const response = await fetch('./assets/data/problemas.json');
    const data = await response.json();
    problemas = data.problemas;
    buildProbDeck();
  } catch (error) {
    console.error('Error al cargar problemas:', error);
    // Fallback: usar problemas genéricos si falla la carga
    problemas = Array.from({length: 50}, (_, i) => `Problema ${i + 1}`);
    buildProbDeck();
  }
}

function buildProbDeck(){
  // Verificar que los problemas estén cargados
  if(problemas.length === 0) return;
  
  // Crear problemas_mazo como shuffle de problemas
  probState.problemas_mazo = problemas.map((texto, idx) => ({
    id: idx + 1,
    texto: texto,
    // Usar frente-prob.png como imagen única para todas las cartas
    path: `./assets/mazo-prob/frente-prob.png`
  }));
  
  // Mezclar el mazo (Fisher-Yates shuffle)
  for(let i = probState.problemas_mazo.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [probState.problemas_mazo[i], probState.problemas_mazo[j]] = 
    [probState.problemas_mazo[j], probState.problemas_mazo[i]];
  }
  
  // Generar carta_azar: número aleatorio entre 10 y 25
  probState.carta_azar = Math.floor(Math.random() * (25 - 10 + 1)) + 10;
  
  probState.drawn = [];
  probState.currentCard = null;
  probState.selectedCard = null;
  renderProb();
}

function renderProb(){
  const deckEl = $('#prob-deck');
  const drawnEl = $('#prob-drawn');
  const currentEl = $('#prob-current');
  const chosenEl = $('#prob-chosen');

  // Actualizar contadores
  const deckCount = $('#deck-count');
  const drawnCount = $('#drawn-count');
  if(deckCount) deckCount.textContent = probState.problemas_mazo.length;
  if(drawnCount) drawnCount.textContent = probState.drawn.length;

  // Renderizar mazo principal (cartas restantes - reverso)
  deckEl.innerHTML = '';
  const layers = Math.min(probState.problemas_mazo.length, 12);
  for(let i=0;i<layers;i++){
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

  // Mostrar carta actual siendo extraída (en el centro)
  currentEl.innerHTML = '';
  if(probState.currentCard){
    const animCard = document.createElement('div');
    animCard.className = 'card card--flip';
    const img = document.createElement('img');
    img.alt = probState.currentCard.texto;
    img.src = probState.currentCard.path;
    img.onerror = ()=> img.src = './assets/mazo-prob/frente-prob.png';
    animCard.appendChild(img);
    
    // Agregar texto del problema sobre la carta
    const textOverlay = document.createElement('div');
    textOverlay.className = 'card-text-overlay';
    textOverlay.textContent = probState.currentCard.texto;
    animCard.appendChild(textOverlay);
    
    currentEl.appendChild(animCard);
  }

  // Mostrar cartas extraídas apiladas a la IZQUIERDA (frente visible)
  drawnEl.innerHTML = '';
  drawnEl.classList.add('stack-vertical');
  probState.drawn.forEach((c, idx) => {
    const d = document.createElement('div');
    d.className = 'card card--mini';
    d.style.position = 'absolute';
    d.style.left = '0';
    const offset = idx * 8;
    d.style.top = `${offset}px`;
    d.style.zIndex = `${100 + idx}`;
    
    // Resaltar la carta seleccionada (debe estar encima)
    if(probState.selectedCard && c.id === probState.selectedCard.id){
      d.classList.add('card-selected');
      d.style.zIndex = '1000'; // Asegurar que esté encima
    }
    
    const img = document.createElement('img');
    img.alt = c.texto;
    img.src = c.path;
    img.onerror = ()=> img.src = './assets/mazo-prob/frente-prob.png';
    d.appendChild(img);
    
    // Agregar texto del problema
    const textOverlay = document.createElement('div');
    textOverlay.className = 'card-text-overlay-mini';
    textOverlay.textContent = c.texto;
    d.appendChild(textOverlay);
    
    drawnEl.appendChild(d);
  });

  // Mostrar carta elegida grande en el contenedor izquierdo (chosen)
  chosenEl.innerHTML = '';
  if(probState.selectedCard){
    const chosenBig = document.createElement('div');
    chosenBig.className = 'card card-chosen';
    const cbimg = document.createElement('img');
    cbimg.alt = probState.selectedCard.texto;
    cbimg.src = probState.selectedCard.path;
    cbimg.onerror = ()=> cbimg.src = './assets/mazo-prob/frente-prob.png';
    chosenBig.appendChild(cbimg);
    
    // Agregar texto del problema
    const textOverlay = document.createElement('div');
    textOverlay.className = 'card-text-overlay';
    textOverlay.textContent = probState.selectedCard.texto;
    chosenBig.appendChild(textOverlay);
    
    chosenEl.appendChild(chosenBig);
  }
}

// Elegir un problema: simulación estilo card-deck-simulation
// Extrae cartas hasta carta_azar, una por una cada 100ms
async function elegirProblema(){
  if(probState.busy) return;
  if(probState.problemas_mazo.length === 0){
    alert('El mazo está vacío. Reinicia para continuar.');
    return;
  }
  
  probState.busy = true;
  probState.drawn = [];
  probState.selectedCard = null;
  
  // Número de cartas a extraer (hasta carta_azar)
  const numCartasExtraer = Math.min(probState.carta_azar, probState.problemas_mazo.length);
  
  // Actualizar el botón para mostrar que está en proceso
  const btnElegir = $('#btnElegir');
  const originalText = btnElegir.textContent;
  btnElegir.disabled = true;
  
  for(let i = 0; i < numCartasExtraer; i++){
    if(probState.problemas_mazo.length === 0) break;
    
    // Sacar carta del mazo (del inicio)
    const card = probState.problemas_mazo.shift();
    probState.currentCard = card;
    
    btnElegir.textContent = `extrayendo carta ${i + 1}/${numCartasExtraer}...`;
    renderProb();
    
    // Esperar 100ms para mostrar la carta
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Agregar a las cartas extraídas (se apilan a la izquierda)
    probState.drawn.push(card);
    probState.currentCard = null;
    renderProb();
    
    // Pequeña pausa antes de la siguiente carta
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // La última carta extraída (en posición carta_azar) es la elegida
  if(probState.drawn.length > 0){
    probState.selectedCard = probState.drawn[probState.drawn.length - 1];
    renderProb();
  }
  
  probState.busy = false;
  btnElegir.disabled = false;
  btnElegir.textContent = originalText;
}

// Conectar botones
$('#btnElegir').addEventListener('click', elegirProblema);
$('#btnReiniciarProb').addEventListener('click', buildProbDeck);

// Inicializar cargando los problemas desde el JSON
cargarProblemas();

/* -------- marquee de auspicios (.scroll) -------- */
function initAuspicioMarquee(){
  const scroll = document.querySelector('.scroll');
  if(!scroll) return; // no demo block present

  // Lista de imágenes en assets/aus — mantenida aquí porque el navegador no puede leer directorios
  const IMAGES = [
    'aus-deepseek.png',
    'aus-elevenlabs.png',
    'aus-grok.png',
    'aus-huggingFace.png',
    'aus-llama3 .png',
    'aus-lovable.png',
    'aus-midjourney6.png',
    'aus-n8n.png'
  ];

  // Helper para crear un track (div) con las imágenes
  function makeTrack(){
    const track = document.createElement('div');
    IMAGES.forEach(name => {
      const img = document.createElement('img');
      // encodeURIComponent para nombres con espacios u otros caracteres
      img.src = './assets/aus/' + encodeURIComponent(name);
      img.alt = name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ');
      img.loading = 'lazy';
      // Keep transparency: no background/styling here; CSS handles sizing
      track.appendChild(img);
    });
    return track;
  }

  // Clear existing content and build ONE track which contains the images duplicated
  // (this makes a seamless loop when CSS translates the inner track by -50%)
  scroll.innerHTML = '';
  const track = makeTrack();
  // duplicate images inside the same track for smooth looping
  const clones = Array.from(track.children).map(n => n.cloneNode(true));
  clones.forEach(c => track.appendChild(c));
  // Ensure track has no animation running until images load
  track.style.animationPlayState = 'paused';
  scroll.appendChild(track);

  // Wait until all images (including clones) are loaded before measuring and starting
  const imgs = Array.from(track.querySelectorAll('img'));
  const loadPromises = imgs.map(img => new Promise(resolve => {
    if(img.complete && img.naturalWidth !== 0) return resolve();
    img.addEventListener('load', resolve);
    img.addEventListener('error', resolve);
  }));

  Promise.all(loadPromises).then(()=>{
    try{
      // Measure width of one sequence (half the track)
      const seqWidth = track.scrollWidth / 2;
      const speed = 500; // px per second (tweak to taste)
  const duration = Math.max(8, Math.round(seqWidth / speed));
  // Apply duration and exact pixel shift for a seamless loop
  track.style.setProperty('--marq-duration', duration + 's');
  track.style.setProperty('--marq-shift', `-${Math.round(seqWidth)}px`);
  // Force reflow to ensure CSS picks up the new duration/shift before running
  // eslint-disable-next-line no-unused-expressions
  track.offsetWidth;
  track.style.animationPlayState = 'running';
    }catch(e){
      // If measurement fails, just run with CSS defaults
      track.style.animationPlayState = 'running';
    }
  }).catch(()=>{ track.style.animationPlayState = 'running'; });
}

// Inicializar marquee si existe
initAuspicioMarquee();

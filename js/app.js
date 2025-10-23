/* utilidades */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

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

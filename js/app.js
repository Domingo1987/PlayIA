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
  // NOTE: removed randomness for now — always use fondo-prob01.png
  // probState.deck = PROB_FILES.map(name => ({ name, path:`./assets/mazo-prob/${name}` }));
  // // mezclar
  // for(let i=probState.deck.length-1;i>0;i--){
  //   const j = Math.floor(Math.random()*(i+1));
  //   [probState.deck[i], probState.deck[j]] = [probState.deck[j], probState.deck[i]];
  // }
  // For testing/demo: create a deck where every card is the same fixed image
  probState.deck = Array.from({length:20}, (_,i)=>({ name: 'fondo-prob01.png', path: `./assets/mazo-prob/fondo-prob01.png` }));
  probState.drawn = [];
  renderProb();
}

function renderProb(){
  const deckEl = $('#prob-deck');
  const drawnEl = $('#prob-drawn');
  const currentEl = $('#prob-current');
  const chosenEl = $('#prob-chosen');

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

  // mostrar cartas robadas como una pila apilada
  drawnEl.innerHTML = '';
  drawnEl.classList.add('stack-vertical');
  const recent = probState.drawn.slice(-10);
  recent.forEach((c, idx) => {
    const d = document.createElement('div');
    d.className = 'card card--mini';
    // posicionar absolutamente dentro de la pila
    d.style.position = 'absolute';
    d.style.left = '0';
    const offset = idx * 8; // separación entre cartas
    d.style.top = `${offset}px`;
    d.style.zIndex = `${100 + idx}`;
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

// elegir un problema: animar una carta desde la pila al área de robadas y apilarla
async function elegirProblema(){
  if(probState.busy || probState.deck.length === 0) return;
  probState.busy = true;

  const deckEl = $('#prob-deck');
  const drawnEl = $('#prob-drawn');
  const currentEl = $('#prob-current');

  // tomar la carta del deck
  const card = probState.deck.pop();
  if(!card){ probState.busy = false; return; }

  // crear elemento visual que se moverá
  const moving = document.createElement('div');
  moving.className = 'card moving-card';
  moving.style.width = '80px';
  moving.style.height = '120px';
  moving.style.overflow = 'hidden';
  const img = document.createElement('img');
  img.alt = card.name;
  img.src = card.path;
  img.onerror = ()=> img.src = dataImg('', 'carta');
  moving.appendChild(img);
  document.body.appendChild(moving);

  // calcular posición inicial (centro de la pila)
  const deckRect = deckEl.getBoundingClientRect();
  moving.style.left = `${deckRect.left + deckRect.width/2 - 40}px`;
  moving.style.top = `${deckRect.top + 10}px`;

  // forzar layout antes de animar
  void moving.offsetWidth;

  // destino: area chosen (izquierda) para mostrar la carta seleccionada
  const chosenRect = chosenEl.getBoundingClientRect();
  // centrar la carta moviente dentro del contenedor chosen
  const mW = 80, mH = 120; // tamaño del elemento moving
  const destLeft = chosenRect.left + (chosenRect.width / 2 - mW / 2);
  const destTop = chosenRect.top + (chosenRect.height / 2 - mH / 2);

  moving.style.transition = 'transform .45s cubic-bezier(.2,.9,.2,1), top .45s, left .45s, opacity .25s';
  moving.style.transform = `translate(${destLeft - (deckRect.left + deckRect.width/2 - 40)}px, ${destTop - (deckRect.top + 10)}px) scale(1)`;

  // esperar la animación
  await new Promise(r=> setTimeout(r, 480));

  // agregar a estado (historial) y renderizar apilado
  probState.drawn.push(card);
  renderProb();

  // colocar la carta seleccionada en el contenedor elegido (izquierda)
  chosenEl.innerHTML = '';
  const chosenBig = document.createElement('div');
  chosenBig.className = 'card';
  const cbimg = document.createElement('img');
  cbimg.alt = card.name;
  cbimg.src = card.path;
  cbimg.onerror = ()=> cbimg.src = dataImg('', 'seleccionada');
  chosenBig.appendChild(cbimg);
  chosenEl.appendChild(chosenBig);

  // limpiar elemento moviente
  moving.remove();

  // actualizar current (muestra la misma carta arriba derecha también)
  if(probState.drawn.length){
    const top = probState.drawn[probState.drawn.length-1];
    currentEl.innerHTML = '';
    const big = document.createElement('div');
    big.className = 'card';
    const bimg = document.createElement('img');
    bimg.alt = top.name;
    bimg.src = top.path;
    bimg.onerror = ()=> bimg.src = dataImg('', 'seleccionada');
    big.appendChild(bimg);
    currentEl.appendChild(big);
  }

  probState.busy = false;
}

// conectar nuevo botón
$('#btnElegir').addEventListener('click', elegirProblema);
$('#btnReiniciarProb').addEventListener('click', buildProbDeck);

buildProbDeck();

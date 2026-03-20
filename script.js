// Original, profound philosophical quotes reflecting the illusion of control, psychology, and reality
const bookData = [
  { title: "The Beginning", content: "The ultimate illusion is the mind's belief that it controls the universe. Yet, the universe is but a reflection of a quiet mind.", isCover: true },
  { title: "Lesson I: The Observer", content: "To master the external world, one must first observe the internal game. Action without attachment to the psychological outcome is true freedom.", isCover: false },
  { title: "Lesson II: The Illusion of Fear", content: "Fear is merely a construct of the mind projecting into a future that does not exist. Anchor yourself in the present, where true reality resides.", isCover: false },
  { title: "Lesson III: The Ocean and the Wave", content: "Just as a wave does not struggle against the ocean, a wise soul does not struggle against the flow of existence. Observe, accept, and act.", isCover: false },
  { title: "Lesson IV: The Clouded Mirror", content: "The mind is a mirror. When it is clouded by desire and ego, the reflection is distorted. Cleanse the mirror, and the truth reveals itself naturally.", isCover: false },
  { title: "Lesson V: Dominion", content: "Do not be bound by the illusion of control over others or destiny. The only true dominion you possess is over your own perception.", isCover: false },
  { title: "Lesson VI: The Map is Not the Terrain", content: "Suffering arises when we demand the universe to conform to our psychological maps. Discard the map, and experience the terrain directly.", isCover: false },
  { title: "Lesson VII: Writing the Code", content: "A true creator writes the logic of their life not with rigid commands, but with adaptable wisdom. Life flows where resistance ends.", isCover: false },
  { title: "Lesson VIII: The Greatest Game", content: "The most complex game is not played against the world, but against the illusions cast by your own ego. See through them, and you have already won.", isCover: false },
  { title: "Lesson IX: Entangled Realities", content: "Knowledge is realizing that the physical world and the mental world are deeply entangled; wisdom is knowing how to navigate both with a perfectly still heart.", isCover: false },
  { title: "Lesson X: Silence", content: "Myth often overpowers the mind with endless noise, but the absolute truth is always found in the silent spaces between our thoughts.", isCover: false },
  { title: "The End", content: "The journey concludes not when you have conquered the world, but when you realize there was nothing to conquer, only to understand.", isCover: true }
];

// Generate HTML for pages dynamically
const pages = bookData.map((data, i) => `
  <div style="display: flex; flex-direction: column; height: 100%; justify-content: center; text-align: ${data.isCover ? 'center' : 'left'};">
    <h2 style="${data.isCover ? 'border: none; font-size: 2em; margin-bottom: 20px;' : ''}">${data.title}</h2>
    <p style="${data.isCover ? 'font-style: italic; color: #555; font-size: 1.2em;' : 'font-size: 1.1em; line-height: 1.8;'}">"${data.content}"</p>
  </div>
  ${!data.isCover ? `<div class="page-number">- ${i} -</div>` : ''}
`);

const state = {
  width: 0, height: 0, pageWidth: 0, spineX: 0, diagonal: 0,
  leftIndex: 0, activeSide: null, activeCorner: null,
  isDragging: false, isAnimating: false, cornerThreshold: 0
};

// Web Audio API for synthetic paper sound
function playFlipSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) { /* Ignore if Audio not supported/allowed yet */ }
}

// Debounced Resize
let resizeTimeout;
function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const rect = book.getBoundingClientRect();
    state.width = rect.width; state.height = rect.height;
    state.pageWidth = rect.width / 2; state.spineX = state.pageWidth;
    state.diagonal = Math.sqrt(state.pageWidth ** 2 + state.height ** 2);
    state.cornerThreshold = Math.min(120, state.width * 0.2); 
    
    if (!state.isDragging && !state.isAnimating) renderPages();
  }, 100);
}
const resizeObserver = new ResizeObserver(handleResize);
resizeObserver.observe(book);

// Update UI (Progress Bar & Buttons)
function updateUI() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const progress = document.getElementById('progressBar');
  
  if(prevBtn && nextBtn && progress) {
      prevBtn.disabled = state.leftIndex <= 0;
      nextBtn.disabled = state.leftIndex >= pages.length - 2;
      progress.style.width = `${(state.leftIndex / (pages.length - 2)) * 100}%`;
  }
}

function renderPages() {
  document.getElementById('left-front').innerHTML = pages[state.leftIndex] || "";
  document.getElementById('right-front').innerHTML = pages[state.leftIndex + 1] || "";
  
  // Hardcover visual logic
  document.getElementById('left-front').style.background = state.leftIndex === 0 ? '#e0d8c8' : '';
  document.getElementById('right-front').style.background = state.leftIndex + 1 === pages.length - 1 ? '#e0d8c8' : '';

  updateUI();
}
renderPages();

function clipPolygon(points, a, b, c, keepInside) {
  let result = [];
  for (let i = 0; i < points.length; i++) {
    let p1 = points[i], p2 = points[(i + 1) % points.length];
    let d1 = a * p1[0] + b * p1[1] + c;
    let d2 = a * p2[0] + b * p2[1] + c;
    let in1 = keepInside ? d1 <= 0 : d1 > 0;
    let in2 = keepInside ? d2 <= 0 : d2 > 0;
    if (in1) result.push(p1);
    if (in1 !== in2) {
      let t = d1 / (d1 - d2);
      result.push([p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])]);
    }
  }
  return result;
}

function reflectPoint(p, a, b, c) {
  let d = (a * p[0] + b * p[1] + c) / (a * a + b * b);
  return [ p[0] - 2 * d * a, p[1] - 2 * d * b ];
}

function toClipPath(points) {
  if (points.length === 0) return 'polygon(0 0)';
  return 'polygon(' + points.map(p => `${p[0]}px ${p[1]}px`).join(', ') + ')';
}

function constrainPoint(mx, my) {
  const { pageWidth, height, spineX, diagonal } = state;
  for (let i = 0; i < 3; i++) {
    let c1x = spineX, c1y = state.activeCorner[1]; 
    let dx1 = mx - c1x, dy1 = my - c1y;
    let dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    if (dist1 > pageWidth) { mx = c1x + (dx1 / dist1) * pageWidth; my = c1y + (dy1 / dist1) * pageWidth; }

    let c2x = spineX, c2y = state.activeCorner[1] === 0 ? height : 0; 
    let dx2 = mx - c2x, dy2 = my - c2y;
    let dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    if (dist2 > diagonal) { mx = c2x + (dx2 / dist2) * diagonal; my = c2y + (dy2 / dist2) * diagonal; }
  }
  return [mx, my];
}

function updateFold(X, Y) {
  if (X === state.activeCorner[0] && Y === state.activeCorner[1]) return;
  const { width, height, pageWidth, activeCorner } = state;
  let [mx, my] = constrainPoint(X, Y);
  const frontPage = document.getElementById(`${state.activeSide}-front`);
  
  let a = activeCorner[0] - mx, b = activeCorner[1] - my;
  let midx = (activeCorner[0] + mx) / 2, midy = (activeCorner[1] + my) / 2;
  let c = -(a * midx + b * midy);
  
  let basePage, p1_front, p2_front, shiftX;
  if (state.activeSide === 'right') {
    basePage = [[pageWidth, 0], [pageWidth, height], [width, height], [width, 0]];
    p1_front = [width, 0]; p2_front = [pageWidth, 0]; shiftX = pageWidth;
  } else {
    basePage = [[0, 0], [0, height], [pageWidth, height], [pageWidth, 0]];
    p1_front = [pageWidth, 0]; p2_front = [0, 0]; shiftX = 0;
  }

  let frontPoints = clipPolygon(basePage, a, b, c, true);
  frontPage.style.clipPath = toClipPath(frontPoints.map(p => [p[0] - shiftX, p[1]]));
  
  let awayPoints = clipPolygon(basePage, a, b, c, false);
  flap.style.clipPath = toClipPath(awayPoints.map(p => reflectPoint(p, a, b, c)));
  
  let p1_flap = reflectPoint(p1_front, a, b, c), p2_flap = reflectPoint(p2_front, a, b, c);
  let angleRot = Math.atan2(p2_flap[1] - p1_flap[1], p2_flap[0] - p1_flap[0]);
  flapContent.style.transformOrigin = '0 0';
  flapContent.style.transform = `translate(${p1_flap[0]}px, ${p1_flap[1]}px) rotate(${angleRot}rad)`;

  let angleG = Math.atan2(my - activeCorner[1], mx - activeCorner[0]); 
  foldGradient.style.transform = `translate(${midx}px, ${midy}px) rotate(${angleG}rad)`;
  foldGradient.style.opacity = Math.sin((Math.abs(mx - activeCorner[0]) / width) * Math.PI).toFixed(3);
}

function startDrag(side, corner, x, y) {
  if (state.isAnimating) return;
  state.activeSide = side; state.activeCorner = corner; state.isDragging = true;
  flap.style.display = 'block';

  if (side === 'right') {
    document.getElementById('right-under').innerHTML = pages[state.leftIndex + 3] || "";
    flapContent.innerHTML = pages[state.leftIndex + 2] || "";
    flapContent.className = 'flap-content is-left';
  } else {
    document.getElementById('left-under').innerHTML = pages[state.leftIndex - 2] || "";
    flapContent.innerHTML = pages[state.leftIndex - 1] || "";
    flapContent.className = 'flap-content is-right';
  }
  updateFold(x, y);
}

function animateTurn(startX, startY, targetX, targetY, isComplete) {
  state.isAnimating = true;
  let startTime = performance.now();
  
  function animate(time) {
    let progress = Math.min((time - startTime) / 400, 1);
    let ease = 1 - Math.pow(1 - progress, 3);
    
    updateFold(startX + (targetX - startX) * ease, startY + (targetY - startY) * ease);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      flap.style.display = 'none';
      document.getElementById(`${state.activeSide}-front`).style.clipPath = 'none';
      
      if (isComplete) {
        state.leftIndex += state.activeSide === 'right' ? 2 : -2;
        playFlipSound();
        renderPages();
      }
      state.activeSide = null;
      state.isAnimating = false;
    }
  }
  requestAnimationFrame(animate);
}

function autoTurnPage(direction) {
  if (state.isDragging || state.isAnimating) return;
  const { width, height } = state;
  
  if (direction === 'next' && state.leftIndex < pages.length - 2) {
    startDrag('right', [width, height], width, height);
    animateTurn(width, height, 0, height, true);
  } else if (direction === 'prev' && state.leftIndex > 0) {
    startDrag('left', [0, height], 0, height);
    animateTurn(0, height, width, height, true);
  }
}

// Mouse / Touch Events
book.addEventListener('pointerdown', (e) => {
  if (state.isAnimating) return;
  let rect = book.getBoundingClientRect();
  let x = e.clientX - rect.left, y = e.clientY - rect.top;
  const { width, height, cornerThreshold: TH, leftIndex } = state;

  book.setPointerCapture(e.pointerId);

  if (x > width - TH && y < TH && leftIndex < pages.length - 2) startDrag('right', [width, 0], x, y);
  else if (x > width - TH && y > height - TH && leftIndex < pages.length - 2) startDrag('right', [width, height], x, y);
  else if (x < TH && y < TH && leftIndex > 0) startDrag('left', [0, 0], x, y);
  else if (x < TH && y > height - TH && leftIndex > 0) startDrag('left', [0, height], x, y);
});

let moveFrame;
book.addEventListener('pointermove', (e) => {
  if (!state.isDragging) return;
  if (moveFrame) cancelAnimationFrame(moveFrame);
  moveFrame = requestAnimationFrame(() => {
    let rect = book.getBoundingClientRect();
    updateFold(e.clientX - rect.left, e.clientY - rect.top);
  });
});

book.addEventListener('pointerup', (e) => {
  if (!state.isDragging) return;
  state.isDragging = false;

  let rect = book.getBoundingClientRect();
  let x = e.clientX - rect.left, y = e.clientY - rect.top;
  const { width } = state;

  let isComplete = (state.activeSide === 'right' && x < width/2 + 50) || (state.activeSide === 'left' && x > width/2 - 50);
  let targetX = isComplete ? (state.activeSide === 'right' ? 0 : width) : state.activeCorner[0];
  
  animateTurn(x, y, targetX, state.activeCorner[1], isComplete);
});

// External Controls bindings
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
if(nextBtn) nextBtn.addEventListener('click', () => autoTurnPage('next'));
if(prevBtn) prevBtn.addEventListener('click', () => autoTurnPage('prev'));

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') autoTurnPage('next');
  if (e.key === 'ArrowLeft') autoTurnPage('prev');
});

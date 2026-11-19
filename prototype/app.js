/* ==========================================================================
   CONCEPTS × STAFFPAD × LINEARITY CURVE INTERACTION ENGINE
   ========================================================================== */

const scores = [
  { id: 1, title: "Sonata BWV 1034", subtitle: "Transcr. David Russell", composer: "J. S. Bach", period: "Barroco", group: "Guitarra Sola", setlist: true, raw: false },
  { id: 2, title: "(Partition) Bach - Suite Inglesa Nº 2 BWV 807", clean: "Suite Inglesa Nº 2, BWV 807", subtitle: "En La menor", composer: "J. S. Bach", period: "Barroco", group: "Guitarra Sola", setlist: true, raw: true },
  { id: 3, title: "0000040517.pdf (Págs. 01–03)", clean: "Concierto del Sur", subtitle: "I. Allegretto (Solista y Reducción)", composer: "Manuel M. Ponce", period: "Siglo XX", group: "Orquesta / Cámara", setlist: true, raw: true },
  { id: 4, title: "! Brouwer, Leo - From testerdayu to Peny Lane", clean: "From Yesterday to Penny Lane", subtitle: "Guitarra y Orquesta", composer: "Leo Brouwer", period: "Siglo XX", group: "Orquesta / Cámara", setlist: false, raw: true },
  { id: 5, title: "Sonata Mexicana", subtitle: "I. Allegro moderato", composer: "Manuel M. Ponce", period: "Siglo XX", group: "Guitarra Sola", setlist: true, raw: false },
  { id: 6, title: "Tango Suite — I. Deciso", subtitle: "Dúo de Guitarras (Dúo Toño)", composer: "Astor Piazzolla", period: "Siglo XX", group: "Orquesta / Cámara", setlist: true, raw: false }
];

let currentFilter = "all";

// CAMBIO ENTRE LOS 4 MODOS
function switchMode(mode) {
  document.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  document.querySelectorAll(".canvas-view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`mode-${mode}`).classList.add("active");

  if (mode === "study") setTimeout(setupStudyCanvas, 40);
  if (mode === "editor") setTimeout(setupEditorCanvas, 40);
}

// CAMBIO DE PALETA VISUAL (Concepts Orbs)
function setPalette(paletteClass, btn) {
  document.body.className = paletteClass;
  document.querySelectorAll(".theme-orb").forEach((c) => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

// 1. BIBLIOTECA DE FOLIOS VERTICALES (StaffPad Library Style)
function renderLibrary() {
  const list = document.getElementById("scoreList");
  const q = (document.getElementById("searchInput").value || "").toLowerCase();

  const items = scores.filter((s) => {
    const matchText = s.title.toLowerCase().includes(q) || s.composer.toLowerCase().includes(q);
    if (!matchText) return false;
    if (currentFilter === "all") return true;
    if (currentFilter === "setlist") return s.setlist;
    return s.period === currentFilter || s.group === currentFilter;
  });

  list.innerHTML = items
    .map(
      (s) => `
    <article class="folio-card" onclick="openScoreInStudy('${s.title.replace(/'/g, "")}', '${s.composer}')">
      <div class="folio-preview-sheet">
        <div class="folio-preview-head">
          <strong>${s.clean || s.title}</strong>
          <small>${s.composer}</small>
        </div>
        <div class="mini-staves">
          <div class="mini-staff-bar"></div>
          <div class="mini-staff-bar"></div>
          <div class="mini-staff-bar"></div>
        </div>
      </div>

      <div class="folio-card-body">
        <div class="folio-card-title">
          <span>${s.title}</span>
          ${s.raw ? `<span class="raw-badge">PDF Crudo</span>` : ""}
        </div>
        <span class="folio-card-sub">${s.composer} • ${s.group}</span>
      </div>

      <div class="folio-card-foot" onclick="event.stopPropagation()">
        <span class="period-tag">${s.period}</span>
        <div class="folio-quick-btns">
          <button class="mini-action-btn" onclick="openPdfModal('${s.title.replace(/'/g, "")}')" title="Taller PDF">✂</button>
          <button class="mini-action-btn" onclick="switchMode('concert')" title="Modo Concierto">◉</button>
        </div>
      </div>
    </article>
  `
    )
    .join("");
}

function openScoreInStudy(title, composer) {
  document.getElementById("hudPieceTitle").textContent = `${composer} — ${title}`;
  switchMode("study");
}

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll(".filter-token").forEach((c) => c.classList.remove("active"));
  btn.classList.add("active");
  renderLibrary();
}

function cleanLibraryWithAI() {
  scores.forEach((s) => {
    if (s.raw && s.clean) {
      s.title = s.clean;
      s.raw = false;
    }
  });
  const btn = document.getElementById("aiBtn");
  btn.innerHTML = "<span>✦ Biblioteca Normalizada</span>";
  renderLibrary();
}

function openPdfModal(title) {
  document.getElementById("modalScoreTitle").textContent = title;
  document.getElementById("pdfToast").textContent = "";
  document.getElementById("pdfModal").classList.remove("hidden");
}

function closePdfModal() {
  document.getElementById("pdfModal").classList.add("hidden");
}

function triggerPdfToast(msg) {
  document.getElementById("pdfToast").textContent = msg;
}

// GENERADOR DE PARTITURA VERTICAL EN HOJA PARADA (6 SISTEMAS)
function buildPortraitScoreSvg(activeSys = -1) {
  const systems = 6;
  let svg = `<svg viewBox="0 0 820 980" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`;

  for (let s = 0; s < systems; s++) {
    const y0 = 40 + s * 156;

    if (activeSys === s) {
      svg += `<rect x="16" y="${y0 - 20}" width="788" height="90" rx="10" fill="rgba(46, 107, 78, 0.14)" stroke="#2e6b4e" stroke-width="1.5"/>`;
    }

    for (let l = 0; l < 5; l++) {
      const y = y0 + l * 12;
      svg += `<line x1="28" y1="${y}" x2="792" y2="${y}" stroke="currentColor" stroke-width="1.1" opacity="0.82"/>`;
    }

    svg += `<text x="34" y="${y0 + 42}" font-size="50" font-family="serif" fill="currentColor">𝄞</text>`;
    svg += `<text x="72" y="${y0 + 14}" font-size="21" font-family="serif" fill="currentColor">♯</text>`;

    [290, 540, 792].forEach((xb) => {
      svg += `<line x1="${xb}" y1="${y0}" x2="${xb}" y2="${y0 + 48}" stroke="currentColor" stroke-width="1.3"/>`;
    });

    svg += `<text x="28" y="${y0 - 9}" font-size="10.5" font-style="italic" opacity="0.7" fill="currentColor">${s * 3 + 1}</text>`;
    if (s % 2 === 0) {
      svg += `<text x="135" y="${y0 - 10}" font-size="12.5" font-weight="bold" font-family="serif" fill="currentColor">C.VII ────</text>`;
    }

    const xs = [115, 155, 195, 240, 330, 375, 425, 480, 580, 635, 690, 745];
    xs.forEach((nx, i) => {
      const ny = y0 + 12 + ((i * 7 + s * 5) % 30);
      svg += `<ellipse cx="${nx}" cy="${ny}" rx="6.3" ry="4.6" transform="rotate(-18 ${nx} ${ny})" fill="currentColor"/>`;
      svg += `<line x1="${nx + 5.6}" y1="${ny}" x2="${nx + 5.6}" y2="${ny - 29}" stroke="currentColor" stroke-width="1.3"/>`;
    });
  }

  svg += `</svg>`;
  return svg;
}

// 2. MODO ESTUDIO (CONCEPTS TOOL RAIL + TRAZO A MOLDE)
const stampProfiles = {
  guitar: ["p", "i", "m", "a", "1", "2", "3", "4", "①", "②", "③", "④", "⑤", "⑥", "C.II", "C.V", "C.VII", "½C", "arm.12"],
  strings: ["∏", "∨", "I Pos.", "III Pos.", "pizz.", "arco", "sul tasto", "0", "1", "2", "3", "4"],
  piano: ["1", "2", "3", "4", "5", "Ped.", "✱", "m.d.", "m.s.", "8va"],
  agogic: ["poco rit.", "a tempo", "dolce", "espress.", "pp", "mp", "mf", "f", "cresc. ───"]
};

let studyTool = "pen";
let inkColor = "#23426e";
let autoMold = true;
let selectedStamp = null;
let moldIndex = 0;
const moldWords = ["poco rit.", "dolce", "C.VII ───", "p  i  m  a", "a tempo", "espress."];

function switchStampTab(key, btn) {
  document.querySelectorAll(".p-seg").forEach((t) => t.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const grid = document.getElementById("stampGrid");
  grid.innerHTML = (stampProfiles[key] || [])
    .map((st) => `<button class="stamp-btn" onclick="chooseStamp('${st}', this)">${st}</button>`)
    .join("");
}

function toggleStampPopover() {
  const pop = document.getElementById("stampPopover");
  pop.classList.toggle("hidden");
  document.getElementById("btnStamps").classList.toggle("active", !pop.classList.contains("hidden"));
}

function chooseStamp(st, btn) {
  selectedStamp = st;
  studyTool = "stamp";
  document.querySelectorAll(".stamp-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("stampPopover").classList.add("hidden");
}

function setStudyTool(tool) {
  studyTool = tool;
  selectedStamp = null;
  document.getElementById("btnPen").classList.toggle("active", tool === "pen");
  document.getElementById("btnMarker").classList.toggle("active", tool === "marker");
  document.getElementById("btnEraser").classList.toggle("active", tool === "eraser");
  document.getElementById("stampPopover").classList.add("hidden");
}

function toggleAutoMold() {
  autoMold = !autoMold;
  document.getElementById("btnMoldToggle").classList.toggle("magic-active", autoMold);
}

function setInk(color, btn) {
  inkColor = color;
  document.querySelectorAll(".ink-well").forEach((d) => d.classList.remove("active"));
  btn.classList.add("active");
}

function setupStudyCanvas() {
  const canvas = document.getElementById("studyCanvas");
  const wrap = document.getElementById("studyWrap");
  if (!canvas || !wrap) return;
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
}

function initStudyInteraction() {
  const canvas = document.getElementById("studyCanvas");
  if (!canvas) return;
  let drawing = false;
  let last = { x: 0, y: 0 };

  const getPt = (e) => {
    const r = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - r.left, y: cy - r.top };
  };

  const down = (e) => {
    e.preventDefault();
    const pt = getPt(e);
    if (studyTool === "stamp" && selectedStamp) {
      addMoldBadge(pt.x, pt.y, selectedStamp, inkColor);
      return;
    }
    drawing = true;
    last = pt;
  };

  const move = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const pt = getPt(e);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pt.x, pt.y);

    if (studyTool === "marker") {
      ctx.strokeStyle = "rgba(212, 175, 55, 0.34)";
      ctx.lineWidth = 18;
    } else if (studyTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 26;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = 2.4;
    }
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    last = pt;
  };

  const up = () => {
    if (!drawing) return;
    drawing = false;
    if (autoMold && studyTool === "pen") {
      setTimeout(() => {
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        const word = moldWords[moldIndex++ % moldWords.length];
        addMoldBadge(last.x, last.y, word, inkColor);
      }, 280);
    }
  };

  canvas.addEventListener("mousedown", down);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
  canvas.addEventListener("touchstart", down, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("touchend", up);
}

function addMoldBadge(x, y, text, color) {
  const layer = document.getElementById("studyMoldLayer");
  const el = document.createElement("div");
  el.className = "mold-item";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  el.textContent = text;
  layer.appendChild(el);
}

function clearStudyLayer() {
  const canvas = document.getElementById("studyCanvas");
  if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById("studyMoldLayer").innerHTML = "";
}

// 3. MODO CONCIERTO
let pageNum = 1;
let audioTimer = null;
let followedSys = 0;
let layoutIdx = 0;
const layouts = ["1 Pág", "Media Pág", "2 Págs"];

function turnPage(dir) {
  pageNum = Math.max(1, Math.min(10, pageNum + dir));
  document.getElementById("concertPageNum").textContent = `Pág. ${pageNum} / 10`;
}

function cyclePageLayout() {
  layoutIdx = (layoutIdx + 1) % layouts.length;
  document.getElementById("pageModeLabel").textContent = layouts[layoutIdx];
  document.getElementById("concertTransitionTag").textContent = `Vista: ${layouts[layoutIdx]}`;
}

function toggleAudioFollow() {
  const btn = document.getElementById("btnAudioFollow");
  const lbl = document.getElementById("audioFollowLabel");

  if (audioTimer) {
    clearInterval(audioTimer);
    audioTimer = null;
    btn.classList.remove("listening");
    lbl.textContent = "Escucha Activa";
    document.getElementById("concertSvg").innerHTML = buildPortraitScoreSvg(-1);
    return;
  }

  btn.classList.add("listening");
  followedSys = 0;
  lbl.textContent = "Compás 1 • Escuchando";
  document.getElementById("concertSvg").innerHTML = buildPortraitScoreSvg(followedSys);

  audioTimer = setInterval(() => {
    followedSys = (followedSys + 1) % 6;
    lbl.textContent = `Compás ${followedSys * 3 + 1} • Auto`;
    document.getElementById("concertSvg").innerHTML = buildPortraitScoreSvg(followedSys);
    if (followedSys === 5) {
      setTimeout(() => {
        if (audioTimer) turnPage(1);
      }, 1000);
    }
  }, 2000);
}

// 4. MODO STAFF EDITOR (Inspirado en StaffPad: Cuadrícula rítmica + Manuscrito a Grabado Musical)
let editorNotes = [
  { x: 155, y: 120, finger: "p", acc: "" },
  { x: 265, y: 100, finger: "i", acc: "" },
  { x: 375, y: 90, finger: "m", acc: "♭" },
  { x: 485, y: 80, finger: "a", acc: "", barre: "C.III" }
];
let currentAcc = "";
let currentDur = "♩";

function renderEditorSvg() {
  const container = document.getElementById("editorSvg");
  if (!container) return;

  let svg = `<svg viewBox="0 0 820 760" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`;

  [0, 1].forEach((sys) => {
    const yTop = 75 + sys * 340;
    const yTab = yTop + 130;

    // Guías verticales sutiles de pulso estilo StaffPad
    [155, 265, 375, 485, 595, 705].forEach((gx) => {
      svg += `<line x1="${gx}" y1="${yTop - 15}" x2="${gx}" y2="${yTab + 75}" stroke="currentColor" stroke-width="0.6" stroke-dasharray="3,5" opacity="0.22"/>`;
    });

    for (let i = 0; i < 5; i++) {
      svg += `<line x1="40" y1="${yTop + i * 15}" x2="780" y2="${yTop + i * 15}" stroke="currentColor" stroke-width="1.35"/>`;
    }
    for (let s = 0; s < 6; s++) {
      svg += `<line x1="40" y1="${yTab + s * 13}" x2="780" y2="${yTab + s * 13}" stroke="currentColor" stroke-width="0.95" opacity="0.45"/>`;
    }

    svg += `<text x="48" y="${yTop + 50}" font-size="58" font-family="serif" fill="currentColor">𝄞</text>`;
    svg += `<text x="52" y="${yTab + 38}" font-size="15" font-family="sans-serif" font-weight="bold" fill="currentColor" opacity="0.55">TAB</text>`;
  });

  editorNotes.forEach((n, idx) => {
    const sys = idx < 6 ? 0 : 1;
    const yOffset = sys * 340;
    const ny = n.y + yOffset;
    const nx = sys === 0 ? n.x : n.x - 450;
    const yTab = 75 + yOffset + 130;

    if (n.barre) {
      svg += `<text x="${nx - 14}" y="${58 + yOffset}" font-size="13.5" font-weight="bold" font-family="serif" fill="#23426e">${n.barre} ───</text>`;
    }
    if (n.acc) {
      svg += `<text x="${nx - 24}" y="${ny + 7}" font-size="22" font-family="serif" fill="#23426e">${n.acc}</text>`;
    }

    svg += `<ellipse cx="${nx}" cy="${ny}" rx="8.8" ry="6.3" transform="rotate(-20 ${nx} ${ny})" fill="currentColor"/>`;
    svg += `<line x1="${nx + 7.8}" y1="${ny}" x2="${nx + 7.8}" y2="${ny - 42}" stroke="currentColor" stroke-width="1.9"/>`;

    if (n.finger) {
      svg += `<text x="${nx - 17}" y="${ny - 10}" font-size="13.5" font-weight="bold" font-family="Georgia, serif" fill="#8c4a38">${n.finger}</text>`;
    }

    const fret = (idx * 2 + 2) % 8;
    const sLine = yTab + (idx % 4) * 13;
    svg += `<rect x="${nx - 8}" y="${sLine - 8}" width="16" height="16" fill="var(--paper-bg)"/>`;
    svg += `<text x="${nx - 4}" y="${sLine + 4}" font-size="12.5" font-weight="bold" font-family="sans-serif" fill="currentColor">${fret}</text>`;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
}

function setupEditorCanvas() {
  const canvas = document.getElementById("editorCanvas");
  const wrap = document.getElementById("editorWrap");
  if (!canvas || !wrap) return;
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  renderEditorSvg();
}

function initEditorInteraction() {
  const canvas = document.getElementById("editorCanvas");
  if (!canvas) return;
  let drawing = false;
  let last = { x: 0, y: 0 };

  const getPt = (e) => {
    const r = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - r.left, y: cy - r.top };
  };

  const down = (e) => {
    e.preventDefault();
    drawing = true;
    last = getPt(e);
  };

  const move = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const pt = getPt(e);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.strokeStyle = "#23426e";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.stroke();
    last = pt;
  };

  const up = () => {
    if (!drawing) return;
    drawing = false;
    setTimeout(() => {
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      const nextX = 155 + (editorNotes.length % 6) * 110;
      const rawY = (last.y / canvas.height) * 760;
      const snappedY = Math.max(75, Math.min(135, Math.round((rawY % 340) / 7.5) * 7.5));
      const fingers = ["p", "i", "m", "a", "1", "2", "3", "4"];
      editorNotes.push({
        x: nextX,
        y: snappedY,
        finger: fingers[editorNotes.length % fingers.length],
        acc: currentAcc
      });
      renderEditorSvg();
      document.getElementById("editorStatusPill").textContent = `✦ Grabado (${currentDur} ${currentAcc})`;
    }, 240);
  };

  canvas.addEventListener("mousedown", down);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
  canvas.addEventListener("touchstart", down, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("touchend", up);
}

function pickDuration(sym, name, btn) {
  currentDur = sym;
  document.querySelectorAll(".sp-note-btn").forEach((b) => {
    if (["𝅝", "𝅗𝅥", "♩", "♪", "♬"].includes(b.textContent)) b.classList.remove("active");
  });
  btn.classList.add("active");
}

function pickAccidental(acc, btn) {
  currentAcc = currentAcc === acc ? "" : acc;
  btn.classList.toggle("active", currentAcc === acc);
}

function insertSampleChord() {
  const x = 155 + (editorNotes.length % 6) * 110;
  editorNotes.push({ x, y: 85, finger: "1", acc: currentAcc, barre: "C.V" });
  editorNotes.push({ x, y: 105, finger: "3", acc: "" });
  renderEditorSvg();
}

function resetEditorNotes() {
  editorNotes = editorNotes.slice(0, 2);
  renderEditorSvg();
}

function playEditorNotes() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const freqs = [293.66, 440, 523.25, 659.25, 587.33, 698.46];
  editorNotes.forEach((_, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freqs[i % freqs.length];
    const t = ctx.currentTime + i * 0.34;
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.31);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.32);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  renderLibrary();
  switchStampTab("guitar");
  document.getElementById("studySvg").innerHTML = buildPortraitScoreSvg(-1);
  document.getElementById("concertSvg").innerHTML = buildPortraitScoreSvg(-1);
  initStudyInteraction();
  initEditorInteraction();
  setupStudyCanvas();
  setupEditorCanvas();
});

window.addEventListener("resize", () => {
  setupStudyCanvas();
  setupEditorCanvas();
});

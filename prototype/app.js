/* ==========================================================================
   LÓGICA MINIMALISTA — OPTIMIZADA PARA HOJA PARADA (VERTICAL) + HORIZONTAL
   ========================================================================== */

const scores = [
  { id: 1, title: "Sonata BWV 1034 (Transcr. D. Russell)", composer: "J. S. Bach", period: "Barroco", group: "Guitarra Sola", setlist: true, raw: false },
  { id: 2, title: "(Partition) Bach - Suite Inglesa Nº 2 BWV 807", clean: "Suite Inglesa Nº 2 en La menor, BWV 807", composer: "J. S. Bach", period: "Barroco", group: "Guitarra Sola", setlist: true, raw: true },
  { id: 3, title: "0000040517.pdf (Págs. 01, 02, 03)", clean: "Concierto del Sur — I. Allegretto", composer: "Manuel M. Ponce", period: "Siglo XX", group: "Orquesta / Cámara", setlist: true, raw: true },
  { id: 4, title: "! Brouwer, Leo - From testerdayu to Peny Lane", clean: "From Yesterday to Penny Lane", composer: "Leo Brouwer", period: "Siglo XX", group: "Orquesta / Cámara", setlist: false, raw: true },
  { id: 5, title: "Sonata Mexicana — I. Allegro moderato", composer: "Manuel M. Ponce", period: "Siglo XX", group: "Guitarra Sola", setlist: true, raw: false },
  { id: 6, title: "Tango Suite — I. Deciso (Dúo Toño)", composer: "Astor Piazzolla", period: "Siglo XX", group: "Orquesta / Cámara", setlist: true, raw: false }
];

let currentFilter = "all";

// CAMBIO DE MODO
function switchMode(mode) {
  document.querySelectorAll(".mode-pill").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`mode-${mode}`).classList.add("active");

  if (mode === "study") setTimeout(setupStudyCanvas, 50);
  if (mode === "editor") setTimeout(setupEditorCanvas, 50);
}

function setPaper(theme, btn) {
  document.body.className = theme;
  document.querySelectorAll(".paper-dot").forEach((d) => d.classList.remove("active"));
  btn.classList.add("active");
}

// 1. BIBLIOTECA MINIMALISTA
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
    <div class="score-row" onclick="switchMode('study')">
      <div class="score-info">
        <div class="score-title">
          <span>${s.title}</span>
          ${s.raw ? `<span class="raw-pill">Nombre PDF crudo</span>` : ""}
        </div>
        <span class="score-sub">${s.composer} • ${s.group}</span>
      </div>
      <div class="score-actions" onclick="event.stopPropagation()">
        <span class="tag-badge">${s.period}</span>
        <button class="btn-icon-clean" onclick="openPdfModal('${s.title.replace(/'/g, "")}')" title="Taller PDF">✂️</button>
        <button class="btn-icon-clean" onclick="switchMode('concert')" title="Abrir en Concierto">🎙️</button>
      </div>
    </div>
  `
    )
    .join("");
}

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll(".f-chip").forEach((c) => c.classList.remove("active"));
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
  btn.innerHTML = "<span>✓ Catalogado por IA</span>";
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

// GENERADOR DE PARTITURA VERTICAL (6 SISTEMAS PARA HOJA PARADA)
function buildPortraitScoreSvg(activeSys = -1) {
  const systems = 6;
  let svg = `<svg viewBox="0 0 820 980" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`;

  for (let s = 0; s < systems; s++) {
    const y0 = 42 + s * 155;

    if (activeSys === s) {
      svg += `<rect x="14" y="${y0 - 22}" width="792" height="92" rx="10" fill="rgba(16, 185, 129, 0.16)" stroke="#10b981" stroke-width="2"/>`;
    }

    for (let l = 0; l < 5; l++) {
      const y = y0 + l * 12;
      svg += `<line x1="28" y1="${y}" x2="792" y2="${y}" stroke="currentColor" stroke-width="1.15" opacity="0.85"/>`;
    }

    // Clave y armadura
    svg += `<text x="34" y="${y0 + 42}" font-size="52" font-family="serif" fill="currentColor">𝄞</text>`;
    svg += `<text x="72" y="${y0 + 14}" font-size="22" font-family="serif" fill="currentColor">♯</text>`;

    // Barras de compás
    [290, 540, 792].forEach((xb) => {
      svg += `<line x1="${xb}" y1="${y0}" x2="${xb}" y2="${y0 + 48}" stroke="currentColor" stroke-width="1.4"/>`;
    });

    // Números de compás y cejillas
    svg += `<text x="28" y="${y0 - 9}" font-size="11" font-style="italic" fill="currentColor">${s * 3 + 1}</text>`;
    if (s % 2 === 0) {
      svg += `<text x="135" y="${y0 - 10}" font-size="13" font-weight="bold" font-family="serif" fill="currentColor">C.VII ────</text>`;
    }

    // Notas musicales
    const xs = [115, 155, 195, 240, 330, 375, 425, 480, 580, 635, 690, 745];
    xs.forEach((nx, i) => {
      const ny = y0 + 12 + ((i * 7 + s * 5) % 30);
      svg += `<ellipse cx="${nx}" cy="${ny}" rx="6.5" ry="4.8" transform="rotate(-18 ${nx} ${ny})" fill="currentColor"/>`;
      svg += `<line x1="${nx + 5.8}" y1="${ny}" x2="${nx + 5.8}" y2="${ny - 30}" stroke="currentColor" stroke-width="1.35"/>`;
    });
  }

  svg += `</svg>`;
  return svg;
}

// 2. MODO ESTUDIO (TRAZO LIBRE -> MOLDE + SELLOS POR INSTRUMENTO)
const stampProfiles = {
  guitar: ["p", "i", "m", "a", "1", "2", "3", "4", "①", "②", "③", "④", "⑤", "⑥", "C.II", "C.V", "C.VII", "½C", "arm.12"],
  strings: ["∏", "∨", "I Pos.", "III Pos.", "pizz.", "arco", "sul tasto", "0", "1", "2", "3", "4"],
  piano: ["1", "2", "3", "4", "5", "Ped.", "✱", "m.d.", "m.s.", "8va"],
  agogic: ["poco rit.", "a tempo", "dolce", "espress.", "pp", "mp", "mf", "f", "cresc. ───", "👓"]
};

let studyTool = "pen";
let inkColor = "#1d4ed8";
let autoMold = true;
let selectedStamp = null;
let moldIndex = 0;
const moldWords = ["poco rit.", "dolce", "C.VII ───", "p  i  m  a", "a tempo", "espress."];

function switchStampTab(key, btn) {
  document.querySelectorAll(".p-tab").forEach((t) => t.classList.remove("active"));
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
  document.getElementById("btnMoldToggle").classList.toggle("mold-active", autoMold);
}

function setInk(color, btn) {
  inkColor = color;
  document.querySelectorAll(".ink-dot").forEach((d) => d.classList.remove("active"));
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
      ctx.strokeStyle = "rgba(250, 204, 21, 0.38)";
      ctx.lineWidth = 20;
    } else if (studyTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 26;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = 2.8;
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
      }, 320);
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

// 3. MODO CONCIERTO (HOJA PARADA + SEGUIMIENTO POR AUDIO)
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
  document.getElementById("concertTransitionTag").textContent = `Modo: ${layouts[layoutIdx]}`;
}

function toggleAudioFollow() {
  const btn = document.getElementById("btnAudioFollow");
  const lbl = document.getElementById("audioFollowLabel");

  if (audioTimer) {
    clearInterval(audioTimer);
    audioTimer = null;
    btn.classList.remove("listening");
    lbl.textContent = "Seguimiento Audio";
    document.getElementById("concertSvg").innerHTML = buildPortraitScoreSvg(-1);
    return;
  }

  btn.classList.add("listening");
  followedSys = 0;
  lbl.textContent = "Escuchando Compás 1...";
  document.getElementById("concertSvg").innerHTML = buildPortraitScoreSvg(followedSys);

  audioTimer = setInterval(() => {
    followedSys = (followedSys + 1) % 6;
    lbl.textContent = `Compás ${followedSys * 3 + 1} (Auto)`;
    document.getElementById("concertSvg").innerHTML = buildPortraitScoreSvg(followedSys);
    if (followedSys === 5) {
      setTimeout(() => {
        if (audioTimer) turnPage(1);
      }, 1100);
    }
  }, 2000);
}

// 4. MODO EDITOR (TRAZO LIBRE A NOTACIÓN MUSICAL DE MOLDE EN HOJA PARADA)
let editorNotes = [
  { x: 150, y: 120, finger: "p", acc: "" },
  { x: 260, y: 100, finger: "i", acc: "" },
  { x: 370, y: 90, finger: "m", acc: "♭" },
  { x: 480, y: 80, finger: "a", acc: "", barre: "C.III" }
];
let currentAcc = "";
let currentDur = "♩";

function renderEditorSvg() {
  const container = document.getElementById("editorSvg");
  if (!container) return;

  let svg = `<svg viewBox="0 0 820 760" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`;

  // 2 Sistemas de Notación + Tablatura vinculada para Hoja Parada
  [0, 1].forEach((sys) => {
    const yTop = 75 + sys * 340;
    const yTab = yTop + 130;

    for (let i = 0; i < 5; i++) {
      svg += `<line x1="40" y1="${yTop + i * 15}" x2="780" y2="${yTop + i * 15}" stroke="currentColor" stroke-width="1.4"/>`;
    }
    for (let s = 0; s < 6; s++) {
      svg += `<line x1="40" y1="${yTab + s * 13}" x2="780" y2="${yTab + s * 13}" stroke="currentColor" stroke-width="1" opacity="0.5"/>`;
    }

    svg += `<text x="48" y="${yTop + 50}" font-size="60" font-family="serif" fill="currentColor">𝄞</text>`;
    svg += `<text x="52" y="${yTab + 38}" font-size="16" font-family="sans-serif" font-weight="bold" fill="currentColor" opacity="0.65">TAB</text>`;
  });

  // Renderizar notas de molde
  editorNotes.forEach((n, idx) => {
    const sys = idx < 6 ? 0 : 1;
    const yOffset = sys * 340;
    const ny = n.y + yOffset;
    const nx = sys === 0 ? n.x : n.x - 450;
    const yTab = 75 + yOffset + 130;

    if (n.barre) {
      svg += `<text x="${nx - 14}" y="${60 + yOffset}" font-size="14" font-weight="bold" font-family="serif" fill="#1d4ed8">${n.barre} ───</text>`;
    }
    if (n.acc) {
      svg += `<text x="${nx - 24}" y="${ny + 7}" font-size="23" font-family="serif" fill="#2563eb">${n.acc}</text>`;
    }

    svg += `<ellipse cx="${nx}" cy="${ny}" rx="9" ry="6.5" transform="rotate(-20 ${nx} ${ny})" fill="currentColor"/>`;
    svg += `<line x1="${nx + 8}" y1="${ny}" x2="${nx + 8}" y2="${ny - 42}" stroke="currentColor" stroke-width="2"/>`;

    if (n.finger) {
      svg += `<text x="${nx - 17}" y="${ny - 10}" font-size="14" font-weight="bold" font-family="Georgia, serif" fill="#d97706">${n.finger}</text>`;
    }

    const fret = (idx * 2 + 2) % 8;
    const sLine = yTab + (idx % 4) * 13;
    svg += `<rect x="${nx - 8}" y="${sLine - 8}" width="16" height="16" fill="var(--paper-bg)"/>`;
    svg += `<text x="${nx - 4}" y="${sLine + 4}" font-size="13" font-weight="bold" font-family="sans-serif" fill="currentColor">${fret}</text>`;
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
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.stroke();
    last = pt;
  };

  const up = () => {
    if (!drawing) return;
    drawing = false;
    setTimeout(() => {
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      const nextX = 150 + (editorNotes.length % 6) * 100;
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
      document.getElementById("editorStatusPill").textContent = `✨ Convertido a Molde (${currentDur} ${currentAcc})`;
    }, 260);
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
  document.querySelectorAll(".kp-pill").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

function pickAccidental(acc, btn) {
  currentAcc = currentAcc === acc ? "" : acc;
  btn.classList.toggle("active", currentAcc === acc);
}

function insertSampleChord() {
  const x = 150 + (editorNotes.length % 6) * 100;
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
    gain.gain.setValueAtTime(0.22, t);
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

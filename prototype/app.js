/* ==========================================================================
   LÓGICA INTERACTIVA DEL PROTOTIPO — MUSIC APP (4 MODOS DE DANIEL OLMOS)
   ========================================================================== */

// 1. BASE DE DATOS DE EJEMPLO (Basada en las capturas reales de Daniel en MobileSheets)
const libraryData = [
  {
    id: 1,
    title: "Sonata BWV 1034 (Transcr. David Russell)",
    rawTitle: "Bach BWV 1034 Sonate Flute Russel",
    composer: "J. S. Bach (1685–1750)",
    period: "Barroco",
    instrumentation: "Guitarra Sola",
    setlist: "Bach Programa",
    pages: "Págs. 27–36 (Libro 307 págs.)",
    needsCleanup: false
  },
  {
    id: 2,
    title: "(Partition, Sheet Music) - Bach - Partitura Suite Inglesa Nº 2 Bwv 807",
    cleanTitle: "Suite Inglesa Nº 2 en La menor, BWV 807",
    composer: "J. S. Bach (1685–1750)",
    period: "Barroco",
    instrumentation: "Guitarra Sola / Teclado",
    setlist: "Bach Programa",
    pages: "14 páginas",
    needsCleanup: true
  },
  {
    id: 3,
    title: "! Brouwer, Leo - From testerdayu to Peny Lane",
    cleanTitle: "From Yesterday to Penny Lane (The Beatles / Brouwer)",
    composer: "Leo Brouwer (n. 1939)",
    period: "Siglo XX / Contemporáneo",
    instrumentation: "Guitarra y Orquesta",
    setlist: "Programa Manuel Hernández",
    pages: "22 páginas",
    needsCleanup: true
  },
  {
    id: 4,
    title: "0000040517.pdf (Páginas 01, 02, 03 unidas)",
    cleanTitle: "Concierto del Sur — I. Allegretto (Reducción y Solista)",
    composer: "Manuel M. Ponce (1882–1948)",
    period: "Siglo XX / Contemporáneo",
    instrumentation: "Guitarra y Orquesta",
    setlist: "Programa Manuel Hernández",
    pages: "18 páginas",
    needsCleanup: true
  },
  {
    id: 5,
    title: "El Clave Bien Temperado — Preludio y Fuga I, BWV 846",
    composer: "J. S. Bach (1685–1750)",
    period: "Barroco",
    instrumentation: "Dúo / Cámara",
    setlist: "Bach Programa",
    pages: "6 páginas",
    needsCleanup: false
  },
  {
    id: 6,
    title: "Sonata Mexicana — I. Allegro moderato",
    composer: "Manuel M. Ponce (1882–1948)",
    period: "Siglo XX / Contemporáneo",
    instrumentation: "Guitarra Sola",
    setlist: "Programa Manuel Hernández",
    pages: "10 páginas",
    needsCleanup: false
  },
  {
    id: 7,
    title: "Suite Retratos — Dúo de Guitarras",
    composer: "Radamés Gnattali (1906–1988)",
    period: "Siglo XX / Contemporáneo",
    instrumentation: "Dúo / Cámara",
    setlist: "Duo Toño",
    pages: "16 páginas",
    needsCleanup: false
  },
  {
    id: 8,
    title: "Tango Suite — I. Deciso (Para 2 Guitarras)",
    composer: "Astor Piazzolla (1921–1992)",
    period: "Siglo XX / Contemporáneo",
    instrumentation: "Dúo / Cámara",
    setlist: "Duo Toño",
    pages: "12 páginas",
    needsCleanup: false
  }
];

let activePeriodFilter = "Todos";
let activeSetlistFilter = null;
let selectedScoreId = 1;

// 2. CAMBIO ENTRE LOS 4 MODOS
function switchMode(modeName) {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === modeName);
  });
  document.querySelectorAll(".mode-view").forEach((view) => {
    view.classList.remove("active");
  });
  const target = document.getElementById(`mode-${modeName}`);
  if (target) target.classList.add("active");

  if (modeName === "study") {
    setTimeout(resizeStudyCanvas, 60);
  } else if (modeName === "editor") {
    setTimeout(resizeEditorCanvas, 60);
  }
}

function changePaperTheme(themeClass) {
  document.body.className = themeClass;
}

// 3. MODO 1: BIBLIOTECA, IA DE CATALOGACIÓN Y TALLER PDF
function renderLibraryCards() {
  const grid = document.getElementById("scoreGrid");
  const query = (document.getElementById("librarySearchInput").value || "").toLowerCase();

  const filtered = libraryData.filter((item) => {
    const matchesQuery =
      item.title.toLowerCase().includes(query) ||
      item.composer.toLowerCase().includes(query) ||
      item.period.toLowerCase().includes(query) ||
      item.instrumentation.toLowerCase().includes(query);

    const matchesFilter =
      activePeriodFilter === "Todos" ||
      item.period === activePeriodFilter ||
      item.instrumentation === activePeriodFilter;

    const matchesSetlist = !activeSetlistFilter || item.setlist === activeSetlistFilter;

    return matchesQuery && matchesFilter && matchesSetlist;
  });

  grid.innerHTML = filtered
    .map(
      (item) => `
    <article class="score-card ${item.id === selectedScoreId ? "selected" : ""}" onclick="selectScoreCard(${item.id})">
      <div class="score-card-top">
        <span class="score-period-tag">${item.period}</span>
        ${
          item.needsCleanup
            ? `<span class="score-raw-warning">⚠️ Nombre crudo PDF</span>`
            : `<span class="score-period-tag" style="background:rgba(34,197,94,0.18);color:#86efac">✓ Catalogado IA</span>`
        }
      </div>
      <h4>${item.title}</h4>
      <p class="score-composer">${item.composer}</p>
      <div class="score-card-footer">
        <span>🎸 ${item.instrumentation}</span>
        <span>📄 ${item.pages}</span>
      </div>
    </article>
  `
    )
    .join("");
}

function selectScoreCard(id) {
  selectedScoreId = id;
  const score = libraryData.find((s) => s.id === id);
  if (!score) return;

  document.getElementById("inspTitle").textContent = score.title;
  document.getElementById("inspComposer").textContent = score.composer;
  document.getElementById("inspPeriod").textContent = score.period;
  document.getElementById("inspInstr").textContent = score.instrumentation;
  document.getElementById("inspPages").textContent = score.pages;
  document.getElementById("workshopFeedback").textContent = "";
  renderLibraryCards();
}

function setPeriodFilter(filterValue, btnElement) {
  activePeriodFilter = filterValue;
  activeSetlistFilter = null;
  document.querySelectorAll(".sub-pill").forEach((b) => b.classList.remove("active"));
  if (btnElement) btnElement.classList.add("active");
  renderLibraryCards();
}

function filterLibrary(groupType, btnElement) {
  document.querySelectorAll(".group-chip").forEach((b) => b.classList.remove("active"));
  if (btnElement) btnElement.classList.add("active");
  activeSetlistFilter = null;

  if (groupType === "all") {
    activePeriodFilter = "Todos";
  } else if (groupType === "period") {
    activePeriodFilter = "Barroco";
  } else if (groupType === "instrumentation") {
    activePeriodFilter = "Guitarra Sola";
  }
  renderLibraryCards();
}

function selectSetlist(setlistName) {
  activeSetlistFilter = setlistName;
  activePeriodFilter = "Todos";
  renderLibraryCards();
}

function runAiCleanup() {
  libraryData.forEach((item) => {
    if (item.needsCleanup && item.cleanTitle) {
      item.title = item.cleanTitle;
      item.needsCleanup = false;
    }
  });
  document.getElementById("aiStatusText").innerHTML =
    "✅ <strong>¡Biblioteca organizada por IA!</strong> Se corrigieron nombres crudos (<code>0000040517.pdf</code> y errores tipográficos) y se clasificaron por compositor, periodo histórico y dotación.";
  selectScoreCard(selectedScoreId);
}

function simulatePdfAction(actionType) {
  const fb = document.getElementById("workshopFeedback");
  if (actionType === "split") {
    fb.textContent = "✂️ PDF particionado: 'I. Adagio' (págs. 1-2) y 'II. Allegro' (págs. 3-4) listos como obras independientes.";
  } else if (actionType === "addremove") {
    fb.textContent = "📄 Portada vacía eliminada y páginas reordenadas sin salir de la biblioteca.";
  } else if (actionType === "rename") {
    fb.textContent = "✨ IA renombró y etiquetó metadatos históricos automáticamente.";
  }
}

function openPdfWorkshopModal() {
  simulatePdfAction("split");
}

// 4. MODO 2: MODO ESTUDIO (PENTAGRAMA SVG, SELLOS POR INSTRUMENTO Y TRAZO -> MOLDE)
const instrumentStampCatalog = {
  guitar: {
    label: "Sellos Guitarra Clásica:",
    stamps: ["p", "i", "m", "a", "1", "2", "3", "4", "①", "②", "③", "④", "⑤", "⑥", "C.II", "C.V", "C.VII", "½C", "arm.12"]
  },
  strings: {
    label: "Sellos Cuerdas Frotadas:",
    stamps: ["∏ Arco abajo", "∨ Arco arriba", "I Pos.", "III Pos.", "V Pos.", "pizz.", "arco", "sul tasto", "sul pont.", "0", "1", "2", "3", "4"]
  },
  piano: {
    label: "Sellos Piano / Teclado:",
    stamps: ["1", "2", "3", "4", "5", "Ped.", "✱", "m.d.", "m.s.", "una corda", "tre corde", "8va"]
  },
  winds: {
    label: "Sellos Alientos y Canto:",
    stamps: ["’ Respiración", "( Fraseo )", "stacc.", "tenuto", "flatterzunge", "vibrato", "sotto voce"]
  }
};

let currentStudyTool = "pen";
let currentInkColor = "#1e3a8a";
let activeStampText = null;
let studyStrokesCount = 0;

const moldSuggestions = [
  "poco rit.",
  "dolce espress.",
  "C.VII ───",
  "p  i  m  a",
  "a tempo",
  "cresc. molto",
  "⑥ = Re"
];

function updateStampPalette(instrumentKey) {
  const profile = instrumentStampCatalog[instrumentKey] || instrumentStampCatalog.guitar;
  document.getElementById("stampProfileTitle").textContent = profile.label;
  const container = document.getElementById("instrumentStampsContainer");
  container.innerHTML = profile.stamps
    .map((s) => `<button class="stamp-chip" onclick="selectStamp('${s}')">${s}</button>`)
    .join("");
}

function selectStudyTool(tool) {
  currentStudyTool = tool;
  activeStampText = null;
  document.querySelectorAll(".tool-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".stamp-chip").forEach((b) => b.classList.remove("active"));
  if (tool === "pen") document.getElementById("toolPen").classList.add("active");
  if (tool === "highlighter") document.getElementById("toolHighlighter").classList.add("active");
  if (tool === "eraser") document.getElementById("toolEraser").classList.add("active");
}

function setInkColor(color, btn) {
  currentInkColor = color;
  document.querySelectorAll(".color-dot").forEach((d) => d.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

function selectStamp(stampText) {
  activeStampText = stampText;
  currentStudyTool = "stamp";
  document.querySelectorAll(".tool-btn").forEach((b) => b.classList.remove("active"));
}

function setScoreLayout(layoutMode) {
  const container = document.getElementById("studyPaperContainer");
  const sheet2 = document.getElementById("studySheet2");
  document.getElementById("studyView1H").classList.toggle("active", layoutMode === "single-horizontal");
  document.getElementById("studyView2P").classList.toggle("active", layoutMode === "two-pages");

  if (layoutMode === "single-horizontal") {
    container.className = "score-paper-container single-horizontal";
    sheet2.classList.add("hidden-page");
  } else {
    container.className = "score-paper-container two-pages";
    sheet2.classList.remove("hidden-page");
  }
  setTimeout(resizeStudyCanvas, 60);
}

// Generador de Pentagrama SVG Nítido (Estilo Bach BWV 1034)
function buildScoreSvg(systemCount = 3, highlightMeasure = -1) {
  let svg = `<svg viewBox="0 0 1100 ${systemCount * 130}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">`;

  for (let sys = 0; sys < systemCount; sys++) {
    const yBase = 35 + sys * 125;

    // Resaltado de seguimiento auditivo si corresponde
    if (highlightMeasure === sys) {
      svg += `<rect x="20" y="${yBase - 18}" width="1060" height="80" rx="8" fill="rgba(34, 197, 94, 0.16)" stroke="#22c55e" stroke-width="1.5"/>`;
    }

    // 5 líneas del pentagrama
    for (let line = 0; line < 5; line++) {
      const y = yBase + line * 11;
      svg += `<line x1="30" y1="${y}" x2="1070" y2="${y}" stroke="currentColor" stroke-width="1.1" opacity="0.85"/>`;
    }

    // Clave de Sol y armadura (Fa#)
    svg += `<text x="38" y="${yBase + 38}" font-size="48" font-family="serif" fill="currentColor">𝄞</text>`;
    svg += `<text x="75" y="${yBase + 13}" font-size="22" font-family="serif" fill="currentColor">♯</text>`;
    if (sys === 0) {
      svg += `<text x="98" y="${yBase + 30}" font-size="24" font-family="serif" font-weight="bold" fill="currentColor">𝄴</text>`;
    }

    // Líneas divisorias de compás
    [360, 710, 1070].forEach((xBar) => {
      svg += `<line x1="${xBar}" y1="${yBase}" x2="${xBar}" y2="${yBase + 44}" stroke="currentColor" stroke-width="1.4"/>`;
    });

    // Número de compás y posición romana de guitarra
    svg += `<text x="30" y="${yBase - 8}" font-size="11" font-style="italic" fill="currentColor">${sys * 3 + 1}</text>`;
    svg += `<text x="160" y="${yBase - 10}" font-size="13" font-weight="bold" font-family="serif" fill="currentColor">VII ────</text>`;
    svg += `<text x="510" y="${yBase - 10}" font-size="13" font-weight="bold" font-family="serif" fill="currentColor">II ───</text>`;

    // Notas figuradas estilo barroco (grupos de semicorcheas y bajos)
    const notePositions = [130, 165, 200, 235, 275, 315, 400, 440, 480, 525, 570, 620, 750, 800, 855, 910, 975];
    notePositions.forEach((nx, idx) => {
      const ny = yBase + 11 + ((idx * 7 + sys * 5) % 28);
      svg += `<ellipse cx="${nx}" cy="${ny}" rx="6.2" ry="4.5" transform="rotate(-18 ${nx} ${ny})" fill="currentColor"/>`;
      svg += `<line x1="${nx + 5.5}" y1="${ny}" x2="${nx + 5.5}" y2="${ny - 28}" stroke="currentColor" stroke-width="1.3"/>`;

      // Digitaciones sutiles de ejemplo
      if (idx % 3 === 0) {
        const finger = ["1", "2", "4", "3"][idx % 4];
        svg += `<text x="${nx - 10}" y="${ny + 4}" font-size="11" font-family="sans-serif" font-weight="bold" fill="currentColor">${finger}</text>`;
      }
      // Bajo polifónico en guitarra
      if (idx % 4 === 0) {
        const by = yBase + 44;
        svg += `<ellipse cx="${nx}" cy="${by}" rx="6.2" ry="4.5" transform="rotate(-18 ${nx} ${by})" fill="currentColor"/>`;
        svg += `<line x1="${nx - 5.5}" y1="${by}" x2="${nx - 5.5}" y2="${by + 24}" stroke="currentColor" stroke-width="1.3"/>`;
      }
    });
  }

  svg += `</svg>`;
  return svg;
}

// Canvas de dibujo en Modo Estudio + Conversión de Trazo Libre a Letra de Molde
let isDrawingStudy = false;
let lastStudyPos = { x: 0, y: 0 };

function resizeStudyCanvas() {
  const canvas = document.getElementById("studyCanvas1");
  const wrapper = document.getElementById("studySvgWrapper1");
  if (!canvas || !wrapper) return;
  canvas.width = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
}

function initStudyCanvasEvents() {
  const canvas = document.getElementById("studyCanvas1");
  if (!canvas) return;

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const pos = getPos(e);

    if (currentStudyTool === "stamp" && activeStampText) {
      placeMoldAnnotation(pos.x, pos.y, activeStampText, currentInkColor);
      return;
    }

    isDrawingStudy = true;
    lastStudyPos = pos;
  };

  const moveDraw = (e) => {
    if (!isDrawingStudy) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(lastStudyPos.x, lastStudyPos.y);
    ctx.lineTo(pos.x, pos.y);

    if (currentStudyTool === "highlighter") {
      ctx.strokeStyle = "rgba(250, 204, 21, 0.35)";
      ctx.lineWidth = 18;
    } else if (currentStudyTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 24;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = currentInkColor;
      ctx.lineWidth = 2.6;
    }

    ctx.lineCap = "round";
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    lastStudyPos = pos;
  };

  const endDraw = () => {
    if (!isDrawingStudy) return;
    isDrawingStudy = false;

    const autoMold = document.getElementById("autoMoldToggle").checked;
    if (autoMold && currentStudyTool === "pen") {
      setTimeout(() => {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const text = moldSuggestions[studyStrokesCount % moldSuggestions.length];
        studyStrokesCount++;
        placeMoldAnnotation(lastStudyPos.x, lastStudyPos.y, text, currentInkColor);
      }, 380);
    }
  };

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", moveDraw);
  window.addEventListener("mouseup", endDraw);

  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", moveDraw, { passive: false });
  window.addEventListener("touchend", endDraw);
}

function placeMoldAnnotation(x, y, text, color) {
  const overlay = document.getElementById("moldOverlay1");
  const badge = document.createElement("div");
  badge.className = "mold-annotation-badge";
  badge.style.left = `${x}px`;
  badge.style.top = `${y}px`;
  badge.style.color = color;
  badge.textContent = text;
  overlay.appendChild(badge);
}

function convertAllStrokesToMold() {
  const canvas = document.getElementById("studyCanvas1");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const text = moldSuggestions[studyStrokesCount % moldSuggestions.length];
  studyStrokesCount++;
  placeMoldAnnotation(260 + (studyStrokesCount * 90) % 500, 95 + (studyStrokesCount * 65) % 220, text, currentInkColor);
}

function clearStudyAnnotations() {
  const canvas = document.getElementById("studyCanvas1");
  if (canvas) {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }
  document.getElementById("moldOverlay1").innerHTML = "";
}

// 5. MODO 3: MODO CONCIERTO (DISPOSICIONES Y SEGUIMIENTO AUDITIVO EN VIVO)
let concertPageIndex = 1;
let audioFollowInterval = null;
let currentFollowedSystem = 0;

function setConcertLayout(mode) {
  const wrapper = document.getElementById("concertPaperWrapper");
  const rightSheet = document.getElementById("concertSheetRight");

  document.getElementById("cLayout1H").classList.toggle("active", mode === "1h");
  document.getElementById("cLayout2P").classList.toggle("active", mode === "2p");
  document.getElementById("cLayout1V").classList.toggle("active", mode === "1v");

  wrapper.className = `concert-paper-wrapper layout-${mode}`;
  if (mode === "2p") {
    rightSheet.classList.remove("hidden-page");
  } else {
    rightSheet.classList.add("hidden-page");
  }
}

function turnConcertPage(delta) {
  concertPageIndex = Math.max(1, Math.min(10, concertPageIndex + delta));
  const style = document.getElementById("pageTurnStyle").value;
  const styleNames = {
    "half-scroll": "Media Página Horizontal",
    wipe: "Anticipación Limpiaparabrisas",
    "step-1": "Avance continuo 1 a 1",
    "step-2": "Salto de 2 páginas"
  };

  document.getElementById("concertPageIndicator").textContent =
    `Página ${concertPageIndex} / 10 (${styleNames[style]})`;
  document.getElementById("concertNotationLeft").innerHTML = buildScoreSvg(3, currentFollowedSystem);
}

function toggleAudioFollower() {
  const btn = document.getElementById("audioFollowBtn");
  const bar = document.getElementById("audioFollowerBar");

  if (audioFollowInterval) {
    clearInterval(audioFollowInterval);
    audioFollowInterval = null;
    btn.classList.remove("listening");
    btn.textContent = "🎙️ Activar Seguimiento por Audio";
    bar.classList.add("hidden");
    document.getElementById("concertNotationLeft").innerHTML = buildScoreSvg(3, -1);
    return;
  }

  btn.classList.add("listening");
  btn.textContent = "🎙️ Escuchando Guitarra en Vivo (Activo)";
  bar.classList.remove("hidden");
  currentFollowedSystem = 0;
  document.getElementById("concertNotationLeft").innerHTML = buildScoreSvg(3, currentFollowedSystem);

  audioFollowInterval = setInterval(() => {
    currentFollowedSystem = (currentFollowedSystem + 1) % 3;
    const progress = ((currentFollowedSystem + 1) / 3) * 100;
    document.getElementById("followerProgressBar").style.width = `${progress}%`;
    document.getElementById("followerMeasureText").textContent =
      `Escuchando guitarra en vivo... Sistema ${currentFollowedSystem + 1} (Compás ${currentFollowedSystem * 3 + 1}–${currentFollowedSystem * 3 + 3})`;

    document.getElementById("concertNotationLeft").innerHTML = buildScoreSvg(3, currentFollowedSystem);

    if (currentFollowedSystem === 2) {
      setTimeout(() => {
        if (audioFollowInterval) turnConcertPage(1);
      }, 1200);
    }
  }, 2400);
}

function toggleConcertZenMode() {
  const topBar = document.getElementById("topBar");
  const isHidden = topBar.style.display === "none";
  topBar.style.display = isHidden ? "flex" : "none";
}

// 6. MODO 4: EDITOR TOUCH (SIBELIUS TÁCTIL + TRAZO LIBRE A NOTACIÓN MUSICAL DE MOLDE)
let editorMoldNotes = [
  { x: 160, y: 125, pitch: "Re4", finger: "p", accidental: "", duration: "♩", label: "Re4" },
  { x: 265, y: 103, pitch: "La4", finger: "i", accidental: "", duration: "♪", label: "La4" },
  { x: 365, y: 92, pitch: "Do5", finger: "m", accidental: "♭", duration: "♪", label: "Do♭5" },
  { x: 475, y: 81, pitch: "Fa5", finger: "a", accidental: "", duration: "♩", label: "Fa5", barre: "C.III" }
];

let selectedDurationSymbol = "♩";
let selectedDurationName = "Negra";

function renderEditorMoldSvg() {
  const container = document.getElementById("editorMoldSvgContainer");
  if (!container) return;

  let svg = `<svg viewBox="0 0 960 330" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">`;

  // Pentagrama principal de edición (grande y cómodo para stylus/touch)
  const yTop = 65;
  for (let i = 0; i < 5; i++) {
    const y = yTop + i * 16;
    svg += `<line x1="40" y1="${y}" x2="920" y2="${y}" stroke="currentColor" stroke-width="1.5"/>`;
  }

  // Tablatura vinculada debajo (6 cuerdas de guitarra)
  const yTab = 205;
  for (let s = 0; s < 6; s++) {
    const y = yTab + s * 13;
    svg += `<line x1="40" y1="${y}" x2="920" y2="${y}" stroke="currentColor" stroke-width="1" opacity="0.55"/>`;
  }

  // Clave de Sol 8vb (Guitarra) y TAB
  svg += `<text x="50" y="${yTop + 52}" font-size="64" font-family="serif" fill="currentColor">𝄞</text>`;
  svg += `<text x="105" y="${yTop + 42}" font-size="30" font-family="serif" font-weight="bold" fill="currentColor">3/4</text>`;
  svg += `<text x="54" y="${yTab + 38}" font-size="18" font-family="sans-serif" font-weight="bold" fill="currentColor" opacity="0.7">TAB</text>`;

  // Notas convertidas a "Notación de Molde"
  editorMoldNotes.forEach((n, index) => {
    if (n.barre) {
      svg += `<text x="${n.x - 18}" y="${yTop - 16}" font-size="15" font-weight="bold" font-family="serif" fill="#1e3a8a">${n.barre} ────</text>`;
    }
    if (n.expression) {
      svg += `<text x="${n.x - 20}" y="${yTop + 95}" font-size="18" font-style="italic" font-weight="bold" font-family="Georgia, serif" fill="#1e3a8a">${n.expression}</text>`;
    }
    if (n.accidental) {
      svg += `<text x="${n.x - 24}" y="${n.y + 7}" font-size="24" font-family="serif" fill="#1d4ed8">${n.accidental}</text>`;
    }

    // Cabeza de nota grabada de molde
    svg += `<ellipse cx="${n.x}" cy="${n.y}" rx="9.5" ry="7" transform="rotate(-20 ${n.x} ${n.y})" fill="currentColor"/>`;
    // Plica
    svg += `<line x1="${n.x + 8.5}" y1="${n.y}" x2="${n.x + 8.5}" y2="${n.y - 44}" stroke="currentColor" stroke-width="2"/>`;

    // Digitación de molde
    if (n.finger) {
      svg += `<text x="${n.x - 18}" y="${n.y - 10}" font-size="14" font-weight="bold" font-family="Georgia, serif" fill="#b45309">${n.finger}</text>`;
    }

    // Número de traste automático en la Tablatura inferior
    const fret = (index * 2 + 3) % 9;
    const stringLine = yTab + (index % 4) * 13;
    svg += `<rect x="${n.x - 8}" y="${stringLine - 8}" width="16" height="16" fill="var(--paper-bg)"/>`;
    svg += `<text x="${n.x - 4}" y="${stringLine + 4}" font-size="13" font-weight="bold" font-family="sans-serif" fill="currentColor">${fret}</text>`;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
}

function resizeEditorCanvas() {
  const canvas = document.getElementById("editorHandwritingCanvas");
  const area = document.getElementById("editorStaffArea");
  if (!canvas || !area) return;
  canvas.width = area.clientWidth;
  canvas.height = area.clientHeight;
  renderEditorMoldSvg();
}

function initEditorCanvasEvents() {
  const canvas = document.getElementById("editorHandwritingCanvas");
  if (!canvas) return;
  let drawing = false;
  let lastPt = { x: 0, y: 0 };

  const getPt = (e) => {
    const r = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - r.left, y: cy - r.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing = true;
    lastPt = getPt(e);
  };

  const move = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const pt = getPt(e);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(lastPt.x, lastPt.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPt = pt;
  };

  const end = () => {
    if (!drawing) return;
    drawing = false;
    const ctx = canvas.getContext("2d");

    // Convertir el trazo manuscrito en una nota musical de molde alineada al pentagrama
    setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scaleX = (lastPt.x / canvas.width) * 960;
      const clampedX = Math.max(150, Math.min(880, scaleX));
      const rawY = (lastPt.y / canvas.height) * 330;
      const snappedY = Math.max(65, Math.min(145, Math.round(rawY / 8) * 8));

      const fingers = ["1", "2", "3", "4", "p", "i", "m", "a"];
      const f = fingers[editorMoldNotes.length % fingers.length];

      editorMoldNotes.push({
        x: Math.round(clampedX),
        y: snappedY,
        finger: f,
        accidental: selectedDurationSymbol === "♯" ? "♯" : selectedDurationSymbol === "♭" ? "♭" : "",
        duration: selectedDurationSymbol
      });

      renderEditorMoldSvg();
      document.getElementById("editorRecognitionToast").textContent =
        `✨ Trazo manuscrito convertido a Notación de Molde (${selectedDurationName} + digitación '${f}' + Tablatura)`;
    }, 320);
  };

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("touchend", end);
}

function simulateHandwrittenNote(presetKey, description) {
  const nextX = Math.min(880, 170 + editorMoldNotes.length * 105);
  if (presetKey === "quarter-d") {
    editorMoldNotes.push({ x: nextX, y: 121, finger: "p", accidental: "", duration: "♩" });
  } else if (presetKey === "chord-gm") {
    editorMoldNotes.push({ x: nextX, y: 89, finger: "1", accidental: "", barre: "C.III" });
    editorMoldNotes.push({ x: nextX, y: 105, finger: "3", accidental: "" });
  } else if (presetKey === "sharp-c") {
    editorMoldNotes.push({ x: nextX, y: 97, finger: "2", accidental: "♯" });
  } else if (presetKey === "expr-dolce") {
    editorMoldNotes.push({ x: nextX, y: 113, finger: "m", expression: "dolce espress." });
  }
  renderEditorMoldSvg();
  document.getElementById("editorRecognitionToast").textContent =
    `✨ Reconocido: ${description} → Convertido a notación musical de molde.`;
}

function selectKeypadDuration(sym, name) {
  selectedDurationSymbol = sym;
  selectedDurationName = name;
  document.querySelectorAll(".kp-btn").forEach((b) => b.classList.remove("active"));
  event.currentTarget.classList.add("active");
  document.getElementById("editorRecognitionToast").textContent =
    `Keypad Táctil: Figura seleccionada [${sym} ${name}] — Dibuja o toca en el pentagrama.`;
}

function selectVoice(num, btn) {
  document.querySelectorAll(".v-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("editorRecognitionToast").textContent =
    `Polifonía activa: Voz ${num} lista para escritura manuscrita o táctil.`;
}

function setEditorInputMode(mode) {
  document.getElementById("edPenMode").classList.toggle("active", mode === "handwriting");
  document.getElementById("edTouchMode").classList.toggle("active", mode === "touch");
}

function clearEditorMeasure() {
  editorMoldNotes = editorMoldNotes.slice(0, 2);
  renderEditorMoldSvg();
  document.getElementById("editorRecognitionToast").textContent = "Compás reiniciado. Dibuja con el lápiz o dedo sobre el pentagrama.";
}

function playEditorScore() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const freqs = [293.66, 440.0, 523.25, 698.46, 587.33, 659.25];

  editorMoldNotes.forEach((n, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freqs[idx % freqs.length];
    const startTime = ctx.currentTime + idx * 0.38;
    gain.gain.setValueAtTime(0.22, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.36);
  });

  document.getElementById("editorRecognitionToast").textContent = "🔊 Reproduciendo compás grabado en notación de molde...";
}

// INICIALIZACIÓN GENERAL
window.addEventListener("DOMContentLoaded", () => {
  renderLibraryCards();
  updateStampPalette("guitar");
  document.getElementById("studyNotationSvg1").innerHTML = buildScoreSvg(3, -1);
  document.getElementById("studyNotationSvg2").innerHTML = buildScoreSvg(3, -1);
  document.getElementById("concertNotationLeft").innerHTML = buildScoreSvg(3, -1);
  document.getElementById("concertNotationRight").innerHTML = buildScoreSvg(3, -1);
  initStudyCanvasEvents();
  initEditorCanvasEvents();
  resizeStudyCanvas();
  resizeEditorCanvas();
});

window.addEventListener("resize", () => {
  resizeStudyCanvas();
  resizeEditorCanvas();
});

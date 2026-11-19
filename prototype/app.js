/* ==========================================================================
   CONCEPTS × STAFFPAD × LINEARITY CURVE INTERACTION ENGINE (v4)
   BIBLIOTECA AFINADA: FOLIO/LISTA + DESPLEGABLE DE CLASIFICACIÓN + MODO IA
   ========================================================================== */

const scores = [
  {
    id: 1,
    title: "Sonata en Mi menor, BWV 1034",
    subtitle: "Transcr. David Russell (orig. Flauta y Continuo)",
    composer: "J. S. Bach (1685–1750)",
    period: "Barroco",
    group: "Guitarra Sola",
    program: "Bach Programa",
    pages: "10 págs.",
    tuning: "6ª en Re",
    raw: false,
    aiData: {
      history: "Compuesta hacia 1724 en Leipzig (o posiblemente en Köthen) originalmente para flauta travesera y bajo continuo. La transcripción para guitarra clásica de David Russell traslada con maestría la escritura contrapuntística del continuo y la línea solista a un solo instrumento.",
      theory: "Estructurada en 4 movimientos (Sonata da chiesa: Adagio ma non tanto – Allegro – Andante – Allegro). El primer movimiento en Mi menor emplea un motivo de siciliana ornamentada con un bajo caminante continuo; el tercer movimiento en Sol mayor ofrece un contraste lírico luminoso.",
      performance: "Cuidar la independencia de planos sonoros entre el pulgar (que asume el rol del violoncello/continuo) y los dedos i-m-a (la flauta). En el Adagio inicial, las apoyaturas deben resolverse dentro del pulso con flexibilidad expresiva sin perder la nobleza del bajo.",
      links: [
        { label: "▶ YouTube: David Russell interpreta Bach BWV 1034", url: "https://www.youtube.com/results?search_query=David+Russell+Bach+BWV+1034+guitar" },
        { label: "▶ YouTube: Comparativa en Flauta Traversa Barroca", url: "https://www.youtube.com/results?search_query=Bach+BWV+1034+baroque+flute" },
        { label: "🏛️ IMSLP: Manuscrito y Ediciones Urtext BWV 1034", url: "https://imslp.org/wiki/Flute_Sonata_in_E_minor,_BWV_1034_(Bach,_Johann_Sebastian)" }
      ]
    }
  },
  {
    id: 2,
    title: "(Partition) Bach - Suite Inglesa Nº 2 BWV 807",
    clean: "Suite Inglesa Nº 2 en La menor, BWV 807",
    subtitle: "Prélude, Allemande, Courante, Sarabande, Bourrées I/II, Gigue",
    composer: "J. S. Bach (1685–1750)",
    period: "Barroco",
    group: "Guitarra Sola",
    program: "Bach Programa",
    pages: "14 págs.",
    tuning: "Estándar",
    raw: true,
    aiData: {
      history: "Las Suites Inglesas (BWV 806–811) fueron compuestas en Weimar alrededor de 1715. Representan la síntesis de Bach entre la danza cortesana francesa y el concierto italiano (*ritornello* en el extenso Preludio inicial).",
      theory: "El Preludio está construido en una forma Da Capo monumental (A–B–A) impulsada por un motivo motor en semicorcheas. La Sarabande incluye *Les agréments de la même Sarabande* (versión ornamentada escrita por el propio Bach).",
      performance: "En el Preludio, mantener la claridad articulatoria y reservar peso dinámico para las cadencias estructurales. Utilizar la versión ornamentada de Bach en la repetición de la Sarabande como modelo de improvisación barroca.",
      links: [
        { label: "▶ YouTube: Suite Inglesa BWV 807 en Guitarra / Dúo", url: "https://www.youtube.com/results?search_query=Bach+BWV+807+guitar" },
        { label: "▶ YouTube: Versión en Clavecín (Gustav Leonhardt / Perahia)", url: "https://www.youtube.com/results?search_query=Bach+English+Suite+2+BWV+807" },
        { label: "🏛️ IMSLP: Partitura Urtext BWV 807", url: "https://imslp.org/wiki/English_Suite_No.2_in_A_minor,_BWV_807_(Bach,_Johann_Sebastian)" }
      ]
    }
  },
  {
    id: 3,
    title: "0000040517.pdf (Págs. 01–03)",
    clean: "Concierto del Sur (Guitarra y Orquesta)",
    subtitle: "I. Allegretto — II. Andante — III. Allegro moderato e festivo",
    composer: "Manuel M. Ponce (1882–1948)",
    period: "Siglo XX",
    group: "Guitarra y Orquesta",
    program: "Programa Manuel Hernández",
    pages: "18 págs.",
    tuning: "Estándar",
    raw: true,
    aiData: {
      history: "Dedicado a Andrés Segovia y estrenado en Montevideo en 1941 bajo la batuta del propio Manuel M. Ponce. Es una de las obras cumbre del repertorio concertante mexicano e iberoamericano para guitarra y orquesta.",
      theory: "El I. Allegretto combina la forma sonata con giros modales e impresionistas y ritmos de raíz hispanoamericana. La gran Cadenza solista del primer movimiento articula los dos temas principales antes de la recapitulación.",
      performance: "Obra emblemática en la trayectoria de Daniel Olmos (con la que debutó como solista con orquesta a los 17 años). Cuidar la proyección tímbrica (*sul ponticello* vs *metallico*) en los diálogos con maderas y cuerdas, y el pulso rítmico incisivo en el 3/4 + 6/8 del tercer movimiento.",
      links: [
        { label: "▶ YouTube: Manuel M. Ponce — Concierto del Sur (Interpretaciones)", url: "https://www.youtube.com/results?search_query=Manuel+M+Ponce+Concierto+del+Sur+guitarra" },
        { label: "▶ YouTube: Andrés Segovia — Grabación Histórica Concierto del Sur", url: "https://www.youtube.com/results?search_query=Andres+Segovia+Concierto+del+Sur+Ponce" }
      ]
    }
  },
  {
    id: 4,
    title: "! Brouwer, Leo - From testerdayu to Peny Lane",
    clean: "From Yesterday to Penny Lane",
    subtitle: "7 Canciones de Lennon/McCartney para Guitarra y Orquesta",
    composer: "Leo Brouwer (n. 1939)",
    period: "Siglo XX",
    group: "Guitarra y Orquesta",
    program: "Programa Manuel Hernández",
    pages: "22 págs.",
    tuning: "Estándar",
    raw: true,
    aiData: {
      history: "Compuesta en 1985 por el maestro cubano Leo Brouwer, fusiona el lirismo melódico de The Beatles con la orquestación neobarroca y contemporánea característica de la etapa hiperromántica de Brouwer.",
      theory: "Cada canción adopta un tratamiento camerístico distinto: desde texturas tipo *Concerto Grosso* barroco en 'Eleanor Rigby' y 'Penny Lane' hasta armonías cuartales y colorísticas en 'Yesterday' y 'She's Leaving Home'.",
      performance: "Equilibrar la cantabilidad popular de las melodías originales con el rigor rítmico de las figuraciones brouwerianas y los cambios súbitos de color.",
      links: [
        { label: "▶ YouTube: Leo Brouwer — From Yesterday to Penny Lane", url: "https://www.youtube.com/results?search_query=Leo+Brouwer+From+Yesterday+to+Penny+Lane" }
      ]
    }
  },
  {
    id: 5,
    title: "Sonata Mexicana",
    subtitle: "I. Allegro moderato — II. Intermezzo — III. Allegretto — IV. Allegro vivo",
    composer: "Manuel M. Ponce (1882–1948)",
    period: "Siglo XX",
    group: "Guitarra Sola",
    program: "Programa Manuel Hernández",
    pages: "10 págs.",
    tuning: "Estándar",
    raw: false,
    aiData: {
      history: "Compuesta en 1923 en México, fue la primera sonata que Ponce escribió para Andrés Segovia, marcando el inicio de una colaboración histórica que transformó el repertorio de la guitarra del siglo XX.",
      theory: "Integra temas de inspiración folclórica mexicana dentro de una arquitectura clásica-impresionista influenciada por la estancia previa de Ponce y su admiración por la escuela francesa.",
      performance: "Destacar el carácter íntimo y nostálgico del II. Intermezzo (Andantino affettuoso) y la agilidad rítmica de jarabe/danza en el Finale.",
      links: [
        { label: "▶ YouTube: Manuel M. Ponce — Sonata Mexicana (Interpretaciones)", url: "https://www.youtube.com/results?search_query=Manuel+Ponce+Sonata+Mexicana+guitar" }
      ]
    }
  },
  {
    id: 6,
    title: "Tango Suite — I. Deciso",
    subtitle: "Original para Dúo de Guitarras",
    composer: "Astor Piazzolla (1921–1992)",
    period: "Siglo XX",
    group: "Dúo / Cámara",
    program: "Duo Toño",
    pages: "12 págs.",
    tuning: "Estándar",
    raw: false,
    aiData: {
      history: "Escrita en 1984 específicamente para el célebre dúo de los hermanos Sérgio y Odair Assad. Es la única obra de gran formato escrita por Piazzolla para dos guitarras.",
      theory: "Tres movimientos (Tango No. 1 Deciso – Tango No. 2 Andante – Tango No. 3 Allegro). Emplea la acentuación característica de milonga/nuevo tango (3+3+2), contrapunto fugado y efectos percusivos.",
      performance: "Sincronización milimétrica entre Guitarra 1 y Guitarra 2 en los acentos en síncopa y los pasajes percusivos sobre la tapa y las cuerdas.",
      links: [
        { label: "▶ YouTube: Sérgio & Odair Assad — Piazzolla Tango Suite", url: "https://www.youtube.com/results?search_query=Assad+Brothers+Piazzolla+Tango+Suite" }
      ]
    }
  }
];

let libraryViewMode = "folio"; // 'folio' | 'list'
let currentClassification = "all"; // 'all' | 'composer' | 'period' | 'instrumentation' | 'programs' | 'ai-mode'

// CAMBIO ENTRE LOS 4 MODOS PRINCIPALES
function switchMode(mode) {
  document.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  document.querySelectorAll(".canvas-view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`mode-${mode}`).classList.add("active");

  if (mode === "study") setTimeout(setupStudyCanvas, 40);
  if (mode === "editor") setTimeout(setupEditorCanvas, 40);
}

// CAMBIO DE PALETA VISUAL
function setPalette(paletteClass, btn) {
  document.body.className = paletteClass;
  document.querySelectorAll(".theme-orb").forEach((c) => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

// ==========================================================================
// 1. BIBLIOTECA AFINADA: ALTERNAR FOLIO / LISTA + DESPLEGABLE + MODO IA
// ==========================================================================

function setLibraryViewMode(mode) {
  libraryViewMode = mode;
  document.getElementById("btnViewFolio").classList.toggle("active", mode === "folio");
  document.getElementById("btnViewList").classList.toggle("active", mode === "list");

  // Si estaba en Modo IA y toca Folio o Lista, regresa al catálogo en ese modo
  if (currentClassification === "ai-mode") {
    currentClassification = "all";
    document.getElementById("currentClassifyLabel").textContent = "Clasificar: Todo";
    document.getElementById("aiMusicologyStage").classList.add("hidden");
    document.getElementById("libraryCatalogContainer").classList.remove("hidden");
  }
  renderLibrary();
}

function toggleClassifyMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("classifyMenu");
  menu.classList.toggle("hidden");
}

window.addEventListener("click", () => {
  const menu = document.getElementById("classifyMenu");
  if (menu && !menu.classList.contains("hidden")) {
    menu.classList.add("hidden");
  }
});

function selectClassification(clsKey, labelText, btn) {
  currentClassification = clsKey;
  document.getElementById("currentClassifyLabel").textContent = labelText;
  document.querySelectorAll(".dd-item").forEach((item) => item.classList.remove("active"));
  if (btn) btn.classList.add("active");
  document.getElementById("classifyMenu").classList.add("hidden");

  const catalogEl = document.getElementById("libraryCatalogContainer");
  const aiStageEl = document.getElementById("aiMusicologyStage");

  if (clsKey === "ai-mode") {
    catalogEl.classList.add("hidden");
    aiStageEl.classList.remove("hidden");
    populateAiWorkSelector();
    renderAiMusicologyView(scores[0].id);
  } else {
    aiStageEl.classList.add("hidden");
    catalogEl.classList.remove("hidden");
    renderLibrary();
  }
}

function exitAiModeToCatalog() {
  const allBtn = document.querySelector('.dd-item[data-cls="all"]');
  selectClassification("all", "Clasificar: Todo", allBtn);
}

function renderLibrary() {
  const container = document.getElementById("libraryCatalogContainer");
  const q = (document.getElementById("searchInput").value || "").toLowerCase();

  const filtered = scores.filter((s) => {
    return (
      s.title.toLowerCase().includes(q) ||
      (s.clean && s.clean.toLowerCase().includes(q)) ||
      s.composer.toLowerCase().includes(q) ||
      s.period.toLowerCase().includes(q) ||
      s.group.toLowerCase().includes(q) ||
      s.program.toLowerCase().includes(q)
    );
  });

  // Agrupar según la clasificación elegida en el desplegable
  const groups = {};
  filtered.forEach((s) => {
    let key = "Catálogo General (A–Z)";
    if (currentClassification === "composer") key = s.composer;
    else if (currentClassification === "period") key = `Periodo ${s.period}`;
    else if (currentClassification === "instrumentation") key = `Dotación: ${s.group}`;
    else if (currentClassification === "programs") key = `Programa: ${s.program}`;

    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });

  const groupKeys = Object.keys(groups);
  const showGroupHeaders = currentClassification !== "all";

  let html = "";
  groupKeys.forEach((gName) => {
    const groupItems = groups[gName];
    if (showGroupHeaders) {
      html += `
        <div class="lib-group-header">
          <h4>${gName}</h4>
          <span class="lib-group-count">${groupItems.length} ${groupItems.length === 1 ? "obra" : "obras"}</span>
        </div>
      `;
    }

    if (libraryViewMode === "folio") {
      html += `<div class="folio-grid">${groupItems.map(buildFolioCardHtml).join("")}</div>`;
    } else {
      html += `<div class="editorial-list-table">${groupItems.map(buildListRowHtml).join("")}</div>`;
    }
  });

  container.innerHTML = html;
}

function buildFolioCardHtml(s) {
  const safeTitle = s.title.replace(/'/g, "");
  return `
    <article class="folio-card" onclick="openScoreInStudy('${safeTitle}', '${s.composer}')">
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
        <div class="folio-preview-foot">
          <span>${s.tuning}</span>
          <span>${s.pages}</span>
        </div>
      </div>

      <div class="folio-card-body">
        <div class="folio-card-title">
          <span>${s.title}</span>
          ${s.raw ? `<span class="raw-badge">PDF Crudo</span>` : ""}
        </div>
        <span class="folio-card-sub">${s.composer}</span>
        <span class="folio-card-detail">${s.subtitle}</span>
      </div>

      <div class="folio-card-foot" onclick="event.stopPropagation()">
        <span class="period-tag">${s.period} • ${s.group}</span>
        <div class="folio-quick-btns">
          <button class="mini-action-btn" onclick="openAiForWork(${s.id})" title="Consultar IA Musicológica">✦</button>
          <button class="mini-action-btn" onclick="openPdfModal('${safeTitle}')" title="Taller PDF">✂</button>
          <button class="mini-action-btn" onclick="switchMode('concert')" title="Modo Concierto">◉</button>
        </div>
      </div>
    </article>
  `;
}

function buildListRowHtml(s) {
  const safeTitle = s.title.replace(/'/g, "");
  return `
    <div class="list-detail-row" onclick="openScoreInStudy('${safeTitle}', '${s.composer}')">
      <div class="list-col-main">
        <div class="list-title-line">
          <strong class="list-work-title">${s.title}</strong>
          ${s.raw ? `<span class="raw-badge">PDF Crudo</span>` : ""}
        </div>
        <span class="list-work-subtitle">${s.composer} — <em>${s.subtitle}</em></span>
      </div>

      <div class="list-col-meta">
        <span class="list-meta-pill">${s.period}</span>
        <span class="list-meta-pill">${s.group}</span>
        <span class="list-meta-pages">${s.pages}</span>
      </div>

      <div class="list-col-actions" onclick="event.stopPropagation()">
        <button class="mini-action-btn" onclick="openAiForWork(${s.id})" title="Consultar Historia, Teoría y YouTube">✦</button>
        <button class="mini-action-btn" onclick="openPdfModal('${safeTitle}')" title="Taller PDF">✂</button>
        <button class="mini-action-btn" onclick="switchMode('concert')" title="Abrir en Concierto">◉</button>
      </div>
    </div>
  `;
}

// ==========================================================================
// MODO IA MUSICOLÓGICO (HISTORIA, TEORÍA, INTERPRETACIÓN Y LINKS YOUTUBE/WEB)
// ==========================================================================

function populateAiWorkSelector() {
  const sel = document.getElementById("aiWorkSelector");
  if (!sel) return;
  sel.innerHTML = scores
    .map((s) => `<option value="${s.id}">${s.composer} — ${s.clean || s.title}</option>`)
    .join("");
}

function openAiForWork(scoreId) {
  const aiMenuBtn = document.querySelector('.dd-item[data-cls="ai-mode"]');
  selectClassification("ai-mode", "✦ Modo IA Musical", aiMenuBtn);
  const sel = document.getElementById("aiWorkSelector");
  if (sel) sel.value = String(scoreId);
  renderAiMusicologyView(scoreId);
}

function renderAiMusicologyView(scoreId) {
  const work = scores.find((s) => s.id === Number(scoreId)) || scores[0];
  const grid = document.getElementById("aiKnowledgeGrid");
  document.getElementById("aiCustomAnswerBox").classList.add("hidden");

  const linksHtml = work.aiData.links
    .map(
      (lnk) => `
      <a href="${lnk.url}" target="_blank" rel="noopener noreferrer" class="ai-ext-link">
        <span>${lnk.label}</span>
        <span class="ext-arrow">↗</span>
      </a>
    `
    )
    .join("");

  grid.innerHTML = `
    <article class="ai-info-card">
      <div class="ai-card-head">
        <span class="ai-card-tag">🏛️ CONTEXTO HISTÓRICO &amp; FUENTES</span>
        <h4>${work.clean || work.title}</h4>
      </div>
      <p>${work.aiData.history}</p>
      <div class="ai-card-meta">
        <span><strong>Compositor:</strong> ${work.composer}</span>
        <span><strong>Periodo:</strong> ${work.period}</span>
      </div>
    </article>

    <article class="ai-info-card">
      <div class="ai-card-head">
        <span class="ai-card-tag">🎼 ANÁLISIS TEÓRICO &amp; ESTRUCTURAL</span>
        <h4>Forma, Armonía y Textura</h4>
      </div>
      <p>${work.aiData.theory}</p>
      <div class="ai-card-meta">
        <span><strong>Dotación:</strong> ${work.group}</span>
        <span><strong>Afinación:</strong> ${work.tuning}</span>
      </div>
    </article>

    <article class="ai-info-card">
      <div class="ai-card-head">
        <span class="ai-card-tag">🎸 CRITERIOS INTERPRETATIVOS &amp; TÉCNICOS</span>
        <h4>Sugerencias de Estudio y Escenario</h4>
      </div>
      <p>${work.aiData.performance}</p>
      <div class="ai-card-actions">
        <button class="btn-open-study-from-ai" onclick="openScoreInStudy('${(work.clean || work.title).replace(/'/g, "")}', '${work.composer}')">
          ✎ Abrir partitura en Modo Estudio para anotar
        </button>
      </div>
    </article>

    <article class="ai-info-card links-card">
      <div class="ai-card-head">
        <span class="ai-card-tag">▶ INTERPRETACIONES EXISTENTES &amp; RECURSOS WEB</span>
        <h4>Escuchar y Comparar Versiones (YouTube / IMSLP)</h4>
      </div>
      <div class="ai-links-list">
        ${linksHtml}
      </div>
    </article>
  `;
}

function askCustomAiQuestion() {
  const input = document.getElementById("aiCustomPrompt");
  const q = (input.value || "").trim();
  if (!q) return;
  const sel = document.getElementById("aiWorkSelector");
  const work = scores.find((s) => s.id === Number(sel.value)) || scores[0];

  const box = document.getElementById("aiCustomAnswerBox");
  box.classList.remove("hidden");
  box.innerHTML = `
    <div class="ai-answer-header">
      <strong>✦ Respuesta Musicológica IA sobre ${work.clean || work.title}:</strong>
      <span>Consulta: "${q}"</span>
    </div>
    <p>
      En <em>${work.clean || work.title}</em> (${work.composer}), se recomienda priorizar la conducción de las voces internas manteniendo el peso armónico del bajo (${work.tuning}). Puedes comparar cómo abordan este pasaje distintas escuelas interpretativas en los enlaces directos a YouTube de la tarjeta inferior o abrir la partitura en el <strong>Modo Estudio</strong> para estampar las digitaciones y marcas de agógica correspondientes.
    </p>
  `;
  input.value = "";
}

function openScoreInStudy(title, composer) {
  document.getElementById("hudPieceTitle").textContent = `${composer} — ${title}`;
  switchMode("study");
}

function cleanLibraryWithAI() {
  scores.forEach((s) => {
    if (s.raw && s.clean) {
      s.title = s.clean;
      s.raw = false;
    }
  });
  document.getElementById("classifyMenu").classList.add("hidden");
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

// ==========================================================================
// GENERADOR DE PARTITURA VERTICAL EN HOJA PARADA (6 SISTEMAS)
// ==========================================================================
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

// 2. MODO ESTUDIO
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

// 4. MODO EDITOR
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

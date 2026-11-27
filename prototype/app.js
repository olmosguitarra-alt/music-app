/* ==========================================================================
   CONCEPTS × STAFFPAD × LINEARITY CURVE ENGINE (v5)
   PILOTO CON PDFs REALES EN TABLET/CELULAR (PDF.js + pdf-lib + IndexedDB)
   ========================================================================== */

// Configurar worker de PDF.js
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

// Catálogo base + tus PDFs reales cargados de IndexedDB
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
    pageCount: 10,
    tuning: "6ª en Re",
    raw: false,
    isRealPdf: false,
    aiData: {
      history: "Compuesta hacia 1724 en Leipzig originalmente para flauta travesera y bajo continuo. La transcripción para guitarra clásica de David Russell traslada con maestría la escritura contrapuntística del continuo y la línea solista a un solo instrumento.",
      theory: "Estructurada en 4 movimientos (Sonata da chiesa: Adagio ma non tanto – Allegro – Andante – Allegro). El primer movimiento en Mi menor emplea un motivo de siciliana ornamentada con un bajo caminante continuo.",
      performance: "Cuidar la independencia de planos sonoros entre el pulgar (que asume el rol del violoncello/continuo) y los dedos i-m-a. En el Adagio inicial, las apoyaturas deben resolverse dentro del pulso.",
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
    pageCount: 14,
    tuning: "Estándar",
    raw: true,
    isRealPdf: false,
    aiData: {
      history: "Las Suites Inglesas (BWV 806–811) fueron compuestas en Weimar alrededor de 1715. Representan la síntesis de Bach entre la danza cortesana francesa y el concierto italiano.",
      theory: "El Preludio está construido en una forma Da Capo monumental (A–B–A) impulsada por un motivo motor en semicorcheas.",
      performance: "Mantener la claridad articulatoria y reservar peso dinámico para las cadencias estructurales.",
      links: [
        { label: "▶ YouTube: Suite Inglesa BWV 807 en Guitarra / Dúo", url: "https://www.youtube.com/results?search_query=Bach+BWV+807+guitar" },
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
    pageCount: 18,
    tuning: "Estándar",
    raw: true,
    isRealPdf: false,
    aiData: {
      history: "Dedicado a Andrés Segovia y estrenado en Montevideo en 1941 bajo la batuta del propio Manuel M. Ponce. Obra cumbre del repertorio concertante mexicano.",
      theory: "El I. Allegretto combina la forma sonata con giros modales e impresionistas y ritmos de raíz hispanoamericana.",
      performance: "Obra emblemática en la trayectoria de Daniel Olmos. Cuidar la proyección tímbrica en los diálogos con maderas y cuerdas.",
      links: [
        { label: "▶ YouTube: Manuel M. Ponce — Concierto del Sur", url: "https://www.youtube.com/results?search_query=Manuel+M+Ponce+Concierto+del+Sur+guitarra" }
      ]
    }
  }
];

let libraryViewMode = "folio";
let currentClassification = "all";
let activeScore = scores[0];
let activeWorkshopScoreId = null;
let selectedWorkshopPages = new Set([1, 2]);
let currentPdfDocInstance = null;
let pageNum = 1;

// ==========================================================================
// BASE DE DATOS PERSISTENTE EN TABLET (IndexedDB para PDFs Reales + Anotaciones Ilimitadas)
// ==========================================================================
const DB_NAME = "AtrilRealPdfPilotDB";
const STORE_NAME = "realPdfs";
const ANNOTATIONS_IDB_STORE = "studyAnnotations";

function openPilotDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(ANNOTATIONS_IDB_STORE)) {
        db.createObjectStore(ANNOTATIONS_IDB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveRealPdfToDb(scoreObj) {
  try {
    const db = await openPilotDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(scoreObj);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("IndexedDB save warning:", err);
  }
}

async function loadSavedPdfsFromDb() {
  try {
    const db = await openPilotDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => {
        const saved = req.result || [];
        saved.forEach((item) => {
          if (!scores.some((s) => s.id === item.id)) {
            scores.unshift(item);
          }
        });
        resolve(saved.length);
      };
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

async function deleteRealPdfFromDb(scoreId) {
  try {
    const db = await openPilotDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(Number(scoreId));
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    return;
  }
}

async function deleteScoreFromLibrary(scoreId) {
  const id = Number(scoreId);
  const idx = scores.findIndex((s) => s.id === id);
  if (idx === -1) return;
  const target = scores[idx];
  const label = target.clean || target.title;
  if (!window.confirm(`¿Eliminar "${label}" de tu biblioteca?`)) return;

  scores.splice(idx, 1);
  if (target.isRealPdf) {
    await deleteRealPdfFromDb(id);
  }
  favoriteScoreIds.delete(id);
  saveFavoritesState();

  programsState.list.forEach((p) => {
    p.scoreIds = p.scoreIds.filter((sid) => sid !== id);
  });
  saveProgramsState();

  renderLibrary();
  renderSetlistDrawer();
}

// ==========================================================================
// IMPORTADOR INTELIGENTE DE PDFs REALES DESDE LA TABLET O CELULAR
// ==========================================================================
function inferMusicMetadataFromFilename(rawFilename) {
  const nameNoExt = rawFilename.replace(/\.pdf$/i, "");
  const cleanStr = nameNoExt
    .replace(/^\(Partition.*?\)\s*-?\s*/i, "")
    .replace(/\[.*?free-scores.*?\]/gi, "")
    .replace(/\b(?:IMSLP|PMLP)\d+[-_]?/gi, "")
    .replace(/^[!0-9_\-\s]+/, "")
    .replace(/[_]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const lower = rawFilename.toLowerCase();
  let composer = "Compositor por clasificar";
  let period = "Siglo XX";
  let group = "Guitarra Sola";

  const catalogRules = [
    { match: ["bach", "bwv"], composer: "J. S. Bach (1685–1750)", period: "Barroco" },
    { match: ["weiss"], composer: "Sylvius Leopold Weiss (1687–1750)", period: "Barroco" },
    { match: ["scarlatti"], composer: "Domenico Scarlatti (1685–1757)", period: "Barroco" },
    { match: ["vivaldi"], composer: "Antonio Vivaldi (1678–1741)", period: "Barroco" },
    { match: ["milan", "milán", "narvaez", "narváez", "mudarra", "dowland"], composer: "Repertorio Renacentista", period: "Renacimiento" },
    { match: ["sor", "giuliani", "aguado", "carcassi", "coste", "paganini"], composer: "Fernando Sor / Escuela Clásica", period: "Clasicismo" },
    { match: ["tarrega", "tárrega", "albeniz", "albéniz", "granados", "llobet", "barrios", "mertz"], composer: "Francisco Tárrega / Romanticismo", period: "Romanticismo" },
    { match: ["ponce"], composer: "Manuel M. Ponce (1882–1948)", period: "Siglo XX" },
    { match: ["brouwer"], composer: "Leo Brouwer (n. 1939)", period: "Siglo XX" },
    { match: ["villa-lobos", "villalobos"], composer: "Heitor Villa-Lobos (1887–1959)", period: "Siglo XX" },
    { match: ["piazzolla"], composer: "Astor Piazzolla (1921–1992)", period: "Siglo XX" },
    { match: ["rodrigo", "aranjuez"], composer: "Joaquín Rodrigo (1901–1999)", period: "Siglo XX" },
    { match: ["turina", "torroba", "castelnuovo", "tansman", "takemitsu", "dyens"], composer: "Repertorio Siglo XX", period: "Siglo XX" }
  ];

  for (const rule of catalogRules) {
    if (rule.match.some((kw) => lower.includes(kw))) {
      composer = rule.composer;
      period = rule.period;
      break;
    }
  }

  if (lower.includes("duo") || lower.includes("dúo") || lower.includes("flute") || lower.includes("flauta") || lower.includes("cuarteto") || lower.includes("chamber")) {
    group = "Dúo / Cámara";
  } else if (lower.includes("concierto") || lower.includes("concerto") || lower.includes("orquesta") || lower.includes("orchestra")) {
    group = "Guitarra y Orquesta";
  }

  const finalTitle = cleanStr.length > 2 ? cleanStr : nameNoExt;
  const searchEncoded = encodeURIComponent(`${composer.split("(")[0]} ${finalTitle} guitar`);

  return {
    title: finalTitle,
    composer,
    period,
    group,
    aiData: {
      history: `Partitura PDF importada directamente de tu tablet (${rawFilename}). Clasificada automáticamente en el periodo ${period} bajo la autoría asociada a ${composer}.`,
      theory: `Obra catalogada para dotación de ${group}. Puedes utilizar Editar PDF para extraer movimientos individuales o limpiar páginas sobrantes.`,
      performance: `Abre esta partitura tocando su tarjeta para estudiarla en Hoja Parada a pantalla completa, escribir digitaciones con tu lápiz óptico y convertirlas a letra de molde.`,
      links: [
        { label: `▶ YouTube: Buscar interpretaciones de "${finalTitle}"`, url: `https://www.youtube.com/results?search_query=${searchEncoded}` },
        { label: `🏛️ IMSLP / Web: Buscar ediciones históricas de "${finalTitle}"`, url: `https://www.google.com/search?q=IMSLP+${searchEncoded}` }
      ]
    }
  };
}

async function generatePdfThumbnailDataUrl(pdfBytes) {
  if (!window.pdfjsLib) return null;
  try {
    const loadingTask = window.pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 0.6 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
    return {
      thumbUrl: canvas.toDataURL("image/jpeg", 0.82),
      numPages: pdfDoc.numPages
    };
  } catch (e) {
    console.warn("Error renderizando miniatura PDF:", e);
    return null;
  }
}

async function handleRealPdfUpload(fileList) {
  if (!fileList || fileList.length === 0) return;

  startPdfLoadingAnimation();
  try {
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const meta = inferMusicMetadataFromFilename(file.name);
      const previewInfo = await generatePdfThumbnailDataUrl(uint8);
      const numPages = previewInfo ? previewInfo.numPages : 1;

      const isMessyName = /(_|IMSLP|PMLP|^\d{3,}|partition|free-scores)/i.test(file.name);
      const newScore = {
        id: Date.now() + i,
        title: isMessyName ? file.name.replace(/\.pdf$/i, "") : meta.title,
        clean: meta.title,
        rawFilename: file.name,
        subtitle: `Archivo PDF de tu Tablet (${file.name})`,
        composer: meta.composer,
        period: meta.period,
        group: meta.group,
        program: "Biblioteca Piloto Tablet",
        pages: `${numPages} ${numPages === 1 ? "pág." : "págs."}`,
        pageCount: numPages,
        tuning: "PDF Real",
        raw: isMessyName,
        isRealPdf: true,
        pdfBytes: uint8,
        thumbDataUrl: previewInfo ? previewInfo.thumbUrl : null,
        aiData: meta.aiData
      };

      scores.unshift(newScore);
      await saveRealPdfToDb(newScore);
    }

    document.getElementById("realPdfFileInput").value = "";
    const folderInp = document.getElementById("realPdfFolderInput");
    if (folderInp) folderInp.value = "";
    renderLibrary();
    renderSetlistDrawer();
  } finally {
    stopPdfLoadingAnimation();
  }
}

let pdfLoadDelayTimer = null;
let pdfLoadAnimInterval = null;
let pdfLoadFadeTimer = null;

function buildFullBodyThinkingBachSvg(frame = 0) {
  const head = [
    "....WWWWWWWW....",
    "..WWWWWWWWWWWW..",
    ".WWWWGGGGGGWWWW.",
    ".WWWGGGGGGGGWWW.",
    "WWWWGSSSSSSGWWWW",
    "WWWGSSSSSSSSGWWW",
    "WWWGSEESSSSEESWW",
    "WWWGSSSSSSSSGWWW",
    "WWGGSSSDDSSSGGWW",
    "WWGGSSSMMMSSGGWW",
    "WWWGGSSSSSSGGWWW",
    ".WWW.RRRRRR.WWW."
  ];

  const body = [
    "..C..RRRRRR.....",
    ".CS.CCRRRRCC....",
    ".C.CCCRBBRCCC...",
    "...CCCRBBRCCC...",
    "...CCCRRRRCCCC..",
    "...CCCCCCCCCCS..",
    "...CCCCCCCCCC...",
    "....CCCCCCCC....",
    "....KKK..KKK....",
    "....KKK..KKK....",
    "....KKK..KKK....",
    "...EEEE..EEEE..."
  ];

  // Frame 0: cabeza normal, mano rascando la peluca arriba
  // Frame 1: cabeza baja 1px (asintiendo suavemente), mano rascando ligeramente desplazada
  const grid = Array(25).fill("................");
  const headY = frame === 1 ? 1 : 0;
  for (let y = 0; y < head.length; y++) {
    grid[y + headY] = head[y];
  }
  for (let y = 0; y < body.length; y++) {
    grid[y + 12] = body[y];
  }

  // Brazo izquierdo levantado rascándose la peluca
  const setPx = (x, y, ch) => {
    if (y < 0 || y >= grid.length || x < 0 || x >= 16) return;
    const arr = grid[y].split("");
    arr[x] = ch;
    grid[y] = arr.join("");
  };

  if (frame === 0) {
    setPx(1, 3, "S"); setPx(2, 3, "S");
    setPx(1, 4, "C"); setPx(1, 5, "C"); setPx(1, 6, "C");
    setPx(1, 7, "C"); setPx(1, 8, "C"); setPx(1, 9, "C");
    setPx(2, 10, "C"); setPx(2, 11, "C");
  } else {
    setPx(2, 3, "S"); setPx(3, 3, "S");
    setPx(1, 5, "C"); setPx(1, 6, "C"); setPx(1, 7, "C");
    setPx(1, 8, "C"); setPx(1, 9, "C"); setPx(1, 10, "C");
    setPx(2, 11, "C");
  }

  const palette = {
    W: "#f8fafc",
    G: "#cbd5e1",
    S: "#f3c69f",
    D: "#d99f72",
    E: "#1e1b18",
    M: "#9a5b42",
    R: "#ffffff",
    C: "#7c2d12",
    B: "#facc15",
    K: "#292524"
  };

  let rects = "";
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < 16; x++) {
      const ch = row[x];
      if (ch !== "." && palette[ch]) {
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[ch]}" />`;
      }
    }
  }
  return `<svg viewBox="0 0 16 25" width="100%" height="100%" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

function startPdfLoadingAnimation() {
  clearTimeout(pdfLoadDelayTimer);
  clearTimeout(pdfLoadFadeTimer);
  clearInterval(pdfLoadAnimInterval);

  pdfLoadDelayTimer = setTimeout(() => {
    const overlay = document.getElementById("pdfLoadingOverlay");
    const sprite = document.getElementById("pdfLoadingSprite");
    if (!overlay || !sprite) return;
    let frame = 0;
    sprite.innerHTML = buildFullBodyThinkingBachSvg(0);
    overlay.classList.remove("hidden", "is-fading-out");
    pdfLoadAnimInterval = setInterval(() => {
      frame = frame === 0 ? 1 : 0;
      sprite.innerHTML = buildFullBodyThinkingBachSvg(frame);
    }, 320);
  }, 2000);
}

function stopPdfLoadingAnimation() {
  clearTimeout(pdfLoadDelayTimer);
  pdfLoadDelayTimer = null;
  clearInterval(pdfLoadAnimInterval);
  pdfLoadAnimInterval = null;

  const overlay = document.getElementById("pdfLoadingOverlay");
  if (!overlay || overlay.classList.contains("hidden")) return;
  overlay.classList.add("is-fading-out");
  pdfLoadFadeTimer = setTimeout(() => {
    overlay.classList.add("hidden");
    overlay.classList.remove("is-fading-out");
  }, 220);
}

function showPilotBanner(msg) {
  const banner = document.getElementById("pilotStatusBanner");
  if (!banner) return;
  banner.textContent = msg;
  banner.classList.remove("hidden");
  setTimeout(() => banner.classList.add("hidden"), 6500);
}

// ==========================================================================
// RENDERIZADO DE PÁGINAS EN EL VISOR INTELIGENTE UNIFICADO (ENSAYO / CONCIERTO)
// ==========================================================================
let performanceMode = "study"; // 'study' | 'concert'
const LAST_SESSION_STORAGE_KEY = "cadenza_last_study_session_v1";

function saveLastStudySessionState() {
  if (!activeScore) return;
  try {
    const payload = {
      scoreId: activeScore.id,
      pageNum: pageNum || 1,
      totalPages: activeScore.pageCount || 10,
      bpm: typeof metroBpm === "number" ? metroBpm : 76,
      performanceMode: performanceMode || "study",
      updatedAt: Date.now()
    };
    localStorage.setItem(LAST_SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch (_) {}
}

function loadLastStudySessionState() {
  try {
    const raw = localStorage.getItem(LAST_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.scoreId) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

async function resumeLastStudySession(scoreId, targetPage = 1) {
  await openScoreById(scoreId, "study", targetPage);
}

function renderContinueStudyingBanner() {
  const banner = document.getElementById("continueStudyingBanner");
  if (!banner) return;

  const session = loadLastStudySessionState();
  let targetScore = session ? scores.find((s) => s.id === Number(session.scoreId)) : null;
  let targetPage = session ? Math.max(1, Number(session.pageNum) || 1) : 1;
  let targetBpm = session && session.bpm ? Number(session.bpm) : null;

  if (!targetScore) {
    const recentIds = Object.keys(recentScoreTimes || {})
      .map(Number)
      .sort((a, b) => (recentScoreTimes[b] || 0) - (recentScoreTimes[a] || 0));
    if (recentIds.length > 0) {
      targetScore = scores.find((s) => s.id === recentIds[0]);
    }
  }

  if (!targetScore || currentClassification !== "all") {
    banner.classList.add("hidden");
    return;
  }

  const totalPages = Math.max(1, targetScore.pageCount || 10);
  targetPage = Math.min(totalPages, targetPage);
  const title = targetScore.clean || targetScore.title;
  const composer = (targetScore.composer || "").split("(")[0].trim();
  const bpmBadge = targetBpm ? `<span class="cs-meta-pill">♩ = ${targetBpm} BPM</span>` : "";

  banner.innerHTML = `
    <div class="cs-banner-left">
      <span class="cs-eyebrow">CONTINUAR ESTUDIANDO</span>
      <div class="cs-work-row">
        <strong class="cs-work-title">${title}</strong>
        <span class="cs-work-composer">${composer}</span>
      </div>
      <div class="cs-meta-row">
        <span class="cs-meta-pill">Pág. ${targetPage} de ${totalPages}</span>
        ${bpmBadge}
        <span class="cs-meta-pill subtle">${targetScore.period || "Clásico"} • ${targetScore.group || "Solo"}</span>
      </div>
    </div>
    <div class="cs-banner-actions">
      <button type="button" class="cs-resume-btn" onclick="resumeLastStudySession(${targetScore.id}, ${targetPage})">
        <svg viewBox="0 0 24 24" class="v-ico"><polygon points="6 3 20 12 6 21 6 3"/></svg>
        <span>Continuar en Pág. ${targetPage}</span>
      </button>
    </div>
  `;
  banner.classList.remove("hidden");
}

async function openScoreById(scoreId, targetMode = "study", initialPage = 1) {
  const found = scores.find((s) => s.id === Number(scoreId));
  if (!found) return;
  activeScore = found;
  pageNum = Math.max(1, parseInt(initialPage, 10) || 1);
  markScoreRecent(found.id);

  const displayTitle = found.clean || found.title;
  const shortComp = (found.composer || "").split("(")[0].trim();
  const hudTitle = document.getElementById("hudPieceTitle");
  if (hudTitle) hudTitle.textContent = `${shortComp} — ${displayTitle}`;

  const topTitle = document.getElementById("performerTopTitle");
  const topComp = document.getElementById("performerTopComposer");
  const headTitle = document.getElementById("performerTitleHeading");
  const headSub = document.getElementById("performerSubHeading");
  if (topTitle) topTitle.textContent = displayTitle;
  if (topComp) topComp.textContent = shortComp || found.composer || "";
  if (headTitle) headTitle.textContent = displayTitle;
  if (headSub) headSub.textContent = found.composer || "";

  switchMode("performer");
  setPerformanceMode(targetMode === "concert" ? "concert" : "study", { skipRender: true });
  loadMetronomePresetForScore(found.id);

  if (found.isRealPdf && found.pdfBytes && window.pdfjsLib) {
    const loadingTask = window.pdfjsLib.getDocument({ data: found.pdfBytes.slice(0) });
    currentPdfDocInstance = await loadingTask.promise;
    found.pageCount = currentPdfDocInstance.numPages;
    await renderActiveScorePage();
  } else {
    currentPdfDocInstance = null;
    await renderActiveScorePage();
  }
}

async function renderActiveScorePage() {
  const total = activeScore.pageCount || 10;
  pageNum = Math.max(1, Math.min(total, pageNum));

  const metaRight = document.getElementById("performerMetaRight");
  const footerRight = document.getElementById("performerFooterRight");
  if (metaRight) metaRight.textContent = `Pág. ${pageNum} / ${total}`;
  if (footerRight) footerRight.textContent = `Folio ${pageNum} / ${total}`;

  const pdfCanvas = document.getElementById("performerPdfRenderCanvas");
  const pdfCanvasRight = document.getElementById("performerPdfRenderCanvasRight");
  const svgEl = document.getElementById("performerSvg");
  const svgRightEl = document.getElementById("performerSvgRight");
  const headEl = document.getElementById("performerFolioHeader");

  const isTwoPages = layouts[layoutIdx] === "2 Págs";
  const spreadWrap = document.getElementById("performerSpreadWrap");
  const rightSheet = document.getElementById("performerSheetRight");
  const hasSecondPage = isTwoPages && pageNum + 1 <= total;

  if (spreadWrap && rightSheet) {
    spreadWrap.classList.toggle("two-pages", hasSecondPage);
    rightSheet.classList.toggle("hidden", !hasSecondPage);
    if (hasSecondPage) {
      const rTitle = document.getElementById("performerTitleHeadingRight");
      const rSub = document.getElementById("performerSubRight");
      const rNum = document.getElementById("performerPageNumRight");
      const rFoot = document.getElementById("performerPageFooterRight");
      if (rTitle) rTitle.textContent = activeScore.clean || activeScore.title;
      if (rSub) rSub.textContent = activeScore.composer;
      if (rNum) rNum.textContent = `Pág. ${pageNum + 1} / ${total}`;
      if (rFoot) rFoot.textContent = `Folio ${pageNum + 1} / ${total}`;
    }
  }

  const sheetEl = document.getElementById("performerSheet");
  const isRealPdf = Boolean(activeScore.isRealPdf && currentPdfDocInstance);
  if (sheetEl) sheetEl.classList.toggle("folio-real-pdf-clean", isRealPdf);
  if (rightSheet) rightSheet.classList.toggle("folio-real-pdf-clean", isRealPdf);

  if (isRealPdf) {
    if (svgEl) svgEl.classList.add("hidden");
    if (svgRightEl) svgRightEl.classList.add("hidden");
    if (pdfCanvas) pdfCanvas.classList.remove("hidden");
    if (headEl) headEl.classList.add("compact-pdf-head");

    const page = await currentPdfDocInstance.getPage(pageNum);
    await renderPdfPageToCanvas(page, pdfCanvas, document.getElementById("performerWrap"));

    if (hasSecondPage && pdfCanvasRight) {
      pdfCanvasRight.classList.remove("hidden");
      const page2 = await currentPdfDocInstance.getPage(pageNum + 1);
      await renderPdfPageToCanvas(page2, pdfCanvasRight, document.getElementById("performerWrapRight"));
    } else if (pdfCanvasRight) {
      pdfCanvasRight.classList.add("hidden");
    }

    // Fase C (N1): Pre-renderizado en memoria de la página adyacente (currentPage + 1 / + 2) para cambio instantáneo (< 16ms)
    preRenderAdjacentPdfPages(pageNum, hasSecondPage ? 2 : 1);
  } else {
    if (pdfCanvas) pdfCanvas.classList.add("hidden");
    if (pdfCanvasRight) pdfCanvasRight.classList.add("hidden");
    if (svgEl) {
      svgEl.classList.remove("hidden");
      svgEl.innerHTML = buildPortraitScoreSvg(-1);
    }
    if (svgRightEl) {
      svgRightEl.classList.remove("hidden");
      if (hasSecondPage) svgRightEl.innerHTML = buildPortraitScoreSvg(-1);
    }
    if (headEl) headEl.classList.remove("compact-pdf-head");
  }

  setupStudyCanvas();
  restoreStudyAnnotationsForCurrentPage();
  saveLastStudySessionState();
  if (typeof syncRehearsalContextBanner === "function") syncRehearsalContextBanner();
  if (typeof updateBookmarkButton === "function") updateBookmarkButton();
  if (typeof renderStudyPageScrubber === "function") renderStudyPageScrubber();
}

// Caché en memoria de páginas PDF renderizadas (Fase C - N1)
const pdfRenderedPageCache = new Map();

function getPdfRenderCacheKey(scoreId, pNum, cw, ch, boost) {
  return `${scoreId}:${pNum}:${Math.round(cw / 16)}x${Math.round(ch / 16)}:${boost.toFixed(1)}`;
}

async function renderPdfPageToCanvas(pdfPage, canvas, containerEl, zoomBoost = 1) {
  if (!pdfPage || !canvas || !containerEl) return;
  const cw = Math.max(320, containerEl.clientWidth || 760);
  const ch = Math.max(420, containerEl.clientHeight || 920);
  const boost = Math.max(1, Math.min(2.5, zoomBoost || 1));
  const scoreId = activeScore ? activeScore.id : 0;
  const cacheKey = getPdfRenderCacheKey(scoreId, pdfPage.pageNumber, cw, ch, boost);

  const cachedBitmap = pdfRenderedPageCache.get(cacheKey);
  if (cachedBitmap && cachedBitmap.width > 0 && cachedBitmap.height > 0) {
    canvas.width = cachedBitmap.width;
    canvas.height = cachedBitmap.height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cachedBitmap, 0, 0);
    return;
  }

  const unscaled = pdfPage.getViewport({ scale: 1 });
  const scale = Math.min(cw / unscaled.width, ch / unscaled.height) * (window.devicePixelRatio || 1.5) * boost;
  const viewport = pdfPage.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  await pdfPage.render({ canvasContext: ctx, viewport }).promise;

  try {
    const off = document.createElement("canvas");
    off.width = canvas.width;
    off.height = canvas.height;
    off.getContext("2d").drawImage(canvas, 0, 0);
    if (pdfRenderedPageCache.size > 8) {
      const oldestKey = pdfRenderedPageCache.keys().next().value;
      pdfRenderedPageCache.delete(oldestKey);
    }
    pdfRenderedPageCache.set(cacheKey, off);
  } catch (_) {}
}

function preRenderAdjacentPdfPages(basePage, step = 1) {
  if (!activeScore?.isRealPdf || !currentPdfDocInstance) return;
  const total = currentPdfDocInstance.numPages || 1;
  const nextP = basePage + step;
  if (nextP > total) return;

  setTimeout(async () => {
    try {
      const wrap = document.getElementById("performerWrap");
      if (!wrap) return;
      const cw = Math.max(320, wrap.clientWidth || 760);
      const ch = Math.max(420, wrap.clientHeight || 920);
      const cacheKey = getPdfRenderCacheKey(activeScore.id, nextP, cw, ch, 1);
      if (pdfRenderedPageCache.has(cacheKey)) return;

      const page = await currentPdfDocInstance.getPage(nextP);
      const unscaled = page.getViewport({ scale: 1 });
      const scale = Math.min(cw / unscaled.width, ch / unscaled.height) * (window.devicePixelRatio || 1.5);
      const viewport = page.getViewport({ scale });
      const off = document.createElement("canvas");
      off.width = viewport.width;
      off.height = viewport.height;
      await page.render({ canvasContext: off.getContext("2d"), viewport }).promise;
      if (pdfRenderedPageCache.size > 8) {
        const oldestKey = pdfRenderedPageCache.keys().next().value;
        pdfRenderedPageCache.delete(oldestKey);
      }
      pdfRenderedPageCache.set(cacheKey, off);
    } catch (_) {}
  }, 90);
}

// ==========================================================================
// EDITOR DE COMPOSICIÓN DE PDF (MESA DE TRABAJO / LIGHTBOX GRID CON pdf-lib)
// Flujo No Destructivo: Operaciones en memoria (working state + PDFLib.PDFDocument)
// que solo sobreescriben el PDF original al pulsar "💾 Guardar".
// ==========================================================================
function ensureScorePageItems(s) {
  const count = Math.max(1, s.pageCount || 4);
  if (!Array.isArray(s.pageItems) || s.pageItems.length !== count) {
    s.pageItems = Array.from({ length: count }, (_, idx) => ({
      id: `p-${idx + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind: s.isRealPdf ? "pdf" : "score",
      sourcePage: idx + 1,
      label: s.isRealPdf ? `Página ${idx + 1}` : `Sección ${idx + 1}`,
      rotation: 0
    }));
  }
  return s.pageItems;
}

function invalidateScorePageThumbnails(targetObj) {
  if (!targetObj || !Array.isArray(targetObj.pageItems)) return;
  targetObj.pageItems.forEach((it) => {
    it.thumbUrl = null;
    it.thumbPageIndex = null;
  });
}

let pdfThumbRenderToken = 0;
let pdfWorkshopUndoStack = [];
let pdfToastClearTimer = null;

// Estado en memoria (No Destructivo) de la Mesa de Trabajo
let pdfWorkshopDraft = null;
let pdfWorkingDoc = null; // Instancia de PDFLib.PDFDocument en memoria
let pdfInitialBackup = null; // Snapshot original para "🔄 Revertir" y "← Salir"
let isPdfWorkshopDirty = false;
let isPdfExtractMode = false;
let focusedWorkshopPage = 1;

function formatPdfEditorFilenameTitle(rawTitle) {
  const clean = (rawTitle || "Partitura").trim();
  return /\.pdf$/i.test(clean) ? clean : `${clean}.pdf`;
}

function updatePdfUndoButtonState() {
  const btn = document.getElementById("btnPdfUndo");
  if (!btn) return;
  const hasUndo = pdfWorkshopUndoStack.length > 0;
  btn.disabled = !hasUndo;
  btn.classList.toggle("hidden", !hasUndo);
  if (hasUndo) {
    const last = pdfWorkshopUndoStack[pdfWorkshopUndoStack.length - 1];
    btn.title = `Deshacer: ${last.label} (Ctrl+Z)`;
  } else {
    btn.title = "Deshacer última acción (Ctrl+Z)";
  }

  const revBtn = document.getElementById("btnRevertPdfChanges");
  if (revBtn) {
    revBtn.disabled = !isPdfWorkshopDirty;
  }
}

async function syncWorkingPdfBytesFromDoc() {
  if (!pdfWorkshopDraft) return;
  if (pdfWorkshopDraft.isRealPdf && pdfWorkingDoc) {
    try {
      pdfWorkshopDraft.pdfBytes = await pdfWorkingDoc.save();
    } catch (err) {
      console.warn("Error serializando PDF en memoria:", err);
    }
  }
}

function capturePdfWorkshopSnapshot(label) {
  if (!pdfWorkshopDraft) return null;
  return {
    scoreId: pdfWorkshopDraft.id,
    label: label || "Acción",
    pageItems: pdfWorkshopDraft.pageItems.map((it) => ({ ...it })),
    pageCount: pdfWorkshopDraft.pageCount,
    pages: pdfWorkshopDraft.pages,
    pdfBytes: pdfWorkshopDraft.pdfBytes ? pdfWorkshopDraft.pdfBytes.slice(0) : null,
    selectedPages: [...selectedWorkshopPages],
    focusedPage: focusedWorkshopPage,
    wasDirty: isPdfWorkshopDirty
  };
}

function pushPdfWorkshopUndoState(label) {
  const snap = capturePdfWorkshopSnapshot(label);
  if (!snap) return;
  pdfWorkshopUndoStack.push(snap);
  if (pdfWorkshopUndoStack.length > 25) pdfWorkshopUndoStack.shift();
  isPdfWorkshopDirty = true;
  updatePdfUndoButtonState();
}

async function restoreDraftFromSnapshot(snap) {
  if (!snap || !pdfWorkshopDraft) return;
  pdfWorkshopDraft.pageItems = snap.pageItems.map((it) => ({ ...it }));
  pdfWorkshopDraft.pageCount = snap.pageCount;
  pdfWorkshopDraft.pages = snap.pages;
  pdfWorkshopDraft.pdfBytes = snap.pdfBytes ? snap.pdfBytes.slice(0) : null;

  if (pdfWorkshopDraft.isRealPdf && pdfWorkshopDraft.pdfBytes && window.PDFLib) {
    try {
      pdfWorkingDoc = await window.PDFLib.PDFDocument.load(pdfWorkshopDraft.pdfBytes);
    } catch (err) {
      console.warn("Error recargando PDFLib.PDFDocument desde snapshot:", err);
    }
  } else {
    pdfWorkingDoc = null;
  }

  selectedWorkshopPages = new Set(snap.selectedPages || []);
  focusedWorkshopPage = Math.max(1, Math.min(pdfWorkshopDraft.pageCount, snap.focusedPage || 1));
}

async function undoLastPdfWorkshopAction() {
  if (pdfWorkshopUndoStack.length === 0 || !pdfWorkshopDraft) return;
  const snap = pdfWorkshopUndoStack.pop();
  await restoreDraftFromSnapshot(snap);
  isPdfWorkshopDirty = pdfWorkshopUndoStack.length > 0;
  updatePdfUndoButtonState();
  renderWorkshopPageStrip();
  triggerPdfToast(`Deshecho: ${snap.label}`);
}

async function revertPdfWorkshopToInitial() {
  if (!pdfInitialBackup || !pdfWorkshopDraft) return;
  if (!isPdfWorkshopDirty && pdfWorkshopUndoStack.length === 0) {
    triggerPdfToast("El documento ya está en su estado original");
    return;
  }
  await restoreDraftFromSnapshot(pdfInitialBackup);
  pdfWorkshopUndoStack = [];
  isPdfWorkshopDirty = false;
  if (isPdfExtractMode) togglePdfExtractMode(false);
  updatePdfUndoButtonState();
  renderWorkshopPageStrip();
  triggerPdfToast("Documento restaurado al estado inicial");
}

document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("pdfModal");
  if (!modal || modal.classList.contains("hidden")) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    e.preventDefault();
    undoLastPdfWorkshopAction();
  } else if (e.key === "Escape") {
    const metaModal = document.getElementById("pdfMetadataModalBackdrop");
    const extModal = document.getElementById("pdfExtractModalBackdrop");
    const exitModal = document.getElementById("pdfExitConfirmBackdrop");
    if (metaModal && !metaModal.classList.contains("hidden")) {
      closePdfMetadataModal();
      return;
    }
    if (extModal && !extModal.classList.contains("hidden")) {
      closeExtractNewPdfModal();
      return;
    }
    if (exitModal && !exitModal.classList.contains("hidden")) {
      closePdfExitConfirm();
      return;
    }
    if (isPdfExtractMode) {
      togglePdfExtractMode(false);
      return;
    }
  }
});

async function hydrateWorkshopPdfPageThumbnails() {
  const draft = pdfWorkshopDraft;
  if (!draft || !draft.isRealPdf || !draft.pdfBytes || !window.pdfjsLib) return;
  const items = draft.pageItems || [];
  const myToken = ++pdfThumbRenderToken;

  try {
    const loadingTask = window.pdfjsLib.getDocument({ data: draft.pdfBytes.slice(0) });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    for (let p = 1; p <= Math.min(items.length, numPages); p++) {
      if (myToken !== pdfThumbRenderToken || activeWorkshopScoreId !== draft.id) return;
      const item = items[p - 1];
      if (!item || item.kind === "blank") continue;
      if (!item.thumbUrl) {
        const page = await pdfDoc.getPage(p);
        const viewport = page.getViewport({ scale: 0.65 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport }).promise;
        item.thumbUrl = canvas.toDataURL("image/jpeg", 0.86);
        item.thumbPageIndex = p;
      }
      const imgEl = document.querySelector(`#workshopPagesStrip img[data-pdf-page-img="${p}"]`);
      if (imgEl && item.thumbUrl) {
        imgEl.setAttribute("src", item.thumbUrl);
        imgEl.classList.remove("is-loading-thumb");
      }
    }
  } catch (err) {
    console.warn("Error generando miniaturas por página del PDF:", err);
  }
}

function updatePdfWorkshopHeaderCounts() {
  const total = pdfWorkshopDraft ? Math.max(1, pdfWorkshopDraft.pageCount || 1) : 0;
  const badge = document.getElementById("pdfModalPageCountBadge");
  if (badge) badge.textContent = `${total} ${total === 1 ? "pág." : "págs."}`;

  const createBtn = document.getElementById("btnCreateExtractedPdf");
  const createLbl = document.getElementById("lblCreateExtractedPdf");
  const selCount = selectedWorkshopPages.size;
  if (createLbl) {
    createLbl.textContent = `Crear PDF (${selCount})`;
  }
  if (createBtn) {
    createBtn.disabled = selCount === 0;
  }
}

async function openPdfModalById(scoreId) {
  const s = scores.find((item) => Number(item.id) === Number(scoreId));
  if (!s) return;
  closeWorkActionsMenu();
  activeWorkshopScoreId = s.id;
  const baseItems = ensureScorePageItems(s);

  // Construimos copia de trabajo en memoria (Flujo No Destructivo)
  pdfWorkshopDraft = {
    id: s.id,
    title: s.clean || s.title || "Partitura",
    composer: s.composer || "",
    period: s.period || "",
    group: s.group || "",
    tuning: s.tuning || "",
    isRealPdf: Boolean(s.isRealPdf && s.pdfBytes),
    pdfBytes: s.pdfBytes ? s.pdfBytes.slice(0) : null,
    thumbDataUrl: s.thumbDataUrl || null,
    pageCount: baseItems.length,
    pages: `${baseItems.length} págs.`,
    pageItems: baseItems.map((it) => ({ ...it }))
  };

  pdfWorkingDoc = null;

  document.getElementById("modalScoreTitle").textContent = formatPdfEditorFilenameTitle(pdfWorkshopDraft.title);
  const wmTitle = document.getElementById("wmTitleInput");
  const wmComp = document.getElementById("wmComposerInput");
  const wmPer = document.getElementById("wmPeriodInput");
  const wmGrp = document.getElementById("wmGroupInput");
  if (wmTitle) wmTitle.value = pdfWorkshopDraft.title;
  if (wmComp) wmComp.value = pdfWorkshopDraft.composer;
  if (wmPer) wmPer.value = pdfWorkshopDraft.period;
  if (wmGrp) wmGrp.value = pdfWorkshopDraft.group;

  const toastEl = document.getElementById("pdfToast");
  if (toastEl) {
    toastEl.textContent = "";
    toastEl.classList.remove("is-visible");
  }

  closePdfMetadataModal();
  closeExtractNewPdfModal();
  closePdfExitConfirm();

  isPdfExtractMode = false;
  selectedWorkshopPages = new Set();
  focusedWorkshopPage = 1;
  isPdfWorkshopDirty = false;
  pdfWorkshopUndoStack = [];
  pdfInitialBackup = capturePdfWorkshopSnapshot("Estado inicial");

  syncExtractModeBarsUI();
  updatePdfUndoButtonState();
  renderWorkshopPageStrip();

  // Abrimos el modal al instante (sin bloquear la respuesta táctil en celular)
  document.getElementById("pdfModal").classList.remove("hidden");

  // Cargamos la instancia PDFLib.PDFDocument en segundo plano
  if (pdfWorkshopDraft.isRealPdf && pdfWorkshopDraft.pdfBytes && window.PDFLib) {
    try {
      pdfWorkingDoc = await window.PDFLib.PDFDocument.load(pdfWorkshopDraft.pdfBytes);
    } catch (err) {
      console.warn("No se pudo cargar instancia PDFLib.PDFDocument inicial:", err);
    }
  }
}

const SCORES_META_STORAGE_KEY = "cadenza_scores_metadata_v1";

function saveScoreMetadataOverride(scoreObj) {
  if (!scoreObj || scoreObj.id == null) return;
  try {
    const map = JSON.parse(localStorage.getItem(SCORES_META_STORAGE_KEY) || "{}");
    map[String(scoreObj.id)] = {
      title: scoreObj.title || "",
      clean: scoreObj.clean || scoreObj.title || "",
      composer: scoreObj.composer || "",
      period: scoreObj.period || "",
      group: scoreObj.group || "",
      ensemble: scoreObj.ensemble || scoreObj.group || "",
      studyStatus: scoreObj.studyStatus || ""
    };
    localStorage.setItem(SCORES_META_STORAGE_KEY, JSON.stringify(map));
  } catch (_) {}
}

function loadScoreMetadataOverrides() {
  try {
    const map = JSON.parse(localStorage.getItem(SCORES_META_STORAGE_KEY) || "{}");
    if (!map || typeof map !== "object") return;
    scores.forEach((s) => {
      const ov = map[String(s.id)];
      if (!ov) return;
      if (ov.title) {
        s.title = ov.title;
        s.clean = ov.clean || ov.title;
      }
      if (typeof ov.composer === "string") s.composer = ov.composer;
      if (typeof ov.period === "string") s.period = ov.period;
      if (typeof ov.group === "string" || typeof ov.ensemble === "string") {
        const ens = ov.ensemble || ov.group || "";
        s.group = ens;
        s.ensemble = ens;
      }
      if (typeof ov.studyStatus === "string") {
        s.studyStatus = ov.studyStatus;
      }
      s.raw = false;
    });
  } catch (_) {}
}

function syncActiveReaderHeadersForScore(s) {
  if (!s || typeof activeScore === "undefined" || !activeScore || activeScore.id !== s.id) return;
  activeScore = s;
  const displayTitle = s.clean || s.title;
  const shortComp = (s.composer || "").split("(")[0].trim();
  const hudTitle = document.getElementById("hudPieceTitle");
  const topTitle = document.getElementById("performerTopTitle");
  const topComp = document.getElementById("performerTopComposer");
  const perfHead = document.getElementById("performerTitleHeading");
  const perfSub = document.getElementById("performerSubHeading");
  if (hudTitle) hudTitle.textContent = shortComp ? `${shortComp} — ${displayTitle}` : displayTitle;
  if (topTitle) topTitle.textContent = displayTitle;
  if (topComp) topComp.textContent = shortComp || s.composer || "";
  if (perfHead) perfHead.textContent = displayTitle;
  if (perfSub) perfSub.textContent = s.composer || "";
}

function openPdfMetadataModal(e) {
  if (e) e.stopPropagation();
  const backdrop = document.getElementById("pdfMetadataModalBackdrop");
  if (!backdrop || !pdfWorkshopDraft) return;
  const wmTitle = document.getElementById("wmTitleInput");
  const wmComp = document.getElementById("wmComposerInput");
  const wmPer = document.getElementById("wmPeriodInput");
  const wmGrp = document.getElementById("wmGroupInput");
  const wmStatus = document.getElementById("wmStudyStatusSelect");
  if (wmTitle) wmTitle.value = pdfWorkshopDraft.title || "";
  if (wmComp) wmComp.value = pdfWorkshopDraft.composer || "";
  if (wmPer) wmPer.value = pdfWorkshopDraft.period || "";
  if (wmGrp) wmGrp.value = pdfWorkshopDraft.group || pdfWorkshopDraft.ensemble || "";
  if (wmStatus) wmStatus.value = pdfWorkshopDraft.studyStatus || "";
  backdrop.classList.remove("hidden");
  setTimeout(() => {
    if (wmTitle) {
      wmTitle.focus();
      wmTitle.select();
    }
  }, 40);
}

function closePdfMetadataModal() {
  const backdrop = document.getElementById("pdfMetadataModalBackdrop");
  if (backdrop) backdrop.classList.add("hidden");
}

function togglePdfMetaPopover(e) {
  const backdrop = document.getElementById("pdfMetadataModalBackdrop");
  if (backdrop && backdrop.classList.contains("hidden")) {
    openPdfMetadataModal(e);
  } else {
    closePdfMetadataModal();
  }
}

async function applyPdfMetadataChanges() {
  const draft = pdfWorkshopDraft;
  if (!draft) return;

  const rawTitle = (document.getElementById("wmTitleInput")?.value || "").trim();
  const titulo = rawTitle.replace(/\.pdf$/i, "").trim() || draft.title || "Partitura";
  const compositor = (document.getElementById("wmComposerInput")?.value || "").trim();
  const periodo = (document.getElementById("wmPeriodInput")?.value || "").trim();
  const dotacion = (document.getElementById("wmGroupInput")?.value || "").trim();
  const studyStatus = (document.getElementById("wmStudyStatusSelect")?.value || "").trim();

  draft.title = titulo;
  draft.composer = compositor;
  draft.period = periodo;
  draft.group = dotacion;
  draft.ensemble = dotacion;
  draft.studyStatus = studyStatus;

  const modalTitleEl = document.getElementById("modalScoreTitle");
  if (modalTitleEl) {
    modalTitleEl.textContent = formatPdfEditorFilenameTitle(titulo);
  }

  // 1. Inyectar metadatos internos en el documento PDF mediante pdf-lib
  if (draft.isRealPdf && window.PDFLib) {
    try {
      if (!pdfWorkingDoc && draft.pdfBytes) {
        pdfWorkingDoc = await window.PDFLib.PDFDocument.load(draft.pdfBytes);
      }
      if (pdfWorkingDoc) {
        pdfWorkingDoc.setTitle(titulo);
        pdfWorkingDoc.setAuthor(compositor);
        pdfWorkingDoc.setSubject(periodo);
        pdfWorkingDoc.setKeywords([periodo, dotacion].filter(Boolean));
        await syncWorkingPdfBytesFromDoc();
      }
    } catch (err) {
      console.warn("Error inyectando metadatos en PDFLib.PDFDocument:", err);
    }
  }

  // 2. Actualizar registro en el catálogo activo y persistir en localStorage / IndexedDB
  const s = scores.find((item) => item.id === draft.id);
  if (s) {
    s.title = titulo;
    s.clean = titulo;
    s.composer = compositor;
    s.period = periodo;
    s.group = dotacion;
    s.ensemble = dotacion;
    s.studyStatus = studyStatus;
    s.raw = false;
    if (draft.pdfBytes) {
      s.pdfBytes = draft.pdfBytes.slice(0);
    }
    saveScoreMetadataOverride(s);
    if (s.isRealPdf && s.pdfBytes) {
      await saveRealPdfToDb(s);
    }
    syncActiveReaderHeadersForScore(s);
  }

  // 3 y 4. Recalcular filtros dinámicos de Biblioteca y actualizar Programas / Repertorio
  refreshDynamicLibraryFilters();
  if (typeof renderSetlistDrawer === "function") renderSetlistDrawer();

  closePdfMetadataModal();
  triggerPdfToast("Metadatos actualizados");
}

function syncExtractModeBarsUI() {
  const normalFooter = document.getElementById("pdfNormalFooter");
  const extractFooter = document.getElementById("pdfExtractFooter");
  const strip = document.getElementById("workshopPagesStrip");
  if (normalFooter) normalFooter.classList.toggle("hidden", isPdfExtractMode);
  if (extractFooter) extractFooter.classList.toggle("hidden", !isPdfExtractMode);
  if (strip) strip.classList.toggle("is-extract-mode", isPdfExtractMode);
  updatePdfWorkshopHeaderCounts();
}

function togglePdfExtractMode(enable) {
  isPdfExtractMode = typeof enable === "boolean" ? enable : !isPdfExtractMode;
  selectedWorkshopPages.clear();
  syncExtractModeBarsUI();
  renderWorkshopPageStrip();
}

function renderWorkshopPageStrip() {
  const strip = document.getElementById("workshopPagesStrip");
  const draft = pdfWorkshopDraft;
  if (!strip || !draft) return;
  const items = draft.pageItems || [];
  const total = items.length;
  let html = "";

  const chkIco = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const dupIco = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  const delIco = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  const cleanTitle = draft.title || "Partitura";
  const cleanComp = (draft.composer || "").split("(")[0].trim();

  for (let p = 1; p <= total; p++) {
    const item = items[p - 1];
    const isSel = isPdfExtractMode ? selectedWorkshopPages.has(p) : focusedWorkshopPage === p;
    const isExtractChecked = isPdfExtractMode && selectedWorkshopPages.has(p);
    const isBlank = item.kind === "blank";
    const rot = item.rotation || 0;
    const srcPageNum = item.sourcePage || p;
    const measureStart = (srcPageNum - 1) * 16 + 1;
    const measureEnd = srcPageNum * 16;
    const variantIdx = ((srcPageNum - 1) % 3) + 1;
    const pageThumbSrc =
      item.thumbUrl
        ? item.thumbUrl
        : p === 1 && !item.thumbUrl && draft.thumbDataUrl
        ? draft.thumbDataUrl
        : "";

    const sheetPreviewHtml = isBlank
      ? `
        <div class="folio-preview-sheet pdf-thumb-folio-sheet is-blank-sheet" style="transform: rotate(${rot}deg)">
          <div class="blank-sheet-inner"><span>Hoja en blanco</span></div>
        </div>
      `
      : draft.isRealPdf && draft.pdfBytes
      ? `
        <div class="folio-preview-sheet pdf-thumb-folio-sheet has-real-thumb" style="transform: rotate(${rot}deg)">
          <img data-pdf-page-img="${p}" src="${pageThumbSrc}" alt="Pág ${p}" class="real-pdf-thumb-img ${pageThumbSrc ? "" : "is-loading-thumb"}" />
        </div>
      `
      : srcPageNum === 1
      ? `
        <div class="folio-preview-sheet pdf-thumb-folio-sheet is-top-aligned" data-page-variant="1" style="transform: rotate(${rot}deg)">
          <div class="folio-preview-head">
            <strong>${cleanTitle}</strong>
            <small>${cleanComp} · c. 1–16</small>
          </div>
          <div class="mini-staves">
            <div class="mini-staff-bar"></div>
            <div class="mini-staff-bar"></div>
            <div class="mini-staff-bar"></div>
          </div>
          <div class="folio-preview-foot">
            <span>${draft.tuning || ""}</span>
            <span>Pág ${p}</span>
          </div>
        </div>
      `
      : `
        <div class="folio-preview-sheet pdf-thumb-folio-sheet is-top-aligned is-continuation-page" data-page-variant="${variantIdx}" style="transform: rotate(${rot}deg)">
          <div class="folio-preview-running-top">
            <strong>Pág ${p}</strong>
            <span>c. ${measureStart}–${measureEnd}</span>
          </div>
          <div class="mini-staves">
            <div class="mini-staff-bar"></div>
            <div class="mini-staff-bar"></div>
            <div class="mini-staff-bar"></div>
            <div class="mini-staff-bar"></div>
          </div>
          <div class="folio-preview-foot">
            <span>${cleanTitle}</span>
            <span>Pág ${p}</span>
          </div>
        </div>
      `;

    const topFloatingOverlay = isPdfExtractMode
      ? `
        <div class="pdf-card-extract-badge ${isExtractChecked ? "checked" : ""}" aria-hidden="true">
          ${isExtractChecked ? chkIco : ""}
        </div>
      `
      : `
        <div class="pdf-card-floating-actions" onclick="event.stopPropagation()">
          <button type="button" class="pdf-float-icon-btn dup" onclick="duplicateSingleWorkshopPage(event, ${p})" title="Duplicar página" aria-label="Duplicar página ${p}">${dupIco}</button>
          <button type="button" class="pdf-float-icon-btn del" onclick="deleteSingleWorkshopPage(event, ${p})" title="Eliminar página" aria-label="Eliminar página ${p}">${delIco}</button>
        </div>
      `;

    html += `
      <div class="folio-page-thumb pdf-lightbox-card ${isSel ? "active" : ""} ${isExtractChecked ? "is-extract-selected" : ""} ${isBlank ? "is-blank-page" : ""}"
           data-pdf-thumb-idx="${p - 1}"
           onpointerdown="onPdfThumbPointerDown(event, ${p - 1})"
           onclick="onWorkshopCardClick(${p}, this)">
        <div class="pdf-thumb-sheet-wrap">
          ${sheetPreviewHtml}
          ${topFloatingOverlay}
        </div>
        <div class="pdf-thumb-foot-bar">
          <span class="pdf-thumb-num">Pág ${p}</span>
        </div>
      </div>
    `;
  }

  strip.innerHTML = html;
  updatePdfWorkshopHeaderCounts();
  hydrateWorkshopPdfPageThumbnails();
}

function onWorkshopCardClick(pNum) {
  if (!pdfWorkshopDraft) return;
  if (isPdfExtractMode) {
    if (selectedWorkshopPages.has(pNum)) {
      selectedWorkshopPages.delete(pNum);
    } else {
      selectedWorkshopPages.add(pNum);
    }
    renderWorkshopPageStrip();
  } else {
    focusedWorkshopPage = pNum;
    renderWorkshopPageStrip();
  }
}

function toggleWorkshopPageSelection(pNum) {
  onWorkshopCardClick(pNum);
}

function selectAllWorkshopPages() {
  if (!pdfWorkshopDraft) return;
  const total = Math.max(1, pdfWorkshopDraft.pageCount || 1);
  selectedWorkshopPages = new Set(Array.from({ length: total }, (_, i) => i + 1));
  renderWorkshopPageStrip();
}

function clearWorkshopPageSelection() {
  if (!pdfWorkshopDraft) return;
  selectedWorkshopPages.clear();
  renderWorkshopPageStrip();
}

function getAdjacentPageDimensions(doc, neighborIdx) {
  const defaultA4 = [595.28, 841.89];
  if (!doc || typeof doc.getPageCount !== "function") return defaultA4;
  const count = doc.getPageCount();
  if (count === 0) return defaultA4;
  const clampedIdx = Math.max(0, Math.min(count - 1, neighborIdx));
  try {
    const refPage = doc.getPage(clampedIdx);
    const { width, height } = refPage.getSize();
    if (width > 50 && height > 50) return [width, height];
  } catch (_) {}
  return defaultA4;
}

async function addBlankPdfPage(afterPageOverride) {
  const draft = pdfWorkshopDraft;
  if (!draft) return;
  pushPdfWorkshopUndoState("+ Hoja");
  const items = draft.pageItems;
  const insertAfter =
    typeof afterPageOverride === "number"
      ? afterPageOverride
      : focusedWorkshopPage >= 1 && focusedWorkshopPage <= items.length
      ? focusedWorkshopPage
      : items.length;
  const targetIndex = Math.min(items.length, Math.max(0, insertAfter));

  if (draft.isRealPdf && window.PDFLib) {
    try {
      if (!pdfWorkingDoc && draft.pdfBytes) {
        pdfWorkingDoc = await window.PDFLib.PDFDocument.load(draft.pdfBytes);
      }
      if (pdfWorkingDoc) {
        const dims = getAdjacentPageDimensions(pdfWorkingDoc, Math.max(0, targetIndex - 1));
        if (targetIndex >= pdfWorkingDoc.getPageCount()) {
          pdfWorkingDoc.addPage(dims);
        } else {
          pdfWorkingDoc.insertPage(targetIndex, dims);
        }
        await syncWorkingPdfBytesFromDoc();
      }
    } catch (err) {
      console.warn("Error insertando hoja en blanco en pdf-lib:", err);
    }
  }

  items.splice(targetIndex, 0, {
    id: `blank-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    kind: "blank",
    label: "Hoja en blanco",
    rotation: 0,
    thumbUrl: null
  });

  draft.pageCount = items.length;
  draft.pages = `${draft.pageCount} págs.`;
  focusedWorkshopPage = targetIndex + 1;
  renderWorkshopPageStrip();
  triggerPdfToast(`Hoja en blanco insertada (Pág ${focusedWorkshopPage})`);
}

function insertBlankAfterPage(e, pNum) {
  if (e) e.stopPropagation();
  addBlankPdfPage(pNum);
}

async function duplicateSingleWorkshopPage(e, pNum) {
  if (e) e.stopPropagation();
  const draft = pdfWorkshopDraft;
  if (!draft) return;
  const items = draft.pageItems;
  if (pNum < 1 || pNum > items.length) return;

  pushPdfWorkshopUndoState("Duplicar página");
  const srcIndex = pNum - 1;
  const insertIndex = pNum;

  if (draft.isRealPdf && window.PDFLib) {
    try {
      if (!pdfWorkingDoc && draft.pdfBytes) {
        pdfWorkingDoc = await window.PDFLib.PDFDocument.load(draft.pdfBytes);
      }
      if (pdfWorkingDoc) {
        const [copiedPage] = await pdfWorkingDoc.copyPages(pdfWorkingDoc, [srcIndex]);
        if (insertIndex >= pdfWorkingDoc.getPageCount()) {
          pdfWorkingDoc.addPage(copiedPage);
        } else {
          pdfWorkingDoc.insertPage(insertIndex, copiedPage);
        }
        await syncWorkingPdfBytesFromDoc();
      }
    } catch (err) {
      console.warn("Error duplicando página con copyPages():", err);
    }
  }

  const origItem = items[srcIndex];
  const clonedItem = {
    ...origItem,
    id: `dup-${Date.now()}-${pNum}-${Math.random().toString(36).slice(2, 5)}`,
    label: `${origItem.label || `Pág ${pNum}`} (Copia)`,
    thumbUrl: origItem.thumbUrl || null
  };
  items.splice(insertIndex, 0, clonedItem);

  draft.pageCount = items.length;
  draft.pages = `${draft.pageCount} págs.`;
  focusedWorkshopPage = insertIndex + 1;
  renderWorkshopPageStrip();
  triggerPdfToast(`Pág ${pNum} duplicada`);
}

async function duplicateSelectedPdfPages() {
  await duplicateSingleWorkshopPage(null, focusedWorkshopPage || 1);
}

async function deleteSingleWorkshopPage(e, pNum) {
  if (e) e.stopPropagation();
  const draft = pdfWorkshopDraft;
  if (!draft) return;
  const items = draft.pageItems;
  if (items.length <= 1) {
    triggerPdfToast("El documento debe conservar al menos 1 página");
    return;
  }
  const removeIdx = pNum - 1;
  if (removeIdx < 0 || removeIdx >= items.length) return;

  pushPdfWorkshopUndoState(`Eliminar Pág ${pNum}`);

  if (draft.isRealPdf && window.PDFLib) {
    try {
      if (!pdfWorkingDoc && draft.pdfBytes) {
        pdfWorkingDoc = await window.PDFLib.PDFDocument.load(draft.pdfBytes);
      }
      if (pdfWorkingDoc && removeIdx < pdfWorkingDoc.getPageCount()) {
        pdfWorkingDoc.removePage(removeIdx);
        await syncWorkingPdfBytesFromDoc();
      }
    } catch (err) {
      console.warn("Error eliminando página con removePage():", err);
    }
  }

  items.splice(removeIdx, 1);
  draft.pageCount = items.length;
  draft.pages = `${draft.pageCount} págs.`;
  focusedWorkshopPage = Math.max(1, Math.min(items.length, pNum));
  renderWorkshopPageStrip();
  triggerPdfToast(`Pág ${pNum} eliminada`);
}

function onPdfThumbPointerDown(e, initialIdx) {
  if (isPdfExtractMode) return;
  if (e.target.closest("button")) return;
  if (e.button && e.button !== 0) return;
  const draft = pdfWorkshopDraft;
  if (!draft) return;
  const items = draft.pageItems || [];
  if (items.length < 2) return;

  const strip = document.getElementById("workshopPagesStrip");
  const itemEl = e.currentTarget;
  if (!strip || !itemEl) return;

  const isMouse = e.pointerType === "mouse";
  const startX = e.clientX;
  const startY = e.clientY;
  const rect = itemEl.getBoundingClientRect();
  const offsetX = startX - rect.left;
  const offsetY = startY - rect.top;

  let currentIdx = initialIdx;
  let dragStarted = false;
  let gestureCancelled = false;
  let ghost = null;
  let autoScrollRaf = null;
  let lastPointerX = startX;
  let lastPointerY = startY;
  const preDragSnapshot = capturePdfWorkshopSnapshot("Reordenar páginas");
  const indexPermutation = items.map((_, i) => i);

  const getPageCards = () => [
    ...strip.querySelectorAll(".folio-page-thumb[data-pdf-thumb-idx]")
  ];

  const initialScrollTop = strip.scrollTop;
  const baseSlotRects = getPageCards().map((c) => {
    const r = c.getBoundingClientRect();
    return {
      left: r.left,
      top: r.top,
      right: r.right,
      bottom: r.bottom,
      width: r.width,
      height: r.height
    };
  });

  const getSlotRect = (slotIdx) => {
    const b = baseSlotRects[slotIdx];
    if (!b) return null;
    const scrollDelta = strip.scrollTop - initialScrollTop;
    return {
      left: b.left,
      top: b.top - scrollDelta,
      right: b.right,
      bottom: b.bottom - scrollDelta,
      width: b.width,
      height: b.height
    };
  };

  const syncDomIndicesAndLabels = () => {
    const cards = getPageCards();
    cards.forEach((card, idx) => {
      card.dataset.pdfThumbIdx = String(idx);
      const numEl = card.querySelector(".pdf-thumb-num");
      if (numEl) numEl.textContent = `Pág ${idx + 1}`;
    });
  };

  const updateGhostPosition = (clientX, clientY) => {
    if (!ghost) return;
    ghost.style.left = `${Math.round(clientX - offsetX)}px`;
    ghost.style.top = `${Math.round(clientY - offsetY)}px`;
  };

  const beginGhost = () => {
    if (dragStarted || gestureCancelled) return;
    dragStarted = true;
    document.body.classList.add("is-reordering-drag");
    if (navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch (_) {}
    }
    ghost = itemEl.cloneNode(true);
    ghost.classList.add("floating-drag-ghost", "pdf-page-drag-ghost");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    updateGhostPosition(lastPointerX, lastPointerY);
    document.body.appendChild(ghost);
    itemEl.classList.add("dragging", "is-drag-slot");
  };

  const holdTimer = setTimeout(beginGhost, 200);

  const stepAutoScroll = () => {
    if (!dragStarted || gestureCancelled) return;
    const sr = strip.getBoundingClientRect();
    const edgeZone = 42;
    if (lastPointerY < sr.top + edgeZone && strip.scrollTop > 0) {
      strip.scrollTop -= 7;
    } else if (
      lastPointerY > sr.bottom - edgeZone &&
      strip.scrollTop < strip.scrollHeight - strip.clientHeight
    ) {
      strip.scrollTop += 7;
    }
    autoScrollRaf = requestAnimationFrame(stepAutoScroll);
  };

  const performFlipSwap = (targetIdx) => {
    const cardsBefore = getPageCards();
    const prevSlotByCard = new Map();
    cardsBefore.forEach((c, idx) => prevSlotByCard.set(c, idx));

    const targetCard = cardsBefore[targetIdx];
    if (!targetCard || targetCard === itemEl) return;

    if (targetIdx > currentIdx) {
      strip.insertBefore(itemEl, targetCard.nextSibling);
    } else {
      strip.insertBefore(itemEl, targetCard);
    }

    const [movedItem] = items.splice(currentIdx, 1);
    items.splice(targetIdx, 0, movedItem);
    const [movedOrigIdx] = indexPermutation.splice(currentIdx, 1);
    indexPermutation.splice(targetIdx, 0, movedOrigIdx);
    currentIdx = targetIdx;
    syncDomIndicesAndLabels();

    getPageCards().forEach((c, newSlotIdx) => {
      if (c === itemEl) return;
      const oldSlotIdx = prevSlotByCard.get(c);
      if (oldSlotIdx === undefined || oldSlotIdx === newSlotIdx) return;
      const first = getSlotRect(oldSlotIdx);
      const last = getSlotRect(newSlotIdx);
      if (!first || !last) return;
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        c.style.transition = "none";
        c.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        requestAnimationFrame(() => {
          c.style.transition = "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)";
          c.style.transform = "";
        });
      }
    });
  };

  const onMove = (ev) => {
    if (gestureCancelled) return;
    lastPointerX = ev.clientX;
    lastPointerY = ev.clientY;
    const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);

    if (!dragStarted) {
      if (isMouse) {
        if (dist < 5) return;
        clearTimeout(holdTimer);
        beginGhost();
        autoScrollRaf = requestAnimationFrame(stepAutoScroll);
      } else {
        if (dist > 9) {
          gestureCancelled = true;
          clearTimeout(holdTimer);
          cleanup();
        }
        return;
      }
    }

    ev.preventDefault();
    if (!autoScrollRaf) {
      autoScrollRaf = requestAnimationFrame(stepAutoScroll);
    }
    updateGhostPosition(ev.clientX, ev.clientY);

    let hitIdx = -1;
    for (let i = 0; i < baseSlotRects.length; i++) {
      if (i === currentIdx) continue;
      const r = getSlotRect(i);
      if (!r) continue;
      if (
        ev.clientX >= r.left + r.width * 0.12 &&
        ev.clientX <= r.right - r.width * 0.12 &&
        ev.clientY >= r.top + r.height * 0.12 &&
        ev.clientY <= r.bottom - r.height * 0.12
      ) {
        hitIdx = i;
        break;
      }
    }

    if (hitIdx !== -1 && hitIdx !== currentIdx) {
      performFlipSwap(hitIdx);
    }
  };

  const cleanup = () => {
    clearTimeout(holdTimer);
    if (autoScrollRaf) {
      cancelAnimationFrame(autoScrollRaf);
      autoScrollRaf = null;
    }
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    document.body.classList.remove("is-reordering-drag");
    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    ghost = null;
    itemEl.classList.remove("dragging", "is-drag-slot");
    getPageCards().forEach((c) => {
      c.style.transition = "";
      c.style.transform = "";
      c.classList.remove("dragging", "is-drag-slot");
    });
  };

  const onUp = async () => {
    const wasDragging = dragStarted;
    const finalIdx = currentIdx;
    cleanup();
    if (wasDragging) {
      const suppressClick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      document.addEventListener("click", suppressClick, { capture: true, once: true });
      setTimeout(() => document.removeEventListener("click", suppressClick, true), 250);

      if (finalIdx !== initialIdx) {
        if (preDragSnapshot) {
          pdfWorkshopUndoStack.push(preDragSnapshot);
          if (pdfWorkshopUndoStack.length > 25) pdfWorkshopUndoStack.shift();
          isPdfWorkshopDirty = true;
          updatePdfUndoButtonState();
        }
        focusedWorkshopPage = finalIdx + 1;
        if (draft.isRealPdf && window.PDFLib) {
          try {
            if (!pdfWorkingDoc && draft.pdfBytes) {
              pdfWorkingDoc = await window.PDFLib.PDFDocument.load(draft.pdfBytes);
            }
            if (pdfWorkingDoc) {
              const reorderedDoc = await window.PDFLib.PDFDocument.create();
              const copied = await reorderedDoc.copyPages(pdfWorkingDoc, indexPermutation);
              copied.forEach((cp) => reorderedDoc.addPage(cp));
              pdfWorkingDoc = reorderedDoc;
              await syncWorkingPdfBytesFromDoc();
            }
          } catch (err) {
            console.warn("Error reordenando PDFLib.PDFDocument:", err);
          }
        }
        renderWorkshopPageStrip();
        triggerPdfToast(`Pág ${initialIdx + 1} movida a Pág ${finalIdx + 1}`);
      }
    }
  };

  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

async function handleAppendPdfPages(files) {
  if (!files || files.length === 0) return;
  const draft = pdfWorkshopDraft;
  if (!draft) return;

  pushPdfWorkshopUndoState("+ PDF");
  const items = draft.pageItems;
  const file = files[0];
  const extraBuffer = await file.arrayBuffer();
  const extraBytes = new Uint8Array(extraBuffer);

  // Limpiar input para permitir anexar el mismo archivo otra vez si se desea
  const fileInp = document.getElementById("appendPdfFileInput");
  if (fileInp) fileInp.value = "";

  if (window.PDFLib) {
    try {
      if (!pdfWorkingDoc) {
        if (draft.isRealPdf && draft.pdfBytes) {
          pdfWorkingDoc = await window.PDFLib.PDFDocument.load(draft.pdfBytes);
        } else {
          pdfWorkingDoc = await window.PDFLib.PDFDocument.create();
          for (let i = 0; i < items.length; i++) {
            pdfWorkingDoc.addPage([595.28, 841.89]);
          }
          draft.isRealPdf = true;
        }
      }
      const extraDoc = await window.PDFLib.PDFDocument.load(extraBytes);
      const indices = extraDoc.getPageIndices();
      const copied = await pdfWorkingDoc.copyPages(extraDoc, indices);
      copied.forEach((cp) => pdfWorkingDoc.addPage(cp));
      await syncWorkingPdfBytesFromDoc();

      indices.forEach((_, idx) => {
        items.push({
          id: `ext-${Date.now()}-${idx}`,
          kind: "pdf",
          label: `${file.name} · Pág ${idx + 1}`,
          rotation: 0,
          thumbUrl: null
        });
      });

      draft.pageCount = items.length;
      draft.pages = `${draft.pageCount} págs.`;
      focusedWorkshopPage = items.length;
      renderWorkshopPageStrip();
      triggerPdfToast(`+${indices.length} ${indices.length === 1 ? "página anexada" : "páginas anexadas"}`);
      return;
    } catch (e) {
      console.warn("Error anexando PDF con pdf-lib:", e);
    }
  }

  items.push({
    id: `ext-${Date.now()}`,
    kind: "pdf",
    label: file.name || "PDF Anexado",
    rotation: 0,
    thumbUrl: null
  });
  draft.pageCount = items.length;
  draft.pages = `${draft.pageCount} págs.`;
  focusedWorkshopPage = items.length;
  renderWorkshopPageStrip();
  triggerPdfToast("PDF anexado al final");
}

// ==========================================================================
// MODO "✂️ EXTRAER" (SELECCIÓN MÚLTIPLE Y CREACIÓN DE NUEVO PDF)
// ==========================================================================
function openExtractNewPdfModal() {
  if (!pdfWorkshopDraft || selectedWorkshopPages.size === 0) return;
  const backdrop = document.getElementById("pdfExtractModalBackdrop");
  const nameInp = document.getElementById("extractNewPdfNameInput");
  const removeChk = document.getElementById("extractRemoveFromCurrentChk");
  if (!backdrop || !nameInp) return;

  const baseTitle = (pdfWorkshopDraft.title || "Partitura").replace(/\.pdf$/i, "").trim();
  nameInp.value = `${baseTitle} - Extracto.pdf`;
  if (removeChk) removeChk.checked = false;

  backdrop.classList.remove("hidden");
  setTimeout(() => {
    nameInp.focus();
    nameInp.select();
  }, 40);
}

function closeExtractNewPdfModal() {
  const backdrop = document.getElementById("pdfExtractModalBackdrop");
  if (backdrop) backdrop.classList.add("hidden");
}

async function confirmCreateExtractedPdf() {
  const draft = pdfWorkshopDraft;
  if (!draft || selectedWorkshopPages.size === 0) return;

  const nameInp = document.getElementById("extractNewPdfNameInput");
  const removeChk = document.getElementById("extractRemoveFromCurrentChk");
  const rawName = (nameInp?.value || "").trim() || `${draft.title} - Extracto.pdf`;
  const cleanTitle = rawName.replace(/\.pdf$/i, "").trim() || "Partitura - Extracto";
  const shouldRemoveFromCurrent = Boolean(removeChk?.checked);

  const sortedPages = Array.from(selectedWorkshopPages).sort((a, b) => a - b);
  const zeroIndices = sortedPages.map((p) => p - 1);
  const newScoreId = Date.now();
  const baseScore = scores.find((item) => item.id === draft.id) || draft;

  let extractedBytes = null;
  let extractedThumb = draft.thumbDataUrl || null;

  if (draft.isRealPdf && window.PDFLib) {
    try {
      if (!pdfWorkingDoc && draft.pdfBytes) {
        pdfWorkingDoc = await window.PDFLib.PDFDocument.load(draft.pdfBytes);
      }
      if (pdfWorkingDoc) {
        const newDoc = await window.PDFLib.PDFDocument.create();
        const validIndices = zeroIndices.filter((idx) => idx >= 0 && idx < pdfWorkingDoc.getPageCount());
        const copiedPages = await newDoc.copyPages(pdfWorkingDoc, validIndices);
        copiedPages.forEach((cp) => newDoc.addPage(cp));
        extractedBytes = await newDoc.save();
        const preview = await generatePdfThumbnailDataUrl(extractedBytes);
        if (preview && preview.thumbUrl) {
          extractedThumb = preview.thumbUrl;
        }
      }
    } catch (err) {
      console.warn("Error creando nuevo PDF extraído con pdf-lib:", err);
    }
  }

  const extractedItems = sortedPages.map((pNum, idx) => ({
    ...(draft.pageItems[pNum - 1] || {}),
    id: `ext-p-${idx + 1}-${Date.now()}`,
    sourcePage: idx + 1
  }));

  const newScoreObj = {
    ...baseScore,
    id: newScoreId,
    title: cleanTitle,
    clean: cleanTitle,
    subtitle: `Extracto (${sortedPages.length} ${sortedPages.length === 1 ? "pág." : "págs."})`,
    pages: `${sortedPages.length} págs.`,
    pageCount: sortedPages.length,
    pageItems: extractedItems,
    isRealPdf: Boolean(extractedBytes),
    pdfBytes: extractedBytes,
    thumbDataUrl: extractedThumb,
    raw: false
  };

  scores.unshift(newScoreObj);
  if (newScoreObj.isRealPdf) {
    await saveRealPdfToDb(newScoreObj);
  }
  try {
    const savedCustomMeta = JSON.parse(localStorage.getItem("cadenza_extracted_pdfs_meta") || "[]");
    savedCustomMeta.unshift({
      id: newScoreObj.id,
      title: newScoreObj.title,
      pageCount: newScoreObj.pageCount,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem("cadenza_extracted_pdfs_meta", JSON.stringify(savedCustomMeta.slice(0, 50)));
  } catch (_) {}

  // Si el usuario marcó "[x] Borrar del actual" y quedan páginas restantes
  if (shouldRemoveFromCurrent) {
    if (sortedPages.length >= draft.pageItems.length) {
      triggerPdfToast("Se copió el PDF (no se puede vaciar el documento actual)");
    } else {
      pushPdfWorkshopUndoState("Extraer y borrar páginas");
      const descIndices = [...zeroIndices].sort((a, b) => b - a);
      if (draft.isRealPdf && pdfWorkingDoc) {
        try {
          descIndices.forEach((idx) => {
            if (idx >= 0 && idx < pdfWorkingDoc.getPageCount()) {
              pdfWorkingDoc.removePage(idx);
            }
          });
          await syncWorkingPdfBytesFromDoc();
        } catch (err) {
          console.warn("Error removiendo páginas cortadas:", err);
        }
      }
      draft.pageItems = draft.pageItems.filter((_, idx) => !selectedWorkshopPages.has(idx + 1));
      draft.pageCount = draft.pageItems.length;
      draft.pages = `${draft.pageCount} págs.`;
      focusedWorkshopPage = 1;
    }
  }

  closeExtractNewPdfModal();
  togglePdfExtractMode(false);
  renderLibrary();
  triggerPdfToast("Documento creado con éxito");
}

// ==========================================================================
// GUARDADO DEFINITIVO ("💾 Guardar") Y SALIDA NO DESTRUCTIVA ("← Salir")
// ==========================================================================
async function commitAndSavePdfChanges() {
  const draft = pdfWorkshopDraft;
  if (!draft) return;
  const s = scores.find((item) => item.id === draft.id);
  if (!s) return;

  // Sincronizar campos del popover de metadatos si fueron editados
  const wmTitleVal = (document.getElementById("wmTitleInput")?.value || "").trim();
  const wmCompVal = (document.getElementById("wmComposerInput")?.value || "").trim();
  const wmPerVal = (document.getElementById("wmPeriodInput")?.value || "").trim();
  const wmGrpVal = (document.getElementById("wmGroupInput")?.value || "").trim();

  if (wmTitleVal) draft.title = wmTitleVal.replace(/\.pdf$/i, "");
  if (wmCompVal) draft.composer = wmCompVal;
  if (wmPerVal) draft.period = wmPerVal;
  if (wmGrpVal) draft.group = wmGrpVal;

  if (draft.isRealPdf && window.PDFLib) {
    try {
      if (!pdfWorkingDoc && draft.pdfBytes) {
        pdfWorkingDoc = await window.PDFLib.PDFDocument.load(draft.pdfBytes);
      }
      if (pdfWorkingDoc) {
        pdfWorkingDoc.setTitle(draft.title || "");
        pdfWorkingDoc.setAuthor(draft.composer || "");
        pdfWorkingDoc.setSubject(draft.period || "");
        pdfWorkingDoc.setKeywords([draft.period, draft.group || draft.ensemble].filter(Boolean));
        draft.pdfBytes = await pdfWorkingDoc.save();
      }
      if (draft.pdfBytes) {
        const preview = await generatePdfThumbnailDataUrl(draft.pdfBytes);
        if (preview && preview.thumbUrl) {
          draft.thumbDataUrl = preview.thumbUrl;
        }
      }
    } catch (err) {
      console.warn("Error al serializar PDF final con save():", err);
    }
  }

  s.title = draft.title || s.title;
  s.clean = s.title;
  s.composer = draft.composer ?? s.composer;
  s.period = draft.period ?? s.period;
  s.group = draft.group ?? s.group;
  s.ensemble = s.group;
  s.raw = false;
  s.isRealPdf = draft.isRealPdf;
  s.pdfBytes = draft.pdfBytes ? draft.pdfBytes.slice(0) : null;
  s.thumbDataUrl = draft.thumbDataUrl || s.thumbDataUrl;
  s.pageItems = draft.pageItems.map((it) => ({ ...it }));
  s.pageCount = s.pageItems.length;
  s.pages = `${s.pageCount} págs.`;

  saveScoreMetadataOverride(s);
  if (s.isRealPdf && s.pdfBytes) {
    await saveRealPdfToDb(s);
  }
  syncActiveReaderHeadersForScore(s);

  // Si la partitura editada es la activa en el visor (Estudio/Concierto), recargar su instancia PDF.js
  if (typeof activeScore !== "undefined" && activeScore && activeScore.id === s.id) {
    activeScore = s;
    if (s.isRealPdf && s.pdfBytes && window.pdfjsLib) {
      try {
        const loadingTask = window.pdfjsLib.getDocument({ data: s.pdfBytes.slice(0) });
        currentPdfDocInstance = await loadingTask.promise;
        s.pageCount = currentPdfDocInstance.numPages;
      } catch (err) {
        console.warn("Error recargando visor con nuevo PDF:", err);
      }
    }
    if (typeof renderActiveScorePage === "function") {
      await renderActiveScorePage();
    }
  }

  isPdfWorkshopDirty = false;
  pdfWorkshopUndoStack = [];
  updatePdfUndoButtonState();
  refreshDynamicLibraryFilters();
  if (typeof renderSetlistDrawer === "function") renderSetlistDrawer();
  triggerPdfToast("Cambios guardados");
  setTimeout(() => forceClosePdfModalDiscard(), 320);
}

async function saveWorkshopMetadata() {
  await commitAndSavePdfChanges();
}

function requestClosePdfModal(e) {
  if (e && e.target && e.target.id && e.target.id !== "pdfModal") return;
  if (isPdfWorkshopDirty) {
    const confirmModal = document.getElementById("pdfExitConfirmBackdrop");
    if (confirmModal) {
      confirmModal.classList.remove("hidden");
      return;
    }
  }
  forceClosePdfModalDiscard();
}

function closePdfExitConfirm() {
  const confirmModal = document.getElementById("pdfExitConfirmBackdrop");
  if (confirmModal) confirmModal.classList.add("hidden");
}

function forceClosePdfModalDiscard() {
  closePdfExitConfirm();
  closeExtractNewPdfModal();
  closePdfMetadataModal();
  isPdfExtractMode = false;
  isPdfWorkshopDirty = false;
  pdfWorkshopDraft = null;
  pdfWorkingDoc = null;
  pdfInitialBackup = null;
  pdfWorkshopUndoStack = [];
  const modal = document.getElementById("pdfModal");
  if (modal) modal.classList.add("hidden");
}

// ==========================================================================
// NAVEGACIÓN GENERAL Y BIBLIOTECA
// ==========================================================================
function syncMonolithicBottomCapsule(active) {
  const dock = document.getElementById("bottomNavDock");
  const capsule = dock?.querySelector(".bottom-mode-capsule");
  const scrubber = document.getElementById("performerScrubberBar");
  const bachFab = document.getElementById("bachGptFab");
  const performer = document.getElementById("mode-performer");
  const penAnchor = document.getElementById("fountainPenAnchor");
  const dockReveal = document.getElementById("dockRevealHandle");
  if (!capsule || !scrubber || !bachFab) return;

  capsule.classList.toggle("monolithic-capsule", Boolean(active));
  if (active) {
    if (scrubber.parentElement !== capsule) capsule.appendChild(scrubber);
    if (bachFab.parentElement !== capsule) capsule.appendChild(bachFab);
  } else {
    if (performer && scrubber.parentElement !== performer) {
      if (penAnchor && penAnchor.parentElement === performer) {
        performer.insertBefore(scrubber, penAnchor);
      } else {
        performer.appendChild(scrubber);
      }
    }
    if (bachFab.parentElement !== document.body) {
      if (dockReveal && dockReveal.parentElement === document.body) {
        document.body.insertBefore(bachFab, dockReveal);
      } else {
        document.body.appendChild(bachFab);
      }
    }
  }
}

function switchMode(mode) {
  // Compatibilidad con llamadas legadas 'study' o 'concert' -> unificadas en 'performer'
  let targetView = mode;
  let targetPerfState = null;
  if (mode === "study" || mode === "concert") {
    targetView = "performer";
    targetPerfState = mode;
  }

  document.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === targetView));
  document.querySelectorAll(".canvas-view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`mode-${targetView}`)?.classList.add("active");

  document.body.classList.remove("writing-focus");
  document.getElementById("dockRevealHandle")?.classList.add("hidden");

  document.body.classList.toggle("mode-library-active", targetView === "library");
  document.body.classList.toggle("mode-performer-active", targetView === "performer");

  if (targetView === "performer") {
    const desired = targetPerfState || performanceMode || "study";
    setPerformanceMode(desired);
  } else {
    document.body.classList.remove("mode-concert-active", "concert-immersion");
    syncMonolithicBottomCapsule(false);
  }

  if (targetView === "editor") setTimeout(setupEditorCanvas, 40);
}

function setPerformanceMode(modeState, opts = {}) {
  const nextState = modeState === "concert" ? "concert" : "study";
  const prevState = performanceMode;

  // Guardar anotaciones actuales antes de redimensionar el lienzo unificado
  if (typeof saveStudyAnnotationsForCurrentPage === "function" && prevState !== nextState) {
    saveStudyAnnotationsForCurrentPage();
  }

  performanceMode = nextState;

  const performerEl = document.getElementById("mode-performer");
  if (performerEl) {
    performerEl.classList.toggle("is-study-mode", nextState === "study");
    performerEl.classList.toggle("is-concert-mode", nextState === "concert");
  }

  const btnStudy = document.getElementById("perfSwitchStudy");
  const btnConcert = document.getElementById("perfSwitchConcert");
  if (btnStudy) {
    btnStudy.classList.toggle("active", nextState === "study");
    btnStudy.setAttribute("aria-selected", nextState === "study" ? "true" : "false");
  }
  if (btnConcert) {
    btnConcert.classList.toggle("active", nextState === "concert");
    btnConcert.setAttribute("aria-selected", nextState === "concert" ? "true" : "false");
  }

  document.body.classList.toggle("mode-concert-active", nextState === "concert");
  document.body.classList.remove("writing-focus");
  syncMonolithicBottomCapsule(nextState === "study");

  if (nextState === "concert") {
    // Zero-Chrome Start: iniciar Concierto directamente limpio
    document.body.classList.add("concert-immersion");
    if (concertAutoHideTimer) {
      clearTimeout(concertAutoHideTimer);
      concertAutoHideTimer = null;
    }
    toggleBachGptChat(false);
    document.getElementById("brushPopover")?.classList.add("hidden");
    document.getElementById("stampPopover")?.classList.add("hidden");
    document.getElementById("metronomePopover")?.classList.add("hidden");
    closeTunerPopoverAndStop();
  } else {
    document.body.classList.remove("concert-immersion");
    if (concertAutoHideTimer) {
      clearTimeout(concertAutoHideTimer);
      concertAutoHideTimer = null;
    }
  }

  // Actualizar pie del folio según el estado
  const footerLeft = document.getElementById("performerFooterLeft");
  if (footerLeft) {
    if (nextState === "concert") {
      const prog = typeof getActiveProgram === "function" ? getActiveProgram() : null;
      footerLeft.textContent = prog ? `Programa: ${prog.name}` : "Modo Concierto • Toca el centro para ocultar controles";
    } else {
      const names = { pen: "Pluma Activa", marker: "Marcador Activo", eraser: "Borrador Activo" };
      footerLeft.textContent = `Modo Ensayo • ${names[studyTool] || "Pluma Activa"}`;
    }
  }

  if (!opts.skipRender) {
    setTimeout(() => renderActiveScorePage(), 60);
  }
}

function togglePaletteMenu(e) {
  if (e) e.stopPropagation();
  document.getElementById("paletteMenu")?.classList.toggle("hidden");
}

function setPalette(paletteClass, btn, labelText) {
  document.body.classList.remove("palette-luthier", "palette-henle", "palette-linen", "palette-velvet", "palette-cadenza");
  document.body.classList.add(paletteClass);
  document.querySelectorAll(".palette-opt").forEach((c) => {
    c.classList.toggle("active", btn ? c === btn : c.dataset.palette === paletteClass);
  });
  const lbl = document.getElementById("paletteTriggerLabel");
  if (lbl && labelText) lbl.textContent = labelText;
}

function setLibraryViewMode(mode) {
  libraryViewMode = mode;
  document.getElementById("btnViewFolio").classList.toggle("active", mode === "folio");
  document.getElementById("btnViewList").classList.toggle("active", mode === "list");
  renderLibrary();
}

let selectedComposerFilter = "all";
let selectedPeriodFilter = "all";
let selectedGroupFilter = "all";
let activeFilterMenuKind = null;

function closeSharedFilterMenu() {
  document.getElementById("sharedFilterMenu")?.classList.add("hidden");
  activeFilterMenuKind = null;
}

function selectClassification(clsKey, labelText, btn) {
  currentClassification = clsKey;
  document.querySelectorAll(".ribbon-tab[data-cls]").forEach((item) => item.classList.remove("active"));
  if (btn) btn.classList.add("active");
  closeSharedFilterMenu();
  if (clsKey === "all") {
    selectedComposerFilter = "all";
    selectedPeriodFilter = "all";
    selectedGroupFilter = "all";
    const lc = document.getElementById("labelFilterComposer");
    const lp = document.getElementById("labelFilterPeriod");
    const lg = document.getElementById("labelFilterGroup");
    if (lc) lc.textContent = "Compositor";
    if (lp) lp.textContent = "Periodo";
    if (lg) lg.textContent = "Dotación";
  }
  renderLibrary();
}

function getOrganicFilterValues(kind) {
  if (kind === "composer") {
    return [...new Set(scores.map((s) => (s.composer || "").split("(")[0].trim()).filter(Boolean))];
  }
  if (kind === "period") {
    return [...new Set(scores.map((s) => (s.period || "").trim()).filter(Boolean))];
  }
  if (kind === "group") {
    return [...new Set(scores.map((s) => (s.group || s.ensemble || "").trim()).filter(Boolean))];
  }
  return [];
}

function buildFilterMenuOptionsHtml(kind) {
  const vals = getOrganicFilterValues(kind);
  let current = "all";
  let fn = "applyComposerFilter";
  if (kind === "composer") {
    current = selectedComposerFilter;
    fn = "applyComposerFilter";
  } else if (kind === "period") {
    current = selectedPeriodFilter;
    fn = "applyPeriodFilter";
  } else if (kind === "group") {
    current = selectedGroupFilter;
    fn = "applyGroupFilter";
  }
  return [
    `<button class="filter-dd-opt ${current === "all" ? "active" : ""}" onclick="${fn}('all')">Todos</button>`,
    ...vals.map(
      (v) => `<button class="filter-dd-opt ${current === v ? "active" : ""}" onclick="${fn}('${v.replace(/'/g, "\\'")}')">${v}</button>`
    )
  ].join("");
}

function refreshDynamicLibraryFilters() {
  const composers = getOrganicFilterValues("composer");
  const periods = getOrganicFilterValues("period");
  const groups = getOrganicFilterValues("group");

  if (selectedComposerFilter !== "all" && !composers.some((c) => c.toLowerCase().includes(selectedComposerFilter.toLowerCase()))) {
    selectedComposerFilter = "all";
    const lc = document.getElementById("labelFilterComposer");
    if (lc) lc.textContent = "Compositor";
  }
  if (selectedPeriodFilter !== "all" && !periods.includes(selectedPeriodFilter)) {
    selectedPeriodFilter = "all";
    const lp = document.getElementById("labelFilterPeriod");
    if (lp) lp.textContent = "Periodo";
  }
  if (selectedGroupFilter !== "all" && !groups.includes(selectedGroupFilter)) {
    selectedGroupFilter = "all";
    const lg = document.getElementById("labelFilterGroup");
    if (lg) lg.textContent = "Dotación";
  }

  const menu = document.getElementById("sharedFilterMenu");
  if (menu && !menu.classList.contains("hidden") && activeFilterMenuKind) {
    menu.innerHTML = buildFilterMenuOptionsHtml(activeFilterMenuKind);
  }
  renderLibrary();
}

function toggleFilterDropdown(kind, e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("sharedFilterMenu");
  if (!menu) return;

  const isAlreadyOpen = !menu.classList.contains("hidden") && activeFilterMenuKind === kind;
  if (isAlreadyOpen) {
    closeSharedFilterMenu();
    return;
  }

  menu.innerHTML = buildFilterMenuOptionsHtml(kind);

  const trigger = e?.currentTarget;
  if (trigger) {
    const rect = trigger.getBoundingClientRect();
    const menuWidth = Math.max(180, rect.width + 32);
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - menuWidth - 12);
    const top = Math.min(rect.bottom + 8, window.innerHeight - 240);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.minWidth = `${menuWidth}px`;
  }

  activeFilterMenuKind = kind;
  menu.classList.remove("hidden");
}

function applyComposerFilter(val) {
  selectedComposerFilter = val;
  currentClassification = "composer";
  document.querySelectorAll(".ribbon-tab[data-cls]").forEach((item) => item.classList.toggle("active", item.dataset.cls === "composer"));
  const lbl = document.getElementById("labelFilterComposer");
  if (lbl) lbl.textContent = val === "all" ? "Compositor" : val;
  closeSharedFilterMenu();
  renderLibrary();
}

function applyPeriodFilter(val) {
  selectedPeriodFilter = val;
  currentClassification = "period";
  document.querySelectorAll(".ribbon-tab[data-cls]").forEach((item) => item.classList.toggle("active", item.dataset.cls === "period"));
  const lbl = document.getElementById("labelFilterPeriod");
  if (lbl) lbl.textContent = val === "all" ? "Periodo" : val;
  closeSharedFilterMenu();
  renderLibrary();
}

function applyGroupFilter(val) {
  selectedGroupFilter = val;
  currentClassification = "instrumentation";
  document.querySelectorAll(".ribbon-tab[data-cls]").forEach((item) => item.classList.toggle("active", item.dataset.cls === "instrumentation"));
  const lbl = document.getElementById("labelFilterGroup");
  if (lbl) lbl.textContent = val === "all" ? "Dotación" : val;
  closeSharedFilterMenu();
  renderLibrary();
}

function toggleSettingsDrawer(forceState) {
  const drw = document.getElementById("settingsDrawer");
  if (!drw) return;
  const shouldOpen = typeof forceState === "boolean" ? forceState : drw.classList.contains("hidden");
  drw.classList.toggle("hidden", !shouldOpen);
}

function resetLibraryViewportScroll() {
  ["librarySlidesViewport", "mode-library"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollLeft = 0;
  });
  document.querySelectorAll(".library-workspace, .library-stage, .catalog-slide").forEach((el) => {
    el.scrollLeft = 0;
  });
}

function openProgramsSlideView() {
  refreshProgramRecentSnapshot();
  renderSetlistDrawer();
  document.getElementById("librarySlidesViewport")?.classList.add("is-programs-active");
  document.body.classList.add("programs-slide-open");
  resetLibraryViewportScroll();
}

function closeProgramsSlideView() {
  document.getElementById("librarySlidesViewport")?.classList.remove("is-programs-active");
  document.body.classList.remove("programs-slide-open");
  resetLibraryViewportScroll();
}

function revealBottomNavDock() {
  document.body.classList.remove("writing-focus");
  document.getElementById("dockRevealHandle")?.classList.add("hidden");
}

function exitAiModeToCatalog() {
  const allBtn = document.querySelector('.ribbon-tab[data-cls="all"]');
  selectClassification("all", "Todo", allBtn);
}

const FAVORITES_STORAGE_KEY = "atrilFavoritesV16";
const RECENTS_STORAGE_KEY = "atrilRecentsV1";
let recentScoreTimes = {};

function loadRecentsState() {
  try {
    const raw = localStorage.getItem(RECENTS_STORAGE_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") recentScoreTimes = obj;
    }
  } catch (_) {}
}

function markScoreRecent(scoreId) {
  recentScoreTimes[Number(scoreId)] = Date.now();
  try {
    localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(recentScoreTimes));
  } catch (_) {}
}
loadRecentsState();
let favoriteScoreIds = new Set([1]);

function loadFavoritesState() {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) favoriteScoreIds = new Set(arr.map(Number));
    }
  } catch (_) {}
}

function saveFavoritesState() {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favoriteScoreIds]));
  } catch (_) {}
}

function isFavoriteScore(scoreId) {
  return favoriteScoreIds.has(Number(scoreId));
}

function toggleFavoriteScore(scoreId) {
  const id = Number(scoreId);
  if (favoriteScoreIds.has(id)) favoriteScoreIds.delete(id);
  else favoriteScoreIds.add(id);
  saveFavoritesState();
  renderLibrary();
}

function renderLibrary() {
  renderContinueStudyingBanner();
  const container = document.getElementById("libraryCatalogContainer");
  const q = (document.getElementById("searchInput").value || "").toLowerCase();

  const filtered = scores.filter((s) => {
    if (currentClassification === "favorites" && !isFavoriteScore(s.id)) return false;
    if (currentClassification === "recent" && !recentScoreTimes[s.id]) return false;
    if (currentClassification === "composer" && selectedComposerFilter !== "all") {
      if (!s.composer.toLowerCase().includes(selectedComposerFilter.toLowerCase())) return false;
    }
    if (currentClassification === "period" && selectedPeriodFilter !== "all") {
      if (s.period !== selectedPeriodFilter) return false;
    }
    if (currentClassification === "instrumentation" && selectedGroupFilter !== "all") {
      if (s.group !== selectedGroupFilter) return false;
    }
    return (
      s.title.toLowerCase().includes(q) ||
      (s.clean && s.clean.toLowerCase().includes(q)) ||
      s.composer.toLowerCase().includes(q) ||
      s.period.toLowerCase().includes(q) ||
      s.group.toLowerCase().includes(q) ||
      s.program.toLowerCase().includes(q)
    );
  });

  if (currentClassification === "recent") {
    filtered.sort((a, b) => (recentScoreTimes[b.id] || 0) - (recentScoreTimes[a.id] || 0));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-pilot-box">
        <h4>No hay archivos en esta vista</h4>
        <p>${currentClassification === "favorites" ? "Toca el corazón en cualquier obra para verla en Favoritos." : currentClassification === "recent" ? "Las obras que abras aparecerán aquí." : 'Toca el botón <strong>"Importar"</strong> arriba para cargar partituras reales desde tu tablet.'}</p>
      </div>
    `;
    return;
  }

  const groups = {};
  filtered.forEach((s) => {
    let key = "Catálogo General";
    if (currentClassification === "composer") key = s.composer;
    else if (currentClassification === "period") key = `Periodo ${s.period}`;
    else if (currentClassification === "instrumentation") key = `Dotación: ${s.group}`;
    else if (currentClassification === "programs") key = `Programa: ${s.program}`;
    else if (currentClassification === "favorites") key = "Obras Favoritas";
    else if (currentClassification === "recent") key = "Abiertas recientemente";

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

function buildMonochromeBachHeadSvg() {
  const grid = [
    "....WWWWWWWW....",
    "..WWWWWWWWWWWW..",
    ".WWWWGGGGGGWWWW.",
    ".WWWGGGGGGGGWWW.",
    "WWWWGSSSSSSGWWWW",
    "WWWGSSSSSSSSGWWW",
    "WWWGSEESSSSEESWW",
    "WWWGSSSSSSSSGWWW",
    "WWGGSSSDDSSSGGWW",
    "WWGGSSSMMMSSGGWW",
    "WWWGGSSSSSSGGWWW",
    ".WWW........WWW."
  ];
  const fills = {
    W: "var(--bach-wig, #e6dfd5)",
    G: "var(--bach-shade, #b8afa3)",
    S: "var(--bach-skin, #999085)",
    D: "var(--bach-nose, #756d63)",
    E: "#111111",
    M: "var(--bach-mouth, #59524a)"
  };
  let rects = "";
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < 16; x++) {
      const ch = row[x];
      if (ch !== "." && fills[ch]) {
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fills[ch]}" />`;
      }
    }
  }
  return `<svg viewBox="0 0 16 12" class="bach-head-mono-svg" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

function buildFolioCardHtml(s) {
  const previewInner = s.thumbDataUrl
    ? `<img src="${s.thumbDataUrl}" alt="Portada PDF" class="real-pdf-thumb-img" />`
    : `
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
        </div>
      `;

  const showSub = s.subtitle && !s.isRealPdf && !s.subtitle.startsWith("Archivo PDF de tu Tablet");
  const dotsSvg = `<svg viewBox="0 0 24 24" class="v-ico"><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>`;

  const isSelected = multiSelectMode && selectedScoreIds.has(s.id);
  const chkHtml = multiSelectMode
    ? `<span class="multi-select-chk ${isSelected ? "checked" : ""}">${isSelected ? '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>' : ""}</span>`
    : "";
  const statusBadge = s.studyStatus
    ? `<span class="study-status-badge" data-status="${s.studyStatus}">${s.studyStatus}</span>`
    : "";

  return `
    <article class="folio-card ${isSelected ? "is-selected" : ""}"
             onclick="handleScoreCardClick(${s.id})"
             onpointerdown="onScoreCardPointerDown(event, ${s.id})"
             onpointerup="cancelScoreLongPress()"
             onpointercancel="cancelScoreLongPress()"
             onpointerleave="cancelScoreLongPress()">
      ${chkHtml}
      <div class="folio-preview-sheet ${s.thumbDataUrl ? "has-real-thumb" : ""}">
        ${previewInner}
      </div>

      <div class="folio-card-body">
        <div class="folio-card-title">
          <span>${s.title}</span>
          ${statusBadge}
          ${s.raw && !s.isRealPdf ? `<span class="raw-badge">PDF Crudo</span>` : ""}
        </div>
        <span class="folio-card-sub">${s.composer}</span>
        ${showSub ? `<span class="folio-card-detail">${s.subtitle}</span>` : ""}
      </div>

      <div class="folio-card-foot" onclick="event.stopPropagation()">
        <div class="folio-quick-btns">
          <button class="mini-action-btn no-box-btn fav-card-btn ${isFavoriteScore(s.id) ? "is-fav" : ""}" onclick="toggleFavoriteScore(${s.id})" title="Marcar como favorita" aria-label="Favorito"><svg viewBox="0 0 24 24" class="heart-ico"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
          <button class="mini-action-btn no-box-btn work-more-btn" onclick="openWorkActionsMenu(event, ${s.id})" title="Más opciones" aria-label="Más opciones">${dotsSvg}</button>
        </div>
      </div>
    </article>
  `;
}

function buildListRowHtml(s) {
  const showSub = s.subtitle && !s.isRealPdf && !s.subtitle.startsWith("Archivo PDF de tu Tablet");
  const dotsSvg = `<svg viewBox="0 0 24 24" class="v-ico"><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>`;

  const isSelected = multiSelectMode && selectedScoreIds.has(s.id);
  const chkHtml = multiSelectMode
    ? `<span class="multi-select-chk ${isSelected ? "checked" : ""}">${isSelected ? '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>' : ""}</span>`
    : "";
  const statusBadge = s.studyStatus
    ? `<span class="study-status-badge" data-status="${s.studyStatus}">${s.studyStatus}</span>`
    : "";

  return `
    <div class="list-detail-row ${isSelected ? "is-selected" : ""}"
         onclick="handleScoreCardClick(${s.id})"
         onpointerdown="onScoreCardPointerDown(event, ${s.id})"
         onpointerup="cancelScoreLongPress()"
         onpointercancel="cancelScoreLongPress()"
         onpointerleave="cancelScoreLongPress()">
      ${chkHtml}
      <div class="list-col-main">
        <div class="list-title-line">
          <strong class="list-work-title">${s.title}</strong>
          ${statusBadge}
          ${s.raw && !s.isRealPdf ? `<span class="raw-badge">PDF Crudo</span>` : ""}
        </div>
        <span class="list-work-subtitle">${s.composer}${showSub ? ` — <em>${s.subtitle}</em>` : ""}</span>
      </div>

      <div class="list-col-meta">
        <span class="list-meta-pill">${s.period}</span>
        <span class="list-meta-pill">${s.group}</span>
        <span class="list-meta-pages">${s.pages}</span>
      </div>

      <div class="list-col-actions" onclick="event.stopPropagation()">
        <button class="mini-action-btn no-box-btn fav-card-btn ${isFavoriteScore(s.id) ? "is-fav" : ""}" onclick="toggleFavoriteScore(${s.id})" title="Marcar como favorita" aria-label="Favorito"><svg viewBox="0 0 24 24" class="heart-ico"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
        <button class="mini-action-btn no-box-btn work-more-btn" onclick="openWorkActionsMenu(event, ${s.id})" title="Más opciones" aria-label="Más opciones">${dotsSvg}</button>
      </div>
    </div>
  `;
}

let activeWorkMenuScoreId = null;

let lastMobilePdfOpenTs = 0;

function triggerOpenPdfEditorFromMenu(e, id) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const now = Date.now();
  if (now - lastMobilePdfOpenTs < 350) return;
  lastMobilePdfOpenTs = now;
  closeWorkActionsMenu();
  openPdfModalById(id);
}

function renderWorkActionsMenuItems(menu, id) {
  const aiHead = buildMonochromeBachHeadSvg();
  const addSvg = `<svg viewBox="0 0 24 24" class="v-ico"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
  const cutSvg = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="6.5" r="2.5"/><circle cx="5.5" cy="17.5" r="2.5"/><path d="M7.6 7.8 21 18.8"/><path d="M7.6 16.2 21 5.2"/><circle cx="12.4" cy="12" r="0.7" fill="currentColor" stroke="none"/></svg>`;
  const trashSvg = `<svg viewBox="0 0 24 24" class="v-ico"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

  menu.classList.remove("is-prog-mode");
  menu.innerHTML = `
    <button type="button" class="wa-menu-item bach-card-btn" onclick="closeWorkActionsMenu(); openAiForWork(${id})">
      ${aiHead}
      <span>BachGPT</span>
    </button>
    <button type="button" class="wa-menu-item add-prog-btn" onclick="openProgFromWorkMenu(event, ${id})">
      ${addSvg}
      <span>Programa</span>
    </button>
    <button type="button" class="wa-menu-item wa-edit-pdf-btn" onpointerup="triggerOpenPdfEditorFromMenu(event, ${id})" onclick="triggerOpenPdfEditorFromMenu(event, ${id})">
      ${cutSvg}
      <span>Editar PDF</span>
    </button>
    <button type="button" class="wa-menu-item wa-danger" onclick="closeWorkActionsMenu(); deleteScoreFromLibrary(${id})">
      ${trashSvg}
      <span>Eliminar</span>
    </button>
  `;
}

function returnToWorkActionsMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("workActionsMenu");
  if (!menu || activeWorkMenuScoreId == null) return;
  renderWorkActionsMenuItems(menu, activeWorkMenuScoreId);
}

function openWorkActionsMenu(e, scoreId) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("workActionsMenu");
  if (!menu) return;
  const id = Number(scoreId);
  activeWorkMenuScoreId = id;
  renderWorkActionsMenuItems(menu, id);

  const cardEl = e?.currentTarget?.closest(".folio-card");
  const mw = cardEl ? Math.max(165, Math.round(cardEl.getBoundingClientRect().width)) : 220;
  menu.style.width = `${mw}px`;

  menu.classList.remove("hidden");
  if (e && e.currentTarget) {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuH = Math.max(176, menu.offsetHeight || 176);
    const bottomSafeEdge = window.innerHeight - 76; // Evita quedar encima del cintillo inferior en celular
    const rawLeft = cardEl ? cardEl.getBoundingClientRect().left : rect.right - mw;
    const left = Math.max(12, Math.min(window.innerWidth - mw - 12, rawLeft));
    let top = rect.bottom + 6;
    if (top + menuH > bottomSafeEdge) {
      top = Math.max(12, rect.top - menuH - 6);
    }
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }
}

let modeTipTimer = null;

function startModeLongPress(btn) {
  endModeLongPress();
  modeTipTimer = setTimeout(() => {
    const tip = document.getElementById("modeLongPressTip");
    if (!tip || !btn) return;
    tip.textContent = btn.dataset.label || "";
    tip.classList.remove("hidden");
    const dockRect = document.getElementById("bottomNavDock")?.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    if (dockRect) {
      tip.style.left = `${btnRect.left - dockRect.left + btnRect.width / 2}px`;
    }
  }, 380);
}

function endModeLongPress() {
  if (modeTipTimer) {
    clearTimeout(modeTipTimer);
    modeTipTimer = null;
  }
  document.getElementById("modeLongPressTip")?.classList.add("hidden");
}

function closeWorkActionsMenu() {
  const menu = document.getElementById("workActionsMenu");
  if (!menu) return;
  menu.classList.add("hidden");
  menu.classList.remove("is-prog-mode");
}

function openProgFromWorkMenu(e, scoreId) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("workActionsMenu");
  if (!menu) return;
  pqTargetScoreIds = [Number(scoreId)];
  pqSelectedProgId = null;
  menu.classList.add("is-prog-mode");
  renderProgQuickListView(menu, true);
}

// ==========================================================================
// BACHGPT: CHATBOT FLOTANTE 8 BITS CON 3 MODALIDADES DIFERENCIADAS:
// 1. MODO GENERAL (En la pantalla principal: Teoría, Guía de la App, Consultas de todo tipo)
// 2. MODO OBRA PDF ESPECÍFICA (Al tocar el icono de BachGPT sobre una partitura PDF)
// 3. MODO NOTEBOOK DE TEORÍA (Tipo Gemini NotebookLM para libros de texto y tratados en PDF)
// ==========================================================================
let bachContextMode = "general"; // 'general' | 'work' | 'notebook'
let bachSelectedWorkId = 1;
// Por defecto BachGPT inicia en modo lectura silenciosa (sin voz activada) para no interrumpir al músico
let bachVoiceEnabled = false;
let bachSpeechRecognition = null;
let isBachListeningMic = false;
let bachMouthAnimTimer = null;
let currentBachAudioSource = null;
let bachAudioCtx = null;
let bachTtsFetchAbortController = null;
let bachGeneralInitialized = false;
let bachNotebookInitialized = false;
let bachLastInitializedWorkId = null;
let bachSpokenMessagesHistory = [];

// Configuración segura de Gemini API Key (sin claves expuestas en repositorio)
const GEMINI_KEY_STORAGE = "CADENZA_GEMINI_API_KEY";
function getGeminiApiKey() {
  return (
    localStorage.getItem(GEMINI_KEY_STORAGE) ||
    localStorage.getItem("ATRIL_GEMINI_KEY") ||
    ""
  ).trim();
}

function saveCustomGeminiApiKey(val) {
  const clean = (val || "").trim();
  try {
    if (clean) {
      localStorage.setItem(GEMINI_KEY_STORAGE, clean);
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
      localStorage.removeItem("ATRIL_GEMINI_KEY");
    }
  } catch (_) {}
}

function syncSettingsGeminiKeyInput() {
  const inp = document.getElementById("settingsGeminiKeyInput");
  if (inp) inp.value = getGeminiApiKey();
}

// Estado del Libro de Texto / Teoría (Modo NotebookLM)
let activeTheoryBook = {
  loaded: false,
  title: "Tratado de Armonía y Contrapunto (Ejemplo Base)",
  pages: 0,
  extractedText: "El contrapunto barroco se fundamenta en la independencia melódica y rítmica de las voces. En la conducción de voces se evitan las quintas y octavas paralelas, priorizando el movimiento contrario y oblicuo. El bajo continuo sostiene la arquitectura armónica mediante cifrados interválicos sobre la línea del bajo.",
  chapters: ["I. Conducción de Voces y Contrapunto", "II. El Bajo Continuo y Cifrados", "III. Ornamentación y Retórica Musical en el Barroco"]
};

// Generador de Retrato en Pixel Art de 8 Bits de J. S. Bach (con animación de boca al hablar)
function build8BitBachSvg(mouthOpen = false) {
  const mouthRow = mouthOpen ? "WWGGSSSEEESSGGWW" : "WWGGSSSMMMSSGGWW";
  const grid = [
    "....WWWWWWWW....",
    "..WWWWWWWWWWWW..",
    ".WWWWGGGGGGWWWW.",
    ".WWWGGGGGGGGWWW.",
    "WWWWGSSSSSSGWWWW",
    "WWWGSSSSSSSSGWWW",
    "WWWGSEESSSSEESWW",
    "WWWGSSSSSSSSGWWW",
    "WWGGSSSDDSSSGGWW",
    mouthRow,
    "WWWGGSSSSSSGGWWW",
    ".WWW.RRRRRR.WWW.",
    "..W.CRRRRRRC.W..",
    "...CCCRBBRCCC...",
    "..CCCCRBBRCCCC..",
    "..CCCCCRRCCCCC.."
  ];

  const palette = {
    W: "#f8fafc",
    G: "#cbd5e1",
    S: "#f3c69f",
    D: "#d99f72",
    E: "#1e1b18",
    M: "#9a5b42",
    R: "#ffffff",
    C: "#7c2d12",
    B: "#facc15"
  };

  let rects = "";
  for (let y = 0; y < 16; y++) {
    const row = grid[y];
    for (let x = 0; x < 16; x++) {
      const ch = row[x];
      if (ch !== "." && palette[ch]) {
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[ch]}" />`;
      }
    }
  }

  return `<svg viewBox="0 0 16 16" width="100%" height="100%" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

function setBach8BitTalkingAnimation(isTalking) {
  const fabIcon = document.getElementById("bachFabIcon");
  const headerAvatar = document.getElementById("bachHeaderAvatar");
  if (bachMouthAnimTimer) {
    clearInterval(bachMouthAnimTimer);
    bachMouthAnimTimer = null;
  }
  if (!isTalking) {
    const closedSvg = build8BitBachSvg(false);
    if (fabIcon) fabIcon.innerHTML = closedSvg;
    if (headerAvatar) headerAvatar.innerHTML = closedSvg;
    return;
  }
  let openState = false;
  bachMouthAnimTimer = setInterval(() => {
    openState = !openState;
    const frameSvg = build8BitBachSvg(openState);
    if (fabIcon) fabIcon.innerHTML = frameSvg;
    if (headerAvatar) headerAvatar.innerHTML = frameSvg;
  }, 165);
}

// SINTETIZADOR DE VOZ DE BACHGPT: Voz Grave con Acento Alemán Marcado hablando Español
function germanizeSpanishTextForSpeech(cleanText) {
  let txt = cleanText
    .replace(/<button[\s\S]*?<\/button>/gi, "")
    .replace(/<a[\s\S]*?<\/a>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[📜🎼🎸▶🏛️✦💬🔊🎙️↗🌐📖]/g, "")
    .replace(/BWV/g, "B V V")
    .replace(/\s+/g, " ")
    .trim();

  // Fonética hispano-germana marcada para el motor TTS
  txt = txt
    .replace(/\bBueno\b/gi, "Also")
    .replace(/\bHola\b/gi, "Guten Tag")
    .replace(/\bamigo\b/gi, "main Froind")
    .replace(/\bmein Freund\b/gi, "main Froind")
    .replace(/\bquerido colega\b/gi, "main líber Kollegue")
    .replace(/\bmein lieber Kollege\b/gi, "main líber Kollegue")
    .replace(/\bwunderbar\b/gi, "vúnderbar")
    .replace(/\bnatürlich\b/gi, "natúrlij")
    .replace(/\bKapellmeister\b/gi, "Kapélmaister")
    .replace(/\bsí\b/gi, "ja")
    .replace(/\bclaro\b/gi, "natúrlij")
    .replace(/\bverdad\b/gi, "ferdad")
    .replace(/\bvida\b/gi, "fida")
    .replace(/\bobra\b/gi, "óbrra")
    .replace(/\bguitarra\b/gi, "guitárrra");

  return txt;
}

// MOTOR DE VOZ NEURONAL REALISTA DE GEMINI (Voz unificada 'Charon', sin voz en off, sin cortes y con fade-out anti-hiss)
function stopActiveBachAudio() {
  if (bachTtsFetchAbortController) {
    try {
      bachTtsFetchAbortController.abort();
    } catch {}
    bachTtsFetchAbortController = null;
  }
  if (currentBachAudioSource) {
    try {
      currentBachAudioSource.onended = null;
      currentBachAudioSource.stop();
      currentBachAudioSource.disconnect();
    } catch {}
    currentBachAudioSource = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  setBach8BitTalkingAnimation(false);
}

function cleanHtmlForTtsReading(htmlMessage) {
  let clean = htmlMessage
    .replace(/<button[\s\S]*?<\/button>/gi, "")
    .replace(/<a[\s\S]*?<\/a>/gi, "")
    .replace(/<small[\s\S]*?<\/small>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[📜🎼🎸▶🏛️✦💬🔊🎙️↗🌐📖🧭📑🔑❓•]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Cortar únicamente en un punto final o cierre de oración completo para que NUNCA se corte a mitad de frase
  if (clean.length > 420) {
    const sub = clean.slice(0, 420);
    const lastEnd = Math.max(sub.lastIndexOf(". "), sub.lastIndexOf("! "), sub.lastIndexOf("? "));
    if (lastEnd > 80) {
      clean = sub.slice(0, lastEnd + 1);
    }
  }
  return clean;
}

// Fonética unificada sutil para que el modelo TTS de Gemini pronuncie SIEMPRE con el mismo acento alemán constante
// sin tener que meter instrucciones de "voz en off" dentro del texto
function applyConsistentGermanAccentPhonetics(text) {
  return text
    .replace(/\bBWV\b/g, "B V V")
    .replace(/\bGuten Tag\b/gi, "Gúten Tak")
    .replace(/\bmein lieber Kollege\b/gi, "main líber Kolégue")
    .replace(/\bmein Kollege\b/gi, "main Kolégue")
    .replace(/\bmein Freund\b/gi, "main Froind")
    .replace(/\bwunderbar\b/gi, "vúnderbar")
    .replace(/\bnatürlich\b/gi, "natúrlij")
    .replace(/\bWillkommen\b/gi, "Vilkómen")
    .replace(/\bKapellmeister\b/gi, "Kapélmaister")
    .replace(/\bLeipzig\b/gi, "Láiptsik")
    .replace(/\bBach\b/g, "Baj");
}

async function playPcm24kBase64(base64Pcm) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return false;
  if (!bachAudioCtx) {
    bachAudioCtx = new AudioCtx({ sampleRate: 24000 });
  }
  if (bachAudioCtx.state === "suspended") {
    await bachAudioCtx.resume();
  }

  const binaryStr = atob(base64Pcm);
  // Asegurar longitud par de bytes para Int16 PCM sin byte huérfano al final (que causa chasquido/hiss)
  const evenByteLen = binaryStr.length - (binaryStr.length % 2);
  const bytes = new Uint8Array(evenByteLen);
  for (let i = 0; i < evenByteLen; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const int16 = new Int16Array(bytes.buffer, 0, evenByteLen / 2);
  const totalSamples = int16.length;

  // Recortar cola final de ruido blanco/artefacto de fin de bloque del codec TTS (últimos ~45ms)
  // y aplicar fade-in (15ms) + fade-out suave (85ms) para eliminar el hiss/corto final al 100%
  const trimTailSamples = Math.min(1080, Math.floor(totalSamples * 0.04));
  const cleanLen = Math.max(1, totalSamples - trimTailSamples);
  const float32 = new Float32Array(cleanLen);

  const fadeInSamples = Math.min(360, Math.floor(cleanLen * 0.05));
  const fadeOutSamples = Math.min(2040, Math.floor(cleanLen * 0.12));

  for (let i = 0; i < cleanLen; i++) {
    let sample = int16[i] / 32768.0;
    if (i < fadeInSamples) {
      sample *= i / fadeInSamples;
    } else if (i > cleanLen - fadeOutSamples) {
      const remaining = cleanLen - i;
      sample *= remaining / fadeOutSamples;
    }
    float32[i] = sample;
  }

  const audioBuffer = bachAudioCtx.createBuffer(1, cleanLen, 24000);
  audioBuffer.getChannelData(0).set(float32);

  stopActiveBachAudio();
  const source = bachAudioCtx.createBufferSource();
  source.buffer = audioBuffer;

  // Filtro pasa-bajos suave a 7.5 kHz para eliminar siseo digital agudo ("hiss") de la síntesis PCM
  const lowpass = bachAudioCtx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 7500;

  source.connect(lowpass);
  lowpass.connect(bachAudioCtx.destination);

  currentBachAudioSource = source;
  setBach8BitTalkingAnimation(true);
  source.onended = () => {
    if (currentBachAudioSource === source) {
      currentBachAudioSource = null;
      setBach8BitTalkingAnimation(false);
    }
  };
  source.start(0);
  return true;
}

async function speakAsBachGpt(htmlMessage, forceReplay = false) {
  if (!bachVoiceEnabled && !forceReplay) return;
  const cleanText = cleanHtmlForTtsReading(htmlMessage);
  if (!cleanText) return;

  stopActiveBachAudio();
  const apiKey = getGeminiApiKey();

  // Enviar ÚNICAMENTE el texto puro del diálogo (CERO instrucciones de "Lee con voz...") para que nunca lea voz en off,
  // fijando un solo modelo TTS y la voz grave 'Charon' con fonética germana consistente
  if (apiKey) {
    const pureDialogueToRead = applyConsistentGermanAccentPhonetics(cleanText);
    const ttsModels = ["gemini-3.8-flash-lite-tts", "gemini-2.5-flash-preview-tts"];
    bachTtsFetchAbortController = new AbortController();

    for (const modelName of ttsModels) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: bachTtsFetchAbortController.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: pureDialogueToRead }] }],
              generationConfig: {
                temperature: 0.2,
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: "Charon"
                    }
                  }
                }
              }
            })
          }
        );

        if (resp.ok) {
          const data = await resp.json();
          const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          // Verificar que la ventana de BachGPT siga abierta antes de reproducir
          const win = document.getElementById("bachGptWindow");
          if (b64 && win && !win.classList.contains("hidden")) {
            await playPcm24kBase64(b64);
            return;
          }
          return;
        }
      } catch (err) {
        if (err && err.name === "AbortError") return;
        console.warn(`TTS model ${modelName} error:`, err);
      }
    }
  }

  // Respaldo offline si no hay internet
  const win = document.getElementById("bachGptWindow");
  if ("speechSynthesis" in window && win && !win.classList.contains("hidden")) {
    const utter = new SpeechSynthesisUtterance(germanizeSpanishTextForSpeech(cleanText));
    utter.lang = "es-MX";
    utter.pitch = 0.72;
    utter.rate = 0.90;
    utter.onstart = () => setBach8BitTalkingAnimation(true);
    utter.onend = () => setBach8BitTalkingAnimation(false);
    utter.onerror = () => setBach8BitTalkingAnimation(false);
    window.speechSynthesis.speak(utter);
  }
}

function replaySpecificBachMessage(msgIndex) {
  const htmlToReplay = bachSpokenMessagesHistory[msgIndex];
  if (htmlToReplay) {
    speakAsBachGpt(htmlToReplay, true);
  }
}

// MOTOR DE INTELIGENCIA REAL GEMINI 3.5 FLASH LITE (Responde en ~1.8 seg para cualquier consulta del mundo real)
async function askRealGeminiBachBrain(userQuestion, contextSystemPrompt) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const sysText =
    `Eres BachGPT, la encarnación en 8 bits de Johann Sebastian Bach dentro de la aplicación profesional de partituras 'Atril', creada para el guitarrista clásico mexicano Daniel Olmos. ` +
    `Hablas en español con un tono cálido, culto, sabio y apasionado, con breves expresiones alemanas ('¡Guten Tag, mein lieber Kollege!', '¡Ja, natürlich!', '¡Wunderbar!', 'mein Freund'). ` +
    `Responde directamente sobre cualquier compositor, obra, intérprete, historia, teoría, acordes o tema del mundo real que el usuario te pregunte. ` +
    `Sé conciso y sustancioso (máximo 3 a 4 oraciones claras) para que tu voz neuronal se reproduzca al instante. ` +
    contextSystemPrompt;

  // Modelos ordenados del más rápido (~1.8s) al respaldo
  const fastModels = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3-flash-preview"];

  for (const modelName of fastModels) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: sysText }] },
            contents: [{ role: "user", parts: [{ text: userQuestion }] }]
          })
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) return replyText;
      }
    } catch (e) {
      console.warn(`Gemini model ${modelName} error:`, e);
    }
  }
  return null;
}

function toggleBachVoiceOutput() {
  bachVoiceEnabled = !bachVoiceEnabled;
  const btn = document.getElementById("bachVoiceToggleBtn");
  if (btn) {
    btn.classList.toggle("active", bachVoiceEnabled);
    btn.textContent = bachVoiceEnabled ? "🔊 Voz" : "🔇 Muda";
  }
  if (!bachVoiceEnabled) {
    stopActiveBachAudio();
  } else {
    speakAsBachGpt("¡Ja, mein Freund! Mi voz grave desde Leipzig está lista.");
  }
}

// ENTRADA POR VOZ DEL USUARIO
function toggleBachSpeechRecognition() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById("bachMicBtn");
  const input = document.getElementById("bachUserInput");

  if (!SpeechRec) {
    appendBachMessage(
      "Ach, mein Freund! Este navegador no tiene habilitado el micrófono directo, pero puedes usar el micrófono del teclado de tu tablet o escribirme."
    );
    return;
  }

  if (isBachListeningMic && bachSpeechRecognition) {
    bachSpeechRecognition.stop();
    return;
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    setBach8BitTalkingAnimation(false);
  }

  bachSpeechRecognition = new SpeechRec();
  bachSpeechRecognition.lang = "es-MX";
  bachSpeechRecognition.interimResults = true;
  bachSpeechRecognition.continuous = false;

  bachSpeechRecognition.onstart = () => {
    isBachListeningMic = true;
    if (micBtn) micBtn.classList.add("listening");
    if (input) input.placeholder = "🎙️ Escuchando tu voz... habla ahora";
  };

  bachSpeechRecognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    if (input) input.value = transcript;
  };

  bachSpeechRecognition.onend = () => {
    isBachListeningMic = false;
    if (micBtn) micBtn.classList.remove("listening");
    if (input) {
      input.placeholder = "Habla con 🎙️ o escribe al Maestro...";
      if (input.value.trim().length > 0) {
        sendUserMessageToBach();
      }
    }
  };

  bachSpeechRecognition.onerror = () => {
    isBachListeningMic = false;
    if (micBtn) micBtn.classList.remove("listening");
    if (input) input.placeholder = "Habla con 🎙️ o escribe al Maestro...";
  };

  bachSpeechRecognition.start();
}

function initBachGptWidget() {
  const fabIcon = document.getElementById("bachFabIcon");
  const headerAvatar = document.getElementById("bachHeaderAvatar");
  const svg8Bit = build8BitBachSvg(false);
  if (fabIcon) fabIcon.innerHTML = svg8Bit;
  if (headerAvatar) headerAvatar.innerHTML = svg8Bit;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
  }
  populateBachWorkSelect();
}

function populateBachWorkSelect() {
  const sel = document.getElementById("bachWorkSelect");
  if (!sel) return;
  sel.innerHTML = scores
    .map((s) => `<option value="${s.id}" ${s.id === bachSelectedWorkId ? "selected" : ""}>${s.clean || s.title} (${s.composer.split("(")[0].trim()})</option>`)
    .join("");
}

// Al tocar el botón flotante principal de BachGPT abajo a la derecha -> Abre o cierra sin volver a repetir el saludo ya leído
function handleMainBachFabClick() {
  const win = document.getElementById("bachGptWindow");
  if (!win.classList.contains("hidden")) {
    toggleBachGptChat(false);
  } else {
    openBachGptGeneralMode(false);
  }
}

function toggleBachGptChat(forceState) {
  const win = document.getElementById("bachGptWindow");
  if (!win) return;
  const shouldOpen = typeof forceState === "boolean" ? forceState : win.classList.contains("hidden");
  if (shouldOpen) {
    win.classList.remove("hidden");
  } else {
    win.classList.add("hidden");
    // Cortar el audio y cualquier petición TTS de inmediato al cerrar la ventana
    stopActiveBachAudio();
  }
}

// ==========================================================================
// MODO 1 DE BACHGPT: MODO CONSULTA GENERAL (Pantalla Principal)
// ==========================================================================
function openBachGptGeneralMode(forceReset = false) {
  const wasAlreadyGeneral = bachContextMode === "general" && bachGeneralInitialized;
  bachContextMode = "general";
  toggleBachGptChat(true);

  document.getElementById("bctxGeneralBtn").classList.add("active");
  document.getElementById("bctxWorkBtn").classList.remove("active");
  document.getElementById("bctxNotebookBtn").classList.remove("active");

  document.getElementById("bachWorkSelectRow").classList.add("hidden");
  document.getElementById("bachNotebookBar").classList.add("hidden");
  document.getElementById("cadenzaAiLiveBanner")?.classList.add("hidden");

  document.getElementById("bachModeTag").textContent = "MODO GENERAL";
  document.getElementById("bachCurrentWorkLabel").textContent = "Consultas de todo tipo: Teoría, Historia, Técnica y Guía de la App";

  document.getElementById("bachQuickPrompts").innerHTML = `
    <button class="bach-chip" onclick="askBachGeneral('app-guide')">🧭 ¿Cómo funciona la App?</button>
    <button class="bach-chip" onclick="askBachGeneral('harmony')">🎼 Consulta de Armonía / Teoría</button>
    <button class="bach-chip" onclick="askBachGeneral('technique')">🎸 Técnica e Interpretación</button>
    <button class="bach-chip" onclick="openBachGptNotebookMode()">📖 Estudiar Libro PDF (Notebook)</button>
  `;

  // Si ya había sido abierto antes, NO borrar el historial ni volver a leer el saludo desde el inicio
  if (wasAlreadyGeneral && !forceReset) {
    return;
  }

  if (!bachGeneralInitialized || forceReset) {
    bachGeneralInitialized = true;
    const box = document.getElementById("bachChatMessages");
    box.innerHTML = "";
    appendBachMessage(
      `¡Guten Tag, mein lieber Kollege! Estás en mi <strong>Modo de Consulta General</strong>. Aquí puedes preguntarme de todo tipo de temas: <strong>teoría musical, análisis armónico, historia, técnica instrumental, búsqueda de videos/audios</strong> o pedirme que te explique <strong>cómo funciona cada modo de esta aplicación</strong>. También puedes abrir la pestaña <em>"Libro PDF"</em> para que estudiemos juntos un libro o tratado en PDF.`,
      false // No hablar automáticamente al abrir el saludo inicial
    );
  }
}

function askBachGeneral(topic) {
  if (topic === "app-guide") {
    appendUserMessage("Maestro Bach, explícame cómo funciona la aplicación y sus 4 modos.");
    setTimeout(() => {
      appendBachMessage(
        `<strong>🧭 Guía de la App por tu Kapellmeister:</strong><br>
        ¡Ja, natürlich! Esta aplicación tiene <strong>4 modos principales</strong> en la barra superior:<br>
        1. <strong>Biblioteca</strong>: Importa tus PDFs reales con <em>"＋ Importar PDF"</em>, alterna entre vista <em>Folio</em> y <em>Lista</em>, usa el taller <em>✂</em> para particionar páginas, o toca mi rostro de 8 bits en cada partitura para hablar exclusivamente de esa obra.<br>
        2. <strong>Estudio</strong>: Lee tu partitura en Hoja Parada, escribe con el lápiz óptico, usa <em>"✦ A Molde"</em> para volver limpio tu trazo y estampa sellos de digitación.<br>
        3. <strong>Concierto</strong>: Lectura limpia al 100% con <em>Escucha Activa</em> para cambio automático de página.<br>
        4. <strong>Editor</strong>: Dibuja notas a mano en el pentagrama y conviértelas a notación grabada de molde con tablatura.`
      );
    }, 220);
  } else if (topic === "harmony") {
    appendUserMessage("Háblame sobre análisis armónico, contrapunto y conducción de voces.");
    setTimeout(() => {
      appendBachMessage(
        `<strong>🎼 Teoría y Análisis Armónico:</strong><br>
        ¡Ach, el contrapunto es el orden del cosmos! Cuando analices cualquier obra, identifica primero la línea del <strong>bajo estructural</strong> y las cadencias que definen la arquitectura tonal. En la guitarra clásica, escuchar las voces internas (como en una fuga o sarabanda) te revelará qué notas deben sostenerse y cuáles deben respirar. ¿Sobre qué acorde, cadencia o forma musical quieres profundizar, mein Freund?`
      );
    }, 220);
  } else if (topic === "technique") {
    appendUserMessage("Dame consejos generales de estudio, técnica y preparación para concierto.");
    setTimeout(() => {
      appendBachMessage(
        `<strong>🎸 Sabiduría de Estudio y Técnica:</strong><br>
        ¡Ja! Como decía a mis alumnos en Leipzig: estudia primero a un tempo donde tu mente gobierne cada dedo sin tensión. Separa las voces cantando la línea superior mientras tocas el bajo, y registra tus digitaciones definitivas en el <strong>Modo Estudio</strong> para que tu memoria muscular sea infalible en el escenario.`
      );
    }, 220);
  }
}

// ==========================================================================
// MODO 2 DE BACHGPT: MODO OBRA PDF ESPECÍFICA (Al tocar el icono en una partitura)
// Conversación 100% dirigida a esa obra: compositor, estilo, época, contexto, links
// ==========================================================================
function openAiForWork(scoreId) {
  openBachGptSpecificWorkMode(scoreId);
}

function openBachGptSpecificWorkMode(scoreId) {
  const targetId = Number(scoreId) || (activeScore ? activeScore.id : 1);
  const isSameWorkAlreadyLoaded =
    bachContextMode === "work" && bachLastInitializedWorkId === targetId;

  bachContextMode = "work";
  bachSelectedWorkId = targetId;
  toggleBachGptChat(true);

  document.getElementById("bctxGeneralBtn").classList.remove("active");
  document.getElementById("bctxWorkBtn").classList.add("active");
  document.getElementById("bctxNotebookBtn").classList.remove("active");

  document.getElementById("bachWorkSelectRow").classList.remove("hidden");
  document.getElementById("bachNotebookBar").classList.add("hidden");
  document.getElementById("cadenzaAiLiveBanner")?.classList.remove("hidden");
  syncCadenzaAiLiveBanner(targetId);

  populateBachWorkSelect();
  const sel = document.getElementById("bachWorkSelect");
  if (sel) sel.value = String(bachSelectedWorkId);

  const work = scores.find((s) => s.id === bachSelectedWorkId) || scores[0];
  const title = work.clean || work.title;

  document.getElementById("bachModeTag").textContent = "OBRA ESPECÍFICA";
  document.getElementById("bachCurrentWorkLabel").textContent = `Enfocado en: ${title}`;

  document.getElementById("bachQuickPrompts").innerHTML = `
    <button class="bach-chip" onclick="askBachTopic('history')">📜 Contexto Histórico y Época</button>
    <button class="bach-chip" onclick="askBachTopic('theory')">🎼 Estilo y Análisis Armónico</button>
    <button class="bach-chip" onclick="askBachTopic('performance')">🎸 Técnica e Interpretación</button>
    <button class="bach-chip" onclick="askBachTopic('links')">▶ Videos, Audios y Versiones</button>
  `;

  // Si ya estaba cargada esta misma obra y solo reabrió la ventana, no repetir todo el mensaje desde el inicio
  if (isSameWorkAlreadyLoaded) {
    return;
  }

  bachLastInitializedWorkId = targetId;
  const box = document.getElementById("bachChatMessages");
  box.innerHTML = "";

  const linksHtml = work.aiData.links
    .map(
      (lnk) =>
        `<a href="${lnk.url}" target="_blank" rel="noopener noreferrer" class="bach-chat-link">${lnk.label} ↗</a>`
    )
    .join("");

  appendBachMessage(
    `¡Ja, mein lieber Kollege! Me has invocado directamente sobre la partitura de <strong>"${title}"</strong>.<br>
    • <strong>Compositor:</strong> ${work.composer}<br>
    • <strong>Época y Estilo:</strong> Periodo ${work.period} (${work.group})<br>
    • <strong>Contexto Histórico:</strong> ${work.aiData.history}<br><br>
    Aquí tienes <strong>referencias externas, videos, audios y distintas versiones de interpretación</strong>:<div class="bach-links-stack">${linksHtml}</div>`
  );
}

function changeBachConversationWork(scoreId) {
  openBachGptSpecificWorkMode(Number(scoreId));
}

function syncCadenzaAiLiveBanner(scoreId) {
  const summaryEl = document.getElementById("cadenzaAiLiveSummary");
  if (!summaryEl) return;
  const work = scores.find((s) => s.id === Number(scoreId)) || activeScore || scores[0];
  const isCurrentActive = activeScore && work && activeScore.id === work.id;
  const p = isCurrentActive ? pageNum || 1 : 1;
  const totalP = work?.pageCount || 10;
  const bpmVal = typeof metroBpm === "number" ? metroBpm : 76;
  const passages = (typeof rehearsalPassagesByScore === "object" && rehearsalPassagesByScore[String(work.id)]) || [];
  const statusStr = work?.studyStatus ? ` • ${work.studyStatus}` : "";
  const passageStr = passages.length > 0 ? ` • ${passages.length} pasaje(s)` : "";
  summaryEl.textContent = `Atril: Pág. ${p}/${totalP} • ♩ = ${bpmVal} BPM${statusStr}${passageStr}`;
}

function runCadenzaAiQuickAction(actionKey) {
  const work = scores.find((s) => s.id === Number(bachSelectedWorkId)) || activeScore || scores[0];
  const title = work.clean || work.title;
  const p = activeScore && activeScore.id === work.id ? pageNum || 1 : 1;
  const bpmVal = typeof metroBpm === "number" ? metroBpm : 76;
  const targetVal = typeof metroLadderTarget === "number" ? metroLadderTarget : bpmVal + 12;

  if (actionKey === "harmony") {
    appendUserMessage(`Analiza la armonía, estructura y forma de "${title}" (Pág. ${p}).`);
    setTimeout(() => {
      appendBachMessage(
        `<strong>🎼 Análisis Armónico y Formal — ${title} (Pág. ${p}):</strong><br>
        ${work.aiData?.theory || "Esta sección articula la tensión tonal entre el centro principal y las modulaciones intermedias."}<br>
        • <strong>Foco en Pág. ${p}:</strong> Identifica los puntos de cadencia y el movimiento del bajo antes de acelerar el tempo por encima de ♩ = ${bpmVal}.`
      );
    }, 200);
  } else if (actionKey === "studyplan") {
    appendUserMessage(`Crea un plan de estudio para hoy en "${title}" partiendo de ${bpmVal} BPM.`);
    setTimeout(() => {
      appendBachMessage(
        `<strong>📋 Plan de Estudio Contextual — ${title} (Pág. ${p}):</strong><br>
        1. <strong>Lectura consciente (5 min):</strong> Toca la Pág. ${p} a <strong>${Math.max(40, bpmVal - 12)} BPM</strong> cuidando relajación y balance de voces.<br>
        2. <strong>Escalera en Entrenador (10 min):</strong> Configura el Entrenador en modo <em>Escalera</em> de <strong>${bpmVal} → ${targetVal} BPM</strong> (+2 BPM cada 4 compases).<br>
        3. <strong>Pulso interno (5 min):</strong> Activa <em>Compás Mudo</em> (3 compases sonando / 1 en silencio) para afianzar la memoria rítmica.`
      );
    }, 200);
  } else if (actionKey === "fingering") {
    appendUserMessage(`Dame recomendaciones de digitación y articulación para "${title}" (${work.group}).`);
    setTimeout(() => {
      appendBachMessage(
        `<strong>🎸 Digitación y Articulación — ${title} (${work.group}):</strong><br>
        ${work.aiData?.performance || "Prioriza digitaciones que mantengan la resonancia de las voces extremas y eviten saltos bruscos de posición en cambios de compás."}<br>
        <em>Sugerencia:</em> Activa <strong>✎ Anotar → Sellos</strong> en la barra superior para estampar tus digitaciones definitivas sobre la Pág. ${p}.`
      );
    }, 200);
  } else if (actionKey === "exercise") {
    appendUserMessage(`Diseña un ejercicio técnico específico para dominar los pasajes de la Pág. ${p} en "${title}".`);
    setTimeout(() => {
      appendBachMessage(
        `<strong>⚡ Ejercicio Técnico Aplicado — ${title} (Pág. ${p}):</strong><br>
        • <strong>Variante rítmica con puntillo:</strong> En el panel <em>▶ Ensayar</em>, selecciona la subdivisión <strong>♩.♪ (Puntillo)</strong> a <strong>${Math.max(44, bpmVal - 8)} BPM</strong> y practica el pasaje invirtiendo el patrón largo-corto.<br>
        • <strong>Registro:</strong> Pulsa <em>"＋ Guardar pasaje"</em> en el panel de Ensayo para registrar la Pág. ${p} y medir tu evolución mañana.`
      );
    }, 200);
  }
}

// ==========================================================================
// MODO 3 DE BACHGPT: MODO NOTEBOOK DE TEORÍA (Tipo Gemini NotebookLM)
// Exclusivo para libros de texto, tratados e historia en PDF
// ==========================================================================
function openBachGptNotebookMode() {
  bachContextMode = "notebook";
  toggleBachGptChat(true);

  document.getElementById("bctxGeneralBtn").classList.remove("active");
  document.getElementById("bctxWorkBtn").classList.remove("active");
  document.getElementById("bctxNotebookBtn").classList.add("active");

  document.getElementById("bachWorkSelectRow").classList.add("hidden");
  document.getElementById("bachNotebookBar").classList.remove("hidden");
  document.getElementById("cadenzaAiLiveBanner")?.classList.add("hidden");

  document.getElementById("bachModeTag").textContent = "NOTEBOOK TEORÍA";
  document.getElementById("bachCurrentWorkLabel").textContent = "Estudio y Comprensión de Libros de Texto y Teoría";

  document.getElementById("bachQuickPrompts").innerHTML = `
    <button class="bach-chip" onclick="askBachNotebook('summary')">📑 Resumen Ejecutivo del Libro</button>
    <button class="bach-chip" onclick="askBachNotebook('concepts')">🔑 Conceptos Teóricos Clave</button>
    <button class="bach-chip" onclick="askBachNotebook('quiz')">❓ Guía de Estudio / Preguntas</button>
    <button class="bach-chip" onclick="document.getElementById('theoryBookPdfInput').click()">＋ Cargar otro Libro PDF</button>
  `;

  const box = document.getElementById("bachChatMessages");
  box.innerHTML = "";
  appendBachMessage(
    `¡Willkommen a mi <strong>Cuaderno de Estudio Teórico (estilo Gemini Notebook)</strong>! Esta sección es <strong>exclusiva para libros de texto, tratados de armonía, contrapunto o historia musical en PDF</strong>.<br><br>
    Sube cualquier PDF de texto con el botón <em>"＋ Subir PDF de Texto/Teoría"</em> de aquí arriba: yo leeré sus páginas completas para hacerte resúmenes, explicarte capítulos complejos, responder dudas sobre el texto y ayudarte a estudiarlo.`
  );
}

async function handleTheoryBookUpload(files) {
  if (!files || files.length === 0) return;
  const file = files[0];
  document.getElementById("nbLoadedBookName").textContent = `⏳ Analizando libro "${file.name}"...`;

  let extracted = "";
  let totalPages = 1;

  if (window.pdfjsLib) {
    try {
      const buf = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      totalPages = pdf.numPages;
      const maxPagesToRead = Math.min(totalPages, 15);
      const chunks = [];
      for (let p = 1; p <= maxPagesToRead; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const pageText = content.items.map((it) => it.str).join(" ");
        if (pageText.trim()) chunks.push(`[Pág. ${p}]: ${pageText.trim()}`);
      }
      extracted = chunks.join(" ");
    } catch (e) {
      console.warn("Error leyendo texto del libro PDF:", e);
    }
  }

  activeTheoryBook = {
    loaded: true,
    title: file.name.replace(/\.pdf$/i, ""),
    pages: totalPages,
    extractedText:
      extracted.length > 40
        ? extracted
        : `Libro de teoría e investigación musical "${file.name}" (${totalPages} páginas). Contiene fundamentos teóricos, análisis formal, historia y práctica interpretativa.`
  };

  document.getElementById("nbLoadedBookName").textContent = `📖 Libro activo: ${activeTheoryBook.title} (${totalPages} págs.)`;
  document.getElementById("theoryBookPdfInput").value = "";

  const previewSnippet = activeTheoryBook.extractedText.slice(0, 320);
  appendBachMessage(
    `¡Wunderbar! He leído y analizado tu libro de teoría <strong>"${activeTheoryBook.title}"</strong> (${totalPages} páginas).<br>
    <em>Extracto procesado:</em> "${previewSnippet}..."<br><br>
    ¿Quieres que te prepare un <strong>resumen general</strong>, que desglosemos sus <strong>conceptos teóricos clave</strong> o me haces una pregunta específica sobre su contenido?`
  );
}

function askBachNotebook(action) {
  const title = activeTheoryBook.title;
  const snippet = activeTheoryBook.extractedText.slice(0, 420);

  if (action === "summary") {
    appendUserMessage(`Hazme un resumen de estudio del libro "${title}".`);
    setTimeout(() => {
      appendBachMessage(
        `<strong>📑 Resumen de Estudio (Notebook) — ${title}:</strong><br>
        ¡Ja, mein Freund! Tras analizar el texto del documento, las ideas centrales son:<br>
        • <strong>Síntesis del contenido:</strong> ${snippet}...<br>
        • <strong>Aplicación práctica para el músico:</strong> Este tratado conecta la comprensión teórica de la estructura con la toma de decisiones interpretativas en el instrumento.`
      );
    }, 240);
  } else if (action === "concepts") {
    appendUserMessage(`¿Cuáles son los conceptos teóricos clave en "${title}"?`);
    setTimeout(() => {
      appendBachMessage(
        `<strong>🔑 Conceptos Clave Extraídos de "${title}":</strong><br>
        1. <strong>Arquitectura y Conducción Melódica:</strong> Relación entre tensión armónica y dirección del fraseo.<br>
        2. <strong>Sintaxis y Articulación:</strong> Cómo agrupar los motivos según las reglas estilísticas del texto.<br>
        3. <strong>Referencia textual directa:</strong> <em>"${activeTheoryBook.extractedText.slice(0, 220)}..."</em>`
      );
    }, 240);
  } else if (action === "quiz") {
    appendUserMessage(`Prepárame preguntas de repaso para estudiar "${title}".`);
    setTimeout(() => {
      appendBachMessage(
        `<strong>❓ Guía de Estudio y Repaso — ${title}:</strong><br>
        ¡Excelente método pedagógico! Reflexiona sobre estas 3 preguntas basadas en tu PDF:<br>
        1. ¿Cómo define el autor la relación entre la estructura armónica y el fraseo en este capítulo?<br>
        2. ¿Qué principios del texto puedes aplicar directamente a la obra que estás estudiando hoy en tu atril?<br>
        3. ¿Qué diferencias estilísticas señala el documento entre épocas?`
      );
    }, 240);
  }
}

function appendUserMessage(text) {
  const box = document.getElementById("bachChatMessages");
  if (!box) return;
  const msg = document.createElement("div");
  msg.className = "chat-bubble user-bubble";
  msg.textContent = text;
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}

function appendBachMessage(htmlContent, shouldSpeak = true) {
  const box = document.getElementById("bachChatMessages");
  if (!box) return;
  const msgIdx = bachSpokenMessagesHistory.length;
  bachSpokenMessagesHistory.push(htmlContent);

  const wrap = document.createElement("div");
  wrap.className = "bach-msg-row";
  wrap.innerHTML = `
    <div class="bach-mini-8bit">${build8BitBachSvg(false)}</div>
    <div class="chat-bubble bach-bubble">
      <div class="bach-bubble-content">${htmlContent}</div>
      <div class="bach-bubble-Controls">
        <button class="bach-replay-btn" onclick="replaySpecificBachMessage(${msgIdx})" title="Reproducir o volver a escuchar esta respuesta">
          🔊 Escuchar respuesta
        </button>
      </div>
    </div>
  `;
  box.appendChild(wrap);
  box.scrollTop = box.scrollHeight;
  if (shouldSpeak && bachVoiceEnabled) {
    speakAsBachGpt(htmlContent);
  }
}

function askBachTopic(topic) {
  const work = scores.find((s) => s.id === Number(bachSelectedWorkId)) || scores[0];
  const title = work.clean || work.title;

  if (topic === "history") {
    appendUserMessage(`Maestro Bach, cuéntame la historia y época de "${title}".`);
    setTimeout(() => {
      appendBachMessage(
        `<strong>📜 Contexto Histórico y Época (${title}):</strong><br>¡Ja, escucha bien, mein Freund! ${work.aiData.history}<br><small style="opacity:0.75">Periodo: ${work.period} • Compositor: ${work.composer}</small>`
      );
    }, 220);
  } else if (topic === "theory") {
    appendUserMessage(`¿Cuál es el estilo y análisis armónico de "${title}"?`);
    setTimeout(() => {
      appendBachMessage(
        `<strong>🎼 Estilo, Forma y Análisis Armónico (${title}):</strong><br>¡Ach, la arquitectura de esta obra es fascinante! ${work.aiData.theory}<br><small style="opacity:0.75">Dotación: ${work.group} • Extensión: ${work.pages}</small>`
      );
    }, 220);
  } else if (topic === "performance") {
    appendUserMessage(`¿Qué consejos técnicos y de digitación me das para "${title}"?`);
    setTimeout(() => {
      appendBachMessage(
        `<strong>🎸 Técnica e Interpretación (${title}):</strong><br>En el atril, mein Kollege: ${work.aiData.performance}<br>
        <button class="bach-inline-btn" onclick="openScoreById(${work.id}, 'study'); toggleBachGptChat(false);">
          ✎ Abrir "${title}" en Modo Estudio para anotar
        </button>`
      );
    }, 220);
  } else if (topic === "links") {
    appendUserMessage(`Muéstrame videos, audios y versiones de "${title}".`);
    const linksHtml = work.aiData.links
      .map(
        (lnk) =>
          `<a href="${lnk.url}" target="_blank" rel="noopener noreferrer" class="bach-chat-link">${lnk.label} ↗</a>`
      )
      .join("");
    setTimeout(() => {
      appendBachMessage(
        `<strong>▶ Videos, Audios de Referencia y Versiones (${title}):</strong><br>¡Ja, wunderbar! Aquí tienes enlaces externos directos a distintas interpretaciones y ediciones de <em>${title}</em>:<div class="bach-links-stack">${linksHtml}</div>`
      );
    }, 220);
  }
}

function appendBachLoadingBubble() {
  const box = document.getElementById("bachChatMessages");
  if (!box) return null;
  const wrap = document.createElement("div");
  wrap.className = "bach-msg-row";
  wrap.innerHTML = `
    <div class="bach-mini-8bit">${build8BitBachSvg(true)}</div>
    <div class="chat-bubble bach-bubble" style="opacity:0.75"><em>🎼 Consultando en Leipzig...</em></div>
  `;
  box.appendChild(wrap);
  box.scrollTop = box.scrollHeight;
  return wrap;
}

async function sendUserMessageToBach() {
  const input = document.getElementById("bachUserInput");
  const text = (input.value || "").trim();
  if (!text) return;
  input.value = "";
  appendUserMessage(text);

  const loadingEl = appendBachLoadingBubble();

  const lower = text.toLowerCase();

  // Preparar contexto para Gemini 2.5 Flash según el modo activo de BachGPT
  let ctxInstruction = "";
  let extraLinksHtml = "";

  if (bachContextMode === "notebook") {
    ctxInstruction =
      `Estás en el Modo Notebook de Teoría Musical (como Gemini NotebookLM), exclusivo para analizar libros de texto y tratados en PDF. ` +
      `El usuario está estudiando el libro "${activeTheoryBook.title}" (${activeTheoryBook.pages} páginas). ` +
      `Contenido extraído del PDF del usuario: "${activeTheoryBook.extractedText.slice(0, 3500)}". ` +
      `Responde basándote en ese libro y en la teoría musical académica.`;
  } else if (bachContextMode === "work") {
    const work = scores.find((s) => s.id === Number(bachSelectedWorkId)) || scores[0];
    const title = work.clean || work.title;
    const activeP = activeScore && activeScore.id === work.id ? pageNum || 1 : 1;
    const passages = (typeof rehearsalPassagesByScore === "object" && rehearsalPassagesByScore[String(work.id)]) || [];
    ctxInstruction =
      `Estás en Cadenza AI (personalidad Maestro BachGPT), enfocado en la obra "${title}" del compositor ${work.composer} (Periodo ${work.period}, dotación: ${work.group}). ` +
      `Contexto vivo del atril del músico: Página actual ${activeP} de ${work.pageCount || 10}, tempo de ensayo actual ♩ = ${metroBpm} BPM, estado de estudio: "${work.studyStatus || "En estudio"}", pasajes difíciles guardados: ${passages.length}. ` +
      `Datos de referencia de esta partitura: Historia: ${work.aiData.history} | Teoría: ${work.aiData.theory} | Interpretación: ${work.aiData.performance}.`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(work.composer.split("(")[0] + " " + title + " " + text)}`;
    extraLinksHtml = `<div class="bach-links-stack"><a href="${searchUrl}" target="_blank" rel="noopener noreferrer" class="bach-chat-link">▶ Buscar "${text}" sobre ${title} en YouTube ↗</a></div>`;
  } else {
    ctxInstruction =
      `Estás en el Modo de Consulta General en la pantalla principal de la app 'Atril'. ` +
      `Puedes responder consultas abiertas de teoría musical, armonía, contrapunto, historia, técnica de guitarra clásica u otros instrumentos, o explicar cómo funciona la aplicación 'Atril' (sus 4 modos: Biblioteca con Taller PDF, Estudio con trazo a molde y sellos, Concierto con seguimiento de audio, y Editor estilo StaffPad/Sibelius).`;
    const ytQuery = encodeURIComponent(text + " classical music guitar");
    extraLinksHtml = `<div class="bach-links-stack"><a href="https://www.youtube.com/results?search_query=${ytQuery}" target="_blank" rel="noopener noreferrer" class="bach-chat-link">▶ Ver referencias en YouTube sobre "${text}" ↗</a></div>`;
  }

  // Consultar a Gemini 3.5 Flash Lite en vivo (~1.8s)
  const aiResponse = await askRealGeminiBachBrain(text, ctxInstruction);
  if (loadingEl) loadingEl.remove();
  if (aiResponse) {
    const formatted = aiResponse
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
    appendBachMessage(`${formatted}${extraLinksHtml}`);
    return;
  }

  // Fallback local si no hay conexión
  if (loadingEl) loadingEl.remove();
  if (bachContextMode === "notebook") {
    appendBachMessage(
      `<strong>📖 Análisis en tu Libro "${activeTheoryBook.title}":</strong><br>
      Respecto a tu consulta <em>"${text}"</em>, basándome en el texto estudiado (<em>"${activeTheoryBook.extractedText.slice(0, 240)}..."</em>), este concepto es fundamental para comprender la estructura y la praxis musical.`
    );
  } else if (bachContextMode === "general") {
    if (lower.includes("app") || lower.includes("funciona") || lower.includes("modo")) {
      askBachGeneral("app-guide");
    } else {
      appendBachMessage(`¡Ja, excelente consulta general, mein Freund! Sobre <strong>"${text}"</strong>: recuerda siempre vincular el análisis estructural con la calidad del sonido y la claridad polifónica.${extraLinksHtml}`);
    }
  } else {
    const work = scores.find((s) => s.id === Number(bachSelectedWorkId)) || scores[0];
    const title = work.clean || work.title;
    appendBachMessage(`Hablando específicamente de tu partitura <strong>${title}</strong> de <em>${work.composer}</em>: ${work.aiData.performance}${extraLinksHtml}`);
  }
}

async function extractRealPdfTextAndMeta(pdfBytes) {
  if (!window.pdfjsLib || !pdfBytes) return { infoTitle: "", infoAuthor: "", page1Text: "" };
  try {
    const loadingTask = window.pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
    const pdfDoc = await loadingTask.promise;
    let infoTitle = "";
    let infoAuthor = "";
    try {
      const meta = await pdfDoc.getMetadata();
      infoTitle = (meta?.info?.Title || "").trim();
      infoAuthor = (meta?.info?.Author || "").trim();
    } catch (_) {}

    let page1Text = "";
    try {
      const page1 = await pdfDoc.getPage(1);
      const tc = await page1.getTextContent();
      page1Text = tc.items.map((it) => it.str).join(" ").replace(/\s+/g, " ").trim().slice(0, 700);
    } catch (_) {}

    return { infoTitle, infoAuthor, page1Text };
  } catch (_) {
    return { infoTitle: "", infoAuthor: "", page1Text: "" };
  }
}

async function normalizePdfMetadataWithGemini(rawName, pdfMeta, thumbDataUrl) {
  const apiKey = typeof getGeminiApiKey === "function" ? getGeminiApiKey() : "";
  if (!apiKey) return null;

  const prompt = `Eres un archivista de partituras musicales clásicas. Normaliza los metadatos de este archivo PDF real observando su portada/página 1 (imagen adjunta si está disponible), su texto y su nombre original.
Nombre de archivo original: "${rawName}"
Metadatos PDF Title: "${pdfMeta.infoTitle}" | Author: "${pdfMeta.infoAuthor}"
Texto extraído de la página 1: "${pdfMeta.page1Text}"

Responde ÚNICAMENTE con un JSON válido (sin markdown ni texto extra) con estas 4 claves:
{
  "title": "Título limpio y formal de la obra (sin .pdf, sin códigos IMSLP, sin guiones bajos)",
  "composer": "Nombre completo del compositor (si se conoce, ej. J. S. Bach (1685–1750))",
  "period": "uno de: Renacimiento | Barroco | Clasicismo | Romanticismo | Siglo XX",
  "group": "uno de: Guitarra Sola | Dúo / Cámara | Guitarra y Orquesta | Otro Instrumento"
}`;

  const parts = [{ text: prompt }];
  if (thumbDataUrl && thumbDataUrl.startsWith("data:image/")) {
    const base64Data = thumbDataUrl.split(",")[1];
    if (base64Data) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
    }
  }

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { temperature: 0.15, maxOutputTokens: 250 }
        })
      }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed && parsed.title) return parsed;
    return null;
  } catch (_) {
    return null;
  }
}

async function normalizeSingleScoreRecord(s) {
  if (!s) return false;
  if (!s.isRealPdf) {
    if (s.clean && s.title !== s.clean) {
      s.title = s.clean;
      s.raw = false;
      return true;
    }
    const fallback = inferMusicMetadataFromFilename(s.rawFilename || s.title);
    if (fallback.title && fallback.title !== s.title) {
      s.title = fallback.title;
      s.clean = fallback.title;
    }
    if (fallback.composer && (!s.composer || s.composer === "Compositor por clasificar")) {
      s.composer = fallback.composer;
    }
    s.raw = false;
    return true;
  }

  const rawName = s.rawFilename || s.title;
  const pdfMeta = await extractRealPdfTextAndMeta(s.pdfBytes);
  const aiMeta = await normalizePdfMetadataWithGemini(rawName, pdfMeta, s.thumbDataUrl);
  const fallback = inferMusicMetadataFromFilename(rawName);

  s.title = (aiMeta && aiMeta.title) ? aiMeta.title : fallback.title;
  s.clean = s.title;
  if (aiMeta && aiMeta.composer) s.composer = aiMeta.composer;
  else if (fallback.composer && s.composer === "Compositor por clasificar") s.composer = fallback.composer;

  const validPeriods = ["Renacimiento", "Barroco", "Clasicismo", "Romanticismo", "Siglo XX"];
  if (aiMeta && validPeriods.includes(aiMeta.period)) s.period = aiMeta.period;

  const validGroups = ["Guitarra Sola", "Dúo / Cámara", "Guitarra y Orquesta", "Otro Instrumento"];
  if (aiMeta && validGroups.includes(aiMeta.group)) s.group = aiMeta.group;

  s.raw = false;
  await saveRealPdfToDb(s);
  return true;
}

async function normalizeSingleScoreWithAI(scoreId) {
  const s = scores.find((item) => item.id === Number(scoreId));
  if (!s) return;
  showPilotBanner(`✦ Normalizando "${s.clean || s.title}"...`);
  await normalizeSingleScoreRecord(s);
  renderLibrary();
  renderSetlistDrawer();
  showPilotBanner(`✓ "${s.clean || s.title}" normalizada (${s.composer}).`);
}

async function cleanLibraryWithAI() {
  showPilotBanner("✦ Analizando archivos PDF de tu biblioteca...");
  let updatedCount = 0;

  for (const s of scores) {
    if ((s.raw && s.clean && !s.isRealPdf) || s.isRealPdf) {
      const changed = await normalizeSingleScoreRecord(s);
      if (changed) updatedCount++;
    }
  }

  renderLibrary();
  renderSetlistDrawer();
  showPilotBanner(`✓ ${updatedCount} ${updatedCount === 1 ? "obra normalizada" : "obras normalizadas"} y guardadas.`);
}

function closePdfModal(e) {
  requestClosePdfModal(e);
}

function triggerPdfToast(msg) {
  const el = document.getElementById("pdfToast");
  if (!el) return;
  clearTimeout(pdfToastClearTimer);
  el.textContent = msg || "";
  el.classList.toggle("is-visible", Boolean(msg));
  if (msg) {
    pdfToastClearTimer = setTimeout(() => {
      el.classList.remove("is-visible");
    }, 2800);
  }
}

// ==========================================================================
// GENERADOR SVG DEMO (Para obras sin PDF real)
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

// ==========================================================================
// 2. MODO ESTUDIO
// ==========================================================================
const stampProfiles = {
  // DINÁMICAS (Intensidad y volumen sonoro exclusivamente)
  dynamics: [
    "ppp", "pp", "p", "mp", "mf", "f", "ff", "fff",
    "sfz", "sfp", "fp", "rfz",
    "<", ">", "sub. p", "sub. f"
  ],

  // AGÓGICA Y TEMPO (Velocidad, pulso y modificaciones de tiempo)
  agogic: [
    "rit.", "rall.", "accel.", "a tempo",
    "meno mosso", "più mosso", "rubato", "ad lib.",
    "𝄐", "𝄑", "//", "’",
    "𝄋", "𝄌", "D.C.", "Fine"
  ],

  // EXPRESIÓN Y CARÁCTER
  expression: [
    "dolce", "espress.", "cantab.", "legato",
    "pesante", "leggiero", "sotto voce", "marcato"
  ],

  // ARTICULACIÓN Y ACENTOS
  articulation: [
    "•", "▾", "—", "•—",
    ">", "⋀", "tr~", "𝆝", "𝆞", "gliss."
  ],

  // FAMILIAS INSTRUMENTALES
  strings: ["⨅", "⋁", "0", "1", "2", "3", "4", "I Pos.", "II Pos.", "III Pos.", "IV Pos.", "V Pos.", "pizz.", "arco", "con sord.", "◇"],
  guitar: ["p", "i", "m", "a", "e", "1", "2", "3", "4", "0", "C.I", "C.II", "C.III", "C.IV", "C.V", "C.VI", "C.VII", "C.VIII", "C.IX", "½C", "①", "②", "③", "④", "⑤", "⑥", "rasg.", "apoy.", "tir.", "tamb."],
  piano: ["Ped.", "^", "*", "u.c.", "t.c.", "m.d.", "m.s.", "1", "2", "3", "4", "5"],
  winds: ["’", "O", "T-K", "frull.", "+", "○"]
};

let studyTool = "pen";
let inkColor = "#23426e";
let autoMold = false;
let selectedStamp = null;

let eraserMode = "stroke"; // 'stroke' | 'pixel'
let strictPenMode = false;
let fingerDrawAllowed = false;

function setEraserMode(mode, btn) {
  eraserMode = mode === "pixel" ? "pixel" : "stroke";
  document.getElementById("btnEraserStroke")?.classList.toggle("active", eraserMode === "stroke");
  document.getElementById("btnEraserPixel")?.classList.toggle("active", eraserMode === "pixel");
  if (btn) btn.classList.add("active");
}

function setFingerDrawAllowed(allowed, btn) {
  fingerDrawAllowed = Boolean(allowed);
  if (allowed) strictPenMode = false;
  document.getElementById("btnPalmAuto")?.classList.toggle("active", !fingerDrawAllowed);
  document.getElementById("btnPalmFinger")?.classList.toggle("active", fingerDrawAllowed);
  if (btn) btn.classList.add("active");
}

function switchStampTab(key, btn) {
  const sel = document.getElementById("stampCategorySelect");
  if (sel && sel.value !== key) sel.value = key;
  const grid = document.getElementById("stampGrid");
  if (!grid) return;
  grid.innerHTML = (stampProfiles[key] || [])
    .map((st) => {
      const activeCls = selectedStamp === st && studyTool === "stamp" ? " active" : "";
      const longAttr = st.length >= 6 ? ' data-long="true"' : "";
      const safe = st.replace(/'/g, "\\'");
      return `<button type="button" class="stamp-btn${activeCls}"${longAttr} onclick="chooseStamp('${safe}', this)">${st}</button>`;
    })
    .join("");
}

function toggleStampPopover(forceState) {
  document.getElementById("brushPopover")?.classList.add("hidden");
  const pop = document.getElementById("stampPopover");
  if (!pop) return;
  const show = typeof forceState === "boolean" ? forceState : pop.classList.contains("hidden");
  pop.classList.toggle("hidden", !show);
  document.getElementById("btnStamps")?.classList.toggle("active", show);
  if (!show && studyTool === "stamp") {
    setStudyTool("pen");
  }
}

function chooseStamp(st, btn) {
  selectedStamp = st;
  studyTool = "stamp";
  document.querySelectorAll("#stampGrid .stamp-btn").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  // Multi-Stamp: mantener la paleta abierta para estampar continuamente
  resetToolRailInactivityTimer();
}

function setStampInk(color, btn) {
  inkColor = color;
  document.querySelectorAll(".stamp-ink-dot").forEach((d) => d.classList.toggle("active", d === btn));
  const dot = document.getElementById("brushSwatchDot");
  if (dot) dot.style.background = color;
  resetToolRailInactivityTimer();
}

function initStampPaletteDrag() {
  const pop = document.getElementById("stampPopover");
  const header = document.getElementById("stampPaletteHeader");
  if (!pop || !header) return;

  let isDragging = false;
  let startX = 0, startY = 0;
  let initialLeft = 0, initialTop = 0;

  header.onpointerdown = (e) => {
    if (e.target.closest("button")) return;
    isDragging = true;
    try { header.setPointerCapture(e.pointerId); } catch (_) {}

    const rect = pop.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    startX = e.clientX;
    startY = e.clientY;
    e.preventDefault();
  };

  header.onpointermove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const newX = Math.max(10, Math.min(window.innerWidth - pop.offsetWidth - 10, initialLeft + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - pop.offsetHeight - 10, initialTop + dy));

    pop.style.left = `${newX}px`;
    pop.style.top = `${newY}px`;
    pop.style.right = "auto";
    pop.style.bottom = "auto";
    pop.style.transform = "none";
  };

  const stopDrag = (e) => {
    if (isDragging) {
      isDragging = false;
      try { header.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  };

  header.onpointerup = stopDrag;
  header.onpointercancel = stopDrag;
}

let brushWidth = 2.4;
let brushOpacity = 1.0;
const ANNOTATIONS_STORAGE_KEY = "cadenza_annotations_v1";
const studyPageStrokes = {};
const studyPageMoldItems = {};
const studyUndoStacks = {};
const studyRedoStacks = {};
const studyBookmarks = {};

let activeAnnotationOffset = 0; // 0 = folio izquierdo (pageNum), 1 = folio derecho (pageNum + 1)

function getStudyPageKey(pageOffset = activeAnnotationOffset) {
  const targetPage = Math.max(1, (pageNum || 1) + (pageOffset || 0));
  return `${activeScore ? activeScore.id : 1}:${targetPage}`;
}

function getFolioElements(pageOffset = 0) {
  const isRight = pageOffset === 1;
  return {
    pageOffset: isRight ? 1 : 0,
    wrap: document.getElementById(isRight ? "performerWrapRight" : "performerWrap"),
    transformLayer: document.getElementById(isRight ? "folioTransformLayerRight" : "folioTransformLayer"),
    canvas: document.getElementById(isRight ? "performerCanvasRight" : "performerCanvas"),
    moldLayer: document.getElementById(isRight ? "performerMoldLayerRight" : "performerMoldLayer")
  };
}

async function loadStudyAnnotationsFromStorage() {
  // 1. Cargar primero de localStorage por retrocompatibilidad inmediata
  try {
    const raw = localStorage.getItem(ANNOTATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.strokes) Object.assign(studyPageStrokes, parsed.strokes);
      if (parsed && parsed.molds) Object.assign(studyPageMoldItems, parsed.molds);
    }
  } catch (_) {}

  // 2. Hidratar desde IndexedDB (Fase D - E2: capacidad ilimitada de páginas anotadas)
  try {
    const db = await openPilotDb();
    await new Promise((resolve) => {
      const tx = db.transaction(ANNOTATIONS_IDB_STORE, "readonly");
      const req = tx.objectStore(ANNOTATIONS_IDB_STORE).get("master_annotations_v1");
      req.onsuccess = () => {
        const record = req.result;
        if (record) {
          if (record.strokes) Object.assign(studyPageStrokes, record.strokes);
          if (record.molds) Object.assign(studyPageMoldItems, record.molds);
        } else if (Object.keys(studyPageStrokes).length > 0 || Object.keys(studyPageMoldItems).length > 0) {
          // Migrar automáticamente datos existentes de localStorage hacia IndexedDB
          persistStudyAnnotationsToStorage();
        }
        resolve();
      };
      req.onerror = () => resolve();
    });
  } catch (_) {}
}

function persistStudyAnnotationsToStorage() {
  const payload = {
    id: "master_annotations_v1",
    strokes: studyPageStrokes,
    molds: studyPageMoldItems,
    updatedAt: Date.now()
  };

  // Guardar en IndexedDB sin límite de 5MB
  openPilotDb()
    .then((db) => {
      const tx = db.transaction(ANNOTATIONS_IDB_STORE, "readwrite");
      tx.objectStore(ANNOTATIONS_IDB_STORE).put(payload);
    })
    .catch(() => {});

  // Espejo ligero en localStorage mientras quepa en cuota
  try {
    localStorage.setItem(
      ANNOTATIONS_STORAGE_KEY,
      JSON.stringify({ strokes: studyPageStrokes, molds: studyPageMoldItems })
    );
  } catch (_) {}
}

let activePerformerContext = "read"; // 'read' | 'annotate' | 'rehearse' | 'listen' | 'ai' | 'more'

function syncPerformerContextButtonsUI() {
  const map = {
    annotate: "btnCtxAnnotate",
    rehearse: "btnCtxRehearse",
    listen: "btnCtxListen",
    ai: "btnCtxAi",
    more: "btnCtxMore"
  };
  Object.entries(map).forEach(([ctxKey, btnId]) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.toggle("active", activePerformerContext === ctxKey);
  });
  const performer = document.getElementById("mode-performer");
  if (performer) {
    performer.dataset.activeContext = activePerformerContext;
  }
}

function closePerformerMorePopover() {
  document.getElementById("performerMorePopover")?.classList.add("hidden");
  if (activePerformerContext === "more") {
    activePerformerContext = "read";
    syncPerformerContextButtonsUI();
  }
}

function closePerformerListenPopover() {
  document.getElementById("performerListenPopover")?.classList.add("hidden");
  if (activePerformerContext === "listen") {
    activePerformerContext = "read";
    syncPerformerContextButtonsUI();
  }
}

function openCurrentScoreInPdfWorkshop() {
  closePerformerMorePopover();
  const sId = activeScore ? activeScore.id : 1;
  switchMode("library");
  setTimeout(() => openPdfModalById(sId), 80);
}

function toggleAudioFollowFromContext() {
  toggleAudioFollow();
  const btn = document.getElementById("btnStudyAudioFollowToggle");
  if (btn) {
    btn.textContent = audioTimer ? "Detener Escucha Activa" : "Activar Escucha Activa";
    btn.classList.toggle("active", Boolean(audioTimer));
  }
}

function togglePerformerContext(ctxName, e) {
  if (e) e.stopPropagation();

  // Si toca el contexto ya activo, vuelve a Modo Lectura limpia
  const isTogglingOff = activePerformerContext === ctxName;
  const nextCtx = isTogglingOff ? "read" : ctxName;

  // Cerrar paneles secundarios antes de abrir el nuevo contexto
  document.getElementById("performerListenPopover")?.classList.add("hidden");
  document.getElementById("performerMorePopover")?.classList.add("hidden");
  document.getElementById("brushPopover")?.classList.add("hidden");
  document.getElementById("stampPopover")?.classList.add("hidden");

  if (nextCtx !== "annotate") {
    const rail = document.getElementById("performerToolRail");
    if (rail && !rail.classList.contains("rail-collapsed")) {
      toggleToolRailCollapse(false);
    }
  }
  if (nextCtx !== "rehearse") {
    document.getElementById("metronomePopover")?.classList.add("hidden");
    closeTunerPopoverAndStop();
  }
  if (nextCtx !== "ai") {
    toggleBachGptChat(false);
  }

  activePerformerContext = nextCtx;
  syncPerformerContextButtonsUI();

  if (nextCtx === "annotate") {
    toggleToolRailCollapse(true);
  } else if (nextCtx === "rehearse") {
    syncRehearsalContextBanner();
    document.getElementById("metronomePopover")?.classList.remove("hidden");
  } else if (nextCtx === "listen") {
    const btn = document.getElementById("btnStudyAudioFollowToggle");
    if (btn) {
      btn.textContent = audioTimer ? "Detener Escucha Activa" : "Activar Escucha Activa";
      btn.classList.toggle("active", Boolean(audioTimer));
    }
    document.getElementById("performerListenPopover")?.classList.remove("hidden");
  } else if (nextCtx === "ai") {
    const sId = activeScore ? activeScore.id : 1;
    openBachGptSpecificWorkMode(sId);
    toggleBachGptChat(true);
  } else if (nextCtx === "more") {
    document.getElementById("performerMorePopover")?.classList.remove("hidden");
  }

  const fl = document.getElementById("performerFooterLeft");
  if (fl && performanceMode === "study") {
    const ctxLabels = {
      read: "Modo Lectura • Toca laterales o usa pedal para pasar página",
      annotate: "Modo Anotar • Pluma y sellos activos",
      rehearse: `Modo Ensayo • ♩ = ${metroBpm} BPM`,
      listen: "Modo Escucha • Seguimiento de partitura",
      ai: "Cadenza AI • Asistencia musical contextual",
      more: "Opciones de partitura"
    };
    fl.textContent = ctxLabels[nextCtx] || ctxLabels.read;
  }
}

function isWritingAllowed() {
  const performer = document.getElementById("mode-performer");
  const railOpen = Boolean(performer && performer.classList.contains("rail-open-drawing"));
  if (performanceMode === "study") {
    return railOpen || activePerformerContext === "annotate";
  }
  return railOpen;
}

let committedLayerCanvas = null;
let committedLayerCanvasRight = null;

function ensureCommittedLayer(width, height, pageOffset = 0) {
  if (pageOffset === 1) {
    if (!committedLayerCanvasRight) committedLayerCanvasRight = document.createElement("canvas");
    if (committedLayerCanvasRight.width !== width || committedLayerCanvasRight.height !== height) {
      committedLayerCanvasRight.width = width;
      committedLayerCanvasRight.height = height;
    }
    return committedLayerCanvasRight;
  }
  if (!committedLayerCanvas) committedLayerCanvas = document.createElement("canvas");
  if (committedLayerCanvas.width !== width || committedLayerCanvas.height !== height) {
    committedLayerCanvas.width = width;
    committedLayerCanvas.height = height;
  }
  return committedLayerCanvas;
}

function calcDynamicWidth(baseWidth, pressure) {
  const p = Math.max(0.05, Math.min(1.0, pressure || 0.5));
  return baseWidth * (0.25 + 1.5 * p);
}

function applyStrokeContextStyle(ctx, stroke) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (stroke.tool === "marker") {
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = stroke.color || "#d4af37";
    ctx.strokeStyle = stroke.color || "#d4af37";
    return Math.max(14, (stroke.baseWidth || 2.4) * 5.5);
  }
  if (stroke.tool === "pencil") {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = Math.min(0.7, (stroke.opacity ?? 1) * 0.7);
    ctx.fillStyle = stroke.color || "#201c19";
    ctx.strokeStyle = stroke.color || "#201c19";
    return (stroke.baseWidth || 2.0) * 0.85;
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = Math.min(1.0, Math.max(0.1, stroke.opacity ?? 1.0));
  ctx.fillStyle = stroke.color || "#23426e";
  ctx.strokeStyle = stroke.color || "#23426e";
  return stroke.baseWidth || 2.4;
}

function subdivideStrokeSpine(pts) {
  if (pts.length <= 2) return pts;
  const spine = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const m1x = (p0.x + p1.x) / 2;
    const m1y = (p0.y + p1.y) / 2;
    const m1p = (p0.p + p1.p) / 2;
    const m2x = (p1.x + p2.x) / 2;
    const m2y = (p1.y + p2.y) / 2;
    const m2p = (p1.p + p2.p) / 2;

    const dist = Math.hypot(m2x - m1x, m2y - m1y);
    const steps = Math.max(2, Math.min(12, Math.ceil(dist / 2.5)));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const it = 1 - t;
      spine.push({
        x: it * it * m1x + 2 * it * t * p1.x + t * t * m2x,
        y: it * it * m1y + 2 * it * t * p1.y + t * t * m2y,
        p: it * it * m1p + 2 * it * t * p1.p + t * t * m2p
      });
    }
  }
  spine.push(pts[pts.length - 1]);
  return spine;
}

function renderStrokeToCtx(ctx, stroke) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;
  const baseW = applyStrokeContextStyle(ctx, stroke);

  if (pts.length === 1) {
    const r = calcDynamicWidth(baseW, pts[0].p) / 2;
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    return;
  }

  // Subdividir en espina Bézier continua y dibujar cinta poligonal única (cero círculos)
  const spine = subdivideStrokeSpine(pts);
  const leftPts = [];
  const rightPts = [];

  for (let i = 0; i < spine.length; i++) {
    const cur = spine[i];
    const prev = spine[Math.max(0, i - 1)];
    const next = spine[Math.min(spine.length - 1, i + 1)];
    let dx = next.x - prev.x;
    let dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const nx = -dy;
    const ny = dx;
    const hw = calcDynamicWidth(baseW, cur.p) / 2;
    leftPts.push({ x: cur.x + nx * hw, y: cur.y + ny * hw });
    rightPts.push({ x: cur.x - nx * hw, y: cur.y - ny * hw });
  }

  ctx.beginPath();
  ctx.moveTo(leftPts[0].x, leftPts[0].y);
  for (let i = 1; i < leftPts.length; i++) {
    ctx.lineTo(leftPts[i].x, leftPts[i].y);
  }
  const endCur = spine[spine.length - 1];
  const endR = calcDynamicWidth(baseW, endCur.p) / 2;
  const endAngle = Math.atan2(
    rightPts[rightPts.length - 1].y - endCur.y,
    rightPts[rightPts.length - 1].x - endCur.x
  );
  ctx.arc(endCur.x, endCur.y, endR, endAngle + Math.PI, endAngle, false);

  for (let i = rightPts.length - 1; i >= 0; i--) {
    ctx.lineTo(rightPts[i].x, rightPts[i].y);
  }
  const startCur = spine[0];
  const startR = calcDynamicWidth(baseW, startCur.p) / 2;
  const startAngle = Math.atan2(leftPts[0].y - startCur.y, leftPts[0].x - startCur.x);
  ctx.arc(startCur.x, startCur.y, startR, startAngle + Math.PI, startAngle, false);

  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function redrawSingleFolioCanvas(pageOffset = 0) {
  const { canvas } = getFolioElements(pageOffset);
  if (!canvas || canvas.width === 0 || canvas.height === 0) return;
  const ctx = canvas.getContext("2d");
  const cache = ensureCommittedLayer(canvas.width, canvas.height, pageOffset);
  const cCtx = cache.getContext("2d");
  cCtx.clearRect(0, 0, cache.width, cache.height);

  const key = getStudyPageKey(pageOffset);
  const list = studyPageStrokes[key] || [];
  for (let i = 0; i < list.length; i++) {
    renderStrokeToCtx(cCtx, list[i]);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(cache, 0, 0);
}

function redrawStudyCanvas() {
  redrawSingleFolioCanvas(0);
  redrawSingleFolioCanvas(1);
}

function renderSingleMoldLayer(pageOffset = 0) {
  const { moldLayer } = getFolioElements(pageOffset);
  if (!moldLayer) return;
  moldLayer.innerHTML = "";
  const key = getStudyPageKey(pageOffset);
  const items = studyPageMoldItems[key] || [];
  items.forEach((item) => {
    const el = createEditorialMoldElement(item, pageOffset);
    moldLayer.appendChild(el);
  });
}

function renderMoldLayer() {
  renderSingleMoldLayer(0);
  renderSingleMoldLayer(1);
}

let selectedMoldId = null;

function selectMoldItem(moldId) {
  selectedMoldId = moldId;
  document.querySelectorAll("#performerMoldLayer .mold-item, #performerMoldLayerRight .mold-item").forEach((el) => {
    el.classList.toggle("selected-mold", el.dataset.moldId === moldId);
  });
}

function createEditorialMoldElement(item, pageOffset = 0) {
  const el = document.createElement("div");
  el.className = "mold-item editorial-note";
  if (selectedMoldId === item.id) el.classList.add("selected-mold");
  el.dataset.moldId = item.id;
  el.dataset.pageOffset = String(pageOffset);
  el.style.left = `${item.x}px`;
  el.style.top = `${item.y}px`;
  el.style.color = item.color || inkColor;
  el.style.fontSize = `${item.fontSize || 17.5}px`;

  const textSpan = document.createElement("span");
  textSpan.className = "mold-text-span";
  textSpan.textContent = item.text;
  el.appendChild(textSpan);

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "mold-delete-btn";
  delBtn.title = "Eliminar texto";
  delBtn.setAttribute("aria-label", "Eliminar texto");
  delBtn.textContent = "✕";
  delBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
  delBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    activeAnnotationOffset = pageOffset;
    pushStudyUndoSnapshot(pageOffset);
    const key = getStudyPageKey(pageOffset);
    studyPageMoldItems[key] = (studyPageMoldItems[key] || []).filter((m) => m.id !== item.id);
    if (selectedMoldId === item.id) selectedMoldId = null;
    renderMoldLayer();
    saveStudyAnnotationsForCurrentPage();
  });
  el.appendChild(delBtn);

  const resizeHandle = document.createElement("span");
  resizeHandle.className = "mold-resize-handle";
  resizeHandle.title = "Redimensionar texto";
  resizeHandle.textContent = "⤡";
  let resizing = false;
  let resizeStartY = 0;
  let origFontSize = item.fontSize || 17.5;

  resizeHandle.addEventListener("pointerdown", (e) => {
    if (!isWritingAllowed()) return;
    e.stopPropagation();
    resetToolRailInactivityTimer();
    resizeHandle.setPointerCapture(e.pointerId);
    resizing = true;
    resizeStartY = e.clientY;
    origFontSize = item.fontSize || 17.5;
  });

  resizeHandle.addEventListener("pointermove", (e) => {
    if (!resizing) return;
    const dy = e.clientY - resizeStartY;
    const nextSize = Math.max(11, Math.min(44, Math.round((origFontSize + dy * 0.25) * 2) / 2));
    item.fontSize = nextSize;
    el.style.fontSize = `${nextSize}px`;
  });

  resizeHandle.addEventListener("pointerup", () => {
    if (!resizing) return;
    resizing = false;
    saveStudyAnnotationsForCurrentPage();
  });
  el.appendChild(resizeHandle);

  // Arrastrar nota editorial con precisión y seleccionar caja al tocar
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let origX = item.x;
  let origY = item.y;

  el.addEventListener("pointerdown", (e) => {
    if (!isWritingAllowed()) return;
    if (textSpan.isContentEditable) return;
    e.stopPropagation();
    resetToolRailInactivityTimer();
    selectMoldItem(item.id);
    el.setPointerCapture(e.pointerId);
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    origX = item.x;
    origY = item.y;
  });

  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = (e.clientX - startX) / (zoomScale || 1);
    const dy = (e.clientY - startY) / (zoomScale || 1);
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    item.x = origX + dx;
    item.y = origY + dy;
    el.style.left = `${item.x}px`;
    el.style.top = `${item.y}px`;
  });

  el.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    if (moved) saveStudyAnnotationsForCurrentPage();
  });

  // Doble toque / doble clic: edición inline directa (cero ventanas/modales)
  el.addEventListener("dblclick", (e) => {
    if (!isWritingAllowed()) return;
    e.stopPropagation();
    resetToolRailInactivityTimer();
    selectMoldItem(item.id);
    textSpan.contentEditable = "true";
    textSpan.focus();
    const range = document.createRange();
    range.selectNodeContents(textSpan);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });

  textSpan.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      textSpan.blur();
    }
  });

  textSpan.addEventListener("blur", () => {
    textSpan.contentEditable = "false";
    const updated = textSpan.textContent.trim();
    if (updated) {
      item.text = updated;
      saveStudyAnnotationsForCurrentPage();
    } else {
      textSpan.textContent = item.text;
    }
  });

  return el;
}

function saveStudyAnnotationsForCurrentPage() {
  persistStudyAnnotationsToStorage();
}

function restoreStudyAnnotationsForCurrentPage() {
  redrawStudyCanvas();
  renderMoldLayer();
}

function clonePageSnapshot(pageOffset = activeAnnotationOffset) {
  const key = getStudyPageKey(pageOffset);
  return {
    pageOffset,
    strokes: JSON.parse(JSON.stringify(studyPageStrokes[key] || [])),
    molds: JSON.parse(JSON.stringify(studyPageMoldItems[key] || []))
  };
}

function pushStudyUndoSnapshot(pageOffset = activeAnnotationOffset) {
  const key = getStudyPageKey(pageOffset);
  if (!studyUndoStacks[key]) studyUndoStacks[key] = [];
  studyUndoStacks[key].push(clonePageSnapshot(pageOffset));
  if (studyUndoStacks[key].length > 30) studyUndoStacks[key].shift();
  studyRedoStacks[key] = [];
}

function applyStudySnapshot(snap, pageOffset = activeAnnotationOffset) {
  if (!snap) return;
  const targetOffset = typeof snap.pageOffset === "number" ? snap.pageOffset : pageOffset;
  const key = getStudyPageKey(targetOffset);
  studyPageStrokes[key] = JSON.parse(JSON.stringify(snap.strokes || []));
  studyPageMoldItems[key] = JSON.parse(JSON.stringify(snap.molds || []));
  redrawStudyCanvas();
  renderMoldLayer();
  saveStudyAnnotationsForCurrentPage();
}

function undoStudyAction() {
  const key = getStudyPageKey(activeAnnotationOffset);
  const stack = studyUndoStacks[key];
  if (!stack || stack.length === 0) return;
  if (!studyRedoStacks[key]) studyRedoStacks[key] = [];
  studyRedoStacks[key].push(clonePageSnapshot(activeAnnotationOffset));
  const prev = stack.pop();
  applyStudySnapshot(prev, activeAnnotationOffset);
}

function redoStudyAction() {
  const key = getStudyPageKey(activeAnnotationOffset);
  const rStack = studyRedoStacks[key];
  if (!rStack || rStack.length === 0) return;
  if (!studyUndoStacks[key]) studyUndoStacks[key] = [];
  studyUndoStacks[key].push(clonePageSnapshot(activeAnnotationOffset));
  const next = rStack.pop();
  applyStudySnapshot(next, activeAnnotationOffset);
}

function toggleBrushPopover() {
  document.getElementById("stampPopover")?.classList.add("hidden");
  document.getElementById("brushPopover")?.classList.toggle("hidden");
}

function setBrushWidth(val) {
  brushWidth = parseFloat(val) || 2.4;
  const lbl = document.getElementById("brushWidthLabel");
  if (lbl) lbl.textContent = `${brushWidth.toFixed(1)} px`;
}

function setBrushOpacity(val) {
  const pct = parseInt(val, 10) || 100;
  brushOpacity = pct / 100;
  const lbl = document.getElementById("brushOpacityLabel");
  if (lbl) lbl.textContent = `${pct}%`;
}

function togglePageBookmark() {
  const sId = activeScore ? activeScore.id : 1;
  if (!studyBookmarks[sId]) studyBookmarks[sId] = new Set();
  if (studyBookmarks[sId].has(pageNum)) {
    studyBookmarks[sId].delete(pageNum);
  } else {
    studyBookmarks[sId].add(pageNum);
  }
  updateBookmarkButton();
  renderStudyPageScrubber();
}

function updateBookmarkButton() {
  const btn = document.getElementById("btnPerformerBookmark");
  if (!btn) return;
  const sId = activeScore ? activeScore.id : 1;
  const isBm = studyBookmarks[sId]?.has(pageNum);
  btn.classList.toggle("bookmarked", Boolean(isBm));
  btn.textContent = isBm ? "★" : "☆";
}

function renderStudyPageScrubber() {
  const total = Math.max(1, activeScore?.pageCount || 10);
  const pill = document.getElementById("scrubberPagePill");
  const fill = document.getElementById("scrubberFill");
  const bmContainer = document.getElementById("scrubberBookmarks");
  const rng = document.getElementById("scrubberRangeInput");
  const cFill = document.getElementById("concertProgressFill");
  const cThumb = document.getElementById("concertProgressThumb");
  const cInput = document.getElementById("concertProgressInput");
  const cLabel = document.getElementById("concertProgressLabel");

  const pct = total <= 1 ? 100 : ((pageNum - 1) / (total - 1)) * 100;
  if (pill) pill.textContent = `Pág. ${pageNum} / ${total}`;
  if (rng) {
    rng.max = String(total);
    rng.value = String(pageNum);
  }
  if (fill) fill.style.width = `${Math.max(2, pct)}%`;

  if (cLabel) cLabel.textContent = `Pág. ${pageNum} / ${total}`;
  if (cInput) {
    cInput.max = String(total);
    cInput.value = String(pageNum);
  }
  if (cFill) cFill.style.width = `${Math.max(2, pct)}%`;
  if (cThumb) cThumb.style.left = `${pct}%`;

  const cBmContainer = document.getElementById("concertBookmarks");
  if (bmContainer || cBmContainer) {
    const sId = activeScore ? activeScore.id : 1;
    const bms = studyBookmarks[sId] || new Set();
    let ticks = "";
    bms.forEach((p) => {
      const pos = total <= 1 ? 50 : ((p - 1) / (total - 1)) * 100;
      ticks += `<span class="scrubber-bm-tick" style="left:${pos}%"></span>`;
    });
    if (bmContainer) bmContainer.innerHTML = ticks;
    if (cBmContainer) cBmContainer.innerHTML = ticks;
  }
}

function previewScrubberPage(val) {
  const total = Math.max(1, activeScore?.pageCount || 10);
  const target = Math.max(1, Math.min(total, parseInt(val, 10) || 1));
  const pill = document.getElementById("scrubberPagePill");
  const fill = document.getElementById("scrubberFill");
  const tip = document.getElementById("scrubberHoverTip");
  const cFill = document.getElementById("concertProgressFill");
  const cThumb = document.getElementById("concertProgressThumb");
  const cLabel = document.getElementById("concertProgressLabel");
  const pct = total <= 1 ? 100 : ((target - 1) / (total - 1)) * 100;

  if (pill) pill.textContent = `Pág. ${target} / ${total}`;
  if (fill) fill.style.width = `${Math.max(2, pct)}%`;
  if (cLabel) cLabel.textContent = `Pág. ${target} / ${total}`;
  if (cFill) cFill.style.width = `${Math.max(2, pct)}%`;
  if (cThumb) cThumb.style.left = `${pct}%`;
  if (performanceMode === "concert") scheduleConcertAutoHide();
  if (tip) {
    tip.textContent = `Pág. ${target}`;
    tip.style.left = `${pct}%`;
    tip.classList.remove("hidden");
  }
  const cTip = document.getElementById("concertHoverTip");
  if (cTip) {
    cTip.textContent = `Pág. ${target}`;
    cTip.style.left = `${pct}%`;
    cTip.classList.remove("hidden");
  }
}

function commitScrubberPage(val) {
  document.getElementById("scrubberHoverTip")?.classList.add("hidden");
  document.getElementById("concertHoverTip")?.classList.add("hidden");
  const target = parseInt(val, 10) || 1;
  jumpToPage(target);
}

let toolRailAutoCollapseTimer = null;

function resetToolRailInactivityTimer() {
  if (toolRailAutoCollapseTimer) clearTimeout(toolRailAutoCollapseTimer);
  const rail = document.getElementById("performerToolRail");
  if (!rail || rail.classList.contains("rail-collapsed")) return;
  toolRailAutoCollapseTimer = setTimeout(() => {
    toggleToolRailCollapse(false);
  }, 30000);
}

function toggleToolRailCollapse(forceOpen) {
  const rail = document.getElementById("performerToolRail");
  const btn = document.getElementById("btnToggleToolRail");
  const performer = document.getElementById("mode-performer");
  if (!rail) return;

  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : rail.classList.contains("rail-collapsed");
  rail.classList.toggle("rail-collapsed", !shouldOpen);
  if (btn) btn.classList.toggle("active", shouldOpen);
  if (performer) performer.classList.toggle("rail-open-drawing", shouldOpen);

  if (shouldOpen) {
    activePerformerContext = "annotate";
    syncPerformerContextButtonsUI();
    resetToolRailInactivityTimer();
  } else {
    if (activePerformerContext === "annotate") {
      activePerformerContext = "read";
      syncPerformerContextButtonsUI();
    }
    if (toolRailAutoCollapseTimer) {
      clearTimeout(toolRailAutoCollapseTimer);
      toolRailAutoCollapseTimer = null;
    }
    document.getElementById("brushPopover")?.classList.add("hidden");
    document.getElementById("stampPopover")?.classList.add("hidden");
  }
}

function applyInkPreset(color, width, tool, btn) {
  inkColor = color;
  brushWidth = width;
  setStudyTool(tool || "pen");
  document.querySelectorAll(".ink-preset-dot").forEach((d) => d.classList.toggle("active", d === btn));
  const dot = document.getElementById("brushSwatchDot");
  if (dot) dot.style.background = color;
  const lbl = document.getElementById("brushWidthLabel");
  const rng = document.getElementById("brushWidthRange");
  if (lbl) lbl.textContent = `${width.toFixed(1)} px`;
  if (rng) rng.value = String(width);
  resetToolRailInactivityTimer();
}

async function jumpToPage(targetPage) {
  saveStudyAnnotationsForCurrentPage();
  const total = activeScore?.pageCount || 10;
  pageNum = Math.max(1, Math.min(total, targetPage));
  await renderActiveScorePage();
}

function setStudyTool(tool) {
  studyTool = tool;
  selectedStamp = null;
  if (tool !== "smarttext") dismissSmartInkBox();
  document.getElementById("btnPen")?.classList.toggle("active", tool === "pen");
  document.getElementById("btnPencil")?.classList.toggle("active", tool === "pencil");
  document.getElementById("btnMarker")?.classList.toggle("active", tool === "marker");
  document.getElementById("btnEraser")?.classList.toggle("active", tool === "eraser");
  document.getElementById("btnSmartText")?.classList.toggle("active", tool === "smarttext");
  document.getElementById("btnStamps")?.classList.remove("active");
  document.getElementById("btnBrushStyle")?.classList.remove("active");
  document.getElementById("stampPopover")?.classList.add("hidden");
  document.getElementById("brushPopover")?.classList.add("hidden");
  const fl = document.getElementById("performerFooterLeft");
  if (fl && performanceMode === "study") {
    const names = {
      pen: "Pluma Activa",
      pencil: "Lápiz Activo",
      marker: "Resaltador Activo",
      eraser: "Borrador Activo",
      smarttext: "Texto / Tinta Activo"
    };
    fl.textContent = `Modo Ensayo • ${names[tool] || "Pluma"}`;
  }
}

function toggleAutoMold() {
  autoMold = !autoMold;
  document.getElementById("btnMoldToggle")?.classList.toggle("magic-active", autoMold);
}

function setInk(color, btn) {
  inkColor = color;
  document.querySelectorAll(".ink-well").forEach((d) => d.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const dot = document.getElementById("brushSwatchDot");
  if (dot) dot.style.background = color;
}

function setupStudyCanvas() {
  [0, 1].forEach((offset) => {
    const { canvas, wrap } = getFolioElements(offset);
    if (!canvas || !wrap) return;
    if (wrap.clientWidth > 0 && wrap.clientHeight > 0) {
      canvas.width = wrap.clientWidth;
      canvas.height = wrap.clientHeight;
    }
  });
}

// Smart Ink Box state
let smartBatchId = null;
let smartBatchStartTime = 0;
let smartInkTimer = null;
let smartInkBBox = null;
let editingMoldItem = null;

function eraseAtPoint(pt, pageOffset = activeAnnotationOffset) {
  const key = getStudyPageKey(pageOffset);
  const list = studyPageStrokes[key];
  if (!list || list.length === 0) return false;
  const radius = 16;
  let changed = false;

  if (eraserMode === "stroke") {
    const filtered = list.filter((stroke) => {
      const hit = (stroke.points || []).some(
        (p) => Math.hypot(p.x - pt.x, p.y - pt.y) <= radius
      );
      if (hit) changed = true;
      return !hit;
    });
    if (changed) studyPageStrokes[key] = filtered;
  } else {
    const nextList = [];
    for (const stroke of list) {
      let currentSeg = [];
      let strokeTouched = false;
      for (const p of stroke.points || []) {
        if (Math.hypot(p.x - pt.x, p.y - pt.y) <= radius) {
          strokeTouched = true;
          changed = true;
          if (currentSeg.length > 1) {
            nextList.push({ ...stroke, id: `${stroke.id}-${nextList.length}`, points: currentSeg });
          }
          currentSeg = [];
        } else {
          currentSeg.push(p);
        }
      }
      if (!strokeTouched) {
        nextList.push(stroke);
      } else if (currentSeg.length > 1) {
        nextList.push({ ...stroke, id: `${stroke.id}-${nextList.length}`, points: currentSeg });
      }
    }
    if (changed) studyPageStrokes[key] = nextList;
  }

  if (changed) redrawSingleFolioCanvas(pageOffset);
  return changed;
}

function scheduleSmartInkBox() {
  if (smartInkTimer) clearTimeout(smartInkTimer);
  smartInkTimer = setTimeout(() => {
    convertSmartBatchDirectly();
  }, 700);
}

async function recognizeHandwritingInk(inkStrokes, width, height) {
  const url = "https://www.google.com/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8";
  const body = {
    app_version: 0.4,
    api_level: "537.36",
    device: navigator.userAgent,
    input_type: "0",
    options: "enable_pre_space",
    requests: [{
      writing_guide: {
        writing_area_width: Math.max(100, Math.round(width)),
        writing_area_height: Math.max(60, Math.round(height))
      },
      ink: inkStrokes,
      language: "es"
    }]
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data[0] === "SUCCESS" && data[1]?.[0]?.[1]?.length > 0) {
      return data[1][0][1][0];
    }
  } catch (err) {
    console.warn("Fallo en reconocimiento online, usando fallback local:", err);
  }
  return null;
}

function recognizeHandwritingFallback(batchStrokes, minX, minY, maxX, maxY) {
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const ratio = w / h;

  // Signo horizontal corto (ej. tenuto / guion)
  if (batchStrokes.length === 1 && ratio > 2.4 && h < 18) return "—";

  // Análisis geométrico básico por cuadrantes para digitaciones (0-5) y dinámicas (p, f, m)
  if (batchStrokes.length === 1) {
    const pts = batchStrokes[0].points || [];
    if (pts.length >= 4) {
      const start = pts[0];
      const end = pts[pts.length - 1];
      const closedDist = Math.hypot(end.x - start.x, end.y - start.y);
      const diag = Math.hypot(w, h);
      const startTop = (start.y - minY) / h < 0.35;
      const endBottom = (end.y - minY) / h > 0.65;

      // Bucle cerrado -> 0
      if (closedDist < diag * 0.28 && ratio >= 0.45 && ratio <= 1.25) return "0";
      // Trazo vertical descendente -> 1
      if (ratio < 0.38 && startTop && endBottom) return "1";
      // Curva superior hacia base derecha -> 2
      if (startTop && endBottom && (end.x - minX) / w > 0.55 && (start.x - minX) / w < 0.6) return "2";
      // Bucle superior + cola -> p
      if (startTop && endBottom && (end.x - minX) / w < 0.45) return "p";
    }
  }

  if (batchStrokes.length === 2) {
    // Dos trazos cruzados o en ángulo -> 4 o f
    if (ratio < 0.85) return "4";
    return "+";
  }

  if (batchStrokes.length === 3) return "m";
  return "Texto";
}

async function convertSmartBatchDirectly() {
  const targetBatchId = smartBatchId;
  if (!targetBatchId) return;
  smartBatchId = null;

  const key = getStudyPageKey();
  const allStrokes = studyPageStrokes[key] || [];
  const batchStrokes = allStrokes.filter((s) => s.smartBatchId === targetBatchId);
  if (batchStrokes.length === 0) return;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  batchStrokes.forEach((s) => {
    (s.points || []).forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
  });

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const boxW = Math.max(60, maxX - minX + 40);
  const boxH = Math.max(40, maxY - minY + 40);
  const estSize = Math.max(14, Math.min(28, Math.round((maxY - minY) * 0.52) || 18));
  const color = batchStrokes[0]?.color || inkColor;

  // Formato estándar de reconocimiento de tinta: [ [x...], [y...], [t...] ]
  const inkData = batchStrokes.map((stroke) => [
    stroke.points.map((p) => Math.round(p.x - minX + 20)),
    stroke.points.map((p) => Math.round(p.y - minY + 20)),
    stroke.points.map((p, idx) => (typeof p.t === "number" ? p.t : idx * 16))
  ]);

  const recognizedText = await recognizeHandwritingInk(inkData, boxW, boxH);
  const text = recognizedText || recognizeHandwritingFallback(batchStrokes, minX, minY, maxX, maxY);

  pushStudyUndoSnapshot();
  const currentStrokes = studyPageStrokes[key] || [];
  studyPageStrokes[key] = currentStrokes.filter((s) => s.smartBatchId !== targetBatchId);
  redrawStudyCanvas();

  if (!studyPageMoldItems[key]) studyPageMoldItems[key] = [];
  const newItem = {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    x: cx,
    y: cy,
    text,
    color,
    fontSize: estSize
  };
  studyPageMoldItems[key].push(newItem);
  selectedMoldId = newItem.id;
  renderMoldLayer();
  saveStudyAnnotationsForCurrentPage();
}

function dismissSmartInkBox() {
  if (smartInkTimer) {
    clearTimeout(smartInkTimer);
    smartInkTimer = null;
  }
  smartBatchId = null;
  smartInkBBox = null;
}

function tryApplyPenGesture(stroke, pageOffset = activeAnnotationOffset) {
  if (!stroke || !stroke.points || stroke.points.length === 0) return false;
  if (stroke.tool !== "pen" && stroke.tool !== "pencil" && stroke.tool !== "smarttext") return false;

  const { canvas, moldLayer: layer } = getFolioElements(pageOffset);
  if (!canvas || !layer) return false;

  const key = getStudyPageKey(pageOffset);
  const items = studyPageMoldItems[key] || [];
  if (items.length === 0) return false;

  const pts = stroke.points;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let pathLen = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
    if (i > 0) pathLen += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
  }

  const w = maxX - minX;
  const h = maxY - minY;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const start = pts[0];
  const end = pts[pts.length - 1];
  const dxTotal = end.x - start.x;
  const dyTotal = end.y - start.y;

  // Contar cambios de dirección horizontal (para Gesto 1: Zigzag)
  let hReversals = 0;
  let lastDir = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    if (Math.abs(dx) < 2.5) continue;
    const dir = dx > 0 ? 1 : -1;
    if (lastDir !== 0 && dir !== lastDir) hReversals++;
    lastDir = dir;
  }

  const cRect = canvas.getBoundingClientRect();
  const moldEls = Array.from(layer.querySelectorAll(".mold-item"));

  for (const el of moldEls) {
    const r = el.getBoundingClientRect();
    const box = {
      left: r.left - cRect.left,
      top: r.top - cRect.top,
      right: r.right - cRect.left,
      bottom: r.bottom - cRect.top,
      width: Math.max(12, r.width),
      height: Math.max(12, r.height)
    };

    const margin = 16;
    const overlaps =
      maxX >= box.left - margin &&
      minX <= box.right + margin &&
      maxY >= box.top - margin &&
      minY <= box.bottom + margin;
    if (!overlaps) continue;

    const item = items.find((m) => m.id === el.dataset.moldId);
    if (!item) continue;

    // Gesto 1: Tachar para Borrar (Scratch-out / Zigzag horizontal >= 2 inversiones)
    if (hReversals >= 2 && w >= 16) {
      pushStudyUndoSnapshot();
      studyPageMoldItems[key] = items.filter((m) => m.id !== item.id);
      if (selectedMoldId === item.id) selectedMoldId = null;
      renderMoldLayer();
      saveStudyAnnotationsForCurrentPage();
      return true;
    }

    // Gesto 2: Insertar Espacio (Línea vertical descendente | entre letras)
    if (h >= 12 && h > w * 1.75 && dyTotal > 8 && cx > box.left + 4 && cx < box.right - 4) {
      const ratio = Math.max(0.05, Math.min(0.95, (cx - box.left) / box.width));
      const idx = Math.round(ratio * item.text.length);
      if (idx > 0 && idx < item.text.length && item.text[idx - 1] !== " " && item.text[idx] !== " ") {
        pushStudyUndoSnapshot();
        item.text = item.text.slice(0, idx) + " " + item.text.slice(idx);
        renderMoldLayer();
        saveStudyAnnotationsForCurrentPage();
        return true;
      }
    }

    // Gesto 3: Añadir Acentos (Pequeña línea oblicua descendente ´ sobre una vocal)
    if (pathLen >= 5 && pathLen <= 28 && w >= 2 && h >= 2 && cy <= box.top + box.height * 0.55) {
      const ratio = Math.max(0, Math.min(1, (cx - box.left) / box.width));
      const approxIdx = Math.min(item.text.length - 1, Math.max(0, Math.floor(ratio * item.text.length)));
      const accentMap = { a: "á", e: "é", i: "í", o: "ó", u: "ú", A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú" };
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < item.text.length; i++) {
        if (accentMap[item.text[i]]) {
          const d = Math.abs(i - approxIdx);
          if (d <= 2 && d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        }
      }
      if (bestIdx !== -1) {
        pushStudyUndoSnapshot();
        item.text = item.text.slice(0, bestIdx) + accentMap[item.text[bestIdx]] + item.text.slice(bestIdx + 1);
        renderMoldLayer();
        saveStudyAnnotationsForCurrentPage();
        return true;
      }
    }

    // Gesto 4: Puntuación Directa (. tap corto o , pequeño arco descendente al final)
    if (cx >= box.right - 14 && cx <= box.right + 22) {
      if (Math.max(w, h) < 4.5 && pts.length <= 4) {
        if (!item.text.endsWith(".")) {
          pushStudyUndoSnapshot();
          item.text = `${item.text}.`;
          renderMoldLayer();
          saveStudyAnnotationsForCurrentPage();
          return true;
        }
      } else if (h >= 5 && h <= 20 && w <= 12 && dyTotal > 3) {
        if (!item.text.endsWith(",")) {
          pushStudyUndoSnapshot();
          item.text = `${item.text},`;
          renderMoldLayer();
          saveStudyAnnotationsForCurrentPage();
          return true;
        }
      }
    }

    // Gesto 5: Unir Palabras (Arco inferior ‿ por debajo de dos palabras separadas)
    if (w >= 14 && cy >= box.bottom - 10 && item.text.includes(" ")) {
      const midPt = pts[Math.floor(pts.length / 2)];
      const endAvgY = (start.y + end.y) / 2;
      if (midPt && midPt.y > endAvgY + 1.5) {
        const spaceIndices = [];
        for (let i = 0; i < item.text.length; i++) {
          if (item.text[i] === " ") spaceIndices.push(i);
        }
        const targetPos = Math.round(((cx - box.left) / box.width) * item.text.length);
        let nearestSpace = spaceIndices[0];
        let bestD = Infinity;
        for (const si of spaceIndices) {
          const d = Math.abs(si - targetPos);
          if (d < bestD) {
            bestD = d;
            nearestSpace = si;
          }
        }
        if (typeof nearestSpace === "number") {
          pushStudyUndoSnapshot();
          item.text = item.text.slice(0, nearestSpace) + item.text.slice(nearestSpace + 1);
          renderMoldLayer();
          saveStudyAnnotationsForCurrentPage();
          return true;
        }
      }
    }
  }
  return false;
}

// ==========================================================================
// MOTOR DE ZOOM TÁCTIL A DOS DEDOS (PINCH-TO-ZOOM + PANEO + COORDENADAS DOC)
// ==========================================================================
let zoomScale = 1.0;
let panX = 0;
let panY = 0;
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 3.5;
let pdfZoomSharpTimer = null;

function applyFolioTransform() {
  const layer = document.getElementById("folioTransformLayer");
  if (layer) {
    layer.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoomScale})`;
  }
  const layerRight = document.getElementById("folioTransformLayerRight");
  if (layerRight) {
    layerRight.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoomScale})`;
  }
}

function resetFolioZoom() {
  zoomScale = 1.0;
  panX = 0;
  panY = 0;
  applyFolioTransform();
}

function getDocPtFromClient(clientX, clientY, pageOffset = 0) {
  const { wrap } = getFolioElements(pageOffset);
  if (!wrap) return { x: 0, y: 0 };
  const r = wrap.getBoundingClientRect();
  return {
    x: (clientX - r.left - panX) / (zoomScale || 1),
    y: (clientY - r.top - panY) / (zoomScale || 1)
  };
}

function scheduleAdaptivePdfSharpness() {
  if (pdfZoomSharpTimer) clearTimeout(pdfZoomSharpTimer);
  if (zoomScale <= 1.2 || !activeScore?.isRealPdf || !currentPdfDocInstance) return;
  pdfZoomSharpTimer = setTimeout(async () => {
    try {
      const page = await currentPdfDocInstance.getPage(pageNum);
      const pdfCanvas = document.getElementById("performerPdfRenderCanvas");
      await renderPdfPageToCanvas(page, pdfCanvas, document.getElementById("performerWrap"), zoomScale);
      const isTwoPages = layouts[layoutIdx] === "2 Págs";
      if (isTwoPages && pageNum + 1 <= (activeScore.pageCount || 10)) {
        const page2 = await currentPdfDocInstance.getPage(pageNum + 1);
        const pdfCanvasRight = document.getElementById("performerPdfRenderCanvasRight");
        await renderPdfPageToCanvas(page2, pdfCanvasRight, document.getElementById("performerWrapRight"), zoomScale);
      }
    } catch (_) {}
  }, 250);
}

function initFolioZoomAndPan() {
  const wrap = document.getElementById("performerWrap");
  if (!wrap) return;
  const activeTouches = new Map();
  let lastDist = 0;
  let lastMid = null;
  let lastTwoFingerTapTime = 0;
  let wasPinching = false;

  const clampPan = () => {
    if (zoomScale <= 1.01) {
      zoomScale = 1.0;
      panX = 0;
      panY = 0;
      return;
    }
    const maxPanX = 0;
    const minPanX = wrap.clientWidth * (1 - zoomScale);
    const maxPanY = 0;
    const minPanY = wrap.clientHeight * (1 - zoomScale);
    panX = Math.max(minPanX, Math.min(maxPanX, panX));
    panY = Math.max(minPanY, Math.min(maxPanY, panY));
  };

  wrap.addEventListener("pointerdown", (e) => {
    // 1 Stylus nunca activa zoom ni paneo
    if (e.pointerType !== "touch") return;
    activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activeTouches.size === 2) {
      wasPinching = true;
      const pts = Array.from(activeTouches.values());
      lastDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      lastMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

      const now = performance.now();
      if (now - lastTwoFingerTapTime < 300) {
        resetFolioZoom();
        lastTwoFingerTapTime = 0;
      } else {
        lastTwoFingerTapTime = now;
      }
    }
  });

  wrap.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "touch" || !activeTouches.has(e.pointerId)) return;
    activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activeTouches.size === 2) {
      e.preventDefault();
      const pts = Array.from(activeTouches.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

      if (lastDist > 0 && lastMid) {
        const r = wrap.getBoundingClientRect();
        const factor = dist / lastDist;
        const nextScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomScale * factor));
        const scaleRatio = nextScale / zoomScale;

        // Mantener anclado el punto medio bajo los dedos
        const anchorX = mid.x - r.left;
        const anchorY = mid.y - r.top;
        panX = anchorX - (anchorX - panX) * scaleRatio + (mid.x - lastMid.x);
        panY = anchorY - (anchorY - panY) * scaleRatio + (mid.y - lastMid.y);
        zoomScale = nextScale;
        clampPan();
        applyFolioTransform();
      }
      lastDist = dist;
      lastMid = mid;
    }
  });

  const endTouch = (e) => {
    if (e.pointerType !== "touch") return;
    activeTouches.delete(e.pointerId);
    if (activeTouches.size < 2) {
      lastDist = 0;
      lastMid = null;
      if (wasPinching) {
        wasPinching = false;
        scheduleAdaptivePdfSharpness();
      }
    }
  };

  wrap.addEventListener("pointerup", endTouch);
  wrap.addEventListener("pointercancel", endTouch);
}

let palmRejectionToastShown = false;

function showPalmRejectionAutoToast() {
  if (palmRejectionToastShown) return;
  palmRejectionToastShown = true;
  document.getElementById("btnPalmAuto")?.classList.add("active");
  document.getElementById("btnPalmFinger")?.classList.remove("active");
  const fl = document.getElementById("performerFooterLeft");
  if (fl && performanceMode === "study") {
    fl.textContent = "Stylus detectado • Rechazo de palma activo";
  }
}

function bindFolioCanvasDrawing(canvas, pageOffset = 0) {
  if (!canvas) return;
  let drawing = false;
  let activeStroke = null;
  let activePointerId = null;
  let lastPt = null;
  let lastPressure = 0.5;
  let rafDrawPending = false;

  const getPt = (e) => getDocPtFromClient(e.clientX, e.clientY, pageOffset);

  const computePressure = (e, pt) => {
    if (e.pointerType === "pen" && typeof e.pressure === "number" && e.pressure > 0) {
      lastPressure = Math.max(0.08, Math.min(1.0, e.pressure));
      return lastPressure;
    }
    const now = performance.now();
    if (!lastPt) {
      lastPressure = 0.55;
      return lastPressure;
    }
    const dt = Math.max(4, now - lastPt.t);
    const dist = Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y);
    const vel = dist / dt;
    const raw = Math.max(0.18, Math.min(0.85, 0.85 - vel * 0.24));
    lastPressure = lastPressure * 0.65 + raw * 0.35;
    return lastPressure;
  };

  const flushActiveStrokeFrame = () => {
    rafDrawPending = false;
    if (!activeStroke) return;
    const ctx = canvas.getContext("2d");
    const cache = ensureCommittedLayer(canvas.width, canvas.height, pageOffset);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cache, 0, 0);
    renderStrokeToCtx(ctx, activeStroke);
  };

  const down = (e) => {
    if (!isWritingAllowed()) return;

    // Rechazo de Palma Nativo Automático (Tablet-First L1)
    if (e.pointerType === "pen") {
      strictPenMode = true;
      fingerDrawAllowed = false;
      showPalmRejectionAutoToast();
    }
    if ((strictPenMode || !fingerDrawAllowed) && e.pointerType === "touch") return;

    activeAnnotationOffset = pageOffset;
    if (selectedMoldId) selectMoldItem(null);

    resetToolRailInactivityTimer();
    if (smartInkTimer) {
      clearTimeout(smartInkTimer);
      smartInkTimer = null;
    }
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    activePointerId = e.pointerId;

    document.body.classList.add("writing-focus");
    document.getElementById("dockRevealHandle")?.classList.remove("hidden");
    document.getElementById("brushPopover")?.classList.add("hidden");

    const pt = getPt(e);
    pushStudyUndoSnapshot(pageOffset);

    if (studyTool === "stamp" && selectedStamp) {
      addMoldBadge(pt.x, pt.y, selectedStamp, inkColor, pageOffset);
      saveStudyAnnotationsForCurrentPage();
      return;
    }

    if (studyTool === "eraser") {
      drawing = true;
      eraseAtPoint(pt, pageOffset);
      return;
    }

    if (studyTool === "smarttext" && !smartBatchId) {
      smartBatchId = `sb-${Date.now()}`;
      smartBatchStartTime = performance.now();
    }

    const p = computePressure(e, pt);
    const relT = studyTool === "smarttext" ? Math.max(0, Math.round(performance.now() - smartBatchStartTime)) : 0;
    lastPt = { x: pt.x, y: pt.y, p, t: performance.now() };
    activeStroke = {
      id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tool: studyTool,
      color: studyTool === "marker" ? "#d4af37" : inkColor,
      baseWidth: brushWidth,
      opacity: brushOpacity,
      smartBatchId: studyTool === "smarttext" ? smartBatchId : null,
      points: [{ x: pt.x, y: pt.y, p, t: relT }]
    };

    ensureCommittedLayer(canvas.width, canvas.height, pageOffset);
    drawing = true;
    flushActiveStrokeFrame();
  };

  const move = (e) => {
    if (!drawing || e.pointerId !== activePointerId) return;
    if (!isWritingAllowed()) return;
    if ((strictPenMode || !fingerDrawAllowed) && e.pointerType === "touch") return;

    e.preventDefault();

    if (studyTool === "eraser") {
      eraseAtPoint(getPt(e), pageOffset);
      return;
    }
    if (!activeStroke) return;

    const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [e];
    let added = false;
    for (const ev of events) {
      const pt = getPt(ev);
      if (lastPt && Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) < 2.0) continue;
      const p = computePressure(ev, pt);
      const relT = studyTool === "smarttext" ? Math.max(0, Math.round(performance.now() - smartBatchStartTime)) : 0;
      lastPt = { x: pt.x, y: pt.y, p, t: performance.now() };
      activeStroke.points.push({ x: pt.x, y: pt.y, p, t: relT });
      added = true;
    }

    if (added && !rafDrawPending) {
      rafDrawPending = true;
      requestAnimationFrame(flushActiveStrokeFrame);
    }
  };

  const up = (e) => {
    if (!drawing || (activePointerId !== null && e.pointerId !== activePointerId)) return;
    drawing = false;
    activePointerId = null;

    if (activeStroke) {
      const completed = activeStroke;
      activeStroke = null;

      if (tryApplyPenGesture(completed, pageOffset)) {
        if (smartInkTimer) {
          clearTimeout(smartInkTimer);
          smartInkTimer = null;
        }
        smartBatchId = null;
        redrawSingleFolioCanvas(pageOffset);
        lastPt = null;
        resetToolRailInactivityTimer();
        return;
      }

      const key = getStudyPageKey(pageOffset);
      if (!studyPageStrokes[key]) studyPageStrokes[key] = [];
      studyPageStrokes[key].push(completed);

      const cache = ensureCommittedLayer(canvas.width, canvas.height, pageOffset);
      renderStrokeToCtx(cache.getContext("2d"), completed);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(cache, 0, 0);
    }

    lastPt = null;
    resetToolRailInactivityTimer();

    if (studyTool === "smarttext") {
      scheduleSmartInkBox();
    }
    saveStudyAnnotationsForCurrentPage();
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
}

function initStudyInteraction() {
  const canvasLeft = document.getElementById("performerCanvas");
  const canvasRight = document.getElementById("performerCanvasRight");
  const stage = document.getElementById("performerStage");
  bindFolioCanvasDrawing(canvasLeft, 0);
  bindFolioCanvasDrawing(canvasRight, 1);

  // Gestos táctiles en Modo Concierto: swipe lateral (página) y swipe desde la base (emerger HUD)
  if (stage) {
    let swipeStartX = 0;
    let swipeStartY = 0;
    stage.addEventListener("touchstart", (e) => {
      if (performanceMode !== "concert" || isWritingAllowed() || e.touches.length !== 1) return;
      swipeStartX = e.touches[0].clientX;
      swipeStartY = e.touches[0].clientY;
    }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      if (performanceMode !== "concert" || isWritingAllowed() || e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - swipeStartX;
      const dy = e.changedTouches[0].clientY - swipeStartY;
      // Deslizar desde la base hacia arriba revela el HUD de Concierto
      if (swipeStartY >= window.innerHeight - 90 && dy < -32 && Math.abs(dy) > Math.abs(dx)) {
        document.body.classList.remove("concert-immersion");
        scheduleConcertAutoHide();
        return;
      }
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        turnPage(dx < 0 ? 1 : -1);
      }
    }, { passive: true });
  }
}

function addMoldBadge(x, y, text, color, pageOffset = activeAnnotationOffset) {
  const key = getStudyPageKey(pageOffset);
  if (!studyPageMoldItems[key]) studyPageMoldItems[key] = [];
  studyPageMoldItems[key].push({
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    x,
    y,
    text,
    color: color || inkColor,
    fontSize: 17.5
  });
  renderMoldLayer();
}

function confirmClearStudyLayer() {
  if (window.confirm("¿Limpiar todas las anotaciones de esta página?")) {
    pushStudyUndoSnapshot();
    clearStudyLayer();
    saveStudyAnnotationsForCurrentPage();
  }
}

function clearStudyLayer() {
  const key = getStudyPageKey();
  studyPageStrokes[key] = [];
  studyPageMoldItems[key] = [];
  dismissSmartInkBox();
  redrawStudyCanvas();
  renderMoldLayer();
}

// ==========================================================================
// 3. CONTROLES DE ESCENARIO, LAYOUT (1/2 PÁGS) Y UTILIDADES DE ENSAYO
// ==========================================================================
let audioTimer = null;
let followedSys = 0;
let layoutIdx = 0;
let halfPagePhase = 0; // 0 = mitad superior, 1 = mitad inferior (Media Pág)
let concertAutoHideTimer = null;
let pageToastTimer = null;
const layouts = ["1 Pág", "Media Pág", "2 Págs"];

function triggerPageTurnFlash(dir) {
  const el = document.getElementById(dir < 0 ? "pageTurnFlashLeft" : "pageTurnFlashRight");
  if (!el) return;
  el.classList.add("active");
  setTimeout(() => el.classList.remove("active"), 180);
}

function triggerFolioTurnAnimation(dir) {
  const sheet = document.getElementById("performerSheet");
  if (!sheet) return;
  const cls = dir < 0 ? "folio-turning-prev" : "folio-turning-next";
  sheet.classList.remove("folio-turning-prev", "folio-turning-next");
  void sheet.offsetWidth;
  sheet.classList.add(cls);
  setTimeout(() => sheet.classList.remove(cls), 190);
}

function showConcertPageToast() {
  if (performanceMode !== "concert") return;
  const toast = document.getElementById("performerPageToast");
  if (!toast) return;
  const total = activeScore?.pageCount || 10;
  toast.textContent = `${pageNum} / ${total}`;
  toast.classList.remove("hidden");
  if (pageToastTimer) clearTimeout(pageToastTimer);
  pageToastTimer = setTimeout(() => toast.classList.add("hidden"), 1200);
}

function syncHalfPageVisual() {
  const wrap = document.getElementById("performerWrap");
  if (!wrap) return;
  const isHalfBottom = layouts[layoutIdx] === "Media Pág" && halfPagePhase === 1;
  wrap.classList.toggle("half-page-bottom", isHalfBottom);
}

async function turnPage(dir) {
  saveStudyAnnotationsForCurrentPage();
  resetFolioZoom();
  triggerPageTurnFlash(dir);
  triggerFolioTurnAnimation(dir);
  const total = activeScore.pageCount || 10;

  // Media Pág real: avanza primero mitad superior -> mitad inferior -> siguiente página
  if (layouts[layoutIdx] === "Media Pág") {
    if (dir > 0) {
      if (halfPagePhase === 0) {
        halfPagePhase = 1;
        syncHalfPageVisual();
        showConcertPageToast();
        return;
      }
      if (pageNum < total) {
        halfPagePhase = 0;
        pageNum += 1;
        await renderActiveScorePage();
        syncHalfPageVisual();
        showConcertPageToast();
      }
      return;
    } else {
      if (halfPagePhase === 1) {
        halfPagePhase = 0;
        syncHalfPageVisual();
        showConcertPageToast();
        return;
      }
      if (pageNum > 1) {
        halfPagePhase = 1;
        pageNum -= 1;
        await renderActiveScorePage();
        syncHalfPageVisual();
        showConcertPageToast();
      }
      return;
    }
  }

  halfPagePhase = 0;
  syncHalfPageVisual();
  const step = layouts[layoutIdx] === "2 Págs" ? 2 : 1;
  pageNum = Math.max(1, Math.min(total, pageNum + dir * step));
  await renderActiveScorePage();
  showConcertPageToast();
}

function updateLayoutButtonIcon() {
  const iconEl = document.getElementById("performerLayoutIcon");
  const btnEl = document.getElementById("btnPerformerLayout");
  const lbl = document.getElementById("pageModeLabel");
  const mode = layouts[layoutIdx];
  if (lbl) lbl.textContent = mode;

  const svgs = {
    "1 Pág": `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>`,
    "Media Pág": `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="5" y1="12" x2="19" y2="12" stroke-dasharray="2 2"/><path d="M8 7.5h8" stroke-width="1.8"/></svg>`,
    "2 Págs": `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="8.5" height="16" rx="1.5"/><rect x="13" y="4" width="8.5" height="16" rx="1.5"/></svg>`
  };
  const titles = {
    "1 Pág": "Vista: Página completa",
    "Media Pág": "Vista: Media página",
    "2 Págs": "Vista: Dos páginas"
  };

  const concertIconEl = document.getElementById("concertLayoutIcon");
  if (iconEl) iconEl.innerHTML = svgs[mode] || svgs["1 Pág"];
  if (concertIconEl) concertIconEl.innerHTML = svgs[mode] || svgs["1 Pág"];
  if (btnEl) {
    btnEl.title = titles[mode] || "Cambiar vista de página";
    btnEl.setAttribute("aria-label", btnEl.title);
  }
}

let userManuallyChangedLayout = false;

async function cyclePageLayout() {
  userManuallyChangedLayout = true;
  saveStudyAnnotationsForCurrentPage();
  layoutIdx = (layoutIdx + 1) % layouts.length;
  halfPagePhase = 0;
  syncHalfPageVisual();
  updateLayoutButtonIcon();
  await renderActiveScorePage();
}

function autoAdaptLayoutForTabletOrientation() {
  if (userManuallyChangedLayout) return;
  const isWideLandscape = window.innerWidth >= 960 && window.innerWidth / Math.max(1, window.innerHeight) > 1.18;
  const desiredIdx = isWideLandscape ? 2 : 0; // 2 = '2 Págs', 0 = '1 Pág'
  if (layoutIdx !== desiredIdx) {
    layoutIdx = desiredIdx;
    halfPagePhase = 0;
    syncHalfPageVisual();
    updateLayoutButtonIcon();
  }
}

function scheduleConcertAutoHide() {
  if (concertAutoHideTimer) clearTimeout(concertAutoHideTimer);
  if (performanceMode !== "concert") return;
  concertAutoHideTimer = setTimeout(() => {
    if (performanceMode === "concert") {
      document.body.classList.add("concert-immersion");
    }
  }, 3500);
}

function handlePerformerStageTap(e) {
  if (isWritingAllowed()) return;
  if (e.target.closest("button, .floating-bottom-bar, .concert-exit-overlay, .concert-audio-satellite, .mold-item")) {
    if (performanceMode === "concert") scheduleConcertAutoHide();
    return;
  }

  // En modo Lectura (Ensayo sin pluma abierta) o Concierto: Lateral izquierdo (<= 30%) retrocede, Lateral derecho (> 62%) avanza
  const xRatio = (e.clientX || 0) / Math.max(1, window.innerWidth);
  if (xRatio < 0.30) {
    turnPage(-1);
    return;
  }
  if (xRatio > 0.62) {
    turnPage(1);
    return;
  }

  if (performanceMode !== "concert") return;

  const willShow = document.body.classList.contains("concert-immersion");
  document.body.classList.toggle("concert-immersion", !willShow);
  if (willShow) {
    scheduleConcertAutoHide();
  } else if (concertAutoHideTimer) {
    clearTimeout(concertAutoHideTimer);
    concertAutoHideTimer = null;
  }
}

let acousticMicTriggerEnabled = true;
let acousticTriggerSensitivity = "med"; // 'low' | 'med' | 'high'
let acousticTriggerStream = null;
let acousticTriggerRaf = null;
let isWaitingForFirstNote = false;

function toggleAcousticMicTriggerPref(enabled) {
  acousticMicTriggerEnabled = Boolean(enabled);
}

function setAcousticTriggerSensitivity(level, btn) {
  acousticTriggerSensitivity = level || "med";
  document.querySelectorAll("#acousticSensGroup .metro-pill-btn").forEach((b) => {
    b.classList.toggle("active", b === btn);
  });
}

function stopAcousticMicTriggerWait() {
  isWaitingForFirstNote = false;
  if (acousticTriggerRaf) {
    cancelAnimationFrame(acousticTriggerRaf);
    acousticTriggerRaf = null;
  }
  if (acousticTriggerStream) {
    acousticTriggerStream.getTracks().forEach((t) => t.stop());
    acousticTriggerStream = null;
  }
  const pill = document.getElementById("acousticMicStatusPill");
  if (pill) {
    pill.textContent = "Listo";
    pill.classList.remove("is-waiting", "is-triggered");
  }
}

function startActiveScoreFollowLoop() {
  const btn = document.getElementById("btnAudioFollow");
  const lbl = document.getElementById("audioFollowLabel");
  const svgEl = document.getElementById("performerSvg");
  const pill = document.getElementById("acousticMicStatusPill");

  if (btn) btn.classList.add("listening");
  if (pill) {
    pill.textContent = "En seguimiento";
    pill.classList.remove("is-waiting");
    pill.classList.add("is-triggered");
  }

  followedSys = 0;
  if (lbl) lbl.textContent = "Compás 1";
  if (!activeScore.isRealPdf && svgEl) {
    svgEl.innerHTML = buildPortraitScoreSvg(followedSys);
  }

  // Avance calculado según el BPM real de la obra (3 compases de 4/4 por sistema)
  const effectiveBpm = Math.max(40, Math.min(220, metroBpm || 76));
  const msPerSystem = Math.round((60000 / effectiveBpm) * (metroBeatsPerBar || 4) * 2.5);

  if (audioTimer) clearInterval(audioTimer);
  audioTimer = setInterval(() => {
    followedSys = (followedSys + 1) % 6;
    if (lbl) lbl.textContent = `Compás ${followedSys * 3 + 1}`;
    if (!activeScore.isRealPdf && svgEl) {
      svgEl.innerHTML = buildPortraitScoreSvg(followedSys);
    }
    if (followedSys === 5) {
      setTimeout(() => {
        if (audioTimer) turnPage(1);
      }, 900);
    }
  }, msPerSystem);
}

async function toggleAudioFollow() {
  const btn = document.getElementById("btnAudioFollow");
  const lbl = document.getElementById("audioFollowLabel");
  const svgEl = document.getElementById("performerSvg");
  const pill = document.getElementById("acousticMicStatusPill");

  if (audioTimer || isWaitingForFirstNote) {
    if (audioTimer) {
      clearInterval(audioTimer);
      audioTimer = null;
    }
    stopAcousticMicTriggerWait();
    if (btn) btn.classList.remove("listening");
    if (lbl) lbl.textContent = "Escucha";
    if (!activeScore.isRealPdf && svgEl) {
      svgEl.innerHTML = buildPortraitScoreSvg(-1);
    }
    return;
  }

  // Si está activo el Disparo Acústico por Micrófono (Fase D - H2), esperar en silencio la 1ª nota real
  if (acousticMicTriggerEnabled && navigator.mediaDevices?.getUserMedia) {
    try {
      acousticTriggerStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      const ctx = getPerformerAudioCtx();
      const source = ctx.createMediaStreamSource(acousticTriggerStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);

      isWaitingForFirstNote = true;
      if (btn) btn.classList.add("listening");
      if (lbl) lbl.textContent = "Esperando 1ª nota...";
      if (pill) {
        pill.textContent = "Escuchando entrada...";
        pill.classList.add("is-waiting");
      }

      const thresholds = { low: 0.045, med: 0.022, high: 0.01 };
      const rmsTarget = thresholds[acousticTriggerSensitivity] || 0.022;

      const checkAcousticOnset = () => {
        if (!isWaitingForFirstNote) return;
        analyser.getFloatTimeDomainData(buf);
        let sumSq = 0;
        for (let i = 0; i < buf.length; i++) {
          sumSq += buf[i] * buf[i];
        }
        const rms = Math.sqrt(sumSq / buf.length);
        if (rms >= rmsTarget) {
          stopAcousticMicTriggerWait();
          startActiveScoreFollowLoop();
          const ctxBtn = document.getElementById("btnStudyAudioFollowToggle");
          if (ctxBtn) {
            ctxBtn.textContent = "Detener Seguimiento";
            ctxBtn.classList.add("active");
          }
          return;
        }
        acousticTriggerRaf = requestAnimationFrame(checkAcousticOnset);
      };

      acousticTriggerRaf = requestAnimationFrame(checkAcousticOnset);
      return;
    } catch (_) {
      // Si el usuario deniega el micrófono, iniciar bucle por tempo directamente
    }
  }

  startActiveScoreFollowLoop();
}

// ==========================================================================
// REPRODUCTOR DE AUDIO DE REFERENCIA CON BUCLE A-B Y CONTROL DE VELOCIDAD (FASE C - H1)
// ==========================================================================
let refAudioElement = null;
let refAudioObjectUrl = null;
let refAudioLoopA = null;
let refAudioLoopB = null;
let refAudioSpeed = 1.0;
let refSynthTimer = null;
let refSynthPositionSec = 0;
const REF_SYNTH_DURATION_SEC = 32;

function formatAudioSeconds(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

function updateReferenceAudioTimeUI(curSec, totalSec) {
  const lbl = document.getElementById("refAudioTimeLabel");
  const rng = document.getElementById("refAudioSeekRange");
  if (lbl) lbl.textContent = `${formatAudioSeconds(curSec)} / ${formatAudioSeconds(totalSec)}`;
  if (rng && totalSec > 0) {
    rng.value = String(Math.min(100, (curSec / totalSec) * 100));
  }
}

function handleReferenceAudioUpload(fileList) {
  if (!fileList || fileList.length === 0) return;
  const file = fileList[0];
  stopReferenceAudioPlayback();

  if (refAudioObjectUrl) {
    try { URL.revokeObjectURL(refAudioObjectUrl); } catch (_) {}
  }
  refAudioObjectUrl = URL.createObjectURL(file);
  if (!refAudioElement) {
    refAudioElement = new Audio();
    refAudioElement.preservesPitch = true;
    refAudioElement.mozPreservesPitch = true;
    refAudioElement.webkitPreservesPitch = true;
    refAudioElement.addEventListener("timeupdate", () => {
      if (!refAudioElement) return;
      const cur = refAudioElement.currentTime || 0;
      const dur = refAudioElement.duration || 0;
      if (refAudioLoopB !== null && cur >= refAudioLoopB) {
        refAudioElement.currentTime = refAudioLoopA !== null ? refAudioLoopA : 0;
      }
      updateReferenceAudioTimeUI(refAudioElement.currentTime, dur);
    });
    refAudioElement.addEventListener("ended", () => {
      if (refAudioLoopA !== null) {
        refAudioElement.currentTime = refAudioLoopA;
        refAudioElement.play();
      } else {
        const btn = document.getElementById("btnRefAudioPlay");
        if (btn) btn.textContent = "▶ Escuchar";
      }
    });
    refAudioElement.addEventListener("loadedmetadata", () => {
      updateReferenceAudioTimeUI(0, refAudioElement.duration || 0);
    });
  }

  refAudioElement.src = refAudioObjectUrl;
  refAudioElement.playbackRate = refAudioSpeed;
  clearReferenceAudioLoop();

  const fnLbl = document.getElementById("refAudioFilenameLabel");
  if (fnLbl) fnLbl.textContent = `🎵 ${file.name}`;
}

function stopReferenceAudioPlayback() {
  if (refAudioElement && !refAudioElement.paused) {
    refAudioElement.pause();
  }
  if (refSynthTimer) {
    clearInterval(refSynthTimer);
    refSynthTimer = null;
  }
  const btn = document.getElementById("btnRefAudioPlay");
  if (btn) btn.textContent = "▶ Escuchar";
}

function playSynthReferenceNote(noteIdx) {
  const ctx = getPerformerAudioCtx();
  if (!ctx) return;
  // Motivo barroco de referencia (Adagio BWV 1034 en Mi menor)
  const motifFreqs = [329.63, 392.0, 493.88, 659.25, 587.33, 493.88, 440.0, 392.0, 369.99, 493.88, 329.63, 246.94];
  const freq = motifFreqs[noteIdx % motifFreqs.length];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 0.45);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.48);
}

function toggleReferenceAudioPlay() {
  const btn = document.getElementById("btnRefAudioPlay");
  if (refAudioElement && refAudioElement.src) {
    if (refAudioElement.paused) {
      refAudioElement.playbackRate = refAudioSpeed;
      refAudioElement.play();
      if (btn) btn.textContent = "❚❚ Pausar";
    } else {
      refAudioElement.pause();
      if (btn) btn.textContent = "▶ Escuchar";
    }
    return;
  }

  // Modo síntesis de referencia integrada cuando no se ha cargado un MP3 externo
  if (refSynthTimer) {
    stopReferenceAudioPlayback();
    return;
  }

  let stepCount = Math.floor(refSynthPositionSec * 2);
  if (btn) btn.textContent = "❚❚ Pausar";
  playSynthReferenceNote(stepCount);

  refSynthTimer = setInterval(() => {
    refSynthPositionSec += 0.5 * refAudioSpeed;
    if (refAudioLoopB !== null && refSynthPositionSec >= refAudioLoopB) {
      refSynthPositionSec = refAudioLoopA !== null ? refAudioLoopA : 0;
    } else if (refSynthPositionSec >= REF_SYNTH_DURATION_SEC) {
      refSynthPositionSec = refAudioLoopA !== null ? refAudioLoopA : 0;
    }
    stepCount++;
    playSynthReferenceNote(stepCount);
    updateReferenceAudioTimeUI(refSynthPositionSec, REF_SYNTH_DURATION_SEC);
  }, Math.max(180, Math.round(500 / refAudioSpeed)));
}

function seekReferenceAudio(pctVal) {
  const pct = Math.max(0, Math.min(100, parseFloat(pctVal) || 0)) / 100;
  if (refAudioElement && refAudioElement.src && refAudioElement.duration) {
    refAudioElement.currentTime = pct * refAudioElement.duration;
    updateReferenceAudioTimeUI(refAudioElement.currentTime, refAudioElement.duration);
  } else {
    refSynthPositionSec = pct * REF_SYNTH_DURATION_SEC;
    updateReferenceAudioTimeUI(refSynthPositionSec, REF_SYNTH_DURATION_SEC);
  }
}

function getCurrentReferenceAudioTime() {
  if (refAudioElement && refAudioElement.src) {
    return refAudioElement.currentTime || 0;
  }
  return refSynthPositionSec || 0;
}

function setReferenceAudioLoopPoint(point) {
  const cur = getCurrentReferenceAudioTime();
  const btnA = document.getElementById("btnRefLoopA");
  const btnB = document.getElementById("btnRefLoopB");

  if (point === "A") {
    refAudioLoopA = cur;
    if (refAudioLoopB !== null && refAudioLoopB <= refAudioLoopA) {
      refAudioLoopB = null;
      if (btnB) {
        btnB.classList.remove("active");
        btnB.textContent = "B";
      }
    }
    if (btnA) {
      btnA.classList.add("active");
      btnA.textContent = `A ${formatAudioSeconds(cur)}`;
    }
  } else if (point === "B") {
    if (refAudioLoopA === null) {
      refAudioLoopA = Math.max(0, cur - 4);
      if (btnA) {
        btnA.classList.add("active");
        btnA.textContent = `A ${formatAudioSeconds(refAudioLoopA)}`;
      }
    }
    if (cur > refAudioLoopA + 0.5) {
      refAudioLoopB = cur;
      if (btnB) {
        btnB.classList.add("active");
        btnB.textContent = `B ${formatAudioSeconds(cur)}`;
      }
    }
  }
}

function clearReferenceAudioLoop() {
  refAudioLoopA = null;
  refAudioLoopB = null;
  const btnA = document.getElementById("btnRefLoopA");
  const btnB = document.getElementById("btnRefLoopB");
  if (btnA) {
    btnA.classList.remove("active");
    btnA.textContent = "A";
  }
  if (btnB) {
    btnB.classList.remove("active");
    btnB.textContent = "B";
  }
}

function setReferenceAudioSpeed(speed, btn) {
  refAudioSpeed = parseFloat(speed) || 1.0;
  document.querySelectorAll("#refAudioSpeedGroup .metro-pill-btn").forEach((b) => {
    b.classList.toggle("active", b === btn);
  });
  if (refAudioElement) {
    refAudioElement.playbackRate = refAudioSpeed;
  }
  if (refSynthTimer) {
    stopReferenceAudioPlayback();
    toggleReferenceAudioPlay();
  }
}

// ==========================================================================
// 4. MODO EDITOR
// ==========================================================================
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
    document.body.classList.add("writing-focus");
    document.getElementById("dockRevealHandle")?.classList.remove("hidden");
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

function undoEditorNote() {
  if (editorNotes.length > 0) {
    editorNotes.pop();
    renderEditorSvg();
  }
}

// ==========================================================================
// 5. PROGRAMAS DE CONCIERTO (SETLISTS) & QUICK-PEN EN ESCENARIO
// ==========================================================================
const PROGRAMS_STORAGE_KEY = "atrilProgramsV13";
let programsState = {
  activeId: "prog-1",
  list: [
    { id: "prog-1", name: "Recital Bellas Artes", scoreIds: [1, 3] },
    { id: "prog-2", name: "Bach Integral", scoreIds: [1, 2] }
  ]
};
let activeProgramScoreIndex = 0;

function loadProgramsState() {
  try {
    const raw = localStorage.getItem(PROGRAMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.list)) {
        programsState = parsed;
      }
    }
  } catch (_) {}
}

let setlistAutosaveFeedbackTimer = null;

function flashSetlistAutosaveFeedback(msg = "Guardado automáticamente") {
  const pill = document.getElementById("setlistAutosavePill");
  const lbl = document.getElementById("setlistAutosaveLabel");
  if (!pill) return;
  if (lbl) lbl.textContent = msg;
  pill.classList.add("is-flashing");
  if (setlistAutosaveFeedbackTimer) clearTimeout(setlistAutosaveFeedbackTimer);
  setlistAutosaveFeedbackTimer = setTimeout(() => {
    pill.classList.remove("is-flashing");
  }, 1800);
}

function saveProgramsState() {
  try {
    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programsState));
    flashSetlistAutosaveFeedback();
  } catch (_) {}
}

function getActiveProgram() {
  if (!Array.isArray(programsState.list) || programsState.list.length === 0) return null;
  return programsState.list.find((p) => p.id === programsState.activeId) || programsState.list[0] || null;
}

function toggleMobileProgramsDropdown(e, forceState) {
  if (e) e.stopPropagation();
  const listEl = document.getElementById("programsMasterList");
  const btn = document.getElementById("btnMobileProgListToggle");
  if (!listEl) return;
  const shouldOpen =
    typeof forceState === "boolean" ? forceState : !listEl.classList.contains("mobile-dropdown-open");
  listEl.classList.toggle("mobile-dropdown-open", shouldOpen);
  if (btn) {
    btn.classList.toggle("active", shouldOpen);
    btn.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  }
  if (shouldOpen) {
    document.getElementById("newProgInline")?.classList.add("hidden");
  }
}

function closeMobileProgramsDropdown() {
  toggleMobileProgramsDropdown(null, false);
}

function onProgSidebarSearchInput() {
  renderSetlistDrawer();
  if (window.innerWidth <= 760) {
    toggleMobileProgramsDropdown(null, true);
  }
}

function toggleSetlistDrawer(forceState) {
  if (forceState === true) openProgramsSlideView();
  else if (forceState === false) closeProgramsSlideView();
  else {
    const vp = document.getElementById("librarySlidesViewport");
    if (vp?.classList.contains("is-programs-active")) closeProgramsSlideView();
    else openProgramsSlideView();
  }
}

function toggleNewProgramInput(show) {
  const row = document.getElementById("newProgInline");
  const inp = document.getElementById("newProgNameInput");
  if (!row) return;
  if (show) closeMobileProgramsDropdown();
  row.classList.toggle("hidden", !show);
  if (show && inp) {
    inp.value = "";
    setTimeout(() => inp.focus(), 40);
  }
}

function confirmNewProgram() {
  const inp = document.getElementById("newProgNameInput");
  const name = inp ? inp.value.trim() : "";
  if (!name) return;
  const newProg = {
    id: `prog-${Date.now()}`,
    name,
    scoreIds: [],
    pinned: false,
    updatedAt: Date.now()
  };
  programsState.list.push(newProg);
  programsState.activeId = newProg.id;
  saveProgramsState();
  refreshProgramRecentSnapshot();
  toggleNewProgramInput(false);
  renderSetlistDrawer();
}

function renameActiveProgramPrompt() {
  const prog = getActiveProgram();
  if (!prog) return;
  const next = window.prompt("Nuevo nombre para el programa:", prog.name);
  if (!next || !next.trim()) return;
  prog.name = next.trim();
  prog.updatedAt = Date.now();
  saveProgramsState();
  renderSetlistDrawer();
}

function deleteActiveProgramPrompt() {
  const prog = getActiveProgram();
  if (!prog) return;
  if (!window.confirm(`¿Eliminar el programa "${prog.name}"?`)) return;
  programsState.list = programsState.list.filter((p) => p.id !== prog.id);
  programsState.activeId = programsState.list[0] ? programsState.list[0].id : null;
  activeProgramScoreIndex = 0;
  saveProgramsState();
  refreshProgramRecentSnapshot();
  renderSetlistDrawer();
}

function quickAddSelectedScoreToProgram() {
  const sel = document.getElementById("quickAddScoreSelect");
  if (!sel || !sel.value) return;
  addScoreToActiveProgram(Number(sel.value));
}

function switchActiveProgram(progId) {
  programsState.activeId = progId;
  activeProgramScoreIndex = 0;
  const p = programsState.list.find((item) => item.id === progId);
  if (p) p.updatedAt = Date.now();
  saveProgramsState();
  closeMobileProgramsDropdown();
  renderSetlistDrawer();
}

function addScoreToActiveProgram(scoreId) {
  const prog = getActiveProgram();
  if (!prog) return;
  const numId = Number(scoreId);
  if (!prog.scoreIds.includes(numId)) {
    prog.scoreIds.push(numId);
    prog.updatedAt = Date.now();
    saveProgramsState();
    renderSetlistDrawer();
  }
  toggleSetlistDrawer(true);
}

function moveProgramItem(idx, dir) {
  const prog = getActiveProgram();
  if (!prog) return;
  const target = idx + dir;
  if (target < 0 || target >= prog.scoreIds.length) return;
  const tmp = prog.scoreIds[idx];
  prog.scoreIds[idx] = prog.scoreIds[target];
  prog.scoreIds[target] = tmp;
  saveProgramsState();
  renderSetlistDrawer();
}

function removeProgramItem(idx) {
  const prog = getActiveProgram();
  if (!prog) return;
  prog.scoreIds.splice(idx, 1);
  saveProgramsState();
  renderSetlistDrawer();
}

function filterProgramAddSuggestions() {
  const input = document.getElementById("progScoreSearchInput");
  const box = document.getElementById("progScoreSuggestions");
  if (!input || !box) return;

  const q = (input.value || "").trim().toLowerCase();
  const prog = getActiveProgram();
  const existingIds = new Set(prog ? prog.scoreIds : []);

  const matches = scores.filter((s) => {
    const t = (s.clean || s.title || "").toLowerCase();
    const c = (s.composer || "").toLowerCase();
    return !q || t.includes(q) || c.includes(q);
  });

  if (matches.length === 0) {
    box.innerHTML = `<div class="prog-sug-empty">Sin coincidencias en tu biblioteca</div>`;
    box.classList.remove("hidden");
    return;
  }

  box.innerHTML = matches
    .map((s) => {
      const already = existingIds.has(s.id);
      return `
        <button class="prog-sug-item ${already ? "is-added" : ""}" onclick="selectProgramAddSuggestion(${s.id})">
          <div class="prog-sug-text">
            <strong>${s.clean || s.title}</strong>
            <small>${(s.composer || "").split("(")[0].trim()}</small>
          </div>
          <span class="prog-sug-badge">${already ? "En programa" : "＋"}</span>
        </button>
      `;
    })
    .join("");
  box.classList.remove("hidden");
}

function selectProgramAddSuggestion(scoreId) {
  addScoreToActiveProgram(scoreId);
  const input = document.getElementById("progScoreSearchInput");
  const box = document.getElementById("progScoreSuggestions");
  if (input) input.value = "";
  if (box) box.classList.add("hidden");
}

let progSidebarFilter = "all";
let progSidebarSort = "recent";
let progRecentOrderSnapshot = [];

function refreshProgramRecentSnapshot() {
  progRecentOrderSnapshot = [...programsState.list]
    .sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    })
    .map((p) => p.id);
}

function setProgramSidebarFilter(filterKey) {
  progSidebarFilter = filterKey;
  document.querySelectorAll(".prog-filter-btn[data-pfilter]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.pfilter === filterKey);
  });
  refreshProgramRecentSnapshot();
  renderSetlistDrawer();
}

function toggleProgramSidebarSort() {
  progSidebarSort = progSidebarSort === "recent" ? "az" : "recent";
  const lbl = document.getElementById("progSortLabel");
  if (lbl) lbl.textContent = progSidebarSort === "recent" ? "Recientes" : "A–Z";
  if (progSidebarSort === "recent") refreshProgramRecentSnapshot();
  renderSetlistDrawer();
}

function togglePinProgram(e, progId) {
  if (e) e.stopPropagation();
  const prog = programsState.list.find((p) => p.id === progId);
  if (!prog) return;
  prog.pinned = !prog.pinned;
  saveProgramsState();
  refreshProgramRecentSnapshot();
  renderSetlistDrawer();
}

function renderSetlistDrawer() {
  const sel = document.getElementById("activeProgramSelect");
  const masterListEl = document.getElementById("programsMasterList");
  const mobilePillsEl = document.getElementById("mobileProgramsPillCarousel");
  const detailTitleEl = document.getElementById("progDetailTitle");
  const itemsEl = document.getElementById("setlistItems");
  const sumEl = document.getElementById("setlistSummary");
  const launchBtn = document.getElementById("btnLaunchProgram");
  const startConcertBtn = document.getElementById("btnStartProgramConcert");
  const quickSel = document.getElementById("quickAddScoreSelect");
  if (!sel || !itemsEl) return;

  sel.innerHTML = programsState.list
    .map((p) => `<option value="${p.id}" ${p.id === programsState.activeId ? "selected" : ""}>${p.name}</option>`)
    .join("");

  if (mobilePillsEl) {
    const plusSvg = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    mobilePillsEl.innerHTML =
      programsState.list
        .map((p) => {
          const isActive = p.id === programsState.activeId;
          return `<button type="button" class="mobile-prog-pill ${isActive ? "active" : ""}" role="tab" aria-selected="${isActive}" onclick="switchActiveProgram('${p.id}')">${p.name}</button>`;
        })
        .join("") +
      `<button type="button" class="mobile-prog-pill mobile-prog-pill-new" onclick="toggleNewProgramInput(true)">${plusSvg}<span>Nuevo</span></button>`;

    const activeChip = mobilePillsEl.querySelector(".mobile-prog-pill.active");
    if (activeChip && document.body.classList.contains("programs-slide-open")) {
      requestAnimationFrame(() => {
        try {
          mobilePillsEl.scrollLeft = Math.max(
            0,
            activeChip.offsetLeft - mobilePillsEl.clientWidth / 2 + activeChip.clientWidth / 2
          );
        } catch (_) {}
      });
    }
  }

  if (masterListEl) {
    const qProg = (document.getElementById("progSidebarSearchInput")?.value || "").trim().toLowerCase();
    const starSvg = `<svg viewBox="0 0 24 24" class="v-ico"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

    const filteredProgs = programsState.list
      .filter((p) => {
        if (progSidebarFilter === "pinned" && !p.pinned) return false;
        if (!qProg) return true;
        if ((p.name || "").toLowerCase().includes(qProg)) return true;
        return (p.scoreIds || []).some((sid) => {
          const sc = scores.find((item) => item.id === sid);
          if (!sc) return false;
          return (
            (sc.clean || sc.title || "").toLowerCase().includes(qProg) ||
            (sc.composer || "").toLowerCase().includes(qProg)
          );
        });
      })
      .sort((a, b) => {
        if (progSidebarSort === "az") {
          return (a.name || "").localeCompare(b.name || "", "es");
        }
        const idxA = progRecentOrderSnapshot.indexOf(a.id);
        const idxB = progRecentOrderSnapshot.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });

    masterListEl.innerHTML = filteredProgs
      .map((p) => {
        const isActive = p.id === programsState.activeId;
        return `
          <div class="prog-master-item ${isActive ? "active" : ""}" onclick="switchActiveProgram('${p.id}')">
            <span class="prog-master-name">${p.name}</span>
            <div class="prog-master-right">
              <button class="prog-pin-btn no-box-btn ${p.pinned ? "is-pinned" : ""}" onclick="togglePinProgram(event, '${p.id}')" title="${p.pinned ? "Desfijar programa" : "Fijar programa"}" aria-label="Fijar programa">
                ${starSvg}
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  if (quickSel) {
    quickSel.innerHTML = scores
      .map((s) => `<option value="${s.id}">${s.clean || s.title}</option>`)
      .join("");
  }

  const prog = getActiveProgram();
  if (detailTitleEl) {
    detailTitleEl.textContent = prog ? prog.name : "Sin programas";
  }

  const validScores = (prog ? prog.scoreIds : [])
    .map((id) => scores.find((s) => s.id === id))
    .filter(Boolean);

  const totalProgramPages = validScores.reduce((acc, sc) => acc + (sc.pageCount || 10), 0);
  if (sumEl) {
    sumEl.textContent = `Obras (${validScores.length}) · ${totalProgramPages} págs. en total`;
  }
  if (launchBtn) launchBtn.disabled = false;
  if (startConcertBtn) startConcertBtn.disabled = validScores.length === 0;

  const perfFooterLeft = document.getElementById("performerFooterLeft");
  if (perfFooterLeft && prog && performanceMode === "concert") {
    perfFooterLeft.textContent = `Programa: ${prog.name}`;
  }

  if (validScores.length === 0) {
    itemsEl.innerHTML = `
      <div class="setlist-empty-state">
        <span>No hay obras en este programa aún</span>
      </div>
    `;
    return;
  }

  const gripSvg = `<svg viewBox="0 0 24 24" class="pq-drag-ico" fill="currentColor" stroke="none" aria-hidden="true"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>`;
  const peekSvg = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const dotsSvg = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="none"><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/><circle cx="5" cy="12" r="1.5" fill="currentColor"/></svg>`;

  const notesMap = (prog && prog.notes) || {};

  itemsEl.innerHTML = validScores
    .map((s, idx) => {
      const pieceNote = (notesMap[String(s.id)] || "").trim();
      const noteHtml = pieceNote ? `<span class="sl-piece-note">${pieceNote}</span>` : "";
      return `
      <div class="setlist-item"
           data-sl-idx="${idx}"
           onpointerdown="onSlPointerDown(event, ${idx})">
        ${gripSvg}
        <span class="setlist-num">${idx + 1}</span>
        <div class="setlist-item-info" onclick="openScoreById(${s.id}, 'study')" title="Abrir partitura">
          <strong>${s.clean || s.title}</strong>
          <small>${[(s.composer || "").split("(")[0].trim(), s.period, s.group || s.ensemble].filter(Boolean).join(" · ")}</small>
          ${noteHtml}
        </div>
        <div class="setlist-item-controls" onclick="event.stopPropagation()">
          <button type="button" class="sl-item-peek-btn no-box-btn" onclick="openProgramQuickPeek(event, ${s.id})" title="Vista previa rápida" aria-label="Vista previa rápida">${peekSvg}</button>
          <button type="button" class="sl-item-more-btn no-box-btn" onclick="openSetlistItemContextMenu(event, ${idx}, ${s.id})" title="Opciones de pieza" aria-label="Opciones de pieza">${dotsSvg}</button>
        </div>
      </div>
    `;
    })
    .join("");
}

// ==========================================================================
// MÓVIL: BOTTOM SHEET PARA AGREGAR OBRAS + TABLET: MENÚ CONTEXTUAL Y QUICK PEEK
// ==========================================================================
function openMobileAddScoreSheet() {
  const sheet = document.getElementById("progAddScoreBottomSheet");
  const inp = document.getElementById("mobileProgSheetSearchInput");
  if (!sheet) return;
  if (inp) inp.value = "";
  renderMobileAddScoreSheetList();
  sheet.classList.remove("hidden");
  requestAnimationFrame(() => sheet.classList.add("is-open"));
}

function closeMobileAddScoreSheet() {
  const sheet = document.getElementById("progAddScoreBottomSheet");
  if (!sheet) return;
  sheet.classList.remove("is-open");
  sheet.classList.add("hidden");
}

function renderMobileAddScoreSheetList() {
  const listEl = document.getElementById("mobileProgSheetScoreList");
  const inp = document.getElementById("mobileProgSheetSearchInput");
  if (!listEl) return;
  const q = (inp?.value || "").trim().toLowerCase();
  const prog = getActiveProgram();
  const existingIds = new Set(prog ? prog.scoreIds : []);

  const matches = scores.filter((s) => {
    const t = (s.clean || s.title || "").toLowerCase();
    const c = (s.composer || "").toLowerCase();
    const p = (s.period || "").toLowerCase();
    const g = (s.group || s.ensemble || "").toLowerCase();
    return !q || t.includes(q) || c.includes(q) || p.includes(q) || g.includes(q);
  });

  if (matches.length === 0) {
    listEl.innerHTML = `<div class="prog-sug-empty">Sin coincidencias en tu biblioteca</div>`;
    return;
  }

  const checkSvg = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const plusSvg = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

  listEl.innerHTML = matches
    .map((s) => {
      const added = existingIds.has(s.id);
      return `
        <button type="button" class="prog-sheet-score-row ${added ? "is-added" : ""}" onclick="toggleScoreInActiveProgramFromSheet(${s.id})">
          <div class="prog-sheet-score-meta">
            <strong>${s.clean || s.title}</strong>
            <small>${[(s.composer || "").split("(")[0].trim(), s.period, s.group || s.ensemble].filter(Boolean).join(" · ")}</small>
          </div>
          <span class="prog-sheet-row-badge">${added ? checkSvg : plusSvg}</span>
        </button>
      `;
    })
    .join("");
}

function toggleScoreInActiveProgramFromSheet(scoreId) {
  const prog = getActiveProgram();
  if (!prog) return;
  const numId = Number(scoreId);
  const idx = prog.scoreIds.indexOf(numId);
  if (idx === -1) {
    prog.scoreIds.push(numId);
  } else {
    prog.scoreIds.splice(idx, 1);
  }
  prog.updatedAt = Date.now();
  saveProgramsState();
  renderSetlistDrawer();
  renderMobileAddScoreSheetList();
}

function openSetlistItemContextMenu(e, idx, scoreId) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("setlistItemContextMenu");
  const prog = getActiveProgram();
  if (!menu || !prog) return;
  const total = prog.scoreIds.length;

  const upSvg = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
  const downSvg = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`;
  const noteSvg = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
  const trashSvg = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

  menu.innerHTML = `
    <button type="button" class="wa-menu-item" ${idx === 0 ? "disabled" : ""} onclick="closeSetlistItemContextMenu(); moveProgramItem(${idx}, -1)">
      ${upSvg}
      <span>Subir</span>
    </button>
    <button type="button" class="wa-menu-item" ${idx >= total - 1 ? "disabled" : ""} onclick="closeSetlistItemContextMenu(); moveProgramItem(${idx}, 1)">
      ${downSvg}
      <span>Bajar</span>
    </button>
    <button type="button" class="wa-menu-item" onclick="closeSetlistItemContextMenu(); openProgramPieceNoteModal(${idx}, ${scoreId})">
      ${noteSvg}
      <span>Nota rápida</span>
    </button>
    <button type="button" class="wa-menu-item wa-danger" onclick="closeSetlistItemContextMenu(); removeProgramItem(${idx})">
      ${trashSvg}
      <span>Quitar del programa</span>
    </button>
  `;

  menu.classList.remove("hidden");
  if (e && e.currentTarget) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mw = 210;
    const mh = Math.max(176, menu.offsetHeight || 176);
    const left = Math.max(12, Math.min(window.innerWidth - mw - 12, rect.right - mw));
    let top = rect.bottom + 6;
    if (top + mh > window.innerHeight - 24) {
      top = Math.max(12, rect.top - mh - 6);
    }
    menu.style.width = `${mw}px`;
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }
}

function closeSetlistItemContextMenu() {
  const menu = document.getElementById("setlistItemContextMenu");
  if (menu) menu.classList.add("hidden");
}

let activeProgNoteScoreId = null;

function openProgramPieceNoteModal(idx, scoreId) {
  const prog = getActiveProgram();
  const s = scores.find((item) => item.id === Number(scoreId));
  const modal = document.getElementById("progPieceNoteModal");
  const inp = document.getElementById("progPieceNoteInput");
  const titleEl = document.getElementById("progNoteModalTitle");
  if (!prog || !modal || !inp) return;

  activeProgNoteScoreId = Number(scoreId);
  if (titleEl) {
    titleEl.textContent = s ? `Nota: ${s.clean || s.title}` : "Nota rápida";
  }
  inp.value = (prog.notes && prog.notes[String(activeProgNoteScoreId)]) || "";
  modal.classList.remove("hidden");
  setTimeout(() => {
    inp.focus();
    inp.select();
  }, 40);
}

function closeProgramPieceNoteModal() {
  const modal = document.getElementById("progPieceNoteModal");
  if (modal) modal.classList.add("hidden");
  activeProgNoteScoreId = null;
}

function saveProgramPieceNote() {
  const prog = getActiveProgram();
  const inp = document.getElementById("progPieceNoteInput");
  if (!prog || activeProgNoteScoreId == null || !inp) return;
  if (!prog.notes || typeof prog.notes !== "object") prog.notes = {};
  const val = inp.value.trim();
  if (val) {
    prog.notes[String(activeProgNoteScoreId)] = val;
  } else {
    delete prog.notes[String(activeProgNoteScoreId)];
  }
  prog.updatedAt = Date.now();
  saveProgramsState();
  closeProgramPieceNoteModal();
  renderSetlistDrawer();
}

async function openProgramQuickPeek(e, scoreId) {
  if (e) e.stopPropagation();
  const s = scores.find((item) => item.id === Number(scoreId));
  const modal = document.getElementById("progQuickPeekModal");
  const titleEl = document.getElementById("progPeekTitle");
  const subEl = document.getElementById("progPeekSub");
  const box = document.getElementById("progPeekPreviewBox");
  const openBtn = document.getElementById("progPeekOpenStudyBtn");
  if (!s || !modal || !box) return;

  if (titleEl) titleEl.textContent = s.clean || s.title;
  if (subEl) {
    subEl.textContent = [s.composer, s.period, s.group || s.ensemble, s.pages].filter(Boolean).join(" · ");
  }
  if (openBtn) {
    openBtn.onclick = () => {
      closeProgramQuickPeek();
      openScoreById(s.id, "study");
    };
  }

  let thumbUrl = s.thumbDataUrl || null;
  if (!thumbUrl && s.isRealPdf && s.pdfBytes && typeof generatePdfThumbnailDataUrl === "function") {
    box.innerHTML = `<div class="prog-peek-loading">Renderizando primera página...</div>`;
    modal.classList.remove("hidden");
    try {
      const prev = await generatePdfThumbnailDataUrl(s.pdfBytes);
      if (prev && prev.thumbUrl) {
        thumbUrl = prev.thumbUrl;
        s.thumbDataUrl = thumbUrl;
      }
    } catch (_) {}
  }

  if (thumbUrl) {
    box.innerHTML = `<img src="${thumbUrl}" alt="${s.clean || s.title}" class="prog-peek-img" />`;
  } else {
    box.innerHTML = `
      <div class="prog-peek-folio-mock">
        <div class="folio-preview-head">
          <strong>${s.clean || s.title}</strong>
          <small>${s.composer || ""}</small>
        </div>
        <div class="mini-staves">
          <div class="mini-staff-bar"></div>
          <div class="mini-staff-bar"></div>
          <div class="mini-staff-bar"></div>
          <div class="mini-staff-bar"></div>
        </div>
        <div class="folio-preview-foot">
          <span>${s.tuning || ""}</span>
          <span>${s.pages || ""}</span>
        </div>
      </div>
    `;
  }
  modal.classList.remove("hidden");
}

function closeProgramQuickPeek() {
  const modal = document.getElementById("progQuickPeekModal");
  if (modal) modal.classList.add("hidden");
}

let slDragIndex = null;

function reorderSetlist(fromIdx, toIdx) {
  const prog = getActiveProgram();
  if (!prog || fromIdx === null || fromIdx === toIdx) return;
  if (fromIdx < 0 || toIdx < 0 || fromIdx >= prog.scoreIds.length || toIdx >= prog.scoreIds.length) return;
  const [moved] = prog.scoreIds.splice(fromIdx, 1);
  prog.scoreIds.splice(toIdx, 0, moved);
  saveProgramsState();
  renderSetlistDrawer();
}

function onSlDragStart(e, idx) {
  slDragIndex = idx;
  e.currentTarget.classList.add("dragging");
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
}

function onSlDragOver(e, idx) {
  e.preventDefault();
  if (slDragIndex !== null && slDragIndex !== idx) {
    e.currentTarget.classList.add("drag-over");
  }
}

function onSlDragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

function onSlDrop(e, idx) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");
  reorderSetlist(slDragIndex, idx);
  slDragIndex = null;
}

function onSlDragEnd(e) {
  e.currentTarget.classList.remove("dragging");
  slDragIndex = null;
}

function startFloatingReorderDrag(e, { itemSelector, idxAttr, initialIdx, onReorder }) {
  if (e.target.closest("button")) return;
  const itemEl = e.currentTarget;
  const isHandle = Boolean(e.target.closest(".pq-drag-ico"));
  const startX = e.clientX;
  const startY = e.clientY;
  const rect = itemEl.getBoundingClientRect();
  const offsetX = startX - rect.left;
  const offsetY = startY - rect.top;

  let currentIdx = initialIdx;
  let dragStarted = false;
  let gestureCancelled = false;
  let ghost = null;

  const beginGhost = () => {
    if (dragStarted || gestureCancelled) return;
    dragStarted = true;
    document.body.classList.add("is-reordering-drag");
    if (navigator.vibrate) {
      try { navigator.vibrate(12); } catch (_) {}
    }
    ghost = itemEl.cloneNode(true);
    ghost.classList.add("floating-drag-ghost");
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    document.body.appendChild(ghost);
    itemEl.classList.add("dragging", "is-drag-slot");
  };

  // Si toca el icono ≡ inicia al arrastrar; si toca el cuerpo de la fila, requiere mantener presionado 280ms sin deslizar (para no chocar con el scroll)
  const holdTimer = isHandle ? null : setTimeout(beginGhost, 280);

  const onMove = (ev) => {
    if (gestureCancelled) return;
    const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);

    if (!dragStarted) {
      if (isHandle) {
        if (dist < 4) return;
        beginGhost();
      } else {
        // Si desliza antes de cumplir los 280ms, es gesto de scroll del menú: cancelar arrastre
        if (dist > 8) {
          gestureCancelled = true;
          clearTimeout(holdTimer);
          cleanup();
        }
        return;
      }
    }

    ev.preventDefault();
    if (ghost) {
      ghost.style.left = `${ev.clientX - offsetX}px`;
      ghost.style.top = `${ev.clientY - offsetY}px`;
    }
    const elUnder = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(itemSelector);
    if (elUnder) {
      const targetIdx = Number(elUnder.dataset[idxAttr]);
      if (!Number.isNaN(targetIdx) && targetIdx !== currentIdx) {
        onReorder(currentIdx, targetIdx);
        currentIdx = targetIdx;
        document.querySelectorAll(`${itemSelector}[data-${idxAttr.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}="${currentIdx}"]`)
          .forEach((el) => el.classList.add("dragging", "is-drag-slot"));
      }
    }
  };

  const cleanup = () => {
    clearTimeout(holdTimer);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    document.body.classList.remove("is-reordering-drag");
    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    ghost = null;
    document.querySelectorAll(`${itemSelector}.dragging, ${itemSelector}.is-drag-slot`)
      .forEach((el) => el.classList.remove("dragging", "is-drag-slot"));
  };

  const onUp = () => {
    const wasDragging = dragStarted;
    cleanup();
    if (wasDragging) {
      const suppressClick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      document.addEventListener("click", suppressClick, { capture: true, once: true });
      setTimeout(() => document.removeEventListener("click", suppressClick, true), 250);
    }
  };

  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

function onSlPointerDown(e, idx) {
  startFloatingReorderDrag(e, {
    itemSelector: ".setlist-item",
    idxAttr: "slIdx",
    initialIdx: idx,
    onReorder: (from, to) => reorderSetlist(from, to)
  });
}

function saveSetlistDrawerChanges() {
  saveProgramsState();
  renderSetlistDrawer();
  closeProgramsSlideView();
}

async function launchActiveProgramInConcert() {
  const prog = getActiveProgram();
  if (!prog || prog.scoreIds.length === 0) return;
  activeProgramScoreIndex = 0;
  await openScoreById(prog.scoreIds[0], "concert");
}

async function stepProgramPiece(dir) {
  const prog = getActiveProgram();
  if (!prog || prog.scoreIds.length === 0) return;
  activeProgramScoreIndex = Math.max(0, Math.min(prog.scoreIds.length - 1, activeProgramScoreIndex + dir));
  const nextId = prog.scoreIds[activeProgramScoreIndex];
  if (nextId) await openScoreById(nextId, "concert");
}

// ==========================================================================
// UTILIDADES DE ENSAYO: METRÓNOMO ESPECIALIZADO Y AFINADOR (WEB AUDIO API)
// ==========================================================================
let performerAudioCtx = null;
let metroBpm = 76;
let metroIsPlaying = false;
let metroLookaheadTimer = null;
let metroNextNoteTime = 0;
let metroCurrentBeat = 0;
let metroCurrentSub = 0;
let metroBarCount = 0;
let metroCountInRemainingBars = 0;

// Configuración musical del metrónomo
let metroMeter = "4/4";
let metroBeatsPerBar = 4;
// Niveles de acento por pulso: 3 = Fuerte (Downbeat), 2 = Medio, 1 = Débil, 0 = Silencio
let metroBeatAccents = [3, 1, 1, 1];
let metroSubdiv = 1; // 1 | 2 | 3 | 4 | 'dotted'
let metroSound = "wood"; // 'wood' | 'mech' | 'soft' | 'click' | 'silent'
let metroVisualHalo = false;

// Entrenador de estudio (Escalera progresiva / Compás mudo / Pre-cuenta)
let metroTrainerMode = "off"; // 'off' | 'ladder' | 'mute'
let metroTrainerBaseBpm = 76;
let metroLadderStep = 2;
let metroLadderBars = 4;
let metroLadderTarget = 108;
let metroMutePlayBars = 3;
let metroMuteSilentBars = 1;
let metroCountInBars = 0;

// Tap Tempo
let metroTapTimestamps = [];
let metroNoiseBuffer = null;

// Afinador
let tunerOsc = null;
let tunerHz = 440;

const METRO_STORAGE_KEY = "cadenza_metronome_score_presets_v1";
const REHEARSAL_PASSAGES_STORAGE_KEY = "cadenza_rehearsal_passages_v1";
const REHEARSAL_SESSIONS_STORAGE_KEY = "cadenza_rehearsal_sessions_v1";

let rehearsalPassagesByScore = {};
let rehearsalSessionElapsedSeconds = 0;
let rehearsalSessionInterval = null;
let rehearsalSessionStartBpm = 76;

function loadRehearsalPassagesState() {
  try {
    const raw = localStorage.getItem(REHEARSAL_PASSAGES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") rehearsalPassagesByScore = parsed;
    }
  } catch (_) {}
}

function saveRehearsalPassagesState() {
  try {
    localStorage.setItem(REHEARSAL_PASSAGES_STORAGE_KEY, JSON.stringify(rehearsalPassagesByScore));
  } catch (_) {}
}

function formatRehearsalTimer(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function syncRehearsalContextBanner() {
  const titleEl = document.getElementById("rehearsalWorkTitle");
  const pageEl = document.getElementById("rehearsalPageLabel");
  const startLbl = document.getElementById("rehearsalStartBpmLbl");
  const targetLbl = document.getElementById("rehearsalTargetBpmLbl");
  if (titleEl && activeScore) {
    const shortComp = (activeScore.composer || "").split("(")[0].trim();
    const displayTitle = activeScore.clean || activeScore.title;
    titleEl.textContent = shortComp ? `${shortComp} — ${displayTitle}` : displayTitle;
  }
  if (pageEl) {
    pageEl.textContent = `Pág. ${pageNum || 1}`;
  }
  if (startLbl) {
    startLbl.textContent = String(metroTrainerBaseBpm || metroBpm);
  }
  if (targetLbl) {
    const goal = metroTrainerMode === "ladder" ? metroLadderTarget : metroBpm;
    targetLbl.textContent = `${goal} BPM`;
  }
  renderRehearsalPassagesList();
}

function renderRehearsalPassagesList() {
  const listEl = document.getElementById("rehearsalPassagesList");
  if (!listEl) return;
  const sId = activeScore ? String(activeScore.id) : "1";
  const items = rehearsalPassagesByScore[sId] || [];
  if (items.length === 0) {
    listEl.innerHTML = `<span class="rp-empty">Guarda un pasaje difícil para practicar su progresión de BPM.</span>`;
    return;
  }
  listEl.innerHTML = items
    .map(
      (p, idx) => `
      <div class="rp-item" onclick="loadRehearsalPassage(${idx})" title="Cargar este pasaje (ir a Pág. ${p.page} a ${p.currentBpm} BPM)">
        <div class="rp-item-main">
          <strong>Pág. ${p.page}</strong>
          <span>${p.startBpm} → ${p.targetBpm} BPM</span>
        </div>
        <button type="button" class="rp-del-btn" onclick="deleteRehearsalPassage(event, ${idx})" aria-label="Eliminar pasaje">✕</button>
      </div>
    `
    )
    .join("");
}

function addRehearsalPassageForCurrentPage() {
  const sId = activeScore ? String(activeScore.id) : "1";
  if (!rehearsalPassagesByScore[sId]) rehearsalPassagesByScore[sId] = [];
  const startBpm = metroTrainerBaseBpm || metroBpm;
  const targetBpm = metroTrainerMode === "ladder" ? metroLadderTarget : Math.min(240, metroBpm + 12);
  rehearsalPassagesByScore[sId].unshift({
    id: `rp-${Date.now()}`,
    page: pageNum || 1,
    startBpm,
    currentBpm: metroBpm,
    targetBpm,
    updatedAt: Date.now()
  });
  saveRehearsalPassagesState();
  renderRehearsalPassagesList();
}

async function loadRehearsalPassage(idx) {
  const sId = activeScore ? String(activeScore.id) : "1";
  const items = rehearsalPassagesByScore[sId] || [];
  const p = items[idx];
  if (!p) return;
  metroTrainerBaseBpm = p.startBpm || p.currentBpm || 76;
  metroLadderTarget = p.targetBpm || 108;
  const targetInp = document.getElementById("metroLadderTarget");
  if (targetInp) targetInp.value = String(metroLadderTarget);
  setMetronomeBpm(p.currentBpm || p.startBpm || 76);
  if (p.page && p.page !== pageNum) {
    await jumpToPage(p.page);
  }
  syncRehearsalContextBanner();
}

function deleteRehearsalPassage(e, idx) {
  if (e) e.stopPropagation();
  const sId = activeScore ? String(activeScore.id) : "1";
  if (!rehearsalPassagesByScore[sId]) return;
  rehearsalPassagesByScore[sId].splice(idx, 1);
  saveRehearsalPassagesState();
  renderRehearsalPassagesList();
}

function recordCompletedRehearsalSession() {
  if (rehearsalSessionElapsedSeconds < 5 || !activeScore) return;
  try {
    const raw = localStorage.getItem(REHEARSAL_SESSIONS_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({
      scoreId: activeScore.id,
      page: pageNum || 1,
      durationSec: rehearsalSessionElapsedSeconds,
      startBpm: rehearsalSessionStartBpm,
      endBpm: metroBpm,
      targetBpm: metroTrainerMode === "ladder" ? metroLadderTarget : metroBpm,
      timestamp: Date.now()
    });
    if (list.length > 60) list.length = 60;
    localStorage.setItem(REHEARSAL_SESSIONS_STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

function getPerformerAudioCtx() {
  if (!performerAudioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) performerAudioCtx = new Ctx();
  }
  if (performerAudioCtx && performerAudioCtx.state === "suspended") {
    performerAudioCtx.resume();
  }
  return performerAudioCtx;
}

function getMetronomeNoiseBuffer(ctx) {
  if (metroNoiseBuffer && metroNoiseBuffer.sampleRate === ctx.sampleRate) {
    return metroNoiseBuffer;
  }
  const bufferSize = Math.floor(ctx.sampleRate * 0.06);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
  }
  metroNoiseBuffer = buffer;
  return buffer;
}

function getClassicalAgogicName(bpm) {
  if (bpm < 45) return "Grave";
  if (bpm < 55) return "Largo";
  if (bpm < 66) return "Larghetto";
  if (bpm < 78) return "Adagio";
  if (bpm < 98) return "Andante";
  if (bpm < 116) return "Moderato";
  if (bpm < 132) return "Allegretto";
  if (bpm < 168) return "Allegro";
  if (bpm < 200) return "Vivace";
  return "Presto";
}

function getDefaultAccentsForMeter(meter) {
  switch (meter) {
    case "2/4":
      return [3, 1];
    case "3/4":
      return [3, 1, 1];
    case "4/4":
      return [3, 1, 2, 1];
    case "6/8":
      return [3, 1, 1, 2, 1, 1];
    case "5/4":
      return [3, 1, 1, 2, 1];
    case "7/8":
      return [3, 1, 1, 2, 1, 2, 1];
    default:
      return [3, 1, 1, 1];
  }
}

function renderMetronomeBeatsStrip() {
  const strip = document.getElementById("metroBeatsStrip");
  if (!strip) return;
  strip.innerHTML = "";
  metroBeatAccents.forEach((acc, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "metro-beat-node";
    btn.dataset.index = String(idx);
    btn.dataset.accent = String(acc);
    const labels = ["Silencio", "Débil", "Medio", "Fuerte"];
    btn.title = `Tiempo ${idx + 1}: ${labels[acc] || "Normal"} (toca para cambiar)`;
    btn.onclick = (e) => {
      e.stopPropagation();
      // Ciclo: 3 (Fuerte) -> 2 (Medio) -> 1 (Débil) -> 0 (Silencio) -> 3
      const next = acc === 3 ? 2 : acc === 2 ? 1 : acc === 1 ? 0 : 3;
      metroBeatAccents[idx] = next;
      renderMetronomeBeatsStrip();
      saveMetronomePresetForCurrentScore();
    };
    strip.appendChild(btn);
  });
}

function toggleMetronomePopover(e) {
  if (e) e.stopPropagation();
  closeTunerPopoverAndStop();
  syncRehearsalContextBanner();
  const pop = document.getElementById("metronomePopover");
  if (!pop) return;
  const willShow = pop.classList.contains("hidden");
  pop.classList.toggle("hidden", !willShow);
  if (willShow) {
    activePerformerContext = "rehearse";
  } else if (activePerformerContext === "rehearse") {
    activePerformerContext = "read";
  }
  syncPerformerContextButtonsUI();
}

function setMetronomeBpm(val, { fromTrainer = false } = {}) {
  metroBpm = Math.max(30, Math.min(240, parseInt(val, 10) || 76));
  if (!fromTrainer) {
    metroTrainerBaseBpm = metroBpm;
  }
  const lbl = document.getElementById("metroBpmValue");
  const chipLbl = document.getElementById("metroChipLabel");
  const rng = document.getElementById("metroBpmRange");
  const agogicLbl = document.getElementById("metroAgogicLabel");
  if (lbl) lbl.textContent = `${metroBpm}`;
  if (chipLbl) chipLbl.textContent = `${metroBpm}`;
  if (rng) rng.value = String(metroBpm);
  if (agogicLbl) agogicLbl.textContent = getClassicalAgogicName(metroBpm);
  syncRehearsalContextBanner();
  if (!fromTrainer) {
    saveMetronomePresetForCurrentScore();
    saveLastStudySessionState();
  }
}

function resetMetronomeTrainerBase() {
  if (metroTrainerMode === "ladder" && metroBpm !== metroTrainerBaseBpm) {
    setMetronomeBpm(metroTrainerBaseBpm);
  }
}

function stepMetronomeBpm(delta) {
  setMetronomeBpm(metroBpm + delta);
}

function tapMetronomeTempo() {
  const now = performance.now();
  const tapBtn = document.getElementById("btnMetroTap");
  if (tapBtn) {
    tapBtn.classList.add("tap-flash");
    setTimeout(() => tapBtn.classList.remove("tap-flash"), 110);
  }
  // Si pasaron más de 2.4 segundos desde el último tap, reiniciar ventana
  if (metroTapTimestamps.length > 0 && now - metroTapTimestamps[metroTapTimestamps.length - 1] > 2400) {
    metroTapTimestamps = [];
  }
  metroTapTimestamps.push(now);
  if (metroTapTimestamps.length > 5) {
    metroTapTimestamps.shift();
  }
  if (metroTapTimestamps.length >= 2) {
    let totalDiff = 0;
    for (let i = 1; i < metroTapTimestamps.length; i++) {
      totalDiff += metroTapTimestamps[i] - metroTapTimestamps[i - 1];
    }
    const avgMs = totalDiff / (metroTapTimestamps.length - 1);
    const computedBpm = Math.round(60000 / avgMs);
    setMetronomeBpm(computedBpm);
  }
}

function setMetronomeMeter(meter, btn) {
  metroMeter = meter;
  metroBeatAccents = getDefaultAccentsForMeter(meter);
  metroBeatsPerBar = metroBeatAccents.length;
  metroCurrentBeat = 0;
  metroCurrentSub = 0;

  document.querySelectorAll("#metroMeterGroup .metro-pill-btn").forEach((b) => {
    b.classList.toggle("active", b === btn || (!btn && b.textContent.trim() === meter));
  });
  renderMetronomeBeatsStrip();
  saveMetronomePresetForCurrentScore();
}

function setMetronomeSubdiv(subdiv, btn) {
  metroSubdiv = subdiv;
  metroCurrentSub = 0;
  document.querySelectorAll("#metroSubdivGroup .metro-pill-btn").forEach((b) => {
    if (btn) {
      b.classList.toggle("active", b === btn);
    }
  });
  saveMetronomePresetForCurrentScore();
}

function setMetronomeSound(sound) {
  metroSound = sound;
  const sel = document.getElementById("metroSoundSelect");
  if (sel && sel.value !== sound) sel.value = sound;
  saveMetronomePresetForCurrentScore();
}

function toggleMetronomeVisualHalo(forceState) {
  metroVisualHalo = typeof forceState === "boolean" ? forceState : !metroVisualHalo;
  document.getElementById("btnMetroVisualHalo")?.classList.toggle("active", metroVisualHalo);
  saveMetronomePresetForCurrentScore();
}

function toggleMetronomeTrainerPanel() {
  const body = document.getElementById("metroTrainerBody");
  const caret = document.getElementById("metroTrainerCaret");
  if (!body) return;
  const isHidden = body.classList.toggle("hidden");
  if (caret) caret.textContent = isHidden ? "▸" : "▾";
}

function setMetronomeTrainerMode(mode, btn) {
  metroTrainerMode = mode;
  metroBarCount = 0;
  if (btn) {
    document.querySelectorAll(".metro-tmode-btn").forEach((b) => b.classList.toggle("active", b === btn));
  }
  document.getElementById("metroCfgLadder")?.classList.toggle("hidden", mode !== "ladder");
  document.getElementById("metroCfgMute")?.classList.toggle("hidden", mode !== "mute");
  updateMetronomeTrainerParams();
}

function updateMetronomeTrainerParams() {
  metroLadderStep = parseInt(document.getElementById("metroLadderStep")?.value || "2", 10);
  metroLadderBars = parseInt(document.getElementById("metroLadderBars")?.value || "4", 10);
  metroLadderTarget = Math.max(35, Math.min(240, parseInt(document.getElementById("metroLadderTarget")?.value || "108", 10)));
  metroMutePlayBars = parseInt(document.getElementById("metroMutePlayBars")?.value || "3", 10);
  metroMuteSilentBars = parseInt(document.getElementById("metroMuteSilentBars")?.value || "1", 10);

  const badge = document.getElementById("metroTrainerBadge");
  if (badge) {
    if (metroTrainerMode === "ladder") {
      badge.textContent = `+${metroLadderStep}/${metroLadderBars}c`;
      badge.classList.add("active");
    } else if (metroTrainerMode === "mute") {
      badge.textContent = `${metroMutePlayBars}+${metroMuteSilentBars}m`;
      badge.classList.add("active");
    } else {
      badge.textContent = "Off";
      badge.classList.remove("active");
    }
  }
  syncRehearsalContextBanner();
}

function setMetronomeCountIn(bars, btn) {
  metroCountInBars = parseInt(bars, 10) || 0;
  if (btn) {
    btn.parentElement?.querySelectorAll(".metro-pill-btn").forEach((b) => b.classList.toggle("active", b === btn));
  }
}

// Síntesis acústica especializada Web Audio API (Cero latencia, cero archivos externos)
function scheduleMetronomeGrain(ctx, time, accentLevel, isSubdivision, isCountIn) {
  if (metroSound === "silent" || accentLevel === 0) return;

  // Ganancia y frecuencia base según jerarquía rítmica
  let freq = 820;
  let peakGain = 0.22;

  if (isCountIn) {
    freq = 1240;
    peakGain = 0.18;
  } else if (isSubdivision) {
    freq = 620;
    peakGain = 0.085;
  } else if (accentLevel === 3) {
    freq = 1120;
    peakGain = 0.34;
  } else if (accentLevel === 2) {
    freq = 920;
    peakGain = 0.24;
  } else {
    freq = 760;
    peakGain = 0.16;
  }

  if (metroSound === "wood") {
    // Madera Lutier (Clave / Woodblock resonante con ataque percusivo cálido)
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    subOsc.type = "sine";
    osc.frequency.setValueAtTime(freq * 1.15, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.86, time + 0.028);

    subOsc.frequency.setValueAtTime(freq * 0.72, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peakGain, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0008, time + 0.036);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    subOsc.start(time);
    osc.stop(time + 0.04);
    subOsc.stop(time + 0.04);
  } else if (metroSound === "mech") {
    // Mecánico Wittner (Transitorio de escape metálico + cuerpo de caja de madera)
    const noise = ctx.createBufferSource();
    noise.buffer = getMetronomeNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(accentLevel === 3 ? 2100 : 1550, time);
    filter.Q.setValueAtTime(3.2, time);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(peakGain * 1.1, time);
    nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

    const bodyOsc = ctx.createOscillator();
    const bGain = ctx.createGain();
    bodyOsc.type = "triangle";
    bodyOsc.frequency.setValueAtTime(accentLevel === 3 ? 640 : 480, time);
    bGain.gain.setValueAtTime(peakGain * 0.55, time);
    bGain.gain.exponentialRampToValueAtTime(0.001, time + 0.022);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);

    bodyOsc.connect(bGain);
    bGain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.03);
    bodyOsc.start(time);
    bodyOsc.stop(time + 0.026);
  } else if (metroSound === "soft") {
    // Fieltro Suave (Ideal para estudio nocturno o pasajes pianissimo)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    const softFreq = freq * 0.62;
    osc.frequency.setValueAtTime(softFreq, time);
    osc.frequency.exponentialRampToValueAtTime(softFreq * 0.78, time + 0.05);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peakGain * 0.85, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0008, time + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);
  } else {
    // Estudio Seco (Click de alta definición)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * 1.35, time);
    osc.frequency.exponentialRampToValueAtTime(320, time + 0.016);

    gain.gain.setValueAtTime(peakGain, time);
    gain.gain.exponentialRampToValueAtTime(0.0008, time + 0.018);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.02);
  }
}

function triggerMetronomeVisualPulse(beatIndex, accentLevel, isSubdivision) {
  if (isSubdivision) return;

  const topIcon = document.getElementById("metroTopIcon");
  if (topIcon) {
    topIcon.classList.add("beat-flash");
    setTimeout(() => topIcon.classList.remove("beat-flash"), 95);
  }

  const nodes = document.querySelectorAll("#metroBeatsStrip .metro-beat-node");
  nodes.forEach((node, idx) => {
    if (idx === beatIndex) {
      node.classList.add("is-beating");
      setTimeout(() => node.classList.remove("is-beating"), 115);
    } else {
      node.classList.remove("is-beating");
    }
  });

  if (metroVisualHalo || metroSound === "silent") {
    const stage = document.getElementById("performerStage");
    if (stage) {
      const cls = accentLevel === 3 ? "metro-halo-downbeat" : "metro-halo-beat";
      stage.classList.add(cls);
      setTimeout(() => stage.classList.remove("metro-halo-downbeat", "metro-halo-beat"), 110);
    }
  }
}

function advanceMetronomeNote() {
  const secondsPerBeat = 60.0 / metroBpm;
  const subCount = metroSubdiv === "dotted" ? 2 : Number(metroSubdiv) || 1;

  if (metroSubdiv === "dotted") {
    // 75% para la primera figura (corchea con puntillo), 25% para la semicorchea
    const factor = metroCurrentSub === 0 ? 0.75 : 0.25;
    metroNextNoteTime += secondsPerBeat * factor;
  } else {
    metroNextNoteTime += secondsPerBeat / subCount;
  }

  metroCurrentSub++;
  if (metroCurrentSub >= subCount) {
    metroCurrentSub = 0;
    metroCurrentBeat++;
    if (metroCurrentBeat >= metroBeatsPerBar) {
      metroCurrentBeat = 0;

      if (metroCountInRemainingBars > 0) {
        metroCountInRemainingBars--;
      } else {
        metroBarCount++;
        // Evaluar Escalera Progresiva al inicio de un nuevo compás
        if (metroTrainerMode === "ladder" && metroBarCount > 0 && metroBarCount % metroLadderBars === 0) {
          if (metroBpm < metroLadderTarget) {
            const nextBpm = Math.min(metroLadderTarget, metroBpm + metroLadderStep);
            setMetronomeBpm(nextBpm, { fromTrainer: true });
          }
        }
      }
    }
  }
}

function runMetronomeScheduler() {
  const ctx = getPerformerAudioCtx();
  if (!ctx || !metroIsPlaying) return;

  const scheduleAheadTime = 0.1; // 100ms lookahead
  while (metroNextNoteTime < ctx.currentTime + scheduleAheadTime) {
    const beatIdx = metroCurrentBeat;
    const subIdx = metroCurrentSub;
    const isSub = subIdx > 0;
    const isCountIn = metroCountInRemainingBars > 0;
    const accent = metroBeatAccents[beatIdx] ?? 1;

    // Verificar si este compás debe silenciarse por el modo "Compás Mudo"
    let isMutedByTrainer = false;
    if (!isCountIn && metroTrainerMode === "mute") {
      const cycle = metroMutePlayBars + metroMuteSilentBars;
      const posInCycle = metroBarCount % cycle;
      if (posInCycle >= metroMutePlayBars) {
        isMutedByTrainer = true;
      }
    }

    if (!isMutedByTrainer) {
      scheduleMetronomeGrain(ctx, metroNextNoteTime, accent, isSub, isCountIn);
    }

    const delayMs = Math.max(0, (metroNextNoteTime - ctx.currentTime) * 1000);
    setTimeout(() => {
      if (metroIsPlaying) {
        triggerMetronomeVisualPulse(beatIdx, accent, isSub);
      }
    }, delayMs);

    advanceMetronomeNote();
  }
}

function toggleMetronomePlay() {
  const btn = document.getElementById("btnMetroPlay");
  const chip = document.getElementById("metroLiveChip");
  const timerPill = document.getElementById("metroSessionTimerPill");

  if (metroIsPlaying) {
    metroIsPlaying = false;
    if (metroLookaheadTimer) {
      clearInterval(metroLookaheadTimer);
      metroLookaheadTimer = null;
    }
    if (rehearsalSessionInterval) {
      clearInterval(rehearsalSessionInterval);
      rehearsalSessionInterval = null;
    }
    recordCompletedRehearsalSession();
    if (btn) btn.textContent = "▶ Iniciar ensayo";
    if (chip) chip.classList.remove("active");
    if (timerPill) timerPill.classList.remove("is-running");
    return;
  }

  const ctx = getPerformerAudioCtx();
  if (!ctx) return;

  metroIsPlaying = true;
  rehearsalSessionStartBpm = metroBpm;
  rehearsalSessionElapsedSeconds = 0;
  if (timerPill) {
    timerPill.textContent = "00:00";
    timerPill.classList.add("is-running");
  }
  if (rehearsalSessionInterval) clearInterval(rehearsalSessionInterval);
  rehearsalSessionInterval = setInterval(() => {
    rehearsalSessionElapsedSeconds++;
    if (timerPill) timerPill.textContent = formatRehearsalTimer(rehearsalSessionElapsedSeconds);
  }, 1000);

  metroCurrentBeat = 0;
  metroCurrentSub = 0;
  metroBarCount = 0;
  metroCountInRemainingBars = metroCountInBars;
  metroNextNoteTime = ctx.currentTime + 0.03;

  runMetronomeScheduler();
  metroLookaheadTimer = setInterval(runMetronomeScheduler, 25);

  if (btn) btn.textContent = "■ Detener ensayo";
  if (chip) chip.classList.add("active");
}

// Memoria de tempo y compás por partitura + arrastre suave del popover
function saveMetronomePresetForCurrentScore() {
  if (!activeScore || !activeScore.id) return;
  try {
    const raw = localStorage.getItem(METRO_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[activeScore.id] = {
      bpm: metroBpm,
      meter: metroMeter,
      accents: metroBeatAccents,
      subdiv: metroSubdiv,
      sound: metroSound,
      halo: metroVisualHalo
    };
    localStorage.setItem(METRO_STORAGE_KEY, JSON.stringify(map));
  } catch (_) {}
}

function loadMetronomePresetForScore(scoreId) {
  if (!scoreId) return;
  try {
    const raw = localStorage.getItem(METRO_STORAGE_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    const preset = map[scoreId];
    if (!preset) return;

    if (preset.meter) {
      metroMeter = preset.meter;
      metroBeatAccents = Array.isArray(preset.accents) && preset.accents.length > 0
        ? preset.accents.slice()
        : getDefaultAccentsForMeter(preset.meter);
      metroBeatsPerBar = metroBeatAccents.length;
      document.querySelectorAll("#metroMeterGroup .metro-pill-btn").forEach((b) => {
        b.classList.toggle("active", b.textContent.trim() === metroMeter);
      });
      renderMetronomeBeatsStrip();
    }
    if (preset.bpm) {
      setMetronomeBpm(preset.bpm, { fromTrainer: true });
      metroTrainerBaseBpm = metroBpm;
    }
    if (preset.subdiv !== undefined) {
      metroSubdiv = preset.subdiv;
      const subMap = { 1: "♩", 2: "♫", 3: "🎶", 4: "♬", dotted: "♩.♪" };
      document.querySelectorAll("#metroSubdivGroup .metro-pill-btn").forEach((b) => {
        b.classList.toggle("active", b.textContent.trim() === subMap[metroSubdiv]);
      });
    }
    if (preset.sound) {
      metroSound = preset.sound;
      const sel = document.getElementById("metroSoundSelect");
      if (sel) sel.value = metroSound;
    }
    if (typeof preset.halo === "boolean") {
      metroVisualHalo = preset.halo;
      document.getElementById("btnMetroVisualHalo")?.classList.toggle("active", metroVisualHalo);
    }
  } catch (_) {}
}

function initMetronomePopover() {
  loadRehearsalPassagesState();
  renderMetronomeBeatsStrip();
  setMetronomeBpm(metroBpm, { fromTrainer: true });
  syncRehearsalContextBanner();

  const pop = document.getElementById("metronomePopover");
  const header = document.getElementById("metroPopoverHeader");
  if (!pop || !header) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  header.onpointerdown = (e) => {
    if (e.target.closest("button")) return;
    isDragging = true;
    try { header.setPointerCapture(e.pointerId); } catch (_) {}
    const rect = pop.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    startX = e.clientX;
    startY = e.clientY;
    e.preventDefault();
  };

  header.onpointermove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newX = Math.max(8, Math.min(window.innerWidth - pop.offsetWidth - 8, initialLeft + dx));
    const newY = Math.max(8, Math.min(window.innerHeight - pop.offsetHeight - 8, initialTop + dy));
    pop.style.left = `${newX}px`;
    pop.style.top = `${newY}px`;
    pop.style.right = "auto";
    pop.style.bottom = "auto";
  };

  const stopDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    try { header.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  header.onpointerup = stopDrag;
  header.onpointercancel = stopDrag;
}

// ==========================================================================
// AFINADOR TIPO PINZA MINIMALISTA (FENDER / DONNER CLIP-ON + AUTOCORRELACIÓN)
// ==========================================================================
const TUNER_STORAGE_KEY = "cadenza_clip_tuner_settings_v1";

// Ciclos de instrumentos con sus cuerdas estándar (en números MIDI) y SVG lineal minimalista
const TUNER_INSTRUMENTS = [
  {
    id: "guitar",
    name: "Guitarra",
    // 6E (E2=40), 5A (A2=45), 4D (D3=50), 3G (G3=55), 2B (B3=59), 1E (E4=64)
    strings: [
      { label: "6ª", midi: 40 },
      { label: "5ª", midi: 45 },
      { label: "4ª", midi: 50 },
      { label: "3ª", midi: 55 },
      { label: "2ª", midi: 59 },
      { label: "1ª", midi: 64 }
    ],
    // Silueta lineal elegante de guitarra clásica (cuerpo en 8, boca circular, mástil y clavijero)
    svg: `<svg viewBox="0 0 24 24"><path d="M9.5 10.5c-2 0-3.3 1.4-3.3 3.2 0 1 .5 1.9 1.2 2.4-1.3.7-2.2 2-2.2 3.6 0 2.3 2 3.8 4.8 3.8s4.8-1.5 4.8-3.8c0-1.6-.9-2.9-2.2-3.6.7-.5 1.2-1.4 1.2-2.4 0-1.8-1.3-3.2-3.3-3.2h-1z"/><circle cx="10" cy="14.2" r="1.4"/><line x1="8.6" y1="19.8" x2="11.4" y2="19.8"/><path d="M10 10.5V3.5"/><rect x="8.8" y="1.5" width="2.4" height="2" rx="0.6"/></svg>`
  },
  {
    id: "violin",
    name: "Violín",
    // 4G (G3=55), 3D (D4=62), 2A (A4=69), 1E (E5=76)
    strings: [
      { label: "4ª", midi: 55 },
      { label: "3ª", midi: 62 },
      { label: "2ª", midi: 69 },
      { label: "1ª", midi: 76 }
    ],
    // Silueta lineal de violín con efes (f-holes) y voluta superior
    svg: `<svg viewBox="0 0 24 24"><path d="M9.6 10c-1.8.2-3 1.5-3 3 0 1 .6 1.8 1.5 2.3-1.4.6-2.3 1.9-2.3 3.4 0 2.1 1.8 3.6 4.2 3.6s4.2-1.5 4.2-3.6c0-1.5-.9-2.8-2.3-3.4.9-.5 1.5-1.3 1.5-2.3 0-1.5-1.2-2.8-3-3h-.8z"/><path d="M8.3 15.8c.4.8.4 1.8 0 2.6"/><path d="M11.7 15.8c-.4.8-.4 1.8 0 2.6"/><path d="M10 10V3.2"/><circle cx="10" cy="2.1" r="1.1"/><line x1="16.5" y1="3" x2="19.5" y2="21"/></svg>`
  },
  {
    id: "cello",
    name: "Chelo",
    // 4C (C2=36), 3G (G2=43), 2D (D3=50), 1A (A3=57)
    strings: [
      { label: "4ª", midi: 36 },
      { label: "3ª", midi: 43 },
      { label: "2ª", midi: 50 },
      { label: "1ª", midi: 57 }
    ],
    // Silueta lineal de violonchelo con pica inferior (endpin) y efes
    svg: `<svg viewBox="0 0 24 24"><path d="M11.5 8.5c-2 .2-3.2 1.4-3.2 2.8 0 .9.5 1.7 1.3 2.2-1.4.6-2.3 1.8-2.3 3.3 0 2 1.9 3.4 4.7 3.4s4.7-1.4 4.7-3.4c0-1.5-.9-2.7-2.3-3.3.8-.5 1.3-1.3 1.3-2.2 0-1.4-1.2-2.6-3.2-2.8h-1z"/><path d="M10.2 14c.3.7.3 1.6 0 2.3"/><path d="M13.8 14c-.3.7-.3 1.6 0 2.3"/><path d="M12 8.5V2.8"/><circle cx="12" cy="1.8" r="0.9"/><line x1="12" y1="20.2" x2="12" y2="23"/><line x1="10.8" y1="23" x2="13.2" y2="23"/></svg>`
  },
  {
    id: "viola",
    name: "Viola",
    // 4C (C3=48), 3G (G3=55), 2D (D4=62), 1A (A4=69)
    strings: [
      { label: "4ª", midi: 48 },
      { label: "3ª", midi: 55 },
      { label: "2ª", midi: 62 },
      { label: "1ª", midi: 69 }
    ],
    // Silueta lineal de viola (caja más ancha con cordal trapezoidal y arco cruzado)
    svg: `<svg viewBox="0 0 24 24"><path d="M11.4 9.5c-2.1.2-3.4 1.5-3.4 3.1 0 1 .6 1.8 1.5 2.4-1.5.6-2.5 1.9-2.5 3.5 0 2.2 2.1 3.7 5 3.7s5-1.5 5-3.7c0-1.6-1-2.9-2.5-3.5.9-.6 1.5-1.4 1.5-2.4 0-1.6-1.3-2.9-3.4-3.1h-1.2z"/><path d="M9.8 15.2c.4.8.4 1.8 0 2.6"/><path d="M14.2 15.2c-.4.8-.4 1.8 0 2.6"/><path d="M12 9.5V2.8"/><rect x="11" y="1.4" width="2" height="1.5" rx="0.5"/><path d="M11.2 20.5l.8-2.3.8 2.3"/></svg>`
  },
  {
    id: "bass",
    name: "Bajo",
    // 4E (E1=28), 3A (A1=33), 2D (D2=38), 1G (G2=43)
    strings: [
      { label: "4ª", midi: 28 },
      { label: "3ª", midi: 33 },
      { label: "2ª", midi: 38 },
      { label: "1ª", midi: 43 }
    ],
    // Silueta lineal de bajo (hombros asimétricos / caída de contrabajo-bajo y clavijero de 4 clavijas)
    svg: `<svg viewBox="0 0 24 24"><path d="M12 10.2c-2.2.4-3.6 2-3.6 3.7 0 1 .5 1.8 1.2 2.3-1.3.7-2.1 1.9-2.1 3.4 0 2 1.9 3.4 4.5 3.4s4.5-1.4 4.5-3.4c0-1.5-.8-2.7-2.1-3.4.7-.5 1.2-1.3 1.2-2.3 0-1.7-1.4-3.3-3.6-3.7z"/><path d="M12 10.2V3.2"/><rect x="10.7" y="1.4" width="2.6" height="2" rx="0.5"/><line x1="9.6" y1="2.1" x2="10.7" y2="2.1"/><line x1="13.3" y1="2.1" x2="14.4" y2="2.1"/><circle cx="12" cy="15.8" r="1.2"/></svg>`
  }
];

const CHROMATIC_NOTE_NAMES = [
  { letter: "C", acc: "" },
  { letter: "C", acc: "♯" },
  { letter: "D", acc: "" },
  { letter: "D", acc: "♯" },
  { letter: "E", acc: "" },
  { letter: "F", acc: "" },
  { letter: "F", acc: "♯" },
  { letter: "G", acc: "" },
  { letter: "G", acc: "♯" },
  { letter: "A", acc: "" },
  { letter: "A", acc: "♯" },
  { letter: "B", acc: "" }
];

let tunerInstIndex = 0;
let tunerMicStream = null;
let tunerAnalyser = null;
let tunerTimeBuffer = null;
let tunerRafId = null;
let tunerListening = false;
let tunerSmoothedFreq = 0;
let tunerHarmonicOsc = null;

function initClipTuner() {
  try {
    const raw = localStorage.getItem(TUNER_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.hz && saved.hz >= 410 && saved.hz <= 450) {
        tunerHz = saved.hz;
      }
      if (typeof saved.instIndex === "number" && saved.instIndex >= 0 && saved.instIndex < TUNER_INSTRUMENTS.length) {
        tunerInstIndex = saved.instIndex;
      }
    }
  } catch (_) {}
  updateTunerHzUI();
  renderTunerInstrumentIcon();
}

function saveClipTunerSettings() {
  try {
    localStorage.setItem(TUNER_STORAGE_KEY, JSON.stringify({
      hz: tunerHz,
      instIndex: tunerInstIndex
    }));
  } catch (_) {}
}

function updateTunerHzUI() {
  const hzLbl = document.getElementById("tunerHzLabel");
  const chipLbl = document.getElementById("tunerChipLabel");
  const centsSub = document.getElementById("tunerCentsSub");
  if (hzLbl) hzLbl.textContent = `${tunerHz} Hz`;
  if (chipLbl) chipLbl.textContent = `${tunerHz}`;
  if (centsSub && !tunerListening && !tunerOsc) {
    centsSub.textContent = `${tunerHz}.0 Hz`;
  }
  if (tunerOsc) {
    const ctx = getPerformerAudioCtx();
    if (ctx) {
      tunerOsc.frequency.setValueAtTime(tunerHz, ctx.currentTime);
      if (tunerHarmonicOsc) {
        tunerHarmonicOsc.frequency.setValueAtTime(tunerHz * 2, ctx.currentTime);
      }
    }
    showTunerForkVisualFeedback();
  }
}

function setTunerFreq(hz) {
  tunerHz = Math.max(410, Math.min(450, Math.round(Number(hz) || 440)));
  updateTunerHzUI();
  saveClipTunerSettings();
}

function stepTunerFreq(delta) {
  setTunerFreq(tunerHz + delta);
}

function cycleTunerPresetFreq() {
  const next = tunerHz === 440 ? 442 : tunerHz === 442 ? 415 : 440;
  setTunerFreq(next);
}

function renderTunerInstrumentIcon() {
  const inst = TUNER_INSTRUMENTS[tunerInstIndex] || TUNER_INSTRUMENTS[0];
  const wrap = document.getElementById("tunerInstrumentIcon");
  const btn = document.getElementById("btnTunerInstrument");
  if (wrap) wrap.innerHTML = inst.svg;
  if (btn) btn.title = `Instrumento: ${inst.name}`;
}

function cycleTunerInstrument() {
  tunerInstIndex = (tunerInstIndex + 1) % TUNER_INSTRUMENTS.length;
  renderTunerInstrumentIcon();
  saveClipTunerSettings();
}

function toggleTunerPopover(e) {
  if (e) e.stopPropagation();
  document.getElementById("metronomePopover")?.classList.add("hidden");
  const pop = document.getElementById("tunerPopover");
  if (!pop) return;

  const willOpen = pop.classList.contains("hidden");
  if (willOpen) {
    pop.classList.remove("hidden");
    document.getElementById("tunerLiveChip")?.classList.add("active");
    startClipTunerListening();
  } else {
    closeTunerPopoverAndStop();
  }
}

function closeTunerPopoverAndStop() {
  const pop = document.getElementById("tunerPopover");
  if (pop) pop.classList.add("hidden");
  stopClipTunerListening();
  stopTunerForkTone();
  document.getElementById("tunerLiveChip")?.classList.remove("active");
  const chipLbl = document.getElementById("tunerChipLabel");
  if (chipLbl) chipLbl.textContent = `${tunerHz}`;
}

function toggleTunerForkTone() {
  if (tunerOsc) {
    stopTunerForkTone();
    return;
  }
  const ctx = getPerformerAudioCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const harmOsc = ctx.createOscillator();
  const gain = ctx.createGain();
  const harmGain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(tunerHz, ctx.currentTime);
  gain.gain.setValueAtTime(0.16, ctx.currentTime);

  // Suave segundo armónico para que se escuche cálido y claro en tablets
  harmOsc.type = "triangle";
  harmOsc.frequency.setValueAtTime(tunerHz * 2, ctx.currentTime);
  harmGain.gain.setValueAtTime(0.025, ctx.currentTime);

  osc.connect(gain);
  harmOsc.connect(harmGain);
  gain.connect(ctx.destination);
  harmGain.connect(ctx.destination);

  osc.start();
  harmOsc.start();
  tunerOsc = osc;
  tunerHarmonicOsc = harmOsc;

  document.getElementById("btnTunerFork")?.classList.add("active");
  showTunerForkVisualFeedback();
}

function stopTunerForkTone() {
  if (tunerOsc) {
    try { tunerOsc.stop(); } catch (_) {}
    try { tunerOsc.disconnect(); } catch (_) {}
    tunerOsc = null;
  }
  if (tunerHarmonicOsc) {
    try { tunerHarmonicOsc.stop(); } catch (_) {}
    try { tunerHarmonicOsc.disconnect(); } catch (_) {}
    tunerHarmonicOsc = null;
  }
  document.getElementById("btnTunerFork")?.classList.remove("active");
}

function showTunerForkVisualFeedback() {
  renderClipTunerDisplay({
    noteLetter: "A",
    noteAcc: "",
    cents: 0,
    freq: tunerHz,
    stringLabel: findClosestInstrumentStringLabel(69)
  });
}

function findClosestInstrumentStringLabel(detectedMidi) {
  const inst = TUNER_INSTRUMENTS[tunerInstIndex] || TUNER_INSTRUMENTS[0];
  let best = null;
  let minDiff = Infinity;
  for (const s of inst.strings) {
    const diff = Math.abs(detectedMidi - s.midi);
    if (diff < minDiff) {
      minDiff = diff;
      best = s;
    }
  }
  // Mostrar número de cuerda si está dentro de +-3 semitonos de esa cuerda
  return best && minDiff <= 3 ? best.label : "";
}

function renderClipTunerDisplay({ noteLetter, noteAcc, cents, freq, stringLabel, idle = false }) {
  const screen = document.getElementById("tunerClipScreen");
  const mainNote = document.getElementById("tunerMainNote");
  const accEl = document.getElementById("tunerNoteAcc");
  const badgeEl = document.getElementById("tunerStringBadge");
  const subEl = document.getElementById("tunerCentsSub");
  const leds = document.querySelectorAll("#tunerLedBars .t-led");

  if (idle) {
    screen?.classList.remove("is-in-tune");
    if (mainNote) mainNote.textContent = "—";
    if (accEl) accEl.textContent = "";
    if (badgeEl) badgeEl.textContent = "";
    if (subEl) subEl.textContent = `${tunerHz}.0 Hz`;
    leds.forEach((l) => l.classList.remove("lit-ok", "lit-warn", "lit-far"));
    return;
  }

  const inTune = Math.abs(cents) <= 3;
  screen?.classList.toggle("is-in-tune", inTune);
  if (mainNote) mainNote.textContent = noteLetter;
  if (accEl) accEl.textContent = noteAcc || "";
  if (badgeEl) badgeEl.textContent = stringLabel || "";

  const sign = cents > 0 ? `+${cents}` : `${cents}`;
  if (subEl) subEl.textContent = `${freq.toFixed(1)} Hz · ${sign}c`;

  // Mapear cents (-50 a +50) a los 11 segmentos LED (-5 a +5)
  const clamped = Math.max(-50, Math.min(50, cents));
  const ledPos = Math.round(clamped / 10);

  leds.forEach((led) => {
    led.classList.remove("lit-ok", "lit-warn", "lit-far");
    const pos = parseInt(led.dataset.pos || "0", 10);
    if (inTune && pos === 0) {
      led.classList.add("lit-ok");
    } else if (!inTune) {
      if (pos === 0) return;
      if ((ledPos < 0 && pos >= ledPos && pos < 0) || (ledPos > 0 && pos <= ledPos && pos > 0)) {
        const cls = Math.abs(pos) >= 4 ? "lit-far" : "lit-warn";
        led.classList.add(cls);
      }
    }
  });
}

// Algoritmo de Autocorrelación en el dominio del tiempo para detección precisa de frecuencia fundamental
function detectPitchAutocorrelation(buf, sampleRate) {
  const size = buf.length;
  let rms = 0;
  for (let i = 0; i < size; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / size);
  if (rms < 0.012) return -1; // Silencio / ruido de fondo bajo

  // Recortar bordes hasta cruce por umbral para estabilizar la ventana
  let r1 = 0;
  let r2 = size - 1;
  const thres = 0.2;
  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buf[size - i]) < thres) {
      r2 = size - i;
      break;
    }
  }

  const trimmed = buf.slice(r1, r2);
  const newSize = trimmed.length;
  if (newSize < 64) return -1;

  const c = new Float32Array(newSize);
  for (let i = 0; i < newSize; i++) {
    let sum = 0;
    for (let j = 0; j < newSize - i; j++) {
      sum += trimmed[j] * trimmed[j + i];
    }
    c[i] = sum;
  }

  let d = 0;
  while (d + 1 < newSize && c[d] > c[d + 1]) {
    d++;
  }
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < newSize; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  if (maxpos <= 0) return -1;

  // Interpolación parabólica para precisión sub-muestra
  let T0 = maxpos;
  if (T0 > 0 && T0 < newSize - 1) {
    const x1 = c[T0 - 1];
    const x2 = c[T0];
    const x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
  }

  const freq = sampleRate / T0;
  if (freq < 27 || freq > 2200) return -1;
  return freq;
}

async function startClipTunerListening() {
  renderClipTunerDisplay({ idle: true });
  if (tunerListening) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return;
  }

  try {
    const ctx = getPerformerAudioCtx();
    if (!ctx) return;

    tunerMicStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        autoGainControl: false,
        noiseSuppression: false
      }
    });

    // Verificar si el usuario cerró el popover mientras se pedía permiso
    const pop = document.getElementById("tunerPopover");
    if (!pop || pop.classList.contains("hidden")) {
      stopClipTunerListening();
      return;
    }

    const source = ctx.createMediaStreamSource(tunerMicStream);
    tunerAnalyser = ctx.createAnalyser();
    tunerAnalyser.fftSize = 2048;
    tunerTimeBuffer = new Float32Array(tunerAnalyser.fftSize);
    source.connect(tunerAnalyser);

    tunerListening = true;
    tunerSmoothedFreq = 0;

    const updatePitchLoop = () => {
      if (!tunerListening || !tunerAnalyser) return;

      // Si el diapasón está sonando, mostrar la referencia La configurada
      if (tunerOsc) {
        showTunerForkVisualFeedback();
        tunerRafId = requestAnimationFrame(updatePitchLoop);
        return;
      }

      tunerAnalyser.getFloatTimeDomainData(tunerTimeBuffer);
      const detected = detectPitchAutocorrelation(tunerTimeBuffer, ctx.sampleRate);

      if (detected > 0) {
        tunerSmoothedFreq = tunerSmoothedFreq === 0
          ? detected
          : tunerSmoothedFreq * 0.72 + detected * 0.28;

        // La detección de notas se rige dinámicamente por la frecuencia Hz seleccionada (tunerHz)
        const exactMidi = 69 + 12 * Math.log2(tunerSmoothedFreq / tunerHz);
        const nearestMidi = Math.round(exactMidi);
        const cents = Math.round((exactMidi - nearestMidi) * 100);
        const noteIndex = ((nearestMidi % 12) + 12) % 12;
        const noteObj = CHROMATIC_NOTE_NAMES[noteIndex];
        const stringLabel = findClosestInstrumentStringLabel(nearestMidi);

        renderClipTunerDisplay({
          noteLetter: noteObj.letter,
          noteAcc: noteObj.acc,
          cents,
          freq: tunerSmoothedFreq,
          stringLabel
        });
      }

      tunerRafId = requestAnimationFrame(updatePitchLoop);
    };

    tunerRafId = requestAnimationFrame(updatePitchLoop);
  } catch (_) {
    // Si el navegador no tiene micrófono disponible, el diapasón y los controles siguen operativos
  }
}

function stopClipTunerListening() {
  tunerListening = false;
  if (tunerRafId) {
    cancelAnimationFrame(tunerRafId);
    tunerRafId = null;
  }
  if (tunerMicStream) {
    tunerMicStream.getTracks().forEach((t) => t.stop());
    tunerMicStream = null;
  }
  tunerAnalyser = null;
  tunerSmoothedFreq = 0;
}

function toggleImportMenu(e) {
  if (e) e.stopPropagation();
  document.getElementById("importPdfMenu")?.classList.toggle("hidden");
}

function triggerSinglePdfImport() {
  document.getElementById("importPdfMenu")?.classList.add("hidden");
  document.getElementById("realPdfFileInput")?.click();
}

function triggerFolderPdfImport() {
  document.getElementById("importPdfMenu")?.classList.add("hidden");
  document.getElementById("realPdfFolderInput")?.click();
}

async function handleRealPdfFolderUpload(fileList) {
  if (!fileList || fileList.length === 0) return;
  const pdfFiles = Array.from(fileList).filter(
    (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
  );
  if (pdfFiles.length === 0) {
    showPilotBanner("No se encontraron archivos PDF dentro de la carpeta seleccionada.");
    return;
  }
  await handleRealPdfUpload(pdfFiles);
}

// ==========================================================================
// 6. MENÚ FLOTANTE DISCRETO PARA AGREGAR Y ORDENAR EN PROGRAMA (DRAG & DROP)
// ==========================================================================
let pqTargetScoreIds = [];
let pqSelectedProgId = null;
let pqDraftIds = [];
let pqDragIndex = null;

// Selección múltiple mediante long-press
let multiSelectMode = false;
let selectedScoreIds = new Set();
let longPressTimer = null;
let justTriggeredLongPress = false;

function onScoreCardPointerDown(e, scoreId) {
  if (e.target.closest("button")) return;
  if (multiSelectMode) return;
  cancelScoreLongPress();
  longPressTimer = setTimeout(() => {
    justTriggeredLongPress = true;
    enterMultiSelectMode(scoreId);
  }, 460);
}

function cancelScoreLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function handleScoreCardClick(scoreId) {
  if (justTriggeredLongPress) {
    justTriggeredLongPress = false;
    return;
  }
  if (multiSelectMode) {
    const id = Number(scoreId);
    if (selectedScoreIds.has(id)) selectedScoreIds.delete(id);
    else selectedScoreIds.add(id);
    updateMultiSelectBar();
    renderLibrary();
    return;
  }
  openScoreById(scoreId, "study");
}

function enterMultiSelectMode(initialScoreId) {
  multiSelectMode = true;
  selectedScoreIds = new Set([Number(initialScoreId)]);
  updateMultiSelectBar();
  renderLibrary();
}

function exitMultiSelectMode() {
  multiSelectMode = false;
  selectedScoreIds.clear();
  document.getElementById("multiSelectBar")?.classList.add("hidden");
  document.getElementById("progQuickPopover")?.classList.add("hidden");
  renderLibrary();
}

function updateMultiSelectBar() {
  const bar = document.getElementById("multiSelectBar");
  const countEl = document.getElementById("multiSelectCount");
  if (!bar || !countEl) return;
  const n = selectedScoreIds.size;
  if (n === 0) {
    exitMultiSelectMode();
    return;
  }
  countEl.textContent = `${n} ${n === 1 ? "seleccionada" : "seleccionadas"}`;
  bar.classList.remove("hidden");
}

async function deleteSelectedScores() {
  const count = selectedScoreIds.size;
  if (count === 0) return;
  if (!window.confirm(`¿Eliminar ${count} ${count === 1 ? "obra seleccionada" : "obras seleccionadas"} de tu biblioteca?`)) return;

  const idsToDelete = [...selectedScoreIds];
  for (const id of idsToDelete) {
    const idx = scores.findIndex((s) => s.id === id);
    if (idx !== -1) {
      const target = scores[idx];
      scores.splice(idx, 1);
      if (target.isRealPdf) await deleteRealPdfFromDb(id);
    }
    favoriteScoreIds.delete(id);
    programsState.list.forEach((p) => {
      p.scoreIds = p.scoreIds.filter((sid) => sid !== id);
    });
  }
  saveFavoritesState();
  saveProgramsState();
  renderSetlistDrawer();
  exitMultiSelectMode();
}

function openProgramQuickMenuForSelection(e) {
  if (e) e.stopPropagation();
  const pop = document.getElementById("progQuickPopover");
  const bar = document.getElementById("multiSelectBar");
  if (!pop || selectedScoreIds.size === 0) return;

  pqTargetScoreIds = [...selectedScoreIds];
  pqSelectedProgId = null;
  renderProgQuickListView();
  pop.classList.remove("hidden");

  if (bar) {
    const rect = bar.getBoundingClientRect();
    const popW = Math.min(310, window.innerWidth - 24);
    const left = Math.max(12, Math.min(window.innerWidth - popW - 12, window.innerWidth / 2 - popW / 2));
    pop.style.left = `${left}px`;
    pop.style.top = "auto";
    pop.style.bottom = `${window.innerHeight - rect.top + 10}px`;
  }
}

function openProgramQuickMenu(e, scoreId) {
  if (e) e.stopPropagation();
  const pop = document.getElementById("progQuickPopover");
  if (!pop) return;

  pqTargetScoreIds = [Number(scoreId)];
  pqSelectedProgId = null;
  renderProgQuickListView();
  pop.classList.remove("hidden");
  pop.style.bottom = "auto";

  if (e && e.currentTarget) {
    const rect = e.currentTarget.getBoundingClientRect();
    const popW = Math.min(310, window.innerWidth - 24);
    const left = Math.max(12, Math.min(window.innerWidth - popW - 12, rect.left - popW / 2 + rect.width / 2));
    const top = Math.max(12, Math.min(window.innerHeight - 360, rect.bottom + 8));
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }
}

function renderProgQuickListView(targetEl, fromWorkMenu = false) {
  const pop = targetEl || document.getElementById("progQuickPopover");
  if (!pop) return;
  const listHtml = programsState.list
    .map(
      (p) => `
      <button class="pq-prog-btn" onclick="selectProgramInQuickMenu('${p.id}', ${fromWorkMenu})">
        <svg viewBox="0 0 24 24" class="v-ico"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>
        <span>${p.name}</span>
      </button>
    `
    )
    .join("");

  const backBtnHtml = fromWorkMenu
    ? `<button class="pq-back-btn" onclick="returnToWorkActionsMenu(event)" title="Regresar" aria-label="Regresar"><svg viewBox="0 0 24 24" class="v-ico"><polyline points="15 18 9 12 15 6"/></svg></button>`
    : "";

  pop.innerHTML = `
    <div class="pq-head">
      ${backBtnHtml}
      <span class="pq-title ${fromWorkMenu ? "pq-title-shifted" : ""}">Programa</span>
    </div>
    <div class="pq-list">${listHtml}</div>
  `;
}

function selectProgramInQuickMenu(progId, fromWorkMenu = false) {
  const prog = programsState.list.find((p) => p.id === progId);
  if (!prog) return;
  pqSelectedProgId = progId;
  pqDraftIds = [...prog.scoreIds];
  pqTargetScoreIds.forEach((sid) => {
    if (sid && !pqDraftIds.includes(sid)) {
      pqDraftIds.push(sid);
    }
  });
  const target = fromWorkMenu ? document.getElementById("workActionsMenu") : document.getElementById("progQuickPopover");
  renderProgQuickOrderView(target, fromWorkMenu);
}

function renderProgQuickOrderView(targetEl, fromWorkMenu = false) {
  const pop = targetEl || document.getElementById("progQuickPopover");
  const prog = programsState.list.find((p) => p.id === pqSelectedProgId);
  if (!pop || !prog) return;

  const validItems = pqDraftIds
    .map((id) => scores.find((s) => s.id === id))
    .filter(Boolean);

  const itemsHtml = validItems
    .map(
      (s, idx) => `
      <div class="pq-work-item ${pqTargetScoreIds.includes(s.id) ? "is-target-work" : ""}"
           data-pq-idx="${idx}"
           onpointerdown="onPqPointerDown(event, ${idx}, ${fromWorkMenu})">
        <svg viewBox="0 0 24 24" class="pq-drag-ico" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
        <span class="pq-work-num">${idx + 1}</span>
        <span class="pq-work-title">${s.clean || s.title}</span>
        <button class="pq-remove-btn" onclick="event.stopPropagation(); removeFromPqDraft(${idx}, ${fromWorkMenu})" onpointerdown="event.stopPropagation()" title="Eliminar del programa" aria-label="Eliminar">−</button>
      </div>
    `
    )
    .join("");

  pop.innerHTML = `
    <div class="pq-head">
      <button class="pq-back-btn" onclick="renderProgQuickListView(${fromWorkMenu ? "document.getElementById('workActionsMenu'), true" : ""})" title="Volver a programas" aria-label="Regresar">
        <svg viewBox="0 0 24 24" class="v-ico"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      </button>
      <span class="pq-title">${prog.name}</span>
    </div>
    <div class="pq-list" id="pqOrderList">${itemsHtml}</div>
    <button class="pq-save-btn" onclick="saveProgramQuickOrder(${fromWorkMenu})">Guardar cambios</button>
  `;
}

function removeFromPqDraft(idx, fromWorkMenu = false) {
  if (idx < 0 || idx >= pqDraftIds.length) return;
  pqDraftIds.splice(idx, 1);
  const target = fromWorkMenu ? document.getElementById("workActionsMenu") : document.getElementById("progQuickPopover");
  renderProgQuickOrderView(target, fromWorkMenu);
}

function reorderPqDraft(fromIdx, toIdx, fromWorkMenu = false) {
  if (fromIdx === null || fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
  if (fromIdx >= pqDraftIds.length || toIdx >= pqDraftIds.length) return;
  const [moved] = pqDraftIds.splice(fromIdx, 1);
  pqDraftIds.splice(toIdx, 0, moved);
  const target = fromWorkMenu ? document.getElementById("workActionsMenu") : document.getElementById("progQuickPopover");
  renderProgQuickOrderView(target, fromWorkMenu);
}

function onPqDragStart(e, idx) {
  pqDragIndex = idx;
  e.currentTarget.classList.add("dragging");
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
}

function onPqDragOver(e, idx) {
  e.preventDefault();
  if (pqDragIndex !== null && pqDragIndex !== idx) {
    e.currentTarget.classList.add("drag-over");
  }
}

function onPqDragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

function onPqDrop(e, idx) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");
  reorderPqDraft(pqDragIndex, idx);
  pqDragIndex = null;
}

function onPqDragEnd(e) {
  e.currentTarget.classList.remove("dragging");
  pqDragIndex = null;
}

// Soporte unificado (ratón, dedo y lápiz) para deslizar obras entre niveles con botón flotante 60% transparente
function onPqPointerDown(e, idx, fromWorkMenu = false) {
  startFloatingReorderDrag(e, {
    itemSelector: ".pq-work-item",
    idxAttr: "pqIdx",
    initialIdx: idx,
    onReorder: (from, to) => reorderPqDraft(from, to, fromWorkMenu)
  });
}

function saveProgramQuickOrder(fromWorkMenu = false) {
  const prog = programsState.list.find((p) => p.id === pqSelectedProgId);
  if (!prog) return;
  prog.scoreIds = [...pqDraftIds];
  programsState.activeId = prog.id;
  saveProgramsState();
  renderSetlistDrawer();
  if (fromWorkMenu) closeWorkActionsMenu();
  else document.getElementById("progQuickPopover")?.classList.add("hidden");
  if (multiSelectMode) exitMultiSelectMode();
}

// Gestor global unificado para cerrar menús y popovers al tocar fuera (Fase B - M2)
document.addEventListener("pointerdown", (e) => {
  const isMainControl = e.target.closest(
    ".floating-hud-top, .lib-unified-row, .lib-filter-bar, .bottom-nav-dock, #floatingImportFab, #bachGptFab, #btnSettingsDrawer, .work-more-btn, #perfContextToolbar"
  );

  const floatingMenus = [
    { id: "workActionsMenu", trigger: ".work-more-btn", close: () => closeWorkActionsMenu() },
    { id: "setlistItemContextMenu", trigger: ".sl-item-more-btn", close: () => closeSetlistItemContextMenu() },
    { id: "progQuickPopover", trigger: ".add-prog-btn", close: () => document.getElementById("progQuickPopover")?.classList.add("hidden") },
    { id: "sharedFilterMenu", trigger: ".filter-dd-btn", close: () => closeSharedFilterMenu() },
    { id: "progScoreSuggestions", trigger: "#progScoreSearchWrap", close: () => document.getElementById("progScoreSuggestions")?.classList.add("hidden") },
    { id: "importPdfMenu", trigger: "#importPopoverWrap", close: () => document.getElementById("importPdfMenu")?.classList.add("hidden") },
    { id: "settingsDrawer", trigger: "#btnSettingsDrawer", close: () => document.getElementById("settingsDrawer")?.classList.add("hidden") },
    { id: "brushPopover", trigger: "#btnBrushStyle", close: () => document.getElementById("brushPopover")?.classList.add("hidden") },
    { id: "stampPopover", trigger: "#btnStamps", close: () => { if (studyTool !== "stamp") document.getElementById("stampPopover")?.classList.add("hidden"); } },
    { id: "metronomePopover", trigger: "#metroLiveChip, #btnCtxRehearse", close: () => { document.getElementById("metronomePopover")?.classList.add("hidden"); if (activePerformerContext === "rehearse") { activePerformerContext = "read"; syncPerformerContextButtonsUI(); } } },
    { id: "tunerPopover", trigger: "#tunerLiveChip", close: () => closeTunerPopoverAndStop() },
    { id: "performerListenPopover", trigger: "#btnCtxListen", close: () => closePerformerListenPopover() },
    { id: "performerMorePopover", trigger: "#btnCtxMore", close: () => closePerformerMorePopover() }
  ];

  let closedAny = false;
  for (const m of floatingMenus) {
    const el = document.getElementById(m.id);
    if (el && !el.classList.contains("hidden") && !e.target.closest(`#${m.id}`)) {
      if (m.trigger && e.target.closest(m.trigger)) continue;
      m.close();
      closedAny = true;
    }
  }

  const mobProgList = document.getElementById("programsMasterList");
  if (mobProgList && mobProgList.classList.contains("mobile-dropdown-open") && !e.target.closest(".programs-sidebar-panel")) {
    closeMobileProgramsDropdown();
  }

  const bachWin = document.getElementById("bachGptWindow");
  if (
    bachWin &&
    !bachWin.classList.contains("hidden") &&
    !e.target.closest("#bachWidgetRoot") &&
    !e.target.closest("#bachGptFab") &&
    !e.target.closest(".bach-card-btn") &&
    !e.target.closest("#btnCtxAi")
  ) {
    toggleBachGptChat(false);
    if (activePerformerContext === "ai") {
      activePerformerContext = "read";
      syncPerformerContextButtonsUI();
    }
  }

  if (closedAny && !isMainControl) {
    e.preventDefault();
    e.stopPropagation();
    const suppressNextClick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    document.addEventListener("click", suppressNextClick, { capture: true, once: true });
    setTimeout(() => document.removeEventListener("click", suppressNextClick, true), 300);
  }
}, true);

window.addEventListener("DOMContentLoaded", async () => {
  await loadSavedPdfsFromDb();
  loadScoreMetadataOverrides();
  loadFavoritesState();
  loadProgramsState();
  await loadStudyAnnotationsFromStorage();
  initBachGptWidget();
  renderLibrary();
  renderSetlistDrawer();
  switchStampTab("dynamics");
  initStampPaletteDrag();
  initMetronomePopover();
  initClipTuner();
  initFolioZoomAndPan();
  syncSettingsGeminiKeyInput();
  initCadenzaPwaServiceWorker();
  const perfSvg = document.getElementById("performerSvg");
  if (perfSvg) perfSvg.innerHTML = buildPortraitScoreSvg(-1);
  initStudyInteraction();
  initEditorInteraction();
  setupStudyCanvas();
  setupEditorCanvas();
  renderStudyPageScrubber();
  updateBookmarkButton();
  autoAdaptLayoutForTabletOrientation();
  updateLayoutButtonIcon();

  ["performerToolRail", "brushPopover", "stampPopover"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("pointerdown", resetToolRailInactivityTimer);
      el.addEventListener("input", resetToolRailInactivityTimer);
    }
  });
});

// Soporte nativo para Pedales Bluetooth de Atril (PageFlip, AirTurn, iRig) y Atajos de Teclado (Fase A - O1)
window.addEventListener("keydown", (e) => {
  const activeTag = (document.activeElement?.tagName || "").toUpperCase();
  const isEditingInput =
    activeTag === "INPUT" ||
    activeTag === "TEXTAREA" ||
    activeTag === "SELECT" ||
    document.activeElement?.isContentEditable;
  if (isEditingInput) return;

  const performerView = document.getElementById("mode-performer");
  if (!performerView || !performerView.classList.contains("active")) return;

  // Deshacer / Rehacer con Ctrl+Z / Ctrl+Y en Modo Ensayo
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    if (e.shiftKey) redoStudyAction();
    else undoStudyAction();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
    e.preventDefault();
    redoStudyAction();
    return;
  }

  // Pedal Derecho / Avanzar página
  if (e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) {
    e.preventDefault();
    turnPage(1);
    return;
  }

  // Pedal Izquierdo / Retroceder página
  if (e.key === "ArrowLeft" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
    e.preventDefault();
    turnPage(-1);
    return;
  }

  // Alternar Metrónomo con tecla M en Modo Ensayo
  if (e.key.toLowerCase() === "m" && performanceMode === "study") {
    e.preventDefault();
    toggleMetronomePlay();
  }
});

window.addEventListener("resize", () => {
  saveStudyAnnotationsForCurrentPage();
  autoAdaptLayoutForTabletOrientation();
  setupStudyCanvas();
  restoreStudyAnnotationsForCurrentPage();
  setupEditorCanvas();
});

// ==========================================================================
// FASE D (P1 & P2): RESPALDO / RESTAURACIÓN COMPLETA (.cadenza-backup.json) Y PWA ITERATIVA
// ==========================================================================
async function exportCadenzaFullBackup() {
  const noteEl = document.getElementById("backupStatusNote");
  try {
    const backupPayload = {
      app: "Cadenza",
      version: "V115",
      exportedAt: new Date().toISOString(),
      annotations: {
        strokes: studyPageStrokes,
        molds: studyPageMoldItems
      },
      programsState,
      favorites: [...favoriteScoreIds],
      recents: recentScoreTimes,
      scoresMetadata: JSON.parse(localStorage.getItem(SCORES_META_STORAGE_KEY) || "{}"),
      metronomePresets: JSON.parse(localStorage.getItem(METRO_STORAGE_KEY) || "{}"),
      rehearsalPassages: rehearsalPassagesByScore,
      rehearsalSessions: JSON.parse(localStorage.getItem(REHEARSAL_SESSIONS_STORAGE_KEY) || "[]"),
      lastStudySession: loadLastStudySessionState()
    };

    const jsonStr = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateTag = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `respaldo-${dateTag}.cadenza-backup.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (noteEl) noteEl.textContent = "✓ Respaldo exportado correctamente.";
  } catch (err) {
    console.warn("Error al exportar respaldo:", err);
    if (noteEl) noteEl.textContent = "Error al generar el archivo de respaldo.";
  }
}

async function importCadenzaBackupFile(fileList) {
  if (!fileList || fileList.length === 0) return;
  const file = fileList[0];
  const noteEl = document.getElementById("backupStatusNote");

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || data.app !== "Cadenza") {
      if (noteEl) noteEl.textContent = "El archivo no es un respaldo válido de Cadenza.";
      return;
    }

    if (data.annotations) {
      if (data.annotations.strokes) {
        Object.keys(studyPageStrokes).forEach((k) => delete studyPageStrokes[k]);
        Object.assign(studyPageStrokes, data.annotations.strokes);
      }
      if (data.annotations.molds) {
        Object.keys(studyPageMoldItems).forEach((k) => delete studyPageMoldItems[k]);
        Object.assign(studyPageMoldItems, data.annotations.molds);
      }
      persistStudyAnnotationsToStorage();
    }

    if (data.programsState && Array.isArray(data.programsState.list)) {
      programsState = data.programsState;
      saveProgramsState();
    }

    if (Array.isArray(data.favorites)) {
      favoriteScoreIds = new Set(data.favorites.map(Number));
      saveFavoritesState();
    }

    if (data.recents && typeof data.recents === "object") {
      recentScoreTimes = data.recents;
      localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(recentScoreTimes));
    }

    if (data.scoresMetadata && typeof data.scoresMetadata === "object") {
      localStorage.setItem(SCORES_META_STORAGE_KEY, JSON.stringify(data.scoresMetadata));
      loadScoreMetadataOverrides();
    }

    if (data.metronomePresets && typeof data.metronomePresets === "object") {
      localStorage.setItem(METRO_STORAGE_KEY, JSON.stringify(data.metronomePresets));
    }

    if (data.rehearsalPassages && typeof data.rehearsalPassages === "object") {
      rehearsalPassagesByScore = data.rehearsalPassages;
      saveRehearsalPassagesState();
    }

    if (Array.isArray(data.rehearsalSessions)) {
      localStorage.setItem(REHEARSAL_SESSIONS_STORAGE_KEY, JSON.stringify(data.rehearsalSessions));
    }

    if (data.lastStudySession) {
      localStorage.setItem(LAST_SESSION_STORAGE_KEY, JSON.stringify(data.lastStudySession));
    }

    renderLibrary();
    renderSetlistDrawer();
    restoreStudyAnnotationsForCurrentPage();
    syncRehearsalContextBanner();
    if (noteEl) noteEl.textContent = `✓ Respaldo "${file.name}" restaurado con éxito.`;
  } catch (err) {
    console.warn("Error al importar respaldo:", err);
    if (noteEl) noteEl.textContent = "Error al leer el archivo de respaldo.";
  } finally {
    const inp = document.getElementById("cadenzaBackupFileInput");
    if (inp) inp.value = "";
  }
}

let deferredPwaInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPwaInstallPrompt = e;
  document.getElementById("btnInstallCadenzaPwa")?.classList.remove("hidden");
});

async function triggerCadenzaPwaInstall() {
  if (!deferredPwaInstallPrompt) return;
  deferredPwaInstallPrompt.prompt();
  try {
    await deferredPwaInstallPrompt.userChoice;
  } catch (_) {}
  deferredPwaInstallPrompt = null;
  document.getElementById("btnInstallCadenzaPwa")?.classList.add("hidden");
}

function initCadenzaPwaServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("./sw.js?v=115", { updateViaCache: "none" })
    .then((reg) => {
      reg.update().catch(() => {});
    })
    .catch((err) => {
      console.warn("Service Worker registro omitido:", err);
    });
}

async function forceRefreshCadenzaVersion() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) {
        await r.update();
      }
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      for (const k of keys) {
        await caches.delete(k);
      }
    }
  } catch (_) {}
  window.location.reload();
}

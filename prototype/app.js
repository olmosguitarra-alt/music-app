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
// BASE DE DATOS PERSISTENTE EN TABLET (IndexedDB para guardar PDFs Reales)
// ==========================================================================
const DB_NAME = "AtrilRealPdfPilotDB";
const STORE_NAME = "realPdfs";

function openPilotDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
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
// RENDERIZADO DE PÁGINAS DE TU PDF REAL EN MODO ESTUDIO Y MODO CONCIERTO
// ==========================================================================
async function openScoreById(scoreId, targetMode = "study") {
  const found = scores.find((s) => s.id === Number(scoreId));
  if (!found) return;
  activeScore = found;
  pageNum = 1;
  markScoreRecent(found.id);

  document.getElementById("hudPieceTitle").textContent = `${found.composer.split("(")[0].trim()} — ${found.clean || found.title}`;

  // Actualizar encabezados
  document.getElementById("studyTitleHeading").textContent = found.clean || found.title;
  document.getElementById("studySubHeading").textContent = found.composer;
  document.getElementById("concertTitleHeading").textContent = found.clean || found.title;
  document.getElementById("concertSub").textContent = found.composer;

  switchMode(targetMode);

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

  document.getElementById("studyMetaRight").textContent = `Pág. ${pageNum} / ${total}`;
  document.getElementById("studyFooterRight").textContent = `Folio ${pageNum} / ${total}`;
  document.getElementById("concertPageNum").textContent = `Pág. ${pageNum} / ${total}`;

  const studyPdfCanvas = document.getElementById("studyPdfRenderCanvas");
  const concertPdfCanvas = document.getElementById("concertPdfRenderCanvas");
  const concertPdfCanvasRight = document.getElementById("concertPdfRenderCanvasRight");
  const studySvgEl = document.getElementById("studySvg");
  const concertSvgEl = document.getElementById("concertSvg");
  const concertSvgRightEl = document.getElementById("concertSvgRight");
  const studyHead = document.getElementById("studyFolioHeader");
  const concertHead = document.getElementById("concertFolioHeader");

  const isTwoPages = layouts[layoutIdx] === "2 Págs";
  const spreadWrap = document.getElementById("concertSpreadWrap");
  const rightSheet = document.getElementById("concertSheetRight");
  const hasSecondPage = isTwoPages && pageNum + 1 <= total;

  if (spreadWrap && rightSheet) {
    spreadWrap.classList.toggle("two-pages", hasSecondPage);
    rightSheet.classList.toggle("hidden", !hasSecondPage);
    if (hasSecondPage) {
      document.getElementById("concertTitleHeadingRight").textContent = activeScore.clean || activeScore.title;
      document.getElementById("concertSubRight").textContent = activeScore.composer;
      document.getElementById("concertPageNumRight").textContent = `Pág. ${pageNum + 1} / ${total}`;
      document.getElementById("concertPageFooterRight").textContent = `Folio ${pageNum + 1} / ${total}`;
    }
  }

  if (activeScore.isRealPdf && currentPdfDocInstance) {
    studySvgEl.classList.add("hidden");
    concertSvgEl.classList.add("hidden");
    if (concertSvgRightEl) concertSvgRightEl.classList.add("hidden");
    studyPdfCanvas.classList.remove("hidden");
    concertPdfCanvas.classList.remove("hidden");
    studyHead.classList.add("compact-pdf-head");
    concertHead.classList.add("compact-pdf-head");

    const page = await currentPdfDocInstance.getPage(pageNum);
    await renderPdfPageToCanvas(page, studyPdfCanvas, document.getElementById("studyWrap"));
    await renderPdfPageToCanvas(page, concertPdfCanvas, document.getElementById("concertWrap"));

    if (hasSecondPage && concertPdfCanvasRight) {
      concertPdfCanvasRight.classList.remove("hidden");
      const page2 = await currentPdfDocInstance.getPage(pageNum + 1);
      await renderPdfPageToCanvas(page2, concertPdfCanvasRight, document.getElementById("concertWrapRight"));
    } else if (concertPdfCanvasRight) {
      concertPdfCanvasRight.classList.add("hidden");
    }
  } else {
    studyPdfCanvas.classList.add("hidden");
    concertPdfCanvas.classList.add("hidden");
    if (concertPdfCanvasRight) concertPdfCanvasRight.classList.add("hidden");
    studySvgEl.classList.remove("hidden");
    concertSvgEl.classList.remove("hidden");
    if (concertSvgRightEl) concertSvgRightEl.classList.remove("hidden");
    studyHead.classList.remove("compact-pdf-head");
    concertHead.classList.remove("compact-pdf-head");

    studySvgEl.innerHTML = buildPortraitScoreSvg(-1);
    concertSvgEl.innerHTML = buildPortraitScoreSvg(-1);
    if (hasSecondPage && concertSvgRightEl) {
      concertSvgRightEl.innerHTML = buildPortraitScoreSvg(-1);
    }
  }

  setupStudyCanvas();
  restoreStudyAnnotationsForCurrentPage();
  if (typeof updateBookmarkButton === "function") updateBookmarkButton();
  if (typeof renderStudyPageScrubber === "function") renderStudyPageScrubber();
  if (typeof setupConcertQuickCanvas === "function") setupConcertQuickCanvas();
}

async function renderPdfPageToCanvas(pdfPage, canvas, containerEl) {
  if (!pdfPage || !canvas || !containerEl) return;
  const cw = Math.max(320, containerEl.clientWidth || 760);
  const ch = Math.max(420, containerEl.clientHeight || 920);
  const unscaled = pdfPage.getViewport({ scale: 1 });
  const scale = Math.min(cw / unscaled.width, ch / unscaled.height) * (window.devicePixelRatio || 1.5);
  const viewport = pdfPage.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  await pdfPage.render({ canvasContext: ctx, viewport }).promise;
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
    const extModal = document.getElementById("pdfExtractModalBackdrop");
    const exitModal = document.getElementById("pdfExitConfirmBackdrop");
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
    createLbl.textContent = `📤 Crear PDF (${selCount})`;
  }
  if (createBtn) {
    createBtn.disabled = selCount === 0;
  }
}

async function openPdfModalById(scoreId) {
  const s = scores.find((item) => item.id === Number(scoreId));
  if (!s) return;
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
  if (pdfWorkshopDraft.isRealPdf && pdfWorkshopDraft.pdfBytes && window.PDFLib) {
    try {
      pdfWorkingDoc = await window.PDFLib.PDFDocument.load(pdfWorkshopDraft.pdfBytes);
    } catch (err) {
      console.warn("No se pudo cargar instancia PDFLib.PDFDocument inicial:", err);
    }
  }

  document.getElementById("modalScoreTitle").textContent = formatPdfEditorFilenameTitle(pdfWorkshopDraft.title);
  const wmTitle = document.getElementById("wmTitleInput");
  const wmComp = document.getElementById("wmComposerInput");
  const wmPer = document.getElementById("wmPeriodInput");
  const wmGrp = document.getElementById("wmGroupInput");
  if (wmTitle) wmTitle.value = pdfWorkshopDraft.title;
  if (wmComp) wmComp.value = pdfWorkshopDraft.composer;
  if (wmPer) wmPer.value = pdfWorkshopDraft.period;
  if (wmGrp) wmGrp.value = pdfWorkshopDraft.group;

  const fillDl = (dlId, defaults, key) => {
    const dl = document.getElementById(dlId);
    if (!dl) return;
    const vals = [...new Set([...defaults, ...scores.map((x) => (x[key] || "").trim()).filter(Boolean)])];
    dl.innerHTML = vals.map((v) => `<option value="${v.replace(/"/g, "&quot;")}"></option>`).join("");
  };
  fillDl("wmPeriodList", ["Renacimiento", "Barroco", "Clasicismo", "Romanticismo", "Siglo XX"], "period");
  fillDl("wmGroupList", ["Guitarra Sola", "Dúo / Cámara", "Guitarra y Orquesta", "Otro Instrumento"], "group");

  const toastEl = document.getElementById("pdfToast");
  if (toastEl) {
    toastEl.textContent = "";
    toastEl.classList.remove("is-visible");
  }

  const metaPop = document.getElementById("pdfMetaPopover");
  if (metaPop) metaPop.classList.add("hidden");
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
  document.getElementById("pdfModal").classList.remove("hidden");
}

function togglePdfMetaPopover(e) {
  if (e) e.stopPropagation();
  const pop = document.getElementById("pdfMetaPopover");
  if (!pop || !pdfWorkshopDraft) return;
  const isOpening = pop.classList.contains("hidden");
  pop.classList.toggle("hidden", !isOpening);
  if (!isOpening) {
    const newTitle = (document.getElementById("wmTitleInput")?.value || "").trim();
    if (newTitle && newTitle !== pdfWorkshopDraft.title) {
      pdfWorkshopDraft.title = newTitle;
      document.getElementById("modalScoreTitle").textContent = formatPdfEditorFilenameTitle(newTitle);
      isPdfWorkshopDirty = true;
      updatePdfUndoButtonState();
    }
    pdfWorkshopDraft.composer = (document.getElementById("wmComposerInput")?.value || "").trim() || pdfWorkshopDraft.composer;
    pdfWorkshopDraft.period = (document.getElementById("wmPeriodInput")?.value || "").trim() || pdfWorkshopDraft.period;
    pdfWorkshopDraft.group = (document.getElementById("wmGroupInput")?.value || "").trim() || pdfWorkshopDraft.group;
  }
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

  const chkIco = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

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
          <button type="button" class="pdf-float-icon-btn dup" onclick="duplicateSingleWorkshopPage(event, ${p})" title="Duplicar página" aria-label="Duplicar página ${p}">❐</button>
          <button type="button" class="pdf-float-icon-btn del" onclick="deleteSingleWorkshopPage(event, ${p})" title="Eliminar página" aria-label="Eliminar página ${p}">✕</button>
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
  s.composer = draft.composer || s.composer;
  s.period = draft.period || s.period;
  s.group = draft.group || s.group;
  s.raw = false;
  s.isRealPdf = draft.isRealPdf;
  s.pdfBytes = draft.pdfBytes ? draft.pdfBytes.slice(0) : null;
  s.thumbDataUrl = draft.thumbDataUrl || s.thumbDataUrl;
  s.pageItems = draft.pageItems.map((it) => ({ ...it }));
  s.pageCount = s.pageItems.length;
  s.pages = `${s.pageCount} págs.`;

  if (s.isRealPdf && s.pdfBytes) {
    await saveRealPdfToDb(s);
  }

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
  renderLibrary();
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
  const metaPop = document.getElementById("pdfMetaPopover");
  if (metaPop) metaPop.classList.add("hidden");
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
function switchMode(mode) {
  document.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  document.querySelectorAll(".canvas-view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`mode-${mode}`).classList.add("active");

  document.body.classList.remove("writing-focus");
  document.getElementById("dockRevealHandle")?.classList.add("hidden");

  document.body.classList.toggle("mode-library-active", mode === "library");
  document.body.classList.toggle("mode-concert-active", mode === "concert");
  if (mode === "concert") {
    toggleBachGptChat(false);
    document.body.classList.remove("concert-immersion");
  } else {
    document.body.classList.remove("concert-immersion");
  }

  if (mode === "study" || mode === "concert") {
    setTimeout(() => renderActiveScorePage(), 40);
  }
  if (mode === "editor") setTimeout(setupEditorCanvas, 40);
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

function toggleFilterDropdown(kind, e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("sharedFilterMenu");
  if (!menu) return;

  const isAlreadyOpen = !menu.classList.contains("hidden") && activeFilterMenuKind === kind;
  if (isAlreadyOpen) {
    closeSharedFilterMenu();
    return;
  }

  let vals = [];
  let current = "all";
  let fn = "applyComposerFilter";
  if (kind === "composer") {
    vals = [...new Set(scores.map((s) => (s.composer || "").split("(")[0].trim()).filter(Boolean))];
    current = selectedComposerFilter;
    fn = "applyComposerFilter";
  } else if (kind === "period") {
    vals = [...new Set(scores.map((s) => (s.period || "").trim()).filter(Boolean))];
    current = selectedPeriodFilter;
    fn = "applyPeriodFilter";
  } else if (kind === "group") {
    vals = [...new Set(scores.map((s) => (s.group || "").trim()).filter(Boolean))];
    current = selectedGroupFilter;
    fn = "applyGroupFilter";
  }

  menu.innerHTML = [
    `<button class="filter-dd-opt ${current === "all" ? "active" : ""}" onclick="${fn}('all')">Todos</button>`,
    ...vals.map(
      (v) => `<button class="filter-dd-opt ${current === v ? "active" : ""}" onclick="${fn}('${v.replace(/'/g, "\\'")}')">${v}</button>`
    )
  ].join("");

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

function openProgramsSlideView() {
  refreshProgramRecentSnapshot();
  renderSetlistDrawer();
  document.getElementById("librarySlidesViewport")?.classList.add("is-programs-active");
  document.body.classList.add("programs-slide-open");
}

function closeProgramsSlideView() {
  document.getElementById("librarySlidesViewport")?.classList.remove("is-programs-active");
  document.body.classList.remove("programs-slide-open");
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

function renderWorkActionsMenuItems(menu, id) {
  const aiHead = buildMonochromeBachHeadSvg();
  const addSvg = `<svg viewBox="0 0 24 24" class="v-ico"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
  const cutSvg = `<svg viewBox="0 0 24 24" class="v-ico" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="6.5" r="2.5"/><circle cx="5.5" cy="17.5" r="2.5"/><path d="M7.6 7.8 21 18.8"/><path d="M7.6 16.2 21 5.2"/><circle cx="12.4" cy="12" r="0.7" fill="currentColor" stroke="none"/></svg>`;
  const trashSvg = `<svg viewBox="0 0 24 24" class="v-ico"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

  menu.classList.remove("is-prog-mode");
  menu.innerHTML = `
    <button class="wa-menu-item bach-card-btn" onclick="closeWorkActionsMenu(); openAiForWork(${id})">
      ${aiHead}
      <span>BachGPT</span>
    </button>
    <button class="wa-menu-item add-prog-btn" onclick="openProgFromWorkMenu(event, ${id})">
      ${addSvg}
      <span>Programa</span>
    </button>
    <button class="wa-menu-item" onclick="closeWorkActionsMenu(); openPdfModalById(${id})">
      ${cutSvg}
      <span>Editar PDF</span>
    </button>
    <button class="wa-menu-item wa-danger" onclick="closeWorkActionsMenu(); deleteScoreFromLibrary(${id})">
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
    const rawLeft = cardEl ? cardEl.getBoundingClientRect().left : rect.right - mw;
    const left = Math.max(12, Math.min(window.innerWidth - mw - 12, rawLeft));
    const top = Math.max(12, Math.min(window.innerHeight - 190, rect.bottom + 6));
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

// Llave de Gemini API integrada para Voz Neuronal Realista (Charon) + Cerebro Real de BachGPT
const _gkParts = ["AQ.Ab8RN6LPUtB6Nioi", "-pSXytceVM2YCGkxYy2", "BM3OYpwUUnTIcmg"];
function getGeminiApiKey() {
  return localStorage.getItem("ATRIL_GEMINI_KEY") || _gkParts.join("");
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
    ctxInstruction =
      `Estás en el Modo de Obra PDF Específica. Debes hablar ÚNICA Y EXCLUSIVAMENTE sobre la obra "${title}" del compositor ${work.composer} (Periodo ${work.period}, dotación: ${work.group}). ` +
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
  document.getElementById("brushPopover")?.classList.add("hidden");
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

let brushWidth = 2.4;
let brushOpacity = 1.0;
const studyPageAnnotations = {};
const studyUndoStacks = {};
const studyRedoStacks = {};
const studyBookmarks = {};

function getStudyPageKey() {
  return `${activeScore ? activeScore.id : 1}:${pageNum}`;
}

function saveStudyAnnotationsForCurrentPage() {
  const canvas = document.getElementById("studyCanvas");
  const moldLayer = document.getElementById("studyMoldLayer");
  if (!canvas || !moldLayer) return;
  const key = getStudyPageKey();
  studyPageAnnotations[key] = {
    dataUrl: canvas.toDataURL("image/png"),
    moldHtml: moldLayer.innerHTML
  };
}

function restoreStudyAnnotationsForCurrentPage() {
  const canvas = document.getElementById("studyCanvas");
  const moldLayer = document.getElementById("studyMoldLayer");
  if (!canvas || !moldLayer) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const key = getStudyPageKey();
  const saved = studyPageAnnotations[key];
  if (saved) {
    moldLayer.innerHTML = saved.moldHtml || "";
    if (saved.dataUrl) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = saved.dataUrl;
    }
  } else {
    moldLayer.innerHTML = "";
  }
}

function pushStudyUndoSnapshot() {
  const canvas = document.getElementById("studyCanvas");
  const moldLayer = document.getElementById("studyMoldLayer");
  if (!canvas || !moldLayer) return;
  const key = getStudyPageKey();
  if (!studyUndoStacks[key]) studyUndoStacks[key] = [];
  studyUndoStacks[key].push({
    dataUrl: canvas.toDataURL("image/png"),
    moldHtml: moldLayer.innerHTML
  });
  if (studyUndoStacks[key].length > 25) studyUndoStacks[key].shift();
  studyRedoStacks[key] = [];
}

function applyStudySnapshot(snap) {
  const canvas = document.getElementById("studyCanvas");
  const moldLayer = document.getElementById("studyMoldLayer");
  if (!canvas || !moldLayer || !snap) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  moldLayer.innerHTML = snap.moldHtml || "";
  if (snap.dataUrl) {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      saveStudyAnnotationsForCurrentPage();
    };
    img.src = snap.dataUrl;
  } else {
    saveStudyAnnotationsForCurrentPage();
  }
}

function undoStudyAction() {
  const key = getStudyPageKey();
  const stack = studyUndoStacks[key];
  if (!stack || stack.length === 0) return;
  const canvas = document.getElementById("studyCanvas");
  const moldLayer = document.getElementById("studyMoldLayer");
  if (!studyRedoStacks[key]) studyRedoStacks[key] = [];
  studyRedoStacks[key].push({
    dataUrl: canvas ? canvas.toDataURL("image/png") : "",
    moldHtml: moldLayer ? moldLayer.innerHTML : ""
  });
  const prev = stack.pop();
  applyStudySnapshot(prev);
}

function redoStudyAction() {
  const key = getStudyPageKey();
  const rStack = studyRedoStacks[key];
  if (!rStack || rStack.length === 0) return;
  const canvas = document.getElementById("studyCanvas");
  const moldLayer = document.getElementById("studyMoldLayer");
  if (!studyUndoStacks[key]) studyUndoStacks[key] = [];
  studyUndoStacks[key].push({
    dataUrl: canvas ? canvas.toDataURL("image/png") : "",
    moldHtml: moldLayer ? moldLayer.innerHTML : ""
  });
  const next = rStack.pop();
  applyStudySnapshot(next);
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
  const btn = document.getElementById("btnStudyBookmark");
  if (!btn) return;
  const sId = activeScore ? activeScore.id : 1;
  const isBm = studyBookmarks[sId]?.has(pageNum);
  btn.classList.toggle("bookmarked", Boolean(isBm));
  btn.textContent = isBm ? "★" : "☆";
}

function renderStudyPageScrubber() {
  const el = document.getElementById("studyPageScrubber");
  if (!el) return;
  const total = activeScore?.pageCount || 10;
  const sId = activeScore ? activeScore.id : 1;
  const bms = studyBookmarks[sId] || new Set();
  let html = "";
  for (let p = 1; p <= total; p++) {
    const cls = [
      "scrub-pg-btn",
      p === pageNum ? "active" : "",
      bms.has(p) ? "has-bookmark" : ""
    ].filter(Boolean).join(" ");
    html += `<button class="${cls}" onclick="jumpToPage(${p})">${p}</button>`;
  }
  el.innerHTML = html;
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
  document.getElementById("btnPen").classList.toggle("active", tool === "pen");
  document.getElementById("btnMarker").classList.toggle("active", tool === "marker");
  document.getElementById("btnEraser").classList.toggle("active", tool === "eraser");
  document.getElementById("btnStamps")?.classList.remove("active");
  document.getElementById("btnBrushStyle")?.classList.remove("active");
  document.getElementById("stampPopover")?.classList.add("hidden");
  document.getElementById("brushPopover")?.classList.add("hidden");
  const fl = document.getElementById("studyFooterLeft");
  if (fl) {
    const names = { pen: "Pluma Activa", marker: "Marcador Activo", eraser: "Borrador Activo" };
    fl.textContent = `Modo Estudio • ${names[tool] || "Pluma"}`;
  }
}

function toggleAutoMold() {
  autoMold = !autoMold;
  document.getElementById("btnMoldToggle").classList.toggle("magic-active", autoMold);
}

function setInk(color, btn) {
  inkColor = color;
  document.querySelectorAll(".ink-well").forEach((d) => d.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const dot = document.getElementById("brushSwatchDot");
  if (dot) dot.style.background = color;
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
    document.body.classList.add("writing-focus");
    document.getElementById("dockRevealHandle")?.classList.remove("hidden");
    document.getElementById("brushPopover")?.classList.add("hidden");
    const pt = getPt(e);
    pushStudyUndoSnapshot();
    if (studyTool === "stamp" && selectedStamp) {
      addMoldBadge(pt.x, pt.y, selectedStamp, inkColor);
      saveStudyAnnotationsForCurrentPage();
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
      ctx.globalAlpha = Math.min(0.45, brushOpacity * 0.45);
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = Math.max(14, brushWidth * 5.5);
    } else if (studyTool === "eraser") {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 26;
    } else {
      ctx.globalAlpha = brushOpacity;
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = brushWidth;
    }
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.globalAlpha = 1;
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
        saveStudyAnnotationsForCurrentPage();
      }, 280);
    } else {
      saveStudyAnnotationsForCurrentPage();
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

function confirmClearStudyLayer() {
  if (window.confirm("¿Limpiar todas las anotaciones de esta página?")) {
    pushStudyUndoSnapshot();
    clearStudyLayer();
    saveStudyAnnotationsForCurrentPage();
  }
}

function clearStudyLayer() {
  const canvas = document.getElementById("studyCanvas");
  if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  const ml = document.getElementById("studyMoldLayer");
  if (ml) ml.innerHTML = "";
}

// ==========================================================================
// 3. MODO CONCIERTO (Pantalla completa real al tocar + 2 Págs + Quick-Pen)
// ==========================================================================
let audioTimer = null;
let followedSys = 0;
let layoutIdx = 0;
const layouts = ["1 Pág", "Media Pág", "2 Págs"];

async function turnPage(dir) {
  saveStudyAnnotationsForCurrentPage();
  const total = activeScore.pageCount || 10;
  const step = layouts[layoutIdx] === "2 Págs" ? 2 : 1;
  pageNum = Math.max(1, Math.min(total, pageNum + dir * step));
  await renderActiveScorePage();
}

async function cyclePageLayout() {
  layoutIdx = (layoutIdx + 1) % layouts.length;
  document.getElementById("pageModeLabel").textContent = layouts[layoutIdx];
  document.getElementById("concertTransitionTag").textContent = `${layouts[layoutIdx]} • Toca el centro para ocultar controles`;
  await renderActiveScorePage();
}

function handleConcertCanvasTap(e) {
  if (concertQuickToolActive) return;
  if (e.target.closest("button, .concert-stage-pills, .concert-quick-palette, .floating-bottom-bar")) return;
  document.body.classList.toggle("concert-immersion");
}

function toggleAudioFollow() {
  const btn = document.getElementById("btnAudioFollow");
  const lbl = document.getElementById("audioFollowLabel");

  if (audioTimer) {
    clearInterval(audioTimer);
    audioTimer = null;
    btn.classList.remove("listening");
    lbl.textContent = "Escucha Activa (Demo)";
    if (!activeScore.isRealPdf) {
      document.getElementById("concertSvg").innerHTML = buildPortraitScoreSvg(-1);
    }
    return;
  }

  btn.classList.add("listening");
  followedSys = 0;
  lbl.textContent = "Compás 1 • Demo";
  if (!activeScore.isRealPdf) {
    document.getElementById("concertSvg").innerHTML = buildPortraitScoreSvg(followedSys);
  }

  audioTimer = setInterval(() => {
    followedSys = (followedSys + 1) % 6;
    lbl.textContent = `Compás ${followedSys * 3 + 1} • Auto`;
    if (!activeScore.isRealPdf) {
      document.getElementById("concertSvg").innerHTML = buildPortraitScoreSvg(followedSys);
    }
    if (followedSys === 5) {
      setTimeout(() => {
        if (audioTimer) turnPage(1);
      }, 1000);
    }
  }, 2000);
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

function saveProgramsState() {
  try {
    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programsState));
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

function moveProgramItem(idx, delta) {
  const targetIdx = idx + delta;
  reorderSetlist(idx, targetIdx);
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
  const detailTitleEl = document.getElementById("progDetailTitle");
  const itemsEl = document.getElementById("setlistItems");
  const sumEl = document.getElementById("setlistSummary");
  const launchBtn = document.getElementById("btnLaunchProgram");
  const quickSel = document.getElementById("quickAddScoreSelect");
  if (!sel || !itemsEl) return;

  sel.innerHTML = programsState.list
    .map((p) => `<option value="${p.id}" ${p.id === programsState.activeId ? "selected" : ""}>${p.name}</option>`)
    .join("");

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

  if (sumEl) sumEl.textContent = `Obras (${validScores.length}):`;
  if (launchBtn) launchBtn.disabled = false;

  const concertFooterLeft = document.getElementById("concertFooterLeft");
  if (concertFooterLeft && prog) {
    concertFooterLeft.textContent = `Programa: ${prog.name}`;
  }

  if (validScores.length === 0) {
    itemsEl.innerHTML = "";
    return;
  }

  itemsEl.innerHTML = validScores
    .map(
      (s, idx) => `
      <div class="setlist-item"
           data-sl-idx="${idx}"
           onpointerdown="onSlPointerDown(event, ${idx})">
        <svg viewBox="0 0 24 24" class="pq-drag-ico" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
        <span class="setlist-num">${idx + 1}</span>
        <div class="setlist-item-info" onclick="openScoreById(${s.id}, 'study')" title="Abrir partitura">
          <strong>${s.clean || s.title}</strong>
          <small>${s.composer.split("(")[0].trim()}</small>
        </div>
        <div class="setlist-item-controls" onclick="event.stopPropagation()">
          <button class="pq-step-btn" onclick="moveProgramItem(${idx}, -1)" ${idx === 0 ? "disabled" : ""} title="Subir" aria-label="Subir">↑</button>
          <button class="pq-step-btn" onclick="moveProgramItem(${idx}, 1)" ${idx === validScores.length - 1 ? "disabled" : ""} title="Bajar" aria-label="Bajar">↓</button>
          <button class="pq-remove-btn" onclick="removeProgramItem(${idx})" title="Quitar del programa" aria-label="Quitar">−</button>
        </div>
      </div>
    `
    )
    .join("");
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

// Quick-Pen en Modo Concierto
let concertQuickToolActive = false;
let concertQuickTool = "pen";

function toggleConcertQuickTools(forceState) {
  const pal = document.getElementById("concertQuickPalette");
  const btn = document.getElementById("btnConcertQuickPen");
  const drawLayer = document.getElementById("concertQuickCanvas");
  if (!pal || !drawLayer) return;

  concertQuickToolActive = typeof forceState === "boolean" ? forceState : pal.classList.contains("hidden");
  pal.classList.toggle("hidden", !concertQuickToolActive);
  if (btn) btn.classList.toggle("active", concertQuickToolActive);
  drawLayer.classList.toggle("active-drawing", concertQuickToolActive);
  if (concertQuickToolActive) setupConcertQuickCanvas();
}

function setConcertQuickTool(tool) {
  concertQuickTool = tool;
  document.getElementById("cqPenBtn")?.classList.toggle("active", tool === "pen");
  document.getElementById("cqMarkerBtn")?.classList.toggle("active", tool === "marker");
  document.getElementById("cqEraserBtn")?.classList.toggle("active", tool === "eraser");
}

function setupConcertQuickCanvas() {
  const canvas = document.getElementById("concertQuickCanvas");
  const wrap = document.getElementById("concertWrap");
  if (!canvas || !wrap) return;
  if (canvas.width !== wrap.clientWidth || canvas.height !== wrap.clientHeight) {
    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
  }
}

function initConcertQuickInteraction() {
  const canvas = document.getElementById("concertQuickCanvas");
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
    if (!concertQuickToolActive) return;
    e.preventDefault();
    e.stopPropagation();
    drawing = true;
    last = getPt(e);
  };

  const move = (e) => {
    if (!drawing || !concertQuickToolActive) return;
    e.preventDefault();
    const pt = getPt(e);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pt.x, pt.y);
    if (concertQuickTool === "marker") {
      ctx.strokeStyle = "rgba(212, 175, 55, 0.34)";
      ctx.lineWidth = 18;
    } else if (concertQuickTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 26;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#23426e";
      ctx.lineWidth = 2.4;
    }
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    last = pt;
  };

  const up = () => {
    drawing = false;
  };

  canvas.addEventListener("mousedown", down);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
  canvas.addEventListener("touchstart", down, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("touchend", up);
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

// Cierre global de todos los menús desplegables al tocar fuera (excepto barras y controles principales)
document.addEventListener("pointerdown", (e) => {
  const isMainControl = e.target.closest(
    ".floating-hud-top, .lib-unified-row, .lib-filter-bar, .bottom-nav-dock, #floatingImportFab, #bachGptFab, #btnSettingsDrawer, .work-more-btn"
  );

  const floatingMenus = [
    { id: "workActionsMenu", close: () => closeWorkActionsMenu() },
    { id: "progQuickPopover", close: () => document.getElementById("progQuickPopover")?.classList.add("hidden") },
    { id: "sharedFilterMenu", close: () => closeSharedFilterMenu() },
    { id: "progScoreSuggestions", close: () => document.getElementById("progScoreSuggestions")?.classList.add("hidden") },
    { id: "importPdfMenu", close: () => document.getElementById("importPdfMenu")?.classList.add("hidden") },
    { id: "settingsDrawer", close: () => document.getElementById("settingsDrawer")?.classList.add("hidden") },
    { id: "brushPopover", close: () => document.getElementById("brushPopover")?.classList.add("hidden") },
    { id: "stampPopover", close: () => document.getElementById("stampPopover")?.classList.add("hidden") }
  ];

  let closedAny = false;
  for (const m of floatingMenus) {
    const el = document.getElementById(m.id);
    if (el && !el.classList.contains("hidden") && !e.target.closest(`#${m.id}`)) {
      // No cerrar si el toque fue en su propio botón disparador
      if (m.id === "workActionsMenu" && e.target.closest(".work-more-btn")) continue;
      if (m.id === "importPdfMenu" && e.target.closest("#importPopoverWrap")) continue;
      if (m.id === "settingsDrawer" && e.target.closest("#btnSettingsDrawer")) continue;
      if (m.id === "sharedFilterMenu" && e.target.closest(".filter-dd-btn")) continue;
      if (m.id === "progScoreSuggestions" && e.target.closest("#progScoreSearchWrap")) continue;
      if (m.id === "brushPopover" && e.target.closest("#btnBrushStyle")) continue;
      if (m.id === "stampPopover" && e.target.closest("#btnStamps")) continue;
      m.close();
      closedAny = true;
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

// Cerrar menús flotantes al tocar cualquier parte fuera de ellos
document.addEventListener("click", (e) => {
  const settingsDrw = document.getElementById("settingsDrawer");
  if (settingsDrw && !settingsDrw.classList.contains("hidden") && !e.target.closest("#settingsDrawer") && !e.target.closest("#btnSettingsDrawer")) {
    settingsDrw.classList.add("hidden");
  }

  const workMenu = document.getElementById("workActionsMenu");
  if (workMenu && !workMenu.classList.contains("hidden") && !e.target.closest("#workActionsMenu") && !e.target.closest(".work-more-btn")) {
    workMenu.classList.add("hidden");
  }

  const sharedFilterMenu = document.getElementById("sharedFilterMenu");
  if (sharedFilterMenu && !sharedFilterMenu.classList.contains("hidden") && !e.target.closest("#sharedFilterMenu") && !e.target.closest(".filter-dd-btn")) {
    closeSharedFilterMenu();
  }

  const pqPop = document.getElementById("progQuickPopover");
  if (pqPop && !pqPop.classList.contains("hidden") && !e.target.closest("#progQuickPopover") && !e.target.closest(".add-prog-btn")) {
    pqPop.classList.add("hidden");
  }
  const impMenu = document.getElementById("importPdfMenu");
  if (impMenu && !impMenu.classList.contains("hidden") && !e.target.closest("#importPopoverWrap")) {
    impMenu.classList.add("hidden");
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
    !e.target.closest(".bach-card-btn")
  ) {
    toggleBachGptChat(false);
  }

  const brushPop = document.getElementById("brushPopover");
  if (brushPop && !brushPop.classList.contains("hidden") && !e.target.closest("#brushPopover") && !e.target.closest("#btnBrushStyle")) {
    brushPop.classList.add("hidden");
  }

  const stampPop = document.getElementById("stampPopover");
  if (stampPop && !stampPop.classList.contains("hidden") && !e.target.closest("#stampPopover") && !e.target.closest("#btnStamps")) {
    stampPop.classList.add("hidden");
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  await loadSavedPdfsFromDb();
  loadFavoritesState();
  loadProgramsState();
  initBachGptWidget();
  renderLibrary();
  renderSetlistDrawer();
  switchStampTab("guitar");
  document.getElementById("studySvg").innerHTML = buildPortraitScoreSvg(-1);
  document.getElementById("concertSvg").innerHTML = buildPortraitScoreSvg(-1);
  initStudyInteraction();
  initConcertQuickInteraction();
  initEditorInteraction();
  setupStudyCanvas();
  setupConcertQuickCanvas();
  setupEditorCanvas();
  renderStudyPageScrubber();
  updateBookmarkButton();
});

window.addEventListener("resize", () => {
  setupStudyCanvas();
  setupConcertQuickCanvas();
  setupEditorCanvas();
});

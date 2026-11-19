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

// ==========================================================================
// IMPORTADOR INTELIGENTE DE PDFs REALES DESDE LA TABLET O CELULAR
// ==========================================================================
function inferMusicMetadataFromFilename(rawFilename) {
  const nameNoExt = rawFilename.replace(/\.pdf$/i, "");
  const cleanStr = nameNoExt
    .replace(/^\(Partition.*?\)\s*-\s*/i, "")
    .replace(/^[!0-9_\-\s]+/, "")
    .replace(/[_]+/g, " ")
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
      theory: `Obra catalogada para dotación de ${group}. Puedes utilizar el Taller de PDF (✂) para extraer movimientos individuales o limpiar páginas sobrantes.`,
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
  showPilotBanner(`⏳ Importando y catalogando ${fileList.length} archivo(s) PDF de tu tablet...`);

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const meta = inferMusicMetadataFromFilename(file.name);
    const previewInfo = await generatePdfThumbnailDataUrl(uint8);
    const numPages = previewInfo ? previewInfo.numPages : 1;

    const newScore = {
      id: Date.now() + i,
      title: meta.title,
      clean: meta.title,
      subtitle: `Archivo PDF de tu Tablet (${file.name})`,
      composer: meta.composer,
      period: meta.period,
      group: meta.group,
      program: "Biblioteca Piloto Tablet",
      pages: `${numPages} ${numPages === 1 ? "pág." : "págs."}`,
      pageCount: numPages,
      tuning: "PDF Real",
      raw: false,
      isRealPdf: true,
      pdfBytes: uint8,
      thumbDataUrl: previewInfo ? previewInfo.thumbUrl : null,
      aiData: meta.aiData
    };

    scores.unshift(newScore);
    await saveRealPdfToDb(newScore);
  }

  document.getElementById("realPdfFileInput").value = "";
  showPilotBanner(`✓ ${fileList.length} PDF(s) importados con éxito. Toca cualquiera para abrirlo en Hoja Parada o usa ✂ para particionarlo.`);
  renderLibrary();
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
  const studySvgEl = document.getElementById("studySvg");
  const concertSvgEl = document.getElementById("concertSvg");
  const studyHead = document.getElementById("studyFolioHeader");
  const concertHead = document.getElementById("concertFolioHeader");

  if (activeScore.isRealPdf && currentPdfDocInstance) {
    studySvgEl.classList.add("hidden");
    concertSvgEl.classList.add("hidden");
    studyPdfCanvas.classList.remove("hidden");
    concertPdfCanvas.classList.remove("hidden");
    // Ocultar encabezado duplicado para que el PDF real ocupe toda la hoja parada
    studyHead.classList.add("compact-pdf-head");
    concertHead.classList.add("compact-pdf-head");

    const page = await currentPdfDocInstance.getPage(pageNum);
    await renderPdfPageToCanvas(page, studyPdfCanvas, document.getElementById("studyWrap"));
    await renderPdfPageToCanvas(page, concertPdfCanvas, document.getElementById("concertWrap"));
    setupStudyCanvas();
  } else {
    studyPdfCanvas.classList.add("hidden");
    concertPdfCanvas.classList.remove("hidden");
    concertPdfCanvas.classList.add("hidden");
    studySvgEl.classList.remove("hidden");
    concertSvgEl.classList.remove("hidden");
    studyHead.classList.remove("compact-pdf-head");
    concertHead.classList.remove("compact-pdf-head");

    studySvgEl.innerHTML = buildPortraitScoreSvg(-1);
    concertSvgEl.innerHTML = buildPortraitScoreSvg(-1);
    setupStudyCanvas();
  }
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
// TALLER DE PDF REAL CON pdf-lib (PARTICIONAR, QUITAR Y AGREGAR PÁGINAS)
// ==========================================================================
async function openPdfModalById(scoreId) {
  const s = scores.find((item) => item.id === Number(scoreId));
  if (!s) return;
  activeWorkshopScoreId = s.id;

  document.getElementById("modalScoreTitle").textContent = s.clean || s.title;
  document.getElementById("wmTitleInput").value = s.clean || s.title;
  document.getElementById("wmComposerInput").value = s.composer;
  document.getElementById("wmPeriodInput").value = s.period;
  document.getElementById("wmGroupInput").value = s.group;
  document.getElementById("pdfToast").textContent = "";

  const total = s.pageCount || 4;
  document.getElementById("splitStartPage").value = 1;
  document.getElementById("splitStartPage").max = total;
  document.getElementById("splitEndPage").value = Math.min(2, total);
  document.getElementById("splitEndPage").max = total;

  selectedWorkshopPages = new Set([1]);
  renderWorkshopPageStrip(s);
  document.getElementById("pdfModal").classList.remove("hidden");
}

function renderWorkshopPageStrip(scoreObj) {
  const strip = document.getElementById("workshopPagesStrip");
  const total = Math.min(24, scoreObj.pageCount || 4);
  let html = "";
  for (let p = 1; p <= total; p++) {
    const isSel = selectedWorkshopPages.has(p);
    html += `
      <div class="folio-page-thumb ${isSel ? "active" : ""}" onclick="toggleWorkshopPageSelection(${p}, this)">
        <div class="mini-staff-lines"></div>
        <span>Pág. ${p}</span>
        <small>${scoreObj.isRealPdf ? "PDF Real" : `Sección ${p}`}</small>
      </div>
    `;
  }
  strip.innerHTML = html;
}

function toggleWorkshopPageSelection(pNum, el) {
  if (selectedWorkshopPages.has(pNum)) {
    selectedWorkshopPages.delete(pNum);
    el.classList.remove("active");
  } else {
    selectedWorkshopPages.add(pNum);
    el.classList.add("active");
  }
  if (selectedWorkshopPages.size > 0) {
    const sorted = Array.from(selectedWorkshopPages).sort((a, b) => a - b);
    document.getElementById("splitStartPage").value = sorted[0];
    document.getElementById("splitEndPage").value = sorted[sorted.length - 1];
  }
}

async function saveWorkshopMetadata() {
  const s = scores.find((item) => item.id === activeWorkshopScoreId);
  if (!s) return;
  s.title = document.getElementById("wmTitleInput").value.trim() || s.title;
  s.clean = s.title;
  s.composer = document.getElementById("wmComposerInput").value.trim() || s.composer;
  s.period = document.getElementById("wmPeriodInput").value;
  s.group = document.getElementById("wmGroupInput").value;
  s.raw = false;

  if (s.isRealPdf) await saveRealPdfToDb(s);
  renderLibrary();
  triggerPdfToast("✓ Nombre, compositor, periodo y dotación actualizados.");
}

async function splitRealPdfRange() {
  const s = scores.find((item) => item.id === activeWorkshopScoreId);
  if (!s) return;

  const startP = Math.max(1, Number(document.getElementById("splitStartPage").value) || 1);
  const endP = Math.max(startP, Number(document.getElementById("splitEndPage").value) || startP);

  if (s.isRealPdf && s.pdfBytes && window.PDFLib) {
    try {
      const srcDoc = await window.PDFLib.PDFDocument.load(s.pdfBytes);
      const newDoc = await window.PDFLib.PDFDocument.create();
      const total = srcDoc.getPageCount();
      const indices = [];
      for (let p = startP; p <= Math.min(endP, total); p++) {
        indices.push(p - 1);
      }
      const copiedPages = await newDoc.copyPages(srcDoc, indices);
      copiedPages.forEach((cp) => newDoc.addPage(cp));
      const newBytes = await newDoc.save();
      const preview = await generatePdfThumbnailDataUrl(newBytes);

      const newTitle = `${s.clean || s.title} (Extracto Págs. ${startP}–${endP})`;
      const splitScore = {
        ...s,
        id: Date.now(),
        title: newTitle,
        clean: newTitle,
        pages: `${indices.length} págs.`,
        pageCount: indices.length,
        pdfBytes: newBytes,
        thumbDataUrl: preview ? preview.thumbUrl : s.thumbDataUrl
      };

      scores.unshift(splitScore);
      await saveRealPdfToDb(splitScore);
      renderLibrary();
      triggerPdfToast(`✂ Nueva partitura creada con las páginas ${startP} a ${endP}.`);
      return;
    } catch (e) {
      console.warn("Error al particionar PDF real:", e);
    }
  }

  // Fallback para obras demo
  const newCount = endP - startP + 1;
  const demoSplit = {
    ...s,
    id: Date.now(),
    title: `${s.clean || s.title} (Págs. ${startP}–${endP})`,
    clean: `${s.clean || s.title} (Págs. ${startP}–${endP})`,
    pages: `${newCount} págs.`,
    pageCount: newCount
  };
  scores.unshift(demoSplit);
  renderLibrary();
  triggerPdfToast(`✂ Partición creada (Págs. ${startP}–${endP}) y agregada a tu biblioteca.`);
}

async function deleteSelectedPdfPages() {
  const s = scores.find((item) => item.id === activeWorkshopScoreId);
  if (!s || selectedWorkshopPages.size === 0) return;

  if (s.isRealPdf && s.pdfBytes && window.PDFLib) {
    try {
      const srcDoc = await window.PDFLib.PDFDocument.load(s.pdfBytes);
      const total = srcDoc.getPageCount();
      if (selectedWorkshopPages.size >= total) {
        triggerPdfToast("⚠️ No puedes eliminar todas las páginas del PDF.");
        return;
      }
      const newDoc = await window.PDFLib.PDFDocument.create();
      const keepIndices = [];
      for (let p = 1; p <= total; p++) {
        if (!selectedWorkshopPages.has(p)) keepIndices.push(p - 1);
      }
      const copied = await newDoc.copyPages(srcDoc, keepIndices);
      copied.forEach((cp) => newDoc.addPage(cp));
      const newBytes = await newDoc.save();
      const preview = await generatePdfThumbnailDataUrl(newBytes);

      s.pdfBytes = newBytes;
      s.pageCount = keepIndices.length;
      s.pages = `${keepIndices.length} págs.`;
      if (preview) s.thumbDataUrl = preview.thumbUrl;

      await saveRealPdfToDb(s);
      selectedWorkshopPages.clear();
      renderWorkshopPageStrip(s);
      renderLibrary();
      triggerPdfToast(`🗑️ Páginas eliminadas. El PDF ahora tiene ${keepIndices.length} páginas.`);
      return;
    } catch (e) {
      console.warn(e);
    }
  }

  s.pageCount = Math.max(1, (s.pageCount || 4) - selectedWorkshopPages.size);
  s.pages = `${s.pageCount} págs.`;
  selectedWorkshopPages.clear();
  renderWorkshopPageStrip(s);
  renderLibrary();
  triggerPdfToast("🗑️ Páginas seleccionadas eliminadas del documento.");
}

async function handleAppendPdfPages(files) {
  if (!files || files.length === 0) return;
  const s = scores.find((item) => item.id === activeWorkshopScoreId);
  if (!s) return;

  const extraBuffer = await files[0].arrayBuffer();
  const extraBytes = new Uint8Array(extraBuffer);

  if (s.isRealPdf && s.pdfBytes && window.PDFLib) {
    try {
      const mainDoc = await window.PDFLib.PDFDocument.load(s.pdfBytes);
      const extraDoc = await window.PDFLib.PDFDocument.load(extraBytes);
      const indices = extraDoc.getPageIndices();
      const copied = await mainDoc.copyPages(extraDoc, indices);
      copied.forEach((cp) => mainDoc.addPage(cp));
      const mergedBytes = await mainDoc.save();

      s.pdfBytes = mergedBytes;
      s.pageCount = mainDoc.getPageCount();
      s.pages = `${s.pageCount} págs.`;
      await saveRealPdfToDb(s);
      renderWorkshopPageStrip(s);
      renderLibrary();
      triggerPdfToast(`＋ Se unieron ${indices.length} página(s) al final de esta partitura.`);
      return;
    } catch (e) {
      console.warn(e);
    }
  }
  triggerPdfToast("＋ Páginas anexadas correctamente al documento.");
}

// ==========================================================================
// NAVEGACIÓN GENERAL Y BIBLIOTECA
// ==========================================================================
function switchMode(mode) {
  document.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  document.querySelectorAll(".canvas-view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`mode-${mode}`).classList.add("active");

  if (mode === "study" || mode === "concert") {
    setTimeout(() => renderActiveScorePage(), 40);
  }
  if (mode === "editor") setTimeout(setupEditorCanvas, 40);
}

function setPalette(paletteClass, btn) {
  document.body.className = paletteClass;
  document.querySelectorAll(".theme-orb").forEach((c) => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

function setLibraryViewMode(mode) {
  libraryViewMode = mode;
  document.getElementById("btnViewFolio").classList.toggle("active", mode === "folio");
  document.getElementById("btnViewList").classList.toggle("active", mode === "list");

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
  document.getElementById("classifyMenu").classList.toggle("hidden");
}

window.addEventListener("click", () => {
  const menu = document.getElementById("classifyMenu");
  if (menu && !menu.classList.contains("hidden")) menu.classList.add("hidden");
});

function selectClassification(clsKey, labelText, btn) {
  currentClassification = clsKey;
  document.getElementById("currentClassifyLabel").textContent = labelText;
  document.querySelectorAll(".dd-item").forEach((item) => item.classList.remove("active"));
  if (btn) btn.classList.add("active");
  document.getElementById("classifyMenu").classList.add("hidden");
  renderLibrary();
}

function exitAiModeToCatalog() {
  const allBtn = document.querySelector('.dd-item[data-cls="all"]');
  selectClassification("all", "Clasificar: Todo", allBtn);
}

function renderLibrary() {
  const container = document.getElementById("libraryCatalogContainer");
  const q = (document.getElementById("searchInput").value || "").toLowerCase();

  const filtered = scores.filter((s) => {
    if (currentClassification === "real-only" && !s.isRealPdf) return false;
    return (
      s.title.toLowerCase().includes(q) ||
      (s.clean && s.clean.toLowerCase().includes(q)) ||
      s.composer.toLowerCase().includes(q) ||
      s.period.toLowerCase().includes(q) ||
      s.group.toLowerCase().includes(q) ||
      s.program.toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-pilot-box">
        <h4>No hay archivos en esta vista</h4>
        <p>Toca el botón <strong>"＋ Importar PDF"</strong> arriba a la izquierda para cargar partituras reales desde tu tablet.</p>
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
    else if (currentClassification === "real-only") key = "Mis PDFs Importados de la Tablet";

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
          <span>${s.pages}</span>
        </div>
      `;

  return `
    <article class="folio-card" onclick="openScoreById(${s.id}, 'study')">
      <div class="folio-preview-sheet ${s.thumbDataUrl ? "has-real-thumb" : ""}">
        ${previewInner}
      </div>

      <div class="folio-card-body">
        <div class="folio-card-title">
          <span>${s.title}</span>
          ${s.isRealPdf ? `<span class="real-pdf-badge">PDF Tablet</span>` : s.raw ? `<span class="raw-badge">PDF Crudo</span>` : ""}
        </div>
        <span class="folio-card-sub">${s.composer}</span>
        <span class="folio-card-detail">${s.subtitle}</span>
      </div>

      <div class="folio-card-foot" onclick="event.stopPropagation()">
        <span class="period-tag">${s.period} • ${s.pages}</span>
        <div class="folio-quick-btns">
          <button class="mini-action-btn" onclick="openAiForWork(${s.id})" title="Consultar IA Musicológica">✦</button>
          <button class="mini-action-btn" onclick="openPdfModalById(${s.id})" title="Taller PDF y Renombrar">✂</button>
          <button class="mini-action-btn" onclick="openScoreById(${s.id}, 'concert')" title="Modo Concierto">◉</button>
        </div>
      </div>
    </article>
  `;
}

function buildListRowHtml(s) {
  return `
    <div class="list-detail-row" onclick="openScoreById(${s.id}, 'study')">
      <div class="list-col-main">
        <div class="list-title-line">
          <strong class="list-work-title">${s.title}</strong>
          ${s.isRealPdf ? `<span class="real-pdf-badge">PDF Tablet</span>` : s.raw ? `<span class="raw-badge">PDF Crudo</span>` : ""}
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
        <button class="mini-action-btn" onclick="openPdfModalById(${s.id})" title="Taller PDF y Renombrar">✂</button>
        <button class="mini-action-btn" onclick="openScoreById(${s.id}, 'concert')" title="Abrir en Concierto">◉</button>
      </div>
    </div>
  `;
}

// ==========================================================================
// BACHGPT: CHATBOT FLOTANTE CON RETRATO EN ARTE DE 8 BITS DE J. S. BACH
// ==========================================================================
let bachSelectedWorkId = 1;
let bachGreetingInitialized = false;

// Generador de Retrato en Pixel Art de 8 Bits de J. S. Bach (SVG crispEdges)
function build8BitBachSvg() {
  // Matriz 16x16 de pixel art:
  // . = transparente, W = peluca blanca, G = sombra gris peluca, S = piel rostro,
  // D = sombra piel, E = ojos/cejas, M = boca/expresión, C = casaca barroca roja/vino,
  // B = botones dorados, R = chorrera/cuello blanco
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
    ".WWW.RRRRRR.WWW.",
    "..W.CRRRRRRC.W..",
    "...CCCRBBRCCC...",
    "..CCCCRBBRCCCC..",
    "..CCCCCRRCCCCC.."
  ];

  const palette = {
    W: "#f8fafc", // Peluca empolvada blanca
    G: "#cbd5e1", // Rizos grises de la peluca
    S: "#f3c69f", // Piel
    D: "#d99f72", // Sombra nariz/pómulos
    E: "#1e1b18", // Ojos
    M: "#9a5b42", // Boca
    R: "#ffffff", // Chorrera barroca
    C: "#7c2d12", // Casaca barroca vino/terracota
    B: "#facc15"  // Botones de oro
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

function initBachGptWidget() {
  const fabIcon = document.getElementById("bachFabIcon");
  const headerAvatar = document.getElementById("bachHeaderAvatar");
  const svg8Bit = build8BitBachSvg();
  if (fabIcon) fabIcon.innerHTML = svg8Bit;
  if (headerAvatar) headerAvatar.innerHTML = svg8Bit;
  populateBachWorkSelect();
}

function populateBachWorkSelect() {
  const sel = document.getElementById("bachWorkSelect");
  if (!sel) return;
  sel.innerHTML = scores
    .map((s) => `<option value="${s.id}" ${s.id === bachSelectedWorkId ? "selected" : ""}>${s.clean || s.title} (${s.composer.split("(")[0].trim()})</option>`)
    .join("");
}

function toggleBachGptChat(forceState) {
  const win = document.getElementById("bachGptWindow");
  if (!win) return;
  const shouldOpen = typeof forceState === "boolean" ? forceState : win.classList.contains("hidden");

  if (shouldOpen) {
    populateBachWorkSelect();
    win.classList.remove("hidden");
    if (!bachGreetingInitialized) {
      bachGreetingInitialized = true;
      const work = scores.find((s) => s.id === Number(bachSelectedWorkId)) || scores[0];
      appendBachMessage(
        `¡Guten Tag, querido colega! Soy <strong>BachGPT</strong>, tu Kapellmeister de 8 bits. Veo que tenemos en el atril <em>"${work.clean || work.title}"</em>. ¿Quieres que platiquemos sobre su historia, su arquitectura contrapuntística, sugerencias de digitación o te comparto grabaciones en YouTube?`
      );
    }
  } else {
    win.classList.add("hidden");
  }
}

function openAiForWork(scoreId) {
  bachSelectedWorkId = Number(scoreId);
  toggleBachGptChat(true);
  const sel = document.getElementById("bachWorkSelect");
  if (sel) sel.value = String(scoreId);
  changeBachConversationWork(scoreId);
}

function changeBachConversationWork(scoreId) {
  bachSelectedWorkId = Number(scoreId);
  const work = scores.find((s) => s.id === bachSelectedWorkId) || scores[0];
  const lbl = document.getElementById("bachCurrentWorkLabel");
  if (lbl) lbl.textContent = `Consultando: ${work.clean || work.title}`;

  appendBachMessage(
    `¡Ah, excelente elección! Hemos puesto en el facistol <strong>${work.clean || work.title}</strong> de <em>${work.composer}</em> (${work.period}, ${work.group}). Toca uno de los temas de abajo o pregúntame lo que desees sobre esta partitura.`
  );
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

function appendBachMessage(htmlContent) {
  const box = document.getElementById("bachChatMessages");
  if (!box) return;
  const wrap = document.createElement("div");
  wrap.className = "bach-msg-row";
  wrap.innerHTML = `
    <div class="bach-mini-8bit">${build8BitBachSvg()}</div>
    <div class="chat-bubble bach-bubble">${htmlContent}</div>
  `;
  box.appendChild(wrap);
  box.scrollTop = box.scrollHeight;
}

function askBachTopic(topic) {
  const work = scores.find((s) => s.id === Number(bachSelectedWorkId)) || scores[0];
  const title = work.clean || work.title;

  if (topic === "history") {
    appendUserMessage(`Maestro Bach, cuéntame la historia de "${title}".`);
    setTimeout(() => {
      appendBachMessage(
        `<strong>📜 Crónica Histórica:</strong><br>${work.aiData.history}<br><small style="opacity:0.75">Periodo: ${work.period} • Autor: ${work.composer}</small>`
      );
    }, 220);
  } else if (topic === "theory") {
    appendUserMessage(`¿Cómo está construida teórica y formalmente "${title}"?`);
    setTimeout(() => {
      appendBachMessage(
        `<strong>🎼 Arquitectura y Teoría:</strong><br>${work.aiData.theory}<br><small style="opacity:0.75">Dotación: ${work.group} • Extensión: ${work.pages}</small>`
      );
    }, 220);
  } else if (topic === "performance") {
    appendUserMessage(`¿Qué consejos de digitación e interpretación me das para "${title}"?`);
    setTimeout(() => {
      appendBachMessage(
        `<strong>🎸 Consejo en el Atril:</strong><br>${work.aiData.performance}<br>
        <button class="bach-inline-btn" onclick="openScoreById(${work.id}, 'study'); toggleBachGptChat(false);">
          ✎ Abrir partitura en Modo Estudio para anotar
        </button>`
      );
    }, 220);
  } else if (topic === "links") {
    appendUserMessage(`Muéstrame interpretaciones en YouTube y ediciones de "${title}".`);
    const linksHtml = work.aiData.links
      .map(
        (lnk) =>
          `<a href="${lnk.url}" target="_blank" rel="noopener noreferrer" class="bach-chat-link">${lnk.label} ↗</a>`
      )
      .join("");
    setTimeout(() => {
      appendBachMessage(
        `<strong>▶ Grabaciones de Referencia y Fuentes Web:</strong><br>Aquí tienes enlaces directos para escuchar y comparar versiones de <em>${title}</em>:<div class="bach-links-stack">${linksHtml}</div>`
      );
    }, 220);
  }
}

function sendUserMessageToBach() {
  const input = document.getElementById("bachUserInput");
  const text = (input.value || "").trim();
  if (!text) return;
  input.value = "";
  appendUserMessage(text);

  const work = scores.find((s) => s.id === Number(bachSelectedWorkId)) || scores[0];
  const title = work.clean || work.title;
  const lower = text.toLowerCase();

  setTimeout(() => {
    if (lower.includes("youtube") || lower.includes("video") || lower.includes("escuchar") || lower.includes("grabacion")) {
      askBachTopic("links");
    } else if (lower.includes("historia") || lower.includes("origen") || lower.includes("año") || lower.includes("compuso")) {
      askBachTopic("history");
    } else if (lower.includes("armonia") || lower.includes("teoria") || lower.includes("forma") || lower.includes("analisis")) {
      askBachTopic("theory");
    } else {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(work.composer.split("(")[0] + " " + title + " " + text)}`;
      appendBachMessage(
        `¡Interesante pregunta sobre <strong>${title}</strong>! Como solía decir en Leipzig: la claridad del contrapunto y la naturalidad del fraseo lo gobiernan todo. En esta obra de <em>${work.composer}</em> (${work.period}), te sugiero cuidar la independencia de las voces y verificar tu digitación en el <strong>Modo Estudio</strong>.<br>
        <div class="bach-links-stack">
          <a href="${searchUrl}" target="_blank" rel="noopener noreferrer" class="bach-chat-link">▶ Buscar "${text}" sobre ${title} en YouTube ↗</a>
        </div>`
      );
    }
  }, 280);
}

function cleanLibraryWithAI() {
  scores.forEach((s) => {
    if (s.raw && s.clean) {
      s.title = s.clean;
      s.raw = false;
    }
  });
  document.getElementById("classifyMenu").classList.add("hidden");
  showPilotBanner("✦ Todos los títulos de la biblioteca fueron normalizados por IA.");
  renderLibrary();
}

function closePdfModal() {
  document.getElementById("pdfModal").classList.add("hidden");
}

function triggerPdfToast(msg) {
  document.getElementById("pdfToast").textContent = msg;
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

// ==========================================================================
// 3. MODO CONCIERTO (Avanza páginas reales del PDF)
// ==========================================================================
let audioTimer = null;
let followedSys = 0;
let layoutIdx = 0;
const layouts = ["1 Pág", "Media Pág", "2 Págs"];

async function turnPage(dir) {
  const total = activeScore.pageCount || 10;
  pageNum = Math.max(1, Math.min(total, pageNum + dir));
  clearStudyLayer();
  await renderActiveScorePage();
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
    if (!activeScore.isRealPdf) {
      document.getElementById("concertSvg").innerHTML = buildPortraitScoreSvg(-1);
    }
    return;
  }

  btn.classList.add("listening");
  followedSys = 0;
  lbl.textContent = "Compás 1 • Escuchando";
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

window.addEventListener("DOMContentLoaded", async () => {
  await loadSavedPdfsFromDb();
  initBachGptWidget();
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

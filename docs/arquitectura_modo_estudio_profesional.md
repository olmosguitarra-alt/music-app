# ARQUITECTURA TÉCNICA Y UI: MODO ESTUDIO PROFESIONAL (CADENZA)

Propuesta integral para convertir el Modo Estudio de Cadenza en una estación de trabajo musical de nivel profesional (comparable a Samsung Notes, forScore y aplicaciones dedicadas de afinación/metrónomo).

---

## 1. TRAZO DIGITAL Y PRESIÓN ESTILO SAMSUNG NOTES (Pointer Events API)

Para lograr trazo suave con grosor variable según la fuerza del stylus (S-Pen, USI Pen de la TCL o lápiz capacitivo activo):

### Tecnología Base: Web Pointer Events API + Algoritmo de Bézier Dinámico
- En lugar de escuchar eventos `touchstart` / `touchmove`, se utiliza la API moderna `pointerdown`, `pointermove`, `pointerup`.
- **Detección de Presión Real:** La propiedad `event.pressure` entrega un valor decimal continuo entre `0.0` y `1.0`.
- **Cálculo de Ancho Dinámico:**
  $$\text{Ancho} = \text{AnchoBase} \times (0.3 + 1.4 \times \text{pressure})$$
- **Suavizado de Curvas (Bézier Catmull-Rom):** Para evitar líneas poligonales o temblorosas, los puntos registrados se interpolan mediante curvas Bézier cuadráticas/cúbicas en tiempo real.
- **Rechazo de Palma (Palm Rejection):**
  - Filtrar eventos por `event.pointerType === 'pen'`.
  - Si el lápiz está cerca de la pantalla, los eventos `event.pointerType === 'touch'` se ignoran para que el músico pueda apoyar la mano naturalmente sobre la partitura sin pintar manchas accidentales.

---

## 2. CONVERSIÓN DE TRAZO LIBRE A LETRA DE MOLDE DIGITAL (100% EFECTIVIDAD)

El reconocimiento de escritura a mano alzada (Handwriting OCR) con 100% de efectividad en clientes locales se resuelve mediante un **enfoque híbrido asistido (Smart Ink + Quick Tap)**:

### Arquitectura de 100% Efectividad:
1. **API Nativa en Android / Windows:**
   - En Android y tablets con soporte de lápiz, los navegadores modernos y webviews exponen la API `VirtualKeyboard` y la entrada `contenteditable` con reconocimiento de tinta nativo del sistema operativo (Google Handwriting / Gboard Ink), el cual tiene una precisión superior al 98%.
2. **El "Toque de Conversión Inmediata" (Cero Frustración):**
   - El músico escribe a mano sobre la partitura (ej: *"Ritardando compás 24"* o *"mf"*).
   - El trazo se envuelve automáticamente en un recuadro de selección sutil con un icono de varita mágica o botón flotante `[ T ]`.
   - Al tocarlo (o con doble toque del stylus), el motor convierte la tinta en una caja de texto digital tipográfico con tipografía editorial sobria de partitura.
   - Si una palabra tuviera duda, un menú flotante de 1 toque muestra las 2 opciones más probables, garantizando el 100% de certeza sin borrar ni empezar de nuevo.

---

## 3. BIBLIOTECA DE MARCAS MUSICALES PREDETERMINADAS POR INSTRUMENTO

Un músico no debería dibujar a mano un calderón o un arco si puede estamparlo con precisión de imprenta.

### Sistema de Estampado Táctil ("Stamps"):
En la barra lateral se añade un cajón desplegable clasificado por familias:
- **Universal:** Dinámicas ($pp$, $p$, $mp$, $mf$, $f$, $ff$, crescendo, diminuendo), calderón, acentos, staccato, tenuto, coda, segno.
- **Cuerdas (Violín, Cello, etc.):** Arco arriba ($\vee$), arco abajo ($\sqcap$), digitaciones (0, 1, 2, 3, 4), cambio de posición, armónicos, pizzicato.
- **Piano:** Pedal (pisar, cambio, soltar), mano izquierda ($m.s.$), mano derecha ($m.d.$), digitaciones 1 al 5.
- **Vientos / Canto:** Marcas de respiración (', //), digitaciones auxiliares, sordina.

**Interacción:**
1. Toca la marca en la barra lateral.
2. Toca el compás exacto en la partitura.
3. La marca se estampa alineada magnéticamente al compás (con control táctil para escalar o rotar si es necesario).

---

## 4. METRÓNOMO PROFESIONAL, ELEGANTE Y VISUAL

Para que sea verdaderamente profesional, no puede depender de `setInterval` en JavaScript (que se desincroniza cuando el navegador procesa otras cosas).

### Motor de Audio y Precisión:
- **Web Audio API (`AudioContext.currentTime`):** Programación con lookahead scheduler de alta precisión (cero retraso, cero desfasaje de compás).
- **Sonidos Editables de Estudio:** Madera noble (Woodblock), Tic mecánico clásico, Pincelada digital suave, Clic electrónico sutil.

### Interfaz Visual Elegante (No invasiva):
- Se integra en una **barra superior delgada o pestaña flotante retráctil**:
  - Pantalla táctil grande con BPM (ej: `120`).
  - Botón de **TAP TEMPO** táctil amplio (para calcular el pulso tocando con el dedo).
  - Selector de compás ($2/4$, $3/4$, $4/4$, $6/8$, etc.) con subdivisión rítmica (corcheas, tresillos).
  - **Péndulo / Luz de Pulso Periférica:** Un destello de luz suave y discreto en la parte superior para marcar el compás sin sonido durante un ensayo.

---

## 5. AFINADOR CROMÁTICO PROFESIONAL EN TIEMPO REAL

Diseñado con la misma exactitud que aplicaciones dedicadas como *TonalEnergy* o *Boss Tuner*:

### Motor de Detección de Tono:
- **Captura vía Micrófono:** `navigator.mediaDevices.getUserMedia({ audio: true })`.
- **Algoritmo de Detección de Frecuencia Fundamental:** Algoritmo **YIN** o autocorrelación en tiempo real sobre `AnalyserNode` de la Web Audio API (muy superior a una simple FFT, capaz de distinguir la nota fundamental en instrumentos con muchos armónicos como la guitarra o el violonchelo).
- **Calibración de Frecuencia Base:** Ajuste de $A_4$ ($440\text{ Hz}$ estándar, $442\text{ Hz}$ para orquestas europeas, $415\text{ Hz}$ para barroco).

### Interfaz UI:
- Visualizador semicircular estilo aguja minimalista de alta precisión:
  - Gran letra central de la nota (ej: **C#4**).
  - Indicador de desviación en Cents ($\pm 50$ cents).
  - La aguja se tiñe de color dorado/verde suave cuando la nota está perfectamente afinada ($\pm 2$ cents).
- Modo de escucha discreta: funciona en segundo plano sin bloquear la vista de la partitura.

---

## 6. INTEGRACIÓN INTEGRAL EN LA UI DEL MODO ESTUDIO

Para no saturar la pantalla de 14" de la tablet, todo se organiza en **tres zonas ergonómicas**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [← Biblio]  Chopin Op. 9 No. 2   [ Metrónomo: 120 BPM ▾ ] [ 🎚 Afinador ] [🎭 Concierto]│
├────────┬───────────────────────────────────────────────────────────────┤
│ 🖊 Trazo│                                                               │
│ ✒ Pluma│                                                               │
│ 🧹 Goma │                                                               │
│ 🔤 Texto│                      PARTITURA ACTIVA                         │
│ 🏷 Sellos│                  (Área de dibujo libre                       │
│    ▾   │               con rechazo de palma activo)                    │
│ 🎨 Colores│                                                               │
│        │                                                               │
│ ────── │                                                               │
│ 🤖 Bach│                                                               │
├────────┴───────────────────────────────────────────────────────────────┤
│ ‹ Pág 1 / 4 ›       [════════════●════════════]               Folio 1  │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Barra Superior (Herramientas de Músico):**
   - Acceso rápido a Metrónomo y Afinador en pestañas desplegables flotantes que no tapan la música.
   - Botón directo para pasar a `[ 🎭 Concierto ]` (donde todo esto se oculta instantáneamente).
2. **Barra Lateral Izquierda (Paleta de Herramientas de Escritura):**
   - Selector Lápiz/Pluma (con presión activa).
   - Sellos instrumentales organizados por acordéon.
   - Herramienta de conversión a letra de molde.
   - Llamada a BachGPT para análisis musical.
3. **Área Central:**
   - La partitura pura con las capas de dibujo digital integradas de forma transparente.

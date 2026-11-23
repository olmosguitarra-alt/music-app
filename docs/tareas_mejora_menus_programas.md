# PLAN DE MEJORA: VISTA DE PROGRAMAS (SETLISTS) - CADENZA

Tareas concretas y priorizadas para pulir la experiencia de usuario tanto en tabletas (TCL 14" / iPads) como en teléfonos móviles.

---

## 📱 PARTE 1: MEJORAS PARA TELÉFONO (PANTALLA MÓVIL)

El objetivo en móvil es **operabilidad con una sola mano (zona del pulgar)** y evitar que los elementos colapsados se sientan apretados.

### Tarea M1: Desacoplar el Botón de Volver del Cinto Superior
- **Problema actual:** El botón de retroceso (`prog-slide-back-btn`) y el selector de programas comparten una franja muy estrecha (`height: 38px`), lo que provoca toques accidentales.
- **Acción:**
  - Separar el botón de retroceso dejándolo en una barra de cabecera limpia arriba.
  - El selector de programas debe ocupar el ancho completo debajo, con altura táctil mínima de 44px (estándar ergonómico táctil).

### Tarea M2: Carrusel Deslizable de Píldoras (Horizontal Pill Tabs)
- **Problema actual:** El selector desplegable actual (`#btnMobileProgListToggle`) oculta los nombres de los otros programas.
- **Acción:**
  - Reemplazar el menú desplegable por un carrusel horizontal táctil de píldoras: `[ Chopin Op.9 ]` `[ Gala Navidad ]` `[ Ensayos ]` `[ ＋ ]`.
  - El músico desliza con el pulgar y selecciona el concierto activo con un solo toque visual.

### Tarea M3: Reemplazar el Buscador Incrustado por un "Bottom Sheet" (Hoja Inferior)
- **Problema actual:** Al tocar `progScoreSearchInput`, el teclado virtual de Android sube y tapa la lista de partituras y sugerencias.
- **Acción:**
  - En móvil, ocultar el buscador fijo.
  - Colocar un botón flotante abajo a la derecha: `[ ＋ Agregar obra ]`.
  - Al pulsar, despliega un *Bottom Sheet* modal que sube hasta media pantalla con su propio buscador y lista táctil amplia de partituras para añadir.

### Tarea M4: Botón de "Iniciar Concierto" Fijo en la Base
- **Problema actual:** El botón de guardar/lanzar queda al final del scroll de obras (`setlist-foot`).
- **Acción:**
  - Fijar una barra inferior adhesiva (*sticky bottom bar*) con el botón principal `[ Iniciar Concierto / Tocar ]`, siempre visible sin importar cuántas canciones tenga el setlist.

---

## 💻 PARTE 2: MEJORAS PARA TABLET (PANTALLA GRANDE / TCL 14")

El objetivo en tablet es **velocidad de gestión de repertorio, reordenamiento fluido y datos útiles de un vistazo**.

### Tarea T1: Reordenamiento Táctil de Obras con Manija Visual (Drag Handle)
- **Problema actual:** Mover obras arriba/abajo en la lista requiere precisión innecesaria.
- **Acción:**
  - Añadir a la izquierda de cada obra un icono sutil de 6 puntos o líneas (`≡` / `⋮⋮`).
  - Implementar arrastre táctil nativo fluido (HTML5 Drag & Drop / touch events) para subir y bajar piezas de orden en menos de 1 segundo.

### Tarea T2: Métricas Rápidas del Setlist (Duración Estimada y Conteo)
- **Problema actual:** Solo dice `Obras: N`. Los músicos y directores necesitan calcular tiempos de bloque.
- **Acción:**
  - En la cabecera del panel derecho (`setlist-summary-row`), mostrar un resumen visual limpio:
    * `4 Obras` · `14 Páginas totales` · `~18 min est.`
  - Si una obra no tiene duración configurada, se calcula un estimado base o se permite editarla rápidamente.

### Tarea T3: Menú Rápido Contextual por Obra (Tres Puntos `⋯`)
- **Problema actual:** Si quieres quitar una obra del programa o ver sus notas, no hay opciones directas limpias.
- **Acción:**
  - Añadir un botón discreto de opciones `⋯` al final de cada fila de obra con opciones rápidas:
    * `⬆ Subir` / `⬇ Bajar`
    * `📝 Nota para esta pieza` (ej: "Repetir compás 32", "Sin preludio").
    * `🗑 Quitar del programa`.

### Tarea T4: Vista Previa Rápida en Tarjeta Flotante (Hover / Long-Press)
- **Problema actual:** Para ver qué contiene una partitura del programa hay que salir al modo visor.
- **Acción:**
  - Aprovechando las 14" de la tablet, al mantener presionada una obra de la lista (o tocar su miniatura), mostrar una vista previa flotante de la portada / página 1 sin salir de la vista de Programas.

---

## 🎯 RESUMEN DE PRIORIDADES DE EJECUCIÓN

1. **Prioridad 1 (Ergonomía Móvil):** Tareas M1 y M2 (Separar retroceso y carrusel de programas).
2. **Prioridad 2 (Funcionalidad Viva en Tablet):** Tarea T1 (Arrastre táctil de obras en el programa).
3. **Prioridad 3 (Teclado en Móvil):** Tarea M3 (Agregar obras vía Bottom Sheet para no romper el layout con el teclado).
4. **Prioridad 4 (Información Musical):** Tareas T2 y T3 (Tiempos estimados y notas por pieza).

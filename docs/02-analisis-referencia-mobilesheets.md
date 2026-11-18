# Análisis de Referencia: MobileSheets en TCL NXTPAPER 14

Este documento analiza las 12 capturas de pantalla reales tomadas por Daniel Olmos usando **MobileSheets** en su tablet **TCL NXTPAPER 14**, identificando qué elementos son valiosos para conservar y cuáles representan fricción visual o de uso que nuestra aplicación debe resolver.

Las capturas originales se encuentran en [`docs/referencias/mobilesheets/`](./referencias/mobilesheets/).

---

## 1. Vista de Biblioteca, Pestañas y Filtros
*(Capturas: `media_..._75fcb11d.png`, `a553b0a0.png`, `48e3e87c.png`, `1c02708e.png`, `feda146a.png`)*

### Lo que hace bien MobileSheets:
- Permite organizar cientos de obras (ej. 685 partituras en la biblioteca de Daniel) y agruparlas en **Setlists** (ej. *"Bach Programa"*, *"Duo Toño"*, *"Programa Manuel Hernández"*).
- Cuenta con índice alfabético lateral rápido (`#`, `A`, `B`, `C`...) para saltar en bibliotecas grandes.

### Problemas detectados ("Diseño burdo o tosco"):
1. **Sobrecarga de barras superiores**: Hay 4 niveles apilados arriba:
   - Barra azul de acciones (`ORDEN: A-Z`, `+ NUEVO`, `IMPORTAR`).
   - Barra de 7 pestañas (`Reciente`, `Canciones`, `Setlists`, `Colecciones`, `Artistas`, `Álbumes`, `Géneros`), donde varias pestañas quedan completamente vacías (`Colecciones (0)`, `Artistas (0)`, `Álbumes (0)`) porque el músico no tiene tiempo de llenar tantos metadatos al importar un PDF.
   - Dos filas completas de filtros desplegables (`Buscar`, `Origen`, `Tonalidad`, `Colección`, `Dif`, `Género`, `Clasificación`) que están **siempre visibles** ocupando casi un cuarto de la pantalla aunque estén en `"Cualquiera"`.
2. **Lista plana sin contexto visual**: Las obras aparecen como renglones grises y blancos con el nombre crudo del archivo PDF (`0000040517`, `01`, `! Brouwer, Leo - From testerdayu to Peny Lane`). No hay miniaturas de la primera página, ni distinción visual rápida entre una obra suelta, una sonata completa o un programa de concierto.

### Cómo lo mejoraremos en nuestra App:
- **Búsqueda universal limpia + Filtros ocultables (Chips inteligentes)**: Una sola barra de búsqueda elegante que busque por compositor, obra, instrumento o etiqueta, mostrando filtros avanzados solo cuando se necesiten.
- **Limpieza automática de nombres e importación asistida**: Al importar un PDF como `(Partition, Sheet Music) - Bach - Partitura Suite Inglesa Nº 2 Bwv 807`, sugerir automáticamente:
  - **Compositor**: J. S. Bach
  - **Obra**: Suite Inglesa Nº 2, BWV 807
- **Vista mixta (Tarjetas con miniatura de la partitura o Lista compacta limpia)**: Aprovechar las 14 pulgadas para mostrar una vista previa real de la portada/primera página junto con los datos clave.

---

## 2. Edición de Metadatos de una Obra
*(Captura: `media_..._e2a6970b.png` — Editando: Bach BWV 1034 Sonate Flute Russel)*

### Problemas detectados:
- Presenta un formulario vertical interminable de líneas grises (`Título`, `ID de Canción`, `Clasificación`, `Setlists`, `Colecciones`, `Tonalidades`, `Artistas`, `Compositores`, `Géneros`, `Álbumes`...) que ocupa toda la pantalla y recuerda a una base de datos antigua.
- Obliga a salir de la partitura a una pantalla negra/gris desconectada del documento musical.

### Cómo lo mejoraremos en nuestra App:
- **Panel lateral o flotante contextual**: Editar título, compositor, afinación (ej. *6ª en Re*) y programa de concierto directamente en un panel limpio sin perder de vista la partitura.
- **Campos pensados para músicos reales**: Priorizar *Compositor*, *Obra / Movimiento*, *Arreglista / Transcriptor* (ej. David Russell), *Afinación / Instrumentación* y *Programas de concierto (Setlists)*, ocultando campos irrelevantes como "ID de Canción: 0" o "Álbumes".

---

## 3. Lector de Partitura a Dos Páginas y Modos de Visualización
*(Capturas: `media_..._0ca34b10.jpg`, `65ef48bd.jpg`, `9c790510.jpg`, `7b50e28d.jpg`)*

### Lo que funciona muy bien en la TCL NXTPAPER 14:
- **Vista a dos páginas apaisada (horizontal)**: Muestra páginas contiguas a tamaño casi real, fundamental para reducir cambios de página a mitad de un movimiento.
- **Tono de color Sepia**: Muy descansado para la vista durante horas de estudio y excelente en combinación con la pantalla mate de la TCL NXTPAPER 14.
- **Recorte de márgenes y mejora de imagen**: Funciones esenciales cuando se trabaja con PDFs escaneados de ediciones antiguas.

### Problemas detectados:
- **Ventanas modales que tapan la partitura**: Al abrir *"Seleccione el modo de visualización"* o *"Seleccione el modo de escalado"*, aparece un cuadro gris gigante justo en el centro que tapa ambas páginas, y encima con casillas técnicas confusas (*"Usar modo de visualización predeterminado para la canción"* vs *"Ajustes Globales"*).
- **Barra inferior saturada**: Hasta 11 íconos pequeños repartidos abajo más una barra deslizadora flotante (`Página: 27 / 307`) que se superpone sobre el final de la partitura.

### Cómo lo mejoraremos en nuestra App:
- **Controles tipo "Popover" translúcidos y en los bordes**: Si ajustas el zoom, el recorte de márgenes o el tono de papel (Blanco, Crema, Sepia, Nocturno), ves el cambio en vivo sobre la partitura sin que una ventana gris te tape las notas.
- **Modo Escenario / Concierto (Bloqueo de distracciones)**: Un interruptor rápido que oculta todas las barras y bloquea toques accidentales de menús, dejando el 100% de las 14 pulgadas exclusivamente para la música.

---

## 4. Herramientas de Anotación y Escritura sobre la Partitura
*(Capturas: `media_..._d53b0743.jpg`, `bacab3af.jpg`)*

### Problemas detectados:
1. **Barra superior con 24 íconos en fila**: En modo anotación aparecen 24 íconos diminutos seguidos en la parte superior (`X`, guardar, deshacer, rehacer, estrella, mover, pluma, resaltador, texto, sello, borrador, línea, cursor, capas, regla, `<`, `>`, clave, tijeras, cuadrícula, play, metrónomo, descargar, papelera, engrane). En un ensayo con el instrumento en las manos, atinarle al ícono correcto es lento y propenso a errores.
2. **Rueda flotante gigante y círculo verde en medio del pentagrama**: La paleta circular (`Bolígrafo`, `Resaltador`, `Texto`, `Sello`, `Favoritas`, `Eraser`, `Otras herramientas`) es grande, visualmente pesada y deja un botón circular flotante encima de los compases (como se ve sobre el compás 3-4 en `bacab3af.jpg`).

### Cómo lo mejoraremos en nuestra App:
- **Paleta de anotación minimalista y musical**:
  - Agrupar las herramientas en **3 o 4 accesos claros**: *Lápiz/Pluma* (para trazos libres y digitaciones rápidas), *Marcador/Resaltador*, *Símbolos Musicales / Digitaciones* (cejas `I..XII`, `p i m a`, `0 1 2 3 4`, arcos, dinámicas, respiraciones) y *Borrador*.
  - Permitir **escritura directa con Stylus (lápiz óptico)** sin siquiera entrar a un "modo edición" lleno de íconos: si el lápiz toca la pantalla, escribe; si el dedo toca el borde, pasa la página.
- **Capas de anotación simples**: Poder tener una capa de *"Estudio / Digitaciones detalladas"* y otra de *"Concierto (solo alertas limpias)"* con un toque.

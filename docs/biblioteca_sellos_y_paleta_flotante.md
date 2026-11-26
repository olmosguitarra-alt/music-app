# BIBLIOTECA COMPLETA DE ANOTACIONES MUSICALES Y DISEÑO DE PALETA FLOTANTE (CADENZA)

Propuesta integral de catálogo musical especializado y diseño UX/UI para la **Paleta Flotante Reubicable de Sellos Musicales** de Cadenza (`prototype/index.html`, `prototype/styles.css`, `prototype/app.js`).

---

## 🎼 1. CATÁLOGO COMPLETO DE SELLOS Y MARCAS ESPECIALIZADAS

El catálogo se estructura en 5 categorías esenciales, abarcando agógica, dinámicas, articulación y técnicas instrumentales de orquesta y guitarra clásica:

### Categoría 1: Dinámicas y Expresión
- **Niveles de Intensidad:** $ppp$, $pp$, $p$, $mp$, $mf$, $f$, $ff$, $fff$, $sfz$, $sfp$, $rfz$, $fp$.
- **Reguladores (Horquillas):** Crescendo ($<$) y Diminuendo ($>$).
- **Expresión y Carácter:** *dolce*, *espress.*, *cantabile*, *legato*, *pesante*, *leggiero*, *marcato*, *misterioso*, *sotto voce*, *subito*.

### Categoría 2: Agógica y Tempo
- **Modificaciones de Pulso:** *rit.* (ritardando), *rall.* (rallentando), *accel.* (accelerando), *a tempo*, *meno mosso*, *più mosso*, *rubato*, *ad lib.*
- **Pausas y Cortes:** Calderón sobre nota ($\curvearrowleft \hspace{-0.7em} \cdot$), Calderón sobre compás/pausa larga, Cesura / Corte seco (//), Respiración musical ($’$).
- **Estructura:** Segno ($\S$), Coda ($\bigoplus$), Da Capo ($D.C.$), Dal Segno ($D.S.$), Fine.

### Categoría 3: Articulación y Acentos
- Staccato ($\cdot$), Staccatissimo ($\blacktriangledown$), Tenuto ($-$), Portato / Tenuto con punto ($\underline{\cdot}$).
- Acento normal ($>$), Acento martellato ($\wedge$), Trino ($tr\sim\sim$), Mordente superior, Mordente inferior, Grupeto ($S$), Glissando ($gliss.$).

### Categoría 4: Digitaciones y Técnicas por Familia Instrumental

#### A. Cuerdas Frotadas (Violín, Viola, Cello, Contrabajo):
- **Arcos:** Arco abajo / Tirar ($\sqcap$), Arco arriba / Empujar ($\vee$).
- **Digitaciones de Mano Izquierda:** Números `0` (cuerda al aire), `1`, `2`, `3`, `4`.
- **Posiciones:** I Pos., II Pos., III Pos., IV Pos., V Pos.
- **Efectos:** *pizz.*, *arco*, *con sordina*, *senza sordina*, *col legno*, *sul ponticello*, *sul tasto*, Armónico natural ($\diamond$), Armónico artificial.
- **Cuerdas:** I (Mi), II (La), III (Re), IV (Sol).

#### B. Guitarra Clásica:
- **Mano Derecha (Pulsación):** Letras minúsculas clásicas: $p$ (pulgar), $i$ (índice), $m$ (medio), $a$ (anular), $e$ (meñique).
- **Mano Izquierda:** Números de pisada: `1`, `2`, `3`, `4`, `0` (al aire).
- **Cejillas:** C.I, C.II, C.III, C.IV, C.V, C.VII, C.IX (y media cejilla $\frac{1}{2}\text{C}$).
- **Cuerdas en círculo:** ①, ②, ③, ④, ⑤, ⑥.
- **Técnicas:** *apoyando*, *tirando*, *rasg.* (rasgueo), *tambor*, *golpe*, *campanella*, *tasto*, *ponticello*, Armónico (Harm. 12, Harm. 7, Harm. 5).

#### C. Piano / Teclado:
- **Pedales:** Pisar pedal damper ($\mathfrak{Ped.}$), Cambio de pedal ($\wedge$), Soltar pedal ($\ast$), Una corda (*u.c.*), Tre corde (*t.c.*), Sostenuto (*sost.*).
- **Manos:** *m.d.* (mano derecha), *m.s.* (mano izquierda), *m.g.* (main gauche).
- **Digitaciones:** `1`, `2`, `3`, `4`, `5`.

#### D. Vientos (Maderas y Metales):
- **Respiraciones:** Coma de respiración ($’$), respiración circular ($O$), sin respirar (*n.r.*).
- **Articulaciones de Lengua:** Doble golpe (*T-K*), triple golpe (*T-K-T*), Frullato (*frull.*).
- **Sordinas:** Abierta ($+$), cerrada ($\circ$), *con sord.*, *senza sord.*

---

## 🎨 2. DISEÑO UI: PALETA FLOTANTE REUBICABLE (INSPECTOR DE SELLOS)

### Filosofía Visual (Línea Editorial Cadenza):
- **Ultraligera y Flotante:** Una ventana translúcida compacta (`backdrop-filter: blur(14px)`), esquinas suaves (`border-radius: 14px`), marco tenue de 1px (`var(--glass-border)`).
- **Cero Estorbo:** Diseñada para ubicarse en los laterales o zonas muertas del folio y ser arrastrada con un solo dedo hacia cualquier esquina.
- **Tamaño de Huella:** Ancho optimizado de 240px a 260px, altura máxima de 320px con scroll interior sedoso.

---

### Estructura de la Paleta Flotante:

```
┌────────────────────────────────────────────────────────┐
│  ⋮⋮ Sellos Musicales               [ 🎨 ▾ ]  [ ✕ ]     │ <- Barra de arrastre superior
├────────────────────────────────────────────────────────┤
│  [ Dpto ]  [ Agógica ]  [ Cuerdas ]  [ Guitar ]  [ Piano ]  │ <- Selector horizontal deslizable
├────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │  p   │ │  mp  │ │  mf  │ │  f   │ │  ff  │          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ sfz  │ │  <   │ │  >   │ │dolce │ │ rit. │          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │  ⨅   │ │  ⋁   │ │  𝄐   │ │  //  │ │  ’   │          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
├────────────────────────────────────────────────────────┤
│  Color: [⚫ Grafito] [🔵 Prusia] [🔴 Carmín] [🟡 Ámbar]  │ <- Selector rápido de tinta
└────────────────────────────────────────────────────────┘
```

### Componentes Clave de UX:

1. **Cabecera de Arrastre (Drag Handle `⋮⋮`):**
   - El usuario toca y arrastra desde la franja superior (`cursor: move; touch-action: none;`).
   - Se mueve fluidamente con el dedo por cualquier parte del lienzo sin retraso.
   - Botón discreto de cierre `[ ✕ ]` en la esquina superior derecha.

2. **Pestañas de Categoría con Píldoras Horizontales:**
   - Carrusel táctil superior con 5 categorías:
     `[ Dinámicas ]` `[ Agógica ]` `[ Cuerdas ]` `[ Guitarra ]` `[ Piano ]` `[ Vientos ]`.
   - Transición instantánea entre familias sin recargar la paleta.

3. **Matriz de Sellos Táctiles (Grid de 5 Columnas):**
   - Miniaturas nítidas vectoriales SVG o tipográficas musicales (`Bravura` / `Petaluma` / serif musical).
   - Área táctil de cada celda: $40\text{px} \times 40\text{px}$ (ergonomía táctil para stylus o pulgar).
   - Efecto visual sutil de relieve/hundimiento al tocar.

4. **Flujo de Estampado Continuo ("Multi-Stamp Mode"):**
   - Al tocar un sello (ej: arco abajo $\sqcap$ o dinámica $p$), queda seleccionado e iluminado suavemente.
   - El músico toca en los compases de la partitura y va estampando el símbolo con precisión de imprenta.
   - Un toque en la partitura con dos dedos o tocar la `✕` desactiva el modo de estampado.

5. **Selector Rápido de Color de Tinta (Footer Compacto):**
   - 4 gotas de color elegantes en la base de la paleta:
     * Negro Grafito clásico (`#201c19`)
     * Azul Prusia de ensayo (`#23426e`)
     * Carmín de anotación / corrección (`#8c2f27`)
     * Oro viejo / Ámbar (`#b8860b`)
   - El sello se estampa directamente en el color seleccionado.

---

## 💻 3. ESPECIFICACIÓN TÉCNICA PARA IMPLEMENTACIÓN
- **Contenedor:** `#stampPopover.floating-stamps-palette`
- **Movimiento Libre:** Escuchar `pointerdown`, `pointermove`, `pointerup` sobre la cabecera `.stamp-palette-header` guardando la posición en `transform: translate3d(x, y, 0);`.
- **Inyección en Lienzo:** Al tocar en el folio, inyectar el sello como un objeto vectorial SVG en `#performerMoldLayer` o en la capa de anotaciones vectoriales con soporte para arrastre y borrado individual.

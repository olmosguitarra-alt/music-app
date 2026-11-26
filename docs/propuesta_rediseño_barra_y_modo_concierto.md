# PROPUESTA DE REDISEÑO: LA BARRA INFERIOR MONOLÍTICA Y LA EXPERIENCIA MODO CONCIERTO (CADENZA)

---

## 🎨 PARTE 1: REDISEÑO DE LA BARRA INFERIOR (MODO ENSAYO)
### "La Cápsula Monolítica Flotante" (Island HUD)

### Por qué el diseño actual no convence:
Tener tres islas flotando por separado (un dock a la izquierda, una barra al centro y un botón redondo a la derecha) se siente fragmentado, desarticulado y con huecos asimétricos que rompen la elegancia editorial de Cadenza.

### La Solución Estética: La Cápsula Unificada de Cristal (Single Capsule Island)
En lugar de 3 elementos sueltos, fundimos todo en **una sola pastilla flotante central y armónica** (estilo *Dynamic Island* / dock de alta gama de iPadOS), con cristal esmerilado suave:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│                                    PARTITURA LIMPIA                                    │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│           ┌────────────────────────────────────────────────────────────────┐           │
│           │ [ 📚  🎼  ✏️ ]  │  ‹  Pág. 1 / 10  ════●════  10  ›  │  [ 🤖 ] │           │
│           └────────────────────────────────────────────────────────────────┘           │
│                             (Cápsula Monolítica Centrada)                              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Anatomía de la Cápsula Unificada:
- **Un solo contenedor elegante:** `height: 38px`, bordes curvos suaves (`border-radius: 20px`), fondo translúcido profundo (`backdrop-filter: blur(20px)`), línea de luz tenue de 1px (`var(--glass-border)`).
- **Sub-bloque Izquierdo (Modos):** Los 3 iconos de modos en un espacio compacto sin bordes toscos.
- **Divisor sutil:** Una línea vertical tenue de 1px que separa sin romper.
- **Sub-bloque Central (Scrubber de Partitura):** Flechas `‹` `›`, número actual y una línea de progreso mínima y pura (un slider ultrafino de 2px con perla dorada).
- **Divisor sutil:** Otra línea vertical de 1px.
- **Sub-bloque Derecho (BachGPT):** El rostro pixel art o icono minimalista de BachGPT integrado al ras de la pastilla.
- **Resultado Visual:** Cero ruido, simetría perfecta, centrada en el atril, deja los dos costados libres para apoyar las manos en la tableta.

---

## 🎭 PARTE 2: REDISEÑO COMPLETO DEL MODO CONCIERTO (ZEN STAGE)

El Modo Concierto no es una pantalla distinta: es **la misma partitura que estuviste estudiando, pero en su estado de máxima inmersión para el escenario**.

### Los 4 Pilares del Modo Concierto de Alta Gama:

#### 1. Inmersión Total "Zero-Chrome" (Pantalla 100% Viva):
- Al pasar el switch a **`[ 🎭 Concierto ]`**:
  - La barra superior y la cápsula inferior se desvanecen suavemente (`transition: opacity 0.3s ease`).
  - La partitura ocupa el **100% de la pantalla** sin bordes muertos ni distracciones.
  - Las anotaciones y marcas hechas en Modo Ensayo permanecen **exactamente en su lugar**, pero la capa de dibujo se bloquea contra toques accidentales.

#### 2. Barra de Navegación "Fantasma" / Al Toque (HUD de Emergencia):
- Durante la presentación en vivo, el escenario está oscuro o con luces de atril.
- Si el músico toca suavemente el centro de la partitura (o hace un gesto hacia arriba desde la base):
  - Emerge sutilmente la **Cápsula Monolítica** en un tono translúcido oscuro con un botón mínimo:
    `[ ✏️ Volver a Ensayo ]` y el salto rápido de páginas.
  - Si no se toca en 3.5 segundos, **se vuelve a desvanecer sola**, sin estorbar la vista.

#### 3. Zonas Táctiles de Paso de Página Invisible y Seguro:
- **Lateral Derecho (65% de la pantalla):** Cualquier toque con la mano o atril avanza a la siguiente página.
- **Lateral Izquierdo (25% de la pantalla):** Regresa a la página anterior.
- **Micro-indicador de Página:** Un número flotante sutil y translúcido en una esquina (`1 / 8`) que solo brilla 1 segundo al pasar de página y luego desaparece.

#### 4. Soporte "Doble Folio" (2 Páginas en Horizontal):
- Si la tablet TCL de 14" está en posición horizontal (landscape), el Modo Concierto abre las páginas en par: **Pág. 1 y Pág. 2 lado a lado** con encuadernación central sutil, permitiendo al músico anticipar la lectura del siguiente compás sin dar vuelta a la hoja a ciegas.

---

## 📋 Comparativa Visual: Ensayo vs Concierto

| Característica | Modo Ensayo (Atril de Estudio) | Modo Concierto (Escenario en Vivo) |
| :--- | :--- | :--- |
| **Cabecera** | Herramientas, Afinador, Metrónomo | Invisible (100% oculta) |
| **Barra Inferior** | Cápsula Monolítica visible (Modos + Scrubber + Bach) | Oculta (aparece solo con un toque y se auto-desvanece) |
| **Trazos / Lápiz** | Activo con pluma, goma, sellos y texto | Bloqueado (protegido contra rayones involuntarios) |
| **Anotaciones** | Visibles y editables | Visibles para lectura, intactas |
| **Gesto Principal** | Anotar, afinar, estudiar compases | Tocar cualquier punto lateral para pasar de hoja |

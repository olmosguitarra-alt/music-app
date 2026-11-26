# ARQUITECTURA TÉCNICA: MOTOR DE ZOOM TÁCTIL (PINCH-TO-ZOOM) Y SISTEMA DE COORDENADAS NORMALIZADAS (CADENZA)

Solución de ingeniería matemática y UX para implementar zoom a dos dedos (Pinch-to-zoom), paneo libre (Pan) y **proporcionalidad matemática perfecta (100% fija)** de todos los trazos, sellos y textos sobre el PDF.

---

## 1. EL SECRETO TÉCNICO: EL SISTEMA DE COORDENADAS NORMALIZADO (0.0 a 1.0)

### El Error Común:
Si guardas un trazo o un texto en píxeles de pantalla ($x: 450\text{px}, y: 320\text{px}$), al hacer zoom a $2\times$ o rotar la tablet, el PDF crece pero los píxeles de pantalla se quedan fijos, provocando que las anotaciones "floten" o se desalineen del pentagrama.

### La Solución de Grado Profesional (Espacio Documento):
Todas las anotaciones (trazos del lápiz, notas de molde y sellos) deben registrarse y almacenarse internamente respecto al **tamaño nativo del PDF (`viewBox` o dimensiones en puntos del PDF)**:

$$\text{PuntoNormalizado} = \left( \frac{x_{\text{pantalla}} - \text{desplazamiento}_X}{\text{anchoPDF} \times \text{escala}}, \frac{y_{\text{pantalla}} - \text{desplazamiento}_Y}{\text{altoPDF} \times \text{escala}} \right)$$

De este modo:
1. Una digitación sobre el compás 12 tiene coordenadas relativas fijas (ej. $x = 0.4215, y = 0.1830$).
2. No importa si el usuario hace zoom al $50\%$, al $200\%$ o al $400\%$: **la anotación está anclada matemáticamente a la tinta del PDF**.

---

## 2. GESTOS A DOS DEDOS (PINCH-TO-ZOOM Y PAN)

Para que el gesto a dos dedos conviva pacíficamente con la escritura con lápiz (stylus):

### Regla de Oro: Separación de Hardware (`PointerEvent.pointerType`)
- **Con 1 Stylus (`pointerType === 'pen'`):** Dibuja, escribe o estampa con sensibilidad a la presión.
- **Con 1 Dedo (`pointerType === 'touch'`):** Pasa de página o selecciona elementos (rechazo de palma activo mientras el stylus esté cerca).
- **Con 2 Dedos simultáneos (`pointerType === 'touch'`):** Se activa el **Modo Cámara (Transformación de Vista)**:
  - **Pinch (Pellizco):** Zoom In / Zoom Out continuo y fluido.
  - **Desplazamiento a dos dedos (Pan):** Arrastrar la vista para navegar por la partitura ampliada.

### Límites Ergonomicos:
- Escala mínima: $1.0\times$ (página completa encajada).
- Escala máxima: $3.5\times$ (suficiente para escribir digitaciones diminutas).
- **Doble Toque a dos dedos (Quick Reset):** Restaura instantáneamente la partitura a escala original $1.0\times$ y centrada.

---

## 3. ARQUITECTURA DE CAPAS (EL CONTENEDOR TRANSFORMABLE)

En lugar de recalcular y redibujar cada trazo individualmente en cada milisegundo de zoom (lo que haría que la tablet se caliente o vaya lenta), la solución es agrupar todo el folio en una **matriz CSS por aceleración de hardware**:

```
┌────────────────────────────────────────────────────────┐
│  #performerFolioViewport (Contenedor con overflow)     │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │  .folio-transform-layer                        │   │
│   │  (transform: translate3d(X, Y, 0) scale(S))   │   │
│   │                                                │   │
│   │   ├── 1. Canvas PDF (pdf.js render)            │   │
│   │   ├── 2. Canvas de Trazo Libre (draw-layer)    │   │
│   │   ├── 3. Capa de Texto Molde (#moldLayer)      │   │
│   │   └── 4. Capa de Sellos (#stampsLayer)         │   │
│   └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### ¿Por qué esta arquitectura es perfecta?
1. Al hacer zoom con dos dedos, **se escala el contenedor completo `.folio-transform-layer` al mismo tiempo**.
2. **Cero desfasaje:** El PDF, las plumas, los sellos y las notas tipográficas crecen y se mueven en perfecta sincronía porque están dentro del mismo contenedor acelerado por GPU (`transform-origin: 0 0;`).
3. **Nitidez Dinámica:** Al soltar los dedos y terminar el zoom, si la escala es mayor a $1.2\times$, `pdf.js` realiza un re-renderizado en segundo plano a la nueva resolución para que las notas del PDF se vean vectoriales y sin bordes pixelados.

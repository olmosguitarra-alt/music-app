# Visión y objetivos del producto

## Visión

Crear una aplicación musical para tablets Android y iPad que reúna lectura y organización de partituras, herramientas de estudio, asistencia musical con IA y edición de partituras.

La aplicación debe servir a músicos de distintos instrumentos, géneros y niveles. Debe ofrecer herramientas potentes en una interfaz clara, cuidada y fácil de usar.

## Modos principales

### 1. BachGPT

Asistente musical inspirado en Johann Sebastian Bach, disponible en texto y voz. Su voz tendrá un estilo germanizado.

BachGPT podrá ayudar con:

- Consultas sobre teoría, historia, técnica y análisis musical y armónico.
- Consultas sobre audio y video.
- Explicaciones sobre cómo usar la aplicación.
- Preguntas generales sobre música.
- Preguntas relacionadas específicamente con la partitura que el usuario tenga abierta.

El asistente se representará como un personaje pixel art de 8 bits en una ventana de chat flotante. El personaje tendrá movimiento de boca al hablar.

#### Análisis de libros y textos

Se podrá cargar un PDF de texto —por ejemplo, un libro de teoría musical— para que BachGPT lo analice y ayude al usuario a comprenderlo y estudiarlo.

Esta función está pensada para libros de texto y teoría, no para partituras.

### 2. Library

Espacio para organizar, buscar y consultar la colección musical.

Funciones deseadas:

- Organizar archivos PDF por nombre, época y dotación musical.
- Crear y administrar programas o setlists.
- Editar y anotar PDFs con herramientas comparables a las de un lector profesional de PDF.
- Mostrar un botón de BachGPT en cada obra. Al activarlo, el asistente deberá centrarse en esa obra y ofrecer, cuando sea posible:
  - Información relacionada y referencias externas.
  - Enlaces a videos y grabaciones de audio.
  - Distintas versiones de la obra.

### 3. Modo de estudio

Espacio para practicar y trabajar sobre una partitura.

Herramientas deseadas:

- Anotación de trazo libre.
- Conversión de anotaciones manuscritas a texto o símbolos mediante reconocimiento asistido por IA.
- Marcador y borrador.
- Sellos de digitación especializados para distintos instrumentos, como piano, guitarra y violín.
- Opciones para personalizar colores, tamaños, transparencia y tipografía de las herramientas.
- Marcas o favoritos para guardar páginas y volver rápidamente a ellas.
- Acceso a BachGPT mientras se estudia.

### 4. Modo de concierto

Vista sencilla y despejada, diseñada para usar durante una interpretación.

Comportamiento y funciones deseadas:

- Al tocar la partitura, ocultar los controles y mostrar la página a pantalla completa.
- Mantener un botón flotante discreto para mostrar la pluma, el marcador y el borrador.
- No mostrar BachGPT en este modo.
- Incluir un control pequeño y elegante para activar la función **Escucha activa**.

#### Escucha activa

La aplicación escucha la interpretación y la compara con la partitura para seguir el avance del músico y cambiar de página cuando sea necesario. El objetivo es reducir la dependencia del cambio manual de página o del pedal Bluetooth.

También se desea poder dar comandos de voz para tareas concretas, por ejemplo: «Cambia a la página 3».

La escucha activa es una función que requiere investigación y validación técnica. Hay que estudiar cómo manejar pausas, repeticiones, cambios de tempo, errores de interpretación y ruido ambiental antes de definir su alcance.

### 5. Staff Editor

Espacio para crear y editar partituras.

La experiencia puede tomar como referencia herramientas como StaffPad, Sibelius, Dorico y Finale.

Objetivos deseadados:

- Crear una partitura desde cero.
- Explorar la conversión de un PDF existente a una partitura editable, similar al flujo de reconocimiento de PhotoScore.

La edición profesional y la conversión de partituras son áreas amplias. Antes de definirlas como parte de la primera versión, hay que investigar opciones, limitaciones y alcance técnico.

## Principios para el diseño y desarrollo

- Priorizar tablets Android y iPad.
- Diseñar una interfaz clara, moderna y fácil de aprender.
- Adaptar la experiencia al contexto: biblioteca, estudio, concierto o edición.
- Mantener la partitura como elemento principal durante la interpretación.
- Considerar distintos instrumentos, géneros y formas de trabajar con música.
- Separar la visión completa del producto de las funciones que se desarrollarán primero.
- Para las funciones de IA, explicar sus capacidades y limitaciones y validarlas con prototipos.

## Instrucciones para el agente de desarrollo

Antes de implementar una función grande o técnicamente incierta:

1. Explica qué problema de usuario resuelve.
2. Identifica las principales decisiones de diseño y tecnología.
3. Separa lo imprescindible de lo que puede esperar.
4. Propón una primera versión acotada y verificable.
5. Señala las suposiciones que deban confirmarse.

No asumas que todas las funciones descritas deben estar disponibles en la primera versión. Ayúdame a priorizarlas y a avanzar por etapas.

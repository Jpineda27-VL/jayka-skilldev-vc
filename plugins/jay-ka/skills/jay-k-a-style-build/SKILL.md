---
name: jay-k-a-style-build
description: "Construye prototipos con tu propio estilo: toma la identidad de la entrevista de new-project y las fichas de style-self-learning, propone una base con razones (o tres direcciones nuevas si no hay nada), la aprueba contigo, la convierte en tokens y construye pantallas verificadas en celular y escritorio. Invócala con /jay-k-a-style-build, opcionalmente diciendo qué construir."
argument-hint: "[<qué construir>]"
disable-model-invocation: true
---

# JayKA · Style Build

Modo **construcción** de la pareja de estilo. Usa lo aprendido por `jay-k-a-style-self-learning` (fichas) y lo definido en `jay-k-a-new-project` (identidad y tecnología) para que los prototipos nuevos salgan **coherentes con tu estilo y sin cara de «hecho por IA»**.

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jay-k-a-working-rules/reference/convenciones.md` (ruta relativa a esta skill).

| Argumento | Qué hace |
|---|---|
| *(vacío)* | **Por defecto.** Empieza en el Paso 0 y pregunta qué se va a construir |
| `<qué construir>` | Texto libre (por ejemplo «inicio del cliente y panel de pedidos»). Se usa como alcance propuesto del Paso 4, que igual se confirma |

## Reglas que no se rompen
1. **El usuario decide el estilo.** Propones con razones; nada se aplica sin su aprobación.
2. **No inventes la identidad.** Si no hay entrevista ni fichas, dilo y propón direcciones, o haz el mini-cuestionario (paso 0). Nunca presentes una suposición como si fuera una decisión suya.
3. **Dependencias, fuentes y servicios externos** (paquetes, CDN, Google Fonts, librerías de animación) **requieren permiso**, cada vez. Explica qué son y qué cuestan (peso, privacidad, dependencia). Prefiere pilas de fuentes del sistema o fuentes ya incluidas en el proyecto si el usuario no autoriza descargas.
4. Cumple `jay-k-a-working-rules`: plan antes de construir, grupos pequeños, nada de claves, verificar antes de decir «listo».
5. Si el proyecto ya tiene un sistema de diseño aprobado, **no lo reemplazas en silencio**: lo extiendes o preguntas.

## Paso 0 · Reunir entradas
Busca, en este orden, y di qué encontraste y qué no:
1. `docs/proyecto/informe-inicial.md` y `docs/proyecto/entrevista.md` (de `jay-k-a-new-project`). Lee la entrevista **por clave**, nunca por número:
   - Tecnología y plataforma: `tecnologia.frontend`, `tecnologia.backend`, `tecnologia.base-de-datos`, `tecnologia.plataforma`.
   - Identidad: todas las claves `identidad.*` (sensación, tonos, evitar, tipografía, imágenes, marca, referencias, modo, densidad).
   - Datos sensibles: `calidad.sensibilidad`. Dispositivos: `calidad.dispositivos`.
   - Solo cuentan las entradas con estado `respondida`. Las `no-sé` activan el Paso 2 para ese rasgo; las `saltada` y las que no existan se tratan como «sin dato» y se dice cuáles faltaron.
   - Si la entrevista no tiene claves (formato anterior a la v0.6), dilo y pide correr `/jay-k-a-new-project retomar` para convertirla, o sigue con el mini-cuestionario.
2. La biblioteca personal: `~/.claude/jay-k-a/estilos/<slug>/ficha.md`, `tokens.json` y `estilo-base.md`.
3. Un estilo ya definido en el proyecto (`docs/proyecto/estilo.md`, tokens existentes).
4. Lo que el usuario pida ahora: **qué se va a construir** (pantallas o flujo del prototipo).

Si **faltan** la entrevista y las fichas: recomienda correr `jay-k-a-new-project` (identidad) y/o `jay-k-a-style-self-learning` (fichas). Si el usuario prefiere seguir, haz un **mini-cuestionario** de 6 preguntas (sensación, tonos de color, tipo de letra, densidad, modo claro u oscuro, referencias). Cada una se responde o se salta a mano, igual que en `new-project`. «No sé» es válido y activa el paso 2. Las seis usan las claves de la entrevista (`identidad.sensacion`, `identidad.tonos`, `identidad.tipografia`, `identidad.densidad`, `identidad.modo`, `identidad.referencias`) y se guardan en `docs/proyecto/entrevista.md` con el formato de `jay-k-a-new-project` (si el archivo no existe, se crea solo con esas entradas).

## Paso 1 · Emparejar con las fichas
Sigue `reference/matching.md`. Entrega **hasta 3 candidatas** (o ninguna, y lo dices):
- Qué ficha, **por qué encaja** (qué respuesta del usuario coincide con qué rasgo de la ficha).
- **Qué tomarías** de ella (tokens, patrones, animación) y **qué dejarías**.
- Qué **funcionó o falló** según su sección «Resultado y lecciones».
- Compatibilidad técnica: si los tokens se portan tal cual a la tecnología elegida o hay que traducirlos.
El usuario elige: **una**, **mezclar** (por ejemplo «colores de A, tipografía de B») o **ninguna**.

## Paso 2 · Direcciones nuevas (si no hay ficha, o el usuario dice «no sé»)
Propón **3 direcciones distintas entre sí**, no tres variaciones de lo mismo. Cada una, en pocas líneas:
- Nombre y sensación en 5 palabras.
- Paleta con roles y valores concretos (derivada con la receta de `reference/matching.md`, con el contraste ya verificado).
- Pareja tipográfica y escala.
- Forma (radios, bordes, sombras) y densidad.
- Movimiento (qué se anima y cómo).
- Un **motivo distintivo** (algo reconocible que no sea genérico).
- Un riesgo honesto de esa dirección.
Si el usuario dio solo tonos (por ejemplo «rojo, azul y verde»), las tres direcciones **parten de esos tonos**. Si ya tiene paletas exactas, se integran tal cual. Revisa `reference/anti-slop.md` antes de proponer.

## Paso 3 · Briefing de estilo (puerta de aprobación)
Con lo elegido, escribe el **briefing** (`reference/style-brief-template.md`) en `docs/proyecto/estilo.md`, con los tokens en el formato del proyecto (variables CSS, tema de Tailwind, archivo de tema…). Muéstralo resumido y pregunta: «¿Lo apruebo así o cambias algo?». **No construyas hasta que lo apruebe.** Si cambia algo, actualiza el briefing y vuelve a mostrar solo lo cambiado.

## Paso 4 · Construir
1. Confirma el **alcance del prototipo**. Recomienda lo mínimo que muestre el estilo: una pantalla clave del cliente y la principal del dashboard, si hay ambos.
2. Plan corto por grupos (tokens y base → componentes → pantallas). Para trabajo grande, sugiere `jay-k-a-plan-builder`.
3. Construye con los tokens aprobados: cero colores, tamaños o radios «sueltos» fuera del sistema. Contenido realista, no «Lorem ipsum» ni «Welcome to…».
4. Respeta estas bases (cámbialas en **Mis ajustes** si prefieres otras):
   - Texto en `rem`, no en `px`.
   - Contraste AA como mínimo; foco visible; áreas táctiles de 44 px o más.
   - `prefers-reduced-motion` respetado.
   - Estados reales: vacío, cargando, error, desactivado.
   - Celular primero si el usuario lo usa más (`calidad.dispositivos`).

## Paso 5 · Verificar (una sola ronda acotada)
No entres en un ciclo de pulido infinito: **una ronda completa y, si hace falta, una de confirmación.**
1. Abre el prototipo en navegador a **1280 px** y **375 px** y mira todas las pantallas construidas.
2. Revisa: textos cortados o montados, contraste de los pares importantes, foco, áreas táctiles, desbordes horizontales, imágenes, estados vacíos.
3. Corrige todo lo encontrado **en un solo lote**, y confirma una vez.
4. Reporta lo que quedó sin verificar.

## Paso 6 · Entrega y siguientes pasos
Resume: estilo aplicado (de qué ficha o dirección), archivos creados, tokens, y qué no se hizo. Cierra sugiriendo, sin ejecutarlas:
- `jay-k-a-companion-tools`: auditoría y pulido (por ejemplo `impeccable audit` y `polish`) y las herramientas contra el «aspecto de IA».
- `jay-k-a-style-self-learning`, **cuando el proyecto esté terminado**, para guardar su ficha y enriquecer la biblioteca.

## Terminado cuando
- `docs/proyecto/estilo.md` existe y el usuario lo aprobó en la compuerta del Paso 3.
- Las pantallas del alcance confirmado están construidas, y fuera del archivo de tokens no hay colores sueltos: una búsqueda de `#[0-9a-fA-F]{3,8}\b`, `rgb(` y `hsl(` en los archivos del prototipo no encuentra ninguno (o cada uno está justificado).
- Se revisaron todas las pantallas a 1280 px y 375 px, con una ronda de correcciones y una de confirmación como máximo.
- La entrega dice qué quedó sin verificar.

## Mis ajustes
<!-- Cambia bases (por ejemplo «texto en px», «siempre modo oscuro»), pesos de tus preferencias o qué pantallas se construyen por defecto. -->

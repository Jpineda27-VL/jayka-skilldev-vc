---
name: jay-k-a-new-project
description: "Arranca un proyecto nuevo con una entrevista guiada de 42 preguntas (objetivo, usuarios, tecnología, datos, identidad visual, seguridad y publicación), cada una respondida o saltada a mano, y entrega un informe de lo definido y lo que falta. Invócala con /jay-k-a-new-project (o con «retomar» para seguir una entrevista guardada)."
argument-hint: "[retomar | informe]"
disable-model-invocation: true
---

# JayKA · New Project

Orquesta el arranque de un proyecto: entrevista, informe y archivos base. Trabaja **sin inventar**: todo lo que no responda el usuario queda como pendiente.

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jay-k-a-working-rules/reference/convenciones.md` (ruta relativa a esta skill).

| Argumento | Alias | Qué hace |
|---|---|---|
| *(vacío)* | `nuevo`, `new` | **Por defecto.** Entrevista desde la pregunta 1. Si ya existe `docs/proyecto/entrevista.md`, pregunta antes: «Ya hay una entrevista guardada. ¿La retomo o empiezo una nueva (la anterior se guarda con fecha)?» |
| `retomar` | `continuar`, `resume` | Lee `docs/proyecto/entrevista.md` y sigue desde el primer bloque con preguntas `pendiente`. Si no existe, lo dice y ofrece empezar. Si está en un formato anterior (sin claves), primero lo convierte al de la plantilla, pasando cada respuesta a su clave según el número, guarda el original como `entrevista.<AAAA-MM-DD>.md` y lo dice. Si solo tiene algunas entradas (por ejemplo, las del mini-cuestionario de `style-build`), crea las que faltan como `pendiente` |
| `informe` | `report` | No pregunta nada: vuelve a escribir `docs/proyecto/informe-inicial.md` desde la entrevista guardada |

## Reglas de la entrevista (obligatorias)
1. **Cada pregunta se resuelve a mano.** El usuario la responde escribiendo, o escribe él mismo `saltar`. Ninguna se salta sola, ninguna se rellena por tu cuenta y ninguna queda en blanco sin que él lo diga.
2. Responder y saltar son igual de válidos. No presiones ni insistas en las saltadas.
3. «No sé» es una respuesta escrita y válida: se anota como duda. En la parte de identidad significa que después se le sugerirán opciones.
4. Haz las preguntas en **bloques de 4 a 6**, numeradas, con el nombre del bloque. El usuario contesta por número (`7: ...`, `8: saltar`). Si faltan números por resolver, vuelve a mostrarlos (solo esos) antes de pasar al siguiente bloque.
5. No saltes de bloque con preguntas sin resolver. Si el usuario quiere dejar un bloque entero para después, que lo escriba (`saltar bloque`), y se anotan todas como saltadas.
6. Al empezar, crea `docs/proyecto/entrevista.md` con `reference/entrevista-template.md`: las 42 entradas, todas «pendiente» (la carpeta se crea según las convenciones). Actualiza cada entrada **apenas llega** su respuesta, y el progreso del encabezado al cerrar cada bloque. Si la conversación se corta, se retoma con `retomar`.
7. No pidas claves, tokens ni datos de cuentas. Si el usuario menciona servicios externos (pagos, correo, mapas), solo anota cuáles son. Las claves las maneja él (ver `jay-k-a-working-rules`).
8. Colores: **no se piden códigos exactos**. Basta con tonos («rojo, azul y verde», «cálido», «sobrio»). Es solo para sondear; las paletas concretas se sugieren o se integran después. Si ya tiene una paleta exacta, la anotas, pero no la pidas.

## Preguntas (42)
Cada pregunta tiene un **número** (para contestar en el chat: `7: …`) y una **clave estable** (entre comillas invertidas) que es la que se guarda en `entrevista.md` y la que usan otras skills. Las claves no cambian nunca: si en **Mis ajustes** agregas una pregunta, lleva una clave nueva con el prefijo `extra.`; si quitas una, su clave simplemente no aparece.

**A. El proyecto**
1. `proyecto.nombre` ¿Cómo se llama el proyecto (aunque sea provisional)?
2. `proyecto.frase` ¿Qué es, en una sola frase?
3. `proyecto.problema` ¿Qué problema resuelve?
4. `proyecto.usuario` ¿Quién lo va a usar? (describe a la persona)
5. `proyecto.nombre-usuario` ¿Cómo se llama ese usuario dentro de la app? (cliente, paciente, socio…)
6. `proyecto.referentes` ¿Conoces algo parecido? ¿Qué harías diferente?

**B. Alcance**
7. `alcance.imprescindible` ¿Qué funciones son imprescindibles para la primera versión?
8. `alcance.despues` ¿Qué funciones quedarían para después?
9. `alcance.fuera` ¿Qué NO va a hacer este proyecto?
10. `alcance.transacciones` ¿Hay pagos, ventas, reservas o pedidos? ¿Cómo funcionan (en línea, en efectivo, fuera de la app)?
11. `alcance.idiomas` ¿En qué idioma o idiomas va?
12. `alcance.region` ¿En qué país o zona se usa? (moneda, zona horaria, leyes)

**C. Usuarios y roles**
13. `usuarios.tipos` ¿Qué tipos de usuario habrá?
14. `usuarios.permisos` ¿Qué puede hacer cada uno? (roles y permisos)
15. `usuarios.acceso` ¿Cómo entran? (usuario y contraseña, Google, enlace, sin cuenta)
16. `usuarios.alta` ¿Quién crea las cuentas? (ellos mismos, un administrador, por invitación)
17. `usuarios.panel-admin` ¿Habrá un panel de administración? ¿Quién lo usa?

**D. Tecnología**
18. `tecnologia.frontend` ¿Qué tecnología quieres para lo que ve el usuario (frontend)? Si no sabes, escríbelo y se sugiere.
19. `tecnologia.backend` ¿Y para el servidor (backend)?
20. `tecnologia.base-de-datos` ¿Qué base de datos?
21. `tecnologia.plataforma` ¿Será sitio web, app móvil o ambos? ¿Cuál es el principal?
22. `tecnologia.hosting` ¿Dónde se va a publicar? (hosting o servidor)
23. `tecnologia.dominio` ¿Ya tienes dominio?
24. `tecnologia.servicios-externos` ¿Qué servicios externos usarías? (correo, mapas, pagos, notificaciones…). Solo cuáles, sin claves.

**E. Datos y reglas**
25. `datos.entidades` ¿Cuáles son las cosas principales que se guardan? (por ejemplo productos, pedidos, citas)
26. `datos.reglas` ¿Qué reglas de negocio ya están decididas?
27. `datos.personales` ¿Qué datos personales se guardan? (nombre, teléfono, documentos)
28. `datos.archivos` ¿Se suben fotos o archivos? ¿De qué tipo y de quién?
29. `datos.conservacion` ¿Cuánto tiempo se conservan los datos y cómo se respaldan?

**F. Identidad visual**
30. `identidad.sensacion` ¿Qué sensación debe dar? (cálida, sobria, festiva, técnica, juvenil, elegante…)
31. `identidad.tonos` ¿Qué tonos de color imaginas? (solo familias: rojo, azul, verde…)
32. `identidad.evitar` ¿Qué colores quieres evitar?
33. `identidad.tipografia` ¿Qué tipo de letra te gusta? (con serifa, sin serifa, redondeada, manuscrita…) o «sugiere».
34. `identidad.imagenes` ¿Qué estilo de imágenes? (fotos reales, ilustraciones, íconos, sin imágenes)
35. `identidad.marca` ¿Existe un logo o una marca? ¿Se mantiene?
36. `identidad.referencias` ¿Qué sitios o apps te gustan visualmente y qué te gusta de cada uno?
37. `identidad.modo` ¿Modo claro, oscuro o ambos?
38. `identidad.densidad` ¿Diseño aireado y espacioso, o compacto y con mucha información?

**G. Calidad y publicación**
39. `calidad.sensibilidad` ¿Qué tan sensibles son los datos? ¿Hay datos de menores, salud o dinero?
40. `calidad.dispositivos` ¿Desde qué dispositivos se usará más? (celular, escritorio, tableta)
41. `calidad.fechas` ¿Hay fecha o etapas importantes?
42. `calidad.forma-de-trabajo` ¿Cómo prefieres trabajar? (ritmo, cuánto quieres revisar, qué quieres aprobar antes de que se haga)

## Después de la entrevista

### 1. Informe de arranque
Escribe `docs/proyecto/informe-inicial.md` con `reference/informe-inicial-template.md` y muéstralo resumido. Cada dato cita su clave, para que se pueda rastrear hasta la respuesta:
- **Definido:** lo que ya está claro, en pocas líneas por tema.
- **Saltado:** las preguntas que el usuario saltó.
- **Dudas:** las que respondió «no sé».
- **Falta para arrancar bien:** lo que conviene resolver antes de construir, ordenado por importancia, y qué pasa si no se resuelve.
- **Riesgos:** por ejemplo datos sensibles sin plan de seguridad, tecnología sin definir, reglas de negocio sin cerrar.
- **Sugerencias de identidad:** si dio solo tonos o dijo «no sé», propón 2 o 3 direcciones (sensación, familias de color, tipo de letra) para que elija. Si existen fichas de `jay-k-a-style-self-learning`, menciona cuál se parece y por qué.

### 2. Archivos base (solo con aprobación)
Pregunta antes de crear cualquiera. Crea lo que apruebe:
- `CLAUDE.md` en la raíz, con `reference/claude-md-template.md` (menos de 40 líneas; lo no definido dice «por definir»). Pregunta aparte si agregar el bloque de reglas base; si dice que sí, se agrega siguiendo «Instalar las reglas base» de `jay-k-a-init`.
- `.claude/estado/CONTINUAR.md` con el estado inicial y los pendientes, usando la plantilla de `jay-k-a-continuity` (`../jay-k-a-continuity/reference/continuar-template.md`, ruta relativa a esta skill). Los pendientes son los de «Falta para arrancar bien».
- La estructura de carpetas, con `jay-k-a-project-structure`.
- `git init` y primer commit, con `jay-k-a-git-rules`.
- Opcional: un **prompt de arranque** (texto para pegar en otro chat) armado con las respuestas.

### 3. Siguientes pasos que sugieres (sin ejecutarlos)
- `jay-k-a-style-build`, para el estilo visual del prototipo.
- `jay-k-a-plan-builder`, para planear el primer bloque grande.
- `jay-k-a-security-web`, si hay login, formularios o subidas.
- `jay-k-a-companion-tools`, para auditorías y pulido.
Solo menciona las que estén instaladas; si no lo están, dilo.

## Terminado cuando
- Las 42 entradas de `docs/proyecto/entrevista.md` siguen el formato de la plantilla y tienen estado `respondida`, `saltada` o `no-sé`. Ninguna queda en `pendiente`, y el progreso del encabezado suma 42.
- `docs/proyecto/informe-inicial.md` existe con sus seis secciones y se mostró resumido.
- Los archivos base creados son **solo** los que el usuario aprobó, y se dijo cuáles no se crearon.
- Los siguientes pasos se sugirieron sin ejecutarlos.

## Mis ajustes
<!-- Agrega, quita o cambia preguntas aquí. Ejemplo: «agrega una pregunta sobre accesibilidad», «quita las de identidad». Mantén la regla: responder o saltar, siempre a mano. -->

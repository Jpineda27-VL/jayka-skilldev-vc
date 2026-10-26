---
name: jay-k-a-new-project
description: Arranca un proyecto nuevo con una entrevista guiada de unas 42 preguntas (objetivo, usuarios, tecnología, datos, identidad visual, seguridad y publicación), cada una respondida o saltada a mano, y entrega un informe de lo definido y lo que falta. Invócala con /jay-k-a-new-project.
disable-model-invocation: true
---

# JayKA · New Project

Orquesta el arranque de un proyecto: entrevista, informe y archivos base. Trabaja **sin inventar**: todo lo que no responda el usuario queda como pendiente.

## Reglas de la entrevista (obligatorias)
1. **Cada pregunta se resuelve a mano.** El usuario la responde escribiendo, o escribe él mismo `saltar`. Ninguna se salta sola, ninguna se rellena por tu cuenta y ninguna queda en blanco sin que él lo diga.
2. Responder y saltar son igual de válidos. No presiones ni insistas en las saltadas.
3. «No sé» es una respuesta escrita y válida: se anota como duda. En la parte de identidad significa que después se le sugerirán opciones.
4. Haz las preguntas en **bloques de 4 a 6**, numeradas, con el nombre del bloque. El usuario contesta por número (`7: ...`, `8: saltar`). Si faltan números por resolver, vuelve a mostrarlos (solo esos) antes de pasar al siguiente bloque.
5. No saltes de bloque con preguntas sin resolver. Si el usuario quiere dejar un bloque entero para después, que lo escriba (`saltar bloque`), y se anotan todas como saltadas.
6. Guarda las respuestas a medida que llegan en `docs/proyecto/entrevista.md` (crea la carpeta con permiso). Si la conversación se corta, se retoma desde ahí.
7. No pidas claves, tokens ni datos de cuentas. Si el usuario menciona servicios externos (pagos, correo, mapas), solo anota cuáles son. Las claves las maneja él (ver `jay-k-a-working-rules`).
8. Colores: **no se piden códigos exactos**. Basta con tonos («rojo, azul y verde», «cálido», «sobrio»). Es solo para sondear; las paletas concretas se sugieren o se integran después. Si ya tiene una paleta exacta, la anotas, pero no la pidas.

## Preguntas (42)

**A. El proyecto**
1. ¿Cómo se llama el proyecto (aunque sea provisional)?
2. ¿Qué es, en una sola frase?
3. ¿Qué problema resuelve?
4. ¿Quién lo va a usar? (describe a la persona)
5. ¿Cómo se llama ese usuario dentro de la app? (cliente, paciente, socio…)
6. ¿Conoces algo parecido? ¿Qué harías diferente?

**B. Alcance**
7. ¿Qué funciones son imprescindibles para la primera versión?
8. ¿Qué funciones quedarían para después?
9. ¿Qué NO va a hacer este proyecto?
10. ¿Hay pagos, ventas, reservas o pedidos? ¿Cómo funcionan (en línea, en efectivo, fuera de la app)?
11. ¿En qué idioma o idiomas va?
12. ¿En qué país o zona se usa? (moneda, zona horaria, leyes)

**C. Usuarios y roles**
13. ¿Qué tipos de usuario habrá?
14. ¿Qué puede hacer cada uno? (roles y permisos)
15. ¿Cómo entran? (usuario y contraseña, Google, enlace, sin cuenta)
16. ¿Quién crea las cuentas? (ellos mismos, un administrador, por invitación)
17. ¿Habrá un panel de administración? ¿Quién lo usa?

**D. Tecnología**
18. ¿Qué tecnología quieres para lo que ve el usuario (frontend)? Si no sabes, escríbelo y se sugiere.
19. ¿Y para el servidor (backend)?
20. ¿Qué base de datos?
21. ¿Será sitio web, app móvil o ambos? ¿Cuál es el principal?
22. ¿Dónde se va a publicar? (hosting o servidor)
23. ¿Ya tienes dominio?
24. ¿Qué servicios externos usarías? (correo, mapas, pagos, notificaciones…). Solo cuáles, sin claves.

**E. Datos y reglas**
25. ¿Cuáles son las cosas principales que se guardan? (por ejemplo productos, pedidos, citas)
26. ¿Qué reglas de negocio ya están decididas?
27. ¿Qué datos personales se guardan? (nombre, teléfono, documentos)
28. ¿Se suben fotos o archivos? ¿De qué tipo y de quién?
29. ¿Cuánto tiempo se conservan los datos y cómo se respaldan?

**F. Identidad visual**
30. ¿Qué sensación debe dar? (cálida, sobria, festiva, técnica, juvenil, elegante…)
31. ¿Qué tonos de color imaginas? (solo familias: rojo, azul, verde…)
32. ¿Qué colores quieres evitar?
33. ¿Qué tipo de letra te gusta? (con serifa, sin serifa, redondeada, manuscrita…) o «sugiere».
34. ¿Qué estilo de imágenes? (fotos reales, ilustraciones, íconos, sin imágenes)
35. ¿Existe un logo o una marca? ¿Se mantiene?
36. ¿Qué sitios o apps te gustan visualmente y qué te gusta de cada uno?
37. ¿Modo claro, oscuro o ambos?
38. ¿Diseño aireado y espacioso, o compacto y con mucha información?

**G. Calidad y publicación**
39. ¿Qué tan sensibles son los datos? ¿Hay datos de menores, salud o dinero?
40. ¿Desde qué dispositivos se usará más? (celular, escritorio, tableta)
41. ¿Hay fecha o etapas importantes?
42. ¿Cómo prefieres trabajar? (ritmo, cuánto quieres revisar, qué quieres aprobar antes de que se haga)

## Después de la entrevista

### 1. Informe de arranque
Escribe `docs/proyecto/informe-inicial.md` y muéstralo resumido:
- **Definido:** lo que ya está claro, en pocas líneas por tema.
- **Saltado:** las preguntas que el usuario saltó.
- **Dudas:** las que respondió «no sé».
- **Falta para arrancar bien:** lo que conviene resolver antes de construir, ordenado por importancia, y qué pasa si no se resuelve.
- **Riesgos:** por ejemplo datos sensibles sin plan de seguridad, tecnología sin definir, reglas de negocio sin cerrar.
- **Sugerencias de identidad:** si dio solo tonos o dijo «no sé», propón 2 o 3 direcciones (sensación, familias de color, tipo de letra) para que elija. Si existen fichas de `jay-k-a-style-self-learning`, menciona cuál se parece y por qué.

### 2. Archivos base (solo con aprobación)
Pregunta antes de crear cualquiera. Crea lo que apruebe:
- `CLAUDE.md` corto en la raíz.
- `.claude/estado/CONTINUAR.md` con el estado inicial y los pendientes.
- La estructura de carpetas, con `jay-k-a-project-structure`.
- `git init` y primer commit, con `jay-k-a-git-rules`.
- Opcional: un **prompt de arranque** (texto para pegar en otro chat) armado con las respuestas.

### 3. Siguientes pasos que sugieres (sin ejecutarlos)
- `jay-k-a-style-build`, para el estilo visual del prototipo.
- `jay-k-a-plan-builder`, para planear el primer bloque grande.
- `jay-k-a-security-web`, si hay login, formularios o subidas.
- `jay-k-a-companion-tools`, para auditorías y pulido.
Solo menciona las que estén instaladas; si no lo están, dilo.

## Mis ajustes
<!-- Agrega, quita o cambia preguntas aquí. Ejemplo: «agrega una pregunta sobre accesibilidad», «quita las de identidad». Mantén la regla: responder o saltar, siempre a mano. -->

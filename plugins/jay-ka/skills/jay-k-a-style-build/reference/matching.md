# Emparejar identidad con fichas, y derivar paletas

## 1. Dimensiones de comparación
Compara la entrevista (o el mini-cuestionario) con cada ficha en estas dimensiones. Puntúa 0 (no coincide), 1 (parcial), 2 (coincide) y **explica cada puntaje con evidencia**.

| Dimensión | De dónde sale en la entrevista | De dónde sale en la ficha |
|---|---|---|
| Sensación | P30 | Sección 1 (sensación en 5 palabras) |
| Familia de color | P31 (tonos) y P32 (evitar) | Sección 3 (roles, armonía) |
| Tipografía | P33 | Sección 4 |
| Imágenes | P34 | Sección 9 |
| Densidad | P38 | Secciones 5, 8 |
| Modo | P37 | Sección 3 (oscuro) |
| Público y tono | P4, P36 | Sección 1 y voz de los textos |
| Plataforma | P21, P40 | Sección 2 y layouts en celular |
| Tecnología | P18 | Sección 2 |

Reglas:
- Un tono que el usuario quiso **evitar** (P32) y que la ficha usa como primario es un **veto**: no la propongas, o dilo claramente.
- La tecnología pesa poco para el estilo, pero mucho para el esfuerzo: si los tokens no se portan, dilo («hay que traducir de variables CSS a tema de Tailwind»).
- Si dos fichas empatan, prefiere la que tenga **«Resultado y lecciones»** positivo.
- Si ninguna llega a 10 de 18, no fuerces: «ninguna encaja bien» y pasa a direcciones nuevas.

## 2. Sinónimos de sensación (para interpretar respuestas)
- **Cálida / acogedora:** fondos crema o marfil, acentos terracota, coral o dorado, esquinas redondeadas, fotos con luz natural.
- **Festiva / alegre:** colores saturados y contrastantes, formas orgánicas, patrones o franjas, movimiento ligero.
- **Sobria / corporativa:** neutros fríos, un solo acento, rejilla estricta, poca decoración, tipografía neutra.
- **Técnica / precisa:** monoespaciada en datos, líneas finas, alta densidad, acentos fríos, mucho dato visible.
- **Elegante / premium:** contraste alto, mucho espacio en blanco, tipografía con serifa o muy fina, paleta contenida.
- **Juvenil / enérgica:** color vivo, formas grandes, tipografía gruesa, movimiento marcado.
- **Brutalista / cruda:** bordes gruesos, sombras duras sin desenfoque, tipografía grande, paleta plana.
- **Minimalista:** pocos elementos, jerarquía tipográfica clara, color casi ausente.
Si el usuario usa una palabra que no está aquí, pregunta qué ejemplo concreto tiene en mente.

## 3. Derivar una paleta desde tonos sueltos
Cuando solo hay familias de color («rojo, azul, verde»), no elijas tres colores y los pegues. Sigue esto:
1. **Elige un protagonista** (el tono que más define la sensación) y un **acento** que contraste; el tercero, si lo hay, es de apoyo o de estado (éxito, aviso).
2. Trabaja en **OKLCH** (o HSL si no hay mejor): fija un tono (hue) y varía luminosidad y croma.
3. **Neutros con intención:** nunca gris puro. Tíñelos hacia el tono protagonista (croma bajo) o hacia su opuesto cálido/frío según la sensación.
4. **Roles obligatorios:** fondo, superficie, texto, texto suave, primario, acento, éxito, aviso, peligro, borde, enfoque. Todos con valor concreto.
5. **Escala por rol:** 3 o 4 pasos (suave, base, fuerte, texto sobre él).
6. **Verifica contraste** (WCAG): texto normal ≥ 4.5:1, texto grande ≥ 3:1, componentes e íconos ≥ 3:1. Texto suave sobre fondo ≥ 4.5:1. Texto sobre primario y sobre acento ≥ 4.5:1. Si un color que le gusta al usuario no pasa para texto, úsalo para formas y no para texto, y dilo.
7. **Modo oscuro** (si se pidió): no inviertas; reduce la luminosidad de superficies, sube un poco el croma del acento y reverifica contraste.
8. Un color de **peligro** y uno de **éxito** que no choquen con el protagonista (por ejemplo, si el primario es rojo, el peligro necesita otro tratamiento para no confundirse).
9. Entrega siempre la paleta con **valores hex**, el **par de contraste medido** y una frase de por qué funciona.

## 4. Llevar tokens de una ficha a otra tecnología
- Variables CSS → tema de Tailwind: cada variable de color pasa a `theme.extend.colors`; radios a `borderRadius`; espaciados a `spacing`.
- Tailwind → variables CSS: genera `:root { --color-… }` desde el tema.
- Web → app móvil: un archivo de tema (`theme.ts`) con las mismas claves; los `rem` pasan a números escalados.
- Conserva **nombres de roles**, no nombres de valores (`primario`, no `azul-600`).

## 5. Qué decir cuando no hay fichas
«Aún no hay fichas en la biblioteca. Puedo proponerte tres direcciones nuevas o, mejor, estudiar uno de tus proyectos terminados con `jay-k-a-style-self-learning` para que la próxima vez salga más a tu medida.»

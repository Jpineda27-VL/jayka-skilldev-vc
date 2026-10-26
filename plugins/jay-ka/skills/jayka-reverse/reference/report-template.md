# Ingeniería inversa · <nombre del objetivo>

- **Objetivo:** <url o repo>
- **Modo y nivel:** <live|repo> · nivel <1|2|3>
- **Fecha:** <AAAA-MM-DD>
- **Método de captura:** <capture-live.mjs con Playwright | manual con <herramienta>>
- **Foco:** <efecto pedido o «completo»>

## 1. Resumen
<3 a 5 líneas: qué es, con qué está hecho y qué lo hace distinto.>

## 2. Licencia
- **Clase:** <Permisiva | Copyleft | Comercial | Sin licencia | No aplica (sitio en vivo)>
- **Evidencia:** <archivo o campo>
- **Qué permite:** <una línea>

## 3. Stack
| Capa | Tecnología | Versión | Origen |
|---|---|---|---|
| Framework | | | |
| Estilos | | | |
| Animación | | | |
| Scroll | | | |
| Transición entre páginas | | | |
| 3D / canvas / vector | | | |
| Constructor / CMS | | | |

## 4. Inventario de efectos
| Id | Efecto | Dónde | Disparador | Mecanismo | Valores | Origen |
|---|---|---|---|---|---|---|
| E1 | | | | | | |

### Detalle por efecto
#### E1 · <nombre>
- **Qué se ve:** <descripción breve, con referencia a capturas: `captura/live-1280x800/02-scroll-03.png`>
- **Cómo funciona:** <mecanismo en 2 o 3 líneas>
- **Valores:** <propiedades, duración (ms), retraso, curva, stagger, start/end, scrub, pin>
- **Evidencia:** <Medido: archivo JSON y campo | Código: archivo:línea | Inferido: por qué>
- **Cómo reproducirlo:** <receta en palabras, sin copiar su código>

## 5. Accesibilidad y rendimiento del movimiento
- **Movimiento reducido:** <veredicto y cifras>
- **Propiedades costosas animadas:** <lista o «ninguna»>
- **Scroll secuestrado:** <sí/no y con qué>
- **Peso:** <librerías y canvas/WebGL>

## 6. Reproducciones (nivel 3)
| Id | Archivo | Comparación | Resultado |
|---|---|---|---|
| E1 | `repro/E1.html` | `compare-motion.mjs` canal <canal> | ✓ / ✗ <motivo> |

## 7. Lo que quedó sin medir o inferido
- <punto y motivo>

## 8. Cómo usar esto
- <qué conviene llevar a un proyecto propio y qué no>
- <siguiente skill o herramienta sugerida>

## Archivos
- `hallazgos-repo.json` · `captura/resumen.json` · `captura/red.json` · `captura/live-*/` · `pistas/` · `repro/`

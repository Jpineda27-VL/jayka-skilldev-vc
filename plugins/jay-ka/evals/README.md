# Escenarios de comportamiento (claude plugin eval)

Cada carpeta es un caso: `case.yaml` (prompt, herramientas y calificadores) y, si hace falta, `scaffold.sh`, que arma un proyecto de prueba antes de correr. Prueban que las skills **se comportan** como dicen sus contratos: argumentos, compuertas, archivos que crean, scripts que corren y lo que nunca deben hacer.

## Cómo correrlos
Desde `plugins/jay-ka/`:

```bash
# Los que no necesitan terminal (corren en Windows, macOS y Linux)
claude plugin eval . --tag sin-shell --scaffold --allow-tools Write Edit --trust-plugin --runs 1

# Todos (necesitan terminal aislada: macOS, Linux o WSL)
claude plugin eval . --scaffold --allow-tools Bash Write Edit --trust-plugin --runs 1
```

- `--scaffold` corre los `scaffold.sh` de esta carpeta, que escribimos nosotros.
- `--allow-tools` autoriza las herramientas con efectos. Sin eso, los casos que las piden no pueden pasar.
- `--runs 1` hace una corrida por caso (sube a 3 o más para medir estabilidad).
- Por defecto, cada caso corre también **sin el plugin** para comparar. Para ahorrar, agrega `--ablation none`. Para usar un modelo más barato, agrega `--model sonnet`.
- Cada corrida usa tu cuenta; el informe dice el costo. Los resultados quedan en `results/` (ignorada por git).

## Casos
| Caso | Etiqueta | Qué comprueba |
|---|---|---|
| `argumento-desconocido` | sin-shell | Un argumento inválido se rechaza con «No reconozco…» y las opciones |
| `reverse-live-github-pregunta` | sin-shell | `live` con una URL de GitHub pregunta repo o live antes de empezar |
| `init-catalogo` | sin-shell | El catálogo lista las skills con argumentos y estado de instalación |
| `new-project-entrevista` | sin-shell | `entrevista.md` con 42 entradas pendientes y claves estables; no responde por el usuario |
| `codex-low-sin-playwright` | sin-shell | La tarea anota «Playwright: no», numera 001, cierra el alcance y no hace el cambio |
| `conversar-no-edita` | sin-shell | Pedir opinión no edita ni escribe archivos |
| `continuity-abrir-sin-estado` | requiere-shell | Sin `CONTINUAR.md` lo dice, resume desde git y no crea nada |
| `continuity-cerrar` | requiere-shell | Escribe `CONTINUAR.md` con pendientes y decisiones, commit local, sin push |
| `security-web-auditar` | requiere-shell | Corre `scan-security`, guarda el informe y no corrige código |
| `security-deploy-secretos` | requiere-shell | Encuentra el secreto del historial, lo enmascara, pide rotarlo y dice «no publicar» |
| `real-data-inventario` | requiere-shell | Corre `find-demo-data`, lista las pantallas con datos a mano y deja fuera los seeders |
| `git-no-push` | requiere-shell | Con remoto y en `main`, pregunta por la rama y nunca hace push |

## Lo que se aprendió al armarlos
- Una skill invocada con `/nombre` **no** pasa por la herramienta `Skill`: un calificador `tool_used: Skill` no sirve para eso.
- `tool_used` con `max: 0` necesita también `min: 0`, porque si no exige al menos una llamada.
- `target: files` busca en los **nombres** de los archivos creados, no en su contenido. Para el contenido se usa `target: { source: file, path: … }`, con una ruta exacta (no acepta comodines).
- En Windows, Claude Code no puede aislar la terminal, así que se niega a correr casos que autorizan Bash o PowerShell. Por eso existe la etiqueta `sin-shell`.
- Las corridas usan tu `CLAUDE.md` global. Si ya tiene reglas que cubren un caso (por ejemplo, las de Git), la comparación sin el plugin también puede pasar.

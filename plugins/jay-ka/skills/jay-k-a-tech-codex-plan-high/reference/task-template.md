# Tarea {{NNN}} · {{título}}  (bloque {{n}} del plan {{ruta del plan}})

> Para Codex. Lee todo antes de empezar. Es una tarea grande con alcance cerrado. Si algo es ambiguo, **no inventes**: anótalo en «Dudas» y sigue con lo demás.

## 1. Objetivo y resultado esperado
{{Qué debe existir al terminar, descrito de arriba abajo, en lenguaje claro.}}

## 2. Contexto
- Proyecto y tecnología: {{…}}
- Documentos que debes leer primero: {{CLAUDE.md, estado, reglas de negocio, plan}}
- Decisiones ya tomadas (no las cambies): {{lista}}
- Estilo: usar los tokens y componentes existentes ({{ruta del briefing o del sistema de diseño}}). **Sin colores, tamaños ni radios sueltos.**

## 3. Especificación
### Pantalla / vista
- Ruta: {{…}}
- Secciones (de arriba abajo): {{…}}

### Campos (si hay formulario)
| Campo | Tipo | Obligatorio | Validación (en el servidor) | Mensaje de error |
|---|---|---|---|---|
| | | | | |

### Estados
- Vacío: …
- Cargando: …
- Error: …
- Éxito: …

### Acciones
| Acción | Qué hace | A dónde lleva |
|---|---|---|
| | | |

### Textos
{{Títulos, botones y mensajes exactos, o el tono a seguir.}}

## 4. Reglas
- La **validación y la lógica van en el servidor**; la pantalla solo muestra y envía.
- Reglas de negocio vigentes: {{documento}}. **No inventes reglas nuevas.**
- Pendiente de decisión (déjalo marcado, no lo resuelvas): {{lista}}

## 5. Datos
- Modelos o tablas que usa: {{…}}
- Migraciones nuevas: {{solo agregar; nunca editar las ya aplicadas}}
- Datos de ejemplo: por seeder repetible, no escritos a mano en la pantalla.

## 6. Archivos
**Puedes crear:** {{lista}}
**Puedes modificar:** {{lista}}
**No toques nada más.** Si hace falta, detente y pide permiso en el informe.

## 7. Criterios de aceptación
- [ ] {{Comprobable 1}}
- [ ] {{Comprobable 2}}
- [ ] Una prueba por cada regla importante.

## 8. Prohibido
Instalar o actualizar dependencias · tocar secretos, `.env` o variables de entorno · `git push`, PR o cambiar de rama · cambiar reglas de negocio · cambiar el estilo aprobado · editar migraciones aplicadas.

## 9. Verificación obligatoria
1. **Pruebas:** `{{comando}}`. Anota el resultado real, aunque falle.
2. **Playwright:** abre cada pantalla nueva a **375 px** y **1280 px**. Recorre el flujo completo: éxito, errores de validación, estado vacío. Guarda capturas en `docs/codex/capturas/{{NNN}}/`. Si no puedes usar Playwright, dilo; **no lo omitas en silencio**.
3. Revisa el diff antes de terminar.

## 10. Qué debes devolver
El informe en `docs/codex/resultados/{{NNN}}-{{slug}}.md`, con el formato de abajo. **No hagas commit.**

### Formato del informe
```md
# Resultado {{NNN}} · {{título}}
## Estado: hecho | hecho con observaciones | no pude terminar
## Qué construí (archivo por archivo, una línea cada uno)
## Decisiones que tomé por mi cuenta (cada una, con motivo)
## Pruebas (comando y resultado real)
## Revisión con Playwright (375 y 1280, flujo recorrido, capturas, qué vi)
## Dudas y decisiones que necesito del usuario
## Pendiente y lo que NO hice (con motivo)
## Cómo probarlo (rutas y datos de ejemplo; sin claves reales)
```

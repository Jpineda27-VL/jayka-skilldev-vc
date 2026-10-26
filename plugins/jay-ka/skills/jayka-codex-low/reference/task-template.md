# Tarea {{NNN}} · {{título corto}}

> Para Codex. Lee todo antes de empezar. Esta tarea es pequeña y de alcance cerrado.

## Qué hay que hacer
{{Una o dos frases claras.}}

## Contexto mínimo
- Proyecto: {{nombre y tecnología}}
- Pantalla o módulo afectado: {{ruta o archivo}}
- Estilo: se mantiene el existente; **no cambies colores, fuentes ni espaciados** fuera de lo pedido.
- Playwright en tu entorno: {{sí | no | no se sabe}}. Cómo levantar la app: `{{comando}}` en {{http://localhost:…}}.

## Archivos que puedes tocar
- {{ruta/archivo-1}}
- {{ruta/archivo-2}}

**No toques nada fuera de esta lista.** Si crees que hace falta, **detente** y dilo en el informe como «Necesito permiso para…».

## Criterios de aceptación
- [ ] {{Comprobable 1}}
- [ ] {{Comprobable 2}}

## Prohibido
- Instalar o actualizar dependencias.
- Tocar secretos, claves, `.env` o variables de entorno.
- Hacer `git push`, abrir PR o cambiar de rama.
- Cambiar reglas de negocio, datos de la base o migraciones ya aplicadas.
- Borrar archivos fuera de la lista.

## Verificación obligatoria
1. **Pruebas:** corre {{comando de pruebas del área}} y anota el resultado real, aunque falle.
2. **Revisión visual de** {{ruta de la pantalla}} a **375 px** y a **1280 px**:
   - **Si tienes Playwright:** ábrela a los dos tamaños, revisa que se vea bien (sin textos cortados ni desbordes) y guarda capturas en `docs/codex/capturas/{{NNN}}/`.
   - **Si no tienes Playwright:** **no lo instales** (instalar está prohibido) y **no describas pantallas que no viste**. En el informe escribe «Revisión visual: NO HECHA», el motivo, y la lista exacta de lo que hay que mirar (ruta, tamaño y qué revisar). Quien pidió la tarea hará esa revisión.
   - **Si no puedes levantar la app** (falta base de datos, variables o un servicio): escribe «No pude levantar la app» con las líneas clave del error. No intentes arreglarlo fuera de los archivos permitidos.
3. Revisa el diff antes de terminar: solo deben aparecer los archivos permitidos.

## Qué debes devolver
Un informe en `docs/codex/resultados/{{NNN}}-{{slug}}.md` con el formato de abajo. No hagas commit.

### Formato del informe
```md
# Resultado {{NNN}} · {{título}}
## Estado: hecho | hecho con observaciones | no pude terminar
## Qué cambié (archivo por archivo, una línea cada uno)
## Pruebas (comando y resultado real)
## Revisión visual: hecha con Playwright | NO HECHA (motivo) — y, si no se hizo, la lista de lo que hay que mirar
## Dudas o cosas que necesito que decidas
## Lo que NO hice y por qué
```

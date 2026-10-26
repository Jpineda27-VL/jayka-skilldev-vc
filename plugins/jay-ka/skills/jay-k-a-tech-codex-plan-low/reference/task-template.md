# Tarea {{NNN}} · {{título corto}}

> Para Codex. Lee todo antes de empezar. Esta tarea es pequeña y de alcance cerrado.

## Qué hay que hacer
{{Una o dos frases claras.}}

## Contexto mínimo
- Proyecto: {{nombre y tecnología}}
- Pantalla o módulo afectado: {{ruta o archivo}}
- Estilo: se mantiene el existente; **no cambies colores, fuentes ni espaciados** fuera de lo pedido.

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
2. **Playwright:** abre {{ruta de la pantalla}} a **375 px** y a **1280 px**, revisa que se vea bien (sin textos cortados ni desbordes) y guarda capturas en `docs/codex/capturas/{{NNN}}/`. Si Playwright no está disponible en tu entorno, dilo en el informe; **no lo omitas en silencio**.
3. Revisa el diff antes de terminar: solo deben aparecer los archivos permitidos.

## Qué debes devolver
Un informe en `docs/codex/resultados/{{NNN}}-{{slug}}.md` con el formato de abajo. No hagas commit.

### Formato del informe
```md
# Resultado {{NNN}} · {{título}}
## Estado: hecho | hecho con observaciones | no pude terminar
## Qué cambié (archivo por archivo, una línea cada uno)
## Pruebas (comando y resultado real)
## Revisión con Playwright (375 y 1280, capturas, qué vi)
## Dudas o cosas que necesito que decidas
## Lo que NO hice y por qué
```

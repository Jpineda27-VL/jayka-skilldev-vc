---
name: jay-k-a-working-rules
description: Reglas de trabajo del autor para cualquier proyecto: plan antes de construir, permisos, nada de secretos ni servicios externos tocados por el asistente, no inventar reglas de negocio, verificar antes de decir «listo» y dejar estado al cerrar.
---

# JayKA · Working Rules

Reglas de trabajo del autor, válidas para cualquier proyecto. Si una regla no es tu estilo, bórrala o cámbiala en **Mis ajustes** (esa sección manda sobre el resto).

## 1. No es «vibe coding»
No se trata de pedir «una página que funcione», copiar lo que sirva y subirlo. El orden es:
1. **Entender** qué se quiere y qué ya existe.
2. **Plan** corto, que el usuario aprueba. En trabajo grande, plan por bloques (ver `jay-k-a-plan-builder` y `jay-k-a-companion-tools` si están instaladas).
3. **Construir** en grupos pequeños, un cambio a la vez, mostrando qué cambió.
4. **Verificar** (pruebas y, si es visual, navegador).
5. **Auditar** cuando el bloque lo merezca.
6. **Commit** local (ver `jay-k-a-git-rules`).

## 2. Permisos (siempre explícitos, cada vez)
- Instalar dependencias, descargar archivos, ejecutar comandos destructivos o con efectos fuera del proyecto: pide permiso primero. Una aprobación anterior no cubre la siguiente.
- Nada se **expone, publica, despliega ni sube** sin orden del usuario.

## 3. Secretos y servicios externos: los maneja solo el usuario
- El asistente **nunca** toca claves, tokens, contraseñas reales, cuentas de terceros ni variables de entorno de producción: no las crea, no las copia, no las escribe, no las usa.
- Antes de integrar un servicio o API externos, explica qué es, para qué serviría, qué cuesta y qué riesgos tiene, y espera la decisión del usuario.
- Si hace falta una clave, di **qué** clave, **dónde** va y **cómo** la consigue el usuario. Que la ponga él.
- No copies código, endpoints ni claves de otros proyectos o de internet sin explicar de dónde vienen y sin permiso.

## 4. No inventar reglas de negocio
- Lo que no esté definido se pregunta, o se marca como pendiente o «demostración».
- Las decisiones que el usuario toma se guardan en un documento del proyecto y se respetan. No las repitas como pregunta.

## 5. Dónde vive la lógica
- La lógica de negocio va en el servidor (backend). Las pantallas solo muestran y envían.
- Nunca confíes en lo que manda el navegador: se valida otra vez en el servidor.

## 6. Verificar antes de decir «listo»
- Corre las pruebas y di el resultado real, incluso si fallan.
- Si el cambio es visual, míralo en navegador, en celular y en escritorio.
- Di qué quedó sin verificar.

## 7. Datos
- Antes de tocar la base de datos, haz un respaldo con fecha.
- Las migraciones nuevas se agregan; las ya aplicadas no se editan.
- Los datos de ejemplo salen de seeders (repetibles, solo en local), no se escriben a mano dentro de las pantallas. Lo que no está conectado a datos reales se rotula claramente.

## 8. Orden de trabajo
- Scripts largos: escríbelos en un archivo y ejecútalo (los bloques largos en línea fallan).
- Una prueba por cada regla importante.
- No cambies el estilo visual aprobado sin avisar.

## 9. Al cerrar la sesión
Deja un documento de estado: qué se hizo, qué falta y qué decisiones se tomaron. Al abrir otra sesión, léelo primero (ver `jay-k-a-continuity` si está instalada).

## Mis ajustes
<!-- Agrega, cambia o quita reglas aquí. Ejemplo: «nunca uses el puerto 3000», «los commits en inglés». -->

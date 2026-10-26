---
name: jay-k-a-project-structure
description: "Propone la jerarquía de carpetas de un proyecto según tenga solo frontend, solo backend o ambos (más docs, estado, respaldos y herramientas). Invócala con /jay-k-a-project-structure nuevo al empezar un proyecto, u «ordenar» para uno existente."
argument-hint: "[nuevo | ordenar | ver]"
disable-model-invocation: true
---

# JayKA · Project Structure

Ayuda a decidir cómo se organizan las carpetas. **Propones; no mueves ni renombras nada sin que el usuario lo apruebe.**

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jay-k-a-working-rules/reference/convenciones.md` (ruta relativa a esta skill).

| Argumento | Alias | Qué hace |
|---|---|---|
| *(vacío)* | | **Por defecto.** Si la carpeta actual tiene código (más archivos que `README`, `.git` y `.claude`), actúa como `ordenar`; si no, como `nuevo`. Dilo en una línea |
| `nuevo` | `new` | Propone el árbol para un proyecto que empieza |
| `ordenar` | `existente`, `tidy` | Mira la estructura actual y propone cambios, sin mover nada |
| `ver` | `show` | Muestra el árbol aprobado en `.claude/estructura/arbol.md`. Si no existe, lo dice |

## 1. Pregunta primero (corto, una por vez)
1. ¿Qué es? ¿Solo frontend, solo backend, o ambos? ¿Hay app móvil, panel de administración, API pública?
2. Con `ordenar`: mira la estructura actual y respétala en lo que ya funcione.
3. ¿En qué idioma van los nombres de carpetas (español o inglés)? Usa el idioma del proyecto y no mezcles.
4. ¿Un solo repositorio (monorepo) o uno por parte?

## 2. Estructuras base
Los nombres son ejemplos; adáptalos al idioma y al framework del proyecto.

**Solo frontend (sitio o app estática):**
```text
proyecto/
  src/              código
  public/           archivos estáticos
  docs/             decisiones y notas
  .claude/          estado y reglas para el asistente
```

**Solo backend (API o servicio):**
```text
proyecto/
  src/ (o app/)     código, con las reglas de negocio en servicios
  tests/            una prueba por regla importante
  database/         migraciones y seeders
  docs/
  backups/          respaldos con fecha (fuera del repositorio si pesan)
  .claude/
```

**Frontend y backend (monorepo):**
```text
proyecto/
  frontend/         lo que ve el usuario (puede tener subcarpetas: web, app, panel)
  backend/          servidor, base de datos y pruebas
  shared/           código o tipos compartidos, solo si de verdad se comparten
  design-system/    tokens (colores, fuentes), iconos, logo
  docs/
  tools/            scripts de despliegue y utilidades
  backups/
  .claude/
```

## 3. Carpeta `.claude/` (para trabajar con el asistente)
```text
.claude/
  estado/           qué está hecho, qué falta, decisiones (el punto de continuidad)
  reglas/           reglas de trabajo del proyecto
  estructura/       arbol.md (este árbol y las rutas de la app) y pantallas.md
```
Con `CLAUDE.md` en la raíz, corto, apuntando a esos documentos.

## 4. Reglas de orden
- Una carpeta, una responsabilidad. Si una carpeta mezcla dos cosas, sepáralas.
- La lógica de negocio vive en el backend; el frontend solo muestra y envía.
- Lo que no debe subirse al repositorio va en `.gitignore`: secretos, respaldos pesados, archivos subidos por usuarios, dependencias.
- Nombres de archivos y rutas en minúsculas, sin espacios ni acentos; si el proyecto usa español, hazlo igual en todo.
- Las rutas de la app se documentan en un solo lugar (`.claude/estructura/arbol.md`).
- Archivos grandes de datos o respaldos: fuera del código.

## 5. Entrega
1. Muestra el árbol propuesto y por qué (3 líneas).
2. Si el proyecto ya existe, lista qué se movería y espera la aprobación. Mover archivos se hace con Git (`git mv`) y en un commit aparte.
3. Si es nuevo, crea las carpetas solo después de que el usuario apruebe.
4. Deja el árbol aprobado escrito en `.claude/estructura/arbol.md`.

## Terminado cuando
- El árbol aprobado está en `.claude/estructura/arbol.md`.
- Con `nuevo`: existen las carpetas aprobadas y ninguna más.
- Con `ordenar`: cada movimiento aprobado se hizo con `git mv` en un commit aparte, y después el proyecto sigue arrancando (pruebas o compilación corridas, con su resultado). Lo no aprobado quedó igual.

## Mis ajustes
<!-- Tus nombres favoritos de carpetas, por ejemplo interfaz/ y servidor/, o tu propia convención. -->

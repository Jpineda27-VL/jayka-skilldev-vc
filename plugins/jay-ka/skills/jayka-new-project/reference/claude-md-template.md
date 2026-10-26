# {{nombre del proyecto}}

{{Qué es, en una frase (`proyecto.frase`).}}

## Leer primero
1. `.claude/estado/CONTINUAR.md`: dónde quedó el trabajo.
2. `docs/proyecto/informe-inicial.md`: qué está definido y qué falta.
3. {{documento de reglas de negocio, si existe}}

## Stack
- Frontend: {{`tecnologia.frontend` o «por definir»}}
- Backend: {{`tecnologia.backend` o «por definir»}}
- Base de datos: {{`tecnologia.base-de-datos` o «por definir»}}
- Plataforma principal: {{`tecnologia.plataforma`}}

## Comandos
```text
{{instalar}}
{{levantar}}
{{pruebas}}
```

## Reglas del proyecto
- Idioma del código y de los textos: {{…}} (`alcance.idiomas`)
- Lo que falta decidir del negocio está en «Falta para arrancar bien» del informe inicial.
- Rutas de documentos según `jayka-working-rules/reference/convenciones.md`.
- {{Reglas propias que el usuario haya pedido (`calidad.forma-de-trabajo`).}}

## Dónde está cada cosa
- Estructura aprobada: `.claude/estructura/arbol.md`
- Estilo aprobado: `docs/proyecto/estilo.md` {{cuando exista}}
- Planes: `docs/planes/`

{{Si el usuario lo aprueba: aquí va el bloque de reglas base, con sus marcas, tal como lo pone `/jayka-menu instalar-reglas proyecto`.}}

<!-- Mantén este archivo corto (menos de 40 líneas): es lo primero que se lee en cada sesión. El detalle va en docs/. -->

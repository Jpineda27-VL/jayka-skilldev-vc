# Checklist de paridad (por pantalla)

Marca cada punto en **los dos** frontends.

## Datos y reglas
- [ ] Los datos salen del mismo servicio o API (misma forma).
- [ ] No hay cálculos ni validaciones únicas en el frontend (todo se valida también en el servidor).
- [ ] No quedan datos de demostración escritos a mano.

## Contenido
- [ ] Mismos títulos, subtítulos, botones y mensajes.
- [ ] Mismo orden de secciones.
- [ ] Mismos formatos (dinero, fechas, teléfonos, unidades).

## Estados
- [ ] Vacío (con mensaje y acción).
- [ ] Cargando (sin vaciar la pantalla al refrescar).
- [ ] Error de red o servidor.
- [ ] Error de validación (mensaje junto al campo).
- [ ] Éxito (confirmación).
- [ ] Desactivado y agotado, si aplica.

## Estilo
- [ ] Mismos tokens: colores, tipografía, espaciados, radios, sombras.
- [ ] Mismos nombres de rol de color (`primario`, `acento`…), no valores sueltos.
- [ ] Textos en unidades relativas; sin textos cortados a 375 px.
- [ ] Contraste AA; foco visible; áreas táctiles de 44 px.

## Navegación y comportamiento
- [ ] El enlace «volver» lleva al mismo sitio.
- [ ] Las acciones llevan a la misma pantalla de destino.
- [ ] Las fotos cargan por la misma regla de dirección.
- [ ] Sin parpadeo al refrescar; sin recarga completa en uno y parcial en otro.

## Verificación
- [ ] Probado en escritorio (1280 px) y celular (375 px).
- [ ] Recorrido con datos reales, vacío y error.
- [ ] Si una app se exporta o compila: vuelta a exportar y probada la versión nueva.
- [ ] Pruebas del servidor en verde.
- [ ] Inventario actualizado.

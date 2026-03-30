# QA Sprint 5.2 - Matriz de Regresion

## Objetivo

Cubrir flujos criticos de negocio y gamificacion para detectar regresiones antes del piloto.

## Flujos criticos

1. Autenticacion
- [ ] Login exitoso con credenciales validas.
- [ ] Mensaje de error claro con credenciales invalidas.

2. Dashboard
- [ ] Carga de perfil (saldo/xp/nivel) sin errores en consola.
- [ ] Widget de tasa muestra valor y no rompe layout.
- [ ] Widget combinado nivel/racha renderiza datos.

3. Misiones y recompensas
- [ ] Abrir modal de misiones desde dashboard.
- [ ] Avanzar mision actualiza progreso.
- [ ] Reclamar mision acredita XP y actualiza estado.

4. Notificaciones
- [ ] Se muestran notificaciones existentes.
- [ ] Tipos especiales visibles: `reward_ready`, `streak_warning`.
- [ ] Manejo correcto de bandeja vacia.

5. Niveles
- [ ] Pagina de niveles carga perfil y progreso.
- [ ] Seccion de recompensas pendientes/reclamadas visible.
- [ ] Boton actualizar recompensas responde.

6. Mobile UX
- [ ] Dashboard usable en 390x844.
- [ ] Widget de tasa sin clipping en mobile.
- [ ] Pagina niveles usable en mobile.

## Automatizacion incluida en Sprint 5.2

Pruebas Playwright:
- `tests/e2e/sprint5_2.smoke.spec.ts`
  - Smoke principal: login -> dashboard -> misiones -> claim -> notificaciones.
  - Smoke mobile: dashboard + niveles en viewport movil.

## Ejecucion

1. Instalar browsers Playwright (una sola vez):
- `npx playwright install chromium`

2. Ejecutar smoke:
- `npm run e2e:smoke`

3. Ejecutar smoke en UI (debug local):
- `npm run e2e:smoke:headed`

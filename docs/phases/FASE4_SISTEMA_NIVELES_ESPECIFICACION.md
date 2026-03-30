# Fase 4 - Sistema de Niveles (Definicion Completa)

## 1) Objetivo de negocio

Convertir el sistema de niveles en un motor de retencion semanal y recurrencia de uso.

Resultados esperados:
- Aumentar misiones completadas por usuario activo.
- Aumentar retencion a 7 dias en usuarios con nivel >= 2.
- Mantener estabilidad de la economia de XP sin exploits criticos.

## 2) Alcance funcional (in scope)

1. Misiones semanales dinamicas
- Rotacion semanal automatica de misiones.
- Dificultad por segmento de usuario (nuevo, intermedio, avanzado).
- Fecha de expiracion y contador de tiempo restante.

2. Rachas (streaks)
- Racha diaria y semanal por actividad valida.
- Multiplicador de XP por continuidad.
- Regla de proteccion: 1 "escudo" de racha por semana.

3. Recompensas reclamables
- Hitos por nivel y por streak.
- Flujo de claim manual (no auto-otorgar en silencio).
- Registro de historial de recompensas reclamadas.

4. Balance y control de economia
- Limites diarios por tipo de accion para XP.
- Reglas anti-abuso de frecuencia por ventana de tiempo.
- Parametros configurables sin tocar codigo (tabla de config).

5. Observabilidad de gamificacion
- Metricas de conversion de mision a compra.
- XP promedio diario y por cohorte.
- Retencion 1/7 dias en usuarios activos.

## 3) Fuera de alcance (out of scope)

- Marketplace completo de recompensas fisicas.
- Temporadas ranked completas con reset global.
- Integraciones externas de analitica avanzada (Mixpanel, Amplitude, etc.).

## 4) Reglas de producto (cerradas)

1. Ciclo semanal
- Ventana semanal: lunes 00:00 a domingo 23:59 (zona America/Caracas, ajustable).
- Al iniciar nueva semana, se generan nuevas misiones y se archivan no reclamadas.

2. Segmentacion de misiones
- Nuevo: prioriza onboarding y primeras compras.
- Intermedio: combina frecuencia de uso + consumo de servicios.
- Avanzado: objetivos de volumen y consistencia.

3. Reglas de streak
- Se considera dia valido con al menos 1 accion elegible.
- Si no hay accion valida, la racha se rompe.
- Si tiene escudo disponible, conserva racha una sola vez por semana.

4. Claim de recompensas
- Recompensas por hitos quedan en estado "pendiente" hasta claim.
- Si una recompensa expira, pasa a "vencida" y no suma beneficio.

5. Limites XP
- Tope diario por tipo de evento (recarga, compra, transferencia, mision).
- Tope global diario por usuario.

## 5) Diseno tecnico backend

## 5.1 Servicios nuevos

1. missionRotationService
- Genera misiones semanales por plantilla y segmento.
- Evita duplicados activos por usuario y semana.

2. streakService
- Calcula continuidad diaria/semanal.
- Aplica multiplicadores y consume escudo cuando corresponda.

3. rewardClaimService
- Expone claim idempotente de recompensas.
- Registra auditoria y evita doble cobro.

4. gamificationMetricsService
- Agrega eventos para panel interno de metrica basica.

## 5.2 Tablas sugeridas (Supabase/PostgreSQL)

1. user_weekly_missions
- id, user_id, week_key, mission_code, segment, progress_current, progress_target,
  xp_reward, status(active|completed|claimed|expired), expires_at, created_at, updated_at

2. user_streaks
- user_id (pk), current_daily_streak, best_daily_streak, current_weekly_streak,
  weekly_shield_available, last_qualified_at, updated_at

3. reward_claims
- id, user_id, reward_type(level|streak|mission), reward_ref, reward_value_json,
  status(pending|claimed|expired), claimed_at, expires_at, created_at

4. gamification_config
- key (pk), value_json, enabled, updated_at

5. gamification_events
- id, user_id, event_type, event_payload_json, xp_delta, created_at

## 5.3 Endpoints API (v1)

1. GET /api/gamification/missions/weekly
- Retorna misiones activas de la semana + tiempo restante.

2. POST /api/gamification/missions/:id/claim
- Reclama recompensa de mision completada.

3. GET /api/gamification/streak
- Estado de racha diaria/semanal y escudo.

4. POST /api/gamification/rewards/:id/claim
- Reclama recompensa pendiente (nivel/racha/mision).

5. GET /api/gamification/config/public
- Parametros visibles para frontend (solo lectura).

6. GET /api/gamification/metrics/summary
- Resumen para dashboard interno (solo admin).

## 5.4 Garantias tecnicas

- Idempotencia en endpoints de claim (token o unique constraints).
- Transacciones DB para otorgamiento de XP + reward.
- Validacion server-side de topes y reglas de streak.
- Registro de eventos para trazabilidad.

## 6) Diseno tecnico frontend

1. Dashboard
- Widget de misiones semanales con countdown.
- Widget de racha (estado actual, mejor racha, escudo).
- CTA de claim visible cuando exista recompensa pendiente.

2. Pagina de niveles
- Seccion de recompensas pendientes/reclamadas.
- Timeline de hitos de nivel con estado.

3. Notificaciones
- Tipo nuevo: reward_ready
- Tipo nuevo: streak_warning (riesgo de perder racha)

4. Estado cliente
- Extender userStore con:
  - weeklyMissions
  - streakStatus
  - pendingRewards
  - gamificationConfig

5. UX
- Estados de carga/esqueleto por widget.
- Mensajeria de errores local (sin romper dashboard completo).
- Diseño consistente con brutalist actual y contraste AA minimo.

## 7) Seguridad y anti-fraude

- Rate-limit en endpoints de claim.
- Validacion de origen de evento XP (solo eventos backend autorizados).
- Deteccion basica de patrones anormales (picos de XP por ventana).
- Auditoria de reward_claims y gamification_events.

## 8) Plan por sprints

Sprint 4.1 (Infra y reglas base)
- Migraciones DB + tablas nuevas.
- Servicios backend de rotacion, streak y claim.
- Endpoints basicos de misiones y streak.
- Integracion minima en dashboard (lectura).

Sprint 4.2 (Claims y experiencia usuario)
- Flujo completo de claim de mision/recompensa.
- Widget de racha y seccion recompensas en niveles.
- Notificaciones reward_ready y streak_warning.

Sprint 4.3 (Metrica y balance)
- Metricas resumen admin.
- Parametros en gamification_config.
- Ajuste de economia XP con datos reales.

Sprint 4.4 (Hardening tecnico)
- Rate limit en endpoints criticos de progreso y claim.
- Pruebas automaticas de servicios criticos (claim/streak).
- Cierre de checklist DoD tecnico con evidencia de build + test.

## 9) Criterios de aceptacion (DoD)

Funcionales:
- Misiones semanales rotan automaticamente sin duplicados activos.
- Rachas se calculan correctamente durante 14 dias de prueba.
- Claims no permiten doble cobro.

Tecnicos:
- 0 errores criticos de build y runtime en flujos nuevos.
- Cobertura de pruebas minima en servicios criticos (claim/streak).
- Trazabilidad completa en eventos de XP/recompensas.

Estado de implementacion (2026-03-29):
- Build frontend y backend sin errores criticos en flujos de Fase 4.
- Pruebas automatizadas base en backend para claimReward y getStreak.
- Rate limiting activo en endpoints de progreso/claim de gamificacion.

Negocio:
- +15% misiones completadas por WAU.
- +10% retencion 7 dias en nivel >= 2.

## 10) Dependencias y riesgos

Dependencias:
- Definicion final de parametros de XP por producto.
- Disponibilidad de tabla/roles admin para metrics endpoint.

Riesgos:
- Inflacion de XP por reglas demasiado permisivas.
- Friccion de UX si hay demasiados claims manuales.
- Complejidad de sincronizacion si no se centraliza en backend.

Mitigaciones:
- Topes diarios globales + por evento.
- Balance semanal guiado por metricas.
- Endpoints idempotentes con constraints unicas.

## 11) Checklist de entrada a implementacion

- Reglas de negocio validadas por producto.
- Esquema de tablas aprobado.
- Contratos API cerrados.
- KPIs y dashboard minimo definidos.
- Priorizacion de sprint 4.1 confirmada.

Cuando este checklist este en verde, se pasa a modo implementacion.

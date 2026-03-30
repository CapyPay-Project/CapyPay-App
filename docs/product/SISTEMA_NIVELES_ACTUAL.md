# Sistema de Niveles Actual (Definicion Unificada)

Documento canónico del sistema de niveles/gamificación vigente tras cierre de Fase 6.

## Gobierno documental

- Este es el único documento de referencia funcional vigente para el sistema de niveles.
- Documentos de fases anteriores o anexos v1 se conservan solo como historial de decisiones y evidencia.
- Si existe conflicto entre documentos, prevalece este documento.

## 1) Estado actual

El sistema está activo y estable, con validación técnica de regresión:

- Backend tests: 22/22 en verde.
- Build frontend: en verde.
- Smoke E2E: 2/2 en verde.

Cobertura funcional actual:

- Niveles por XP con curva versionada.
- Misiones semanales segmentadas.
- Rachas (streak) y recompensas reclamables.
- Control anti-abuso con riesgo adaptativo.
- Instrumentación A/B para experimentos de UX.
- Resumen semanal en dashboard/niveles/notificaciones.

## 2) Objetivo del sistema

Incrementar retención y recurrencia de uso de CapyPay mediante progresión clara, recompensas controladas y reglas configurables sin cambios frecuentes de código.

## 3) Componentes funcionales

1. Progresión por niveles:
- El usuario acumula XP por eventos válidos.
- El nivel y beneficios se derivan de una curva configurable.

2. Misiones semanales:
- Se generan por semana y por segmento de usuario.
- Flujo: progreso -> completada -> reclamada.

3. Rachas:
- Seguimiento diario/semanal de actividad.
- Señalización de riesgo de pérdida de racha.

4. Recompensas:
- Estado pending/claimed/expired.
- Claim idempotente y auditado.

5. Segmentación:
- Segmentos por umbral de XP (nuevo/intermedio/avanzado).
- Persistencia de contexto de segmento por semana.

6. Anti-abuso:
- Score de riesgo por ventana temporal.
- Límites adaptativos por nivel de riesgo.
- Overrides manuales (allow/block) para operación.

7. Experimentación:
- Asignación determinista de variante.
- Tracking de eventos de conversión por experimento.

8. Resumen semanal UX:
- Bloque consolidado con progreso, racha y siguiente acción sugerida.
- Reduce ruido al priorizar contexto accionable.

## 4) Reglas vigentes (v1)

### 4.1 Curva de niveles

Referencia completa: BALANCE_NIVELES_V1.md.

Niveles activos:

- Novato (Cachorro): 0-500 XP
- Bachiller: 501-2000 XP
- Licenciado: 2001-5000 XP
- Magister: 5001-10000 XP
- Doctor: 10001-20000 XP
- Capy Legend: 20001+ XP

### 4.2 Topes de XP (caps)

- perEvent.recharge: 100
- perEvent.transfer: 50
- perEvent.comedor_purchase: 120
- perEvent.cantina_purchase: 120
- perEvent.mission: 150
- perEvent.reward: 150
- dailyGlobal: 400

### 4.3 Segmentación de misiones

Referencia completa: SEGMENTACION_MISIONES_V1.md.

- nuevo: 0-199 XP
- intermedio: 200-899 XP
- avanzado: 900+ XP

Reglas:

- Siempre incluir misiones globales.
- Agregar misiones específicas del segmento cuando aplique.
- Fallback seguro a global si faltan datos.

## 5) Arquitectura de datos

Tablas principales:

- gamification_config
- gamification_events
- user_weekly_missions
- user_streaks
- reward_claims

Soporte:

- profiles (XP de usuario)
- notifications (eventos visibles al usuario)

## 6) Endpoints activos de gamificación

- GET /api/gamification/missions/weekly
- GET /api/gamification/summary/weekly
- POST /api/gamification/missions/:id/progress
- POST /api/gamification/missions/:id/claim
- GET /api/gamification/streak
- GET /api/gamification/rewards
- POST /api/gamification/rewards/:id/claim
- GET /api/gamification/config/public
- GET /api/gamification/metrics/summary
- GET /api/gamification/experiments/assign
- POST /api/gamification/experiments/track
- GET /api/gamification/risk/summary (operación)
- POST /api/gamification/risk/review/:userId/override (operación)

## 7) UX actual por pantalla

1. Dashboard:
- Widget de misiones.
- Segmento activo visible.
- Modal de misiones con contexto de segmento.
- Tracking de eventos de experimento.

2. Niveles:
- Contexto de segmento.
- Resumen semanal (avance, reclamos, racha, tiempo restante).
- Recompensas pendientes/reclamadas.

3. Notificaciones:
- Bandeja de eventos.
- Resumen semanal compacto para reducir ruido.

## 8) Observabilidad y operación

- Métricas y salud en /ops.
- Eventos de riesgo y auditoría en gamification_events.
- Runbook anti-abuso: docs/pilot/FASE6_S63_RUNBOOK_ANTI_ABUSO.md.

## 9) Evidencia de calidad

- Tests backend para claim, caps, segmentación, riesgo, experimentos y resumen semanal.
- Smoke E2E de flujo principal y validación mobile.

## 10) Alcance no cubierto aún

- Promoción automática de variante ganadora de A/B.
- Agregación diaria histórica de KPIs por variante.
- Simulador de impacto de cambios de reglas antes de publicar config.
- Umbrales anti-abuso específicos por segmento.
- Mecánica de temporadas sobre progresión permanente.

Estos puntos están registrados en el backlog de Fase 7.

## 11) Referencias fuente

- docs/phases/FASE4_SISTEMA_NIVELES_ESPECIFICACION.md (base histórica)
- docs/phases/archive/fase6/FASE6_ANEXO_PLAN_EJECUTABLE.md
- docs/phases/archive/fase6/FASE6_ANEXO_BACKLOG.md
- docs/phases/archive/fase6/FASE6_ANEXO_RESULTADOS.md
- docs/product/BALANCE_NIVELES_V1.md
- docs/product/SEGMENTACION_MISIONES_V1.md
- ../capypay-backend/README.md (API/operación)

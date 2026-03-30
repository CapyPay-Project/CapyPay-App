# Fase 7.4 - Calibracion de alertas operativas (S74-003)

Fecha: 2026-03-30
Estado: COMPLETADO

## Objetivo

Ajustar umbrales de alertas operativas con base en evidencia de carga inicial (spike/soak) para reducir falsos positivos y mejorar deteccion temprana de degradacion real.

## Cambios implementados

Archivo de implementación:

- `capypay-backend/src/middleware/observability.js`

Mejoras introducidas:

1. Umbrales por severidad (warning/critical) para error rate y p95.
2. Compatibilidad con variables legacy (`OPS_ALERT_ERROR_RATE_THRESHOLD`, `OPS_ALERT_P95_MS_THRESHOLD`).
3. Escalamiento inmediato a critical aunque exista cooldown activo (evita perder alertas graves).
4. Endpoint `/ops/alerts/status` ahora expone `lastSeverity` y estructura de `thresholds`.
5. Webhook de alerta incluye severidad en el payload textual.

## Umbrales calibrados (default)

- Error rate warning: 3% (`0.03`)
- Error rate critical: 5% (`0.05`)
- Latencia p95 warning: 1200 ms
- Latencia p95 critical: 1600 ms
- Min requests para evaluar: 30
- Cooldown entre alertas: 300s

Variables de entorno soportadas:

- `OPS_ALERT_ERROR_RATE_WARNING_THRESHOLD`
- `OPS_ALERT_ERROR_RATE_CRITICAL_THRESHOLD`
- `OPS_ALERT_P95_MS_WARNING_THRESHOLD`
- `OPS_ALERT_P95_MS_CRITICAL_THRESHOLD`
- `OPS_ALERT_MIN_REQUESTS`
- `OPS_ALERT_COOLDOWN_SEC`
- `OPS_ALERT_WEBHOOK_URL`

## Racional de calibracion

Basado en `FASE7_ANEXO_S74_CARGA_INICIAL.md`:

- Spike inicial: p95 ~1791 ms con error rate 0%.
- Soak inicial: p95 ~1039 ms con error rate 0%.

Decision:

1. Warning p95 en 1200 ms para capturar degradacion por encima de soak sin alertar ruido base.
2. Critical p95 en 1600 ms para reflejar degradacion severa alineada a picos tipo spike.
3. Error rate warning/critical en 3%/5% para mantener sensibilidad operativa sin sobrealerta.

## Validacion

- Suite backend en verde tras cambio: `npm test` (30/30 pass).
- Pruebas unitarias actualizadas en `src/middleware/observability.test.js` para `warning` y `critical`.

## Resultado

S74-003 queda completado con configuración operativa calibrada y verificable por endpoint.

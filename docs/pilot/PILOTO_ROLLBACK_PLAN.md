# Piloto - Plan de Rollback

## Objetivo

Desactivar rapido el piloto de gamificacion en caso de degradacion o riesgo de negocio.

## Triggers de rollback

1. Error rate API > 5% durante 15 min.
2. p95 > 1500 ms sostenido durante 15 min.
3. Duplicidad de recompensas detectada.
4. Incidente de seguridad o integridad de datos.

## Rollback rapido (sin despliegue)

1. Desactivar piloto:
- `PILOT_ENABLED=false`
- Reiniciar backend.

2. Confirmar estado:
- `GET /ops/pilot/status` -> `enabled: false`
- `GET /ops/health` -> status `ok`

3. Monitorear estabilizacion:
- Revisar `/ops/metrics` y alertas por 30 min.

## Rollback de emergencia (si persiste degradacion)

1. Mantener `PILOT_ENABLED=false`.
2. Forzar `PILOT_ROLLOUT_PERCENT=0`.
3. Reiniciar backend y validar:
- Health OK
- Error rate en descenso

## Checklist de verificacion post-rollback

- [ ] API estable en 30 min.
- [ ] No nuevos incidentes P1/P2.
- [ ] QA smoke critico ejecutado.
- [ ] Equipo notificado del estado final.

## Registro de evento

- Fecha/hora rollback: __________
- Responsable: __________
- Trigger aplicado: __________
- Resultado: __________

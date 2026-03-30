# Fase 8 - Documento maestro

Fecha de consolidacion: 2026-03-30
Estado: PLANIFICADA

## Objetivo

Redisenar el sistema visual y funcional de misiones, nivel y racha para:

1. Mantener una estetica coherente con el dashboard.
2. Priorizar informacion util para usuarios ordinarios.
3. Hacer funcional y transparente la logica de rachas academicas.
4. Reducir exposicion de datos en consola del navegador.

## Alcance funcional

1. Rediseno del widget de misiones.
2. Rediseno del widget conjunto nivel + racha.
3. Rediseno de la vista `/account/niveles` como panel funcional.
4. Reorganizacion de misiones por tipo dentro del modal.
5. Implementacion visual y funcional de calendario de rachas.
6. Limpieza de logs y datos sensibles en consola cliente.

## Principios UX de la fase

1. No mostrar detalles tecnicos de segmentacion/cache al usuario final.
2. Mostrar progreso y proxima accion de forma clara y llamativa.
3. Limitar complejidad visual a 1-2 widgets principales en `/account/niveles`.
4. Mantener consistencia con el lenguaje visual de widgets existentes.

## KPIs objetivo de Fase 8

1. Reduccion de ruido visual tecnico en widgets de misiones: 100%.
2. Tiempo de comprension de estado de nivel/racha en dashboard: mejora observable en pruebas UX.
3. Interacciones exitosas en calendario de racha (seleccion de dia + detalle de misiones): >= 95% en QA funcional.
4. Eventos de datos sensibles en consola cliente en modo normal: 0.

## Estructura de ejecucion

- Sprint 8.1: Sistema visual unificado.
- Sprint 8.2: Modal de misiones por tipo + animaciones.
- Sprint 8.3: Motor de rachas academico (escudos + dias ignorados).
- Sprint 8.4: Rediseno funcional de `/account/niveles`.
- Sprint 8.5: Hardening de privacidad y limpieza de consola.

## Entregables mayores

1. Widget de misiones redisenado y modal por tipos.
2. Widget de nivel + racha con mejor narrativa visual.
3. Panel `/account/niveles` funcional con selector de nivel y calendario de rachas.
4. Logica de racha con exclusion de fines de semana y feriados.
5. Politica de logging cliente segura por entorno.

## Riesgos principales

1. Sobrecarga de alcance UI + logica en la misma fase.
2. Ambiguedad en reglas academicas de feriados por region.
3. Regresion de performance por animaciones y nuevos componentes.

## Mitigaciones

1. Entregar por sprints pequenos y con feature flags.
2. Definir fuente unica de feriados por entorno.
3. Medir web-vitals antes/despues por vista critica.

## Anexos oficiales

- `archive/fase8/FASE8_ANEXO_PLAN_EJECUTABLE.md`
- `archive/fase8/FASE8_ANEXO_BACKLOG.md`
- `archive/fase8/FASE8_ANEXO_RESULTADOS.md`

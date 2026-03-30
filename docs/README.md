# Guía de Documentación del Equipo

## Objetivo

Mantener la raíz del proyecto limpia y toda la documentación en un único lugar.

## Regla principal

No crear archivos `.md` en la raíz del proyecto, salvo:
- `README.md`
- `WARP.md`

Todo documento nuevo debe vivir dentro de `docs/`.

## Estructura obligatoria

- `docs/phases/`: planificación y estado por fases/sprints.
- `docs/product/`: roadmap, decisiones de producto, manifiestos.
- `docs/qa/`: matrices de regresión, planes de prueba, evidencias QA.
- `docs/pilot/`: plantillas KPI, go/no-go, rollback y operación de piloto.

Documento canónico del sistema de niveles actual:

- `docs/product/SISTEMA_NIVELES_ACTUAL.md`

Backlog de evolución siguiente:

- `docs/phases/archive/fase7/FASE7_ANEXO_BACKLOG_INICIAL.md`
- `docs/phases/archive/fase7/FASE7_ANEXO_PLAN_EJECUTABLE.md`
- `docs/phases/archive/fase7/FASE7_ANEXO_BACKLOG.md`

Documento recomendado para onboarding:

- `docs/product/GUIA_GENERAL_PROYECTO.md`: visión general del ecosistema CapyPay, setup y flujos de trabajo para nuevos miembros.

## Convención de nombres

- Usar MAYÚSCULAS con guion bajo para documentos clave de proceso.
- Usar prefijos por tema cuando aplique:
  - `FASE*`, `QA_*`, `PILOTO_*`.

## Checklist antes de hacer commit

1. ¿El `.md` nuevo está dentro de `docs/`?
2. ¿Actualizaste enlaces/rutas si moviste archivos?
3. ¿El `README.md` principal sigue apuntando al lugar correcto?

## Nota de mantenimiento

Si por una urgencia creas un `.md` temporal en raíz, muévelo a `docs/` antes de cerrar el PR.

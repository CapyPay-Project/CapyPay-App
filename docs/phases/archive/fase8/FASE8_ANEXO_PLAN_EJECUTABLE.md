# Fase 8 - Anexo plan ejecutable

Documento operativo detallado para implementacion de Fase 8.

Estado general de fase: DONE

## Sprint 8.1 - Sistema visual unificado

Estado: DONE

### Objetivo - Sprint 8.1

Alinear widgets de misiones y nivel/racha al estilo del dashboard.

### Tareas tecnicas - Sprint 8.1

1. Definir layout base y jerarquia visual comun para ambos widgets.
2. Quitar de la vista principal datos tecnicos: segmento, reglas, modo cache.
3. Estandarizar estados de carga, exito y degradado.
4. Revisar responsive en desktop y mobile.

### Criterios de aceptacion - Sprint 8.1

- [x] Ambos widgets se perciben del mismo sistema visual.
- [x] No hay texto tecnico visible para usuario final.
- [x] La composicion respeta escala tipografica y espaciado del dashboard.

## Sprint 8.2 - Modal de misiones por tipo + animaciones

Estado: DONE

### Objetivo - Sprint 8.2

Convertir el modal en un centro de accion claro y atractivo.

### Tareas tecnicas - Sprint 8.2

1. Reorganizar misiones por tipo:
   - generales
   - diarias
   - semanales
   - acumulables
   - de racha
   - repetibles
2. Agregar varias misiones por cada tipo.
3. Implementar barra de progreso con animacion de entrada y actualizacion.
4. Mantener coherencia con animacion de progreso del sistema de niveles.
5. Mejorar UX mobile del modal para reducir saturacion visual (filtros en carrusel horizontal).

### Criterios de aceptacion - Sprint 8.2

- [x] Misiones visibles y filtrables por tipo.
- [x] Barra de progreso animada al cargar pagina y al ganar xp/progreso.
- [x] Sin elementos tecnicos visibles en modal.
- [x] En mobile, filtros navegables horizontalmente sin saturar el alto del modal.

## Sprint 8.3 - Motor de rachas academico

Estado: DONE

### Objetivo - Sprint 8.3

Hacer funcional la racha con reglas universitarias y escudos.

### Tareas tecnicas - Sprint 8.3

1. Excluir fines de semana del calculo de racha.
2. Excluir feriados configurables por calendario academico.
3. Implementar estados de dia:
   - activo
   - protegido por escudo
   - inactivo
   - ignorado
4. Implementar consumo correcto de escudos en dias academicos validos.

### Criterios de aceptacion - Sprint 8.3

- [x] La racha no se rompe por fin de semana o feriado.
- [x] El uso de escudos es auditable y consistente.
- [x] Estados de dia son correctos en API y UI.

## Sprint 8.4 - Rediseno funcional de /account/niveles

Estado: DONE

### Objetivo - Sprint 8.4

Transformar la vista en panel de control real con maximo 1-2 widgets.

### Tareas tecnicas - Sprint 8.4

1. Construir selector de niveles funcional.
2. Al seleccionar nivel, mostrar:
   - xp actual del usuario
   - xp objetivo del nivel
   - beneficios del nivel
   - icono representativo
3. Pulir/eliminar apartados actuales de recompensas y segmentos.
4. Sustituir por calendario de racha con detalle por dia.
5. Al seleccionar dia, mostrar misiones completadas ese dia.

### Criterios de aceptacion - Sprint 8.4

- [x] Selector de niveles funcional y estable.
- [x] Informacion de nivel centrada en un widget principal.
- [x] Calendario de racha funcional en segundo widget (si aplica).
- [x] Detalle diario de misiones visible y correcto.

## Sprint 8.5 - Privacidad y consola limpia

Estado: DONE

### Objetivo - Sprint 8.5

Eliminar fugas de datos en cliente durante interacciones de misiones/niveles.

### Tareas tecnicas - Sprint 8.5

1. Eliminar logs de payloads sensibles en dashboard, modal y niveles.
2. Mantener logs tecnicos solo en modo debug controlado.
3. Revisar wrappers de API y eventos UI para evitar dumps de objetos de usuario.
4. Agregar checklist de seguridad de consola en QA.

### Criterios de aceptacion - Sprint 8.5

- [x] Consola limpia en modo normal.
- [x] No se exponen datos de usuario en logs cliente.
- [x] Modo debug controlado por flag explicita.

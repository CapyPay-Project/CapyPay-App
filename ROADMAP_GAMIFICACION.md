# 🗺️ Roadmap de Gamificación & Comedor (V2)

## 📌 Corto Plazo (Sprint Actual)

- Finalizar UI y conexión de **Ranking de Influencia** con Supabase.
- Asegurar PC-First (Diseño Desktop principal).
- Eliminar placeholders estáticos y confirmar actualización. (Realizado)
- Solucionar bugs visuales como el solapamiento del título principal. (Realizado)

## ⏳ Mediano Plazo

- **Niveles de Usuario**: Integrar mecánica de niveles y avatars basados en XP total.
- **Logros/Misiones**: Permitir completar misiones (ej. "Compra 3 veces en Cantina Ingeniería") para ganar _Ranking Points_.
- **Batalla de Facultades**: Expandir detalles de progreso y animaciones de Facultad.
- **Integración con Comedores/Cantinas**: Conectar la compra en menú simulado con la adjudicación automática de XP.

## 🚀 Largo Plazo

- **Mobile First / Responsive**: Adaptar toda la UI Neo-Brutalista a móvil sin perder rendimiento.
- **Widgets de Dashboard**: Reincorporar las estadísticas resumidas (Ranking, Nivel y próximos logros) directamente en el inicio del Dashboard PC.
- **Tienda de Recompensas**: Opción de canjear _Baras_ por recompensas físicas o merch.

## ✅ Fase 3 (Widgets + Notificaciones) - Implementada

- **Notificación de subida de nivel** en backend para eventos de XP:
	- Recarga
	- Transferencia
	- Compra en comedor
	- Recompensa por misión completada
- **Widget de Misiones mejorado** con beneficios activos:
	- Chip de descuento aplicado por nivel
	- Chip de estado VIP activo
- **Dashboard reactivo de nivel**:
	- Actualización de nivel y barra de progreso desde el store
	- Refresco automático de notificaciones al subir de nivel
	- Polling ligero de notificaciones cada 30 segundos

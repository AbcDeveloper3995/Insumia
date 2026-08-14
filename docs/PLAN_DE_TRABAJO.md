# 🚀 Próximos Pasos y Plan de Trabajo - Insumia

Este documento establece la hoja de ruta técnica y de funcionalidades para llevar a Insumia al siguiente nivel. El enfoque de esta fase es **pulir el núcleo actual** antes de escalar horizontalmente a múltiples sucursales o puntos de venta avanzados.

---

## 1. Módulo de Producción (Stock de Subrecetas)
**Problema:** Actualmente, las subrecetas sirven exclusivamente para calcular el costo teórico. Sin embargo, en la cocina real, el chef prepara tandas (ej. 10 litros de salsa) y las almacena físicamente.
**Solución a implementar:**
- Agregar una sección de "Producción" dentro del Inventario.
- Botón **"Producir Lote"** en la vista de Subrecetas.
- Al confirmar la producción, el sistema restará automáticamente los ingredientes base (tomate, cebolla) y creará un "Stock Procesado" de la salsa producida.
- Permitir mermas y ajustes de este stock preparado.

## 2. Historial de Variación de Costos (Tracker de Inflación)
**Problema:** Los precios de los proveedores fluctúan constantemente. El dueño no tiene visibilidad de qué tanto han subido sus costos a lo largo del año sin revisar facturas viejas.
**Solución a implementar:**
- Gráfico de tendencia de precios integrado en el modal de **Detalles del Insumo**.
- Cada vez que se registre una compra de un insumo a un precio distinto, se creará un punto en el historial.
- Alerta inteligente en el Centro de Alertas si el costo de un ingrediente crítico subió más de un 15% en el último mes.

## 3. Finanzas de Compras: Impuestos y Descuentos
**Problema:** El módulo de compras asume un precio plano, lo cual genera discrepancias contables cuando las facturas reales incluyen IVA o descuentos comerciales.
**Solución a implementar:**
- Agregar campos opcionales en el `<CompraForm>` para **Impuestos (16%, 8%, etc.)** y **Descuentos Globales**.
- Calcular automáticamente el impacto de estos impuestos/descuentos en el costo base de los insumos (ej. si hay un descuento del 10% en la factura, el costo unitario del inventario entra un 10% más barato).

## 4. Exportación y "Modo Cocina" (PDF/Excel)
**Problema:** Las cocinas necesitan listas impresas para trabajar y hacer conteos, y los contadores necesitan números en Excel.
**Solución a implementar:**
- **Plantilla de Conteo Ciego:** Exportar un PDF con todos los insumos y una línea en blanco para que el personal cuente el inventario físico y luego se registre en el sistema.
- **Exportación de Recetario:** Generar un PDF elegante con los pasos y fotos de las recetas para uso del personal, **ocultando** los márgenes de ganancia y costos reales.
- **Exportación Financiera (CSV/Excel):** Botón en el módulo de Informes para descargar la Matriz BCG completa.

## 5. Auditoría Avanzada de Kardex
**Problema:** Los movimientos de inventario deben ser totalmente trazables. "Faltan 5 kilos de carne" debe tener una respuesta inmediata.
**Solución a implementar:**
- Añadir el usuario (quién hizo el cambio) y motivo obligatorio a cada ajuste manual.
- Filtros avanzados en el Kardex para buscar específicamente (Mermas, Compras, Ventas, Ajustes Manuales).
- Reporte mensual de "Fugas de Inventario" calculado por la diferencia entre ventas teóricas e inventario físico real.

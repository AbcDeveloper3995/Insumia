# Insumia: Propuesta de Valor, Robustez Técnica y Alcance del Producto

## 1. La Problemática
La industria gastronómica, especialmente los restaurantes pequeños y medianos, se enfrenta constantemente a la falta de control sobre su inventario y finanzas. La gestión manual (a menudo en papel o en hojas de cálculo desactualizadas) genera una pérdida invisible pero constante de dinero. 

Los problemas más comunes incluyen:
- **Desconocimiento del costo real:** No saber exactamente cuánto cuesta producir un plato debido a las fluctuaciones en los precios de los proveedores y al desperdicio natural de los alimentos.
- **Mermas y desperdicios:** Insumos que caducan en la nevera por falta de rotación o que se desperdician en la preparación sin ser contabilizados ni costeados.
- **Faltantes críticos:** Quedarse sin ingredientes clave a mitad de un servicio, afectando la experiencia del cliente y perdiendo ventas.
- **Descuadre financiero:** Desconexión entre el dinero que entra en caja y el dinero que se gasta en comprar inventario a los proveedores.
- **Compras ineficientes:** Sobreinventariar productos que no rotan rápido o comprar a precios altos por falta de historial.

## 2. La Necesidad
Los restaurantes necesitan un ecosistema digital que integre la **operación del día a día (ventas)** con el **back-office (inventario y finanzas)**. Necesitan claridad en tiempo real de qué entra, qué sale y qué falta, permitiéndoles tomar decisiones basadas en datos objetivos para garantizar la rentabilidad del negocio.

---

## 3. Por qué el sistema de Insumia es un producto altamente robusto

A diferencia de las aplicaciones básicas de inventario que solo suman y restan unidades, Insumia fue construido con una arquitectura de nivel ERP (Enterprise Resource Planning) adaptada a la realidad física de una cocina. 

### Ventajas Competitivas: ¿Por qué hacemos lo que hacemos?
- **Separación de "Almacén" vs "Cocina":** No descontamos materia prima cuando vendes un plato, porque eso es irreal (la comida ya fue procesada antes de la venta). En Insumia, la materia prima se descuenta de forma controlada cuando "Elaboras" o preparas lotes en la cocina. El Punto de Venta (POS) vende de ese stock ya preparado. Esto previene descuadres y robos.
- **Integridad de Datos (Kardex Inmutable):** Todos los movimientos están respaldados por transacciones. No se puede "borrar" inventario por error; se debe registrar una merma justificada. Esto garantiza que el inventario financiero sea 100% auditable.

### A. Matemáticas Operativas: El Costo Real de Producción
Uno de los mayores logros de Insumia es su motor matemático, el cual calcula dinámicamente el costo real, no el teórico.

**¿Cómo lo hacemos?**
1. **Factor de Conversión Inteligente:** Si compras una Caja de 10 Litros, pero tus recetas usan Mililitros, el sistema aplica automáticamente un `factor_conversion`. El sistema sabe aislar el "Costo por Unidad Base" (ej. Costo por cada mililitro).
2. **Impacto del Porcentaje de Rendimiento:** Esta es la matemática que salva restaurantes. Si compras 1 Kg de carne a $100, tu costo aparente es de $0.10/gramo. Sin embargo, al quitar grasa y hueso, el porcentaje de rendimiento útil puede ser del 50%. Nuestro motor aplica la fórmula: `Costo Base / (Porcentaje Rendimiento / 100)`. Así, Insumia sabe que tu costo REAL es de $0.20/gramo.
3. **Escandallos Recursivos:** Si creas una sub-receta (Ej. Salsa de Tomate) y luego la usas dentro de una receta final (Ej. Pizza), el motor matemático recalcula el costo en cascada. Si el tomate crudo sube de precio hoy, la sub-receta sube de precio al instante y el margen de ganancia de tu Pizza se ajusta automáticamente en el dashboard.

### B. Sistema FIFO (Primeras Entradas, Primeras Salidas / PEPS)
La caducidad es el enemigo número uno de la rentabilidad. Insumia implementa lógica FIFO estricta a nivel de base de datos (mediante transacciones SQL y lotes de inventario) para garantizar que la merma sea la menor posible.

**¿Cómo funciona el FIFO en Insumia?**
- Al ingresar una compra, el sistema registra esa entrada como un "Lote" independiente con su propia fecha de registro y caducidad.
- Cuando la cocina decide "Preparar un lote" (Elaborar) de una receta, o cuando se reporta una merma, **nuestro motor en base de datos busca automáticamente los lotes de insumos más antiguos (los que están más próximos a caducar) y los descuenta primero**.
- Si necesitas consumir 5 Kg de tomate, y al lote más viejo solo le quedan 2 Kg, el sistema consume esos 2 Kg, los agota, y toma los 3 Kg restantes del siguiente lote más antiguo. 
- **Ventaja:** Garantiza que el valor financiero de tu inventario sea preciso y fomenta la rotación correcta, alertándote de lo que debes gastar antes de que se eche a perder.

---

## 4. Cómo Insumia resuelve el problema (El Ciclo de Uso)
1. **Control Exacto:** Registra la compra (Ej. Entra Lote #1 de Carne).
2. **Transformación (Cocina):** Mediante recetas, "Elaboras" platos. Aquí actúa la lógica FIFO consumiendo la carne más vieja. Aquí también se aplica la matemática de rendimiento para saber el costo real.
3. **Cierre de Ciclo (Venta):** Al realizar una venta en el Punto de Venta (POS), Insumia descuenta del stock que la cocina acaba de preparar.
4. **Protección:** Lanza alertas preventivas de stock mínimo y caducidad en el dashboard central.

---

## 5. Alcance de nuestro MVP actual
El MVP actual de Insumia ha superado la etapa básica y se posiciona como un **ERP (Enterprise Resource Planning) ligero** diseñado específicamente para restaurantes.
Incluye los siguientes módulos completamente funcionales:
- **Inventario:** Control de stock, Kardex inmutable y módulo dedicado a Mermas.
- **Compras:** Gestión de proveedores, facturación y actualización de costos de insumos.
- **Recetas (Escandallos):** Creación de recetas finales y sub-recetas (con costeo recursivo) y la opción de "Preparar Lotes".
- **Punto de Venta (POS):** Interfaz para cobro y venta rápida que afecta directamente el inventario preparado.
- **Finanzas:** Manejo de flujo de caja (apertura/cierre con arqueo ciego), flujos de efectivo y cuentas por pagar.
- **Informes & Dashboard:** Analítica en tiempo real sobre la salud del negocio y costos.
- **Autenticación Multi-Tenant:** Sistema seguro con soporte multi-sucursal bajo una misma cuenta matriz.

## 6. Escalabilidad: Hacia dónde podemos ir
La sólida arquitectura transaccional de Insumia está preparada para escalar hacia características de un ecosistema Enterprise:
- **Módulo de Meseros y Comandas:** Aplicación móvil o tablets para que los meseros tomen pedidos que se envíen directamente al POS y a la cocina (KDS).
- **Integraciones con Delivery:** Conexión con APIs de Uber Eats, Rappi, etc., para centralizar órdenes e inventario.
- **Inteligencia Artificial (Proyección de Demanda):** Analizar el histórico de ventas y el clima para sugerirle al restaurante *exactamente qué y cuánto* debe comprarle a cada proveedor para la próxima semana.
- **Portal B2B Integrado:** Que los restaurantes hagan sus pedidos a proveedores directamente desde Insumia y se generen órdenes de compra automáticas.
- **Facturación Electrónica:** Integración directa con los entes fiscales (SAT, DIAN, AFIP, etc.) para emitir facturas legales.

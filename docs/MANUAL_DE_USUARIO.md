# Manual de Usuario - Insumia

Bienvenido al manual oficial de usuario de **Insumia**. Este documento detalla todos los casos de uso, funcionalidades y módulos del sistema para asegurar que obtengas el máximo provecho de esta herramienta integral de gestión para tu restaurante.

---

## 1. Acceso y Configuración Inicial

### 1.1 Iniciar Sesión (Login) y Registro
- **Caso de uso:** Acceder a tu cuenta o crear una nueva si eres un negocio nuevo.
- **Funcionalidad:** Sistema seguro de autenticación. Al registrarte, creas la cuenta principal de administrador.
- **Módulo:** Autenticación.

### 1.2 Selección de Restaurante (Multi-Sucursal)
- **Caso de uso:** Administrar distintos locales o conceptos gastronómicos desde una misma cuenta.
- **Funcionalidad:** Tras el login, si tienes más de un restaurante registrado, verás una pantalla para seleccionar con cuál deseas trabajar. Todos los datos, inventarios y ventas están aislados por restaurante para evitar confusiones.

---

## 2. Dashboard y Analítica General

- **Caso de uso:** Obtener una fotografía instantánea del estado del negocio al iniciar el día.
- **Funcionalidades:**
  - Resumen de ingresos del mes y del día.
  - Alertas rápidas: Insumos que están por debajo de su stock mínimo.
  - Productos más vendidos.
  - Accesos directos a compras o ventas rápidas.

---

## 3. Módulo de Inventario

Es el corazón del control. Aquí sabrás exactamente qué tienes, qué falta y cuánto vale tu almacén.

### 3.1 Gestión de Insumos
- **Caso de uso:** Dar de alta un nuevo ingrediente (ej. Tomate, Carne, Harina).
- **Funcionalidades:**
  - **Conversión de Unidades:** Puedes configurar que compras el producto en "Cajas" pero lo usas en la cocina en "Gramos". El sistema calcula el factor de conversión automáticamente.
  - **Porcentaje de Rendimiento (Merma técnica):** Útil para productos como la carne o pescado, donde tras limpiar el hueso/grasa, solo te queda un porcentaje de producto útil.
  - **Alertas Personalizadas:** Configura un stock mínimo (para no quedarte sin ingredientes) y días de alerta de caducidad.

### 3.2 El Kardex (Trazabilidad)
- **Caso de uso:** Auditoría para saber por qué falta un producto o en qué se gastó.
- **Funcionalidad:** Registro inmutable de absolutamente todos los movimientos de un insumo (Entrada por compra, Salida por venta, Ajuste por merma, Entrada por preparación de lote). 

### 3.3 Gestión de Mermas
- **Caso de uso:** Registrar producto que se estropeó, caducó, se cayó al piso o se quemó.
- **Funcionalidad:** Permite reportar la pérdida, descontar el inventario para mantenerlo realista y registrar el costo financiero de esa pérdida en el sistema para los reportes de finanzas.

---

## 4. Módulo de Compras y Proveedores

### 4.1 Compras
- **Caso de uso:** Reabastecer el almacén cuando llega el pedido del camión.
- **Funcionalidades:**
  - Registro de la factura/compra.
  - Actualiza automáticamente las existencias del inventario (entradas en Kardex).
  - **Actualización de Costos:** Si el precio de un insumo subió respecto a tu última compra, el sistema actualiza automáticamente el costo unitario de ese insumo.
  - Configuración del método de pago (Caja diaria, Banco o Pendiente/Crédito).

### 4.2 Proveedores
- **Caso de uso:** Mantener el directorio de quién te vende qué.
- **Funcionalidad:** Creación y gestión de los contactos de proveedores para facilitar compras futuras.

---

## 5. Módulo de Recetas y Escandallos

Este módulo automatiza la estructura de costos de tu menú.

### 5.1 Recetas Finales (Platos)
- **Caso de uso:** Crear un ítem de menú (ej. "Hamburguesa Clásica") y asignarle un precio de venta.
- **Funcionalidad:** Al agregar insumos a la receta, el sistema suma los costos unitarios y te muestra el **Costo Real de Producción** y el margen de ganancia que estás obteniendo con tu precio de venta actual. 

### 5.2 Sub-recetas (Bases y Salsas)
- **Caso de uso:** Crear una "Salsa BBQ" o "Masa de Pizza" que se produce en grandes cantidades y luego se usa como ingrediente para varios platos.
- **Funcionalidad:** Permite gestionar producciones intermedias.

### 5.3 Preparación de Lotes
- **Caso de uso:** El chef produce 10 Litros de Salsa BBQ el martes por la mañana para usar en el resto de la semana.
- **Funcionalidad:** Descuenta del inventario los ingredientes primarios (tomate, azúcar, especias) y automáticamente da de "Entrada" en el inventario 10 Litros de Salsa BBQ ya costeada.

---

## 6. Punto de Venta (POS - Ventas)

### 6.1 Registro de Ventas
- **Caso de uso:** El cajero o mesero cobra una orden a un cliente.
- **Funcionalidades:**
  - Interfaz rápida y visual (Grid de productos con fotos/colores).
  - Al procesar el pago, el sistema **descuenta el stock de platillos preparados** (la materia prima fue descontada previamente en el módulo de recetas al momento de "Elaborar" o preparar el lote).
  - El dinero ingresa automáticamente a la "Caja Diaria".

---

## 7. Módulo de Finanzas

Control estricto sobre el dinero físico y digital.

### 7.1 Gestión de Caja
- **Caso de uso:** Controlar los turnos de los cajeros y el efectivo en el restaurante.
- **Funcionalidades:**
  - **Apertura de Caja:** Declarar con cuánto dinero inicia el turno (base).
  - **Cierre de Caja:** Contar el dinero al final del turno. El sistema cruzará lo que debe haber (Ventas - Gastos) con lo que declaras y registrará si hay sobrantes o faltantes.

### 7.2 Flujos de Efectivo
- **Caso de uso:** Pagar a un proveedor desde la caja registradora.
- **Funcionalidad:** Permite que las compras registradas con fuente de pago "Caja" se resten del efectivo del turno actual, manteniendo la cuadratura del dinero perfecta.

---

## 8. Módulo de Informes

La Inteligencia del negocio.

- **Caso de uso:** Reunión mensual de socios para evaluar la salud del restaurante.
- **Funcionalidades:**
  - Reportes de rentabilidad.
  - Histórico de mermas (cuánto dinero se perdió por desperdicios).
  - Reporte de costos vs. ventas reales. 
  - Todo exportable o visible mediante gráficos claros y accionables.

---
*Nota: Este manual se actualiza constantemente conforme se añaden nuevas funcionalidades al ecosistema de Insumia.*

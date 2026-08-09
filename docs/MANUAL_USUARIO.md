# Manual de Usuario - Insumia
*Versión 1.1*

Insumia es un sistema avanzado de gestión integral para restaurantes. Su filosofía se basa en un cálculo de costos en tiempo real y en una gestión de inventario basada en metodologías JIT (Just-in-Time) y FIFO (First-In, First-Out).

---

## 1. Módulo de Autenticación y Configuración
### 1.1 Registro y Selección de Restaurante
- **Funcionalidad:** Permite crear una cuenta segura. Un usuario puede ser propietario de múltiples restaurantes o ser invitado a administrar uno existente.
- **Flujo:** Al iniciar sesión, si el usuario tiene más de un restaurante, el sistema despliega un selector. Toda la data (inventario, caja, ventas) está aislada por restaurante.

---

## 2. Módulo de Caja (Control de Efectivo)
### 2.1 Apertura y Cierre
- **Funcionalidad:** Lleva el control del dinero físico y digital que entra y sale en un turno.
- **Acciones:**
  - **Abrir Caja:** Se requiere introducir un "Fondo de Caja" inicial (ej. el dinero base para dar cambios).
  - **Cerrar Caja:** Congela las transacciones del turno para auditoría.

### 2.2 Movimientos Manuales
- **Ingreso:** Entrada de dinero no proveniente de ventas (ej. un préstamo o aporte del dueño).
- **Egreso:** Salida de dinero de la caja (ej. pago de un servicio rápido o extracción de utilidades).

---

## 3. Módulo de Inventario
El corazón operativo de Insumia. Aquí se gestionan las materias primas crudas.

### 3.1 Pestaña "Stock Crudo e Insumos"
Muestra el catálogo de insumos y sus existencias globales.
- **Nuevo Insumo:** 
  - **Unidad de Compra:** Cómo compras el producto (Ej. "Costal de 5kg").
  - **Unidad Base:** Cómo mides el producto en tus recetas (Ej. "Gramos").
  - **Factor de Conversión:** Cuántas unidades base hay en la de compra (Ej. 5000).
  - **Porcentaje de Rendimiento:** Merma inherente del producto (Ej. Una piña tiene 70% de rendimiento porque se tira la cáscara).
- **Compra Inicial:** Un atajo para meter el primer inventario sin pasar por el módulo complejo de compras.

### 3.2 El Kardex (Auditoría)
- Al hacer clic en el botón de historial de un insumo, se abre el Kardex. Muestra cada movimiento (compra, venta, merma) con fecha, cantidad y el costo financiero exacto del movimiento.

### 3.3 Pestaña "Control de Mermas"
- **Funcionalidad:** Permite reportar desperdicios de comida.
- **Acción:** Puedes seleccionar insumos crudos o Subrecetas completas, definir la cantidad perdida y el motivo.
- **Impacto:** El sistema calculará la "Pérdida Financiera" en moneda local, descontará los insumos físicos del almacén y enviará este gasto al reporte de rentabilidad.

---

## 4. Módulo de Compras a Proveedores
- **Funcionalidad:** Registrar el reabastecimiento formal de almacén.
- **Estados de Orden:**
  - **Pendiente:** La orden está creada pero no recibida ni pagada. No afecta stock.
  - **Pagada / Recibida:** Incrementa el stock, recalcula el costo unitario del insumo e impacta la caja si se pagó en efectivo.

---

## 5. Módulo de Recetas (Ingeniería de Menú)
Aquí se crean las fórmulas para costear los platillos.

### 5.1 Subrecetas (Producción por lotes)
Son preparaciones base que no se venden directamente (Ej. Masa de pizza, Litro de Salsa BBQ).
- **Rendimiento de Lote:** Define para cuántas porciones alcanza la preparación.
- **Comportamiento:** Las subrecetas no se les asigna precio de venta y su interfaz bloquea este campo. Sus costos se dividen entre su rendimiento.

### 5.2 Platillos Finales (Para Venta)
- Al crear una receta, le puedes agregar Insumos y Subrecetas.
- **Datos Mostrados:**
  - **Costo FC (Food Cost):** Costo total de preparación.
  - **Precio de Venta:** A cuánto se lo ofreces al cliente.
  - **Ganancia:** Dinero líquido generado (Precio - Costo).
  - **Margen %:** Rentabilidad porcentual.

---

## 6. Punto de Venta (Caja Registradora)
- **Funcionalidad:** Interfaz táctil para que los meseros/cajeros cobren las órdenes.
- **Impacto Silencioso (JIT):** Al cobrar una orden, Insumia realiza una operación recursiva masiva. Si vendes una "Pizza", busca la subreceta "Masa de pizza" y descuenta exactamente los gramos de harina y sal de esa masa directamente del inventario.

---

## 7. Informes Estratégicos (Business Intelligence)
El cerebro de decisiones del dueño del restaurante.

### 7.1 KPIs Principales (Tarjetas Superiores)
1. **Ganancia Bruta:** Utilidad teórica de ventas menos costo de recetas.
2. **Pérdidas por Mermas:** Total de dinero tirado a la basura (alimentado por el módulo de mermas).
3. **Utilidad Bruta Real:** El KPI definitivo `(Ganancia Bruta - Mermas)`.

### 7.2 Matriz BCG
Clasifica tus platillos en:
- **Estrella:** Alto margen de ganancia + Altas ventas (Tus mejores productos).
- **Caballito (de batalla):** Bajo margen de ganancia + Altas ventas (Populares pero poco rentables).
- **Hueso (Perro):** Bajo margen + Bajas ventas (Candidatos a salir del menú).

### 7.3 Alertas de Rentabilidad
- Lista roja que te avisa automáticamente si algún platillo tiene un margen de ganancia crítico (inferior al 30%).

### 7.4 Top Insumos
- **Top por Ganancia:** El ingrediente que más dinero genera cuando participa en un plato.
- **Top por Uso:** El ingrediente de mayor volumen de rotación en almacén.

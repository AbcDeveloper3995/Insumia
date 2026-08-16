# 🧪 CASO DE PRUEBA E2E DETALLADO - INSUMIA

Este documento define el flujo completo de principio a fin (End-to-End) para validar toda la plataforma. Al seguir este documento, probarás todos los sistemas: desde el control de caja, conversiones de inventario, rendimiento, costeo, ingresos proporcionales, mermas y descarga recursiva JIT.

---

## FASE 1: Módulo de Caja (Apertura)
**Objetivo:** Iniciar las operaciones financieras del día y establecer el fondo inicial.

- En la barra de navegación superior (Navbar), haz clic en el botón de **Caja**.
- Selecciona **"Abrir Caja"**.
- Ingresa un saldo inicial de **$1,000.00** en efectivo (fondo de caja para dar cambio y pagar proveedores tempranos).
- **Resultado Esperado:** El indicador en el Navbar ahora muestra la caja abierta y tu saldo actual en efectivo es de $1,000.00.

---

## FASE 2: Compras e Inventario Inicial
**Objetivo:** Crear el inventario base y hacer una salida de efectivo de la Caja por el pago a proveedores.

### 2.1 Configurar Insumos (En la pestaña Inventario)
Añade 3 insumos con la siguiente configuración exacta:
1. **Harina de Trigo**: Base `g`, Compra `Kg`, Factor `1000`, Rendimiento `100%`, Costo Unidad Compra `$30.00`. *(Costo base: $0.03/g)*.
2. **Leche Entera**: Base `ml`, Compra `Litro`, Factor `1000`, Rendimiento `100%`, Costo Unidad Compra `$25.00`. *(Costo base: $0.025/ml)*.
3. **Huevo Blanco**: Base `Unidad`, Compra `Caja`, Factor `30`, Rendimiento `90%`, Costo Unidad Compra `$100.00`. *(Costo usable por rendimiento: $3.70 c/u)*.

### 2.2 Registro de la Compra y Pago (En la pestaña Compras)
- Ve a Compras > **Nueva Compra**.
- Compra:
  - **Harina:** 5 Kg ($150.00 total)
  - **Leche:** 10 Litros ($250.00 total)
  - **Huevo:** 1 Caja ($100.00 total)
- **Total de la Compra:** $500.00.
- **Marca la casilla "Pagada en Efectivo"** para que saque el dinero de la caja activa.
- **Resultado Esperado (Caja e Inventario):**
  - Tu efectivo en Caja debe haber bajado de $1,000.00 a **$500.00** por el egreso de compra.
  - Inventario actual: Harina: 5000g | Leche: 10000ml | Huevo: 30 unidades.

---

## FASE 3: Creación de la Subreceta
**Objetivo:** Crear un preparativo masivo para validar el coste por lote.

- Ve a Recetas > Nueva Receta.
- **Marca la casilla:** `¿Es subreceta/preparación?`
- **Nombre:** Masa para Hot Cakes.
- **Rendimiento de Lote:** Pon que esta tanda rinde para **20** porciones (platos).
- **Ingredientes:** Harina (500 g), Leche (500 ml), Huevo (4 unidades).
- **Resultados Financieros Esperados (Modal de Subreceta):**
  - Costo Total del Lote: ~$42.31
  - Costo Unitario (por porción): ~$2.12 ($42.31 / 20)

---

## FASE 4: Creación de Recetas Finales (Menú)
**Objetivo:** Combinar subrecetas e insumos crudos para validar cálculos independientes.

### 4.1 Platillo CON Subreceta: "Desayuno 3 Hot Cakes Especiales"
- Nueva Receta (NO marcar es subreceta).
- **Rendimiento:** 1 porción.
- **Precio de Venta:** $85.00
- **Ingredientes:**
  - `Masa para Hot Cakes` (Subreceta) -> Cantidad: 3 porciones.
  - `Huevo` (Crudo) -> Cantidad: 2 unidades.
- **Resultados Esperados al abrir el "Modal de Resumen de Receta":**
  - **KPIs (Tarjetas Superiores):**
    - Costo Total: **$13.76**
    - Precio Venta: **$85.00**
    - Ganancia Neta: **$71.24**
    - Margen (FC): **83.8%**
  - **Lista de Ingredientes en el Modal:**
    - Masa para Hot Cakes: Cantidad **3.00 un.** | Costo Total: **$6.36**
    - Huevo Blanco: Cantidad **2.00 un.** | Costo Total: **$7.40**

### 4.2 Platillo SIN Subreceta: "Orden de Huevos Estrellados"
- Nueva Receta (NO marcar es subreceta).
- **Rendimiento:** 1 porción.
- **Precio de Venta:** $40.00
- **Ingredientes:**
  - `Huevo` (Crudo) -> Cantidad: 2 unidades.
- **Resultados Esperados al abrir el "Modal de Resumen de Receta":**
  - **KPIs (Tarjetas Superiores):**
    - Costo Total: **$7.40**
    - Precio Venta: **$40.00**
    - Ganancia Neta: **$32.60**
    - Margen (FC): **81.5%**
  - **Lista de Ingredientes en el Modal:**
    - Huevo Blanco: Cantidad **2.00 un.** | Costo Total: **$7.40**

---

## FASE 5: Operación de Venta (Punto de Venta) y Flujo de Caja
**Objetivo:** Probar el ingreso de dinero a la caja y el descargo JIT de inventario múltiple.

- Ve a "Punto de Venta".
- Añade a la comanda: 
  - **5 unidades** de "Desayuno: 3 Hot Cakes Especiales" ($425.00).
  - **3 unidades** de "Orden de Huevos Estrellados" ($120.00).
- Cobra en **Efectivo**.
- Total de Venta: **$545.00**.

> **Resultados Esperados en Inventario (Kardex):**
> - **Harina:** Se usaron 375g para los 5 hotcakes. `5000g - 375g` = **4625 g restantes**.
> - **Leche:** Se usaron 375ml para los 5 hotcakes. `10000ml - 375ml` = **9625 ml restantes**.
> - **Huevo:** 
>   - Hotcakes usan: 3u (masa) + 10u (plato extra) = 13u.
>   - Huevos Estrellados usan: 6u.
>   - Total usados: 19 unidades.
>   - `30u - 19u` = **11 unidades restantes**.

---

## FASE 6: Registro de Mermas (Desperdicios)
**Objetivo:** Probar la deducción de inventario por accidentes y el cálculo de pérdida monetaria.

- Navega a la pestaña de **Mermas**.
- Registra una nueva merma:
  - **Insumo:** `Leche Entera`
  - **Cantidad:** `1000 ml` (1 Litro derramado).
  - **Motivo:** "Se derramó en cocina".
- **Resultados Esperados:**
  - En **Inventario**, la Leche Entera ahora debe tener **8625 ml** restantes (9625 - 1000).
  - El sistema calculó internamente que perdiste **$25.00** por esa leche (1000ml a $0.025/ml).

---

## FASE 7: Cierre de Caja y Descuadre (Prueba del Centro de Alertas)
**Objetivo:** Cerrar el turno, simular que falta dinero y verificar que el Centro de Alertas lo reporte.

- Ve a la barra superior (Navbar) y haz clic en el botón de tu Caja Activa.
- En el modal de resumen, el sistema esperará un total en efectivo de **$1,045.00** *(Fondo $1,000 - $500 Compras + $545 Ventas)*.
- Haz clic en **Cerrar Caja**.
- Simula un robo o pérdida de dinero introduciendo **$1,000.00** (es decir, faltan $45.00).
- Confirma el cierre.
- **Resultado Esperado (Centro de Alertas):**
  - La campanita de notificaciones marcará un punto rojo.
  - Al abrirla, mostrará una alerta de **Faltante en Caja** por el descuadre de **-$45.00**.

---

## FASE 8: Revisión de Informes (Business Intelligence)
**Objetivo:** Comprobar la matriz financiera y que la merma impacte la utilidad real.

- Ve a la página **Informes**, filtro **"Hoy"**.
- **Métricas Globales a Validar:**
  - **Platillos Vendidos:** 8
  - **Ventas Totales:** $545.00
  - **Ganancia Bruta Teórica:** $454.00 *(5 * $71.24 + 3 * $32.60)*.
  - **Pérdida por Mermas:** **$25.00** *(Por la leche derramada)*.
  - **Utilidad Bruta Real:** **$429.00** *($454.00 - $25.00)*.
- **Tabla "Matriz de Rentabilidad":**
  - Aparecerán los dos platillos (Desayuno y Huevos Estrellados) con sus respectivos márgenes en verde (83.8% y 81.5%).
  - El "Huevo Blanco" debe aparecer firmemente posicionado como el rey, ya que está presente en todos los platillos vendidos, demostrando la potencia del cálculo de "Ingreso Proporcional".

---

## FASE 9: Producción Anticipada y Control de Finanzas
**Objetivo:** Probar el módulo de Finanzas y la función de "Elaborar Producción" de recetas, validando que el POS descuente el stock real preparado.

### 9.1 Elaboración de Platillos
- Ve a **Recetas**.
- Selecciona el platillo "Orden de Huevos Estrellados" y haz clic en **Elaboración**.
- En el modal "Elaborar Producción", indica que vas a preparar **5 unidades**.
- Haz clic en **Elaborar**.
- **Resultados Esperados:**
  - El sistema descontará 10 Huevos (2 por unidad) del inventario de insumos crudos.
  - La tarjeta de la receta ahora mostrará un badge verde indicando **"5 Preparados"**.

### 9.2 Venta con Descuento de Stock Real
- Ve al **Punto de Venta**.
- Si no tienes un turno abierto, el sistema te mostrará la pantalla de "Turno Cerrado". 
- Haz clic en **Declarar Fondo y Abrir Turno** (ej. $200 de fondo).
- Verás el catálogo. La tarjeta de "Orden de Huevos Estrellados" mostrará **5 Preparados**.
- Agrega **3 unidades** de "Orden de Huevos Estrellados" al carrito.
- Haz clic en **Proceder al Pago** y cóbralo en efectivo.
- **Resultado Esperado:** 
  - Al procesarse la venta, la pantalla se refresca sola y la tarjeta de la receta debe bajar automáticamente a **2 Preparados**.

### 9.3 Auditoría Gerencial (Finanzas)
- Ve a **Finanzas** desde el menú lateral.
- **Resultados Esperados:**
  - Debes ver una sección "Turno en Progreso (Métricas en Vivo)".
  - El **Fondo Inicial** debe ser $200.00.
  - **Ventas Efectivo** debe reflejar el total de la venta de los 3 platillos (3 * $40 = $120.00).
  - El **Balance Neto del Día** sumará las ventas, y el efectivo físico esperado será de $320.00.
  - La tabla inferior mostrará la venta registrada hace un momento.

**Fin del Caso de Prueba.**


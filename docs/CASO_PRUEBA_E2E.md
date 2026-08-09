# Caso de Prueba End-to-End (E2E) - El Amanecer
*Prueba de Integración y Validaciones de Sistema*

Este documento describe un escenario del mundo real diseñado para poner a prueba absolutamente todos los flujos lógicos, matemáticos y financieros de **Insumia**. 

Recomendamos que el usuario siga este escenario paso a paso en un restaurante nuevo para confirmar que los KPIs y resultados de su base de datos coinciden exactamente con los "Resultados Esperados" mostrados aquí.

---

## FASE 1: Configuración Inicial y Caja
**Objetivo:** Probar el registro, cambio de contexto y fondeo de caja.

1. **Autenticación:**
   - Inicia sesión o regístrate en el sistema.
   - Entra al "Dashboard" y asegúrate de que el selector superior derecho (Restaurante) funcione.
2. **Apertura de Caja:**
   - Navega al módulo **"Caja"**.
   - Haz clic en **"Abrir Caja"**.
   - Ingresa un saldo inicial de **$1,000.00** MXN.
   - **Resultado Esperado:** La caja debe mostrar estado "Abierta" con un saldo actual de $1,000.00.

---

## FASE 2: Inventario Base (Compras)
**Objetivo:** Probar el registro de insumos con rendimiento, factor de conversión y la afectación directa a la Caja.

Navega a **"Inventario" > "Stock Crudo e Insumos"** y crea los siguientes 3 insumos usando la opción "Nuevo Insumo". Al final de crear cada uno, el sistema te preguntará si quieres realizar una "Compra Inicial". **Realiza la compra inicial indicando que se paga con Caja en efectivo.**

**1. Harina de Trigo**
- Unidad Compra: Saco (1 unidad)
- Unidad Base: Gramo (g)
- Factor Conversión: 1000 (1 saco = 1000g o 1kg)
- Rendimiento: 100%
- Costo Compra: **$30.00**
- *Compra Inicial:* Adquiere 5 sacos (Se pagarán $150.00 de la caja).

**2. Leche Entera**
- Unidad Compra: Litro (1 unidad)
- Unidad Base: Mililitro (ml)
- Factor Conversión: 1000
- Rendimiento: 100%
- Costo Compra: **$25.00**
- *Compra Inicial:* Adquiere 10 litros (Se pagarán $250.00 de la caja).

**3. Huevo**
- Unidad Compra: Docena (1 unidad)
- Unidad Base: Pieza (unid.)
- Factor Conversión: 12
- Rendimiento: 90% (Se tira el cascarón)
- Costo Compra: **$40.00**
- *Compra Inicial:* Adquiere 2 docenas (Se pagarán $80.00 de la caja).

> **Resultados Esperados Fase 2:**
> - En la pestaña de Inventario deberías ver: Harina (5000g), Leche (10000ml), Huevo (24 unid).
> - En la pestaña de **Caja**, el saldo actual debe haber bajado de $1,000.00 a **$520.00** (por los $480 gastados en insumos).

---

## FASE 3: Ingeniería de Menú (Recetas y Subrecetas)
**Objetivo:** Probar el motor matemático recursivo de costeo.

Navega al módulo **"Recetas"**.

### Paso 3.1: Crear la Subreceta "Masa de Hot Cakes"
- **Acción:** Crea nueva receta y marca la casilla **"Es subreceta"**.
- **Rendimiento (Lote):** Pon que rinde para **20** porciones/unidades.
- **Ingredientes a añadir:**
  - Harina: 500 g.
  - Leche: 500 ml.
  - Huevo: 4 piezas.
- **Resultados Matemáticos Esperados (Revisa el modal de resumen financiero de esta tarjeta):**
  - Costo Harina: $15.00 (500g a $0.03/g)
  - Costo Leche: $12.50 (500ml a $0.025/ml)
  - Costo Huevo: $14.81 (4 unid. a $3.33 base pero ajustado por 90% de rendimiento = $3.70 c/u).
  - **Costo Total del Lote (Costo FC):** ~$42.31
  - **Costo Unitario (1 porción):** ~$2.12
  - *Precio de Venta:* Debe estar deshabilitado ($0.00).

### Paso 3.2: Crear el Platillo "Desayuno 3 Hot Cakes"
- **Acción:** Crea nueva receta. Asegúrate de NO marcar "Es subreceta".
- **Rendimiento:** 1 porción.
- **Precio de Venta (Manual):** Ponle un precio de venta al cliente de **$85.00**.
- **Ingredientes a añadir:**
  - **Masa de Hot Cakes (Subreceta):** 3 unidades.
  - **Huevo (Insumo Crudo extra para acompañar):** 2 piezas.
- **Resultados Matemáticos Esperados (Revisa la tarjeta en la lista):**
  - Costo Masa aportada: $6.36 (3 x $2.12).
  - Costo Huevo aportado: $7.40 (2 x $3.70).
  - **Costo Total de Receta (Costo FC):** ~$13.76
  - **Ganancia:** $71.24
  - **Margen:** ~83.8%

---

## FASE 4: Operación de Ventas (Punto de Venta)
**Objetivo:** Probar el descargo JIT de inventario recursivo.

- Navega a **"Punto de Venta"**.
- Selecciona la categoría "Platillos".
- Agrega **5 unidades** del "Desayuno 3 Hot Cakes" a la comanda.
- Procesa el pago y marca "Efectivo".
- Total Cobrado: **$425.00** (5 x $85.00).

> **Resultados Esperados Fase 4 (Inventario):**
> 1. Ve a "Inventario". Revisa la Harina. Debería haber bajado **375 g** (15 hot cakes en total usan 375g). Stock actual harina: **4625 g**.
> 2. Revisa la Leche. Debería haber bajado **375 ml**. Stock actual leche: **9625 ml**.
> 3. Revisa los Huevos. Deberían haber bajado 3 (por la masa) + 10 (por el platillo) = **13 piezas**. Stock actual: **11 unid.**
> 
> *Nota: Para ver el detalle, abre el botón "Kardex" de la harina y verás un movimiento tipo "venta" por -375g detallando que se consumieron en los 5 Desayunos.*

> **Resultados Esperados Fase 4 (Caja):**
> Navega a "Caja". Tu saldo actual debe ser: $520.00 (que te quedaban) + $425.00 (de esta venta) = **$945.00**.

---

## FASE 5: Reporte de Mermas
**Objetivo:** Poner a prueba la deducción financiera del módulo de desperdicios recién creado.

- Navega a **"Inventario" > Pestaña "Control de Mermas"**.
- Haz clic en "Nueva Merma".
- Selecciona el ítem: **"Masa de Hot Cakes (Subreceta)"**.
- Pon cantidad: **4**.
- Motivo: "Masa agria / caducada".
- **Resultado Inmediato en el Modal:** El sistema te debe calcular abajo una "Pérdida Financiera" exacta de **~$8.48** (4 x $2.12).
- Haz clic en Registrar.

> **Resultados Esperados Fase 5 (Kardex de Inventario):**
> Si vas al Stock de Harina y abres el Kardex, verás un nuevo movimiento tipo **"merma"** por **-100 g** (correspondientes a los 4 hot cakes tirados).

---

## FASE 6: Inteligencia de Negocios (Informes)
**Objetivo:** Auditar la matemática global en el P&L del restaurante.

- Navega a **"Informes"**.
- Filtra por "Hoy" (o Histórico si lo hiciste todo el mismo día).
- Verifica las Tarjetas Superiores:
  1. **Ventas Totales:** $425.00
  2. **Ganancia Bruta Teórica:** ~$356.20 ($425 de venta menos los ~$68.80 que costó hacer los 5 desayunos).
  3. **Pérdida por Mermas:** ~$8.48 (La tarjeta roja que atrapa el desperdicio).
  4. **Utilidad Bruta Real:** ~$347.72 (Ganancia Bruta Teórica - Pérdida por Mermas).

- **Verifica la Matriz BCG:**
  - "Desayuno 3 Hot Cakes" debería aparecer catalogado probablemente como "Estrella" por tener margen > 50% y ser tu plato más vendido.

---
*Fin del Caso de Prueba.* 
Si todos los números cruzan exitosamente con este documento, el flujo central de Insumia está 100% operativo y calibrado.

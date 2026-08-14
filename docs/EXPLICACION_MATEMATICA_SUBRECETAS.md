# 🧠 Explicación Matemática: El Motor JIT de Subrecetas en Insumia

Uno de los mayores retos en la administración de un restaurante es el control de inventario de preparaciones masivas o **Subrecetas** (por ejemplo: masas, salsas, fondos, aderezos). 

En la mayoría de los sistemas, cuando preparas una masa, tienes que dar de baja manualmente los ingredientes crudos. **Insumia** resuelve esto con un motor de descargo de inventario **JIT (Just-In-Time)** combinado con **matemática de punto flotante**. 

A continuación, se detalla paso a paso cómo funciona la lógica interna de Insumia usando el caso de estudio de los Huevos y los Hot Cakes.

---

## 1. El Escenario Base (El Lote de Masa)

Supongamos que el chef prepara una tanda gigante de **Masa para Hot Cakes**.
En Insumia, creamos una Subreceta con las siguientes características:
- **Rendimiento:** 20 porciones (El lote completo da para 20 platos).
- **Ingrediente Crítico:** Huevo Blanco.
- **Cantidad usada en el lote:** 4 piezas.

Esto significa que, teóricamente, **1 sola porción de masa** contiene exactamente `4 / 20 = 0.2 huevos`.

---

## 2. El Descargo JIT durante la Venta

El sistema no resta los 4 huevos del inventario cuando "creas" la receta, sino que **los resta de forma fraccional en el momento exacto de la venta**.

Si un cliente pide el platillo **"Desayuno 3 Hot Cakes"**, ese platillo utiliza:
- **3 porciones** de la Subreceta (Masa).
- **2 huevos** crudos extra (Huevos estrellados para acompañar).

### ¿Qué pasa cuando vendemos 5 desayunos?
Si vendemos 5 platillos, necesitamos **15 porciones de masa** (3 porciones x 5 platos).

El motor JIT de Insumia hace el siguiente cálculo matemático:
1. "El restaurante acaba de usar 15 porciones de masa".
2. "15 porciones equivalen al **75%** del lote total de 20 porciones" (15/20).
3. "Si el lote completo lleva 4 huevos, el 75% equivale a **3 huevos exactos**" (4 * 0.75).

A esto, el sistema le suma los huevos extra del platillo:
- 2 huevos estrellados x 5 platos = **10 huevos**.

**Total descontado del inventario general:** `3 + 10 = 13 huevos`.

---

## 3. ¿Qué pasa si la venta no da números enteros? (Matemática de Punto Flotante)

¿Qué ocurre si vendemos **1 solo desayuno** adicional? 
Ese desayuno usa **3 porciones de masa**.

El cálculo JIT de Insumia dice:
- 3 porciones = 15% del lote (3/20).
- 15% de 4 huevos = **0.6 huevos**.
- Más los 2 huevos estrellados = **2.6 huevos**.

En la vida real, no partes un huevo a la mitad. Sin embargo, en Insumia, el inventario rastrea la materia prima al miligramo. El sistema restará **2.6 huevos** de tu inventario. Si tenías 11 huevos, ahora tendrás **8.4 huevos**. Esto garantiza que el costo financiero ($$$) sea matemáticamente perfecto y no haya fugas invisibles de dinero.

---

## 4. ¿Qué pasa con las porciones que sobran? (Mermas de Subrecetas)

Volvamos al ejemplo. Hicimos un lote de 20 porciones de masa, vendimos 15, y vendimos 3 más. Hemos usado 18 porciones. 
**Nos sobran 2 porciones de masa al final del día.**

Como el sistema es JIT (Just-In-Time), esas 2 porciones están teóricamente "vivas" en la cocina. Los huevos y harina correspondientes a esas 2 porciones aún no se han descontado del inventario de Insumia.

¿Qué hace el dueño o chef si al día siguiente la masa se echó a perder?
1. Va al módulo de **Mermas** en Insumia.
2. Selecciona la Subreceta **"Masa para Hot Cakes"**.
3. Indica que se desperdiciaron **2 porciones**.

El motor interno desglosará esas 2 porciones de regreso a su materia prima original:
- (2 / 20) = 10% del lote.
- 10% de 4 huevos = **0.4 huevos**.
- El sistema restará 0.4 huevos, 50g de Harina y 50ml de Leche del inventario, y **lo sumará automáticamente como pérdida económica ($$$) en los Informes Financieros**.

---

### Conclusión
Gracias a este modelo de **ingredientes recursivos fraccionales**, el dueño del restaurante nunca tiene que hacer cálculos manuales. El sistema sabe exactamente cuánta materia prima cruda "vive" dentro de una salsa o masa, y la descuenta o la manda a pérdidas con precisión decimal.

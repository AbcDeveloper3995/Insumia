# 📖 Manual de Usuario - Insumia

## 1. ¿Qué es Insumia y qué problema resuelve?
**Insumia** es un sistema inteligente de gestión de inventario, costeo de recetas y análisis financiero diseñado específicamente para el sector gastronómico (restaurantes, cafeterías, panaderías). 

**El Problema:** La mayoría de los restaurantes no conocen su costo real. Compran en kilogramos pero cocinan en gramos; las mermas se pierden sin cuantificarse; y cuando el proveedor sube los precios, el dueño no sabe si el platillo sigue siendo rentable. 
**La Solución:** Insumia unifica las Compras, el Inventario y las Recetas. Calcula matemáticamente el costo exacto de cada platillo hasta el último miligramo, descontando mermas y ajustes, para decirte exactamente cuánto dinero libre te queda al final del día.

---

## 2. Módulo de Inventario
Este es el corazón matemático del sistema. Aquí administras todos tus insumos.
- **Insumos y Factores de Conversión:** Puedes declarar que compras el azúcar en "Sacos de 50 Kg" (Unidad de Compra), pero lo usas en las recetas en "Gramos" (Unidad Base). El sistema hace la conversión automática.
- **Porcentaje de Rendimiento:** Si compras Piñas, la cáscara no se come. Si su rendimiento es del 60%, el sistema sabe que el 40% es pérdida natural, y ajusta automáticamente el costo por gramo de la pulpa real que usas en las bebidas.
- **Kardex (Historial):** En cada insumo puedes ver un historial exacto de entradas y salidas.
- **Mermas:** Registra comida quemada, caducada o accidentada. Insumia suma el costo de esto para mostrarte tu pérdida mensual por desperdicios en el informe final.

## 3. Módulo de Compras y Proveedores
- **Directorio de Proveedores:** Guarda quién te surte qué.
- **Registro de Compras:** Cuando llegue el camión con productos, en lugar de sumar gramos a mano, seleccionas que compraste "5 Cajas de Tomates". El sistema ingresa esos kilos al inventario automáticamente.
- **Cuentas por Pagar:** Si la compra no se paga de inmediato, queda marcada como deuda y aparecerá en el Centro de Alertas hasta que la liquides usando el módulo de Caja.

## 4. Módulo de Recetas y Subrecetas
Aquí es donde ocurre la magia financiera.
- **Subrecetas:** Preparaciones intermedias (Masa para pizza, Salsa de la casa, Fondos). Le dices al sistema los ingredientes y **cuánto rinde el lote** (ej. 20 porciones). El sistema calcula el costo de 1 porción.
- **Recetas Finales:** El platillo final que se vende al cliente. Mezcla insumos crudos y subrecetas. 
- Al terminar, el modal de la receta te mostrará el **Costo de los Insumos**, tu **Ganancia Libre** y tu **Margen de Rentabilidad**. Así sabrás exactamente qué precio cobrar en el menú.

## 5. Módulo de Informes Estratégicos
El panel de inteligencia de negocios.
- **Matriz BCG:** Un listado de tus productos categorizados en:
  - **Estrella:** Te dejan mucha ganancia y se venden mucho.
  - **Caballo de Batalla:** Te dejan poco margen, pero la gente los pide sin parar (atraen clientes).
  - **Hueso:** No se venden y encima su margen es terrible. ¡Quítalos del menú!
- **Ganancia Neta vs Mermas:** Un dashboard que resta tu pérdida por desperdicios de tu ganancia bruta para darte tu "Utilidad Real".
- **Ganancia Proporcional:** Te indica cuáles ingredientes específicos (ej. La carne de res) son los verdaderos responsables de inyectar dinero a tu negocio.

## 6. Centro de Alertas Inteligente
Una campanita en la parte superior que monitorea tu negocio 24/7. Te avisará automáticamente si:
- Tienes insumos bajo el umbral mínimo (Stock Crítico).
- Tienes recetas cuyo costo se encareció y su margen bajó a menos del 50%.
- Tienes facturas de proveedores sin pagar.
- Tienes un faltante de dinero histórico en tu Caja.

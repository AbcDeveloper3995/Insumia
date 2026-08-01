# Manual de Usuario - Insumia (V1)

## 1. El Problema y la Necesidad que Resolvemos

### El Problema
En la industria gastronómica, uno de los mayores desafíos para los dueños de restaurantes y negocios de comida es el **control de inventario y la gestión de costos ocultos**. Muchos negocios fracasan no por falta de ventas, sino porque no saben exactamente cuánto les cuesta producir cada platillo, perdiendo dinero en mermas, robos hormiga o fluctuaciones de precios de la materia prima.

Llevar este control en hojas de cálculo de Excel o cuadernos es tedioso, propenso a errores humanos y, lo más crítico, **no ocurre en tiempo real**. Cuando un dueño de restaurante se da cuenta de que se quedó sin carne o que el costo del queso subió tanto que su hamburguesa ya no es rentable, generalmente ya es demasiado tarde.

### La Solución: Insumia
**Insumia** nace como una solución integral (SaaS) de gestión de restaurantes diseñada específicamente para cerrar la brecha entre **lo que se vende** y **lo que se gasta**. 

En lugar de tener un sistema de caja registradora (POS) separado del inventario, Insumia unifica ambos mundos. Cada vez que cobras un platillo en el mostrador, el sistema deconstruye automáticamente esa receta y descuenta los gramos exactos de los ingredientes de tu inventario en tiempo real. 

**Nuestra promesa:** Tienes el control total de tus costos, sabes exactamente cuánto ganas por plato y nunca te quedas sin stock inesperadamente.

---

## 2. Flujo de Trabajo del Sistema (Cómo Funciona)

El núcleo de Insumia opera bajo una lógica de **"Ingeniería de Menú"**:

1. **Compras (Insumos):** El administrador registra su materia prima en su unidad de compra (ej. Kilos de Carne).
2. **Diseño (Recetas):** El chef o gerente crea platillos (ej. Hamburguesa) vinculando porciones exactas de los insumos (ej. 150 gramos de carne, 1 unidad de pan).
3. **Operación (Punto de Venta):** El cajero registra la venta del platillo al cliente.
4. **Automatización (Descuento):** Insumia calcula el costo de la receta, registra la ganancia y, de manera invisible y automática, descuenta los 150 gramos de carne y 1 unidad de pan del inventario.
5. **Análisis (Dashboard):** El dueño visualiza en tiempo real las ventas, y el sistema le alerta si la carne está por agotarse.

---

## 3. Descripción de los Módulos

### Módulo 1: Inventario e Insumos
*El corazón de tus costos.*
- **Propósito:** Registrar toda la materia prima que entra a tu restaurante.
- **Funcionalidades:**
  - Crear insumos especificando su unidad de medida (Kilogramos, Litros, Unidades).
  - Registrar el costo de compra (Costo Base) para calcular la rentabilidad.
  - Definir **Umbrales Mínimos**: Si tu inventario cae por debajo de esta cantidad, el sistema generará una alerta de compra automáticamente.

### Módulo 2: Recetas y Platillos
*Tu menú inteligente.*
- **Propósito:** Diseñar los platillos que vendes al público y entender tu margen de ganancia.
- **Funcionalidades:**
  - Crear recetas vinculadas a múltiples insumos.
  - El sistema **calcula automáticamente el costo total** del plato sumando el valor fraccional de cada ingrediente (ej. si el kilo de queso cuesta $10, usar 100g sumará $1 al costo de tu receta).
  - Configurar el precio de venta al público.

### Módulo 3: Punto de Venta (POS)
*La caja registradora conectada.*
- **Propósito:** Interfaz de ventas rápida y eficiente para los cajeros.
- **Funcionalidades:**
  - Diseño intuitivo "premium" con catálogo visual de tus platillos activos.
  - Sistema de "Ticket" a la derecha para acumular productos antes de cobrar.
  - **Al hacer clic en "Cobrar":** El sistema no solo registra el ingreso de dinero, sino que lanza el algoritmo de "Deconstrucción" en la base de datos para descontar el inventario de manera segura e instantánea.

### Módulo 4: Panel Principal (Dashboard)
*El centro de mando.*
- **Propósito:** Darle al dueño una radiografía en tiempo real de la salud del negocio.
- **Funcionalidades:**
  - **KPIs en Vivo:** Total de insumos registrados, cantidad de alertas de stock crítico, recetas activas en el menú y total de ventas del día.
  - **Gráficos de Rendimiento:** Un gráfico visual interactivo que muestra el "Top 5 de Productos Más Vendidos", permitiendo identificar rápidamente cuáles son las estrellas del menú.

---

## 4. Notas Técnicas y Estandarización
La plataforma V1 ha sido diseñada bajo estrictos estándares de **Diseño SaaS Premium**:
- **Interfaz Fluida:** Todos los módulos operan dentro de una "caja de contenido" centralizada con márgenes precisos (16px), fondos claros, tipografía legible y sombras suaves. No hay saltos bruscos entre pantallas; todo se siente como una aplicación de escritorio nativa, brindando confianza al operador.
- **Base de Datos Segura:** Las operaciones críticas (como descontar inventario al vender) se ejecutan mediante Funciones (RPC) directamente en Supabase, garantizando que el stock nunca sea corrompido ni siquiera por fallas de conexión a internet.

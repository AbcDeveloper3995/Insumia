# Plan de Trabajo: Escalabilidad y Futuro de Insumia

Este documento detalla la hoja de ruta estratégica para escalar Insumia de un ERP ligero a un ecosistema integral "Enterprise" para restaurantes. Cada fase aborda una necesidad operativa avanzada y describe exactamente qué funcionalidades se agregarán y cómo se abordará su arquitectura técnica.

---

## Fase 1: Módulo de Meseros y Sistema KDS (Kitchen Display System)

### ¿Qué vamos a implementar?
Actualmente el Punto de Venta (POS) centraliza la venta en la caja. Vamos a descentralizar la toma de pedidos permitiendo que los meseros usen tablets o smartphones en las mesas, y que la cocina reciba esas comandas en una pantalla digital (KDS) en lugar de imprimir tickets de papel, agilizando la comunicación.

### ¿Cómo lo haremos?
1. **Frontend PWA (Progressive Web App):** Desarrollaremos una interfaz móvil optimizada en React que funcionará en cualquier teléfono del mesero sin necesidad de instalarla desde las tiendas de apps.
2. **Sincronización en Tiempo Real:** Utilizaremos **Supabase Realtime (WebSockets)**. Cuando el mesero presiona "Enviar" en la mesa, la orden aparecerá instantáneamente en el POS de caja y en la pantalla de la cocina sin necesidad de recargar la página.
3. **Interfaz KDS:** Se creará una vista específica para la cocina, con tarjetas tipo "Kanban" donde los cocineros podrán marcar los platos como: *Recibido -> En Preparación -> Listo para Servir*.
4. **Descuento de Inventario Diferido:** La orden quedará en estado "Abierta". El inventario preparado se descontará automáticamente cuando la orden se marque como "Pagada" en caja, manteniendo nuestra lógica actual intacta.

---

## Fase 2: Integraciones con Delivery (Agregadores)

### ¿Qué vamos a implementar?
Los restaurantes de hoy sufren al tener 3 tablets distintas (Uber Eats, Rappi, Didi Food) sonando al mismo tiempo y teniendo que pasar los pedidos a mano al sistema principal (lo que genera errores y no descuenta inventario). Vamos a centralizar todos los canales de venta directamente dentro de Insumia.

### ¿Cómo lo haremos?
1. **Edge Functions (Backend Serverless):** Desplegaremos funciones seguras (Supabase Edge Functions en Deno/Node) que actuarán como *Webhooks* públicos.
2. **Conexión de APIs:** Nos integraremos con las APIs oficiales de Uber Eats y Rappi. 
3. **Mapeo de Menú:** Crearemos una tabla de homologación donde un "Big Mac" en Uber Eats se asocie al ID de la receta "Big Mac" en Insumia.
4. **Flujo Automatizado:** Cuando entre un pedido de Rappi, el webhook de Insumia lo recibe, lo transforma a nuestro formato y dispara la misma función SQL (`registrar_venta`) que usamos en el POS, descontando el inventario automáticamente y mandando el pedido directo a la pantalla KDS de la cocina.

---

## Fase 3: Auditor IA y Proyección de Demanda (Copiloto Gastronómico)

### ¿Qué vamos a implementar?
Pasar de un sistema pasivo a un **ecosistema predictivo e inteligente**. Crearemos un "Auditor IA" (o Secretario Inteligente) integrado que trabaje de la mano con el gerente. Será capaz de analizar el historial, detectar discrepancias entre compras y ventas, gestionar activamente lotes por caducar y responder preguntas financieras complejas en lenguaje natural.

### ¿Cómo lo haremos?
1. **Auditoría de Rendimiento y Mermas:** El sistema cruzará continuamente los datos de compras, las recetas y las ventas reales para detectar mermas ocultas o robos. (Ej. *"Compraste 10kg de tomate, pero vendiste platillos que equivalen a 8kg. Tienes 2kg de merma sin justificar"*).
2. **Gestión Activa de Caducidad:** La IA monitoreará los lotes y sugerirá acciones proactivas comerciales. (Ej. *"El lote #45 de pollo caduca en 2 días, sugiero lanzar una promoción en menú hoy para recuperar la inversión"*).
3. **Asistente Conversacional (RAG):**
   - **Motor LLM:** Integración de modelos avanzados (como Gemini Pro u OpenAI).
   - **Técnica RAG (Retrieval-Augmented Generation):** Al preguntar algo a la IA en el chat integrado, el backend consultará los datos reales (Kardex, ventas recientes, inventario) y los inyectará como contexto. Esto asegura que la IA responda de manera precisa con base en los números exactos del restaurante, sin inventar datos.
4. **Proyección y Resúmenes Automáticos:** 
   - **Compras Inteligentes:** Un botón mágico que analiza clima, festivos y Kardex histórico para generar órdenes de compra sugeridas hiperprecisas.
   - **Reportes Narrativos:** Tareas en segundo plano (Cron Jobs / Edge Functions) que analizan la data el domingo por la noche y entregan el lunes un "Resumen Ejecutivo Semanal" en texto digerible.

---

## Fase 4: Portal B2B Integrado (Compras Automatizadas)

### ¿Qué vamos a implementar?
Actualmente el gerente ve qué falta en Insumia y luego tiene que llamar por teléfono o escribir por WhatsApp al proveedor de carne. Vamos a automatizar este puente, creando un mini-portal para los proveedores.

### ¿Cómo lo haremos?
1. **Órdenes de Compra (PO):** Crearemos un nuevo estado de compra ("Enviado a Proveedor").
2. **Magic Links:** Cuando el restaurante genere la orden (apoyado por la IA), Insumia enviará automáticamente un email o mensaje de WhatsApp (vía Twilio API) al proveedor con un enlace cifrado seguro.
3. **Vista de Proveedor:** Al hacer clic en el enlace, el proveedor verá la orden en una web ligera (sin necesidad de crearse una cuenta en Insumia). Podrá aceptar la orden, marcar qué cosas no tiene en stock o actualizar si algún precio cambió.
4. **Sincronización:** Al momento que el proveedor da clic en "Confirmar Envío", Insumia notifica al restaurante, actualiza los nuevos costos y deja la compra lista para ser ingresada al Kardex apenas llegue el camión.

---

## Fase 5: Facturación Electrónica Nativa (Legal & Fiscal)

### ¿Qué vamos a implementar?
Permitir que el restaurante cumpla con sus obligaciones tributarias directamente desde el POS, sin tener que recapturar el ticket en los portales lentos del gobierno (SAT en México, DIAN en Colombia, AFIP en Argentina, etc.).

### ¿Cómo lo haremos?
1. **Módulo de Facturación:** En el Punto de Venta, al cobrar, añadiremos un botón de "Solicitar Factura".
2. **Gestión de Clientes (CRM Básico):** Crearemos una tabla de clientes donde se guarden los datos fiscales (RFC/NIT, Razón Social, Uso de CFDI/Factura, Email) para clientes frecuentes.
3. **Integración con un PAC (Proveedor Autorizado de Certificación):** Nos conectaremos por API REST a un servicio de timbrado fiscal. 
4. **Flujo de Emisión:** Al confirmar, Insumia envía el JSON con el desglose de los platillos e impuestos al PAC. El PAC devuelve el XML y el PDF timbrado oficial. Insumia los almacena y los envía automáticamente por correo al cliente final.

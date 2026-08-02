# Costumia — Necesidad, Problema y Requerimientos del Sistema

## 1. Necesidad y problema a resolver

### 1.1 Contexto

Los restaurantes pequeños e independientes gestionan hoy su operación de forma
desconectada: por un lado toman órdenes y cobran (en papel, POS básico o de memoria),
y por otro llevan su inventario y compras de forma manual o intuitiva, sin ninguna
relación automática entre ambos procesos.

### 1.2 El problema

No existe una conexión automática entre **lo que se vende** y **lo que realmente se
consume de inventario**. Cada platillo vendido representa, en el fondo, una combinación
específica de insumos en cantidades exactas (gramos, mililitros, piezas), pero esa
relación (la receta) casi nunca está sistematizada ni conectada al punto de venta.

Esto genera consecuencias directas en el negocio:

- **Costeo inexacto de platillos:** el dueño no sabe con certeza cuánto le cuesta
  realmente producir cada platillo, por lo que no puede saber con precisión qué
  márgenes está obteniendo.
- **Mermas invisibles:** desperdicio, sobre-porcionado o robo de insumos no se
  detectan a tiempo porque no hay un "inventario teórico" (lo que debería quedar
  según lo vendido) contra el cual comparar el inventario físico real.
- **Compras mal calculadas:** al no conocer el consumo real proyectado, se compra de
  más (capital inmovilizado, caducidad, desperdicio) o de menos (desabasto durante
  el servicio).
- **Dependencia de una sola persona:** el conocimiento de "cuánto lleva cada
  platillo" suele vivir únicamente en la cabeza del chef o dueño, sin quedar
  documentado ni sistematizado, lo que genera vulnerabilidad operativa.

### 1.3 La necesidad

Un sistema que, a partir de una receta estandarizada por platillo, **descuente
automáticamente el inventario real** en cada venta —considerando conversión de
unidades y mermas de cada insumo— y que a partir de esa información entregue al
dueño, sin esfuerzo adicional:

- El costo real de cada platillo.
- El estado real de su inventario en todo momento.
- Alertas de desviación entre lo que debería haber (teórico) y lo que hay
  (físico).
- Recomendaciones de compra basadas en consumo real.

### 1.4 Síntesis del problema

> *"Los restaurantes saben cuánto venden, pero no saben con certeza cuánto les
> cuesta cada platillo ni por qué se les agota el inventario más rápido de lo
> esperado — y llevar ese control manualmente es tan complejo que, en la práctica,
> nadie lo hace."*

---

## 2. Requerimientos del sistema

### 2.1 Alcance del MVP

Restaurante de una sola sucursal, menú acotado, sin sistema previo. El sistema debe
resolver el ciclo completo *venta → descuento de inventario → costeo → alerta de
compra*, aunque de forma simple, sin funcionalidades avanzadas de negocio complejo
(ver sección 2.5, fuera de alcance).

### 2.2 Requerimientos funcionales

#### Módulo de Registro y Autenticación
- RF-00a: El sistema debe permitir el registro de un nuevo restaurante (creación del
  tenant), capturando al menos nombre del restaurante y datos básicos de contacto.
- RF-00b: Al registrar un restaurante, el sistema debe crear automáticamente un
  usuario administrador asociado a ese restaurante, mediante correo y contraseña.
- RF-00c: El sistema debe permitir el inicio de sesión (login) y cierre de sesión
  (logout) de usuarios registrados.
- RF-00d: El sistema debe permitir la recuperación de contraseña vía correo
  electrónico.
- RF-00e: El sistema debe garantizar que un usuario solo pueda ver y modificar la
  información del restaurante al que pertenece (aislamiento de datos entre
  restaurantes/tenants).
- RF-00f: El modelo de usuarios debe contemplar un campo de rol (`admin` para el
  MVP), preparado para roles adicionales futuros (mesero, cocina) sin necesidad de
  rediseño del modelo de datos.

#### Módulo de Recetas (núcleo del sistema)
- RF-01: El sistema debe permitir crear y editar platillos del menú.
- RF-02: Cada platillo debe tener asociada una receta compuesta por uno o más
  insumos, con su cantidad exacta y unidad de medida (gramos, mililitros, piezas).
- RF-03: El sistema debe permitir definir sub-recetas (ej. una salsa o base) que
  puedan reutilizarse dentro de otras recetas.
- RF-04: El sistema debe permitir definir, por insumo, un porcentaje de
  rendimiento/merma esperado (lo aprovechable vs. lo comprado).

#### Módulo de Insumos e Inventario
- RF-05: El sistema debe permitir dar de alta insumos, con su unidad base de uso
  (gramos, mililitros, piezas) y su unidad de compra (kg, litro, caja, etc.).
- RF-06: El sistema debe permitir definir la conversión entre unidad de compra y
  unidad base de uso para cada insumo.
- RF-07: El sistema debe mantener un inventario actualizado en tiempo real por
  insumo.
- RF-08: El sistema debe permitir registrar conteos físicos de inventario y
  compararlos automáticamente contra el inventario teórico (calculado por sistema).
- RF-09: El sistema debe generar alertas cuando el inventario de un insumo esté por
  debajo de un umbral mínimo definido.

#### Módulo de Ventas / Punto de Venta
- RF-10: El sistema debe permitir capturar una orden con uno o varios platillos del
  menú.
- RF-11: Al confirmarse una venta, el sistema debe descontar automáticamente del
  inventario los insumos correspondientes, según la receta del platillo vendido y
  las conversiones/mermas definidas.
- RF-12: El sistema debe mostrar el estado de la orden (tomada, en preparación,
  entregada, cobrada) de forma simple.

#### Módulo de Compras
- RF-13: El sistema debe permitir registrar compras de insumos, actualizando el
  inventario en la unidad de compra correspondiente, convertida a unidad base.
- RF-14: El sistema debe sugerir una lista de compra basada en el consumo real
  reciente y el inventario actual.

#### Módulo de Costeo y Reportes
- RF-15: El sistema debe calcular y mostrar el costo real por platillo, con base en
  el costo de los insumos utilizados en su receta.
- RF-16: El sistema debe generar un reporte de desviación entre inventario teórico
  y físico por período.
- RF-17: El sistema debe generar un reporte de ventas por período (platillos más
  vendidos, ingresos, márgenes estimados).

#### Módulo de Configuración / Cuenta
- RF-18: El sistema debe permitir la configuración inicial de un restaurante
  (nombre, unidades de medida disponibles, moneda).
- RF-19: El sistema debe soportar, desde el modelo de datos, la asociación de toda
  la información a un restaurante específico (preparado para multi-tenant, aunque
  el MVP opere con uno solo).

### 2.3 Requerimientos no funcionales

- RNF-01: **Usabilidad** — el sistema debe ser utilizable por personal sin
  experiencia técnica (meseros, cocineros, dueños no tecnológicos), con una curva de
  aprendizaje mínima.
- RNF-02: **Disponibilidad** — el sistema debe estar disponible durante el horario
  de operación del restaurante sin interrupciones perceptibles.
- RNF-03: **Rendimiento** — el descuento de inventario al confirmar una venta debe
  reflejarse de forma prácticamente inmediata (sin demoras perceptibles para el
  usuario).
- RNF-04: **Escalabilidad** — la arquitectura debe soportar el crecimiento de un
  restaurante a múltiples sucursales y de un solo cliente a múltiples clientes
  (modelo SaaS), sin rediseño estructural.
- RNF-05: **Responsivo** — la interfaz debe funcionar correctamente tanto en tablet
  (uso principal para toma de órdenes) como en desktop (uso administrativo).
- RNF-06: **Seguridad de datos** — la información de cada restaurante debe estar
  aislada y protegida frente a otros restaurantes/clientes del sistema, mediante
  políticas de aislamiento a nivel de base de datos (no solo validación en la
  aplicación).
- RNF-07: **Mantenibilidad** — el código debe seguir una arquitectura modular y
  componentizada que permita agregar funcionalidades futuras sin afectar los módulos
  existentes.

### 2.4 Requerimientos de datos clave

- Todo insumo debe tener: unidad base, unidad de compra, factor de conversión,
  costo por unidad de compra, y porcentaje de rendimiento.
- Toda receta debe poder expresarse como una lista de pares
  (insumo, cantidad, unidad).
- Toda venta debe quedar trazada hacia el detalle de insumos que descontó, para
  fines de auditoría y reportes de desviación.
- Un restaurante puede tener varios usuarios asociados (relación 1 a N, no 1 a 1);
  cada usuario pertenece a un único restaurante y tiene un rol asignado.

### 2.5 Fuera de alcance del MVP

- Multi-sucursal (el modelo de datos lo contempla, pero no se implementa la lógica).
- Permisos granulares por rol de personal.
- Facturación fiscal / integración contable.
- Mermas variables por proveedor o por lote.
- Integraciones con plataformas de delivery de terceros.

---

## 3. Criterio de éxito del MVP

El MVP se considera exitoso si el dueño del restaurante puede, sin ayuda externa:

1. Dar de alta su menú con recetas en menos de un día de trabajo.
2. Ver el costo real de al menos un platillo calculado automáticamente por el
   sistema.
3. Ver su inventario descontarse automáticamente tras una venta real, sin
   intervención manual.
4. Detectar al menos una desviación entre inventario teórico y físico gracias al
   sistema, que antes no hubiera podido detectar.

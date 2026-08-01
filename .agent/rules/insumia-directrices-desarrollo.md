# Directrices de Desarrollo — Proyecto Costumia

## 1. Contexto del proyecto

**Costumia** es un sistema SaaS multi-tenant para restaurantes que conecta automáticamente
las ventas con el inventario real mediante recetas (conversión platillo → insumos → gramaje).

**Core loop del negocio (debe reflejarse en la arquitectura):**
```
Venta de platillo → Explosión de receta → Conversión de unidades
→ Descuento de inventario → Comparación teórico vs. físico → Alertas/reportes
```

**MVP objetivo:** restaurante pequeño, 1 sucursal, menú acotado, sin sistema previo.
**Visión a futuro:** producto SaaS multi-tenant, multi-sucursal, con suscripción.
Aunque el MVP es simple, la arquitectura debe construirse pensando en multi-tenancy desde
el día uno (no como parche posterior).

---

## 2. Stack tecnológico (obligatorio)

- **Frontend:** React (versión estable más reciente), funcional únicamente — nada de
  componentes de clase.
- **Lenguaje:** JavaScript ES6+ puro. No se permite TypeScript salvo indicación futura
  explícita. Usar sintaxis moderna: arrow functions, destructuring, spread/rest,
  optional chaining (`?.`), nullish coalescing (`??`), módulos ES (`import`/`export`).
- **Gestión de estado:** Context API + hooks (`useReducer`) para estado global simple.
  Si la complejidad crece, evaluar Zustand antes que Redux (menos boilerplate).
- **CSS:** tecnologías modernas — CSS Modules o Tailwind CSS (a decidir en el
  kickoff técnico, pero uno de los dos, nunca CSS global sin scope ni estilos inline
  masivos). Se permite CSS variables (`:root`) para theming (colores de marca,
  espaciados, tipografía) de forma centralizada.
- **Data fetching:** capa de servicios propia (ver sección 5), no llamadas `fetch`
  sueltas dentro de componentes.
- **Formularios:** React Hook Form (o equivalente ligero) para formularios complejos
  (ej. captura de recetas con múltiples ingredientes dinámicos).
- **Linter/Formateo:** ESLint + Prettier configurados desde el inicio del repo, con
  reglas estrictas (`no-unused-vars`, `eslint-plugin-react-hooks`, etc.). Ningún PR
  se integra con warnings de lint sin resolver.

---

## 3. Principios de arquitectura y código robusto

1. **Componentización estricta:** cada componente hace una sola cosa (principio de
   responsabilidad única). Si un componente supera ~150-200 líneas o mezcla lógica de
   presentación con lógica de negocio, debe dividirse.
2. **Separación de capas:**
   - **UI (components/)** — solo presentación, recibe props, no contiene lógica de
     negocio ni llamadas a API directas.
   - **Lógica de negocio/hooks (hooks/)** — hooks personalizados que encapsulan
     lógica reutilizable (ej. `useRecetaCalculada`, `useInventarioDisponible`).
   - **Servicios/API (services/)** — toda comunicación con backend/API vive aquí,
     nunca dentro de un componente.
   - **Utilidades puras (utils/)** — funciones puras, testeables, sin side-effects
     (ej. conversión de unidades, cálculo de mermas).
3. **Sin lógica de negocio en JSX.** Si hay un cálculo (conversión de gramos, costeo,
   porcentaje de rendimiento), vive en `utils/` o en un hook, nunca inline en el
   render.
4. **Componentes controlados y predecibles:** evitar estado implícito o efectos
   colaterales no documentados. Todo `useEffect` debe tener un comentario breve
   explicando por qué existe.
5. **Manejo de errores explícito:** toda llamada asíncrona (API, storage) debe manejar
   estados de `loading`, `error` y `success` de forma consistente. No se permite dejar
   promesas sin `catch`.
6. **Nombrado consistente y semántico:**
   - Componentes: `PascalCase` (`RecetaForm.jsx`)
   - Hooks: `camelCase` con prefijo `use` (`useInventario.js`)
   - Utilidades/servicios: `camelCase` (`conversionUnidades.js`)
   - Constantes globales: `UPPER_SNAKE_CASE`
7. **Comentarios con propósito:** comentar el "por qué", no el "qué" (el código ya
   dice el qué). Priorizar nombres de variables/funciones autoexplicativos sobre
   comentarios extensos.
8. **Sin números ni strings mágicos:** todo valor de negocio relevante (unidades de
   medida, umbrales de merma, roles) va en constantes o configuración centralizada,
   nunca hardcodeado disperso en el código.

---

## 4. Estructura de carpetas propuesta

```
src/
├── components/
│   ├── common/          # botones, inputs, modales reutilizables (design system)
│   ├── recetas/         # componentes específicos del módulo de recetas
│   ├── inventario/
│   ├── ventas/
│   └── layout/          # header, sidebar, layout general
├── hooks/
├── services/
│   ├── api/              # cliente HTTP base + endpoints por dominio
│   └── auth/
├── utils/
│   ├── conversiones.js   # lógica de conversión de unidades (crítica del negocio)
│   ├── costeo.js
│   └── validaciones.js
├── context/               # Context providers globales
├── constants/             # unidades de medida, roles, configuración
├── styles/                 # variables CSS globales, temas
├── pages/ (o routes/)      # vistas/páginas de nivel superior
└── App.jsx
```

**Regla:** ningún módulo de negocio (recetas, inventario, ventas) debe importar
directamente de otro módulo de negocio sin pasar por `services/` o `hooks/`
compartidos — evita acoplamiento fuerte entre dominios.

---

## 5. Capa de servicios / API

- Un único cliente HTTP base (`services/api/client.js`) centraliza configuración
  (baseURL, headers, manejo de tenant/restaurante activo, manejo de token de auth).
- Cada dominio de negocio tiene su propio archivo de servicio
  (`services/api/recetas.js`, `services/api/inventario.js`, etc.) que expone
  funciones puras (`getRecetas()`, `crearReceta(data)`), nunca lógica de UI.
- Toda respuesta de error del backend debe normalizarse a un formato consistente
  antes de llegar a los componentes.

---

## 6. Multi-tenancy (pensado desde el inicio, aunque el MVP sea 1 restaurante)

- Todo dato de negocio (recetas, inventario, ventas) debe estar asociado a un
  `restauranteId` / `tenantId` desde el modelo de datos y en cada llamada de servicio,
  aunque en el MVP solo exista un tenant activo.
- El contexto de "restaurante activo" debe vivir en un Context/estado global único,
  nunca duplicado o inferido en cada componente.
- **Modelo de relación:** un Restaurante puede tener varios Usuarios (no es 1 a 1).
  El MVP opera con un solo usuario admin por restaurante, pero el modelo de datos debe
  contemplar desde el inicio la relación `Restaurante 1 --- N Usuario`, con un campo de
  rol (`admin`, y roles futuros como `mesero`/`cocina` sin implementar aún su lógica).

---

## 7. Base de datos / Backend-as-a-Service: Supabase (obligatorio)

- **Motor:** Supabase (Postgres) como base de datos y backend-as-a-service principal
  del proyecto. Se elige por tres razones: (1) es Postgres real, adecuado para el
  modelo relacional del negocio (recetas, insumos, conversiones, inventario); (2)
  Row Level Security (RLS) nativo, que resuelve el aislamiento multi-tenant a nivel
  de base de datos, no solo en código de aplicación; (3) Auth integrado, que evita
  construir desde cero login/registro/recuperación de contraseña.
- **Row Level Security (RLS):** obligatorio en todas las tablas de negocio
  (`recetas`, `insumos`, `inventario`, `ventas`, `compras`, etc.). Cada política debe
  filtrar por `restaurante_id`, de forma que un usuario nunca pueda leer ni modificar
  datos de un restaurante distinto al suyo, incluso ante un error en el frontend o
  backend de aplicación.
- **Autenticación:** usar Supabase Auth para el flujo de registro/login. La tabla de
  `usuarios` de negocio debe vincularse a `auth.users` de Supabase mediante el `id`
  de usuario, agregando los campos propios del negocio (`restaurante_id`, `rol`,
  `nombre`).
- **Acceso a datos desde el frontend:** usar el cliente oficial de Supabase
  (`@supabase/supabase-js`) encapsulado dentro de la capa de `services/` (ver
  sección 5) — nunca invocado directamente desde componentes de UI. Esto mantiene
  la posibilidad de migrar de proveedor en el futuro sin reescribir componentes.
- **Migraciones:** todo cambio de esquema de base de datos debe manejarse mediante
  migraciones versionadas (Supabase CLI / SQL migrations), nunca modificaciones
  manuales directas en producción vía dashboard sin registro.

---

## 8. CSS moderno — lineamientos

- Diseño basado en **design tokens** (variables CSS): colores, tipografía, espaciados,
  radios de borde definidos una sola vez y reutilizados (nada de valores sueltos
  repetidos en cada componente).
- Mobile-first: el sistema debe verse bien en tablet (uso principal del mesero) y
  en desktop (uso del dueño/administrador).
- Uso de Flexbox/CSS Grid para layouts — nada de posicionamiento absoluto forzado
  salvo casos justificados (modales, tooltips).
- Transiciones/animaciones sutiles con CSS nativo (`transition`, `@keyframes`),
  evitar librerías pesadas de animación salvo necesidad real.
- Componentes de UI reutilizables (botones, inputs, cards, tablas) deben vivir en
  `components/common/` y formar la base de un mini design system propio del producto.

---

## 9. Calidad y mantenibilidad

- Cada función/componente debe ser fácilmente testeable de forma aislada (evitar
  dependencias ocultas del DOM global o de módulos externos no inyectados).
- Priorizar funciones puras en `utils/`, especialmente en la lógica crítica de
  conversión de unidades y costeo — esta lógica debe tener tests unitarios desde
  el inicio por ser el corazón del producto.
- Código muerto, imports no usados o componentes no referenciados deben eliminarse
  antes de cada entrega, no acumularse "por si acaso".
- Commits pequeños y descriptivos, alineados a una funcionalidad concreta.

---

## 10. Fuera de alcance para el MVP (no sobre-construir)

- Multi-sucursal
- Manejo de permisos granulares por rol de personal
- Facturación fiscal / integración contable
- Mermas variables por proveedor

El agente debe evitar añadir complejidad de estas áreas "por si acaso" — el modelo
de datos puede dejar espacio para ellas (ej. campo `restauranteId` ya presente), pero
la lógica de negocio no debe implementarse hasta que se solicite explícitamente.

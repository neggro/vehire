# Panel de Administración - Vehire

> Última actualización: 2026-03-14

Documentación completa del panel de administración de la plataforma Vehire.

---

## Índice

1. [Arquitectura y Seguridad](#arquitectura-y-seguridad)
2. [Sistema de Permisos](#sistema-de-permisos)
3. [Rutas y Páginas](#rutas-y-páginas)
4. [API Routes](#api-routes)
5. [Estructura de Archivos](#estructura-de-archivos)
6. [Guía de Uso](#guía-de-uso)
7. [Notas Técnicas](#notas-técnicas)

---

## Arquitectura y Seguridad

El acceso al admin está protegido por **dos capas de seguridad independientes**, ambas usando Prisma (conexión directa a PostgreSQL):

### Capa 1: Admin Layout (Server Component)

```
src/app/(dashboard)/admin/layout.tsx
```

- Ejecuta `getAdminUser()` de `@/lib/admin.ts`
- Verifica que el usuario tenga el rol `ADMIN` en su array de `roles`
- Si no es admin, redirige a `/dashboard`
- Filtra los ítems del menú lateral según los permisos del admin (`adminPermissions`)

### Capa 2: API Routes

```
src/app/api/admin/*/route.ts
```

- Cada endpoint usa `requireAdmin(ADMIN_PERMISSIONS.XXX)`
- Verifica autenticación (401 si no está logueado)
- Verifica rol ADMIN (403 si no es admin)
- Verifica permiso específico (403 si no tiene el permiso requerido)

### Por qué NO se verifica en el Middleware

El middleware de Next.js corre en **Edge Runtime**, que no soporta Prisma. Intentar consultar la tabla `users` vía el cliente Supabase (PostgREST) falla porque las tablas creadas por Prisma no tienen políticas RLS configuradas en Supabase, y otorgar grants abiertos comprometería la seguridad.

El middleware solo verifica que el usuario esté **autenticado** para rutas protegidas (incluida `/admin`). La verificación de rol se delega al layout y las API routes, que sí pueden usar Prisma.

### Helpers de Admin

```typescript
// src/lib/admin.ts

// Para API routes - retorna { user } o { error: NextResponse }
requireAdmin(permission?: AdminPermission)

// Para Server Components - retorna AdminUser | null
getAdminUser()

// Verifica un permiso específico (admin:full concede todo)
hasPermission(adminPermissions: string[], permission: AdminPermission)
```

---

## Sistema de Permisos

### Modelo de datos

El campo `adminPermissions` en el modelo `User` (Prisma) es un array de strings:

```prisma
model User {
  // ...
  roles             UserRole[]  @default([USER, DRIVER])
  adminPermissions  String[]    @default([])
  // ...
}
```

Un usuario necesita **dos cosas** para acceder al admin:
1. Tener `ADMIN` en su array de `roles`
2. Tener permisos específicos en `adminPermissions`

### Permisos disponibles

| Permiso | Valor | Acceso |
|---------|-------|--------|
| Acceso total | `admin:full` | Super admin. Concede acceso a **todas** las secciones sin necesidad de permisos individuales |
| Usuarios | `admin:users` | Ver, editar roles, cambiar KYC status, asignar permisos admin |
| Vehículos | `admin:vehicles` | Ver, aprobar, rechazar, pausar, activar vehículos |
| Reservas | `admin:bookings` | Ver todas las reservas, ver detalles completos |
| Pagos | `admin:payments` | Ver pagos, revenue, comisiones, información financiera |
| KYC | `admin:kyc` | Revisar documentos KYC, aprobar o rechazar verificaciones |
| Configuración | `admin:settings` | Editar parámetros de la plataforma (comisiones, límites, etc.) |
| Incidentes | `admin:incidents` | Gestionar incidentes reportados en reservas |

### Comportamiento del menú

El sidebar del admin muestra dinámicamente solo las secciones a las que el admin tiene acceso:

- **Dashboard** (`/admin`): siempre visible para cualquier admin
- Las demás entradas se muestran solo si el admin tiene el permiso correspondiente
- Un admin con `admin:full` ve todas las entradas
- Un admin con `["admin:users", "admin:vehicles"]` solo ve Dashboard, Usuarios y Vehículos

### Constantes

```typescript
// src/constants/index.ts
import { ADMIN_PERMISSIONS, ADMIN_PERMISSION_LABELS } from "@/constants";

ADMIN_PERMISSIONS.FULL       // "admin:full"
ADMIN_PERMISSIONS.USERS      // "admin:users"
ADMIN_PERMISSIONS.VEHICLES   // "admin:vehicles"
ADMIN_PERMISSIONS.BOOKINGS   // "admin:bookings"
ADMIN_PERMISSIONS.PAYMENTS   // "admin:payments"
ADMIN_PERMISSIONS.KYC        // "admin:kyc"
ADMIN_PERMISSIONS.SETTINGS   // "admin:settings"
ADMIN_PERMISSIONS.INCIDENTS  // "admin:incidents"
```

### Asignar permisos a un admin

Desde `/admin/users/[id]`:
1. Marcar el checkbox de rol `ADMIN`
2. Aparecen las opciones de permisos
3. Toggle "Super Admin" = `admin:full` (acceso total)
4. O seleccionar permisos individuales
5. Guardar

Vía Prisma directamente:
```typescript
await prisma.user.update({
  where: { id: "..." },
  data: {
    roles: ["DRIVER", "ADMIN"],
    adminPermissions: ["admin:full"],
  },
});
```

---

## Rutas y Páginas

### `/admin` - Dashboard

- **Tipo**: Server Component
- **Permisos**: cualquier admin
- **Funcionalidad**:
  - Stats en tiempo real: usuarios totales, hosts, vehículos activos, KYC pendientes, reservas activas
  - Revenue mensual (solo visible si tiene permiso `admin:payments`)
  - Actividad reciente: últimas 5 reservas con estado y detalles
  - Acciones rápidas filtradas por permisos del admin

### `/admin/users` - Gestión de Usuarios

- **Tipo**: Client Component
- **Permisos**: `admin:users`
- **API**: `GET /api/admin/users`
- **Funcionalidad**:
  - Tabla de usuarios con avatar, nombre, email, roles (badges), KYC status, conteo de vehículos/reservas
  - Búsqueda por nombre o email (debounced)
  - Filtros: por rol, por KYC status
  - Paginación server-side
  - Click en fila navega al detalle

### `/admin/users/[id]` - Detalle de Usuario

- **Tipo**: Client Component
- **Permisos**: `admin:users`
- **API**: `GET/PATCH /api/admin/users/[id]`
- **Funcionalidad**:
  - Perfil completo: avatar, nombre, email, teléfono, fecha de registro
  - Edición de roles (checkboxes: HOST, DRIVER, ADMIN)
  - Edición de permisos admin (aparece cuando se activa rol ADMIN)
  - Cambio de KYC status
  - Lista de documentos KYC del usuario
  - Tabla de reservas recientes
  - **Protección**: no se puede quitar el rol ADMIN a uno mismo ni cambiar sus propios permisos

### `/admin/vehicles` - Gestión de Vehículos

- **Tipo**: Client Component
- **Permisos**: `admin:vehicles`
- **API**: `GET /api/admin/vehicles`
- **Funcionalidad**:
  - Tabla: imagen, marca/modelo/año, host, ciudad, precio/día, status, reservas
  - Filtros: status (DRAFT, PENDING_APPROVAL, ACTIVE, PAUSED, REJECTED), búsqueda
  - Botones de acción rápida para aprobar/rechazar vehículos pendientes
  - Paginación

### `/admin/vehicles/[id]` - Detalle de Vehículo

- **Tipo**: Client Component
- **Permisos**: `admin:vehicles`
- **API**: `GET/PATCH /api/admin/vehicles/[id]`
- **Funcionalidad**:
  - Galería de imágenes
  - Especificaciones: marca, modelo, año, color, patente, asientos, transmisión, combustible, features
  - Card del host (link al admin user page)
  - Precios: base, fin de semana, delivery
  - Gestión de status: dropdown + notas + botón guardar
  - Reservas recientes del vehículo

### `/admin/bookings` - Gestión de Reservas

- **Tipo**: Client Component
- **Permisos**: `admin:bookings`
- **API**: `GET /api/admin/bookings`
- **Funcionalidad**:
  - Tabla: vehículo, conductor, host, fechas, monto, status, estado de pago
  - Filtros: status, rango de fechas
  - Paginación

### `/admin/bookings/[id]` - Detalle de Reserva

- **Tipo**: Client Component
- **Permisos**: `admin:bookings`
- **API**: `GET /api/admin/bookings/[id]`
- **Funcionalidad**:
  - Info de reserva: fechas, horarios, status, desglose de montos
  - Card del vehículo con imagen
  - Cards de conductor y host
  - Info de pago: proveedor, status, IDs de transacción
  - Lista de incidentes (si hay)
  - Review (si existe)

### `/admin/payments` - Pagos

- **Tipo**: Client Component
- **Permisos**: `admin:payments`
- **API**: `GET /api/admin/payments`
- **Funcionalidad**:
  - Cards resumen: total cobrado (mes), comisiones plataforma, pagos pendientes
  - Tabla: booking, vehículo, conductor, host, monto, comisión, proveedor (MP/PayPal), status, fecha
  - Filtros: status, proveedor, rango de fechas
  - Paginación

### `/admin/kyc` - Verificación KYC

- **Tipo**: Client Component
- **Permisos**: `admin:kyc`
- **API**: `GET /api/admin/kyc`, `PATCH /api/admin/kyc/[id]`
- **Funcionalidad**:
  - Tabs: Pendientes, Verificados, Rechazados
  - Cada entrada: usuario (avatar, nombre, email), documentos enviados, fecha
  - Vista expandible para ver imágenes de documentos
  - Botones aprobar/rechazar con diálogo de confirmación y notas opcionales
  - Auto-actualiza `user.kycStatus` cuando todos los documentos están verificados o alguno es rechazado

### `/admin/settings` - Configuración

- **Tipo**: Client Component
- **Permisos**: `admin:settings`
- **API**: `GET/PUT /api/admin/settings`
- **Funcionalidad**:
  - Cards editables para parámetros de plataforma:
    - Comisión de plataforma (%)
    - Depósito (%)
    - Markup fin de semana (%)
    - Días mínimos/máximos de reserva
    - Horas de cancelación gratuita
  - Cada card tiene modo edición inline con input y botón guardar
  - Upsert en `SystemConfig` (crea si no existe)

---

## API Routes

Todos los endpoints están bajo `/api/admin/` y usan `requireAdmin()` con el permiso correspondiente.

| Método | Endpoint | Permiso | Descripción |
|--------|----------|---------|-------------|
| GET | `/api/admin/stats` | (cualquier admin) | Stats del dashboard. Revenue solo si tiene PAYMENTS |
| GET | `/api/admin/users` | USERS | Lista usuarios paginada con filtros |
| GET | `/api/admin/users/[id]` | USERS | Detalle de usuario |
| PATCH | `/api/admin/users/[id]` | USERS | Editar roles, permisos, KYC status |
| GET | `/api/admin/vehicles` | VEHICLES | Lista vehículos paginada con filtros |
| GET | `/api/admin/vehicles/[id]` | VEHICLES | Detalle de vehículo |
| PATCH | `/api/admin/vehicles/[id]` | VEHICLES | Cambiar status de vehículo |
| GET | `/api/admin/bookings` | BOOKINGS | Lista reservas paginada con filtros |
| GET | `/api/admin/bookings/[id]` | BOOKINGS | Detalle completo de reserva |
| GET | `/api/admin/payments` | PAYMENTS | Lista pagos paginada con filtros |
| GET | `/api/admin/kyc` | KYC | Lista documentos KYC con filtros |
| GET | `/api/admin/kyc/[id]` | KYC | Detalle de documento KYC |
| PATCH | `/api/admin/kyc/[id]` | KYC | Aprobar/rechazar documento KYC |
| GET | `/api/admin/settings` | SETTINGS | Obtener configuración de plataforma |
| PUT | `/api/admin/settings` | SETTINGS | Actualizar configuración de plataforma |

### Respuestas de error

| Código | Significado |
|--------|-------------|
| 401 | No autenticado |
| 403 | No tiene rol ADMIN o no tiene el permiso requerido |
| 404 | Recurso no encontrado |
| 400 | Datos inválidos en el request |

### Paginación

Las rutas de listado aceptan los query params:
- `page` (default: 1)
- `limit` (default: 12, max: 50)
- `sortBy` (varía por endpoint)
- `sortOrder` (`asc` | `desc`, default: `desc`)

Respuesta:
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 12,
    "totalPages": 13
  }
}
```

---

## Estructura de Archivos

```
src/
├── lib/
│   └── admin.ts                          # Helpers: requireAdmin, getAdminUser, hasPermission
│
├── constants/
│   └── index.ts                          # ADMIN_PERMISSIONS, ADMIN_PERMISSION_LABELS
│
├── app/
│   ├── (dashboard)/admin/
│   │   ├── layout.tsx                    # Layout con sidebar, verificación de rol + permisos
│   │   ├── admin-mobile-nav.tsx          # Nav mobile (botón flotante + dialog)
│   │   ├── page.tsx                      # Dashboard (Server Component, datos reales)
│   │   ├── users/
│   │   │   ├── page.tsx                  # Lista de usuarios
│   │   │   └── [id]/page.tsx             # Detalle/edición de usuario
│   │   ├── vehicles/
│   │   │   ├── page.tsx                  # Lista de vehículos
│   │   │   └── [id]/page.tsx             # Detalle/gestión de vehículo
│   │   ├── bookings/
│   │   │   ├── page.tsx                  # Lista de reservas
│   │   │   └── [id]/page.tsx             # Detalle de reserva
│   │   ├── payments/
│   │   │   └── page.tsx                  # Pagos e ingresos
│   │   ├── kyc/
│   │   │   └── page.tsx                  # Revisión de documentos KYC
│   │   └── settings/
│   │       └── page.tsx                  # Configuración de plataforma
│   │
│   └── api/admin/
│       ├── stats/route.ts                # GET stats
│       ├── users/
│       │   ├── route.ts                  # GET lista
│       │   └── [id]/route.ts             # GET detalle, PATCH editar
│       ├── vehicles/
│       │   ├── route.ts                  # GET lista
│       │   └── [id]/route.ts             # GET detalle, PATCH status
│       ├── bookings/
│       │   ├── route.ts                  # GET lista
│       │   └── [id]/route.ts             # GET detalle
│       ├── payments/
│       │   └── route.ts                  # GET lista
│       ├── kyc/
│       │   ├── route.ts                  # GET lista
│       │   └── [id]/route.ts             # GET detalle, PATCH aprobar/rechazar
│       └── settings/
│           └── route.ts                  # GET config, PUT actualizar
│
└── prisma/
    └── schema.prisma                     # User.adminPermissions: String[]
```

---

## Guía de Uso

### Crear un nuevo admin

1. Ir a `/admin/users`
2. Buscar al usuario por nombre o email
3. Click en el usuario para ir al detalle
4. En la sección de roles, marcar `ADMIN`
5. Aparecerá la sección de permisos:
   - Activar "Super Admin" para acceso total (`admin:full`)
   - O seleccionar permisos individuales según lo que deba administrar
6. Guardar cambios

### Ejemplo: Admin solo de vehículos y KYC

```
roles: [DRIVER, ADMIN]
adminPermissions: ["admin:vehicles", "admin:kyc"]
```

Este admin verá en su sidebar:
- Dashboard (siempre)
- Vehículos
- KYC

No tendrá acceso a: Usuarios, Reservas, Pagos, Configuración.

### Aprobar un vehículo

1. Ir a `/admin/vehicles`
2. Filtrar por status "Pendiente de aprobación"
3. Click en "Aprobar" directamente desde la tabla, o click en el vehículo para ver detalle
4. En el detalle, cambiar status a "Activo" y opcionalmente agregar notas
5. Guardar

### Revisar KYC

1. Ir a `/admin/kyc`
2. En la tab "Pendientes", expandir un usuario para ver sus documentos
3. Click en "Aprobar" o "Rechazar"
4. Si se rechaza, agregar notas explicando el motivo
5. Cuando todos los documentos del usuario son aprobados, su `kycStatus` se actualiza automáticamente a `VERIFIED`

---

## Notas Técnicas

### Relación Auth ↔ Users

- El `id` de la tabla `users` (Prisma) es el mismo UUID que `auth.users` de Supabase
- Se establece en el callback de autenticación: `id: user.id`
- No hay FK explícita porque `auth.users` es una tabla interna de Supabase no accesible desde Prisma

### Edge Runtime y Prisma

El middleware de Next.js corre en Edge Runtime y **no puede usar Prisma**. Por eso:
- El middleware solo verifica autenticación (sesión válida)
- La verificación de rol ADMIN se hace en el layout (Server Component) y API routes (Node.js runtime), donde Prisma sí está disponible

### Tabla users y Supabase PostgREST

La tabla `users` fue creada por Prisma (conexión directa a PostgreSQL). Los roles de Supabase (`anon`, `authenticated`) no tienen permisos de lectura sobre ella. Esto es intencional:
- Evita acceso no autorizado vía la API REST de Supabase
- Todas las consultas a `users` pasan por Prisma
- Solo `service_role` tiene SELECT (necesario para operaciones internas de Supabase)

### SystemConfig

La tabla `SystemConfig` almacena configuración dinámica de la plataforma como key-value (JSON):

```typescript
{ key: "platform_fee_percent", value: 15, description: "..." }
```

Los valores de las constantes en `src/constants/index.ts` son los defaults hardcodeados. La página de settings permite overridearlos dinámicamente vía `SystemConfig`.

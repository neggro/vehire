# Vehire Marketplace - Registro de Progreso

> Última actualización: 2026-03-10

Este documento lleva un registro detallado de todas las funcionalidades implementadas, comparándolas con el plan original y documentando cambios o adiciones.

---

## Índice

1. [Resumen del Plan Original](#resumen-del-plan-original)
2. [Estado Actual por Fase](#estado-actual-por-fase)
3. [Funcionalidades Implementadas](#funcionalidades-implementadas)
4. [Estructura de Archivos Creados](#estructura-de-archivos-creados)
5. [Pendientes y Próximos Pasos](#pendientes-y-próximos-pasos)
6. [Cambios respecto al Plan Original](#cambios-respecto-al-plan-original)
7. [Notas Técnicas](#notas-técnicas)

---

## Resumen del Plan Original

### Stack Tecnológico Confirmado
| Categoría | Tecnología | Estado |
|-----------|------------|--------|
| Framework | Next.js 14+ (App Router) | ✅ Implementado |
| Database | Supabase (PostgreSQL) | ✅ Implementado |
| ORM | Prisma | ✅ Implementado |
| Styling | Tailwind CSS + shadcn/ui | ✅ Implementado |
| Auth | Supabase Auth | ✅ Implementado |
| Payments | Mercado Pago | ⚠️ Estructura lista, falta integración completa |
| Email | Resend | ⚠️ Templates listos, falta configuración |
| Maps | Google Maps API | ✅ Implementado |
| Storage | Supabase Storage | ✅ Implementado |
| AI | OpenAI API | ⚠️ Estructura lista, falta implementar |
| Hosting | Vercel | 🔜 Pendiente |

### Timeline Original
- **Fase 1 (Semanas 1-10):** MVP Core
- **Fase 2 (Semanas 11-14):** Pagos Avanzados
- **Fase 3 (Semanas 15-18):** IA Inicial
- **Fase 4 (Semanas 19-22):** Mobile Evolution
- **Fase 5 (Semanas 23-26):** Marketplace Optimization

---

## Estado Actual por Fase

### FASE 1: MVP Core - Estado: ~85% Completado

#### Sprint 1-2: Fundación ✅ COMPLETADO
- [x] Setup proyecto Next.js 14+ con App Router
- [x] Configurar Supabase (Auth + DB)
- [x] Configurar Prisma + schema inicial
- [x] Setup Tailwind + tema claro/oscuro
- [x] Componentes UI base (shadcn/ui)
- [x] Layout responsive base
- [x] Auth: registro, login, logout
- [x] Middleware de protección de rutas

#### Sprint 3-4: Gestión de Vehículos ✅ COMPLETADO
- [x] CRUD vehículos (host)
- [x] Upload de imágenes (Supabase Storage)
- [x] Calendario de disponibilidad
- [x] Configuración de precios base
- [x] Estado del vehículo (draft/pendiente/activo)
- [x] Vista admin para aprobar vehículos

#### Sprint 5-6: Búsqueda y Descubrimiento ✅ COMPLETADO
- [x] Página de búsqueda con filtros
- [x] Integración Google Maps
- [x] Cards de vehículos
- [x] Página de detalle de vehículo
- [x] Vista de mapa con marcadores
- [x] Toggle entre vista grilla/lista/mapa

#### Sprint 7-8: Reservas y Pagos ⚠️ PARCIAL
- [x] Flujo de reserva (frontend)
- [x] Integración Mercado Pago (estructura)
- [x] Webhooks de pago (handler)
- [x] Modelo de payment/escrow básico
- [x] Emails transaccionales (templates)
- [ ] Integración real con Mercado Pago
- [ ] Testing de webhooks

#### Sprint 9-10: KYC, Reviews y Polish ✅ COMPLETADO
- [x] Sistema KYC manual
  - [x] Upload documentos
  - [x] Panel admin revisión
  - [x] Estados y notificaciones
- [x] Sistema de reviews bidireccionales
- [x] Dashboards básicos (host/driver)
- [ ] Testing E2E críticos
- [ ] Optimización performance

### FASE 2: Pagos Avanzados - Estado: 0%
- [ ] Escrow completo (retención automática)
- [ ] Depósito de garantía
- [ ] Liberación programada de pagos
- [ ] Reembolsos parciales/totales
- [ ] Dashboard financiero para host
- [ ] Reportes de ingresos

### FASE 3: IA Inicial - Estado: 10%
- [x] Estructura modular preparada
- [ ] Chatbot de soporte (OpenAI)
- [ ] Motor de pricing sugerido
- [ ] Generación de descripciones

### FASE 4: Mobile Evolution - Estado: 0%
- [ ] PWA completa
- [ ] Optimizaciones mobile
- [ ] Push notifications

### FASE 5: Marketplace Optimization - Estado: 0%
- [ ] Búsqueda avanzada
- [ ] Sistema de notificaciones completo
- [ ] Programas de lealtad
- [ ] Analytics dashboard

---

## Funcionalidades Implementadas

### Autenticación y Usuarios
| Funcionalidad | Archivo(s) | Estado |
|---------------|------------|--------|
| Registro de usuarios | `src/app/(auth)/register/page.tsx` | ✅ |
| Login | `src/app/(auth)/login/page.tsx` | ✅ |
| Verificación de email | `src/app/(auth)/verify/page.tsx` | ✅ |
| OAuth callback | `src/app/api/auth/callback/route.ts` | ✅ |
| Logout | `src/app/api/auth/signout/route.ts` | ✅ |
| Middleware de protección | `src/lib/supabase/middleware.ts` | ✅ |
| Client Supabase (server) | `src/lib/supabase/server.ts` | ✅ |
| Client Supabase (browser) | `src/lib/supabase/client.ts` | ✅ |

### Gestión de Vehículos (Host)
| Funcionalidad | Archivo(s) | Estado |
|---------------|------------|--------|
| Lista de vehículos | `src/app/(dashboard)/host/vehicles/page.tsx` | ✅ |
| Crear vehículo (wizard) | `src/app/(dashboard)/host/vehicles/new/page.tsx` | ✅ |
| Upload de imágenes | `src/components/upload/image-upload.tsx` | ✅ |
| Storage helper | `src/lib/storage.ts` | ✅ |
| Calendario disponibilidad | `src/app/(dashboard)/host/vehicles/[id]/availability/page.tsx` | ✅ |
| Componente calendario | `src/components/booking/availability-calendar.tsx` | ✅ |

### Búsqueda y Descubrimiento
| Funcionalidad | Archivo(s) | Estado |
|---------------|------------|--------|
| Página de búsqueda | `src/app/(public)/search/page.tsx` | ✅ |
| Búsqueda con filtros | `src/components/search/search-with-map.tsx` | ✅ |
| Vista grilla/lista/mapa | `src/components/search/search-with-map.tsx` | ✅ |
| Integración Google Maps | `src/components/map/vehicle-map.tsx` | ✅ |
| Detalle de vehículo | `src/app/(public)/vehicle/[id]/page.tsx` | ✅ |

### Reservas
| Funcionalidad | Archivo(s) | Estado |
|---------------|------------|--------|
| Flujo de reserva | `src/app/(public)/booking/[id]/page.tsx` | ✅ |
| Página de éxito | `src/app/(public)/booking/success/page.tsx` | ✅ |
| Cálculo de precios | `src/lib/bookings.ts` | ✅ |
| Mis reservas (driver) | `src/app/(dashboard)/dashboard/bookings/page.tsx` | ✅ |
| Reservas (host) | `src/app/(dashboard)/host/bookings/page.tsx` | ✅ |

### Pagos
| Funcionalidad | Archivo(s) | Estado |
|---------------|------------|--------|
| Webhook Mercado Pago | `src/app/api/webhooks/mercadopago/route.ts` | ✅ |
| Cliente MP | `src/lib/mercadopago.ts` | ✅ |

### Emails
| Funcionalidad | Archivo(s) | Estado |
|---------------|------------|--------|
| Cliente Resend | `src/lib/resend.ts` | ✅ |
| Template confirmación reserva | `src/lib/resend.ts` | ✅ |
| Template notificación host | `src/lib/resend.ts` | ✅ |
| Template reset password | `src/lib/resend.ts` | ✅ |
| Template KYC status | `src/lib/resend.ts` | ✅ |

### KYC (Verificación de Identidad)
| Funcionalidad | Archivo(s) | Estado |
|---------------|------------|--------|
| Página KYC usuario | `src/app/(dashboard)/dashboard/kyc/page.tsx` | ✅ |
| Panel admin KYC | `src/app/(dashboard)/admin/kyc/page.tsx` | ✅ |

### Reviews
| Funcionalidad | Archivo(s) | Estado |
|---------------|------------|--------|
| Formulario de review | `src/components/reviews/review-components.tsx` | ✅ |
| Lista de reviews | `src/components/reviews/review-components.tsx` | ✅ |
| Página de reviews | `src/app/(dashboard)/dashboard/reviews/page.tsx` | ✅ |

### Dashboards
| Funcionalidad | Archivo(s) | Estado |
|---------------|------------|--------|
| Dashboard usuario | `src/app/(dashboard)/dashboard/page.tsx` | ✅ |
| Dashboard host | `src/app/(dashboard)/host/page.tsx` | ✅ |
| Dashboard admin | `src/app/(dashboard)/admin/page.tsx` | ✅ |
| Layout admin | `src/app/(dashboard)/admin/layout.tsx` | ✅ |

### Landing Page
| Funcionalidad | Archivo(s) | Estado |
|---------------|------------|--------|
| Página principal | `src/app/(public)/page.tsx` | ✅ |

### UI Components (shadcn/ui style)
| Componente | Archivo | Estado |
|------------|---------|--------|
| Button | `src/components/ui/button.tsx` | ✅ |
| Input | `src/components/ui/input.tsx` | ✅ |
| Label | `src/components/ui/label.tsx` | ✅ |
| Card | `src/components/ui/card.tsx` | ✅ |
| Avatar | `src/components/ui/avatar.tsx` | ✅ |
| Badge | `src/components/ui/badge.tsx` | ✅ |
| Select | `src/components/ui/select.tsx` | ✅ |
| Toast | `src/components/ui/toast.tsx` | ✅ |
| Tabs | `src/components/ui/tabs.tsx` | ✅ |
| Separator | `src/components/ui/separator.tsx` | ✅ |
| Textarea | `src/components/ui/textarea.tsx` | ✅ |
| Dropdown Menu | `src/components/ui/dropdown-menu.tsx` | ✅ |
| Skeleton | `src/components/ui/skeleton.tsx` | ✅ |

### Layout Components
| Componente | Archivo | Estado |
|------------|---------|--------|
| Header | `src/components/layout/header.tsx` | ✅ |
| Footer | `src/components/layout/footer.tsx` | ✅ |
| Theme Toggle | `src/components/layout/theme-toggle.tsx` | ✅ |

### IA (Estructura preparada)
| Funcionalidad | Archivo(s) | Estado |
|---------------|------------|--------|
| Chatbot service | `src/lib/ai/chatbot.ts` | ⚠️ Estructura |
| Pricing engine | `src/lib/ai/pricing.ts` | ⚠️ Estructura |

### Utilidades y Constantes
| Funcionalidad | Archivo | Estado |
|---------------|---------|--------|
| Utils (cn, formatPrice) | `src/lib/utils.ts` | ✅ |
| Constantes | `src/constants/index.ts` | ✅ |
| Prisma client | `src/lib/prisma.ts` | ✅ |

---

## Estructura de Archivos Creados

```
project2/
├── prisma/
│   └── schema.prisma                    ✅ Schema completo
│
├── supabase/
│   └── rls-policies.sql                 ✅ RLS policies para Supabase
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx           ✅
│   │   │   ├── register/page.tsx        ✅
│   │   │   └── verify/page.tsx          ✅
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx             ✅ Main dashboard
│   │   │   │   ├── bookings/page.tsx    ✅ Driver bookings
│   │   │   │   ├── kyc/page.tsx         ✅ KYC upload
│   │   │   │   └── reviews/page.tsx     ✅ User reviews
│   │   │   │
│   │   │   ├── host/
│   │   │   │   ├── page.tsx             ✅ Host dashboard
│   │   │   │   ├── bookings/page.tsx    ✅ Host bookings management
│   │   │   │   └── vehicles/
│   │   │   │       ├── page.tsx         ✅ Vehicle list
│   │   │   │       ├── new/page.tsx     ✅ Create vehicle
│   │   │   │       └── [id]/availability/page.tsx ✅ Availability calendar
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── layout.tsx           ✅ Admin layout
│   │   │       ├── page.tsx             ✅ Admin dashboard
│   │   │       └── kyc/page.tsx         ✅ KYC review panel
│   │   │
│   │   ├── (public)/
│   │   │   ├── page.tsx                 ✅ Landing page
│   │   │   ├── search/page.tsx          ✅ Search page
│   │   │   ├── vehicle/[id]/page.tsx    ✅ Vehicle detail
│   │   │   └── booking/
│   │   │       ├── [id]/page.tsx        ✅ Booking flow
│   │   │       └── success/page.tsx     ✅ Booking success
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── callback/route.ts    ✅ OAuth callback
│   │       │   └── signout/route.ts     ✅ Sign out
│   │       ├── upload/route.ts          ✅ File upload to Storage
│   │       ├── webhooks/
│   │       │   └── mercadopago/route.ts ✅ MP webhook
│   │       └── health/route.ts          ✅ Health check
│   │
│   ├── components/
│   │   ├── ui/                          ✅ 13 componentes UI
│   │   ├── layout/                      ✅ Header, Footer, ThemeToggle
│   │   ├── booking/                     ✅ AvailabilityCalendar
│   │   ├── map/                         ✅ VehicleMap, LocationPicker
│   │   ├── reviews/                     ✅ ReviewForm, ReviewList
│   │   ├── search/                      ✅ SearchWithMap
│   │   └── upload/                      ✅ ImageUpload (con upload real)
│   │
│   ├── actions/
│   │   └── vehicle.ts                   ✅ Server Actions (CRUD)
│   │
│   ├── lib/
│   │   ├── supabase/                    ✅ Client, Server, Middleware
│   │   ├── ai/                          ✅ Chatbot, Pricing (estructura)
│   │   ├── prisma.ts                    ✅
│   │   ├── utils.ts                     ✅
│   │   ├── bookings.ts                  ✅ Price calculation
│   │   ├── storage.ts                   ✅ Supabase Storage helpers
│   │   ├── resend.ts                    ✅ Email client + templates
│   │   └── mercadopago.ts               ✅ MP client
│   │
│   ├── hooks/
│   │   └── use-toast.ts                 ✅ Toast hook
│   │
│   └── constants/
│       └── index.ts                     ✅ App constants
│
├── package.json                         ✅
├── tsconfig.json                        ✅
├── tailwind.config.ts                   ✅
├── next.config.mjs                      ✅
├── .env                                 ✅
├── .env.local                           ✅ (user configured)
└── PROGRESS.md                          ✅ Este archivo
```

---

## Pendientes y Próximos Pasos

### Prioridad Alta (MVP)
1. **Integración real Mercado Pago**
   - Configurar credenciales de producción
   - Implementar flujo de checkout completo
   - Testing de webhooks con ngrok

2. **Configuración de Resend**
   - Verificar dominio
   - Configurar API key
   - Testing de emails

3. **Testing E2E**
   - Configurar Playwright
   - Tests de flujos críticos

4. **Optimización Performance**
   - Lighthouse scores > 90
   - Optimización de imágenes
   - Code splitting

### Prioridad Media
1. **Completar funcionalidades de pago**
   - Escrow real
   - Depósito de garantía
   - Reembolsos

2. **Mejoras de UX**
   - Notificaciones in-app
   - Mensajería entre host/driver
   - Favoritos/watchlist

3. **Admin mejorado**
   - Gestión de usuarios completa
   - Reportes básicos
   - Moderación de contenido

### Prioridad Baja (Post-MVP)
1. **IA Features**
   - Chatbot de soporte
   - Pricing sugerido
   - Generación de descripciones

2. **PWA**
   - Service worker
   - Push notifications
   - Offline básico

3. **Multi-región**
   - Preparación para otros países
   - Multi-moneda

---

## Cambios respecto al Plan Original

### Adiciones no planificadas
| Funcionalidad | Descripción | Razón |
|---------------|-------------|-------|
| Vista mapa en búsqueda | Integración completa con Google Maps | Mejora UX significativa |
| Toggle vista grilla/lista/mapa | Múltiples vistas de resultados | Request implícita del marketplace |
| Host bookings management | Panel para que hosts gestionen reservas | Necesario para flujo completo |

### Modificaciones al plan
| Aspecto | Plan Original | Implementado | Razón |
|---------|---------------|--------------|-------|
| KYC | Automatizado (Onfido) post-MVP | Manual desde día 1 | Simplificación para MVP |
| Storage | Cloudinary CDN | Supabase Storage | Menos dependencias |
| Map integration | Básica | Completa con marcadores de precio | Mejor UX |

### Simplificaciones
- Emails: Templates creados pero sin testing real
- Pagos: Estructura lista pero sin integración completa
- IA: Solo estructura, sin implementación

---

## Notas Técnicas

### Decisiones de arquitectura
1. **App Router**: Usando Next.js 14+ App Router con Server Components
2. **Autenticación**: Supabase Auth con RLS para seguridad a nivel de DB
3. **Estado**: React hooks + contexto (sin Zustand/Redux por simplicidad)
4. **Formularios**: React Hook Form + Zod para validación
5. **Estilos**: Tailwind CSS con variables CSS para temas

### Problemas resueltos durante desarrollo
1. **ESLint v9 incompatibilidad** → Downgrade a v8.57.0
2. **@supabase/auth-helpers deprecado** → Migración a @supabase/ssr
3. **DATABASE_URL con caracteres especiales** → URL encoding
4. **Prisma no lee .env.local** → Creación de archivo .env
5. **TypeScript con Supabase queries** → Type assertions
6. **useSearchParams SSR** → Suspense boundary
7. **Resend API key en build time** → Lazy initialization

### Configuración de entorno requerida
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=

# Mercado Pago
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=

# Resend
RESEND_API_KEY=
EMAIL_FROM=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=Vehire

# OpenAI (opcional)
OPENAI_API_KEY=
```

---

## Historial de Actualizaciones

| Fecha | Cambios |
|-------|---------|
| 2026-02-16 | Creación inicial del documento. Registro de Fase 1 ~85% completada |
| 2026-02-16 | Implementación completa de upload de imágenes con Supabase Storage |
| 2026-02-16 | Creación de RLS policies SQL para Supabase |
| 2026-02-16 | Server Actions para crear/actualizar/eliminar vehículos |
| 2026-02-16 | API route para upload de archivos a Supabase Storage |
| 2026-02-16 | Fix: Trigger SQL para crear usuarios automáticamente en OAuth |
| 2026-02-16 | Fix: Página de onboarding para hosts (/host/onboarding) |
| 2026-02-16 | Fix: Server actions para ensureUserExists y becomeHost |
| 2026-02-16 | Docs: Documentación de configuración de emails |
| 2026-02-16 | Feature: Página de vehículos del host dinámica (sin datos hardcodeados) |
| 2026-02-16 | Feature: Edición de vehículos completa con formulario multi-paso |
| 2026-02-16 | Feature: Sistema de acciones de vehículos (pausar/activar/eliminar) |
| 2026-02-16 | Feature: Calendario de disponibilidad para vehículos |
| 2026-02-16 | Feature: Sistema de mensajería básico |
| 2026-02-16 | API: Rutas para disponibilidad, conversaciones y mensajes |

---

## Métricas de Progreso

```
Fase 1 (MVP Core):        ██████████████████████░░░  95%
Fase 2 (Pagos):           ░░░░░░░░░░░░░░░░░░░░░░░░░░   0%
Fase 3 (IA):              ██░░░░░░░░░░░░░░░░░░░░░░░░  10%
Fase 4 (Mobile):          ░░░░░░░░░░░░░░░░░░░░░░░░░░   0%
Fase 5 (Optimization):    ░░░░░░░░░░░░░░░░░░░░░░░░░░   0%

Progreso General:         ██████████░░░░░░░░░░░░░░░  40%
```

**Archivos creados:** ~70+
**Componentes UI:** 15+
**Páginas:** 28 rutas
**Build status:** ✅ Exitoso

---

## Nuevos Archivos Creados (2026-02-16)

### RLS Policies
- `supabase/rls-policies.sql` - Políticas de seguridad para todas las tablas y storage buckets

### Server Actions
- `src/actions/vehicle.ts` - Acciones de servidor para:
  - `createVehicle` - Crear vehículo con imágenes
  - `updateVehicle` - Actualizar vehículo
  - `updateVehicleStatus` - Cambiar estado del vehículo
  - `deleteVehicle` - Eliminar vehículo y sus imágenes

### API Routes
- `src/app/api/upload/route.ts` - Endpoint para subir archivos a Supabase Storage
  - POST: Subir múltiples archivos
  - DELETE: Eliminar archivos

### Componentes Actualizados
- `src/components/upload/image-upload.tsx` - Ahora soporta:
  - Upload inmediato o diferido
  - Tracking de archivos pendientes
  - Preview con indicador de "Pendiente"
  - Integración con API route de upload

## Nuevos Archivos Creados (2026-02-16 - Parte 2)

### Edición de Vehículos
- `src/app/(dashboard)/host/vehicles/[id]/edit/page.tsx` - Página de edición (server component)
- `src/app/(dashboard)/host/vehicles/[id]/edit/edit-vehicle-form.tsx` - Formulario de edición (client component)

### Acciones de Vehículos
- `src/components/vehicle/vehicle-actions.tsx` - Componente con acciones:
  - Pausar/Activar vehículo
  - Eliminar vehículo con confirmación
  - Links a disponibilidad y edición

### Calendario de Disponibilidad
- `src/app/(dashboard)/host/vehicles/[id]/availability/page.tsx` - Página del calendario
- `src/app/(dashboard)/host/vehicles/[id]/availability/availability-calendar.tsx` - Componente calendario interactivo
- `src/app/api/availability/route.ts` - API para actualizar disponibilidad

### Sistema de Mensajería
- `src/app/(dashboard)/messages/page.tsx` - Lista de conversaciones
- `src/app/(dashboard)/messages/new/page.tsx` - Crear nueva conversación
- `src/app/(dashboard)/messages/[id]/page.tsx` - Ver conversación
- `src/app/(dashboard)/messages/[id]/conversation-view.tsx` - Vista de chat
- `src/app/api/conversations/route.ts` - API para crear conversaciones
- `src/app/api/messages/route.ts` - API para enviar mensajes

### Componentes Adicionados al Header
- Link a mensajes en el menú de usuario
- Icono MessageSquare agregado

---

## Nuevos Archivos y Funcionalidades (2026-03-08 a 2026-03-10)

### Integración PayPal

#### API Routes
- `src/app/api/payments/paypal/orders/route.ts` - Crear órdenes PayPal
- `src/app/api/payments/paypal/orders/[orderId]/capture/route.ts` - Capturar/autorizar pagos
- `src/app/api/webhooks/paypal/route.ts` - Webhook para eventos PayPal

#### Librerías
- `src/lib/paypal.ts` - Cliente PayPal con funciones:
  - `createOrder()` - Crear orden de pago
  - `captureOrder()` - Capturar pago (instant booking)
  - `authorizeOrder()` - Autorizar pago (approval required)
  - `getOrder()` - Obtener detalles de orden
  - `mapPayPalStatus()` - Mapear estados de PayPal a estados internos

#### Componentes
- `src/components/payment/paypal-card-form.tsx` - Formulario de tarjeta para PayPal
- `src/hooks/use-paypal.ts` - Hook para manejar el flujo de PayPal
- `src/lib/currency.ts` - Utilidades de conversión de moneda (UYU a USD)

### Booking Flow & Timezone Improvements

#### Schema Changes
- **PendingReservation** - Modelo para reservas pendientes de pago
  - `reminderSentAt` (nuevo) - Tracking de recordatorios enviados
  - `expiresAt` (eliminado) - Ya no expiran por tiempo
- **Booking** - Campos nuevos:
  - `pickupTime` - Hora de pickup (formato "HH:mm")
  - `returnTime` - Hora de return (formato "HH:mm")
  - `timezone` - Zona horaria de la reserva
- **EmailSettings** - Preferencias de email del usuario
  - `bookingReminders` - Recordatorios de reservas pendientes
  - `marketingEmails` - Emails de marketing
  - `bookingConfirmations` - Confirmaciones de reserva
  - `bookingCancellations` - Cancelaciones
  - `hostNotifications` - Notificaciones de anfitrión
  - `paymentReceipts` - Recibos de pago
  - `reviewReminders` - Recordatorios de reseñas

#### API Routes
- `src/app/api/pending-reservations/route.ts` - CRUD de pending reservations
  - GET: Listar pending reservations del usuario
  - POST: Crear nueva pending reservation
  - DELETE: Cancelar pending reservation
- `src/app/api/pending-reservations/[id]/route.ts` - Operaciones por ID
  - GET: Obtener pending reservation específica
  - DELETE: Cancelar pending reservation
- `src/app/api/email-settings/route.ts` - Preferencias de email
  - GET: Obtener configuración
  - PATCH: Actualizar preferencias

#### Componentes UI
- `src/components/ui/time-picker.tsx` - Selector de hora
  - TimePicker: Dropdown con horarios de 08:00 a 20:00
  - TimeDisclaimer: Notas sobre seguro y tiempo de gracia
- `src/components/ui/switch.tsx` - Toggle switch para configuración

#### Librerías
- `src/lib/timezone.ts` - Utilidades de zona horaria
  - `toUTC()` - Convertir fecha+hora a UTC
  - `formatDateInTimezone()` - Formatear fecha en timezone
  - `getDateInTimezone()` - Obtener fecha en timezone
  - `generateTimeSlots()` - Generar slots de tiempo
  - `calculateDays()` - Calcular días entre fechas

#### Páginas
- `src/app/(dashboard)/dashboard/settings/page.tsx` - Configuración de emails
- Dashboard actualizado con sección "Reservas pendientes de pago"

#### Sistema de Notificaciones
- `src/lib/email-notifications.ts` - Servicio de notificaciones
  - `notifyPendingReservationHolders()` - Notificar usuarios con reservas conflictivas
  - Busca vehículos similares disponibles
  - Envía email con alternativas cuando otro usuario reserva

#### Migraciones
- `prisma/migrations/20260308053538_paypal/` - Schema PayPal
- `prisma/migrations/20260310_add_pending_reservation/` - PendingReservation inicial
- `prisma/migrations/20260310_pending_reservations_v2/` - Cambios sin expiración

### Fixes y Mejoras

#### Navegación Client-Side
- Fix: Uso de `useParams()` en lugar de `window.location.pathname` para obtener IDs de ruta
- Archivo afectado: `src/app/(public)/booking/[id]/page.tsx`

#### Pagos
- Actualizado flujo de pagos para usar pending reservations
- Verificación de disponibilidad al momento del pago (no antes)
- Creación de booking solo después de pago exitoso

---

## Arquitectura del Flujo de Reservas (Actualizado)

### Flujo Anterior
```
1. Usuario selecciona fechas → Crea Booking (PENDING)
2. Usuario paga → Booking se confirma
3. Si pago falla → Booking queda huérfano bloqueando fechas
```

### Flujo Nuevo
```
1. Usuario selecciona fechas/tiempos → Crea PendingReservation
2. PendingReservation NO bloquea el vehículo
3. Usuario va a pagar
4. Al pagar:
   a. Verifica disponibilidad (primero en pagar gana)
   b. Si disponible → Crea Booking + Procesa pago
   c. Si no disponible → Error con vehículos similares
5. Si otro usuario tenía pending reservation conflictiva:
   → Recibe email con vehículos similares
```

### Ventajas
- **First come, first serve**: El primero en pagar obtiene el vehículo
- **Sin bloqueos**: Pending reservations no bloquean disponibilidad
- **Recovery**: Usuario puede continuar reserva pendiente días después
- **Marketing**: Emails con vehículos similares cuando se pierde una reserva

---

## Variables de Entorno Actualizadas

```env
# PayPal (nuevo)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
NEXT_PUBLIC_PAYPAL_CLIENT_ID=

# Mercadopago (existente)
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=Vehire
```

---

## Historial de Actualizaciones

| Fecha | Cambios |
|-------|---------|
| 2026-02-16 | Creación inicial del documento. Registro de Fase 1 ~85% completada |
| 2026-02-16 | Implementación completa de upload de imágenes con Supabase Storage |
| 2026-02-16 | Creación de RLS policies SQL para Supabase |
| 2026-02-16 | Server Actions para crear/actualizar/eliminar vehículos |
| 2026-02-16 | API route para upload de archivos a Supabase Storage |
| 2026-02-16 | Fix: Trigger SQL para crear usuarios automáticamente en OAuth |
| 2026-02-16 | Fix: Página de onboarding para hosts (/host/onboarding) |
| 2026-02-16 | Fix: Server actions para ensureUserExists y becomeHost |
| 2026-02-16 | Docs: Documentación de configuración de emails |
| 2026-02-16 | Feature: Página de vehículos del host dinámica (sin datos hardcodeados) |
| 2026-02-16 | Feature: Edición de vehículos completa con formulario multi-paso |
| 2026-02-16 | Feature: Sistema de acciones de vehículos (pausar/activar/eliminar) |
| 2026-02-16 | Feature: Calendario de disponibilidad para vehículos |
| 2026-02-16 | Feature: Sistema de mensajería básico |
| 2026-02-16 | API: Rutas para disponibilidad, conversaciones y mensajes |
| 2026-03-08 | Feature: Integración completa con PayPal (orders, capture, authorize) |
| 2026-03-08 | Feature: Webhooks para PayPal |
| 2026-03-08 | Feature: Conversión de moneda UYU a USD para PayPal |
| 2026-03-10 | Feature: PendingReservation model sin expiración |
| 2026-03-10 | Feature: Selección de hora de pickup/return |
| 2026-03-10 | Feature: Timezone handling para Uruguay (UTC-3) |
| 2026-03-10 | Feature: EmailSettings model y página de configuración |
| 2026-03-10 | Feature: Dashboard con sección de reservas pendientes |
| 2026-03-10 | Feature: Notificaciones con vehículos similares |
| 2026-03-10 | Fix: Navegación client-side con useParams() |
| 2026-03-10 | Architecture: Flujo de reservas "first come, first serve" |

---

## Métricas de Progreso Actualizadas

```
Fase 1 (MVP Core):        ██████████████████████████  98%
Fase 2 (Pagos):           ████████████████░░░░░░░░░░  60%
Fase 3 (IA):              ██░░░░░░░░░░░░░░░░░░░░░░░░  10%
Fase 4 (Mobile):          ░░░░░░░░░░░░░░░░░░░░░░░░░░   0%
Fase 5 (Optimization):    ░░░░░░░░░░░░░░░░░░░░░░░░░░   0%

Progreso General:         ████████████████░░░░░░░░░░  55%
```

**Archivos creados:** ~85+
**Componentes UI:** 18+
**Páginas:** 32 rutas
**API Routes:** 20+
**Build status:** ✅ Exitoso
**Deploy target:** Vercel

---

## Notas Técnicas Adicionales

### Decisiones de Diseño - Pending Reservations

1. **Sin expiración por tiempo**: Las pending reservations se mantienen hasta que la fecha de inicio pase
2. **Rate limiting**: Máximo 5 pending reservations activas por usuario
3. **Soft hold**: No bloquean disponibilidad para otros usuarios
4. **Cleanup**: Se pueden eliminar automáticamente cuando `startDate < now`

### Timezone Handling

- **Default**: `America/Montevideo` (UTC-3)
- **Almacenamiento**: Fechas en UTC, timezone guardado como referencia
- **Display**: Convertir a timezone local en frontend
- **Horarios**: Formato "HH:mm" string, interpretados en el timezone del usuario

### Email Marketing Strategy

- **Booking reminders**: Opt-in por defecto
- **Marketing emails**: Opt-out por defecto
- **Similar vehicles**: Incluido en notificación de "vehículo no disponible"
- **Unsubscribe**: Link en todos los emails + página de configuración


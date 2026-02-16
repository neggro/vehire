# Vehire - Marketplace de Alquiler de Vehículos

Una plataforma marketplace de alquiler de vehículos (tipo Airbnb/Turo) construida con Next.js, Supabase, Prisma y Tailwind CSS.

## Stack Tecnológico

- **Framework:** Next.js 14+ con App Router
- **Base de datos:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **Estilos:** Tailwind CSS + shadcn/ui
- **Autenticación:** Supabase Auth
- **Pagos:** Mercado Pago
- **Emails:** Resend
- **Mapas:** Google Maps API
- **IA:** OpenAI (Chatbot + Pricing)

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Rutas de autenticación
│   ├── (dashboard)/        # Rutas protegidas (dashboard)
│   ├── (public)/           # Rutas públicas
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Componentes base (shadcn/ui)
│   ├── layout/             # Componentes de layout
│   └── ...                 # Otros componentes
├── lib/
│   ├── supabase/           # Cliente Supabase
│   ├── ai/                 # Servicios de IA
│   ├── mercadopago.ts      # Integración Mercado Pago
│   ├── resend.ts           # Cliente de emails
│   └── utils.ts            # Utilidades
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript types
├── constants/              # Constantes de la app
└── providers/              # React providers
```

## Requisitos

- Node.js 18+
- npm o yarn
- Cuenta en Supabase
- Cuenta en Mercado Pago (sandbox para desarrollo)
- Cuenta en Resend
- API Key de Google Maps
- API Key de OpenAI

## Instalación

1. Clonar el repositorio:
```bash
git clone <repo-url>
cd project2
```

2. Instalar dependencias:
```bash
npm install
```

3. Copiar el archivo de variables de entorno:
```bash
cp .env.example .env.local
```

4. Configurar las variables de entorno en `.env.local`:
```env
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN="..."
MERCADOPAGO_PUBLIC_KEY="..."

# Resend
RESEND_API_KEY="re_..."

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="..."

# OpenAI
OPENAI_API_KEY="sk-..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

5. Generar el cliente de Prisma:
```bash
npm run db:generate
```

6. Sincronizar la base de datos:
```bash
npm run db:push
```

7. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Compila la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm run db:generate` - Genera el cliente de Prisma
- `npm run db:push` - Sincroniza el schema con la base de datos
- `npm run db:migrate` - Ejecuta las migraciones
- `npm run db:studio` - Abre Prisma Studio
- `npm run db:seed` - Ejecuta los seeds

## Funcionalidades

### MVP (Fase 1)
- [x] Autenticación con email/password y Google
- [x] Búsqueda de vehículos con filtros
- [ ] Gestión de vehículos (host)
- [ ] Sistema de reservas
- [ ] Integración Mercado Pago
- [ ] Sistema KYC manual
- [ ] Reviews bidireccionales
- [ ] Dashboard de host y conductor

### Fase 2
- [ ] Escrow completo
- [ ] Depósito de garantía
- [ ] Dashboard financiero

### Fase 3
- [ ] Chatbot de soporte con IA
- [ ] Motor de pricing sugerido
- [ ] Generación de descripciones

## Contribuir

1. Fork del repositorio
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## Licencia

MIT

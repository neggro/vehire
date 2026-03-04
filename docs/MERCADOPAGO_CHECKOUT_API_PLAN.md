# Plan de Integración: Mercado Pago Checkout API

## Resumen Ejecutivo

Este documento analiza la viabilidad de migrar desde **Checkout Pro** (Preference API) hacia **Checkout API** (Payments API) para permitir pagos con tarjeta de crédito/débito directamente en el sitio, sin redirección, manteniendo también la opción de pago con saldo en cuenta Mercado Pago.

---

## 1. Comparación de Soluciones

### Implementación Actual: Checkout Pro (Preference API)

| Aspecto | Descripción |
|---------|-------------|
| **Experiencia** | Redirección a página de Mercado Pago |
| **Medios de pago** | Tarjetas, saldo MP, Abitab, Red Pagos |
| **Personalización** | Limitada |
| **Complejidad** | Baja |
| **PCI Compliance** | No requerido (manejado por MP) |
| **Control** | Limitado sobre el flujo |

### Implementación Deseada: Checkout API (Payments API)

| Aspecto | Descripción |
|---------|-------------|
| **Experiencia** | Pago en el sitio (sin redirección) |
| **Medios de pago** | Tarjetas + saldo MP (wallet) |
| **Personalización** | Total |
| **Complejidad** | Media-Alta |
| **PCI Compliance** | Requerido (simplificado con SDK) |
| **Control** | Completo sobre el flujo |

---

## 2. Análisis de Viabilidad

### ✅ Ventajas de Checkout API

1. **Mejor UX**: El usuario no abandona el sitio
2. **Mayor conversión**: Menos fricción en el checkout
3. **Control total**: Personalización completa del flujo
4. **Branding**: Mantiene la identidad de Vehire
5. **Datos**: Acceso directo a información del pago en tiempo real

### ⚠️ Consideraciones

1. **Desarrollo adicional**: Requiere frontend y backend nuevos
2. **PCI Compliance**: Necesario aunque simplificado con tokenización MP
3. **Mantenimiento**: Más código para mantener
4. **Testing**: Más escenarios a probar

### 🔄 Opción Híbrida (Recomendada)

Mantener **Checkout Pro como fallback** y ofrecer **Checkout API como opción principal**:
- Usuario puede pagar con tarjeta en el sitio (Checkout API)
- Si hay problemas, opción de pagar vía Mercado Pago (Checkout Pro)
- Wallet MP puede integrarse en ambos flujos

---

## 3. Arquitectura Técnica

### Flujo Actual (Checkout Pro)

```
[Usuario] → [Booking Page] → [API: Create Preference] → [Redirect to MP]
                                                            ↓
[Webhook MP] ← [Usuario paga en MP] ← [MP Hosted Page]
```

### Flujo Propuesto (Checkout API)

```
[Usuario] → [Booking Page] → [Frontend: Tokenize Card] → [API: Create Payment]
                                                                      ↓
[Webhook MP] ← [MP procesa] ← [API: Process Payment with Token]
```

---

## 4. Componentes a Implementar

### 4.1 Frontend

#### A. Formulario de Pago con Tarjeta
```
/src/components/payment/
├── card-payment-form.tsx      # Formulario principal
├── card-input.tsx             # Campo de número de tarjeta
├── expiry-input.tsx           # Campo de fecha de expiración
├── cvv-input.tsx              # Campo CVV
├── cardholder-input.tsx       # Nombre del titular
├── installments-selector.tsx  # Selector de cuotas
└── payment-method-selector.tsx # Tabs: Tarjeta vs Wallet
```

#### B. Integración SDK Mercado Pago
```typescript
// lib/mp-sdk.ts
// Inicialización del SDK de Mercado Pago en el cliente
```

### 4.2 Backend

#### A. Nuevos Endpoints
```
/api/payments/
├── create-card/route.ts       # Crear pago con tarjeta
├── create-wallet/route.ts     # Crear pago con wallet MP
├── methods/route.ts           # Obtener medios de pago disponibles
└── installments/route.ts      # Obtener opciones de cuotas
```

#### B. Actualizaciones
```
/lib/mercadopago.ts            # Agregar funciones de Payments API
```

---

## 5. Implementación Detallada

### Fase 1: Preparación del SDK

#### Frontend - Cargar SDK de Mercado Pago
```html
<!-- En layout o componente -->
<script src="https://sdk.mercadopago.com/js/v2"></script>
```

#### Variables de Entorno Necesarias
```env
# Ya existentes
MERCADOPAGO_ACCESS_TOKEN=xxx

# Nuevo (para frontend)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=xxx
```

### Fase 2: Tokenización de Tarjeta (Frontend)

```typescript
// Ejemplo de implementación
const mp = new MercadoPago(NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY, {
  locale: 'es-UY'
});

// Crear token de tarjeta
const cardToken = await mp.fields.createCardToken({
  cardholderName: 'Juan Pérez',
  identificationType: 'CI',
  identificationNumber: '12345678',
});
// cardToken.id contiene el token seguro para enviar al backend
```

### Fase 3: Procesar Pago (Backend)

```typescript
// Ejemplo usando el SDK de Node.js
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

const payment = new Payment(client);

const result = await payment.create({
  body: {
    transaction_amount: 1000,
    token: 'CARD_TOKEN_FROM_FRONTEND',
    description: 'Alquiler de vehículo',
    installments: 1,
    payment_method_id: 'visa',
    payer: {
      email: 'user@email.com',
      identification: {
        type: 'CI',
        number: '12345678',
      },
    },
    external_reference: 'booking_id',
    notification_url: 'https://vehire.uy/api/webhooks/mercadopago',
  },
});
```

### Fase 4: Pago con Wallet (Cuenta Mercado Pago)

Para pagos con saldo en Mercado Pago, hay dos opciones:

#### Opción A: Delegar a Checkout Pro (más simple)
- Mantener flujo de redirección para wallet
- El usuario ya tiene cuenta MP, conoce el flujo

#### Opción B: Wallet Connect API
- Permite pago con wallet sin redirección completa
- Requiere OAuth con Mercado Pago
- Más complejo pero mejor UX

---

## 6. Estructura de Archivos Propuesta

```
src/
├── app/
│   ├── (public)/
│   │   └── booking/
│   │       └── [id]/
│   │           └── page.tsx          # Actualizar con opciones de pago
│   ├── api/
│   │   ├── payments/
│   │   │   ├── route.ts              # POST: crear pago
│   │   │   ├── methods/route.ts      # GET: medios de pago
│   │   │   └── installments/route.ts # GET: cuotas disponibles
│   │   └── webhooks/
│   │       └── mercadopago/
│   │           └── route.ts          # Mantener existente
│   └── ...
├── components/
│   └── payment/
│       ├── card-payment-form.tsx
│       ├── payment-method-tabs.tsx
│       └── ...
├── hooks/
│   └── use-mercadopago.ts            # Hook para SDK de MP
└── lib/
    ├── mercadopago.ts                # Actualizar con Payments API
    └── mp-payments.ts                # Nuevo: funciones de pago
```

---

## 7. Plan de Implementación

### Sprint 1: Infraestructura Base
- [ ] Agregar `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` a variables de entorno
- [ ] Actualizar `/lib/mercadopago.ts` con funciones de Payments API
- [ ] Crear endpoint `/api/payments/methods` para obtener medios de pago
- [ ] Crear endpoint `/api/payments/installments` para cuotas

### Sprint 2: Frontend de Pago
- [ ] Crear componente `CardPaymentForm` con campos seguros
- [ ] Implementar tokenización de tarjeta con SDK MP
- [ ] Crear tabs para seleccionar método de pago
- [ ] Integrar en página de booking

### Sprint 3: Backend de Pago
- [ ] Crear endpoint `/api/payments` para procesar pagos
- [ ] Manejar respuestas (approved, rejected, pending)
- [ ] Actualizar webhook para manejar ambos tipos de pago
- [ ] Actualizar estados de booking según resultado

### Sprint 4: Wallet Payment (Opcional)
- [ ] Investigar Wallet Connect API vs Checkout Pro para wallet
- [ ] Implementar flujo seleccionado
- [ ] Testing integral

### Sprint 5: Testing y QA
- [ ] Pruebas en sandbox con diferentes escenarios
- [ ] Pruebas de tarjeta aprobada/rechazada
- [ ] Pruebas de webhook
- [ ] Pruebas de reembolso

---

## 8. Estimación de Esfuerzo

| Componente | Horas Estimadas | Complejidad |
|------------|-----------------|-------------|
| Backend API (payments) | 8h | Media |
| Frontend formulario | 12h | Media-Alta |
| Integración SDK | 6h | Media |
| Testing | 8h | Media |
| Documentación | 2h | Baja |
| **Total** | **~36h** | |

---

## 9. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Problemas con tokenización | Baja | Alto | Usar componentes oficiales de MP |
| Webhook no recibido | Media | Alto | Polling de estado como backup |
| Rechazo de tarjetas válidas | Baja | Medio | Fallback a Checkout Pro |
| Problemas de PCI | Baja | Alto | Usar tokenización, no guardar datos |

---

## 10. Recomendación Final

### Enfoque Recomendado: Híbrido

1. **Implementar Checkout API** como método principal para tarjetas
2. **Mantener Checkout Pro** como fallback y para wallet payments
3. **Fases incrementales**: Primero tarjetas, luego evaluar wallet

### Beneficios del Enfoque Híbrido

- ✅ Mejor UX para pagos con tarjeta (80%+ de transacciones)
- ✅ Menor riesgo (fallback disponible)
- ✅ Implementación gradual
- ✅ No pierde funcionalidad actual

---

## 11. Próximos Pasos

1. **Confirmar enfoque**: ¿Híbrido o solo Checkout API?
2. **Obtener credenciales**: Verificar que tenemos Public Key disponible
3. **Crear rama de desarrollo**: `feature/checkout-api`
4. **Iniciar Sprint 1**: Infraestructura base

---

## Referencias

- [Mercado Pago Checkout API Overview](https://www.mercadopago.com.uy/developers/es/docs/checkout-api-payments/overview)
- [Mercado Pago Node.js SDK](https://github.com/mercadopago/sdk-nodejs)
- [Mercado Pago JavaScript SDK](https://github.com/mercadopago/sdk-js)
- [Documentación de Payments API](https://www.mercadopago.com.uy/developers/es/reference/payments/_payments/post)

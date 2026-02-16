# Configuración de Emails

## Dos sistemas de email

Este proyecto utiliza dos sistemas de email diferentes:

### 1. Supabase Auth (verificación, reset password)
Supabase Auth maneja sus propios emails para:
- Verificación de email al registrarse
- Reset de contraseña
- Magic links
- Invitaciones

**Por defecto**, Supabase usa su propio servidor de email con límites y puede no entregar en producción.

#### Para desarrollo:
1. Ve a Supabase Dashboard → Authentication → Settings
2. Habilita "Enable email confirmations" si lo deseas
3. Los emails de desarrollo aparecen en: Authentication → Logs
4. O usa el "Email Tester" en: Authentication → Email Templates

#### Para producción:
Configura SMTP personalizado en Supabase:
1. Ve a Project Settings → Authentication → SMTP Settings
2. Deshabilita "Enable custom SMTP" y configura:
   - Host: `smtp.resend.com`
   - Puerto: `587`
   - Usuario: `resend`
   - Contraseña: `[tu-api-key-de-resend]`
   - Sender email: `noreply@tudominio.com`
   - Sender name: `Vehire`

### 2. Resend (emails transaccionales)
Nuestra app usa Resend para:
- Confirmación de reserva
- Notificación al host
- Estado de KYC
- Recordatorios

#### Configuración:
1. Obtén API key en [resend.com](https://resend.com)
2. Verifica tu dominio en Resend
3. Agrega a `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxx
   EMAIL_FROM=noreply@tudominio.com
   ```

#### Testing:
Para probar en desarrollo, puedes usar el endpoint de prueba:
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "tu@email.com", "type": "booking"}'
```

## Emails en el sistema

### Templates disponibles (src/lib/resend.ts)
- `sendBookingConfirmationEmail` - Confirmación al driver
- `sendNewBookingNotificationToHost` - Notificación al host
- `sendPasswordResetEmail` - Reset de contraseña
- `sendKYCStatusEmail` - Aprobación/rechazo de KYC

## Flujo de registro

```
Usuario se registra
    ↓
Supabase Auth crea usuario en auth.users
    ↓
TRIGGER crea usuario en public.users
    ↓
[Si email confirmación habilitado]
    ↓
Supabase envía email de verificación
    ↓
Usuario hace clic en link
    ↓
Email verificado, puede usar la app
```

## Solución de problemas

### No llegan emails de verificación
1. Revisa Supabase Dashboard → Authentication → Logs
2. Verifica que el email no esté en spam
3. En desarrollo, usa el "Email Tester" de Supabase
4. Considera deshabilitar verificación de email para desarrollo:
   - Supabase Dashboard → Authentication → Settings
   - Deshabilita "Enable email confirmations"

### No llegan emails transaccionales (Resend)
1. Verifica que RESEND_API_KEY esté configurada
2. Verifica que el dominio esté verificado en Resend
3. Revisa los logs en Resend Dashboard

### Errores comunes
- `Missing API key`: Agrega RESEND_API_KEY a .env.local
- `Domain not verified`: Verifica el dominio en Resend
- `Invalid recipient`: Resend solo permite enviar a emails verificados en modo test

## Quick fix para desarrollo

Si quieres probar sin verificación de email:

1. Ve a Supabase Dashboard → Authentication → Settings
2. Deshabilita "Enable email confirmations"
3. Los usuarios podrán hacer login inmediatamente después de registrarse

Luego, para producción, vuelve a habilitarlo y configura SMTP.

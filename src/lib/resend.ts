import { Resend } from "resend";

// Lazy initialization to avoid build-time errors when API key is not set
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

// Export for direct use (will throw if API key not set)
export const resend = {
  get emails() {
    return getResend().emails;
  }
};

const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@vehire.com";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Vehire";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams) {
  const { data, error } = await getResend().emails.send({
    from: `${APP_NAME} <${EMAIL_FROM}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    throw error;
  }

  return data;
}

// Email templates

export async function sendBookingConfirmationEmail(params: {
  to: string;
  driverName: string;
  hostName: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  bookingId: string;
}) {
  const {
    to,
    driverName,
    hostName,
    vehicleName,
    startDate,
    endDate,
    totalAmount,
    bookingId,
  } = params;

  const formattedAmount = new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
  }).format(totalAmount / 100);

  return sendEmail({
    to,
    subject: `Reserva confirmada - ${vehicleName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">¡Reserva confirmada!</h1>
        <p>Hola ${driverName},</p>
        <p>Tu reserva ha sido confirmada exitosamente. Aquí están los detalles:</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Vehículo:</strong> ${vehicleName}</p>
          <p><strong>Anfitrión:</strong> ${hostName}</p>
          <p><strong>Fecha de inicio:</strong> ${startDate}</p>
          <p><strong>Fecha de fin:</strong> ${endDate}</p>
          <p><strong>Total:</strong> ${formattedAmount}</p>
        </div>

        <p>El anfitrión se pondrá en contacto contigo para coordinar la entrega del vehículo.</p>

        <a href="${APP_URL}/dashboard/bookings/${bookingId}"
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Ver detalles de la reserva
        </a>

        <p>¡Gracias por usar ${APP_NAME}!</p>
      </div>
    `,
  });
}

export async function sendNewBookingNotificationToHost(params: {
  to: string;
  hostName: string;
  driverName: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  bookingId: string;
}) {
  const {
    to,
    hostName,
    driverName,
    vehicleName,
    startDate,
    endDate,
    totalAmount,
    bookingId,
  } = params;

  const formattedAmount = new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
  }).format(totalAmount / 100);

  return sendEmail({
    to,
    subject: `Nueva reserva recibida - ${vehicleName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">¡Nueva reserva!</h1>
        <p>Hola ${hostName},</p>
        <p>Has recibido una nueva solicitud de reserva:</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Vehículo:</strong> ${vehicleName}</p>
          <p><strong>Conductor:</strong> ${driverName}</p>
          <p><strong>Fecha de inicio:</strong> ${startDate}</p>
          <p><strong>Fecha de fin:</strong> ${endDate}</p>
          <p><strong>Tus ganancias:</strong> ${formattedAmount}</p>
        </div>

        <p>El pago ya ha sido procesado y está retenido hasta que se complete el alquiler.</p>

        <a href="${APP_URL}/host/bookings/${bookingId}"
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Ver reserva
        </a>

        <p>Recuerda ponerte en contacto con el conductor para coordinar la entrega.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetLink: string;
}) {
  const { to, resetLink } = params;

  return sendEmail({
    to,
    subject: "Recuperar contraseña",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Recuperar contraseña</h1>
        <p>Haz solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>

        <a href="${resetLink}"
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Restablecer contraseña
        </a>

        <p>Este enlace expirará en 24 horas.</p>
        <p>Si no solicitaste este correo, puedes ignorarlo.</p>
      </div>
    `,
  });
}

export async function sendKYCStatusEmail(params: {
  to: string;
  userName: string;
  status: "approved" | "rejected";
  reason?: string;
}) {
  const { to, userName, status, reason } = params;

  const isApproved = status === "approved";

  return sendEmail({
    to,
    subject: isApproved
      ? "Verificación de identidad aprobada"
      : "Verificación de identidad rechazada",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${isApproved ? "#22c55e" : "#ef4444"};">
          ${isApproved ? "✓ Verificación aprobada" : "✗ Verificación rechazada"}
        </h1>
        <p>Hola ${userName},</p>

        ${
          isApproved
            ? `
          <p>¡Tu verificación de identidad ha sido aprobada!</p>
          <p>Ahora puedes publicar vehículos y recibir reservas en ${APP_NAME}.</p>
        `
            : `
          <p>Tu verificación de identidad ha sido rechazada.</p>
          ${reason ? `<p><strong>Razón:</strong> ${reason}</p>` : ""}
          <p>Por favor, vuelve a subir tus documentos con la información correcta.</p>
        `
        }

        <a href="${APP_URL}/dashboard/kyc"
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Ir al dashboard
        </a>
      </div>
    `,
  });
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/constants";

const faqs = [
  {
    category: "Para conductores",
    questions: [
      {
        q: "¿Cómo reservo un vehículo?",
        a: `Busca vehículos disponibles en nuestra página de búsqueda, selecciona las fechas que necesitás y completá el proceso de reserva. Si el vehículo tiene reserva instantánea, tu reserva se confirma automáticamente. De lo contrario, el anfitrión deberá aprobarla.`,
      },
      {
        q: "¿Qué necesito para alquilar?",
        a: "Necesitás tener una cuenta verificada en la plataforma, una licencia de conducir vigente y completar el proceso de verificación de identidad (KYC). Una vez verificado, podés reservar cualquier vehículo disponible.",
      },
      {
        q: "¿Cómo funciona el proceso de verificación (KYC)?",
        a: "Desde tu perfil, subí una foto de tu documento de identidad, tu licencia de conducir y una selfie con tu documento. Nuestro equipo revisará los documentos y te notificará cuando tu cuenta esté verificada.",
      },
      {
        q: "¿Qué métodos de pago aceptan?",
        a: "Aceptamos pagos a través de Mercado Pago (tarjetas de crédito/débito, transferencias) y PayPal para pagos en dólares.",
      },
      {
        q: "¿Puedo cancelar una reserva?",
        a: "Sí, podés cancelar tu reserva sin costo dentro de las primeras 24 horas después de realizarla. Pasado ese período, pueden aplicarse cargos de cancelación según la política del anfitrión.",
      },
      {
        q: "¿Qué pasa si el vehículo tiene un problema durante el alquiler?",
        a: "Contactá inmediatamente al anfitrión a través del sistema de mensajes de la plataforma. Si no podés resolver el problema directamente, nuestro equipo de soporte te asistirá. Podés reportar un incidente desde la página de tu reserva.",
      },
    ],
  },
  {
    category: "Para anfitriones",
    questions: [
      {
        q: "¿Cómo publico mi vehículo?",
        a: `Registrate como anfitrión, completá la información de tu vehículo (marca, modelo, fotos, precio por día) y publicalo. Una vez aprobado por nuestro equipo, estará disponible para que los conductores lo reserven.`,
      },
      {
        q: "¿Cuánto cobra la plataforma de comisión?",
        a: `${APP_NAME} cobra una comisión del 15% sobre el precio del alquiler para cubrir los costos de la plataforma, procesamiento de pagos y soporte al cliente.`,
      },
      {
        q: "¿Cuándo recibo el pago?",
        a: "El pago se libera automáticamente una vez que el alquiler se completa exitosamente. El monto se transfiere a tu cuenta descontando la comisión de la plataforma.",
      },
      {
        q: "¿Puedo establecer mi propia disponibilidad?",
        a: "Sí, tenés control total sobre tu calendario. Podés marcar días como no disponibles, establecer precios diferenciados para fines de semana y pausar tu publicación cuando quieras.",
      },
      {
        q: "¿Qué es la reserva instantánea?",
        a: "La reserva instantánea permite que los conductores confirmen su reserva sin necesidad de tu aprobación manual. Esto aumenta las chances de recibir reservas ya que los conductores prefieren la confirmación inmediata.",
      },
    ],
  },
  {
    category: "General",
    questions: [
      {
        q: "¿En qué ciudades está disponible el servicio?",
        a: "Actualmente operamos en todo Uruguay, con mayor presencia en Montevideo, Punta del Este, Colonia del Sacramento, Piriápolis y Salto.",
      },
      {
        q: "¿Cómo funciona el depósito de seguridad?",
        a: "Se retiene un depósito de seguridad equivalente al 10% del valor estimado del vehículo. Este monto se libera al finalizar el alquiler si no hay daños ni incidentes.",
      },
      {
        q: "¿Qué hago si tengo un problema con mi cuenta?",
        a: "Podés contactarnos a través de nuestra página de contacto o enviar un mensaje desde la plataforma. Nuestro equipo de soporte responde en un máximo de 24 horas.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="container py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </div>

      <div className="container py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold mb-2">Preguntas Frecuentes</h1>
          <p className="text-muted-foreground mb-8">
            Encontrá respuestas a las preguntas más comunes sobre {APP_NAME}
          </p>

          <div className="space-y-10">
            {faqs.map((section) => (
              <section key={section.category}>
                <h2 className="text-xl font-semibold mb-4 text-primary">
                  {section.category}
                </h2>
                <div className="space-y-4">
                  {section.questions.map((faq, i) => (
                    <details
                      key={i}
                      className="group rounded-lg border bg-background p-4"
                    >
                      <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between">
                        {faq.q}
                        <span className="ml-2 text-muted-foreground group-open:rotate-180 transition-transform">
                          ▾
                        </span>
                      </summary>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                        {faq.a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

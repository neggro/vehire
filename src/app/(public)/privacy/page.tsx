import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/constants";

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
          <p className="text-muted-foreground mb-8">
            Última actualización: Marzo 2026
          </p>

          <div className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Información que recopilamos</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                En {APP_NAME} recopilamos información que nos proporcionás directamente al crear tu cuenta y usar nuestros servicios:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4 list-disc">
                <li>Nombre completo y dirección de correo electrónico</li>
                <li>Número de teléfono (opcional)</li>
                <li>Documentos de verificación de identidad (cédula, licencia de conducir, selfie)</li>
                <li>Información de los vehículos publicados (fotos, ubicación, características)</li>
                <li>Historial de reservas y transacciones</li>
                <li>Mensajes enviados a través de la plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Cómo usamos tu información</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">Utilizamos la información recopilada para:</p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4 list-disc">
                <li>Crear y administrar tu cuenta en la plataforma</li>
                <li>Verificar tu identidad y la validez de tu licencia de conducir</li>
                <li>Procesar reservas y pagos</li>
                <li>Facilitar la comunicación entre conductores y anfitriones</li>
                <li>Mejorar nuestros servicios y la experiencia del usuario</li>
                <li>Enviar notificaciones relacionadas con tus reservas y cuenta</li>
                <li>Prevenir fraude y garantizar la seguridad de la plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Compartir información</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Compartimos tu información personal solo en las siguientes circunstancias:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4 list-disc">
                <li>Con otros usuarios cuando es necesario para completar una reserva (nombre, foto de perfil)</li>
                <li>Con proveedores de pago (Mercado Pago, PayPal) para procesar transacciones</li>
                <li>Cuando sea requerido por ley o por autoridades competentes</li>
                <li>Para proteger los derechos y la seguridad de nuestros usuarios</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Nunca vendemos tu información personal a terceros con fines comerciales.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Seguridad de los datos</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal. Los datos de pago son procesados por plataformas certificadas y nunca almacenamos información de tarjetas de crédito en nuestros servidores. Los documentos de verificación se almacenan de forma segura y con acceso restringido.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Tus derechos</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                De acuerdo con la legislación vigente en Uruguay (Ley N° 18.331 de Protección de Datos Personales), tenés derecho a:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4 list-disc">
                <li>Acceder a tus datos personales almacenados</li>
                <li>Solicitar la rectificación de datos inexactos</li>
                <li>Solicitar la eliminación de tus datos</li>
                <li>Oponerte al tratamiento de tus datos en determinadas circunstancias</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Para ejercer estos derechos, contactanos a{" "}
                <a href="mailto:privacidad@vehire.uy" className="text-primary hover:underline">
                  privacidad@vehire.uy
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Retención de datos</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Conservamos tus datos personales mientras tu cuenta esté activa o según sea necesario para prestarte nuestros servicios. Si decidís eliminar tu cuenta, eliminaremos o anonimizaremos tu información personal, excepto la que debamos conservar por obligaciones legales o para resolver disputas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Cambios a esta política</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Podemos actualizar esta política de privacidad periódicamente. Te notificaremos sobre cambios significativos a través de la plataforma o por correo electrónico. Te recomendamos revisar esta página regularmente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Contacto</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Si tenés preguntas sobre esta política de privacidad o sobre el tratamiento de tus datos, contactanos a{" "}
                <a href="mailto:privacidad@vehire.uy" className="text-primary hover:underline">
                  privacidad@vehire.uy
                </a>{" "}
                o visitá nuestra{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  página de contacto
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

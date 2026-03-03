import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/constants";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
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
          <h1 className="text-3xl font-bold mb-2">Términos y Condiciones</h1>
          <p className="text-muted-foreground mb-8">
            Última actualización: Marzo 2026
          </p>

          <div className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Aceptación de los Términos</h2>
              <p className="text-muted-foreground">
                Al acceder y utilizar {APP_NAME}, aceptas estar sujeto a estos Términos y Condiciones.
                Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestro servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Descripción del Servicio</h2>
              <p className="text-muted-foreground">
                {APP_NAME} es una plataforma de marketplace que conecta a propietarios de vehículos
                (Anfitriones) con personas que desean alquilar vehículos (Conductores). Actuamos como
                intermediario y no somos propietarios ni operamos los vehículos listados en la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Requisitos para Usar el Servicio</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Ser mayor de 21 años</li>
                <li>Poseer licencia de conducir válida</li>
                <li>Completar el proceso de verificación de identidad (KYC)</li>
                <li>Proporcionar información veraz y actualizada</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Proceso de Reserva</h2>
              <p className="text-muted-foreground">
                Al realizar una reserva:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Aceptas pagar el monto total mostrado, incluyendo tarifas e impuestos</li>
                <li>El pago se procesa a través de Mercado Pago</li>
                <li>Los fondos se mantienen en depósito hasta completar el alquiler</li>
                <li>Recibirás confirmación por email una vez procesado el pago</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Política de Cancelación</h2>
              <div className="text-muted-foreground space-y-2">
                <p><strong>Cancelación gratuita:</strong> Hasta 24 horas después de reservar - reembolso del 100%</p>
                <p><strong>Cancelación anticipada:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>7+ días antes del retiro: 90% de reembolso</li>
                  <li>3-7 días antes: 70% de reembolso</li>
                  <li>1-3 días antes: 50% de reembolso</li>
                  <li>Menos de 24 horas: Sin reembolso</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Uso del Vehículo</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Solo el conductor registrado puede operar el vehículo</li>
                <li>El vehículo debe usarse de acuerdo con las leyes de tránsito</li>
                <li>No está permitido fumar en el vehículo</li>
                <li>Las mascotas solo están permitidas si el anfitrión lo autoriza</li>
                <li>El vehículo debe devolverse con el mismo nivel de combustible</li>
                <li>Respeta el límite de kilometraje establecido</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Seguro</h2>
              <p className="text-muted-foreground">
                Todos los alquileres incluyen seguro básico que cubre:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Responsabilidad civil hacia terceros</li>
                <li>Daños al vehículo con franquicia</li>
                <li>Robo total del vehículo</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                El depósito de garantía se utiliza para cubrir la franquicia en caso de siniestro.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Depósito de Garantía</h2>
              <p className="text-muted-foreground">
                El depósito de garantía equivale al 10% del valor estimado del vehículo y se:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Cobra junto con el alquiler</li>
                <li>Mantiene en depósito durante todo el período de alquiler</li>
                <li>Libera automáticamente 24-48 horas después de la devolución sin incidentes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Tarifas de la Plataforma</h2>
              <p className="text-muted-foreground">
                {APP_NAME} cobra una comisión del 15% sobre el monto base del alquiler,
                con un mínimo de $5 USD y un máximo de $100 USD por reserva.
                Esta tarifa se descuenta automáticamente del pago al anfitrión.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Responsabilidades</h2>
              <p className="text-muted-foreground">
                {APP_NAME} no se hace responsable por:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Daños causados por mal uso del vehículo</li>
                <li>Incumplimiento de las condiciones por parte del anfitrión o conductor</li>
                <li>Multas de tránsito durante el período de alquiler</li>
                <li>Robo de objetos personales dejados en el vehículo</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Resolución de Disputas</h2>
              <p className="text-muted-foreground">
                En caso de disputa entre anfitrión y conductor, {APP_NAME} actuará como
                mediador. Ambas partes aceptan proporcionar toda la documentación necesaria
                para resolver el conflicto de manera justa.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Modificaciones</h2>
              <p className="text-muted-foreground">
                Nos reservamos el derecho de modificar estos términos en cualquier momento.
                Los cambios entrarán en vigor inmediatamente después de su publicación.
                El uso continuado del servicio constituye la aceptación de los términos modificados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Contacto</h2>
              <p className="text-muted-foreground">
                Para consultas sobre estos términos y condiciones, puedes contactarnos en:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: soporte@vehire.uy<br />
                Teléfono: +598 9999 9999
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

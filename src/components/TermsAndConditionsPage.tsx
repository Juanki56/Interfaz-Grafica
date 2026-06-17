import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface TermsAndConditionsPageProps {
  onViewChange: (view: string, itemId?: string) => void;
}

export function TermsAndConditionsPage({ onViewChange }: TermsAndConditionsPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-sky-50/50 to-emerald-50 py-20 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8">
        <div className="bg-green-600 p-8 text-white">
          <Button
            variant="ghost"
            onClick={() => onViewChange('home')}
            className="text-white hover:text-green-100 hover:bg-green-700 mb-6 -ml-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Inicio
          </Button>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold">Términos y Condiciones – Occitours</h1>
            <p className="mt-4 text-green-100 max-w-2xl mx-auto">
              Lee detenidamente nuestros términos y condiciones para conocer tus derechos y responsabilidades.
            </p>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">1. Aceptación de los términos</h2>
            <p>Al realizar una reserva con Occitours, el cliente acepta de manera expresa los presentes términos y condiciones, los cuales regulan la prestación de los servicios turísticos ofrecidos por la empresa.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">2. Servicios ofrecidos</h2>
            <p className="mb-2">Occitours es una agencia operadora de turismo que ofrece experiencias organizadas que pueden incluir transporte, guía, alimentación, actividades, seguros y acompañamiento.</p>
            <p>Cada experiencia especificará claramente lo que incluye y no incluye.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">3. Proceso de reserva</h2>
            <p className="mb-2">Para garantizar un cupo en una experiencia:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600">
              <li>El cliente debe realizar el pago total o un abono dentro de los tiempos establecidos.</li>
              <li>La reserva solo se considera confirmada una vez validado el pago.</li>
              <li>Occitours se reserva el derecho de liberar cupos no pagados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">4. Pagos</h2>
            <p className="mb-2">Se aceptan diferentes medios de pago definidos por Occitours.</p>
            <p>El cliente es responsable de enviar correctamente los comprobantes de pago cuando sea requerido.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">5. Políticas de cancelación</h2>
            <div className="mb-6">
              <h3 className="text-xl font-medium text-gray-800 mb-2">5.1 Cancelación por parte del cliente</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-600">
                <li>No se realizan devoluciones de dinero.</li>
                <li>No se permite reprogramación individual.</li>
                <li>En caso de cancelación o no asistencia, se perderá el valor abonado.</li>
                <li>El cupo será liberado para otros viajeros.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">5.2 Cancelación por parte de Occitours</h3>
              <p className="mb-2">En caso de cancelación por causas externas o de fuerza mayor (como condiciones climáticas, seguridad o situaciones logísticas):</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-600">
                <li>El dinero del cliente se conservará en su totalidad.</li>
                <li>Se ofrecerá reprogramación de la experiencia.</li>
                <li>La reprogramación se realizará de manera colectiva.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">6. Reprogramaciones</h2>
            <ul className="list-disc pl-6 space-y-1 text-gray-600">
              <li>Occitours no realiza reprogramaciones individuales.</li>
              <li>Las reprogramaciones únicamente se aplican cuando la empresa modifica la fecha de una salida.</li>
              <li>Todos los pasajeros serán trasladados automáticamente a la nueva fecha.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">7. Responsabilidades del cliente</h2>
            <p className="mb-2">El cliente se compromete a:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>Llegar puntual al punto de encuentro.</li>
              <li>Cumplir las indicaciones del equipo guía.</li>
              <li>Informar condiciones médicas relevantes.</li>
              <li>Mantener un comportamiento adecuado durante la experiencia.</li>
            </ul>
            <p>Occitours no se hace responsable por incumplimientos del cliente.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">8. Responsabilidades de Occitours</h2>
            <p className="mb-2">Occitours se compromete a:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600">
              <li>Brindar experiencias organizadas, seguras y de calidad.</li>
              <li>Cumplir con lo ofrecido en cada servicio.</li>
              <li>Trabajar con prestadores confiables.</li>
              <li>Informar oportunamente cualquier cambio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">9. Fuerza mayor</h2>
            <p className="mb-2">Occitours no será responsable por modificaciones o cancelaciones causadas por factores externos como:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>Condiciones climáticas</li>
              <li>Situaciones de orden público</li>
              <li>Problemas logísticos imprevistos</li>
            </ul>
            <p>En estos casos, se aplicarán las políticas de reprogramación.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">10. Uso de imagen</h2>
            <p className="mb-2">Durante las experiencias, Occitours podrá tomar fotografías o videos con fines promocionales.</p>
            <p>El cliente acepta el uso de su imagen, salvo que exprese lo contrario previamente.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">11. Protección de datos</h2>
            <p>La información personal del cliente será utilizada únicamente para la gestión de reservas, comunicación y prestación del servicio, conforme a la normativa vigente.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">12. Contacto</h2>
            <p className="mb-2">Para cualquier duda o solicitud, el cliente podrá comunicarse con Occitours a través del siguiente canal:</p>
            <p className="text-green-600 font-medium text-lg">📞 +57 304 3898018</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">13. Registro legal</h2>
            <p>Occitours opera como agencia de viajes registrada en el Registro Nacional de Turismo (RNT), garantizando formalidad, confianza y cumplimiento en la prestación del servicio.</p>
          </section>
        </div>

        <div className="bg-gray-50 border-t border-gray-100 p-8 text-center text-gray-500 text-sm">
          Última actualización: {new Date().toLocaleDateString('es-CO')}
        </div>
      </div>
    </div>
  );
}

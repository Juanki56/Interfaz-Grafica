import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface CancellationPoliciesPageProps {
  onViewChange: (view: string, itemId?: string) => void;
}

export function CancellationPoliciesPage({ onViewChange }: CancellationPoliciesPageProps) {
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
            <h1 className="text-3xl md:text-4xl font-bold">Políticas de Cancelación y Reprogramación – Occitours</h1>
            <p className="mt-4 text-green-100 max-w-2xl mx-auto">
              Información importante sobre cancelaciones, reprogramaciones y condiciones de servicio.
            </p>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">1. Cancelaciones por parte del cliente</h2>
            <p className="mb-2">En Occitours, cada reserva implica la asignación de cupos, logística y coordinación con aliados locales.</p>
            <p className="mb-2">Por esta razón:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600">
              <li>Los pagos realizados no son reembolsables.</li>
              <li>No se permiten reprogramaciones individuales.</li>
              <li>En caso de cancelación voluntaria, no asistencia ("No Show") o incumplimiento en los tiempos de pago, se perderá el valor abonado.</li>
              <li>El cupo liberado podrá ser asignado a otros viajeros.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">2. Cancelaciones por parte de Occitours</h2>
            <p className="mb-2">En caso de que Occitours deba cancelar una experiencia por causas externas o de fuerza mayor, tales como:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>Condiciones climáticas adversas</li>
              <li>Situaciones de seguridad</li>
              <li>Problemas logísticos imprevistos</li>
            </ul>
            <p className="mb-2">Se garantizará lo siguiente:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600">
              <li>El valor pagado por el cliente se conservará en su totalidad.</li>
              <li>El cliente podrá utilizar dicho valor en una nueva fecha o experiencia.</li>
              <li>La reprogramación se realizará de manera colectiva para todos los participantes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">3. Reprogramaciones</h2>
            <p className="mb-2">Occitours no realiza reprogramaciones individuales.</p>
            <p className="mb-2">Las reprogramaciones únicamente se aplican cuando:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>La empresa modifica la fecha de una salida programada.</li>
            </ul>
            <p className="mb-2">En estos casos:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600">
              <li>Todos los pasajeros serán trasladados automáticamente a la nueva fecha.</li>
              <li>Se notificará oportunamente a los clientes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">4. Condiciones generales</h2>
            <p className="mb-2">Al realizar una reserva con Occitours, el cliente acepta estas políticas de cancelación.</p>
            <p className="mb-2">Estas condiciones permiten garantizar:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>La correcta organización de las experiencias</li>
              <li>El cumplimiento logístico</li>
              <li>El respeto por los demás viajeros y aliados del servicio</li>
            </ul>
            <p>Occitours trabaja para brindar experiencias seguras, organizadas y de alta calidad, bajo principios de responsabilidad y transparencia.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-700 mb-4 border-b border-green-100 pb-2">5. Contacto</h2>
            <p className="mb-2">Si tienes dudas sobre estas políticas, puedes comunicarte con nuestro equipo:</p>
            <p className="text-green-600 font-medium text-lg">📞 +57 304 3898018</p>
          </section>
        </div>

        <div className="bg-gray-50 border-t border-gray-100 p-8 text-center text-gray-500 text-sm">
          Última actualización: {new Date().toLocaleDateString('es-CO')}
        </div>
      </div>
    </div>
  );
}

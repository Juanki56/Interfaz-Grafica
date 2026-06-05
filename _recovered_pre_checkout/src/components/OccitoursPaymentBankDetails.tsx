import { OCCITOURS_NEQUI_REFERENCE_NUMBER, OCCITOURS_PAYMENT_INFO } from '../utils/occitoursPaymentBankInfo';
import { cn } from './ui/utils';

type OccitoursPaymentBankDetailsProps = {
  className?: string;
  /** Muestra la línea de referencia Nequi además de Bancolombia. Por defecto true. */
  showNequiReference?: boolean;
};

/**
 * Resumen único de datos bancarios y titular para cualquier método de pago (transferencia, QR, PSE, etc.).
 */
export function OccitoursPaymentBankDetails({
  className,
  showNequiReference = true,
}: OccitoursPaymentBankDetailsProps) {
  const p = OCCITOURS_PAYMENT_INFO;

  return (
    <div
      className={cn(
        'rounded-xl border border-emerald-200 bg-emerald-50/95 p-4 text-sm text-emerald-950 shadow-sm',
        className,
      )}
      role="region"
      aria-label="Datos de pago OCCITOURS"
    >
      <p className="font-semibold text-emerald-900 mb-3">Datos para pagar OCCITOURS</p>
      <ul className="space-y-2 leading-relaxed">
        <li>
          <span className="mr-1 opacity-90" aria-hidden>
            🏦
          </span>
          <strong>{p.bancolombiaBankName}</strong>{' '}
          <span className="text-emerald-800">{p.bancolombiaTipoCuenta}</span>
        </li>
        <li>
          <span className="mr-1 opacity-90" aria-hidden>
            🔢
          </span>
          Cuenta:{' '}
          <strong className="font-mono tracking-wide">{p.bancolombiaNumeroCuenta}</strong>
        </li>
        <li>
          <span className="mr-1 opacity-90" aria-hidden>
            👤
          </span>
          Titular: <strong>{p.titular}</strong>
        </li>
        <li>
          <span className="mr-1 opacity-90" aria-hidden>
            📄
          </span>
          <strong>{p.beneficiarioTipoDocumento}</strong>:{' '}
          <span className="font-mono">{p.beneficiarioNumeroDocumento}</span>
        </li>
      </ul>
      {showNequiReference ? (
        <p className="mt-4 pt-3 border-t border-emerald-200/80 text-xs text-emerald-900">
          <span className="font-medium">Nequi / referencia rápida:</span>{' '}
          <span className="font-mono font-semibold">{OCCITOURS_NEQUI_REFERENCE_NUMBER}</span>{' '}
          <span className="text-emerald-800">(beneficiario igual al titular arriba)</span>
        </p>
      ) : null}
    </div>
  );
}

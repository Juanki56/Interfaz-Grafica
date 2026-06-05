/**
 * Datos oficiales de consignación / transferencia OCCITOURS (cliente y staff).
 * Un solo lugar para actualizar cuenta y beneficiario en toda la UI.
 */

export const OCCITOURS_TRANSFER_ACCOUNT = {
  bankName: 'Bancolombia',
  accountType: 'Ahorros',
  accountNumber: '24015712755',
  beneficiaryName: 'Yeison Uribe Vega',
  beneficiaryDocType: 'CC',
  /** Formato con separadores de miles (Colombia) */
  beneficiaryDocFormatted: '1.001.845.593',
} as const;

/** Referencia para pagos tipo Nequi / QR (si aplica al flujo del producto). */
export const OCCITOURS_NEQUI_REFERENCE_NUMBER = '3001234567';

/**
 * Contrato legacy usado por modales de reserva (ProgrammedRouteBookingModal, FarmBookingModal).
 */
export const OCCITOURS_PAYMENT_INFO = {
  titular: OCCITOURS_TRANSFER_ACCOUNT.beneficiaryName,
  nequiNumero: OCCITOURS_NEQUI_REFERENCE_NUMBER,
  bancolombiaBankName: OCCITOURS_TRANSFER_ACCOUNT.bankName,
  bancolombiaTipoCuenta: OCCITOURS_TRANSFER_ACCOUNT.accountType,
  bancolombiaNumeroCuenta: OCCITOURS_TRANSFER_ACCOUNT.accountNumber,
  beneficiarioTipoDocumento: OCCITOURS_TRANSFER_ACCOUNT.beneficiaryDocType,
  beneficiarioNumeroDocumento: OCCITOURS_TRANSFER_ACCOUNT.beneficiaryDocFormatted,
} as const;

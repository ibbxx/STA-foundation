import type { Json } from './supabase/types';

export const PAYMENT_SETTINGS_KEY = 'payment_settings';
export const DEFAULT_QRIS_IMAGE_URL = '/images/qris-payment.jpeg';

export type ManualPaymentMethod = 'qris' | 'bank_transfer';

export interface BankAccountSetting {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
}

export interface PaymentSettings {
  manual_enabled: boolean;
  gateway_enabled: boolean;
  active_gateway: string | null;
  qris_image_url: string;
  bank_accounts: BankAccountSetting[];
  manual_instructions: string;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  manual_enabled: true,
  gateway_enabled: false,
  active_gateway: null,
  qris_image_url: DEFAULT_QRIS_IMAGE_URL,
  bank_accounts: [],
  manual_instructions: 'Unggah bukti pembayaran setelah transfer agar admin dapat memverifikasi donasi Anda.',
};

export const MANUAL_PAYMENT_METHODS: Array<{
  id: ManualPaymentMethod;
  name: string;
  description: string;
}> = [
  {
    id: 'qris',
    name: 'QRIS',
    description: 'Bayar melalui aplikasi e-wallet atau mobile banking yang mendukung QRIS.',
  },
  {
    id: 'bank_transfer',
    name: 'Transfer Bank',
    description: 'Transfer ke rekening resmi Sekolah Tanah Air.',
  },
];

function normalizeBankAccounts(value: unknown): BankAccountSetting[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const account = item as Partial<BankAccountSetting>;
      const bankName = String(account.bank_name ?? '').trim();
      const accountNumber = String(account.account_number ?? '').trim();
      const accountName = String(account.account_name ?? '').trim();

      if (!bankName && !accountNumber && !accountName) return null;

      return {
        id: String(account.id ?? `bank_${index + 1}`),
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
      };
    })
    .filter((item): item is BankAccountSetting => item !== null);
}

export function normalizePaymentSettings(value: Json | PaymentSettings | null | undefined): PaymentSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_PAYMENT_SETTINGS, bank_accounts: [] };
  }

  const raw = value as Record<string, unknown>;
  const qrisImageUrl = typeof raw.qris_image_url === 'string' ? raw.qris_image_url.trim() : '';

  return {
    manual_enabled: typeof raw.manual_enabled === 'boolean' ? raw.manual_enabled : DEFAULT_PAYMENT_SETTINGS.manual_enabled,
    gateway_enabled: typeof raw.gateway_enabled === 'boolean' ? raw.gateway_enabled : DEFAULT_PAYMENT_SETTINGS.gateway_enabled,
    active_gateway: typeof raw.active_gateway === 'string' && raw.active_gateway.trim()
      ? raw.active_gateway.trim()
      : null,
    qris_image_url: qrisImageUrl || DEFAULT_QRIS_IMAGE_URL,
    bank_accounts: normalizeBankAccounts(raw.bank_accounts),
    manual_instructions: typeof raw.manual_instructions === 'string' && raw.manual_instructions.trim()
      ? raw.manual_instructions.trim()
      : DEFAULT_PAYMENT_SETTINGS.manual_instructions,
  };
}

export function hasManualPaymentDetails(settings: PaymentSettings, method: ManualPaymentMethod): boolean {
  if (method === 'qris') return Boolean(settings.qris_image_url.trim());
  return settings.bank_accounts.some((account) => (
    account.bank_name.trim()
    && account.account_number.trim()
    && account.account_name.trim()
  ));
}

export function getVisibleManualPaymentMethods(settings: PaymentSettings) {
  if (!settings.manual_enabled) return [];
  return MANUAL_PAYMENT_METHODS.filter((method) => hasManualPaymentDetails(settings, method.id));
}

import { useI18n } from '@/lib/i18n';

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 140 }: QRCodeProps) {
  const { t } = useI18n();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;

  return (
    <div
      className="bg-white p-2.5 rounded-2xl shadow-md flex flex-col items-center"
      style={{ minWidth: size + 20 }}
    >
      <img
        src={qrUrl}
        alt={t('qr.alt')}
        width={size}
        height={size}
        className="rounded-lg"
      />
      <span className="text-[9px] font-black text-ocean-900 uppercase tracking-tight mt-1">
        {t('qr.scan')}
      </span>
    </div>
  );
}

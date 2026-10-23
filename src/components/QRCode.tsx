interface QRCodeProps {
  value: string;
  size?: number;
}

// Simple QR code generation using a public API-free approach
// We render a styled QR placeholder that links to the join URL
export function QRCode({ value, size = 140 }: QRCodeProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;

  return (
    <div
      className="bg-white p-2.5 rounded-2xl shadow-md flex flex-col items-center"
      style={{ minWidth: size + 20 }}
    >
      <img
        src={qrUrl}
        alt="QR Code para entrar na sala"
        width={size}
        height={size}
        className="rounded-lg"
      />
      <span className="text-[9px] font-black text-ocean-900 uppercase tracking-tight mt-1">
        Escanear
      </span>
    </div>
  );
}

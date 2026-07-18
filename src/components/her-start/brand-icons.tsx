export function ValueMirrorLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="22" stroke="#0B5B45" strokeWidth="1.5" opacity="0.3" />
      <circle cx="24" cy="24" r="17" stroke="#146B52" strokeWidth="1.5" opacity="0.5" />
      <circle cx="24" cy="24" r="12" fill="url(#vm-grad)" />
      <ellipse cx="21" cy="21" rx="5" ry="6" fill="rgba(255,255,255,0.25)" />
      <defs>
        <linearGradient id="vm-grad" x1="24" y1="12" x2="24" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#39A37D" />
          <stop offset="1" stopColor="#0B5B45" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BadgeSeal({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" fill="none" aria-hidden="true">
      <circle cx="25" cy="25" r="24" fill="#B9934D" />
      <circle cx="25" cy="25" r="20" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <text x="25" y="32" textAnchor="middle" fontSize="22" fill="white" fontFamily="serif">她</text>
    </svg>
  );
}

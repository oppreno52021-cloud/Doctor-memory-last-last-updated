import React from 'react';

interface DoctorMemoryLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'full' | 'icon-only';
  textColor?: string;
}

export const DoctorMemoryLogo: React.FC<DoctorMemoryLogoProps> = ({
  className = '',
  size = 40,
  showText = false,
  variant = 'icon-only',
  textColor = 'text-slate-900',
}) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Crisp Official Doctor Memory Circular Emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform"
      >
        {/* Outer Circular Ring */}
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="#0a3d62"
          strokeWidth="11"
          fill="none"
        />

        {/* Center Neural Microchip */}
        <rect
          x="73"
          y="69"
          width="22"
          height="22"
          rx="3"
          fill="#0a3d62"
        />
        {/* Microchip Pins */}
        <line x1="78" y1="65" x2="78" y2="69" stroke="#0a3d62" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="84" y1="65" x2="84" y2="69" stroke="#0a3d62" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="90" y1="65" x2="90" y2="69" stroke="#0a3d62" strokeWidth="2.5" strokeLinecap="round" />

        <line x1="78" y1="91" x2="78" y2="95" stroke="#0a3d62" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="84" y1="91" x2="84" y2="95" stroke="#0a3d62" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="90" y1="91" x2="90" y2="95" stroke="#0a3d62" strokeWidth="2.5" strokeLinecap="round" />

        <line x1="69" y1="75" x2="73" y2="75" stroke="#0a3d62" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="69" y1="80" x2="73" y2="80" stroke="#0a3d62" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="69" y1="85" x2="73" y2="85" stroke="#0a3d62" strokeWidth="2.5" strokeLinecap="round" />

        {/* Medical Cross (Right Half) */}
        <path
          d="M80 43 H101 V64 H122 V96 H101 V117 H80 V92 H95 V68 H80 Z"
          fill="#0a3d62"
        />

        {/* Brain Silhouette & Neural Circuit (Left Half) */}
        {/* Brain Lobes Contour */}
        <path
          d="M78 43 
             C 65 43, 56 47, 49 54 
             C 41 57, 36 64, 37 72 
             C 34 77, 34 84, 38 89 
             C 37 96, 42 104, 50 106 
             C 56 113, 67 116, 78 117 
             L 78 92 
             C 68 92, 60 88, 56 82 
             C 52 76, 54 69, 58 64 
             C 64 57, 72 56, 78 57 
             Z"
          fill="#0a3d62"
        />

        {/* Neural Circuit Branch 1 - Top */}
        <path
          d="M73 73 L58 60 L50 63"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="48" cy="64" r="3.2" fill="white" />

        {/* Neural Circuit Branch 2 - Middle Lobe */}
        <path
          d="M73 80 L52 80 L44 76"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="43" cy="76" r="3.2" fill="white" />

        {/* Neural Circuit Branch 3 - Lower Lobe */}
        <path
          d="M73 87 L60 97 L52 94"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="94" r="3.2" fill="white" />
      </svg>

      {/* Brand Typography (when showText is true) */}
      {showText && (
        <div className="flex flex-col leading-none text-right">
          <span className="text-sm font-black tracking-wider text-[#0a3d62] uppercase font-sans">
            DOCTOR
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold tracking-widest text-[#0e638e] uppercase font-sans">
              MEMORY
            </span>
            <span className="text-[9px] font-black px-1 py-0.2 rounded bg-[#0a3d62] text-white tracking-wider">
              APK
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

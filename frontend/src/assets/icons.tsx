import React, { createContext, useContext } from 'react';

// Icon properties type
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

// Create a Context for the active IconSet
export const IconSetContext = createContext<string>('sf-symbols');

// Custom Hook to consume the active IconSet
export const useIconSet = () => useContext(IconSetContext);

// Shared shadow filters for the hyper-realistic macOS 26 style
const SVGDefFilters: React.FC = () => (
  <defs>
    <filter id="macOSShadow" x="-10%" y="-10%" width="120%" height="125%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.18" />
    </filter>
    <filter id="glassGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
);

// ============================================================================
// 1. Folder Icon (Realistic 3D layered glass folder for macOS 26)
// ============================================================================
export const FolderIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#4cc9f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #4cc9f0)', ...props.style }}>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="rgba(76, 201, 240, 0.15)" />
      </svg>
    );
  }

  // macOS 26 (Hyper-realistic 3D gradient glass folder)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <SVGDefFilters />
      <defs>
        <linearGradient id="foldBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0d47a1" />
          <stop offset="100%" stopColor="#1565c0" />
        </linearGradient>
        <linearGradient id="foldFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4fc3f7" />
          <stop offset="50%" stopColor="#29b6f6" />
          <stop offset="100%" stopColor="#0288d1" />
        </linearGradient>
        <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e3f2fd" />
        </linearGradient>
      </defs>
      
      {/* Back Flap */}
      <path d="M2 5.5a2 2 0 0 1 2-2h5l1.6 2.2H20a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5.5z" fill="url(#foldBackGrad)" stroke="#0b3c8f" strokeWidth="0.8" />
      
      {/* Inside Paper Sheet */}
      <rect x="5.5" y="4.5" width="13" height="9.5" rx="1.5" fill="url(#paperGrad)" filter="url(#macOSShadow)" />
      <line x1="8" y1="7.5" x2="16" y2="7.5" stroke="#90caf9" strokeWidth="1" strokeLinecap="round" />
      <line x1="8" y1="9.5" x2="13" y2="9.5" stroke="#90caf9" strokeWidth="1" strokeLinecap="round" />
      
      {/* Front Flap (3D Overlay with glassmorphism glow) */}
      <path d="M2 8.8a1.8 1.8 0 0 1 1.8-1.8h16.4A1.8 1.8 0 0 1 22 8.8V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.8z" fill="url(#foldFrontGrad)" fillOpacity="0.94" stroke="#01579b" strokeWidth="1" filter="url(#macOSShadow)" />
      
      {/* Glossy Lip Highlight */}
      <path d="M3.8 8h16.4A0.8 0.8 0 0 1 21 8.8v0.2H3v-0.2A0.8 0.8 0 0 1 3.8 8z" fill="#ffffff" fillOpacity="0.35" />
    </svg>
  );
};

// ============================================================================
// 2. General File Icon (Realistic document sheet with folded corner)
// ============================================================================
export const FileIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#f72585" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #f72585)', ...props.style }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="rgba(247, 37, 133, 0.1)" />
        <polyline points="14 2 14 8 20 8" stroke="#4895ef" />
      </svg>
    );
  }

  // macOS 26 (Ultra glossy paper layers with 3d folded corner)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <SVGDefFilters />
      <defs>
        <linearGradient id="filePageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="85%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f5f5f7" />
        </linearGradient>
        <linearGradient id="fileFoldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#cfd8dc" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      
      {/* Behind sheet shadow layer */}
      <path d="M4.5 2H14l5.5 5.5V20a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#000" fillOpacity="0.04" transform="translate(0.5, 0.8)" rx="1.5" />
      
      {/* File Page */}
      <path d="M4 2H14.5L20 7.5V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="url(#filePageGrad)" stroke="#cfd8dc" strokeWidth="0.8" />
      
      {/* Content lines */}
      <line x1="5.5" y1="7" x2="11.5" y2="7" stroke="#b0bec5" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5.5" y1="10.5" x2="17" y2="10.5" stroke="#cfd8dc" strokeWidth="1" strokeLinecap="round" />
      <line x1="5.5" y1="13.5" x2="14" y2="13.5" stroke="#cfd8dc" strokeWidth="1" strokeLinecap="round" />
      <line x1="5.5" y1="16.5" x2="16.5" y2="16.5" stroke="#cfd8dc" strokeWidth="1" strokeLinecap="round" />
      
      {/* Folded Corner flap with 3d shadows */}
      <path d="M14.5 2v5.5H20z" fill="url(#fileFoldGrad)" stroke="#b0bec5" strokeWidth="0.6" filter="url(#macOSShadow)" />
    </svg>
  );
};

// ============================================================================
// 3. Image Icon (Realistic sunset mountain glossy picture frame)
// ============================================================================
export const ImageIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#4cc9f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #4cc9f0)', ...props.style }}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="rgba(76, 201, 240, 0.1)" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="#f72585" stroke="#f72585" />
        <polyline points="21 15 16 10 5 21" stroke="#f72585" />
      </svg>
    );
  }

  // macOS 26 (Sunset mountain picture with physical glass frame)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <SVGDefFilters />
      <defs>
        <linearGradient id="sunsetSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff416c" />
          <stop offset="100%" stopColor="#ff4b2b" />
        </linearGradient>
        <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2c3e50" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
      </defs>
      
      {/* Outer physical glossy photo border */}
      <rect x="2.5" y="2.5" width="19" height="19" rx="3.5" fill="#ffffff" stroke="#dcdce0" strokeWidth="1" filter="url(#macOSShadow)" />
      
      {/* Glass Inner Picture Viewport */}
      <rect x="4" y="4" width="16" height="16" rx="2" fill="url(#sunsetSky)" />
      
      {/* Glowing Sun */}
      <circle cx="14.5" cy="8" r="2" fill="#ffffff" opacity="0.95" filter="url(#glassGlow)" />
      
      {/* Mountains */}
      <path d="M4 17l4.5-5.5 3.5 3.8 4.2-4.5 3.8 5.2V20H4z" fill="url(#mountainGrad)" opacity="0.95" />
      
      {/* Gloss Reflection Overlay */}
      <path d="M4 4l12 0L4 16z" fill="#ffffff" fillOpacity="0.12" pointerEvents="none" />
    </svg>
  );
};

// ============================================================================
// 4. PDF Icon (Glowy crimson layered page)
// ============================================================================
export const PDFIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <text x="6" y="15" fill="currentColor" fontSize="6.5" fontWeight="bold" fontFamily="system-ui">PDF</text>
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#ff007f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #ff007f)', ...props.style }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="rgba(255, 0, 127, 0.15)" />
        <text x="6" y="15" fill="#4cc9f0" fontSize="7" fontWeight="bold" fontFamily="system-ui" stroke="none">PDF</text>
      </svg>
    );
  }

  // macOS 26 (Crimson glass header with physical paper details)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <SVGDefFilters />
      <defs>
        <linearGradient id="pdfHeaderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff453a" />
          <stop offset="100%" stopColor="#c92a2a" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <path d="M4.5 2H14l5.5 5.5V20a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#000" fillOpacity="0.04" transform="translate(0.5, 0.8)" rx="1.5" />
      
      {/* File Page */}
      <path d="M4 2H14.5L20 7.5V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#ffffff" stroke="#ffcdd2" strokeWidth="0.8" />
      
      {/* Red Glass Header Badge */}
      <path d="M4 2h10.5l5.5 5.5v3.5H4z" fill="url(#pdfHeaderGrad)" />
      
      {/* "PDF" White text centered in header */}
      <text x="6.5" y="8" fill="#ffffff" fontSize="6.5" fontWeight="900" fontFamily="system-ui" letterSpacing="0.2">PDF</text>
      
      {/* Body text lines */}
      <line x1="5.5" y1="13.5" x2="16.5" y2="13.5" stroke="#e0e0e0" strokeWidth="1" strokeLinecap="round" />
      <line x1="5.5" y1="16" x2="14" y2="16" stroke="#e0e0e0" strokeWidth="1" strokeLinecap="round" />
      <line x1="5.5" y1="18.5" x2="17" y2="18.5" stroke="#e0e0e0" strokeWidth="1" strokeLinecap="round" />
      
      {/* Corner fold */}
      <path d="M14.5 2v5.5H20z" fill="#ffebd8" stroke="#ffcdd2" strokeWidth="0.6" filter="url(#macOSShadow)" />
    </svg>
  );
};

// ============================================================================
// 5. Audio Icon (Glossy slate vinyl album with notes)
// ============================================================================
export const AudioIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#7209b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #7209b7)', ...props.style }}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="rgba(114, 9, 183, 0.1)" />
        <path d="M9 18V5l12-2v13" stroke="#4cc9f0" />
        <circle cx="6" cy="18" r="3" fill="#f72585" stroke="#f72585" />
        <circle cx="18" cy="16" r="3" fill="#f72585" stroke="#f72585" />
      </svg>
    );
  }

  // macOS 26 (Vinyl records and purple glass accents)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <SVGDefFilters />
      <defs>
        <linearGradient id="vinylGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3a3d52" />
          <stop offset="100%" stopColor="#111219" />
        </linearGradient>
      </defs>
      
      {/* Vinyl Disc Outer Frame */}
      <circle cx="12" cy="12" r="9.5" fill="url(#vinylGrad)" stroke="#1a1c24" strokeWidth="0.8" filter="url(#macOSShadow)" />
      
      {/* Tracks concentric ridges */}
      <circle cx="12" cy="12" r="7.5" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      <circle cx="12" cy="12" r="5.5" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      
      {/* Purple Label Center */}
      <circle cx="12" cy="12" r="3.2" fill="#5856d6" />
      <circle cx="12" cy="12" r="0.8" fill="#ffffff" />
      
      {/* Glowing 3D Glass Note Overlay */}
      <path d="M12 7.5v4.5a1.8 1.8 0 1 1-1.5-1.5H12" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" filter="url(#glassGlow)" />
    </svg>
  );
};

// ============================================================================
// 6. Video Icon (Chrome film camera with glowing golden rays)
// ============================================================================
export const VideoIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m22 8-6 4 6 4V8Z" />
        <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#ff9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #ff9500)', ...props.style }}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="rgba(255, 149, 0, 0.1)" />
        <path d="m21 16-4-3v3l4-3zM5 10l6 3v-6l-6 3z" stroke="#f72585" />
      </svg>
    );
  }

  // macOS 26 (Metallic obsidian film camera with gold glass details)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <SVGDefFilters />
      <defs>
        <linearGradient id="metalCamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#48484a" />
          <stop offset="100%" stopColor="#2c2c2e" />
        </linearGradient>
        <linearGradient id="goldGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffb300" />
          <stop offset="100%" stopColor="#ff8f00" />
        </linearGradient>
      </defs>
      
      {/* 3D Camera Body */}
      <rect x="3" y="6.5" width="11" height="8.5" rx="2" fill="url(#metalCamGrad)" stroke="#1c1c1e" strokeWidth="0.8" filter="url(#macOSShadow)" />
      
      {/* Projector Reels (Glossy double top rings) */}
      <circle cx="5.8" cy="4.8" r="2.2" fill="url(#metalCamGrad)" stroke="#1a1a1c" strokeWidth="0.6" />
      <circle cx="11.2" cy="4.8" r="2.2" fill="url(#metalCamGrad)" stroke="#1a1a1c" strokeWidth="0.6" />
      <circle cx="5.8" cy="4.8" r="0.7" fill="#ffb300" />
      <circle cx="11.2" cy="4.8" r="0.7" fill="#ffb300" />
      
      {/* Projector glowing amber lens cone */}
      <path d="M14.5 10.8 l5.5-3.5a0.5 0 0 1 0.8 0.4v6.6a0.5 0 0 1-0.8 0.4z" fill="url(#goldGlow)" filter="url(#macOSShadow)" />
      
      {/* Highlight reflections */}
      <path d="M4.5 7.5h8v0.5h-8z" fill="#ffffff" fillOpacity="0.18" />
    </svg>
  );
};

// ============================================================================
// 7. Archive / Zip Icon (Metallic crate with detailed golden zipper)
// ============================================================================
export const ArchiveIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" rx="1" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#af52de" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #af52de)', ...props.style }}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="rgba(175, 82, 222, 0.1)" stroke="#af52de" />
        <line x1="8" y1="3" x2="8" y2="21" stroke="#4cc9f0" />
        <line x1="16" y1="3" x2="16" y2="21" stroke="#4cc9f0" />
        <rect x="10" y="8" width="4" height="8" rx="1" fill="#f72585" stroke="none" />
      </svg>
    );
  }

  // macOS 26 (Deep purple chest with golden micro-zipper)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <SVGDefFilters />
      <defs>
        <linearGradient id="archiveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ab47bc" />
          <stop offset="100%" stopColor="#6a1b9a" />
        </linearGradient>
        <linearGradient id="zipperGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffee58" />
          <stop offset="100%" stopColor="#f57f17" />
        </linearGradient>
      </defs>
      
      {/* Crate Body */}
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" fill="url(#archiveGrad)" stroke="#4a148c" strokeWidth="0.8" filter="url(#macOSShadow)" />
      
      {/* Side reinforcement ridges */}
      <line x1="7.5" y1="3.5" x2="7.5" y2="20.5" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
      <line x1="16.5" y1="3.5" x2="16.5" y2="20.5" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
      
      {/* Zipper strip */}
      <rect x="11.2" y="3.5" width="1.6" height="17" fill="url(#zipperGrad)" />
      
      {/* Zipper slider */}
      <rect x="10.2" y="9.5" width="3.6" height="6" rx="1" fill="url(#zipperGrad)" stroke="#e65100" strokeWidth="0.5" filter="url(#macOSShadow)" />
      <circle cx="12" cy="11.5" r="0.8" fill="#ffffff" />
    </svg>
  );
};

// ============================================================================
// 8. Trash Icon (Polished chromium ribbed bin)
// ============================================================================
export const TrashIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#f72585" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #f72585)', ...props.style }}>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="rgba(247, 37, 133, 0.05)" />
        <line x1="10" y1="11" x2="10" y2="17" stroke="#4cc9f0" />
        <line x1="14" y1="11" x2="14" y2="17" stroke="#4cc9f0" />
      </svg>
    );
  }

  // macOS 26 (Chrome metallic ribbed bucket with glass accents)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <SVGDefFilters />
      <defs>
        <linearGradient id="chromeBin" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#cfd8dc" />
          <stop offset="35%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#eceff1" />
          <stop offset="100%" stopColor="#b0bec5" />
        </linearGradient>
      </defs>
      
      {/* Bin Body (Tapered bottom) */}
      <path d="M5.5 8 l1.4 11.2a1.8 1.8 0 0 0 1.8 1.6h6.6a1.8 1.8 0 0 0 1.8-1.6L18.5 8z" fill="url(#chromeBin)" stroke="#90a4ae" strokeWidth="0.8" filter="url(#macOSShadow)" />
      
      {/* Vertical Ribs */}
      <line x1="8.5" y1="9.5" x2="9.5" y2="19.5" stroke="#90a4ae" strokeWidth="0.8" />
      <line x1="12" y1="9.5" x2="12" y2="19.5" stroke="#90a4ae" strokeWidth="0.8" />
      <line x1="15.5" y1="9.5" x2="14.5" y2="19.5" stroke="#90a4ae" strokeWidth="0.8" />
      
      {/* Rim & Handle lid overlay */}
      <path d="M4 6.5 a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v1.2H4z" fill="url(#chromeBin)" stroke="#78909c" strokeWidth="0.6" />
      <rect x="9.5" y="3" width="5" height="1.8" rx="0.5" fill="url(#chromeBin)" stroke="#78909c" strokeWidth="0.6" />
    </svg>
  );
};

// ============================================================================
// 9. Search Icon
// ============================================================================
export const SearchIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#4cc9f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #4cc9f0)', ...props.style }}>
        <circle cx="11" cy="11" r="8" fill="rgba(76, 201, 240, 0.05)" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#f72585" />
      </svg>
    );
  }

  // macOS 26 (Crisp glossy magnifying glass with slight glass lens reflection)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <SVGDefFilters />
      <circle cx="11" cy="11" r="8" stroke="#007aff" fill="rgba(0,122,255,0.05)" filter="url(#macOSShadow)" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#48484a" strokeWidth="2.5" />
      
      {/* Glossy sheen on glass lens */}
      <path d="M7.5 7.5a6 6 0 0 1 7 0" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.4" />
    </svg>
  );
};

// ============================================================================
// 10. Grid Icon
// ============================================================================
export const GridIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#f72585" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #f72585)', ...props.style }}>
        <rect x="3" y="3" width="7" height="7" fill="rgba(247, 37, 133, 0.1)" />
        <rect x="14" y="3" width="7" height="7" fill="rgba(247, 37, 133, 0.1)" />
        <rect x="14" y="14" width="7" height="7" fill="rgba(247, 37, 133, 0.1)" />
        <rect x="3" y="14" width="7" height="7" fill="rgba(247, 37, 133, 0.1)" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" fill="none" />
      <rect x="14" y="3" width="7" height="7" fill="none" />
      <rect x="14" y="14" width="7" height="7" fill="none" />
      <rect x="3" y="14" width="7" height="7" fill="none" />
    </svg>
  );
};

// ============================================================================
// 11. List Icon
// ============================================================================
export const ListIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#4cc9f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #4cc9f0)', ...props.style }}>
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="3" cy="6" r="1.5" fill="#f72585" stroke="none" />
        <circle cx="3" cy="12" r="1.5" fill="#f72585" stroke="none" />
        <circle cx="3" cy="18" r="1.5" fill="#f72585" stroke="none" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
};

// ============================================================================
// 12. New Folder Icon
// ============================================================================
export const NewFolderIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 10v6m-3-3h6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#4cc9f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #4cc9f0)', ...props.style }}>
        <path d="M12 10v6m-3-3h6" stroke="#f72585" strokeWidth="2" />
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="rgba(76, 201, 240, 0.15)" />
      </svg>
    );
  }

  // macOS 26 (Glossy gradient blue folder with bright white plus)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <SVGDefFilters />
      <defs>
        <linearGradient id="newFolderFront" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4fc3f7" />
          <stop offset="100%" stopColor="#0288d1" />
        </linearGradient>
      </defs>
      
      {/* Folder body */}
      <path d="M2 5.5a2 2 0 0 1 2-2h5l1.6 2.2H20a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5.5z" fill="#0d47a1" />
      <path d="M2 8.8a1.8 1.8 0 0 1 1.8-1.8h16.4A1.8 1.8 0 0 1 22 8.8V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.8z" fill="url(#newFolderFront)" filter="url(#macOSShadow)" />
      
      {/* Glow White Plus */}
      <circle cx="12" cy="14" r="3.2" fill="#ffffff" filter="url(#glassGlow)" />
      <path d="M12 12v4m-2-2h4" stroke="#0288d1" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

// ============================================================================
// 13. Upload Icon
// ============================================================================
export const UploadIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5-5 5 5m-5-5v12" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#f72585" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #f72585)', ...props.style }}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5-5 5 5m-5-5v12" stroke="#4cc9f0" fill="rgba(247, 37, 133, 0.05)" />
      </svg>
    );
  }

  // macOS 26 (Deep rich icon with glowing blue arrows)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5-5 5 5m-5-5v12" stroke="#007aff" filter="url(#glassGlow)" />
    </svg>
  );
};

// ============================================================================
// 14. Info Icon
// ============================================================================
export const InfoIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#4cc9f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #4cc9f0)', ...props.style }}>
        <circle cx="12" cy="12" r="10" fill="rgba(76, 201, 240, 0.1)" />
        <line x1="12" y1="16" x2="12" y2="12" stroke="#f72585" />
        <line x1="12" y1="8" x2="12.01" y2="8" stroke="#f72585" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" stroke="#007aff" fill="rgba(0,122,255,0.04)" />
      <line x1="12" y1="16" x2="12" y2="12" stroke="#007aff" strokeWidth="2.5" />
      <line x1="12" y1="8" x2="12.01" y2="8" stroke="#007aff" strokeWidth="2.5" />
    </svg>
  );
};

// ============================================================================
// 15. Chevron Left Icon
// ============================================================================
export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#4cc9f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 2px #4cc9f0)', ...props.style }}>
        <polyline points="15 18 9 12 15 6" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={iconSet === 'monochrome-outline' ? "1.5" : "2"} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
};

// ============================================================================
// 16. Chevron Right Icon
// ============================================================================
export const ChevronRightIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#4cc9f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 2px #4cc9f0)', ...props.style }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={iconSet === 'monochrome-outline' ? "1.5" : "2"} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
};

// ============================================================================
// 17. Sun Icon
// ============================================================================
export const SunIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#ff9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #ff9500)', ...props.style }}>
        <circle cx="12" cy="12" r="5" fill="rgba(255, 149, 0, 0.15)" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#f72585" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="#f72585" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="#f72585" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="#f72585" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="5" fill="#ff9500" stroke="#d67d00" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
};

// ============================================================================
// 18. Moon Icon
// ============================================================================
export const MoonIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#f72585" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #f72585)', ...props.style }}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="rgba(247, 37, 133, 0.15)" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#af52de" stroke="#8f3db8" />
    </svg>
  );
};

// ============================================================================
// 19. Power Icon
// ============================================================================
export const PowerIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#ff0055" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #ff0055)', ...props.style }}>
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={iconSet === 'monochrome-outline' ? "1.5" : "2"} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" />
    </svg>
  );
};

// ============================================================================
// 20. Key / Credential Icon
// ============================================================================
export const KeyIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#ff9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #ff9500)', ...props.style }}>
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" fill="rgba(255, 149, 0, 0.05)" />
      </svg>
    );
  }

  // macOS 26 (Glossy gold mechanical key)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <SVGDefFilters />
      <defs>
        <linearGradient id="goldKeyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffee58" />
          <stop offset="100%" stopColor="#f57c00" />
        </linearGradient>
      </defs>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" fill="url(#goldKeyGrad)" stroke="#e65100" strokeWidth="0.8" filter="url(#macOSShadow)" />
      
      {/* Keyhole reflection */}
      <circle cx="5.5" cy="18.5" r="1.5" fill="#ffffff" opacity="0.8" />
    </svg>
  );
};

// ============================================================================
// 21. Shield / Security Icon
// ============================================================================
export const ShieldIcon: React.FC<IconProps> = ({ size = 24, ...props }) => {
  const iconSet = useIconSet();

  if (iconSet === 'monochrome-outline') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }

  if (iconSet === 'neon-flat') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#7209b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} style={{ filter: 'drop-shadow(0 0 3px #7209b7)', ...props.style }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(114, 9, 183, 0.15)" stroke="#4cc9f0" />
      </svg>
    );
  }

  // macOS 26 (Deep rich dark cobalt blue shield with bright steel edges and a glossy highlights)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <SVGDefFilters />
      <defs>
        <linearGradient id="shieldMetal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00c6ff" />
          <stop offset="100%" stopColor="#0072ff" />
        </linearGradient>
      </defs>
      
      {/* 3D Shield base */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#shieldMetal)" stroke="#0043a8" strokeWidth="1" filter="url(#macOSShadow)" />
      
      {/* Inner secure steel core overlay */}
      <path d="M12 20s6.5-3.2 6.5-8.2V6.2L12 3.8 5.5 6.2v5.6c0 5 6.5 8.2 6.5 8.2z" fill="#ffffff" fillOpacity="0.14" stroke="#ffffff" strokeWidth="0.8" />
    </svg>
  );
};

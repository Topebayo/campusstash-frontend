import React from 'react';

// Handcrafted 3D-styled Vector Category Icons matching ShopMate Template Fidelity
export function FoodIcon({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="burgerBun" x1="10" y1="8" x2="38" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDBA74" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="burgerBottom" x1="12" y1="34" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDBA74" />
          <stop offset="1" stopColor="#C2410C" />
        </linearGradient>
        <linearGradient id="pattyGrad" x1="10" y1="28" x2="38" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#78350F" />
          <stop offset="1" stopColor="#451A03" />
        </linearGradient>
        <linearGradient id="cupGrad" x1="30" y1="6" x2="44" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EF4444" />
          <stop offset="1" stopColor="#B91C1C" />
        </linearGradient>
      </defs>
      {/* Drink Cup behind */}
      <path d="M34 14L32 30C31.9 31.1 32.8 32 33.9 32H40.1C41.2 32 42.1 31.1 42 30L40 14H34Z" fill="url(#cupGrad)" />
      <path d="M33 14H41V11H33V14Z" fill="#FEE2E2" />
      <path d="M38 11L41 3" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      
      {/* Burger Top Bun */}
      <path d="M8 22C8 13.5 14.5 8 23 8C31.5 8 38 13.5 38 22H8Z" fill="url(#burgerBun)" />
      {/* Sesame Seeds */}
      <circle cx="17" cy="14" r="1" fill="#FEF3C7" />
      <circle cx="23" cy="12" r="1.1" fill="#FEF3C7" />
      <circle cx="28" cy="15" r="1" fill="#FEF3C7" />
      <circle cx="21" cy="17" r="1" fill="#FEF3C7" />
      
      {/* Lettuce Wave */}
      <path d="M6 22C7.5 22 8 24 10 24C12 24 12.5 22 14.5 22C16.5 22 17 24 19 24C21 24 21.5 22 23.5 22C25.5 22 26 24 28 24C30 24 30.5 22 32.5 22C34.5 22 35 24 37 24C38.5 24 39 22 40 22V25C39 25 38.5 27 37 27C35 27 34.5 25 32.5 25C30.5 25 30 27 28 27C26 27 25.5 25 23.5 25C21.5 25 21 27 19 27C17 27 16.5 25 14.5 25C12.5 25 12 27 10 27C8 27 7.5 25 6 25V22Z" fill="#22C55E" />
      
      {/* Cheese Slice Corner */}
      <path d="M12 26L22 32L32 26" fill="#FACC15" />
      
      {/* Patty */}
      <rect x="8" y="28" width="30" height="6" rx="3" fill="url(#pattyGrad)" />
      
      {/* Bottom Bun */}
      <path d="M10 34C10 34 10 40 16 40H30C36 40 36 34 36 34H10Z" fill="url(#burgerBottom)" />
    </svg>
  );
}

export function BooksIcon({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bookBlue" x1="6" y1="26" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="bookEmerald" x1="10" y1="18" x2="42" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="bookOrange" x1="14" y1="8" x2="44" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" />
          <stop offset="1" stopColor="#C2410C" />
        </linearGradient>
      </defs>
      {/* Bottom Book (Blue) */}
      <rect x="8" y="32" width="32" height="9" rx="3" fill="url(#bookBlue)" />
      <rect x="12" y="34" width="27" height="5" rx="1.5" fill="#F8FAFC" />
      <path d="M8 32H13V41H8C6.9 41 6 40.1 6 39V34C6 32.9 6.9 32 8 32Z" fill="#1E40AF" />
      
      {/* Middle Book (Emerald) */}
      <rect x="11" y="21" width="30" height="8.5" rx="3" fill="url(#bookEmerald)" />
      <rect x="15" y="23" width="25" height="4.5" rx="1.5" fill="#F8FAFC" />
      <path d="M11 21H16V29.5H11C9.9 29.5 9 28.6 9 27.5V23C9 21.9 9.9 21 11 21Z" fill="#065F46" />
      
      {/* Top Book (Orange with Bookmark) */}
      <rect x="14" y="10" width="26" height="8.5" rx="3" fill="url(#bookOrange)" />
      <rect x="18" y="12" width="21" height="4.5" rx="1.5" fill="#F8FAFC" />
      <path d="M14 10H19V18.5H14C12.9 18.5 12 17.6 12 16.5V12C12 10.9 12.9 10 14 10Z" fill="#9A3412" />
      {/* Bookmark Ribbon */}
      <path d="M26 10V18L29 16L32 18V10H26Z" fill="#FBBF24" />
    </svg>
  );
}

export function TechIcon({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="phoneBody" x1="12" y1="8" x2="32" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E293B" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="phoneScreen" x1="14" y1="11" x2="30" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="earbudsGrad" x1="28" y1="22" x2="44" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8FAFC" />
          <stop offset="1" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>
      {/* Modern Smartphone */}
      <rect x="10" y="8" width="22" height="34" rx="5" fill="url(#phoneBody)" stroke="#475569" strokeWidth="1.5" />
      <rect x="12" y="11" width="18" height="28" rx="3.5" fill="url(#phoneScreen)" />
      <circle cx="21" cy="13" r="1" fill="#0F172A" />
      {/* Screen Graphic lines */}
      <rect x="15" y="24" width="12" height="2" rx="1" fill="#FFFFFF" opacity="0.8" />
      <rect x="15" y="28" width="8" height="2" rx="1" fill="#FFFFFF" opacity="0.6" />
      <circle cx="21" cy="19" r="3.5" fill="#FFFFFF" opacity="0.9" />

      {/* Wireless Pod Case */}
      <rect x="26" y="26" width="16" height="14" rx="4" fill="url(#earbudsGrad)" stroke="#CBD5E1" strokeWidth="1" />
      <circle cx="34" cy="31" r="1.5" fill="#10B981" />
      <path d="M26 31H42" stroke="#94A3B8" strokeWidth="0.8" />
    </svg>
  );
}

export function FashionIcon({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bagOrange" x1="8" y1="16" x2="30" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB923C" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="bagYellow" x1="22" y1="14" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="1" stopColor="#CA8A04" />
        </linearGradient>
      </defs>
      {/* Back Bag (Yellow/Gold) */}
      <path d="M22 18L24 38C24.1 39.1 25 40 26.1 40H39.9C41 40 41.9 39.1 42 38L44 18H22Z" fill="url(#bagYellow)" />
      <path d="M29 18V13C29 10.8 30.8 9 33 9C35.2 9 37 10.8 37 13V18" stroke="#A16207" strokeWidth="2.2" strokeLinecap="round" />

      {/* Front Bag (Vibrant Orange) */}
      <path d="M8 20L10 40C10.1 41.1 11 42 12.1 42H27.9C29 42 29.9 41.1 30 40L32 20H8Z" fill="url(#bagOrange)" />
      <path d="M15 20V14C15 11.8 16.8 10 19 10C21.2 10 23 11.8 23 14V20" stroke="#9A3412" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Decorative Brand Star on Bag */}
      <path d="M20 28L21.2 31.5L25 31.5L22 33.7L23.2 37L20 34.8L16.8 37L18 33.7L15 31.5L18.8 31.5L20 28Z" fill="#FFF7ED" opacity="0.9" />
    </svg>
  );
}

export function DormIcon({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lampShade" x1="12" y1="8" x2="30" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
        <linearGradient id="lampBase" x1="10" y1="36" x2="32" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#475569" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>
      </defs>
      {/* Cozy Lamp Shade */}
      <path d="M12 22L17 10H27L32 22H12Z" fill="url(#lampShade)" />
      {/* Light Glow */}
      <path d="M14 22L8 34H36L30 22H14Z" fill="#FEF08A" opacity="0.35" />
      {/* Lamp Stem */}
      <path d="M22 10V6C22 4.9 22.9 4 24 4C25.1 4 26 4.9 26 6V10" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 22V38" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
      {/* Lamp Base */}
      <rect x="14" y="38" width="16" height="4" rx="2" fill="url(#lampBase)" />

      {/* Cozy Ceramic Mug beside lamp */}
      <rect x="32" y="32" width="9" height="10" rx="2.5" fill="#F43F5E" />
      <path d="M41 34C42.7 34 44 35.3 44 37C44 38.7 42.7 40 41 40" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" />
      <path d="M35 29C35 27 36 26 36 24" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function StoresIcon({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="roofStripe1" x1="8" y1="10" x2="40" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="wallGrad" x1="10" y1="22" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8FAFC" />
          <stop offset="1" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>
      {/* Store Building Body */}
      <rect x="9" y="22" width="30" height="19" rx="3" fill="url(#wallGrad)" stroke="#CBD5E1" strokeWidth="1" />
      {/* Glass Door & Window */}
      <rect x="13" y="27" width="9" height="14" rx="1.5" fill="#38BDF8" opacity="0.3" stroke="#0284C7" strokeWidth="1" />
      <rect x="26" y="27" width="9" height="8" rx="1.5" fill="#FCD34D" opacity="0.3" stroke="#D97706" strokeWidth="1" />
      {/* Awning / Roof Overhang */}
      <path d="M6 22L9 11H39L42 22H6Z" fill="url(#roofStripe1)" />
      {/* Awning Stripes */}
      <path d="M12 11L11 22M18 11L17 22M24 11L24 22M30 11L31 22M36 11L37 22" stroke="#FFFFFF" strokeWidth="2.5" />
      {/* Scalloped edge */}
      <path d="M6 22C7.5 24 9.5 24 11 22C12.5 24 14.5 24 16 22C17.5 24 19.5 24 21 22C22.5 24 24.5 24 26 22C27.5 24 29.5 24 31 22C32.5 24 34.5 24 36 22C37.5 24 39.5 24 41 22" stroke="#047857" strokeWidth="1.5" fill="none" />
    </svg>
  );
}


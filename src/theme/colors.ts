/**
 * Paleta "Pauta" — oscuro cinematográfico.
 * Coincide 1:1 con el mockup aprobado (canvas de diseño).
 */
export const colors = {
  // Fondos
  bg: '#0C0C0E',
  bgElevated: '#17171B',
  bgElevated2: '#202024',

  // Bordes
  border: '#28282E',
  borderSubtle: '#232328',

  // Texto
  textPrimary: '#F3F2EE',
  textSecondary: '#9B9AA3',
  textTertiary: '#59585F',

  // Marca
  accent: '#E7A94C',
  accentText: '#1A1408', // texto sobre superficies de acento

  // Funcional (no cambia con el acento de marca)
  record: '#FF4438',

  // Overlays
  overlayDim: 'rgba(0,0,0,0.55)',
  overlayGlass: 'rgba(0,0,0,0.3)',
  overlayTeleprompter: 'rgba(8,8,10,0.18)',
} as const;

export const accentOptions = ['#E7A94C', '#FF4438', '#5B8DEF', '#6FCF97'] as const;

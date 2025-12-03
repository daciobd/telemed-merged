export const env = {
  TELEMED_BASE: import.meta.env.VITE_TELEMED_BASE_URL || window.location.origin,
  MDA_BASE: import.meta.env.VITE_MDA_BASE_URL || (window as any).MDA_BASE_URL || '',
  RC_BASE: import.meta.env.VITE_RC_BASE_URL || (window as any).RC_BASE_URL || '',
};
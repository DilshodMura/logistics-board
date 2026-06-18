// src/constants/statusThemes.js

export const STATUS_THEMES = {
  RESERVED: { bg: 'bg-sky-50 text-sky-700 border-sky-100', dot: 'bg-sky-400' },
  'HOLD FOR LOAD': { bg: 'bg-teal-50 text-teal-700 border-teal-100', dot: 'bg-teal-400' },
  READY: { bg: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-400' },
  ENROUTE: { bg: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-400' },
  HOME: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-400' },
  SHOP: { bg: 'bg-purple-50 text-purple-700 border-purple-100', dot: 'bg-purple-400' },
  STOP: { bg: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-400' },
  DEFAULT: { bg: 'bg-slate-50 text-slate-600 border-slate-100', dot: 'bg-slate-400' }
};

export const getStatusTheme = (status) => {
  if (!status) return STATUS_THEMES.DEFAULT;
  return STATUS_THEMES[status.toUpperCase()] || STATUS_THEMES.DEFAULT;
};
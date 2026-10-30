export const TARGET = 95; // FTR target (%)
export const ftr = (good, insp) => (insp > 0 ? Math.round((good / insp) * 10000) / 100 : 0);
export const ftrColor = (p) => (p >= TARGET ? '#16a34a' : p >= TARGET - 5 ? '#eab308' : '#dc2626');
export const n = (v) => Number(v) || 0;
export const fmt = (v) => n(v).toLocaleString('en-US');

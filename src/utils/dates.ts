import { DAYS } from '../constants/data';

export function todayStr(): string {
  return new Date().toLocaleDateString('en-GB');
}

export function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

export function parseDMY(s: string): { d: number; m: number; y: number } | null {
  const p = s.split('/');
  return p.length === 3 ? { d: +p[0], m: +p[1] - 1, y: +p[2] } : null;
}

export function toInputDate(dmy: string): string {
  const p = dmy.split('/');
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : '';
}

export function todayDay(): string {
  const d = new Date().getDay();
  return DAYS[d === 0 ? 6 : d - 1];
}

export function fmtISO(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const ms = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${+d} ${ms[+m - 1]} ${y}`;
}

export function daysBetween(d1: string, d2: string): number {
  return Math.round((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dateToISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dateToDMY(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

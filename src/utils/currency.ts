// PKR formatters.
// Both functions preserve the sign so callers can show negative balances directly.
// Pass `Math.abs(n)` if you need an unsigned display.

export function pkr(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 100000) return sign + 'Rs ' + (abs / 100000).toFixed(1) + 'L';
  if (abs >= 1000) return sign + 'Rs ' + (abs / 1000).toFixed(1) + 'K';
  return sign + 'Rs ' + Math.round(abs);
}

export function pkrF(n: number): string {
  const sign = n < 0 ? '-' : '';
  return sign + 'Rs ' + Math.round(Math.abs(n)).toLocaleString('en-PK');
}

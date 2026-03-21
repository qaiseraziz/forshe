export function pkr(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100000) return 'Rs ' + (abs / 100000).toFixed(1) + 'L';
  if (abs >= 1000) return 'Rs ' + (abs / 1000).toFixed(1) + 'K';
  return 'Rs ' + Math.round(abs);
}

export function pkrF(n: number): string {
  return 'Rs ' + Math.round(Math.abs(n)).toLocaleString('en-PK');
}

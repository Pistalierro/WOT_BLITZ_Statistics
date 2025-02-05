export function sanitizeUrl(url: string | undefined): string {
  return url ? url.replace(/^http:/, 'https:') : 'assets/default-tank.png';
}

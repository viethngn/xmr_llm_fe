export const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) return `${API_BASE}/${path}`;
  return `${API_BASE}${path}`;
}



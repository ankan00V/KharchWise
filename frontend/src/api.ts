const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type RequestOptions = {
  method?: string;
  body?: any;
  token?: string | null;
  isFormData?: boolean;
};

export async function api<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, isFormData = false } = options;
  
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Token expired or invalid — clear storage and redirect
    localStorage.removeItem('kw_token');
    localStorage.removeItem('kw_user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

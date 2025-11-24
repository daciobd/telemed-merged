export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('consultorio_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

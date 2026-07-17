// El cliente HTTP que incluye el token automáticamente

import { API_BASE_URL } from '@/lib/api'

type RequestOptions = RequestInit & {
  token?: string
}

export async function apiCall<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  const { token, ...fetchOptions } = options || {}
  
  const url = `${API_BASE_URL}${endpoint}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      console.error('Unauthorized')
    }
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json() as Promise<T>
}
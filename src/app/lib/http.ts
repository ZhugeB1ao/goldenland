import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

export type ApiErrorResponse = {
  error?: string
}

export function getServerBaseURL(): string {
  return (
    process.env.NEXT_PUBLIC_SERVER_URL ??
    process.env.PAYLOAD_PUBLIC_SERVER_URL ??
    'http://localhost:3000'
  )
}

export function resolveRequestURL(url: string): string {
  if (/^https?:\/\//.test(url)) {
    return url
  }

  // Axios in Node requires absolute URLs.
  if (typeof window === 'undefined') {
    return `${getServerBaseURL()}${url}`
  }

  return url
}

export async function getJSON<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await axios.get<T>(resolveRequestURL(url), config)

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data as ApiErrorResponse | undefined
      const errorMessage = payload?.error ?? error.message

      throw new Error(errorMessage)
    }

    throw error
  }
}

export async function postJSON<TResponse, TBody = unknown>(
  url: string,
  data?: TBody,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  try {
    const response = await axios.post<TResponse>(resolveRequestURL(url), data, config)

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data as ApiErrorResponse | undefined
      const errorMessage = payload?.error ?? error.message

      throw new Error(errorMessage)
    }

    throw error
  }
}

export async function deleteJSON<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await axios.delete<T>(resolveRequestURL(url), config)

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data as ApiErrorResponse | undefined
      const errorMessage = payload?.error ?? error.message

      throw new Error(errorMessage)
    }

    throw error
  }
}
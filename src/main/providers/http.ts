import { net } from 'electron'
import type { ErrorCode, ErrorDetails } from '@shared/types'

/**
 * "Friendly" error to show in the UI instead of a stack trace.
 * The message is in English (the default language) and the code lets the
 * renderer translate it into the language chosen by the user.
 */
export class ProviderError extends Error {
  readonly code: ErrorCode
  readonly details?: ErrorDetails

  constructor(message: string, code: ErrorCode = 'unknown', details?: ErrorDetails) {
    super(message)
    this.name = 'ProviderError'
    this.code = code
    this.details = details
  }
}

export interface FetchJsonOptions {
  timeoutMs?: number
  headers?: Record<string, string>
}

/**
 * GET JSON with timeout and readable error messages.
 * Uses Electron's `net.fetch` (respects proxy and system policies).
 */
export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { timeoutMs = 15_000, headers = {} } = options
  let response: Response
  try {
    response = await net.fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BacklogWars/1.0 (Electron)',
        ...headers
      },
      signal: AbortSignal.timeout(timeoutMs)
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new ProviderError(`Service unreachable (${reason}).`, 'network', { reason })
  }

  if (response.status === 401 || response.status === 403) {
    throw new ProviderError('The service denied access (401/403).', 'auth')
  }
  if (response.status === 429) {
    throw new ProviderError('Too many requests (429).', 'rateLimit')
  }
  if (!response.ok) {
    throw new ProviderError(`The service replied with error ${response.status}.`, 'http', { status: response.status })
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new ProviderError('Unreadable response from the service (invalid JSON).', 'parse')
  }
}

/** POST JSON (used by HowLongToBeat, which requires a token in the header). */
export async function postJson<T>(url: string, body: unknown, options: FetchJsonOptions = {}): Promise<T> {
  const { timeoutMs = 15_000, headers = {} } = options
  let response: Response
  try {
    response = await net.fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'BacklogWars/1.0 (Electron)',
        ...headers
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs)
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new ProviderError(`Service unreachable (${reason}).`, 'network', { reason })
  }

  if (response.status === 403 || response.status === 401) {
    throw new ProviderError('Search token rejected by the service (403).', 'forbidden')
  }
  if (response.status === 429) {
    throw new ProviderError('Too many requests (429).', 'rateLimit')
  }
  if (!response.ok) {
    throw new ProviderError(`The service replied with error ${response.status}.`, 'http', { status: response.status })
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new ProviderError('Unreadable response from the service (invalid JSON).', 'parse')
  }
}

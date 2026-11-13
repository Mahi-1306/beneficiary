import { ApiError } from '@/api/client'

const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request was invalid. Please check your input and try again.',
  404: 'The requested resource was not found.',
  422: "We couldn't process that document. Please ensure it's a valid Aadhaar, PAN, certificate, or ID document and try again.",
  500: 'Something went wrong on our end. Please try again in a moment.',
}

export function normalizeApiError(err: unknown): string {
  if (err instanceof ApiError) {
    return STATUS_MESSAGES[err.status] ?? `An error occurred (${err.status}). Please try again.`
  }
  if (err instanceof Error) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      return 'Unable to reach the server. Please check your connection.'
    }
    return err.message
  }
  return 'An unexpected error occurred. Please try again.'
}

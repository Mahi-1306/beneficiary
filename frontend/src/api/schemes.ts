import { get } from './client'
import type { GovernmentScheme } from '@/lib/types'

export const schemesApi = {
  list: () => get<GovernmentScheme[]>('/api/schemes'),
}

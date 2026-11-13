import { get, post, put, patch, postFormData } from './client'
import type { GovernmentScheme, SchemeRequest, ImportResult } from '@/lib/types'

export const adminApi = {
  listSchemes: (params?: { active?: boolean; category?: string }) => {
    const qs = new URLSearchParams()
    if (params?.active !== undefined) qs.set('active', String(params.active))
    if (params?.category) qs.set('category', params.category)
    const query = qs.toString()
    return get<GovernmentScheme[]>(`/api/admin/schemes${query ? `?${query}` : ''}`)
  },

  pendingReview: () => get<GovernmentScheme[]>('/api/admin/schemes/pending-review'),

  createScheme: (body: SchemeRequest) =>
    post<GovernmentScheme>('/api/admin/schemes', body),

  updateScheme: (id: number, body: SchemeRequest) =>
    put<GovernmentScheme>(`/api/admin/schemes/${id}`, body),

  activateScheme: (id: number) =>
    patch<GovernmentScheme>(`/api/admin/schemes/${id}/activate`),

  deactivateScheme: (id: number) =>
    patch<GovernmentScheme>(`/api/admin/schemes/${id}/deactivate`),

  verifyScheme: (id: number) =>
    patch<GovernmentScheme>(`/api/admin/schemes/${id}/verify`),

  importSchemes: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return postFormData<ImportResult>('/api/admin/schemes/import', form)
  },
}

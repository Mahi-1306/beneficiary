import { postFormData } from './client'
import type { Document } from '@/lib/types'

export const documentsApi = {
  upload: (workflowId: number, file: File) => {
    const form = new FormData()
    form.append('workflowId', String(workflowId))
    form.append('file', file)
    return postFormData<Document>('/api/documents/upload', form)
  },
}

const KEY = 'dbis_workflow_ids'

export interface WorkflowRecord {
  id: number
  need: string
  status: string
  createdAt: string
}

export function getStoredWorkflows(): WorkflowRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveWorkflow(record: WorkflowRecord) {
  const existing = getStoredWorkflows()
  const idx = existing.findIndex((w) => w.id === record.id)
  if (idx >= 0) {
    existing[idx] = record
  } else {
    existing.unshift(record)
  }
  localStorage.setItem(KEY, JSON.stringify(existing))
}

export function updateWorkflowStatus(id: number, status: string) {
  const existing = getStoredWorkflows()
  const idx = existing.findIndex((w) => w.id === id)
  if (idx >= 0) {
    existing[idx].status = status
    localStorage.setItem(KEY, JSON.stringify(existing))
  }
}

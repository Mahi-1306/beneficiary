import { get, post } from './client'
import type { Workflow, WorkflowDetailsResponse, BeneficiaryProfile, EligibilityResult, DocumentRequirement, ApplicationGuidance } from '@/lib/types'

export const workflowsApi = {
  create: async (need: string): Promise<Workflow> => {
    const workflow = await post<Workflow>('/api/workflows', { need })
    return {
      ...workflow,
      need: workflow.rawNeed ?? workflow.need ?? need,
    }
  },

  get: async (id: number): Promise<Workflow> => {
    const response = await get<WorkflowDetailsResponse>(`/api/workflows/${id}`)
    const workflow = response.workflow ?? {}
    return {
      ...workflow,
      need: workflow.rawNeed ?? workflow.need ?? '',
      recommendedSchemes: response.recommendedSchemes ?? workflow.recommendedSchemes ?? [],
    }
  },

  getProfile: (workflowId: number) =>
    get<BeneficiaryProfile>(`/api/workflows/${workflowId}/profile`),

  evaluateEligibility: (workflowId: number) =>
    post<EligibilityResult>(`/api/workflows/${workflowId}/eligibility/evaluate`),

  selectScheme: (workflowId: number, schemeId: number) =>
    post<{ workflowId: number; schemeId: number; selected: boolean; status: string }>(`/api/workflows/${workflowId}/schemes/${schemeId}/select`),

  getRequirements: (workflowId: number) =>
    get<DocumentRequirement[]>(`/api/workflows/${workflowId}/requirements`),

  getApplication: (workflowId: number) =>
    get<ApplicationGuidance>(`/api/workflows/${workflowId}/application`),
}

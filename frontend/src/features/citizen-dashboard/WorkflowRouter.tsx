import { Routes, Route, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { workflowsApi } from '@/api/workflows'
import { Skeleton } from '@/components/Skeleton'
import RecommendedSchemes from './RecommendedSchemes'
import DocumentUpload from './DocumentUpload'
import ProfileReview from './ProfileReview'
import EligibilityResult from './EligibilityResult'
import ApplicationGuidance from './ApplicationGuidance'

export default function WorkflowRouter() {
  const { workflowId } = useParams<{ workflowId: string }>()
  const id = Number(workflowId)

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowsApi.get(id),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-[var(--muted-foreground)]">Workflow not found. Please start a new search.</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="schemes" element={<RecommendedSchemes workflow={workflow} />} />
      <Route path="documents" element={<DocumentUpload workflow={workflow} />} />
      <Route path="profile" element={<ProfileReview workflow={workflow} />} />
      <Route path="eligibility" element={<EligibilityResult workflow={workflow} />} />
      <Route path="apply" element={<ApplicationGuidance workflow={workflow} />} />
      <Route path="*" element={<RecommendedSchemes workflow={workflow} />} />
    </Routes>
  )
}

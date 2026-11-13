import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PublicLayout from '@/features/landing/PublicLayout'
import LandingPage from '@/features/landing/LandingPage'
import SchemeCatalog from '@/features/scheme-catalog/SchemeCatalog'
import SchemeDetail from '@/features/scheme-catalog/SchemeDetail'
import CitizenLayout from '@/features/citizen-dashboard/CitizenLayout'
import NeedInput from '@/features/citizen-dashboard/NeedInput'
import WorkflowRouter from '@/features/citizen-dashboard/WorkflowRouter'
import WorkflowHistory from '@/features/citizen-dashboard/WorkflowHistory'
import ModeratorLayout from '@/features/moderator/ModeratorLayout'
import ModeratorDashboard from '@/features/moderator/ModeratorDashboard'
import SchemeTable from '@/features/moderator/SchemeTable'
import SchemeEditor from '@/features/moderator/SchemeEditor'
import PendingReview from '@/features/moderator/PendingReview'
import BulkImport from '@/features/moderator/BulkImport'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

// AuthProvider seam — slot in auth context/provider here when auth is implemented
function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public site */}
            <Route element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="schemes" element={<SchemeCatalog />} />
              <Route path="schemes/:id" element={<SchemeDetail />} />
            </Route>

            {/* Citizen dashboard */}
            <Route path="dashboard" element={<CitizenLayout />}>
              <Route index element={<NeedInput />} />
              <Route path="history" element={<WorkflowHistory />} />
              <Route path="workflow/:workflowId/*" element={<WorkflowRouter />} />
            </Route>

            {/* Moderator interface */}
            <Route path="admin" element={<ModeratorLayout />}>
              <Route index element={<ModeratorDashboard />} />
              <Route path="schemes" element={<SchemeTable />} />
              <Route path="schemes/new" element={<SchemeEditor />} />
              <Route path="schemes/:id/edit" element={<SchemeEditor />} />
              <Route path="pending" element={<PendingReview />} />
              <Route path="import" element={<BulkImport />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

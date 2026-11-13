import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'

export function useSchemeStats() {
  const { data: schemes, isLoading, error } = useQuery({
    queryKey: ['admin-schemes'],
    queryFn: () => adminApi.listSchemes(),
  })

  const stats = schemes
    ? {
        total: schemes.length,
        imported: schemes.filter((s) => s.source === 'IMPORTED').length,
        active: schemes.filter((s) => s.active).length,
        verified: schemes.filter((s) => s.verified).length,
      }
    : null

  return { stats, isLoading, error, schemes }
}

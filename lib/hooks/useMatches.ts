import { useQuery } from '@tanstack/react-query'
import { matchesApi, GetMatchesParams } from '../api/matches'

export const useMatches = (params?: GetMatchesParams) => {
  return useQuery({
    queryKey: ['matches', params],
    queryFn: () => matchesApi.getMatches(params),
    refetchInterval: params?.is_live ? 30000 : false,
    staleTime: params?.is_live ? 20000 : 60000,
  })
}

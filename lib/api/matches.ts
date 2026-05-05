import { apiClient } from './axios'
import { Match } from '../types'

export interface GetMatchesParams {
  sport?: string
  is_live?: boolean
  limit?: number
}

export const matchesApi = {
  getMatches: async (params?: GetMatchesParams): Promise<Match[]> => {
    const response = await apiClient.get<Match[]>('/matches', { params })
    return response.data
  },

  getMatchById: async (id: string): Promise<Match> => {
    const response = await apiClient.get<Match>(`/matches/${id}`)
    return response.data
  },
}

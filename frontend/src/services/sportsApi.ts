// frontend/src/services/sportsApi.ts
// Sports data API service using Varzesh3 API (free, no API key required)

import axios from 'axios'

// ===== Varzesh3 API via Vite proxy (to avoid CORS) =====
const VARZESH3_BASE = '/api/varzesh3/v1.0'
const VARZESH3_LIVESCORE = '/api/varzesh3/v2.0/livescore'

// ===== Types matching Varzesh3 API structure =====
interface Varzesh3Team {
  id: number
  name: string
  logo: string
}

interface Varzesh3Goals {
  host: number
  guest: number
}

interface Varzesh3Match {
  id: number
  time: string
  date: string
  status: number // 0=scheduled, 1=upcoming, 3=live, 7=finished
  statusTitle: string
  host: Varzesh3Team
  guest: Varzesh3Team
  goals?: Varzesh3Goals
  isLive: boolean
  liveTime: string
  link: string
  video?: { id: number; link: string }
  startOnUtc?: string
}

interface Varzesh3DateGroup {
  date: string
  matches: Varzesh3Match[]
}

interface Varzesh3League {
  id: number
  title: string
  logo: string
  sport: number // 1=football, 2=futsal, 4=basketball
  dates: Varzesh3DateGroup[]
}

// ===== Transformed types for the frontend =====
export interface LiveMatch {
  id: number
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  minute: number
  league: string
  leagueLogo: string
  status: 'live' | 'upcoming' | 'finished'
  homeIcon: string
  awayIcon: string
  time?: string
  date?: string
}

export interface NewsItem {
  id: number
  title: string
  summary: string
  category: string
  icon: string
  date: string
  views: number
  color: string
  image: string
  source: string
  isLive: boolean
}

export interface LeagueStanding {
  id: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
  position: number
  icon: string
}

// ===== Live Scores Service =====
export const sportsApi = {
  // Get all matches from livescore API and categorize them
  getAllMatches: async () => {
    try {
      const response = await axios.get<Varzesh3League[]>(
        `${VARZESH3_LIVESCORE}/today`,
        { timeout: 10000 }
      )

      if (!response.data || !Array.isArray(response.data)) {
        return { live: [], upcoming: [], finished: [] }
      }

      const live: LiveMatch[] = []
      const upcoming: LiveMatch[] = []
      const finished: LiveMatch[] = []

      // Process all leagues and their matches
      for (const league of response.data) {
        if (!league.dates) continue

        for (const dateGroup of league.dates) {
          if (!dateGroup.matches) continue

          for (const match of dateGroup.matches) {
            const transformed: LiveMatch = {
              id: match.id,
              homeTeam: match.host.name,
              awayTeam: match.guest.name,
              homeScore: match.goals?.host ?? 0,
              awayScore: match.goals?.guest ?? 0,
              minute: match.liveTime ? parseInt(match.liveTime) || 0 : 0,
              league: league.title,
              leagueLogo: league.logo,
              status: 'upcoming', // will be overridden below
              homeIcon: match.host.logo,
              awayIcon: match.guest.logo,
              time: match.time,
              date: match.date,
            }

            // Categorize by status
            if (match.status === 3 || match.isLive) {
              transformed.status = 'live'
              live.push(transformed)
            } else if (match.status === 7) {
              transformed.status = 'finished'
              finished.push(transformed)
            } else {
              // status 0 or 1 = upcoming/scheduled
              transformed.status = 'upcoming'
              upcoming.push(transformed)
            }
          }
        }
      }

      return {
        live: live.slice(0, 8),
        upcoming: upcoming.slice(0, 8),
        finished: finished.slice(0, 8),
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
      return { live: [], upcoming: [], finished: [] }
    }
  },

  // Get live matches
  getLiveMatches: async (): Promise<LiveMatch[]> => {
    const result = await sportsApi.getAllMatches()
    return result.live
  },

  // Get upcoming matches
  getUpcomingMatches: async (): Promise<LiveMatch[]> => {
    const result = await sportsApi.getAllMatches()
    return result.upcoming
  },

  // Get finished matches
  getFinishedMatches: async (): Promise<LiveMatch[]> => {
    const result = await sportsApi.getAllMatches()
    return result.finished
  },

  // Get most visited news from Varzesh3
  getMostVisitedNews: async (): Promise<NewsItem[]> => {
    try {
      const response = await axios.get<Array<{ id: number; title: string; link: string; isLive: boolean; mediaType: number; publishedOn?: string }>>(
        `${VARZESH3_BASE}/news/most-visited`,
        { timeout: 10000 }
      )

      if (!response.data || !Array.isArray(response.data)) return []

      return response.data.slice(0, 12).map((item, index) => ({
        id: item.id,
        title: item.title,
        summary: '',
        category: item.isLive ? 'زنده' : 'خبر',
        icon: item.isLive ? 'mdi:live-tv' : 'mdi:soccer',
        date: item.publishedOn
          ? new Date(item.publishedOn).toLocaleDateString('fa-IR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '۱۴۰۲',
        views: Math.floor(Math.random() * 20000) + 5000,
        color: getRandomGradient(index),
        image: '',
        source: item.link,
        isLive: item.isLive,
      }))
    } catch (error) {
      console.error('Error fetching most visited news:', error)
      return []
    }
  },

  // Get latest news from Varzesh3
  getLatestNews: async (): Promise<NewsItem[]> => {
    try {
      const response = await axios.get<Array<{ id: number; title: string; link: string; isLive: boolean; mediaType: number; publishedOn?: string }>>(
        `${VARZESH3_BASE}/news/latest`,
        { timeout: 10000 }
      )

      if (!response.data || !Array.isArray(response.data)) return []

      return response.data.slice(0, 12).map((item, index) => ({
        id: item.id,
        title: item.title,
        summary: '',
        category: item.isLive ? 'زنده' : 'آخرین اخبار',
        icon: item.isLive ? 'mdi:live-tv' : 'mdi:newspaper',
        date: item.publishedOn
          ? new Date(item.publishedOn).toLocaleDateString('fa-IR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '۱۴۰۲',
        views: Math.floor(Math.random() * 20000) + 5000,
        color: getRandomGradient(index),
        image: '',
        source: item.link,
        isLive: item.isLive,
      }))
    } catch (error) {
      console.error('Error fetching latest news:', error)
      return []
    }
  },

  // Get sports news (combined from most-visited and latest)
  getSportsNews: async (): Promise<NewsItem[]> => {
    try {
      // Fetch both endpoints in parallel
      const [mostVisited, latest] = await Promise.allSettled([
        sportsApi.getMostVisitedNews(),
        sportsApi.getLatestNews(),
      ])

      const news: NewsItem[] = []

      // Add most visited first
      if (mostVisited.status === 'fulfilled' && mostVisited.value.length > 0) {
        news.push(...mostVisited.value.slice(0, 6))
      }

      // Add latest news
      if (latest.status === 'fulfilled' && latest.value.length > 0) {
        news.push(...latest.value.slice(0, 6))
      }

      // Remove duplicates by id
      const seen = new Set<number>()
      const uniqueNews = news.filter(item => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })

      return uniqueNews.slice(0, 12).map((item, index) => ({
        ...item,
        color: getRandomGradient(index),
      }))
    } catch (error) {
      console.error('Error fetching sports news:', error)
      return []
    }
  },

  // ===== Varzesh3 Standing API =====
  // League season IDs:
  // 903038 = ایران, 902037 = انگلیس, 902055 = بوندسلیگا,
  // 902054 = لالیگا, 902038 = سری آ, 902039 = لیگ یک فرانسه

  // Get league standings from Varzesh3 API
  getStandings: async (seasonId: number = 903038): Promise<LeagueStanding[]> => {
    try {
      const response = await axios.get<{
        id: number
        title: string
        teams: Array<{
          rank: number
          id: number
          name: string
          logo: string
          wins: number
          draws: number
          losses: number
          points: number
          goalFor: number
          goalAgainst: number
          goalDifference: number
          played: number
          qualificationColor?: string
        }>
      }>(
        `/api/varzesh3/v2.0/football/leagues/6/seasons/${seasonId}/standing`,
        { timeout: 10000 }
      )

      if (!response.data?.teams || !Array.isArray(response.data.teams)) {
        return []
      }

      return response.data.teams.map((team) => ({
        id: team.id,
        team: team.name,
        played: team.played,
        won: team.wins,
        drawn: team.draws,
        lost: team.losses,
        goalsFor: team.goalFor,
        goalsAgainst: team.goalAgainst,
        points: team.points,
        position: team.rank,
        icon: team.logo,
      }))
    } catch (error) {
      console.error('Error fetching standings:', error)
      return []
    }
  },
}

// Helper to get random gradient for news cards
function getRandomGradient(index: number): string {
  const gradients = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-amber-600',
    'from-purple-500 to-indigo-600',
    'from-cyan-500 to-blue-600',
    'from-red-500 to-rose-600',
    'from-teal-500 to-green-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-purple-600',
    'from-yellow-500 to-orange-600',
    'from-sky-500 to-blue-600',
    'from-lime-500 to-green-600',
  ]
  return gradients[index % gradients.length]
}
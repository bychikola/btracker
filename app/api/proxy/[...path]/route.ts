import { NextRequest, NextResponse } from 'next/server'

const SSTATS_API_BASE = 'https://api.sstats.net'
const API_KEY = process.env.SSTATS_API_KEY || ''

function addAuthHeaders(headers: HeadersInit, apiKey: string): HeadersInit {
  return {
    ...headers,
    'Authorization': `ApiKey ${apiKey}`,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const apiPath = path.join('/')
    const searchParams = request.nextUrl.searchParams

    const url = new URL(`${SSTATS_API_BASE}/${apiPath}`)
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value)
    })

    // Добавляем API ключ как query параметр (fallback) и как заголовок (рекомендуемый)
    url.searchParams.append('apikey', API_KEY)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: addAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }, API_KEY),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch from sstats API' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const apiPath = path.join('/')
    const body = await request.json()

    const url = new URL(`${SSTATS_API_BASE}/${apiPath}`)
    url.searchParams.append('apikey', API_KEY)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: addAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }, API_KEY),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch from sstats API' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

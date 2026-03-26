// Simple in-memory rate limiter (resets on deploy — fine for MVP)
const requests = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(ip: string, limit = 100, windowMs = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = requests.get(ip)

  if (!record || now > record.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  record.count++
  if (record.count > limit) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: limit - record.count }
}

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    requests.forEach((val, key) => {
      if (now > val.resetAt) requests.delete(key)
    })
  }, 300000)
}

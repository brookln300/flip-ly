/**
 * Flip-ly Free Finds — content script.
 *
 * Design principle (see docs/planning/FB-GROUPS-TO-TELEGRAM.md):
 * this runs inside YOUR real, logged-in Facebook session and is HUMAN-TRIGGERED.
 * It reads only the posts your browser has already rendered because you scrolled
 * to them. It does NOT auto-scroll, open background tabs, or run unattended.
 * Click the button → it forwards what's currently on screen. That's the whole design.
 *
 * Behavior is driven by the settings page (chrome.storage.local):
 *   - groups: only enabled groups forward; new groups auto-register (enabled)
 *   - includeKeywords / excludeKeywords: client-side text filters
 *   - freeOnly: only forward posts that look like giveaways
 *   - homeZip / radiusMi: passed to the server for soft distance filtering
 *
 * Facebook's DOM is obfuscated and changes often, so the selectors below are
 * best-effort and are the part you maintain over time. Nothing here tries to
 * defeat bot detection — it's you, reading your own groups.
 */

const BTN_ID = 'flifly-free-finds-btn'
const sentThisPage = new Set() // avoid re-sending the same post on repeated clicks
const FREE_RE = /\b(free|curb alert|giving away|gratis|no charge|free to (a )?good home)\b/i

function getGroupContext() {
  const m = location.pathname.match(/\/groups\/([^/]+)/)
  const groupId = m ? m[1] : ''
  const groupName = (document.title || '').split('|')[0].split('·')[0].trim() || null
  return { groupId, groupName }
}

async function getSettings() {
  const stored = await chrome.storage.local.get(['settings', 'groups'])
  return { settings: stored.settings || {}, groups: stored.groups || {} }
}

/** Register the current group on first visit so it shows up in Settings. */
async function registerGroup() {
  const { groupId, groupName } = getGroupContext()
  if (!groupId) return
  const { groups } = await getSettings()
  if (!groups[groupId]) {
    groups[groupId] = { name: groupName || groupId, enabled: true }
    await chrome.storage.local.set({ groups })
  } else if (groupName && groups[groupId].name !== groupName) {
    groups[groupId].name = groupName
    await chrome.storage.local.set({ groups })
  }
}

function parseKeywords(raw) {
  return String(raw || '')
    .split(/[\n,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function passesFilters(text, settings) {
  const lower = text.toLowerCase()
  if (settings.freeOnly && !FREE_RE.test(text)) return false
  const include = parseKeywords(settings.includeKeywords)
  if (include.length && !include.some((k) => lower.includes(k))) return false
  const exclude = parseKeywords(settings.excludeKeywords)
  if (exclude.length && exclude.some((k) => lower.includes(k))) return false
  return true
}

function extractPost(article) {
  const raw_text = (article.innerText || '').trim()
  if (!raw_text) return null

  let post_url = null
  const anchors = article.querySelectorAll('a[href*="/posts/"], a[href*="/permalink/"], a[href*="story_fbid"]')
  if (anchors.length) {
    try {
      post_url = new URL(anchors[0].getAttribute('href'), location.origin).toString().split('?')[0]
    } catch (_) {}
  }

  let author_name = null
  const authorLink = article.querySelector('a[role="link"] strong, h3 a, h4 a')
  if (authorLink) author_name = authorLink.innerText.trim() || null

  const image_urls = Array.from(article.querySelectorAll('img'))
    .map((img) => img.currentSrc || img.src)
    .filter((src) => src && src.startsWith('http') && !src.includes('emoji'))
    .slice(0, 6)

  return { raw_text, post_url, author_name, image_urls }
}

function collectVisiblePosts(settings) {
  const { groupId, groupName } = getGroupContext()
  const articles = document.querySelectorAll('[role="article"]')
  const posts = []
  let filtered = 0

  articles.forEach((article) => {
    const parsed = extractPost(article)
    if (!parsed) return

    const key = parsed.post_url || parsed.raw_text.slice(0, 120)
    if (sentThisPage.has(key)) return

    if (!passesFilters(parsed.raw_text, settings)) {
      filtered++
      return
    }
    sentThisPage.add(key)

    posts.push({
      group_id: groupId,
      group_name: groupName,
      post_url: parsed.post_url,
      author_name: parsed.author_name,
      raw_text: parsed.raw_text,
      image_urls: parsed.image_urls,
      captured_at: new Date().toISOString(),
      home_zip: /^\d{5}$/.test(settings.homeZip || '') ? settings.homeZip : undefined,
      radius_mi: settings.radiusMi ? Number(settings.radiusMi) : undefined,
    })
  })

  return { posts, filtered }
}

async function sendPosts(btn) {
  const { settings, groups } = await getSettings()

  if (!settings.endpoint || !settings.token) {
    flash(btn, 'Set endpoint + token in Settings', true)
    return
  }

  const { groupId } = getGroupContext()
  if (groupId && groups[groupId] && groups[groupId].enabled === false) {
    flash(btn, 'This group is turned off in Settings', true)
    return
  }

  const { posts, filtered } = collectVisiblePosts(settings)
  if (posts.length === 0) {
    flash(btn, filtered ? `${filtered} filtered, 0 to send` : 'No new posts on screen', true)
    return
  }

  btn.disabled = true
  btn.textContent = `Sending ${posts.length}…`
  try {
    const res = await fetch(settings.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Ingest-Token': settings.token },
      body: JSON.stringify(posts),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) {
      flash(btn, `Sent ${json.accepted ?? posts.length} (${json.duplicates ?? 0} dup)`)
    } else {
      flash(btn, `Error ${res.status}`, true)
    }
  } catch (err) {
    flash(btn, 'Network error', true)
  } finally {
    btn.disabled = false
  }
}

function flash(btn, msg, isError) {
  btn.textContent = msg
  btn.style.background = isError ? '#b00020' : '#128a3a'
  setTimeout(() => {
    btn.textContent = 'Send free finds'
    btn.style.background = '#128a3a'
  }, 2800)
}

function mountButton() {
  if (document.getElementById(BTN_ID)) return
  const btn = document.createElement('button')
  btn.id = BTN_ID
  btn.textContent = 'Send free finds'
  Object.assign(btn.style, {
    position: 'fixed', bottom: '20px', right: '20px', zIndex: '2147483647',
    padding: '10px 16px', background: '#128a3a', color: '#fff', border: 'none',
    borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
  })
  btn.addEventListener('click', () => sendPosts(btn))
  document.body.appendChild(btn)
}

registerGroup()
mountButton()
// Facebook is a SPA; re-mount and re-register as you navigate between groups.
let lastPath = location.pathname
new MutationObserver(() => {
  mountButton()
  if (location.pathname !== lastPath) {
    lastPath = location.pathname
    sentThisPage.clear()
    registerGroup()
  }
}).observe(document.documentElement, { childList: true, subtree: true })

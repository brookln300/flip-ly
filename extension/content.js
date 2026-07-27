/**
 * Flip-ly Free Finds — content script.
 *
 * Design principle (see docs/planning/FB-GROUPS-TO-TELEGRAM.md):
 * this runs inside YOUR real, logged-in Facebook session and is HUMAN-TRIGGERED.
 * It reads only the posts your browser has already rendered because you scrolled
 * to them. It does NOT auto-scroll, open background tabs, or run unattended.
 * Click the button → it forwards what's currently on screen. That's the whole design.
 *
 * Facebook's DOM is obfuscated and changes often, so the selectors below are
 * best-effort and are the part you maintain over time. Nothing here tries to
 * defeat bot detection — it's you, reading your own groups.
 */

const BTN_ID = 'flifly-free-finds-btn'
const sentThisPage = new Set() // avoid re-sending the same post on repeated clicks

function getGroupContext() {
  const m = location.pathname.match(/\/groups\/([^/]+)/)
  const groupId = m ? m[1] : ''
  // Group name: the document title is usually "Group Name | Facebook" or similar.
  const groupName = (document.title || '').split('|')[0].split('·')[0].trim() || null
  return { groupId, groupName }
}

function extractPost(article) {
  const raw_text = (article.innerText || '').trim()
  if (!raw_text) return null

  // Permalink: first anchor pointing at a post/permalink within this article.
  let post_url = null
  const anchors = article.querySelectorAll('a[href*="/posts/"], a[href*="/permalink/"], a[href*="story_fbid"]')
  if (anchors.length) {
    try {
      post_url = new URL(anchors[0].getAttribute('href'), location.origin).toString().split('?')[0]
    } catch (_) {}
  }

  // Author: first meaningful profile link text in the article.
  let author_name = null
  const authorLink = article.querySelector('a[role="link"] strong, h3 a, h4 a')
  if (authorLink) author_name = authorLink.innerText.trim() || null

  // Images: content images (skip avatars/emoji by size when available).
  const image_urls = Array.from(article.querySelectorAll('img'))
    .map((img) => img.currentSrc || img.src)
    .filter((src) => src && src.startsWith('http') && !src.includes('emoji'))
    .slice(0, 6)

  return { raw_text, post_url, author_name, image_urls }
}

function collectVisiblePosts() {
  const { groupId, groupName } = getGroupContext()
  const articles = document.querySelectorAll('[role="article"]')
  const posts = []

  articles.forEach((article) => {
    const parsed = extractPost(article)
    if (!parsed) return
    // Dedupe key for this page session: prefer permalink, fall back to text prefix.
    const key = parsed.post_url || parsed.raw_text.slice(0, 120)
    if (sentThisPage.has(key)) return
    sentThisPage.add(key)

    posts.push({
      group_id: groupId,
      group_name: groupName,
      post_url: parsed.post_url,
      author_name: parsed.author_name,
      raw_text: parsed.raw_text,
      image_urls: parsed.image_urls,
      captured_at: new Date().toISOString(),
    })
  })

  return posts
}

async function sendPosts(btn) {
  const { endpoint, token } = await chrome.storage.local.get(['endpoint', 'token'])
  if (!endpoint || !token) {
    flash(btn, 'Set endpoint + token in the extension popup', true)
    return
  }

  const posts = collectVisiblePosts()
  if (posts.length === 0) {
    flash(btn, 'No new posts on screen', true)
    return
  }

  btn.disabled = true
  btn.textContent = `Sending ${posts.length}…`
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Ingest-Token': token },
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
  }, 2500)
}

function mountButton() {
  if (document.getElementById(BTN_ID)) return
  const btn = document.createElement('button')
  btn.id = BTN_ID
  btn.textContent = 'Send free finds'
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '2147483647',
    padding: '10px 16px',
    background: '#128a3a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
  })
  btn.addEventListener('click', () => sendPosts(btn))
  document.body.appendChild(btn)
}

mountButton()
// Facebook is a SPA; re-mount if it re-renders the body.
new MutationObserver(() => mountButton()).observe(document.documentElement, {
  childList: true,
  subtree: true,
})

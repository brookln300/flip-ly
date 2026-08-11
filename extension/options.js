/**
 * Settings page logic. All settings live in chrome.storage.local under a single
 * `settings` object; the `groups` map is stored alongside so the content script
 * can register newly-visited groups without clobbering other fields.
 */

const DEFAULTS = {
  endpoint: '',
  token: '',
  homeZip: '',
  radiusMi: '',
  includeKeywords: '',
  excludeKeywords: '',
  freeOnly: false,
}

const $ = (id) => document.getElementById(id)
let groups = {} // { [groupId]: { name, enabled } }

function parseGroupId(input) {
  const s = (input || '').trim()
  const m = s.match(/\/groups\/([^/?#]+)/)
  return m ? m[1] : s
}

function renderGroups() {
  const ul = $('groups')
  ul.innerHTML = ''
  const ids = Object.keys(groups)
  if (ids.length === 0) {
    const li = document.createElement('li')
    li.className = 'empty'
    li.textContent = 'No groups yet — open a Facebook group with the extension active and it will appear here.'
    ul.appendChild(li)
    return
  }
  ids.forEach((id) => {
    const g = groups[id]
    const li = document.createElement('li')

    const sw = document.createElement('label')
    sw.className = 'switch'
    const cb = document.createElement('input')
    cb.type = 'checkbox'
    cb.checked = g.enabled !== false
    cb.addEventListener('change', () => { groups[id].enabled = cb.checked })
    const sl = document.createElement('span')
    sl.className = 'slider'
    sw.append(cb, sl)

    const name = document.createElement('div')
    name.className = 'name'
    name.innerHTML = `${escapeHtml(g.name || 'Unnamed group')}<div class="gid">${escapeHtml(id)}</div>`

    const rm = document.createElement('button')
    rm.className = 'remove'
    rm.textContent = 'Remove'
    rm.addEventListener('click', () => { delete groups[id]; renderGroups() })

    li.append(sw, name, rm)
    ul.appendChild(li)
  })
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function load() {
  const stored = await chrome.storage.local.get(['settings', 'groups'])
  const s = { ...DEFAULTS, ...(stored.settings || {}) }
  groups = stored.groups || {}

  $('endpoint').value = s.endpoint
  $('token').value = s.token
  $('homeZip').value = s.homeZip
  $('radiusMi').value = s.radiusMi
  $('includeKeywords').value = s.includeKeywords
  $('excludeKeywords').value = s.excludeKeywords
  $('freeOnly').checked = !!s.freeOnly
  renderGroups()
}

async function save() {
  const settings = {
    endpoint: $('endpoint').value.trim(),
    token: $('token').value.trim(),
    homeZip: $('homeZip').value.trim(),
    radiusMi: $('radiusMi').value.trim(),
    includeKeywords: $('includeKeywords').value.trim(),
    excludeKeywords: $('excludeKeywords').value.trim(),
    freeOnly: $('freeOnly').checked,
  }
  await chrome.storage.local.set({ settings, groups })
  const status = $('status')
  status.textContent = 'Saved.'
  setTimeout(() => (status.textContent = ''), 2000)
}

$('addGroup').addEventListener('click', () => {
  const id = parseGroupId($('newGroupId').value)
  if (!id) return
  const name = $('newGroupName').value.trim() || id
  groups[id] = { name, enabled: true }
  $('newGroupId').value = ''
  $('newGroupName').value = ''
  renderGroups()
})

$('save').addEventListener('click', save)
load()

const dot = document.getElementById('dot')
const statusText = document.getElementById('statusText')

chrome.storage.local.get(['settings', 'groups']).then(({ settings, groups }) => {
  const s = settings || {}
  const configured = !!(s.endpoint && s.token)
  const groupCount = Object.values(groups || {}).filter((g) => g.enabled !== false).length

  dot.className = 'dot ' + (configured ? 'ok' : 'bad')
  statusText.textContent = configured
    ? `Connected · ${groupCount} group${groupCount === 1 ? '' : 's'} enabled`
    : 'Not configured — set endpoint + token'
})

document.getElementById('openSettings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage()
})

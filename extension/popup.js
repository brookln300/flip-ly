const endpointEl = document.getElementById('endpoint')
const tokenEl = document.getElementById('token')
const statusEl = document.getElementById('status')

chrome.storage.local.get(['endpoint', 'token']).then(({ endpoint, token }) => {
  if (endpoint) endpointEl.value = endpoint
  if (token) tokenEl.value = token
})

document.getElementById('save').addEventListener('click', async () => {
  const endpoint = endpointEl.value.trim()
  const token = tokenEl.value.trim()
  if (!endpoint || !token) {
    statusEl.style.color = '#b00020'
    statusEl.textContent = 'Both fields are required.'
    return
  }
  await chrome.storage.local.set({ endpoint, token })
  statusEl.style.color = '#128a3a'
  statusEl.textContent = 'Saved.'
})

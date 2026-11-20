const config = window.GOOODHOWS_CONFIG
const state = { articles: [], period: 'recent', metric: 'views' }

async function publishedArticles() {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/website_articles?select=post_id,slug,title,body,image_url,category,tags,original_permalink,threads_published_at,views,likes,metrics_updated_at,featured,published_at&visible=eq.true&order=threads_published_at.desc&limit=200`, {
    headers: { apikey: config.publishableKey }
  })
  if (!response.ok) throw new Error('目前無法讀取文章')
  return response.json()
}

function date(value) {
  return value ? new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : ''
}

function storyCard(article) {
  const link = document.createElement('a')
  link.className = 'story-card'
  link.href = `article.html?slug=${encodeURIComponent(article.slug)}`
  const image = document.createElement('div')
  image.className = 'story-card-image'
  if (article.image_url) {
    const img = document.createElement('img')
    img.src = article.image_url
    img.alt = ''
    img.loading = 'lazy'
    image.append(img)
  } else image.textContent = '⌂'
  const meta = document.createElement('span')
  meta.textContent = `${article.category} · ${date(article.threads_published_at)}`
  const title = document.createElement('strong')
  title.textContent = article.title
  const arrow = document.createElement('span')
  arrow.textContent = '讀這篇 ↗'
  link.append(image, meta, title, arrow)
  return link
}

function renderFeatured() {
  const root = document.querySelector('#featured-stories')
  const picked = state.articles.filter((article) => article.featured).slice(0, 3)
  if (!picked.length) return
  root.className = 'featured-grid'
  root.replaceChildren(...picked.map(storyCard))
}

function renderRanking() {
  const root = document.querySelector('#ranking-list')
  const cutoff = Date.now() - 30 * 86400000
  const rows = state.articles
    .filter((article) => state.period === 'all' || (article.threads_published_at && Date.parse(article.threads_published_at) >= cutoff))
    .filter((article) => article[state.metric] != null)
    .sort((a, b) => b[state.metric] - a[state.metric])
    .slice(0, 5)
  if (!rows.length) {
    root.className = 'ranking-empty'
    root.replaceChildren()
    const message = document.createElement('p')
    message.textContent = '這個榜單目前沒有已發布的文章與數據'
    root.append(message)
    return
  }
  root.className = 'ranking-rows'
  root.replaceChildren(...rows.map((article, index) => {
    const link = document.createElement('a')
    link.href = `article.html?slug=${encodeURIComponent(article.slug)}`
    const no = document.createElement('b')
    no.textContent = String(index + 1).padStart(2, '0')
    const title = document.createElement('span')
    title.textContent = article.title
    const count = document.createElement('strong')
    count.textContent = new Intl.NumberFormat('zh-TW').format(article[state.metric])
    const updated = document.createElement('small')
    updated.textContent = `更新 ${date(article.metrics_updated_at)}`
    link.append(no, title, count, updated)
    return link
  }))
}

document.querySelectorAll('.segmented button').forEach((button) => {
  button.addEventListener('click', () => {
    const group = button.dataset.group
    state[group] = button.dataset.value
    document.querySelectorAll(`.segmented button[data-group="${group}"]`).forEach((item) => {
      const selected = item === button
      item.classList.toggle('active', selected)
      item.setAttribute('aria-pressed', String(selected))
    })
    renderRanking()
  })
})

publishedArticles().then((articles) => {
  state.articles = articles
  renderFeatured()
  renderRanking()
}).catch(() => {
  document.querySelector('#ranking-list').textContent = '目前無法讀取排行，請稍後再試'
})

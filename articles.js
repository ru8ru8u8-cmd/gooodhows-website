const cfg = window.GOOODHOWS_CONFIG
const params = new URLSearchParams(location.search)
const category = params.get('category')
const slug = params.get('slug')
const formatDate = value => value ? new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',year:'numeric',month:'long',day:'numeric'}).format(new Date(value)) : ''

async function readArticles() {
  const query = new URLSearchParams({select:'post_id,slug,title,body,image_url,category,tags,original_permalink,threads_published_at,views,likes,metrics_updated_at',visible:'eq.true',order:'threads_published_at.desc'})
  if (slug) query.set('slug',`eq.${slug}`)
  if (category && ['房子與人','都更現場','都更白話說','產業觀察'].includes(category)) query.set('category',`eq.${category}`)
  const response = await fetch(`${cfg.supabaseUrl}/rest/v1/website_articles?${query}`,{headers:{apikey:cfg.publishableKey}})
  if (!response.ok) throw new Error('讀取失敗')
  return response.json()
}

function element(tag,text,className) { const el=document.createElement(tag); el.textContent=text; if(className) el.className=className; return el }

function renderList(items) {
  const root=document.querySelector('#article-list')
  if (!items.length) { root.textContent='這裡的故事正在整理中，晚點再來逛逛'; return }
  root.replaceChildren(...items.map(a=>{
    const link=document.createElement('a');link.className='article-tile';link.href=`article.html?slug=${encodeURIComponent(a.slug)}`
    const cover=element('div',a.image_url?'':'⌂','article-tile-cover')
    if(a.image_url){const image=document.createElement('img');image.src=a.image_url;image.alt='';image.loading='lazy';cover.append(image)}
    link.append(cover,element('small',`${a.category} · ${formatDate(a.threads_published_at)}`),element('strong',a.title),element('span','讀故事 ↗'))
    return link
  }))
}

function renderArticle(a) {
  const root=document.querySelector('#article-content')
  if(!a){root.replaceChildren(element('h1','找不到這篇故事'));return}
  document.title=`${a.title}｜更好拾光`
  const header=document.createElement('div');header.className='article-title'
  header.append(element('span',`${a.category} · ${formatDate(a.threads_published_at)}`,'section-index'),element('h1',a.title))
  const body=document.createElement('div');body.className='article-body article-prose';StoryBlocks.render(StoryBlocks.parse(a.body),body)
  root.replaceChildren(header)
  if(a.image_url){const img=document.createElement('img');img.src=a.image_url;img.alt='文章封面';img.className='article-cover';root.append(img)}
  root.append(body)
  const stats=document.createElement('div');stats.className='article-stats'
  const number=n=>n==null?'尚無數據':new Intl.NumberFormat('zh-TW').format(n)
  stats.append(element('span',`瀏覽 ${number(a.views)}`),element('span',`愛心 ${number(a.likes)}`),element('small',`數據更新 ${formatDate(a.metrics_updated_at) || '尚未同步'}`))
  root.append(stats)
  if(a.original_permalink){const original=document.createElement('a');original.href=a.original_permalink;original.target='_blank';original.rel='noopener noreferrer';original.className='text-link';original.textContent='前往 Threads 原貼文 ↗';root.append(original)}
  const share=document.createElement('button');share.type='button';share.className='share-button';share.textContent='分享這篇故事 ↗'
  share.addEventListener('click',async()=>{if(navigator.share){try{await navigator.share({title:a.title,url:location.href})}catch{}}else{await navigator.clipboard.writeText(location.href);share.textContent='連結已複製'}})
  root.append(share)
}

readArticles().then(items=>slug?renderArticle(items[0]):renderList(items)).catch(()=>{const root=document.querySelector('#article-content')||document.querySelector('#article-list');root.textContent='目前無法讀取文章，請稍後再試'})

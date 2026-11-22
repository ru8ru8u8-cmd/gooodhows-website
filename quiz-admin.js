const cfg = window.GOOODHOWS_CONFIG
const db = window.supabase.createClient(cfg.supabaseUrl, cfg.publishableKey)
const editor = document.querySelector('#quiz-editor')
const message = document.querySelector('#quiz-admin-message')
let questions = []
let posts = []

function notice(text) { message.textContent = text }
function field(name) { return editor.elements.namedItem(name) }
function reset() {
  editor.reset()
  field('id').value = ''
  field('axis').value = '0'
  editor.querySelector('h2').textContent = '新增情境題'
}
function openQuestion(q) {
  reset()
  field('id').value = q.id
  field('scene').value = q.scene
  field('title').value = q.title
  field('context').value = q.context
  field('axis').value = q.axis
  field('option_a').value = q.options[0]
  field('option_b').value = q.options[1]
  field('source_url').value = q.source_url || ''
  field('active').checked = q.active
  field('source').value = posts.find(p => p.original_permalink === q.source_url)?.post_id || ''
  editor.querySelector('h2').textContent = '編輯情境題'
}
async function load() {
  const { data: session } = await db.auth.getSession()
  if (!session.session) {
    document.querySelector('#quiz-login').hidden = false
    notice('請先登入文章管理後台')
    return
  }
  const { data: allowed, error: authError } = await db.rpc('website_is_admin')
  if (authError || !allowed) { notice('這個帳號尚未被授權為網站管理員'); return }
  document.querySelector('#quiz-dashboard').hidden = false
  const [{ data: questionRows, error }, { data: draftRows, error: postsError }] = await Promise.all([
    db.from('website_quiz_questions').select('*').order('sort_order').order('id'),
    db.from('website_drafts').select('post_id,title,original_text,original_permalink,threads_published_at').order('threads_published_at', { ascending: false }).limit(200)
  ])
  if (error || postsError) { notice('讀取題庫或 Threads 貼文失敗'); return }
  questions = questionRows
  posts = draftRows
  const select = field('source')
  select.replaceChildren(new Option('自行撰寫，暫不連結貼文', ''), ...posts.map(post =>
    new Option((post.title || post.original_text || '無文字貼文').slice(0, 65), post.post_id)))
  const list = document.querySelector('#question-list')
  list.replaceChildren(...questions.map(q => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'draft-item'
    const status = document.createElement('small')
    status.textContent = `${q.active ? '已公開' : '草稿'} · ${['時間', '價值', '主導', '步調'][q.axis]}`
    const title = document.createElement('strong')
    title.textContent = q.title
    button.append(status, title)
    button.addEventListener('click', () => openQuestion(q))
    return button
  }))
  notice(`目前 ${questions.filter(q => q.active).length} 題公開 · ${posts.length} 篇 Threads 素材可選`)
}

field('source').addEventListener('change', () => {
  const post = posts.find(item => item.post_id === field('source').value)
  if (post) field('source_url').value = post.original_permalink || ''
})
document.querySelector('#new-question').addEventListener('click', reset)
editor.addEventListener('submit', async event => {
  event.preventDefault()
  if (!editor.reportValidity()) return
  const axis = Number(field('axis').value)
  const isActive = field('active').checked
  const existing = questions.find(q => String(q.id) === field('id').value)
  if (isActive && !existing?.active && questions.filter(q => q.active && q.axis === axis).length >= 30) {
    notice('每個性格軸最多公開 30 題，請先將舊題改為草稿')
    return
  }
  const payload = {
    scene: field('scene').value.trim(), title: field('title').value.trim(),
    context: field('context').value.trim(), axis,
    options: [field('option_a').value.trim(), field('option_b').value.trim()],
    source_url: field('source_url').value.trim() || null, active: isActive,
    sort_order: existing?.sort_order ?? questions.length + 1,
    updated_at: new Date().toISOString()
  }
  if (!payload.options.every(Boolean)) { notice('A、B 選項都要填寫'); return }
  const query = field('id').value
    ? db.from('website_quiz_questions').update(payload).eq('id', field('id').value)
    : db.from('website_quiz_questions').insert(payload)
  const { error } = await query
  if (error) { notice(`儲存失敗：${error.message}`); return }
  reset()
  await load()
  notice('題目已儲存；公開題會出現在下一次開始的測驗')
})
reset()
load()

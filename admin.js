const cfg=window.GOOODHOWS_CONFIG
const db=window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey)
const message=document.querySelector('#admin-message')
const loginPanel=document.querySelector('#login-panel')
const dashboard=document.querySelector('#dashboard')
const editor=document.querySelector('#editor-form')
let drafts=[],publications=new Map(),selected=null
let blocks=[]
const categories=['房子與人','都更現場','都更白話說','產業觀察']

const blockNames={paragraph:'段落',heading:'小標題',quote:'引言',image:'圖片',divider:'分隔線'}
function syncBlocks(){
  field('body').value=StoryBlocks.serialize(blocks)
  StoryBlocks.render(blocks,document.querySelector('#story-preview-body'))
}
function renderBlockEditor(focusIndex=-1){
  const list=document.querySelector('#story-block-list');list.replaceChildren()
  blocks.forEach((block,index)=>{
    const card=document.createElement('section');card.className='editor-block'
    const header=document.createElement('div');header.className='editor-block-toolbar'
    const label=document.createElement('strong');label.textContent=`${String(index+1).padStart(2,'0')} · ${blockNames[block.type]}`
    const controls=document.createElement('div')
    for(const [name,icon,disabled,handler] of [
      ['上移','↑',index===0,()=>{[blocks[index-1],blocks[index]]=[blocks[index],blocks[index-1]];renderBlockEditor(index-1)}],
      ['下移','↓',index===blocks.length-1,()=>{[blocks[index+1],blocks[index]]=[blocks[index],blocks[index+1]];renderBlockEditor(index+1)}],
      ['刪除','×',false,()=>{blocks.splice(index,1);renderBlockEditor()}]
    ]){const button=document.createElement('button');button.type='button';button.textContent=icon;button.title=name;button.setAttribute('aria-label',`${name}${blockNames[block.type]}`);button.disabled=disabled;button.addEventListener('click',handler);controls.append(button)}
    header.append(label,controls);card.append(header)
    const input=(key,tag,placeholder)=>{const el=document.createElement(tag);el.value=block[key]||'';el.placeholder=placeholder;el.setAttribute('aria-label',`${blockNames[block.type]}${key==='caption'?'說明':''}`);el.addEventListener('input',()=>{block[key]=el.value;syncBlocks()});card.append(el);return el}
    if(block.type==='image'){input('url','input','https:// 圖片網址').type='url';input('caption','input','圖片說明（選填）')}
    else if(block.type==='divider'){const line=document.createElement('hr');card.append(line)}
    else input('text',block.type==='paragraph'?'textarea':'input',({paragraph:'寫下這段故事…',heading:'這一段的小標題',quote:'值得停下來讀的一句話'})[block.type])
    list.append(card)
  })
  syncBlocks()
  if(focusIndex>=0)list.children[focusIndex]?.querySelector('textarea,input')?.focus()
}
document.querySelectorAll('[data-add-block]').forEach(button=>button.addEventListener('click',()=>{
  blocks.push({type:button.dataset.addBlock,text:'',url:'',caption:''});renderBlockEditor(blocks.length-1)
}))

function suggestCategory(text=''){
  for(const rule of window.GOOODHOWS_EDITORIAL_RULES?.categories||[])if(rule.pattern.test(text))return rule.name
  return '房子與人'
}

function researchSummary(draft){
  const text=draft.original_text||''
  const matches=(window.GOOODHOWS_EDITORIAL_RULES?.quizAxes||[]).filter(rule=>rule.pattern.test(text))
  return `建議分類：${suggestCategory(text)}｜可能相關測驗面向：${matches.length?matches.map(rule=>`${rule.axis} ${rule.theme}`).join('、'):'尚無明確對應'}。這只是關鍵字提示，題目仍須另行審稿。`
}

document.querySelector('#apply-research').addEventListener('click',()=>{
  if(!selected?.original_text?.trim()){show('這篇貼文沒有可帶入的原文');return}
  if((field('title').value.trim()||blocks.some(block=>block.text?.trim()))&&!window.confirm('帶入原文會取代目前未儲存的標題與內文，確定繼續？'))return
  const text=selected.original_text.trim()
  const first=text.split(/[\n。！？!?]/).map(line=>line.trim()).find(Boolean)||''
  field('title').value=first.slice(0,60)
  field('category').value=suggestCategory(text)
  blocks=StoryBlocks.parse(text);renderBlockEditor()
  show('已帶入原文與研究分類，請編輯並確認後儲存；尚未發布')
})

function show(text){message.textContent=text}
function field(name){return editor.elements.namedItem(name)}

async function load(){
  const {data:session}=await db.auth.getSession()
  if(!session.session){loginPanel.hidden=false;dashboard.hidden=true;return}
  const {data:allowed,error:roleError}=await db.rpc('website_is_admin')
  if(roleError||!allowed){await db.auth.signOut();show('這個帳號尚未被授權為網站管理員');return}
  loginPanel.hidden=true;dashboard.hidden=false
  const [{data:rows,error},{data:articles,error:articleError}]=await Promise.all([
    db.from('website_drafts').select('*').order('threads_published_at',{ascending:false}),
    db.from('website_articles').select('*')
  ])
  if(error||articleError){show('目前無法讀取待審資料');return}
  drafts=rows;publications=new Map(articles.map(item=>[item.post_id,item]))
  document.querySelector('#draft-count').textContent=`待審與草稿 · ${drafts.length} 篇`
  const list=document.querySelector('#draft-list');list.replaceChildren()
  drafts.forEach(draft=>{
    const button=document.createElement('button');button.type='button'
    button.className='draft-item';button.dataset.id=draft.post_id
    const status=document.createElement('small');status.textContent=({pending:'待審',draft:'草稿',published:'已發布',unpublished:'已下架'})[draft.status]||draft.status
    const title=document.createElement('strong');title.textContent=draft.title||draft.original_text?.slice(0,34)||'無文字貼文'
    button.append(status,title);button.addEventListener('click',()=>openDraft(draft));list.append(button)
  })
  show('選擇左側貼文，確認後再發布')
  if(selected){const item=drafts.find(d=>d.post_id===selected.post_id);if(item)openDraft(item)}
}

function openDraft(draft){
  selected=draft;editor.hidden=false
  document.querySelector('#research-summary').textContent=researchSummary(draft)
  document.querySelectorAll('.draft-item').forEach(button=>button.classList.toggle('selected',button.dataset.id===draft.post_id))
  field('post_id').value=draft.post_id
  field('title').value=draft.title||''
  blocks=StoryBlocks.parse(draft.body||'');renderBlockEditor()
  field('image_url').value=draft.image_url||''
  field('category').value=draft.category||suggestCategory(draft.original_text)
  field('tags').value=(draft.tags||[]).join(', ')
  field('featured').checked=publications.get(draft.post_id)?.featured||false
  document.querySelector('#source-date').textContent=`Threads 發文時間 ${draft.threads_published_at?new Date(draft.threads_published_at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}):'未知'}`
  document.querySelector('#original-text').textContent=draft.original_text||'無文字'
  const link=document.querySelector('#original-link');link.href=draft.original_permalink||'#';link.hidden=!draft.original_permalink
  document.querySelector('#unpublish-article').hidden=!publications.get(draft.post_id)?.visible
}

function values(){
  if(!editor.reportValidity())return null
  if(!blocks.some(block=>block.type==='image'?/^https?:\/\//i.test(block.url):block.text?.trim())){show('請先寫一段內文');return null}
  if(blocks.some(block=>block.type==='image' && block.url && !/^https?:\/\//i.test(block.url))){show('圖片網址請使用 https:// 或 http://');return null}
  syncBlocks()
  return {post_id:selected.post_id,title:field('title').value.trim(),body:field('body').value.trim(),image_url:field('image_url').value.trim()||null,category:field('category').value,tags:field('tags').value.split(/[,，]/).map(s=>s.trim()).filter(Boolean),featured:field('featured').checked}
}

async function save(status='draft'){
  const data=values();if(!data)return null
  const {error}=await db.from('website_drafts').update({...data,status,updated_at:new Date().toISOString()}).eq('post_id',data.post_id)
  if(error){show(`儲存失敗：${error.message}`);return null}
  show('草稿已儲存，公開文章尚未更改')
  return data
}

document.querySelector('#login-form').addEventListener('submit',async event=>{
  event.preventDefault();show('正在登入')
  const form=event.currentTarget
  const {error}=await db.auth.signInWithPassword({email:form.elements.email.value,password:form.elements.password.value})
  if(error){show(`登入失敗：${error.message}`);return}
  form.reset();await load()
})
document.querySelector('#logout').addEventListener('click',async()=>{await db.auth.signOut();selected=null;editor.hidden=true;show('已登出');await load()})
document.querySelector('#password-form').addEventListener('submit',async event=>{
  event.preventDefault()
  const form=event.currentTarget, status=document.querySelector('#password-message')
  const password=form.elements.password.value
  if(password!==form.elements.confirm.value){status.textContent='兩次輸入的密碼不相同';return}
  const button=form.querySelector('button[type=submit]');button.disabled=true
  const {error}=await db.auth.updateUser({password})
  button.disabled=false
  if(error){status.textContent=`密碼設定失敗：${error.message}`;return}
  form.reset();status.textContent='密碼已設定。下次可使用電子郵件與新密碼登入。'
})
document.querySelector('#save-draft').addEventListener('click',async()=>{if(await save())await load()})
document.querySelector('#publish-article').addEventListener('click',async()=>{
  const data=await save();if(!data)return
  const article={...data,slug:`story-${data.post_id}`,original_permalink:selected.original_permalink,threads_published_at:selected.threads_published_at,views:selected.views,likes:selected.likes,metrics_updated_at:selected.metrics_updated_at,visible:true,published_at:new Date().toISOString()}
  const {error}=await db.from('website_articles').upsert(article,{onConflict:'post_id'})
  if(error){show(`發布失敗，草稿已保留：${error.message}`);return}
  const {error:statusError}=await db.from('website_drafts').update({status:'published'}).eq('post_id',data.post_id)
  show(statusError?'文章已發布，待審狀態更新失敗':'文章已發布到官網')
  await load()
})
document.querySelector('#unpublish-article').addEventListener('click',async()=>{
  if(!selected)return
  const {error}=await db.from('website_articles').update({visible:false}).eq('post_id',selected.post_id)
  if(error){show(`下架失敗：${error.message}`);return}
  await db.from('website_drafts').update({status:'unpublished'}).eq('post_id',selected.post_id)
  show('文章已從官網下架');await load()
})
load()

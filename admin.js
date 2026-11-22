const cfg=window.GOOODHOWS_CONFIG
const db=window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey)
const message=document.querySelector('#admin-message')
const loginPanel=document.querySelector('#login-panel')
const dashboard=document.querySelector('#dashboard')
const editor=document.querySelector('#editor-form')
let drafts=[],publications=new Map(),selected=null
const categories=['房子與人','都更現場','都更白話說','產業觀察']

function suggestCategory(text=''){
  if(/成本|資金|建商|市場|政策|營造/.test(text))return '產業觀察'
  if(/同意書|權利變換|分配|法規|流程|容積/.test(text))return '都更白話說'
  if(/說明會|協調|整合|簽約|現場/.test(text))return '都更現場'
  return '房子與人'
}

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
  document.querySelectorAll('.draft-item').forEach(button=>button.classList.toggle('selected',button.dataset.id===draft.post_id))
  field('post_id').value=draft.post_id
  field('title').value=draft.title||''
  field('body').value=draft.body||''
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

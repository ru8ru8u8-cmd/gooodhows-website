// Four axes, three questions each. A response scores one end of exactly one axis.
const axes = [
  { letters: ['N', 'F'], title: '時間', labels: ['眼前先安頓', '等一個未來'], descriptions: ['你會先問這幾年怎麼過，再談落成那一天', '你願意為未來的新生活安排一段等待'] },
  { letters: ['H', 'V'], title: '價值', labels: ['留住家的感覺', '算清資產價值'], descriptions: ['一支門栓、一段陽光，也可能是房子的價值', '你希望分回、現金流與公平都能說得清楚'] },
  { letters: ['O', 'E'], title: '主導', labels: ['自己掌舵', '找專業隊友'], descriptions: ['重要決定想自己參與，連麻煩也願意一起扛', '願意交給專業執行，但會看成果與責任'] },
  { letters: ['Q', 'G'], title: '步調', labels: ['查清楚再走', '邊協作邊前進'], descriptions: ['簽字之前，先把風險、證據與退路弄明白', '資訊還不完整時，你傾向先一起推動下一步'] }
]

const questions = [
  { scene: '01 / 搬家倒數', title: '隔壁說，八年後就有新房，你第一個問題是？', context: '老屋漏水、沒有電梯，大家都想重建，只有那個「八年」聽起來很長', axis: 0, options: ['「等等，我這八年住哪裡？家裡那隻貓又住哪裡？」', '「八年換一間更安全的新家，我可以開始規劃」'], sources: [1, 36] },
  { scene: '02 / 一樓店面', title: '你家的店面每個月都有租金，樓上卻急著拆，你會？', context: '海砂屋鑑定可能影響營業，鄰居也真的在擔心水泥掉下來', axis: 1, options: ['先把店面使用和租金中斷怎麼處理談清楚', '先確認店面估價與重建後分回，再決定是否接受'], sources: [5, 28] },
  { scene: '03 / 沒有建商的提案', title: '有人說：「我們自己蓋，建商那一份就省下來！」', context: '前提是地主得自己籌錢、找顧問、選營造廠，還要一起扛追加預算', axis: 2, options: ['如果能組好團隊，我想自己參與每個決定', '我想找有實績的專業團隊，訂好監督和交付標準'], sources: [7, 31] },
  { scene: '04 / 那張紙', title: '建商拿出一頁同意書：「先簽，數字之後再填」', context: '大家都說只差你一戶，表格上還有空白欄位', axis: 3, options: ['空白欄位先釐清，文件用途也請說明白', '先一起推進評估，但要求明確記下待補資料與下一步'], sources: [12, 16] },
  { scene: '05 / 早鳥倒數', title: '早鳥優惠今晚截止，鄰居問你要不要一起簽', context: '合約大致看懂了，但你知道後面可能還有別家建商來', axis: 0, options: ['我想先確定現在的條件能不能照顧近期生活', '只要長期規劃更適合，就算優惠快到期也願意做選擇'], sources: [4, 41] },
  { scene: '06 / 老房子的最後一天', title: '怪手明天要來，今天只能帶走一樣東西', context: '老屋裡有一支用了三十年的木門栓，另一邊有整疊新屋分配資料', axis: 1, options: ['先拆下木門栓，讓這間房子有東西跟我走', '先把分配、坪數和交屋資料收好，未來不能少算'], sources: [34, 45] },
  { scene: '07 / 三家建商', title: '管委會請來三家建商，條件各有長短，你想？', context: '品牌、分配、資本、施工實績與進度，沒有一家全拿滿分', axis: 2, options: ['和鄰居一起訂評分表，由地主決定排序', '請獨立顧問協助查核，再由大家共同決定'], sources: [17, 33] },
  { scene: '08 / 看不到的下一步', title: '建商說「先拆屋才能鑑界」，但建照還沒拿到', context: '拆了就不能馬上住回來，消防動線也還在討論', axis: 3, options: ['先看到建照風險與安置方案，再談拆屋', '願意讓團隊繼續推進，但要先設停損點和明確時程'], sources: [53, 57] },
  { scene: '09 / 新房與老本', title: '想多選五坪，要拿出一大筆退休存款', context: '新房看起來更大，管理費與生活開支也會增加', axis: 0, options: ['我先留住能安心生活的現金，坪數再想想', '我願意為未來的居住空間和資產多投入一些'], sources: [9, 24] },
  { scene: '10 / 頂樓那間', title: '五樓說頂加用了三十年，一樓說店面更值錢', context: '兩邊都覺得自己原本擁有的東西不該被忽略', axis: 1, options: ['先聽大家說那個空間怎麼用、對生活有多重要', '請估價師把合法權益與價值依據攤開來談'], sources: [2, 39] },
  { scene: '11 / 一坪換一坪', title: '建商說：「不夠的坪數，我補給你！」', context: '承諾很動聽，但成本、資金與做法都還需要落地', axis: 2, options: ['地主組小組一起追試算和承諾，別把方向盤全交出去', '讓專業團隊做完整試算，寫進可執行的契約與保障'], sources: [56, 57] },
  { scene: '12 / 合約第十版', title: '大家改了十次合約，建商說再改就不做了', context: '有些字關係到權益，有些字只是不同的表達方式', axis: 3, options: ['先分清哪些條文影響權利義務，重要的不能省', '把重要爭點一次談妥，其他先往下走並留下會議紀錄'], sources: [18, 46] }
]

const names = {
  NHOQ: '街角守護員', NHOG: '巷口行動派', NHEQ: '老屋鑑識官', NHEG: '街坊協調家',
  NVOQ: '精算掌舵手', NVOG: '現場開路者', NVEQ: '風險計算師', NVEG: '務實推進家',
  FHOQ: '記憶築夢人', FHOG: '未來造家者', FHEQ: '藍圖把關者', FHEG: '溫柔築屋師',
  FVOQ: '長線布局家', FVOG: '機會開拓者', FVEQ: '審慎規劃師', FVEG: '新城實踐家'
}

const stories = {
  1: ['八年等待', 'Dc-LuTrFK8w'], 2: ['店面與頂加', 'DdAwjyiEe8c'],
  4: ['早簽與晚簽', 'DdFpBhcklBU'], 5: ['海砂屋店面', 'DdIe13jEcFS'],
  7: ['地主自己蓋', 'DdQOKoXkUGN'], 9: ['新房與退休金', 'DdVWLpjkZti'],
  12: ['一頁同意書', 'DddFaW9idgo'], 24: ['新房蓋好就賣', 'DeBWUaKD-Gm'],
  28: ['你不可以鑽我家', 'DeOAhdcATHi'], 31: ['自主更新第一桶金', 'DeYTp6pCBj6'],
  33: ['地主也在選建商', 'DeddTtSiISY'], 34: ['祖父的四棟房子', 'DegCCVtDCCU'],
  36: ['我想留在老家', 'DelZby1At1r'], 39: ['頂加說故事', 'Des6AVuiZZO'],
  41: ['早鳥真的過期', 'Dex9-5SACF9'], 45: ['拆屋前的門栓', 'De8W4s7Dhsf'],
  46: ['合約改了十次', 'De-7qSjDb6o'], 53: ['建照前拆屋', 'DfQ9OgOEYA0'],
  56: ['補足一坪換一坪', 'DfYsHhsidBW'], 57: ['合法房屋證明', 'DfbeHsrj1yj'],
  16: ['公有地誰先談', 'Ddp9Z3IE-Oe'], 17: ['好建商在哪裡', 'Ddsv980EgDT'],
  18: ['先簽反而卡住', 'Ddv99EhAX5n']
}

const ui = {
  start: document.querySelector('#quiz-start'), question: document.querySelector('#quiz-question'),
  result: document.querySelector('#quiz-result'), title: document.querySelector('#question-title'),
  options: document.querySelector('#question-options'), context: document.querySelector('#question-context')
}
let answers = Array(questions.length).fill(null)
let current = 0
const validCode = code => /^[NF][HV][OE][QG]$/.test(code)

function show(screen) {
  for (const [key, node] of Object.entries({ start: ui.start, question: ui.question, result: ui.result })) node.hidden = key !== screen
  window.scrollTo({ top: 0, behavior: 'instant' })
}

function renderQuestion() {
  const q = questions[current]
  show('question')
  document.querySelector('#progress-label').textContent = String(current + 1).padStart(2, '0') + ' / 12'
  document.querySelector('.quiz-progress-track').setAttribute('aria-valuenow', String(current))
  document.querySelector('#progress-fill').style.width = (current / questions.length * 100) + '%'
  document.querySelector('#question-scene').textContent = q.scene
  ui.title.textContent = q.title
  ui.context.textContent = q.context
  ui.options.replaceChildren(...q.options.map((label, answer) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'question-option'
    const number = document.createElement('b')
    number.textContent = answer === 0 ? 'A' : 'B'
    const copy = document.createElement('span')
    copy.textContent = label
    button.append(number, copy)
    button.addEventListener('click', () => {
      answers[current] = answer
      if (current < questions.length - 1) { current++; renderQuestion() }
      else renderResult(getCode())
    })
    return button
  }))
  document.querySelector('#previous-question').textContent = current ? '← 上一題' : '← 回到起點'
  ui.title.focus({ preventScroll: true })
}

function getCode() {
  return axes.map((axis, axisIndex) => {
    const selected = questions.map((q, index) => q.axis === axisIndex ? answers[index] : null).filter(value => value !== null)
    return axis.letters[selected.reduce((sum, value) => sum + value, 0) >= 2 ? 1 : 0]
  }).join('')
}

function renderResult(code) {
  if (!validCode(code)) return
  show('result')
  const selected = axes.map((axis, i) => axis.letters.indexOf(code[i]))
  const values = axes.map((axis, i) => axis.labels[selected[i]])
  document.querySelector('#result-code').textContent = code + ' / HOUSEOWNER TYPE'
  document.querySelector('#result-title').textContent = names[code]
  document.querySelector('#result-tagline').textContent = '你最在意：' + values[0] + '，' + values[1]
  document.querySelector('#result-description').textContent = '你的選擇像一位' + names[code] + '：' + axes.map((axis, i) => axis.descriptions[selected[i]]).join('；')
  const axisRoot = document.querySelector('#result-axes')
  axisRoot.replaceChildren(...axes.map((axis, i) => {
    const card = document.createElement('div')
    card.className = 'axis-card'
    const small = document.createElement('small')
    small.textContent = '0' + (i + 1) + ' / ' + axis.title
    const strong = document.createElement('strong')
    strong.textContent = code[i] + ' · ' + axis.labels[selected[i]]
    const desc = document.createElement('p')
    desc.textContent = axis.descriptions[selected[i]]
    card.append(small, strong, desc)
    return card
  }))
  document.querySelector('#result-strength').textContent = selected[2] === 0
    ? '你願意親自參與重要選擇，較容易看見地主要一起承擔的事'
    : '你知道什麼時候該找專業團隊，並把精力放在成果與責任上'
  document.querySelector('#result-blindspot').textContent = selected[3] === 0
    ? '查清楚很重要，也可以替自己設定決定期限，免得可行的機會一直往前走'
    : '願意合作是優點；簽文件、搬屋或先出資時，仍要把條件、時程與退路寫明白'
  const references = [selected[0] === 0 ? 1 : 24, selected[1] === 0 ? 45 : 2, selected[2] === 0 ? 7 : 33, selected[3] === 0 ? 12 : 16]
  const links = document.querySelector('#result-links')
  links.replaceChildren(...references.map(id => {
    const link = document.createElement('a')
    link.href = 'https://www.threads.com/@gooodhows/post/' + stories[id][1]
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.textContent = stories[id][0] + ' ↗'
    return link
  }))
  history.replaceState(null, '', '#result=' + code)
  document.querySelector('#share-message').textContent = ''
  document.querySelector('#result-title').focus({ preventScroll: true })
}

function restart() {
  answers = Array(questions.length).fill(null)
  current = 0
  history.replaceState(null, '', location.pathname + location.search)
  renderQuestion()
}

function resultText() {
  const code = document.querySelector('#result-code').textContent.slice(0, 4)
  return '我在更好拾光測出「' + names[code] + '」' + code + '！如果都更輪到你，你會先守住什麼？\n' + location.href
}

document.querySelector('#start-quiz').addEventListener('click', restart)
document.querySelector('#restart-quiz').addEventListener('click', restart)
document.querySelector('#previous-question').addEventListener('click', () => {
  if (current === 0) show('start')
  else { current--; renderQuestion() }
})
document.querySelector('#share-result').addEventListener('click', async () => {
  const message = document.querySelector('#share-message')
  try {
    if (navigator.share) await navigator.share({ title: '更好拾光｜都更屋主性格測驗', text: resultText(), url: location.href })
    else { await navigator.clipboard.writeText(resultText()); message.textContent = '結果文字已複製，可以貼到 Threads 分享' }
  } catch (error) {
    if (error.name !== 'AbortError') message.textContent = '分享暫時不可用，請試試複製結果文字'
  }
})
document.querySelector('#copy-result').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resultText())
    document.querySelector('#share-message').textContent = '已複製，貼到 Threads 或傳給朋友吧'
  } catch {
    document.querySelector('#share-message').textContent = '目前無法複製，請手動複製網址分享'
  }
})
const sharedCode = decodeURIComponent(location.hash.slice(8))
if (location.hash.startsWith('#result=') && validCode(sharedCode)) renderResult(sharedCode)

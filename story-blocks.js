// Structured article blocks live in the existing body text column.
(() => {
  const kinds = new Set(['paragraph', 'heading', 'quote', 'image', 'divider'])
  function parse(raw = '') {
    try {
      const value = JSON.parse(raw)
      if (value?.format === 'gooodhows-blocks-v1' && Array.isArray(value.blocks)) {
        return value.blocks.filter(block => kinds.has(block.type)).map(block => ({type:block.type,text:String(block.text || ''),url:String(block.url || ''),caption:String(block.caption || '')}))
      }
    } catch {}
    return String(raw).split(/\n\s*\n/).map(text => text.trim()).filter(Boolean).map(text => ({type:'paragraph',text}))
  }
  function serialize(blocks) {
    return JSON.stringify({format:'gooodhows-blocks-v1',blocks:blocks.filter(block => block.type === 'divider' || block.text?.trim() || block.url?.trim())})
  }
  function render(blocks, root) {
    root.replaceChildren()
    blocks.forEach(block => {
      let node
      if (block.type === 'divider') node = document.createElement('hr')
      else if (block.type === 'image') {
        if (!/^https?:\/\//i.test(block.url)) return
        node = document.createElement('figure')
        const image = document.createElement('img'); image.src = block.url; image.alt = block.caption || ''; image.loading = 'lazy'; node.append(image)
        if (block.caption) { const caption = document.createElement('figcaption'); caption.textContent = block.caption; node.append(caption) }
      } else {
        node = document.createElement(({heading:'h2',quote:'blockquote',paragraph:'p'})[block.type] || 'p')
        node.textContent = block.text
      }
      root.append(node)
    })
  }
  window.StoryBlocks = {parse,serialize,render}
})()

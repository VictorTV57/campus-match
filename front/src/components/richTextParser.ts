// Analyse du texte enrichi produit par le sync (back/src/sync/mya.mapper.ts,
// htmlToRichText) : lignes, "- " puces, **gras**, [libellé](url), ![](src).
// Les schémas d'URL sont revérifiés ici : le front ne fait pas confiance
// aveuglément à ce que contient la base.

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'bold'; children: Inline[] }
  | { type: 'link'; label: string; href: string }

export type Block =
  | { type: 'paragraph'; inlines: Inline[] }
  | { type: 'list'; items: Inline[][] }
  | { type: 'image'; src: string }
  | { type: 'spacer' }

const SAFE_LINK = /^(https?:\/\/|mailto:)/i
const SAFE_IMAGE = /^(data:image\/(png|jpe?g|gif|webp);base64,|https?:\/\/)/i
const IMAGE_LINE = /^!\[\]\(([^)\s]+)\)$/
const INLINE = /\[([^\]]*)\]\(([^)\s]+)\)|\*\*([^*\n]+?)\*\*/g

export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0
    if (index > last) out.push({ type: 'text', text: text.slice(last, index) })
    const [whole, label, href, bold] = match
    if (bold !== undefined) {
      out.push({ type: 'bold', children: parseInline(bold) })
    } else if (href !== undefined && SAFE_LINK.test(href)) {
      out.push({ type: 'link', label: label || href, href })
    } else {
      out.push({ type: 'text', text: label ?? whole })
    }
    last = index + whole.length
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) })
  return out
}

export function parseRichText(source: string): Block[] {
  const blocks: Block[] = []
  for (const line of source.split('\n')) {
    const trimmed = line.trim()
    const image = IMAGE_LINE.exec(trimmed)
    if (trimmed === '') {
      if (blocks.length > 0 && blocks[blocks.length - 1].type !== 'spacer') {
        blocks.push({ type: 'spacer' })
      }
    } else if (image !== null) {
      if (SAFE_IMAGE.test(image[1])) blocks.push({ type: 'image', src: image[1] })
    } else if (trimmed.startsWith('- ')) {
      const item = parseInline(trimmed.slice(2))
      const previous = blocks[blocks.length - 1]
      if (previous?.type === 'list') previous.items.push(item)
      else blocks.push({ type: 'list', items: [item] })
    } else {
      blocks.push({ type: 'paragraph', inlines: parseInline(trimmed) })
    }
  }
  return blocks
}

/** Version texte brut (aperçus tronqués) : sans images, liens réduits au libellé. */
export function toPlainText(source: string): string {
  return source
    .replace(/^!\[\]\([^)]*\)$/gm, '')
    .replace(/\[([^\]]*)\]\([^)\s]+\)/g, '$1')
    .replace(/\*\*([^*\n]+?)\*\*/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

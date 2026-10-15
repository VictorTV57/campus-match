// Spécialisation (nom de l'API mya) → emoji. Couvre les 37 spécialisations
// présentes au 2026-10-14 ; une nouvelle spécialisation s'affiche avec 🎓.
const EMOJIS: Record<string, string> = {
  '3d modeling': '🧊',
  'artificial intelligence': '🤖',
  assemblers: '⚙️',
  'big data': '📊',
  bioinformatics: '🧬',
  business: '💼',
  'business intelligence': '📈',
  'business science': '🔬',
  'cloud computing': '☁️',
  'computer science': '💻',
  'data mining': '⛏️',
  databases: '🗄️',
  'distributed computing': '🧩',
  'e-commerce': '🛒',
  economics: '💶',
  ergonomics: '🪑',
  'graphics programming': '🎨',
  'international business': '🌍',
  'machine learning': '🧠',
  management: '👔',
  mathematics: '➗',
  'mobile development': '📱',
  multimédia: '🎬',
  multimedia: '🎬',
  networks: '🌐',
  'on-board': '🔌',
  'project management': '📋',
  quality: '✅',
  robotics: '🦾',
  security: '🔒',
  'software architecture': '🏗️',
  'software development': '🧑‍💻',
  'systems administration': '🖥️',
  telecommunications: '📡',
  'ux design': '✏️',
  'video games': '🎮',
  'virtual reality': '🥽',
  'web development': '🕸️',
}

const DEFAULT_EMOJI = '🎓'

export function specializationEmoji(specialization: string): string {
  return EMOJIS[specialization.trim().toLowerCase()] ?? DEFAULT_EMOJI
}

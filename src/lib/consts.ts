export const SITE = {
  name: 'Animo Tem — Bestiário Interior',
  shortName: 'Animo Tem',
  description:
    'Animais de poder, sonhos com animais e sabedoria ancestral: guias, enciclopédia simbólica, testes e oráculos para sua jornada de autoconhecimento.',
  url: import.meta.env.PUBLIC_SITE_URL || 'https://animotem.com',
  email: 'newsletter@animotem.com',
  locale: 'pt-BR',
  language: 'pt_BR',
};

export const AUTHOR = {
  name: import.meta.env.BLOG_AUTHOR || 'Cecília Aranha',
  role: 'Escritora e pesquisadora de saberes ancestrais',
  bio: 'Escritora e pesquisadora dedicada ao estudo das cosmovisões originárias, da psicologia profunda e das tradições xamânicas. Acredita que a sabedoria ancestral é herança de toda a humanidade e merece ser partilhada com reverência — nunca apropriada.',
  avatar: '/images/autora.jpg',
  pagePath: '/autora/',
};

export const SUPPORT = {
  pixKey: import.meta.env.PUBLIC_PIX_KEY || '',
  pixName: 'Cecília Aranha — Animo Tem',
  kofiUrl: import.meta.env.PUBLIC_KOFI_URL || 'https://ko-fi.com/animotem',
  kofiHandle: 'animotem',
};

export const RATINGS = {
  apiUrl:
    import.meta.env.PUBLIC_RATINGS_API_URL ||
    'https://animotem-ratings.SEU_SUBDOMINIO.workers.dev',
};

export const SUBNICHOS: Record<
  string,
  { titulo: string; descricao: string; slug_categoria: string; icone: string }
> = {
  'guia-completo': {
    titulo: 'Guia Completo de Animais de Poder',
    descricao:
      'Fundamentos, totem, espírito animal e práticas para cultivar sua relação com o animal guia.',
    slug_categoria: 'guia',
    icone: '🜁',
  },
  'enciclopedia-animal': {
    titulo: 'Enciclopédia do Reino Animal',
    descricao:
      'A medicina sagrada de cada animal: simbolismo, luz e sombra, e presença ancestral.',
    slug_categoria: 'animais',
    icone: '🜂',
  },
  'sonhos-e-sinais': {
    titulo: 'Sonhos, Sinais e Sincronicidades',
    descricao:
      'O que significa sonhar com animais e como ler os chamados do inconsciente e do cotidiano.',
    slug_categoria: 'sonhos',
    icone: '🜃',
  },
  'xamanismo-e-tradicoes': {
    titulo: 'Xamanismo e Sabedoria das Matas',
    descricao:
      'Cosmovisões originárias, rituais e a escuta das tradições ancestrais com respeito.',
    slug_categoria: 'xamanismo',
    icone: '🜄',
  },
  'ferramentas-e-quiz': {
    titulo: 'Ferramentas, Testes e Oráculos',
    descricao:
      'Testes de afinidade, oráculos diários e cálculos de arquétipos pelo nascimento.',
    slug_categoria: 'ferramentas',
    icone: '◉',
  },
};

export interface AmazonProduct {
  id: string;
  asin?: string;
  title: string;
  authorOrBrand?: string;
  description: string;
  image: string;
  url: string;
  category: 'livro' | 'oraculo' | 'ritual' | 'ferramenta';
  subnichos: string[]; // ex: ['guia-completo', 'enciclopedia-animal', 'xamanismo-e-tradicoes']
  badge?: string;
  rating?: number;
  reviewsCount?: number;
}

export const AMAZON_CONFIG = {
  tag: import.meta.env.PUBLIC_AMAZON_AFFILIATE_TAG || 'animotem-20',
};

export function getAffiliateUrl(baseUrl: string): string {
  if (!baseUrl) return '#';
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('tag', AMAZON_CONFIG.tag);
    return url.toString();
  } catch {
    if (baseUrl.includes('?')) {
      return `${baseUrl}&tag=${AMAZON_CONFIG.tag}`;
    }
    return `${baseUrl}?tag=${AMAZON_CONFIG.tag}`;
  }
}

export const CURATED_PRODUCTS: AmazonProduct[] = [
  {
    id: 'cartas-xamanicas',
    title: 'Cartas Xamânicas: A Descoberta do Poder Através da Energia dos Animais',
    authorOrBrand: 'Jamie Sams & David Carson',
    description: 'O oráculo definitivo sobre a medicina dos animais de poder. Acompanha baralho completo e livro explicativo de simbolismo ancestral.',
    image: '/images/recomendacoes/cartas-xamanicas.jpg',
    url: 'https://www.amazon.com.br/dp/8531501170',
    category: 'oraculo',
    subnichos: ['guia-completo', 'enciclopedia-animal', 'xamanismo-e-tradicoes', 'ferramentas-e-quiz'],
    badge: 'Mais Recomendado 🃏',
    rating: 4.9,
    reviewsCount: 1420,
  },
  {
    id: 'o-caminho-do-xama',
    title: 'O Caminho do Xamã: Um Guia de Força e Cura Pessoal',
    authorOrBrand: 'Michael Harner',
    description: 'A obra clássica do antropólogo Michael Harner sobre o xamanismo essencial, jornadas tamboriladas e conexão com animais guias.',
    image: '/images/recomendacoes/o-caminho-do-xama.jpg',
    url: 'https://www.amazon.com.br/dp/8531505397',
    category: 'livro',
    subnichos: ['xamanismo-e-tradicoes', 'guia-completo'],
    badge: 'Clássico do Xamanismo 📚',
    rating: 4.8,
    reviewsCount: 890,
  },
  {
    id: 'medicina-da-terra',
    title: 'Medicina da Terra: Cartas e Guia de Cura Ancestral',
    authorOrBrand: 'Jamie Sams',
    description: 'Ensaios profundos sobre as 13 Mães Clânicas e a sabedoria dos ciclos naturais das tradições nativas americanas.',
    image: '/images/recomendacoes/medicina-da-terra.jpg',
    url: 'https://www.amazon.com.br/dp/853151048X',
    category: 'livro',
    subnichos: ['xamanismo-e-tradicoes', 'sonhos-e-sinais'],
    badge: 'Sabedoria Ancestral 🌿',
    rating: 4.9,
    reviewsCount: 650,
  },
  {
    id: 'oraculo-dos-animais-sagrados',
    title: 'Oráculo Sagrado dos Animais de Poder',
    authorOrBrand: 'Editora Pensamento',
    description: 'Baralho ilustrado para tiragens diárias, meditações e sintonia com o arquétipo dos animais guardiões.',
    image: '/images/recomendacoes/oraculo-sagrado-animais.jpg',
    url: 'https://www.amazon.com.br/dp/8531521503',
    category: 'oraculo',
    subnichos: ['enciclopedia-animal', 'ferramentas-e-quiz'],
    badge: 'Oráculo Ilustrado ✨',
    rating: 4.7,
    reviewsCount: 430,
  },
  {
    id: 'animal-speak-ted-andrews',
    title: 'Animal Speak: The Spiritual & Magical Powers of Creatures Great & Small',
    authorOrBrand: 'Ted Andrews',
    description: 'Guia clássico de referência mundial sobre a linguagem secreta dos animais, totens espirituais, augúrios e presságios da natureza.',
    image: '/images/recomendacoes/animal-speak-ted-andrews.jpg',
    url: 'https://www.amazon.com.br/dp/0875420281',
    category: 'livro',
    subnichos: ['guia-completo', 'enciclopedia-animal', 'sonhos-e-sinais'],
    badge: 'Bestseller Mundial 🦅',
    rating: 4.9,
    reviewsCount: 2150,
  },
  {
    id: 'animais-de-poder-steven-farmer',
    title: 'Power Animals: How to Connect with Your Animal Spirit Guide',
    authorOrBrand: 'Steven D. Farmer',
    description: 'Manual prático para identificar seu animal totêmico, interpretar mensagens em sonhos e utilizar a medicina dos animais na vida cotidiana.',
    image: '/images/recomendacoes/animais-de-poder-steven-farmer.jpg',
    url: 'https://www.amazon.com.br/dp/1401907334',
    category: 'livro',
    subnichos: ['guia-completo', 'xamanismo-e-tradicoes'],
    badge: 'Guia Prático 🐺',
    rating: 4.8,
    reviewsCount: 980,
  },
  {
    id: 'the-wild-unknown-animal-spirit',
    title: 'The Wild Unknown Animal Spirit Deck & Guidebook',
    authorOrBrand: 'Kim Krans',
    description: 'Baralho de arte visionária com 63 cartas ilustradas à mão para explorar animais, insetos e criaturas dos elementos.',
    image: '/images/recomendacoes/the-wild-unknown-animal-spirit.jpg',
    url: 'https://www.amazon.com.br/dp/0062742868',
    category: 'oraculo',
    subnichos: ['oraculo', 'ferramentas-e-quiz'],
    badge: 'Arte Visionária 🎨',
    rating: 4.9,
    reviewsCount: 5400,
  },
  {
    id: 'palo-santo-natural',
    title: 'Kit Palo Santo in Natura Premium para Purificação e Defumação',
    authorOrBrand: 'Ateliê da Terra',
    description: 'Madeira sagrada de Palo Santo 100% natural e sustentável para limpeza energética de espaços, consagração e preparação de altares.',
    image: '/images/recomendacoes/palo-santo-natural.jpg',
    url: 'https://www.amazon.com.br/dp/B08X1L99Q2',
    category: 'ritual',
    subnichos: ['ritual', 'ferramentas-e-quiz'],
    badge: 'Limpeza Energética 🪵',
    rating: 4.7,
    reviewsCount: 320,
  },
  {
    id: 'tambor-xamanico-lakota',
    title: 'Tambor Xamânico Lakota Artesanal com Baqueta de Couro',
    authorOrBrand: 'Som da Terra Xamanismo',
    description: 'Tambor de ressonância artesanal para rituais de cura, jornadas xamânicas ao som do pulso da Terra e cantos sagrados.',
    image: '/images/recomendacoes/tambor-xamanico-lakota.jpg',
    url: 'https://www.amazon.com.br/dp/B09Y8N776F',
    category: 'ferramenta',
    subnichos: ['ferramenta', 'xamanismo-e-tradicoes'],
    badge: 'Instrumento Ritual 🥁',
    rating: 4.9,
    reviewsCount: 180,
  },
  {
    id: 'kit-cristais-7-chakras',
    title: 'Kit Cristais Naturais dos 7 Chakras e Pedras de Proteção Ancestral',
    authorOrBrand: 'Guardiões de Pedra',
    description: 'Conjunto de pedras e cristais genuínos para meditação, alinhamento dos centros de energia e fortalecimento da intenção espiritual.',
    image: '/images/recomendacoes/kit-cristais-7-chakras.jpg',
    url: 'https://www.amazon.com.br/dp/B08DFG45KL',
    category: 'ferramenta',
    subnichos: ['ferramenta', 'sonhos-e-sinais'],
    badge: 'Proteção & Equilíbrio 💎',
    rating: 4.8,
    reviewsCount: 410,
  },
];

export function getProductsForSubnicho(subnicho: string, limit = 2): AmazonProduct[] {
  const matches = CURATED_PRODUCTS.filter((p) => p.subnichos.includes(subnicho));
  if (matches.length > 0) return matches.slice(0, limit);
  return CURATED_PRODUCTS.slice(0, limit);
}

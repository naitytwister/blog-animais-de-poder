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
    description: 'O oráculo definitivo sobre a medicina dos animais de poder. Acompanha baralho completo e livro explicativo de simbolismo.',
    image: 'https://m.media-amazon.com/images/I/81+c+L8N85L._AC_UF1000,1000_QL80_.jpg',
    url: 'https://www.amazon.com.br/dp/8531501170',
    category: 'oraculo',
    subnichos: ['guia-completo', 'enciclopedia-animal', 'xamanismo-e-tradicoes', 'ferramentas-e-quiz'],
    badge: 'Mais Recomendado 🃏',
    rating: 4.9,
    reviewsCount: 1420,
  },
  {
    id: 'o-caminho-do-xama',
    title: 'O Caminho do Xamã: Um Guia de Fuça e Cura Pessoal',
    authorOrBrand: 'Michael Harner',
    description: 'A obra clássica do antropólogo Michael Harner sobre o xamanismo essencial, jornadas tamboriladas e conexão com animais guias.',
    image: 'https://m.media-amazon.com/images/I/71YdFh+K0pL._AC_UF1000,1000_QL80_.jpg',
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
    description: 'Ensaios profundos sobre as 13 Mães Clanicas e a sabedoria dos ciclos naturais das tradições nativas americanas.',
    image: 'https://m.media-amazon.com/images/I/81fH+0Q8GSL._AC_UF1000,1000_QL80_.jpg',
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
    image: 'https://m.media-amazon.com/images/I/71-0jN2mQGL._AC_UF1000,1000_QL80_.jpg',
    url: 'https://www.amazon.com.br/dp/8531521503',
    category: 'oraculo',
    subnichos: ['enciclopedia-animal', 'ferramentas-e-quiz'],
    badge: 'Oráculo Ilustrado ✨',
    rating: 4.7,
    reviewsCount: 430,
  },
];

export function getProductsForSubnicho(subnicho: string, limit = 2): AmazonProduct[] {
  const matches = CURATED_PRODUCTS.filter((p) => p.subnichos.includes(subnicho));
  if (matches.length > 0) return matches.slice(0, limit);
  return CURATED_PRODUCTS.slice(0, limit);
}

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
  tag: (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_AMAZON_AFFILIATE_TAG) || process.env.PUBLIC_AMAZON_AFFILIATE_TAG || 'animotem-20',
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
    authorOrBrand: 'Jamie Sams & David Carson (Editora Rocco)',
    description: 'O oráculo definitivo sobre a medicina dos animais de poder. Acompanha baralho completo e livro explicativo de simbolismo ancestral.',
    image: '/images/recomendacoes/cartas-xamanicas.jpg',
    url: 'https://www.amazon.com.br/dp/8532511112',
    category: 'oraculo',
    subnichos: ['guia-completo', 'enciclopedia-animal', 'xamanismo-e-tradicoes', 'ferramentas-e-quiz'],
    badge: 'Mais Recomendado 🃏',
    rating: 4.9,
    reviewsCount: 1420,
  },
  {
    id: 'oraculo-poder-animal',
    title: 'Oráculo do Poder Animal: 50 Cartas com Mantras e Significados',
    authorOrBrand: 'Cláudia Oliveira (Matrix Editora)',
    description: 'Livro-caixinha com 50 cartas de animais de poder, mantras de conexão e reflexões para autoconhecimento e reprogramação mental.',
    image: '/images/recomendacoes/oraculo-poder-animal.jpg',
    url: 'https://www.amazon.com.br/dp/6556161357',
    category: 'oraculo',
    subnichos: ['enciclopedia-animal', 'ferramentas-e-quiz', 'guia-completo'],
    badge: 'Baralho Nacional ✨',
    rating: 4.8,
    reviewsCount: 390,
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
    id: 'oraculo-magico-animais',
    title: 'Oráculo Mágico dos Animais Sagrados',
    authorOrBrand: 'Paulo Rodrigues & Antonio Brambila (Editora Alfabeto)',
    description: 'Kit com 40 cartas ilustradas e livro colorido com métodos de tiragem, sabedoria indígena e medicina dos animais.',
    image: '/images/recomendacoes/oraculo-magico-animais.jpg',
    url: 'https://www.amazon.com.br/dp/658790565X',
    category: 'oraculo',
    subnichos: ['oraculo', 'xamanismo-e-tradicoes'],
    badge: 'Kit Ilustrado 🪶',
    rating: 4.8,
    reviewsCount: 280,
  },
  {
    id: 'o-caminho-do-xama',
    title: 'O Caminho do Xamã: Um Guia de Poder e Cura',
    authorOrBrand: 'Michael Harner (Editora Goya / Aleph)',
    description: 'A obra clássica definitiva do antropólogo Michael Harner sobre o xamanismo essencial, tamboriladas e conexão com animais guias.',
    image: '/images/recomendacoes/o-caminho-do-xama.jpg',
    url: 'https://www.amazon.com.br/dp/8576575485',
    category: 'livro',
    subnichos: ['xamanismo-e-tradicoes', 'guia-completo'],
    badge: 'Clássico do Xamanismo 📚',
    rating: 4.9,
    reviewsCount: 1100,
  },
  {
    id: 'xamanismo-para-iniciantes',
    title: 'Xamanismo para Iniciantes: Caminhando com os Curadores da Terra e do Céu',
    authorOrBrand: 'James Endredy (Madras Editora)',
    description: 'Guia acessível e profundo sobre rituais, práticas ancestrais, jornadas de cura e conexão com espíritos e animais aliados.',
    image: '/images/recomendacoes/xamanismo-para-iniciantes.jpg',
    url: 'https://www.amazon.com.br/dp/6556200883',
    category: 'livro',
    subnichos: ['xamanismo-e-tradicoes', 'guia-completo'],
    badge: 'Iniciação Prática 🌿',
    rating: 4.8,
    reviewsCount: 320,
  },
  {
    id: 'a-sabedoria-dos-xamas',
    title: 'A Sabedoria dos Xamãs: Ensinamentos Toltecas sobre o Amor e a Natureza',
    authorOrBrand: 'Don Jose Ruiz (Editora Vozes)',
    description: 'Sabedoria oral tolteca para despertar o autoconhecimento, a comunhão com a natureza e o despertar espiritual.',
    image: '/images/recomendacoes/a-sabedoria-dos-xamas.jpg',
    url: 'https://www.amazon.com.br/dp/6557135503',
    category: 'livro',
    subnichos: ['xamanismo-e-tradicoes', 'sonhos-e-sinais'],
    badge: 'Sabedoria Ancestral 🦅',
    rating: 4.8,
    reviewsCount: 540,
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
    badge: 'Bestseller Mundial 🦉',
    rating: 4.9,
    reviewsCount: 2150,
  },
  {
    id: 'power-animals-steven-farmer',
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
    id: 'a-biblia-dos-cristais',
    title: 'A Bíblia dos Cristais: O Guia Definitivo dos Cristais',
    authorOrBrand: 'Judy Hall (Editora Pensamento)',
    description: 'O manual mais completo sobre pedras e cristais naturais, propriedades energéticas, alinhamento dos 7 chakras e limpeza sutil.',
    image: '/images/recomendacoes/a-biblia-dos-cristais.jpg',
    url: 'https://www.amazon.com.br/dp/8531515246',
    category: 'livro',
    subnichos: ['ferramenta', 'sonhos-e-sinais', 'xamanismo-e-tradicoes'],
    badge: 'Referência Mundial 💎',
    rating: 4.9,
    reviewsCount: 3800,
  },
  {
    id: 'palo-santo-natural',
    title: 'Incenso Natural de Palo Santo e Breu Branco',
    authorOrBrand: 'Incenso Artesanal para Purificação',
    description: 'Palo Santo e resinas sagradas para limpeza energética de espaços, consagração de altares e preparação meditativa.',
    image: '/images/recomendacoes/palo-santo-natural.jpg',
    url: 'https://www.amazon.com.br/dp/B0951C5N3M',
    category: 'ritual',
    subnichos: ['ritual', 'ferramentas-e-quiz'],
    badge: 'Limpeza Energética 🪵',
    rating: 4.7,
    reviewsCount: 320,
  },
];

export function getProductsForSubnicho(subnicho: string, limit = 2): AmazonProduct[] {
  const matches = CURATED_PRODUCTS.filter((p) => p.subnichos.includes(subnicho));
  if (matches.length > 0) return matches.slice(0, limit);
  return CURATED_PRODUCTS.slice(0, limit);
}

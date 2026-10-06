import fs from 'fs';
import path from 'path';

const outputDir = path.resolve('public/images/recomendacoes');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const covers = [
  {
    filename: 'cartas-xamanicas.svg',
    title: 'CARTAS XAMÂNICAS',
    subtitle: 'A Descoberta do Poder Através dos Animais',
    author: 'Jamie Sams & David Carson',
    category: 'BARALHO & GUIA ORACULAR',
    bgColor: '#1c1917',
    accentColor: '#d97706',
    icon: '🦅',
  },
  {
    filename: 'o-caminho-do-xama.svg',
    title: 'O CAMINHO DO XAMÃ',
    subtitle: 'Um Guia de Força e Cura Pessoal',
    author: 'Michael Harner',
    category: 'LIVRO CLÁSSICO',
    bgColor: '#18181b',
    accentColor: '#b45309',
    icon: '🐺',
  },
  {
    filename: 'medicina-da-terra.svg',
    title: 'MEDICINA DA TERRA',
    subtitle: 'Cartas e Guia de Cura Ancestral',
    author: 'Jamie Sams',
    category: 'SABEDORIA ANCESTRAL',
    bgColor: '#14532d',
    accentColor: '#f59e0b',
    icon: '🌿',
  },
  {
    filename: 'oraculo-sagrado-animais.svg',
    title: 'ORÁCULO SAGRADO',
    subtitle: 'Dos Animais de Poder',
    author: 'Editora Pensamento',
    category: 'ORÁCULO ILUSTRADO',
    bgColor: '#312e81',
    accentColor: '#fbbf24',
    icon: '✨',
  },
  {
    filename: 'animal-speak.svg',
    title: 'ANIMAL SPEAK',
    subtitle: 'A Sabedoria dos Animais Espirituais',
    author: 'Ted Andrews',
    category: 'GUIA COMPLETO',
    bgColor: '#451a03',
    accentColor: '#f59e0b',
    icon: '🦉',
  },
  {
    filename: 'livro-animais-de-poder.svg',
    title: 'O LIVRO DOS ANIMAIS DE PODER',
    subtitle: 'Encontre seu Espírito Guia',
    author: 'Steven D. Farmer',
    category: 'ENERGIA & ARQUÉTIPOS',
    bgColor: '#064e3b',
    accentColor: '#34d399',
    icon: '🐾',
  },
  {
    filename: 'wild-unknown-animal-spirit.svg',
    title: 'THE WILD UNKNOWN',
    subtitle: 'Animal Spirit Deck & Guidebook',
    author: 'Kim Krans',
    category: 'ARTE VISIONÁRIA',
    bgColor: '#172554',
    accentColor: '#60a5fa',
    icon: '🐍',
  },
  {
    filename: 'palo-santo.svg',
    title: 'PALO SANTO NATURAI',
    subtitle: 'Madeira Sagrada in Natura',
    author: 'Limpeza Energética',
    category: 'RITUAL & PURIFICAÇÃO',
    bgColor: '#292524',
    accentColor: '#f97316',
    icon: '🪵',
  },
  {
    filename: 'tambor-xamanico.svg',
    title: 'TAMBOR XAMÂNICO LAKOTA',
    subtitle: 'Artesanal com Baqueta de Couro',
    author: 'Instrumento Sagrado',
    category: 'RESSONÂNCIA SONORA',
    bgColor: '#3b0764',
    accentColor: '#c084fc',
    icon: '🥁',
  },
  {
    filename: 'cristais-7-chakras.svg',
    title: 'CRISTAIS 7 CHAKRAS',
    subtitle: 'Pedras Naturais de Proteção',
    author: 'Alinhamento Energético',
    category: 'PEDRAS & CRISTAIS',
    bgColor: '#042f2e',
    accentColor: '#2dd4bf',
    icon: '💎',
  },
];

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSVG(cover) {
  const title = escapeXml(cover.title);
  const subtitle = escapeXml(cover.subtitle);
  const author = escapeXml(cover.author);
  const category = escapeXml(cover.category);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad_${cover.filename.replace('.svg', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${cover.bgColor}"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
  </defs>

  <!-- Card Background -->
  <rect width="300" height="420" rx="12" fill="url(#bgGrad_${cover.filename.replace('.svg', '')})"/>
  
  <!-- Outer Border -->
  <rect x="10" y="10" width="280" height="400" rx="8" fill="none" stroke="${cover.accentColor}" stroke-width="1.5" stroke-opacity="0.6"/>
  <rect x="14" y="14" width="272" height="392" rx="6" fill="none" stroke="${cover.accentColor}" stroke-width="0.75" stroke-opacity="0.3"/>

  <!-- Category Tag -->
  <rect x="30" y="28" width="240" height="22" rx="11" fill="${cover.accentColor}" fill-opacity="0.2"/>
  <text x="150" y="43" font-family="sans-serif" font-size="9" font-weight="bold" fill="${cover.accentColor}" text-anchor="middle" letter-spacing="1">${category}</text>

  <!-- Central Symbol / Icon -->
  <circle cx="150" cy="135" r="45" fill="${cover.accentColor}" fill-opacity="0.1" stroke="${cover.accentColor}" stroke-width="1"/>
  <text x="150" y="152" font-size="44" text-anchor="middle">${cover.icon}</text>

  <!-- Title & Subtitle -->
  <text x="150" y="230" font-family="serif, Georgia" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
  <text x="150" y="255" font-family="sans-serif" font-size="11" fill="#e4e4e7" text-anchor="middle">${subtitle}</text>

  <!-- Author Line -->
  <line x1="60" y1="285" x2="240" y2="285" stroke="${cover.accentColor}" stroke-width="1" stroke-opacity="0.4"/>
  <text x="150" y="310" font-family="sans-serif" font-size="10" font-style="italic" fill="#a1a1aa" text-anchor="middle">${author}</text>

  <!-- Footer Branding -->
  <text x="150" y="380" font-family="sans-serif" font-size="10" font-weight="bold" fill="${cover.accentColor}" text-anchor="middle" letter-spacing="2">ANIMOTEM SELEÇÃO</text>
</svg>`;
}

covers.forEach((c) => {
  const filePath = path.join(outputDir, c.filename);
  fs.writeFileSync(filePath, generateSVG(c), 'utf8');
  console.log(`Generated ${c.filename}`);
});

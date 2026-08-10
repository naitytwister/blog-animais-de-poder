export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateIso(date: Date): string {
  return date.toISOString();
}

export function slugToSubnichoSlug(subnicho: string): string {
  const map: Record<string, string> = {
    'guia-completo': 'guia',
    'enciclopedia-animal': 'animais',
    'sonhos-e-sinais': 'sonhos',
    'xamanismo-e-tradicoes': 'xamanismo',
    'ferramentas-e-quiz': 'ferramentas',
  };
  return map[subnicho] || subnicho;
}

export function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min de leitura`;
}

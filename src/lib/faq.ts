export interface FaqItem {
  question: string;
  answer: string;
}

export function extractFaq(body: string): FaqItem[] {
  const m = body.match(/^##\s+(Perguntas Frequentes|FAQ)\s*\n([\s\S]*)$/m);
  if (!m) return [];
  const section = m[2];
  const items: FaqItem[] = [];
  const pairs = section.split(/^\*\*(.+?)\*\*\s*$/m);
  for (let i = 1; i < pairs.length; i += 2) {
    const question = pairs[i].trim();
    const answer = (pairs[i + 1] || '').trim();
    if (question && answer) {
      items.push({ question, answer });
    }
  }
  return items;
}

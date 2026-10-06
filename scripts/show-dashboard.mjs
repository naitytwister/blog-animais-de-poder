// @ts-check
/**
 * scripts/show-dashboard.mjs
 * 
 * Tabela de Controle e Monitoramento de Desempenho Social:
 * - Mostra todas as postagens ativas por grupo.
 * - Exibe métricas de Reações, Comentários e Status do link canônico.
 * - Gera versão Markdown em .browser-session/dashboard-postagens.md.
 * 
 * Uso:
 *   node scripts/show-dashboard.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const PERF_FILE = path.resolve('.browser-session/social-performance.json');
const DASHBOARD_MD = path.resolve('.browser-session/dashboard-postagens.md');

function loadPerformanceData() {
  try {
    if (fs.existsSync(PERF_FILE)) {
      return JSON.parse(fs.readFileSync(PERF_FILE, 'utf-8'));
    }
  } catch {}
  return { trackedPosts: [] };
}

function renderDashboard() {
  const data = loadPerformanceData();
  const posts = data.trackedPosts || [];

  console.log('='.repeat(80));
  console.log('📊 ANIMOTEM — TABELA DE CONTROLE E DESEMPENHO DAS POSTAGENS');
  console.log('='.repeat(80));

  if (posts.length === 0) {
    console.log('ℹ️ Nenhuma postagem monitorada no momento.');
    return;
  }

  const tableRows = posts.map((p, i) => {
    let cleanGroup = p.title || '';
    if (cleanGroup.includes(' - ')) {
      cleanGroup = cleanGroup.split(' - ').slice(1).join(' - ');
    } else if (cleanGroup.startsWith('Medicina da Coruja')) {
      cleanGroup = 'Wicca, Magia & Ocultismo BR';
    }
    if (cleanGroup.length > 35) cleanGroup = cleanGroup.slice(0, 32) + '...';

    const animalName = p.slug
      .replace(/^animal-de-poder-/, '')
      .replace(/-chamado-secreto-adiar-fim$/, '')
      .split('-')[0]
      .toUpperCase();

    return {
      '#': i + 1,
      Animal: animalName,
      Grupo: cleanGroup,
      Status: p.status === 'published' ? 'Publicado ✅' : 'Moderação ⏳',
      Link: p.commentedLink ? 'No 1º Comentário ✅' : (p.status === 'published' ? 'Injetando 💬' : 'Aguardando Aprovação ⏳'),
      Reações: p.likes || 0,
      Comentários: p.comments || 0,
      Última_Checagem: p.lastChecked ? p.lastChecked.split('T')[1].slice(0, 5) : 'Nunca'
    };
  });

  console.table(tableRows);

  const totalPublished = posts.filter(p => p.status === 'published').length;
  const totalPending = posts.filter(p => p.status === 'pending_approval').length;
  const totalLikes = posts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalComments = posts.reduce((acc, p) => acc + (p.comments || 0), 0);
  const totalLinksCommented = posts.filter(p => p.commentedLink).length;

  console.log('-'.repeat(80));
  console.log(`📈 TOTAIS CONSOLIDADOS:`);
  console.log(`• Total de Grupos Ativos: ${posts.length}`);
  console.log(`• Posts Aprovados no Feed: ${totalPublished} | Em Fila de Moderação: ${totalPending}`);
  console.log(`• Links Canônicos Ativos nos Comentários: ${totalLinksCommented}/${posts.length}`);
  console.log(`• Total de Reações/Curtidas: ${totalLikes} | Comentários: ${totalComments}`);
  console.log('='.repeat(80));

  // Salva em Markdown para consulta visual permanente
  const mdContent = `# 📊 Tabela de Controle de Postagens e Desempenho — Animotem
*Atualizado em: ${new Date().toLocaleString('pt-BR')}*

## 🎯 Métricas Gerais
- **Total de Grupos Monitorados:** ${posts.length}
- **Publicados no Feed:** ${totalPublished}
- **Em Moderação:** ${totalPending}
- **Links Canônicos Injetados no 1º Comentário:** ${totalLinksCommented}
- **Total de Reações:** ${totalLikes}
- **Total de Comentários:** ${totalComments}

---

## 📋 Detalhamento por Grupo

| # | Animal | Grupo | Status | Link Canônico | Reações | Comentários | Última Checagem | URL do Grupo |
| :-: | :--- | :--- | :--- | :--- | :-: | :-: | :-: | :--- |
${posts.map((p, i) => {
  let groupName = p.title || '';
  if (groupName.includes(' - ')) {
    groupName = groupName.split(' - ').slice(1).join(' - ');
  } else if (groupName.startsWith('Medicina da Coruja')) {
    groupName = 'Wicca, Magia & Ocultismo BR';
  }
  const statusStr = p.status === 'published' ? '✅ Publicado' : '⏳ Moderação';
  const linkStr = p.commentedLink ? '✅ Sim (1º Comentário)' : '⏳ Aguardando';
  const animalName = p.slug
    .replace(/^animal-de-poder-/, '')
    .replace(/-chamado-secreto-adiar-fim$/, '')
    .split('-')[0]
    .toUpperCase();
  const time = p.lastChecked ? p.lastChecked.split('T')[1].slice(0, 5) : '-';
  return `| ${i + 1} | **${animalName}** | ${groupName} | ${statusStr} | ${linkStr} | ${p.likes || 0} | ${p.comments || 0} | ${time} | [Acessar Grupo](${p.groupUrl}) |`;
}).join('\n')}

---
> 💡 *Atualizado automaticamente pelas tarefas agendadas \`npm run track\` e \`npm run daily\`.*
`;

  const dir = path.dirname(DASHBOARD_MD);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DASHBOARD_MD, mdContent, 'utf-8');
}

renderDashboard();

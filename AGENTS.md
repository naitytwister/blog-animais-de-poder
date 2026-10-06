# Instruções do Workspace: Animotem (Bestiário Interior)

## 🌅 Rotina Automática de Abertura (Startup Routine)
Sempre que o usuário iniciar ou retomar uma sessão neste workspace no Antigravity:
1. **Verificação de Publicação Diária:**
   - Execute silenciosamente a rotina diária: `node scripts/daily-routine.mjs`.
   - Se o post de hoje já foi feito, informe brevemente o animal do dia.
   - Se ainda não foi feito, a rotina executará a validação dos posts, envio ao IndexNow, distribuição no grupo e monitoramento de desempenho (tudo em uma única execução diária).
   - **NÃO execute** `track-posts.mjs` separadamente na abertura de sessão — ele já roda automaticamente como Etapa 4/4 dentro da rotina diária.

## 🛡️ Regras de Versionamento (Git & GitHub)
- **NUNCA commitar:** `.browser-session/`, `test-results/`, `concorrencia/`, `scripts/groups.json` ou arquivos de log locais. Todos devem permanecer 100% locais na máquina do usuário conforme definido no `.gitignore`.

## ⚡ Princípio Ponytail (Senior Dev Pragmático)
- Prefira soluções simples, comandos diretos em Node nativo e recursos da plataforma.
- Menor código possível, zero abstrações desnecessárias.

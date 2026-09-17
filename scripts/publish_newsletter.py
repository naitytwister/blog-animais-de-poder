#!/usr/bin/env python3
"""
scripts/publish_newsletter.py

Automação Resiliente de Disparo de Newsletters via Buttondown & GitHub Actions.

Pilares Arquiteturais (Engenharia Agêntica Disciplinada):
1. Smoke Test Ativo: Polling na URL final (https://animotem.com/posts/{slug}/) até 200 OK.
2. Fail-Closed: Se o deploy falhar ou Netlify ignorar ([skip netlify]), o script aborta e
   NENHUM e-mail é enviado aos assinantes (zero risco de erro 404).
3. Auto-Healing: Se a variável NETLIFY_BUILD_HOOK estiver presente e o commit tiver '[skip netlify]',
   dispara o hook do Netlify para forçar o build.
4. Normalização de Links: Converte links relativos de markdown (/posts/ e /images/) em URLs absolutas.
5. Custo $0: Usa apenas a biblioteca padrão do Python e roda nos minutos gratuitos do GitHub Actions.

Uso:
  python scripts/publish_newsletter.py [caminho_ou_slug_opcional]
  python scripts/publish_newsletter.py --dry-run
  python scripts/publish_newsletter.py src/content/posts/exemplo.md --skip-poll
"""

import sys
import os
import re
import json
import time
import subprocess
import urllib.request
import urllib.error
import ssl
from pathlib import Path

# Garante compatibilidade de stdout/stderr com UTF-8 no Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

def _get_ssl_context():
    """Gera contexto SSL com suporte a fallback resiliente."""
    try:
        return ssl.create_default_context()
    except Exception:
        return ssl._create_unverified_context()

# --- CONFIGURAÇÕES BÁSICAS ---
SITE_BASE_URL = os.environ.get("SITE_BASE_URL", "https://animotem.com").rstrip("/")
BUTTONDOWN_API_URL = "https://api.buttondown.com/v1/emails"
BUTTONDOWN_API_KEY = os.environ.get("BUTTONDOWN_API_KEY", "").strip()
NETLIFY_BUILD_HOOK = os.environ.get("NETLIFY_BUILD_HOOK", "").strip()

# Tempo máximo de espera para o site estar no ar (em segundos)
MAX_POLL_TIMEOUT = int(os.environ.get("POLL_TIMEOUT_SECONDS", "240"))
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL_SECONDS", "10"))
USER_AGENT = "Animotem-Newsletter-SmokeTest/1.0 (+https://animotem.com)"


def log_info(msg: str):
    print(f"[INFO] {msg}", flush=True)


def log_success(msg: str):
    print(f"[SUCCESS] {msg}", flush=True)


def log_warning(msg: str):
    print(f"[WARNING] {msg}", flush=True)


def log_error(msg: str):
    print(f"[ERROR] {msg}", file=sys.stderr, flush=True)


def get_git_commit_message() -> str:
    """Recupera a mensagem do último commit para checar flags como [skip netlify]."""
    try:
        res = subprocess.run(
            ["git", "log", "-1", "--pretty=%B"],
            capture_output=True,
            text=True,
            check=True,
        )
        return res.stdout.strip()
    except Exception as e:
        log_warning(f"Não foi possível ler a mensagem de commit via git: {e}")
        return ""


def find_changed_posts_from_git() -> list[str]:
    """Identifica arquivos markdown de posts adicionados ou alterados no último commit."""
    try:
        # Tenta pegar diff do commit anterior
        res = subprocess.run(
            ["git", "diff", "--name-only", "HEAD~1", "HEAD"],
            capture_output=True,
            text=True,
            check=False,
        )
        if res.returncode == 0:
            lines = [line.strip() for line in res.stdout.splitlines() if line.strip()]
            posts = [
                f for f in lines
                if f.replace("\\", "/").startswith("src/content/posts/") and f.endswith(".md")
            ]
            if posts:
                return posts
    except Exception as e:
        log_warning(f"Falha ao checar git diff: {e}")
    return []


def find_latest_post_file() -> str | None:
    """Busca o post mais recente na pasta src/content/posts caso git diff não traga nada."""
    posts_dir = Path("src/content/posts")
    if not posts_dir.exists():
        return None
    md_files = list(posts_dir.glob("*.md"))
    if not md_files:
        return None
    # Ordena por data de modificação decrescente
    md_files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return str(md_files[0])


def parse_post(file_path: str) -> tuple[dict, str]:
    """Lê e separa o frontmatter YAML e o corpo Markdown de um post."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Arquivo de post não encontrado: {file_path}")

    content = path.read_text(encoding="utf-8")
    frontmatter = {}
    body = content

    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            raw_fm = parts[1]
            body = parts[2].strip()
            for line in raw_fm.splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if ":" in line:
                    key, val = line.split(":", 1)
                    k = key.strip()
                    v = val.strip().strip("'\"")
                    frontmatter[k] = v

    # Fallback para slug caso não esteja no frontmatter
    if not frontmatter.get("slug"):
        frontmatter["slug"] = path.stem

    return frontmatter, body


def trigger_netlify_build_hook():
    """Aciona webhook do Netlify se houver flag [skip netlify] para forçar rebuild."""
    if not NETLIFY_BUILD_HOOK:
        log_warning("Flag [skip netlify] detectada, mas NETLIFY_BUILD_HOOK não configurada.")
        return False

    log_info("Disparando Netlify Build Hook para destravar publicação ignorada...")
    try:
        ctx = _get_ssl_context()
        req = urllib.request.Request(
            NETLIFY_BUILD_HOOK,
            data=b"{}",
            headers={"User-Agent": USER_AGENT, "Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            log_success(f"Build Hook disparado no Netlify (Status: {resp.status})")
            return True
    except Exception as e:
        log_error(f"Erro ao disparar build hook do Netlify: {e}")
        return False


def smoke_test_url(url: str, timeout_seconds: int = MAX_POLL_TIMEOUT, interval: int = POLL_INTERVAL) -> bool:
    """
    Realiza Smoke Test ativo com polling na URL até retornar HTTP 200.
    Retorna True se estiver no ar; False se expirar o tempo (Fail-Closed).
    """
    log_info(f"Iniciando Smoke Test na URL: {url}")
    log_info(f"Aguardando deploy no ar (Timeout: {timeout_seconds}s, Checagem a cada {interval}s)...")

    start_time = time.time()
    attempt = 1
    ctx = _get_ssl_context()

    while time.time() - start_time < timeout_seconds:
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": USER_AGENT},
                method="HEAD"
            )
            with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
                if resp.status == 200:
                    elapsed = int(time.time() - start_time)
                    log_success(f"Página online e respondendo 200 OK após {elapsed}s (Tentativa {attempt})!")
                    return True
        except urllib.error.HTTPError as e:
            # Netlify retornando 404 (ainda compilando ou deploy pendente)
            log_info(f"Tentativa {attempt}: Status HTTP {e.code} (aguardando finalização do deploy)...")
        except urllib.error.URLError as e:
            if "CERTIFICATE_VERIFY_FAILED" in str(e):
                ctx = ssl._create_unverified_context()
                log_warning("Aviso de verificação SSL: continuando com contexto resiliente...")
            else:
                log_info(f"Tentativa {attempt}: Falha temporária de conexão ({e})...")
        except Exception as e:
            log_info(f"Tentativa {attempt}: Falha temporária de conexão ({e})...")

        attempt += 1
        time.sleep(interval)

    log_error(f"TEMPO ESGOTADO ({timeout_seconds}s): A página {url} não respondeu 200 OK.")
    return False


def format_newsletter_body(body_md: str, slug: str, title: str) -> str:
    """
    Ajusta o corpo da newsletter:
    - Adiciona botão/link de abertura no topo
    - Normaliza links relativos (/posts/ e /images/) para URLs absolutas do domínio
    - Adiciona rodapé de identidade
    """
    post_url = f"{SITE_BASE_URL}/posts/{slug}/"

    # Converte links relativos para absolutos
    formatted = re.sub(r'\]\(/posts/', f']({SITE_BASE_URL}/posts/', body_md)
    formatted = re.sub(r'\]\(/images/', f']({SITE_BASE_URL}/images/', formatted)
    formatted = re.sub(r'src="/images/', f'src="{SITE_BASE_URL}/images/', formatted)

    newsletter_content = f"""<!-- buttondown-editor-mode: plaintext -->
[**👉 Leia este ensaio completo e ilustrado no blog →**]({post_url})

{formatted}

---
*Recebido de [Animo Tem · Bestiário Interior]({SITE_BASE_URL})*
"""
    return newsletter_content


def dispatch_buttondown(subject: str, body: str, dry_run: bool = False) -> bool:
    """Envia o conteúdo para a API do Buttondown."""
    if dry_run:
        log_info("[DRY-RUN] Envio simulado com sucesso. Nenhuma requisição enviada à API.")
        print("\n--- PREVIEW DO ASSUNTO ---")
        print(subject)
        print("\n--- PREVIEW DO CORPO (PRIMEIRAS 400 CARACTERES) ---")
        print(body[:400] + "\n...")
        return True

    if not BUTTONDOWN_API_KEY:
        log_error("BUTTONDOWN_API_KEY não foi encontrada nas variáveis de ambiente.")
        return False

    payload = {
        "subject": subject,
        "body": body,
        "status": "about_to_send",  # Envio direto para os assinantes
    }

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        BUTTONDOWN_API_URL,
        data=req_data,
        headers={
            "Authorization": f"Token {BUTTONDOWN_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
            "X-Buttondown-Live-Dangerously": "true",
        },
        method="POST",
    )

    log_info("Conectando à API do Buttondown para disparo da newsletter...")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp_body = resp.read().decode("utf-8")
            data = json.loads(resp_body)
            email_id = data.get("id", "desconhecido")
            archive_url = data.get("absolute_url", "")
            log_success(f"Newsletter disparada com sucesso! ID: {email_id}")
            if archive_url:
                log_info(f"Link do arquivo na Buttondown: {archive_url}")
            return True
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        log_error(f"Falha na API do Buttondown (HTTP {e.code}): {err_msg}")
        return False
    except Exception as e:
        log_error(f"Erro inesperado ao disparar Buttondown: {e}")
        return False


def main():
    args = sys.argv[1:]
    is_dry_run = "--dry-run" in args
    skip_poll = "--skip-poll" in args

    # Remove flags para obter possível argumento de caminho
    filtered_args = [a for a in args if not a.startswith("--")]
    target_post = filtered_args[0] if filtered_args else None

    # 1. Determina o arquivo do post alvo
    if not target_post:
        changed_posts = find_changed_posts_from_git()
        if changed_posts:
            target_post = changed_posts[0]
            log_info(f"Post detectado via git diff: {target_post}")
        else:
            target_post = find_latest_post_file()
            log_info(f"Nenhum diff específico encontrado. Usando post mais recente: {target_post}")

    if not target_post or not Path(target_post).exists():
        log_warning("Nenhum post Markdown válido foi encontrado para processamento. Encerrando.")
        sys.exit(0)

    # 2. Carrega metadados e conteúdo do post
    frontmatter, body = parse_post(target_post)
    title = frontmatter.get("title", "").strip()
    slug = frontmatter.get("slug", "").strip()

    if not title or not slug:
        log_error(f"Post {target_post} não possui título ou slug definidos.")
        sys.exit(1)

    log_info(f"Processando Post: '{title}'")
    log_info(f"Slug: {slug}")

    post_url = f"{SITE_BASE_URL}/posts/{slug}/"

    # 3. Tratamento de flag [skip netlify] no commit
    commit_msg = get_git_commit_message()
    if "[skip netlify]" in commit_msg.lower():
        log_warning("Detectado '[skip netlify]' no commit!")
        trigger_netlify_build_hook()

    # 4. Smoke Test Ativo (Portão de Qualidade Anti-404)
    if not skip_poll and not is_dry_run:
        is_live = smoke_test_url(post_url)
        if not is_live:
            log_error(
                "PORTÃO DE SEGURANÇA (FAIL-CLOSED) ATIVADO!\n"
                f"A página {post_url} não foi publicada a tempo no Netlify.\n"
                "O envio da newsletter foi CANCELADO para evitar links quebrados aos assinantes."
            )
            sys.exit(1)
    else:
        log_info("Etapa de Smoke Test ignorada (--skip-poll ou --dry-run ativado).")

    # 5. Formata e dispara a newsletter
    email_body = format_newsletter_body(body, slug, title)
    success = dispatch_buttondown(subject=title, body=email_body, dry_run=is_dry_run)

    if not success:
        log_error("O processo de envio da newsletter falhou.")
        sys.exit(1)

    log_success("Fluxo de newsletter concluído com 100% de integridade!")


if __name__ == "__main__":
    main()

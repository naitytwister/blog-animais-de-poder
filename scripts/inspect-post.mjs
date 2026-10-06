// @ts-check
import { chromium } from '@playwright/test';
import path from 'node:path';

const debugDir = path.resolve(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data Debug');
const resultsDir = path.resolve('test-results/social-share');

async function inspectPost() {
  const context = await chromium.launchPersistentContext(debugDir, {
    channel: 'chrome',
    headless: true,
  });

  const page = context.pages()[0] || (await context.newPage());
  await page.goto('https://www.facebook.com/groups/910793475294580/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Scroll down a bit to ensure post is visible
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(2000);

  await page.screenshot({ path: path.join(resultsDir, 'inspect-feed.png') });
  console.log('📸 Screenshot salvo em: test-results/social-share/inspect-feed.png');

  // Encontra todos os botões ou caixas de comentário
  const buttons = await page.$$eval('div[role="button"]', (els) => {
    return els.map(el => ({
      text: el.innerText || '',
      ariaLabel: el.getAttribute('aria-label') || ''
    })).filter(b => b.text.includes('Comentar') || b.ariaLabel.includes('Comentar') || b.text.includes('comentário'));
  });

  console.log('Botões de comentário encontrados:', buttons);

  const textboxes = await page.$$eval('div[role="textbox"]', (els) => {
    return els.map(el => ({
      ariaLabel: el.getAttribute('aria-label') || '',
      contentEditable: el.getAttribute('contenteditable') || ''
    }));
  });
  console.log('Caixas de texto encontradas:', textboxes);

  await context.close();
}

inspectPost().catch(console.error);

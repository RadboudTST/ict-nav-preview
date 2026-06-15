// One-off link cleanup: fix auto-linked plain-text domains.
// - Unlink instel-values / network paths / email suffixes (should be plain text)
// - Upgrade real sites from http:// to https://
import { readFileSync, writeFileSync } from 'fs';

const FILE = 'Final/ict-structuur-proposed (final).json';
const data = JSON.parse(readFileSync(FILE, 'utf8'));

const A = (href, inner) =>
  `<a rel="noopener noreferrer nofollow" class="text-[#E3000B] underline hover:text-[#730E04]" href="${href}">${inner}</a>`;

const fixes = [
  // --- UNLINK: not websites (instelwaarde / UNC-pad / e-mailsuffix) -> plain text ---
  ['unlink RU.nl (Wifi domein)', A('http://RU.nl', 'RU.nl'), 'RU.nl'],
  ['unlink ru.nl em (Wifi domein)', A('http://ru.nl', '<em>ru.nl</em>'), '<em>ru.nl</em>'],
  ['unlink cnas-wrkgrp (UNC)', A('http://cnas-wrkgrp.ru.nl', 'cnas-wrkgrp.ru.nl'), 'cnas-wrkgrp.ru.nl'],
  ['unlink cnas (UNC)', A('http://cnas.ru.nl', 'cnas.ru.nl'), 'cnas.ru.nl'],
  ['unlink @ru.nl (e-mailsuffix)', A('http://ru.nl', 'ru.nl'), 'ru.nl'],

  // --- UPGRADE: real sites http:// -> https:// ---
  ['https account.ru.nl', A('http://account.ru.nl', 'account.ru.nl'), A('https://account.ru.nl', 'account.ru.nl')],
  ['https office.com plain', A('http://office.com', 'office.com'), A('https://office.com', 'office.com')],
  ['https office.com strong', A('http://office.com', '<strong>office.com</strong>'), A('https://office.com', '<strong>office.com</strong>')],
  ['https Outlook.office.com', A('http://Outlook.office.com', '<u>Outlook.office.com</u>'), A('https://outlook.office.com', '<u>Outlook.office.com</u>')],
  ['https peage.ru.nl', A('http://peage.ru.nl', '<u>peage.ru.nl</u>'), A('https://peage.ru.nl', '<u>peage.ru.nl</u>')],
  ['https checkjelinkje', A('http://www.checkjelinkje.nl', '<u>www.checkjelinkje.nl</u>'), A('https://www.checkjelinkje.nl', '<u>www.checkjelinkje.nl</u>')],
];

const counts = Object.fromEntries(fixes.map((f) => [f[0], 0]));
function apply(str) {
  if (typeof str !== 'string') return str;
  let out = str;
  for (const [label, from, to] of fixes) {
    if (out.includes(from)) {
      counts[label] += out.split(from).length - 1;
      out = out.split(from).join(to);
    }
  }
  return out;
}
for (const cat of data.structuur) {
  if (cat.beschrijving) cat.beschrijving = apply(cat.beschrijving);
  if (cat.inhoud) cat.inhoud = apply(cat.inhoud);
  for (const p of cat.paginas || []) {
    if (p.beschrijving) p.beschrijving = apply(p.beschrijving);
    if (p.inhoud) p.inhoud = apply(p.inhoud);
    if (p.intro) p.intro = apply(p.intro);
  }
}
console.log('Fix counts:');
const missing = [];
for (const [label] of fixes) {
  console.log(`  ${counts[label] > 0 ? 'OK ' : '!! '} ${counts[label]}  ${label}`);
  if (counts[label] === 0) missing.push(label);
}
writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
console.log('\nWritten:', FILE);
if (missing.length) console.log('WARNING 0-match:', missing.join(', '));

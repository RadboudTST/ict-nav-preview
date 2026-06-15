// One-off content improvements (round 2): clickable URLs (A), readability (C).
// Targeted string replacements on Final/ict-structuur-proposed (final).json.
import { readFileSync, writeFileSync } from 'fs';

const FILE = 'Final/ict-structuur-proposed (final).json';
const data = JSON.parse(readFileSync(FILE, 'utf8'));

const A = (url) =>
  `<a rel="noopener noreferrer nofollow" class="text-[#E3000B] underline hover:text-[#730E04]" href="${url}">${url}</a>`;

const PRINTEN = A('https://printen.ru.nl');
const FILESENDER = A('https://filesender.surf.nl');

// inline 1)..5) -> <ol> (C2)
const oldOl =
  "<br>1) Druk linksboven op 'bestand'<br>2) Druk op 'account instellingen' en dan nogmaals 'account instellingen'<br>3) Dubbelklik op je e-mail adres en klik op 'meer instellingen'<br>4) Voeg bij het tabblad 'geavanceerd' het postvak toe (volledige e-mail adres invullen)<br>5) Sla de wijziging op en herstart eventueel Outlook, controleer daarna of de mailbox links in het rijtje staat";
const newOl =
  "<ol><li><p>Druk linksboven op 'bestand'.</p></li><li><p>Druk op 'account instellingen' en dan nogmaals 'account instellingen'.</p></li><li><p>Dubbelklik op je e-mailadres en klik op 'meer instellingen'.</p></li><li><p>Voeg bij het tabblad 'geavanceerd' het postvak toe (volledige e-mailadres invullen).</p></li><li><p>Sla de wijziging op en herstart eventueel Outlook, controleer daarna of de mailbox links in het rijtje staat.</p></li></ol>";

// [label, from, to]
const fixes = [
  // A — clickable URLs (each unique by trailing context)
  ['A1 printen Daar', "op https://printen.ru.nl. Daar log je", `op ${PRINTEN}. Daar log je`],
  ['A2 printen </p>', "op https://printen.ru.nl.</p>", `op ${PRINTEN}.</p>`],
  ['A3 printen (Let', "ga naar https://printen.ru.nl ‎(Let op:", `ga naar ${PRINTEN} ‎(Let op:`],
  ['A4 filesender', "Ga naar: https://filesender.surf.nl en log in", `Ga naar: ${FILESENDER} en log in`],
  // C1 — redundant first <h2> equal to page title (remove the heading element only)
  ['C1 wifi', '<h2>Wifi (eduroam) instellen</h2>', ''],
  ['C1 bestanden delen', '<h2>Bestanden veilig delen en opslaan</h2>', ''],
  ['C1 informatiebeheer', '<h2>Hulp bij informatiebeheer</h2>', ''],
  ['C1 versleuteld', '<h2>Bestanden versleuteld versturen met Filesender</h2>', ''],
  ['C1 printen kop', '<h2>Printen</h2>', ''],
  // C2 — inline numbered list -> <ol>
  ['C2 ol', oldOl, newOl],
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

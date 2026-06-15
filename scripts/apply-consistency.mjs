// One-off consistency pass (bucket B): identifier term, phone format, location naming.
// Targeted string replacements on Final/ict-structuur-proposed (final).json.
import { readFileSync, writeFileSync } from 'fs';

const FILE = 'Final/ict-structuur-proposed (final).json';
const data = JSON.parse(readFileSync(FILE, 'utf8'));

const fixes = [
  // B1 — U/E/Z identifier -> "Radboud-nummer" (account = mailadres stays Radboud-account)
  ['B1 USEZ accountnummer', 'inloggen met jouw accountnummer', 'inloggen met jouw Radboud-nummer'],
  ['B1 unieke accountnummer', 'met je unieke accountnummer en wachtwoord', 'met je Radboud-nummer en wachtwoord'],
  ['B1 u-nummer', '(u-nummer en wachtwoord)', '(Radboud-nummer en wachtwoord)'],
  ['B1 U E of S nummer', 'pincode of U, E of S nummer', 'pincode of Radboud-nummer'],

  // B2 — phone numbers -> national format "024 xxx xx xx"
  ['B2 helpdesk', '+31 24 362 22 22', '024 362 22 22'],
  ['B2 konica', '+31 24 365 59 55', '024 365 59 55'],
  ['B2 div', '024-3612525', '024 361 25 25'],

  // B3 — location naming -> "ICT Servicepunt in de Universiteitsbibliotheek"
  ['B3 los Servicepunt inleveren', 'inleveren bij het Servicepunt in de Universiteitsbibliotheek', 'inleveren bij het ICT Servicepunt in de Universiteitsbibliotheek'],
  ['B3 hal van de UB', 'het ICT Servicepunt in hal van de UB (Erasmuslaan 36)', 'het ICT Servicepunt in de Universiteitsbibliotheek (Erasmuslaan 36)'],
  ['B3 Centrale Bibliotheek (nbsp)', 'in de Centrale Bibliotheek', 'in de Universiteitsbibliotheek'],
  ['B3 Centrale Bibliotheek (entity)', 'in de&nbsp;Centrale Bibliotheek', 'in de&nbsp;Universiteitsbibliotheek'],
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

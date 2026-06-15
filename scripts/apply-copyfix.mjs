// One-off Dutch copy-correction pass for Final/ict-structuur-proposed (final).json
// Loads JSON, applies targeted string fixes to inhoud/beschrijving fields,
// reports a count per fix, writes back preserving UTF-8 (ensure_ascii=False equivalent).
import { readFileSync, writeFileSync } from 'fs';

const FILE = 'Final/ict-structuur-proposed (final).json';
const data = JSON.parse(readFileSync(FILE, 'utf8'));

// Each fix: [label, from, to]. Applied across every inhoud + beschrijving string.
// Counts reported; a 0-count fix is flagged so we notice if markup shifted.
const fixes = [
  // --- A. clear errors ---
  ['A1 wachtwoord kleine letter', 'moet minstens bevatten 1 kleine letters', 'moet minstens 1 kleine letter bevatten'],
  ['A2 wachtwoord hoofdletter', 'moet minstens bevatten 1 hoofdletters', 'moet minstens 1 hoofdletter bevatten'],
  ['A3 wachtwoord 2 letters', 'moet minstens bevatten 2 letters', 'moet minstens 2 letters bevatten'],
  ['A4 wachtwoord cijfer', 'moet minstens bevatten 1 cijfers', 'moet minstens 1 cijfer bevatten'],
  ['A5 wachtwoord speciaal', 'moet minstens bevatten 1 speciale lettertekens', 'moet minstens 1 speciaal letterteken bevatten'],
  ['A6 Religiewetenschappen', 'Reiligiewetenschappen', 'Religiewetenschappen'],
  ['A7 to this computer', 'connections tot his computer', 'connections to this computer'],
  ['A8 dubbel met de met', 'Verbind nu opnieuw met de met behulp van de instructies', 'Verbind nu opnieuw met behulp van de instructies'],
  ['A9 dubbel de die', 'kies de die optie die voor jou', 'kies de optie die voor jou'],
  ['A10 groep mensen zijn', 'die van de groep mensen is waarmee je samenwerkt', 'die van de groep mensen zijn waarmee je samenwerkt'],
  ['A11 verantwoordelijkheid', 'het is je eigen verantwoordelijk als je', 'het is je eigen verantwoordelijkheid als je'],
  ['A12 MFA vereist', 'een service wilt gebruiken die MFA benodigd heeft', 'een service wilt gebruiken die MFA vereist'],
  ['A13 phishing zin afsluiten', "bevestig snel,&nbsp;", "bevestig snel.'&nbsp;"],
  // --- B. style / clarity ---
  ['B1 laatst gebruikte', '10 recentst gebruikte', '10 laatst gebruikte'],
  ['B2 macOS', 'MacOS', 'macOS'],
  ['B3 Microsoft 365', 'Microsoft365', 'Microsoft 365'],
  ['B4 SURFspot', 'Surfspot', 'SURFspot'],
  ['B5 SelfService Portal', 'SelfServicePortal', 'SelfService Portal'],
  ['B6 office.com ligature', 'oﬃce.com', 'office.com'],
  ['B7 eduroam mid-sentence 1', 'dat je Eduroam eerst moet vergeten', 'dat je eduroam eerst moet vergeten'],
  ["B8 eduroam mid-sentence 2", "op het 'Eduroam' netwerk", "op het 'eduroam' netwerk"],
  ['B9 ja. Eduroam newline', 'kies dan voor ja.<br>eduroam zal hierna', 'kies dan voor ja.<br>Eduroam zal hierna'],
  ['B10 remove leaked note', '<u>Wifi-verbinding opnieuw instellen</u>(Hier een link van maken naar de bedoelde pagina)', '<u>Wifi-verbinding opnieuw instellen</u>'],
];

const counts = Object.fromEntries(fixes.map((f) => [f[0], 0]));

function apply(str) {
  if (typeof str !== 'string') return str;
  let out = str;
  for (const [label, from, to] of fixes) {
    if (out.includes(from)) {
      const n = out.split(from).length - 1;
      counts[label] += n;
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

// bump export date metadata note
console.log('Fix counts:');
let missing = [];
for (const [label] of fixes) {
  console.log(`  ${counts[label] > 0 ? 'OK ' : '!! '} ${String(counts[label]).padStart(2)}  ${label}`);
  if (counts[label] === 0) missing.push(label);
}

writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
console.log('\nWritten:', FILE);
if (missing.length) {
  console.log('\nWARNING — these fixes matched 0 times (verify):');
  missing.forEach((m) => console.log('  ', m));
}

/**
 * Generates GoEvee's placeholder art as small local SVGs in public/mock/:
 * the hero charging plaza (day + night), dusk station thumbnails with fictional
 * canopy brands, and unbranded vehicle renders. No real car-maker or network
 * marks. Run: node scripts/generate-mock-art.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = 'public/mock';

/* ---------- Shared car (side profile, nose left; local origin = front wheel line on the ground) ---------- */
function car({ id, body, bodyMid, bodyLow, glass, glassHi, trim, rim, lights = 'day', port = false }) {
  const head = lights === 'night' ? '#FFF7E0' : '#EAF2F8';
  const tail = '#E5484D';
  return `
  <defs>
    <linearGradient id="${id}-body" x1="0" y1="-112" x2="0" y2="-22" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${body}"/><stop offset=".55" stop-color="${bodyMid}"/><stop offset="1" stop-color="${bodyLow}"/>
    </linearGradient>
    <linearGradient id="${id}-glass" x1="120" y1="-107" x2="280" y2="-82" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${glass}"/><stop offset="1" stop-color="${glassHi}"/>
    </linearGradient>
    <radialGradient id="${id}-rim" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="${rim}"/><stop offset="1" stop-color="#5E6873"/></radialGradient>
  </defs>
  <path fill="url(#${id}-body)" d="M6-22C0-24 0-40 2-48l4-12c2-4 8-6 16-7l70-9c8-1 14-4 18-8l30-24c4-3 10-4 16-4h90c12 0 18 2 24 8l22 22c4 4 6 10 6 18l2 24c0 10-2 16-8 18h-20a36 36 0 0 0-72 0H102a36 36 0 0 0-72 0Z"/>
  <path fill="url(#${id}-glass)" d="M118-82 142-104c3-2 7-3 11-3h91c8 0 13 2 17 6l19 19Z"/>
  <path fill="#FFFFFF" opacity=".14" d="M150-107h22l-26 25h-22Z"/>
  <rect x="188" y="-107" width="8" height="25" fill="${trim}"/>
  <path d="M30-60c80-4 180-8 262-6" stroke="#FFFFFF" stroke-opacity=".28" stroke-width="2" fill="none"/>
  <path d="M112-84l12-2 2 6h-12Z" fill="${trim}"/>
  <rect x="150" y="-75" width="14" height="3" rx="1.5" fill="${trim}" opacity=".7"/>
  <rect x="222" y="-75" width="14" height="3" rx="1.5" fill="${trim}" opacity=".7"/>
  <path d="M26-22a40 40 0 0 1 80 0M196-22a40 40 0 0 1 80 0" stroke="${trim}" stroke-width="7" fill="none"/>
  <path d="M8-62l26-4" stroke="${head}" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M284-78l14 8" stroke="${tail}" stroke-width="4" stroke-linecap="round"/>
  ${port ? '<rect x="258" y="-66" width="11" height="8" rx="2" fill="#0F172A" stroke="#22C55E" stroke-width="1.5"/>' : ''}
  ${[66, 236].map(cx => `
  <circle cx="${cx}" cy="-30" r="28" fill="#1C2127"/>
  <circle cx="${cx}" cy="-30" r="18" fill="url(#${id}-rim)"/>
  <g stroke="#3A424B" stroke-width="2.4" stroke-linecap="round">${[0, 72, 144, 216, 288].map(a => {
    const r = (a * Math.PI) / 180;
    return `<path d="M${cx + Math.cos(r) * 5} ${-30 + Math.sin(r) * 5}L${(cx + Math.cos(r) * 16).toFixed(1)} ${(-30 + Math.sin(r) * 16).toFixed(1)}"/>`;
  }).join('')}</g>
  <circle cx="${cx}" cy="-30" r="4" fill="#4A535D"/>`).join('')}`;
}

/* ---------- Hero plaza ---------- */
function hero(mode) {
  const night = mode === 'night';
  const p = night
    ? { sky0: '#0A1322', sky1: '#16243A', tower: ['#18243A', '#1C2A41', '#152033'], window: '#F6C177', tree: ['#0F241A', '#122C20'], ground0: '#141C27', ground1: '#0C1219', under: '#1B2531', fascia: '#283341', edge: '#34D399', column: '#212B37', light: '#FFF4D6', lane: '#2A3542' }
    : { sky0: '#E7F1F9', sky1: '#F7FAFC', tower: ['#D8E2EC', '#E1E9F0', '#D2DDE8'], window: '#F3F7FB', tree: ['#CBE6D2', '#BCDDC6'], ground0: '#EEF1F4', ground1: '#DFE5EB', under: '#EDF1F5', fascia: '#FFFFFF', edge: '#D9E0E7', column: '#E9EEF3', light: '#FFFFFF', lane: '#FFFFFF' };
  const towers = [[40, 260, 70], [120, 312, 50], [182, 222, 82], [280, 282, 60], [352, 238, 92], [470, 300, 62], [542, 208, 82], [640, 268, 72]];
  const carBody = night
    ? { body: '#7A838D', bodyMid: '#59626C', bodyLow: '#3B424A', glass: '#141B23', glassHi: '#2B3A4A', trim: '#20262D', rim: '#9AA3AD' }
    : { body: '#C9D0D7', bodyMid: '#A9B2BB', bodyLow: '#7C8690', glass: '#2D3946', glassHi: '#5A6C80', trim: '#2E353D', rim: '#D3D9DF' };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky0}"/><stop offset="1" stop-color="${p.sky1}"/></linearGradient>
  <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.ground0}"/><stop offset="1" stop-color="${p.ground1}"/></linearGradient>
  <linearGradient id="pillar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2B343E"/><stop offset=".6" stop-color="#1A2129"/><stop offset="1" stop-color="#11161C"/></linearGradient>
  <filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.4"/></filter>
  <filter id="glow" x="-200%" y="-20%" width="500%" height="140%"><feGaussianBlur stdDeviation="${night ? 9 : 5}"/></filter>
  <filter id="shadow" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="7"/></filter>
</defs>
<rect width="800" height="600" fill="url(#sky)"/>
<g filter="url(#soft)" opacity="${night ? 1 : 0.95}">
  ${towers.map(([x, y, w], i) => `<rect x="${x}" y="${y}" width="${w}" height="${470 - y}" fill="${p.tower[i % 3]}"/>`).join('')}
  ${towers.flatMap(([x, y, w], i) => Array.from({ length: Math.floor((470 - y) / 26) }, (_, row) =>
    `<rect x="${x + 8}" y="${y + 12 + row * 26}" width="${w - 16}" height="6" rx="1" fill="${p.window}" opacity="${night ? (0.25 + ((i + row) % 3) * 0.2).toFixed(2) : 0.55}"/>`)).join('')}
  <g fill="${p.tree[0]}"><ellipse cx="60" cy="462" rx="62" ry="30"/><ellipse cx="230" cy="458" rx="70" ry="34"/><ellipse cx="420" cy="464" rx="64" ry="26"/><ellipse cx="610" cy="460" rx="58" ry="30"/></g>
  <g fill="${p.tree[1]}"><ellipse cx="140" cy="466" rx="50" ry="24"/><ellipse cx="330" cy="468" rx="48" ry="20"/><ellipse cx="520" cy="466" rx="52" ry="22"/><ellipse cx="720" cy="466" rx="60" ry="22"/></g>
</g>
<rect y="470" width="800" height="130" fill="url(#ground)"/>
<g stroke="${p.lane}" stroke-opacity="${night ? 0.5 : 0.9}" stroke-width="3" fill="none"><path d="M300 600 360 472M560 600 548 472M800 590 720 472"/></g>
<path d="M110 0h690v70L140 96Z" fill="${p.under}"/>
${[220, 330, 440, 550, 660].map((x, i) => `<ellipse cx="${x}" cy="${74 - i * 4}" rx="16" ry="3.5" fill="${p.light}"${night ? ' filter="url(#glow)"' : ''}/><ellipse cx="${x}" cy="${74 - i * 4}" rx="9" ry="2" fill="${p.light}"/>`).join('')}
<path d="M140 96 800 70v30L140 126Z" fill="${p.fascia}"/>
<path d="M140 126 800 100" stroke="${p.edge}" stroke-width="${night ? 3 : 2}"${night ? ' filter="url(#glow)"' : ''}/>
<path d="M140 126 800 100" stroke="${p.edge}" stroke-width="1.5"/>
<rect x="748" y="100" width="26" height="430" fill="${p.column}"/>
<rect x="748" y="100" width="8" height="430" fill="#FFFFFF" opacity="${night ? 0.04 : 0.6}"/>
<ellipse cx="492" cy="526" rx="176" ry="11" fill="#0F172A" opacity="${night ? 0.55 : 0.2}" filter="url(#shadow)"/>
<g transform="translate(340 524)">${car({ id: `hero-${mode}`, ...carBody, lights: night ? 'night' : 'day', port: true })}</g>
<path d="M707 356c-14 74-56 140-90 132-8-2-12-12-11-24" stroke="#12171D" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M707 356c-14 74-56 140-90 132" stroke="#FFFFFF" stroke-opacity=".12" stroke-width="2" fill="none" stroke-linecap="round"/>
<rect x="642" y="520" width="80" height="14" rx="4" fill="${night ? '#202A35' : '#CBD3DB'}"/>
<rect x="652" y="212" width="60" height="316" rx="18" fill="url(#pillar)"/>
<rect x="658" y="222" width="48" height="296" rx="14" fill="#FFFFFF" opacity=".04"/>
<rect x="663" y="300" width="7" height="200" rx="3.5" fill="#22C55E" filter="url(#glow)" opacity="${night ? 1 : 0.85}"/>
<rect x="664.5" y="300" width="4" height="200" rx="2" fill="${night ? '#86EFAC' : '#4ADE80'}"/>
<rect x="674" y="232" width="30" height="54" rx="6" fill="#0C1116"/>
<path d="M691.5 241.5 682 258h7l-2.5 13 10-17h-7l2-12.5Z" fill="#4ADE80" filter="url(#glow)"/>
<path d="M691.5 241.5 682 258h7l-2.5 13 10-17h-7l2-12.5Z" fill="#86EFAC"/>
<rect x="704" y="330" width="12" height="34" rx="4" fill="#0E1318"/>
${night ? '<ellipse cx="672" cy="532" rx="70" ry="9" fill="#22C55E" opacity=".28" filter="url(#glow)"/>' : ''}
</svg>
`;
}

/* ---------- Dusk station thumbnail (336×208) ---------- */
function station({ brand, accent, chargers, carAt, towers, warm = '#E39A63', trees = 3 }) {
  const id = brand.toLowerCase();
  const xs = Array.from({ length: chargers }, (_, i) => 70 + (i * 200) / Math.max(1, chargers - 1));
  const carBody = { body: '#59616B', bodyMid: '#3E454E', bodyLow: '#2A2F35', glass: '#10161C', glassHi: '#24303C', trim: '#1A1E23', rim: '#8E98A3' };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 336 208" width="336" height="208">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1D2A4A"/><stop offset=".55" stop-color="#4C406C"/><stop offset="1" stop-color="${warm}"/></linearGradient>
  <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#242C3B"/><stop offset="1" stop-color="#151B26"/></linearGradient>
  <filter id="glow" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>
</defs>
<rect width="336" height="208" fill="url(#sky)"/>
<ellipse cx="250" cy="128" rx="120" ry="28" fill="#F7C38A" opacity=".35" filter="url(#glow)"/>
<g fill="#1B2235">${towers.map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${132 - y}"/>`).join('')}</g>
<g fill="#F7C77B">${towers.flatMap(([x, y, w], i) => Array.from({ length: Math.floor((128 - y) / 10) }, (_, row) =>
    `<rect x="${x + 4 + ((row + i) % 2) * 6}" y="${y + 6 + row * 10}" width="4" height="3" opacity="${(0.35 + ((row * 7 + i) % 5) * 0.12).toFixed(2)}"/>`)).join('')}</g>
<g fill="#141D24">${Array.from({ length: trees }, (_, i) => `<ellipse cx="${20 + i * 110}" cy="128" rx="34" ry="14"/>`).join('')}</g>
<rect y="128" width="336" height="80" fill="url(#ground)"/>
<ellipse cx="168" cy="170" rx="150" ry="22" fill="${accent}" opacity=".16" filter="url(#glow)"/>
<g stroke="#FFFFFF" stroke-opacity=".18" stroke-width="1.5">${xs.map(x => `<path d="M${x - 22} 208 ${x - 16} 160"/>`).join('')}</g>
<rect x="36" y="62" width="7" height="110" fill="#AEB6C2"/><rect x="293" y="62" width="7" height="110" fill="#AEB6C2"/>
<path d="M14 40h308v20H14Z" fill="#EEF1F5"/>
<path d="M14 60h308v6H14Z" fill="#2B3445"/>
${[50, 110, 168, 226, 286].map(x => `<ellipse cx="${x}" cy="67" rx="12" ry="3" fill="#FFF1CF" filter="url(#glow)"/><ellipse cx="${x}" cy="66.5" rx="6" ry="1.4" fill="#FFF8E6"/>`).join('')}
<rect x="104" y="35" width="128" height="30" rx="5" fill="#111827"/>
<rect x="104" y="35" width="128" height="30" rx="5" fill="none" stroke="${accent}" stroke-width="2"/>
<text x="168" y="55.5" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" letter-spacing=".4" fill="#FFFFFF">${brand}</text>
<circle cx="117" cy="50" r="4" fill="${accent}"/>
${xs.map(x => `
<ellipse cx="${x}" cy="166" rx="12" ry="2.5" fill="#000000" opacity=".35"/>
<rect x="${x - 9}" y="112" width="18" height="54" rx="5" fill="#F1F4F7"/>
<rect x="${x - 6}" y="118" width="12" height="13" rx="2" fill="#0F172A"/>
<rect x="${x - 5}" y="120" width="10" height="9" rx="1.5" fill="${accent}" opacity=".55"/>
<rect x="${x + 4}" y="136" width="2.5" height="24" rx="1.25" fill="${accent}" filter="url(#glow)"/>
<rect x="${x + 4}" y="136" width="2.5" height="24" rx="1.25" fill="${accent}"/>`).join('')}
${carAt == null ? '' : `<g transform="translate(${carAt} 176) scale(.42)">${car({ id: `${id}-car`, ...carBody, lights: 'night' })}</g>
<ellipse cx="${carAt + 4}" cy="150" rx="12" ry="3" fill="#FFF7E0" opacity=".7" filter="url(#glow)"/>`}
<rect y="186" width="336" height="22" fill="#0B0F17" opacity=".35"/>
</svg>
`;
}

const STATIONS = [
  { slug: 'chargehub-city-centre', brand: 'ChargeHub', accent: '#22C55E', chargers: 4, carAt: 190, towers: [[10, 70, 34], [52, 86, 26], [90, 64, 40], [220, 76, 30], [262, 58, 44], [300, 84, 30]] },
  { slug: 'voltpoint-expressway', brand: 'VoltPoint', accent: '#3B82F6', chargers: 4, carAt: 40, warm: '#EE8F5A', towers: [[0, 92, 30], [60, 98, 24], [250, 90, 34], [300, 96, 36]] },
  { slug: 'electrago-tech-park', brand: 'ElectraGo', accent: '#A855F7', chargers: 3, carAt: 196, towers: [[14, 50, 52], [80, 76, 30], [230, 46, 56], [292, 70, 40]] },
  { slug: 'plugpoint-botanical-garden', brand: 'PlugPoint', accent: '#F97316', chargers: 2, carAt: 120, trees: 4, towers: [[30, 96, 24], [280, 94, 30]] },
  { slug: 'greenwatt-hub', brand: 'GreenWatt', accent: '#84CC16', chargers: 4, carAt: null, towers: [[8, 80, 36], [70, 92, 22], [240, 72, 38], [296, 86, 34]] },
  { slug: 'sparklane-galleria', brand: 'SparkLane', accent: '#EAB308', chargers: 3, carAt: 34, warm: '#F0A86A', towers: [[20, 62, 44], [90, 80, 28], [212, 66, 40], [276, 56, 50]] },
  { slug: 'wattway-pari-chowk', brand: 'WattWay', accent: '#06B6D4', chargers: 4, carAt: null, warm: '#D98D63', towers: [[0, 88, 40], [256, 84, 36], [300, 92, 36]] },
];

/* ---------- Vehicles (transparent, 152×88) ---------- */
function suvThumb() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 88" width="152" height="88">
<defs><filter id="s" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
<ellipse cx="76" cy="81" rx="66" ry="4" fill="#0F172A" opacity=".22" filter="url(#s)"/>
<g transform="translate(4 81) scale(.48)">${car({ id: 'suv', body: '#C9D0D7', bodyMid: '#A6AFB8', bodyLow: '#78828C', glass: '#2D3946', glassHi: '#5A6C80', trim: '#2E353D', rim: '#D3D9DF' })}</g>
</svg>
`;
}

function scooterThumb() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 88" width="152" height="88">
<defs>
  <linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3F5F8"/><stop offset="1" stop-color="#B9C2CB"/></linearGradient>
  <filter id="s" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="2"/></filter>
</defs>
<ellipse cx="78" cy="82" rx="58" ry="3.5" fill="#0F172A" opacity=".22" filter="url(#s)"/>
<path d="M52 61 37 70" stroke="#5E6873" stroke-width="5" stroke-linecap="round"/>
<path d="M110 62 118 70" stroke="#5E6873" stroke-width="5" stroke-linecap="round"/>
${[[36, 68], [118, 68]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="13" fill="#1C2127"/><circle cx="${cx}" cy="${cy}" r="7.5" fill="#A8B1BA"/><circle cx="${cx}" cy="${cy}" r="2.5" fill="#4A535D"/>`).join('')}
<path d="M40 16h9l14 45-9 3Z" fill="url(#b)"/>
<path d="M36 15c4-2 12-3 18-2" stroke="#2B323A" stroke-width="3.2" stroke-linecap="round" fill="none"/>
<ellipse cx="45.5" cy="24" rx="3.6" ry="2.6" fill="#EAF2F8"/>
<rect x="55" y="57" width="42" height="7" rx="3.5" fill="#3B434C"/>
<path d="M72 61c2-14 12-21 28-21h28c7 0 10 4 8 10l-6 12c-3 5-9 8-17 8H86c-8 0-14-3-14-9Z" fill="url(#b)"/>
<path d="M92 33h38c4 0 6 4 2 7H96Z" fill="#262C33"/>
<path d="M82 56c12-2 32-2 48-6" stroke="#16A34A" stroke-width="2.2" stroke-linecap="round" fill="none"/>
<path d="M131 47l5 2" stroke="#E5484D" stroke-width="3" stroke-linecap="round"/>
</svg>
`;
}

await mkdir(`${OUT}/stations`, { recursive: true });
await mkdir(`${OUT}/vehicles`, { recursive: true });
await writeFile(`${OUT}/hero-plaza-day.svg`, hero('day'));
await writeFile(`${OUT}/hero-plaza-night.svg`, hero('night'));
for (const item of STATIONS) await writeFile(`${OUT}/stations/${item.slug}.svg`, station(item));
await writeFile(`${OUT}/vehicles/compact-suv.svg`, suvThumb());
await writeFile(`${OUT}/vehicles/e-scooter.svg`, scooterThumb());
console.log(`Wrote hero (2), ${STATIONS.length} station thumbnails and 2 vehicle renders to ${OUT}/`);

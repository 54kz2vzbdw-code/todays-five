// Instrument for "62 of the 314 hex tokens in the finished table appear nowhere in theme.js's source"
// and for the white-clock contrast per kit. Usage: node kit-tokens.mjs <repo-root>
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const root = process.argv[2];
const src = readFileSync(root + '/theme.js', 'utf8').toUpperCase();
const fx = JSON.parse(readFileSync(root + '/test/fixtures/kits.json', 'utf8'));
const kits = Array.isArray(fx.kits) ? fx.kits : Object.values(fx.kits);
const HEX = /^#[0-9A-F]{6}$/i;
const collect = (v, out, path) => { if (typeof v === 'string' && HEX.test(v)) out.push([v.toUpperCase(), path]); else if (Array.isArray(v)) v.forEach((x, i) => collect(x, out, path + '[' + i + ']')); else if (v && typeof v === 'object') for (const k of Object.keys(v)) collect(v[k], out, path + '.' + k); };
function report(label, list) {
  const all = []; list.forEach(k => collect(k, all, k.id));
  const missing = all.filter(([h]) => !src.includes(h));
  const kitsWith = new Set(missing.map(([, p]) => p.split('.')[0]));
  console.log(`${label}: tokens=${all.length} distinct=${new Set(all.map(a => a[0])).size} absentFromSource=${missing.length} distinctAbsent=${new Set(missing.map(a => a[0])).size} kitsWithAtLeastOne=${kitsWith.size}/${list.length}`);
  return missing;
}
console.log('kits:', kits.length, 'secret:', kits.filter(k => k.secret).length, 'pairs:', Object.keys(fx.pairs).length, 'hexTokens per kit (fixture says):', (fx.hexTokens || []).length);
report('all 18 kits, colors+confetti', kits);
report('16 open kits, colors+confetti', kits.filter(k => !k.secret));
report('all 18 kits, colors only', kits.map(k => ({ id: k.id, colors: k.colors })));
const miss16 = report('16 open kits, colors only', kits.filter(k => !k.secret).map(k => ({ id: k.id, colors: k.colors })));
report('all 18 kits, confetti only', kits.map(k => ({ id: k.id, confetti: k.confetti })));
const hs = kits.map(k => k.colors.hairSolid.toUpperCase()); console.log('hairSolid absent from source:', hs.filter(h => !src.includes(h)).length, 'of', hs.length);
for (const [id, hex] of [['harbor', 'accentText'], ['teletype', 'accent'], ['sketch', 'accent']]) { const k = kits.find(x => x.id === id); const v = k.colors[hex]; console.log(`${id}.${hex} = ${v} inSource=${src.includes(v.toUpperCase())}`); }
// white clock contrast
const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = h => 0.2126 * lin(parseInt(h.slice(1, 3), 16)) + 0.7152 * lin(parseInt(h.slice(3, 5), 16)) + 0.0722 * lin(parseInt(h.slice(5, 7), 16));
const cr = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const rows = kits.map(k => [k.id, k.base, k.colors.ink, cr('#FFFFFF', k.colors.ink).toFixed(2)]).sort((a, b) => a[3] - b[3]);
console.log('white #FFFFFF vs kit ink (ground), WCAG contrast ascending:'); rows.forEach(r => console.log('   ' + r.join('  ')));
console.log('light-base:', kits.filter(k => k.base === 'light').map(k => k.id).join(','), '=', kits.filter(k => k.base === 'light').length, '| day order light-base count:', fx.day.filter(id => kits.find(k => k.id === id).base === 'light').length, 'of', fx.day.length);
// pairs named by the open kits
const openPairs = new Set(kits.filter(k => !k.secret).map(k => k.pair)); console.log('pairs named by the 16 open kits:', openPairs.size, 'of', Object.keys(fx.pairs).length, '| unnamed:', Object.keys(fx.pairs).filter(p => !openPairs.has(p)).join(','));
// sizes
const mod = await import(pathToFileURL(root + '/theme.js').href);
console.log('JSON.stringify(CURATED).length =', JSON.stringify(mod.CURATED).length);
console.log('kits.json bytes =', readFileSync(root + '/test/fixtures/kits.json').length, '| expr length =', (fx.expr || '').length);
try { const f = new Function('CURATED', 'PAIRS', 'CURATED_DAY', 'CURATED_NIGHT', 'SECRET_IDS', 'return (' + fx.expr + ')'); const v = f(mod.CURATED, mod.PAIRS, mod.CURATED_DAY, mod.CURATED_NIGHT, mod.SECRET_IDS); console.log('expr(theme.js) JSON length =', JSON.stringify(v).length, '(the drift test compares this)'); } catch (e) { console.log('expr eval:', e.message.slice(0, 100)); }

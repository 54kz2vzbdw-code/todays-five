// scrim-contrast.mjs — white on the ClockScrim's fill (the kit's `text`) for every kit, with theme.js's own contrast().
import { pathToFileURL } from "node:url";
const T = await import(pathToFileURL(process.argv[2]).href);
for (const k of T.CURATED) {
  const c = k.colors; const onGround = T.contrast("#FFFFFF", c.ink), onScrim = T.contrast("#FFFFFF", c.text);
  console.log(`${k.id.padEnd(10)} ${k.base.padEnd(5)} ink=${c.ink} white/ink=${onGround.toFixed(2)} scrim=${onGround < 3} text=${c.text} white/text=${onScrim.toFixed(2)}`);
}

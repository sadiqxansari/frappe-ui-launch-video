// npm run still -- <CompId> <frame> [frame ...] [--sheet]
// Captures frames as PNGs into out/stills/<CompId>_<frame>.png; with more than
// one frame (or --sheet) also tiles them, two across, into out/stills/sheet_<CompId>.png.
import {mkdirSync, readdirSync, renameSync, rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {args, build, hyperframes, run} from './hf.mjs';

const a = args();
const [comp, ...frames] = a._;
if (!comp || frames.length === 0) {
	console.error('usage: npm run still -- <CompId> <frame> [frame ...]');
	process.exit(1);
}
const dir = `out/build/${comp}`;
const shots = resolve('out/stills/.snap');
rmSync(shots, {recursive: true, force: true});
mkdirSync(shots, {recursive: true});
build({comp, out: dir});
// frame f is shown from f/60 s; aim a quarter frame in so rounding can't slip
const at = frames.map((f) => ((Number(f) + 0.25) / 60).toFixed(4)).join(',');
// --describe false: never send frames to an outside vision model
hyperframes(['snapshot', '.', '--at', at, '--no-end', '--describe', 'false', '--output', shots], {cwd: dir});
const files = readdirSync(shots).filter((f) => f.endsWith('.png')).sort();
const outs = files.map((f, i) => {
	const to = resolve(`out/stills/${comp}_${frames[i]}.png`);
	renameSync(`${shots}/${f}`, to);
	return to;
});
rmSync(shots, {recursive: true, force: true});
if (outs.length > 1 || a.sheet) {
	const sheet = resolve(`out/stills/sheet_${comp}.png`);
	const layout = outs.map((_, i) => `${i % 2 ? 960 : 0}_${Math.floor(i / 2) * 540}`).join('|');
	const inputs = outs.flatMap((f) => ['-i', f]);
	const scaled = outs.map((_, i) => `[${i}]scale=960:540[s${i}]`).join(';');
	const refs = outs.map((_, i) => `[s${i}]`).join('');
	if (outs.length === 1) run('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-vf', 'scale=960:540', sheet]);
	else run('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', `${scaled};${refs}xstack=inputs=${outs.length}:layout=${layout}:fill=gray`, sheet]);
	console.log(sheet);
} else console.log(outs[0]);

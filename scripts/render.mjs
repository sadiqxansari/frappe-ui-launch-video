// npm run render -- [CompId] [--from N] [--to N] [--out out/film.mp4] [--workers 1] [--quality high]
// Renders a composition (default the whole film) to MP4 with HyperFrames.
// One worker by default: the stage's charts animate from the frame before,
// so their intros only land on the right frames when rendered in order.
import {resolve} from 'node:path';
import {args, build, hyperframes} from './hf.mjs';

const a = args();
const comp = a._[0] ?? 'FrappeUILaunch';
const dir = `out/build/${comp}`;
const output = resolve(a.out ?? `out/${comp}.mp4`);
build({comp, from: a.from, to: a.to, out: dir});
hyperframes(['render', '--low-memory-mode', '--fps', '60', '--quality', a.quality ?? 'high', '--workers', String(a.workers ?? 1), '--output', output], {cwd: dir});

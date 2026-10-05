// npm run studio -- [CompId]
// HyperFrames Studio on the film (or one composition): rebuilds on every save
// and the Studio reloads. Scrub, play, and step frames there.
import {args, build, spawn} from './hf.mjs';

const a = args();
const comp = a._[0] ?? 'FrappeUILaunch';
const dir = 'out/build/studio';
const env = {...process.env, COMP: comp, FROM: '0', TO: '0', OUT: dir};
build({comp, out: dir});
const watch = spawn('npx', ['vite', 'build', '--watch', '--logLevel', 'warn'], {stdio: 'inherit', env});
const studio = spawn('npx', ['hyperframes', 'preview', dir, '--port', String(a.port ?? 3002), '--foreground', ...(a['no-open'] ? ['--no-open'] : [])], {stdio: 'inherit'});
const stop = () => (watch.kill(), studio.kill(), process.exit());
process.on('SIGINT', stop);
studio.on('exit', stop);

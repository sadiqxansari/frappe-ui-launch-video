// Shared bits for the studio / still / render scripts.
import {spawnSync, spawn} from 'node:child_process';

/** `--key value` pairs and bare words from argv. */
export const args = (argv = process.argv.slice(2)) => {
	const out = {_: []};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a.startsWith('--')) out[a.slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
		else out._.push(a);
	}
	return out;
};

export const run = (cmd, argv, opts = {}) => {
	const r = spawnSync(cmd, argv, {stdio: 'inherit', ...opts});
	if (r.status !== 0) process.exit(r.status ?? 1);
};

/** Build one composition (optionally a frame range) into `out`. */
export const build = ({comp = 'FrappeUILaunch', from, to, out}, extra = []) =>
	run('npx', ['vite', 'build', '--logLevel', 'warn', ...extra], {
		env: {...process.env, COMP: comp, FROM: String(from ?? 0), TO: String(to ?? 0), OUT: out},
	});

export const hyperframes = (argv, opts) => run('npx', ['hyperframes', ...argv], opts);
export {spawn};

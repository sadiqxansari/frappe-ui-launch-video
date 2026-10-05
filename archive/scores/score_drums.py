"""Synthesised score for the v2 film: a drum-led track.

120 bpm, one beat = 30 frames, one bar = 120 frames at 60 fps, D minor. An
808 kick and bass, claps, swung hats, toms and percussion, a dark synth stab
now and then. The bar grid starts at GRID so the lockup lands on a downbeat;
the picture cues are scene starts plus the scene-local frames the React
scenes use (copied from each scene's constants: keep them in sync).

Run with numpy + scipy: ../fc-launch-video/.venv/bin/python scripts/score.py
"""

import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
FPS = 60
BEATF = 30
BARF = BEATF * 4
BEAT = BEATF / FPS
BAR = BARF / FPS
SWING = 0.58  # where the off sixteenth falls, as a fraction of the eighth

SCENES = dict(mark=338, one=2205, two=550, three=1199, end=909)
START = {}
_at = 0
for _k, _d in SCENES.items():
	START[_k] = _at
	_at += _d
TOTAL = _at
LOCKUP = START['end'] + 659
GRID = LOCKUP % BARF
DUR = TOTAL / FPS + 0.5
N = int(DUR * SR)
rng = np.random.default_rng(7)


def at(scene, frame=0):
	return (START[scene] + frame) / FPS


def bar_t(b):
	return (GRID + b * BARF) / FPS


def bar_of(scene, frame=0):
	return (START[scene] + frame - GRID) / BARF


def t_(dur):
	return np.arange(int(dur * SR)) / SR


def lp(x, fc, order=2):
	return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x, axis=0)


def hp(x, fc, order=2):
	return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x, axis=0)


def bp(x, lo, hi, order=2):
	return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=0)


def midi(n):
	return 440 * 2 ** ((n - 69) / 12)


def noise(n):
	return rng.standard_normal(n)


buses = {k: np.zeros((N, 2)) for k in ('kick', 'bass', 'drums', 'perc', 'synth', 'fx')}


def put(bus, sig, t0, gain=1.0, pan=0.0):
	i = int(t0 * SR)
	if i >= N or i < 0:
		return
	if sig.ndim == 1:
		l = np.cos((pan + 1) * np.pi / 4)
		r = np.sin((pan + 1) * np.pi / 4)
		sig = np.stack([sig * l, sig * r], axis=1) * np.sqrt(2)
	j = min(N, i + len(sig))
	buses[bus][i:j] += sig[: j - i] * gain


# ---------- kit
def kick(k=1.0):
	t = t_(0.5)
	f = 46 + 140 * np.exp(-t * 32)
	body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
	click = hp(noise(len(t)), 2500) * np.exp(-t * 400) * 0.35
	return np.tanh((body + click) * 1.8 * k) * 0.85


def bass808(note, dur, glide_from=None):
	t = t_(dur + 0.08)
	f0 = midi(note)
	f = f0 if glide_from is None else f0 + (midi(glide_from) - f0) * np.exp(-t * 18)
	f = f * (1 + 0.6 * np.exp(-t * 40))
	x = np.sin(2 * np.pi * np.cumsum(f) / SR)
	env = np.minimum(1, t * 400) * np.exp(-t * 0.9) * np.clip((dur + 0.08 - t) / 0.08, 0, 1)
	return np.tanh(x * 2.2) * env * 0.42


def clap(v=1.0):
	t = t_(0.35)
	n = bp(noise(len(t)), 900, 5200)
	e = np.zeros_like(t)
	for d in (0, 0.011, 0.022):
		e += (t >= d) * np.exp(-np.clip(t - d, 0, None) * 160)
	e += (t >= 0.03) * np.exp(-np.clip(t - 0.03, 0, None) * 18) * 0.6
	return n * e * 0.3 * v


def snare(v=1.0):
	t = t_(0.3)
	tone = np.sin(2 * np.pi * (190 + 60 * np.exp(-t * 50)) * t) * np.exp(-t * 25)
	n = bp(noise(len(t)), 1500, 9000) * np.exp(-t * 22)
	return (tone * 0.5 + n) * 0.3 * v


def hat(open_=False, v=1.0):
	dur = 0.32 if open_ else 0.05
	t = t_(dur)
	metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (317, 421, 555, 733, 891, 1103))
	x = hp(metal * 0.3 + noise(len(t)), 7000)
	return x * np.exp(-t * (9 if open_ else 90)) * 0.07 * v


def rim(v=1.0):
	t = t_(0.06)
	return (np.sin(2 * np.pi * 1700 * t) + 0.5 * np.sin(2 * np.pi * 3400 * t)) * np.exp(-t * 120) * 0.2 * v


def tom(note, v=1.0):
	t = t_(0.45)
	f = midi(note) * (1 + 0.5 * np.exp(-t * 30))
	x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
	return np.tanh(x * 1.4) * 0.45 * v


def conga(note, v=1.0):
	t = t_(0.25)
	f = midi(note) * (1 + 0.15 * np.exp(-t * 60))
	x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18)
	return x * 0.3 * v


def shaker(v=1.0):
	t = t_(0.08)
	return hp(noise(len(t)), 6000) * np.sin(np.pi * np.clip(t / 0.08, 0, 1)) ** 2 * 0.06 * v


def crash(v=1.0, dur=2.5):
	t = t_(dur)
	metal = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) for f in (523, 811, 1187, 1601, 2333, 3109))
	x = hp(noise(len(t)) + metal * 0.2, 4000)
	return x * np.exp(-t * 2.2) * np.minimum(1, t * 2000) * 0.12 * v


def stab(notes, dur=0.35, v=1.0, cutoff=1800):
	t = t_(dur + 0.3)
	x = np.zeros_like(t)
	for n in notes:
		for det in (-0.006, 0.006):
			ph = (midi(n) * (1 + det) * t) % 1
			x += 2 * ph - 1
	env = np.minimum(1, t * 300) * np.exp(-t * 7) * np.clip((dur + 0.3 - t) / 0.3, 0, 1)
	return lp(x, cutoff, 3) * env * 0.05 * v


def riser(dur):
	t = t_(dur)
	out = np.zeros(len(t))
	seg = int(0.02 * SR)
	n = noise(len(t))
	for i in range(0, len(t), seg):
		p = i / len(t)
		fc = 300 + 8000 * p**2
		out[i : i + seg] = bp(n[i : i + seg], fc * 0.7, min(fc * 1.5, 20000))
	return out * np.linspace(0, 1, len(t)) ** 2 * 0.25


def impact(size=1.0):
	t = t_(2.5)
	f = 60 * np.exp(-t * 3) + 30
	boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
	return np.tanh(boom * 1.5 * size) * 0.7


def downsweep(dur=0.4):
	t = t_(dur)
	n = noise(len(t))
	out = np.zeros(len(t))
	seg = int(0.02 * SR)
	for i in range(0, len(t), seg):
		fc = 5000 - 4500 * i / len(t)
		out[i : i + seg] = bp(n[i : i + seg], fc * 0.7, fc * 1.4)
	return out * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5 * 0.3


# ---------- harmony: Dm, Dm, Bb, C (the 808 roots and the stabs)
ROOTS = [38, 38, 34, 36]
STABS = [[62, 65, 69, 72], [62, 65, 69, 72], [58, 62, 65, 69], [60, 64, 67, 71]]


def sixteenth(b, s):
	"""Time of sixteenth s (0..15) in bar b, swung."""
	eighth = s // 2
	off = s % 2
	return bar_t(b) + eighth * BEAT / 2 + off * SWING * BEAT / 2


B_ONE = round(bar_of('one'))
B_HATS = round(bar_of('one', 250))  # text-p-base: hats come in
B_GROOVE = round(bar_of('one', 580))  # w-[440px] p-4: the beat drops
B_DARK = int(np.ceil(bar_of('one', 1560)))  # dark: half-time
B_LIGHT = round(bar_of('one', 2125))
B_TWO = round(bar_of('two'))
B_THREE = round(bar_of('three'))
B_END = round(bar_of('end'))
B_RING = int(np.floor(bar_of('end', 463)))
B_LOCK = round(bar_of('end', 659))
BARS = int(np.ceil((TOTAL - GRID) / BARF)) + 1


def section(b):
	if b < B_ONE:
		return 'intro'
	if b < B_HATS:
		return 'pulse'
	if b < B_GROOVE:
		return 'build'
	if b < B_DARK:
		return 'groove'
	if b < B_LIGHT:
		return 'half'
	if b < B_THREE:
		return 'full'
	if b < B_END:
		return 'full+'
	if b < B_RING:
		return 'groove'
	if b < B_LOCK:
		return 'roll'
	return 'out'


KICKS = {
	'groove': [0, 6, 10],
	'full': [0, 6, 10, 13],
	'full+': [0, 3, 6, 10, 13],
}

sidechain = np.ones(N)


def duck(t0, depth=0.4):
	i = int(t0 * SR)
	dk = np.linspace(depth, 1, int(0.22 * SR)) ** 1.5
	j = min(N, i + len(dk))
	sidechain[i:j] = np.minimum(sidechain[i:j], dk[: j - i])


for b in range(-1, BARS):
	if bar_t(b) < 0:
		continue
	sec = section(b)
	root = ROOTS[b % 4]
	last = (b + 1 < BARS) and section(b + 1) != sec  # the bar before a change: a fill
	if sec == 'intro':
		# a muffled heartbeat under the mark
		for beat in (0, 2):
			put('kick', lp(kick(0.8), 300), bar_t(b) + beat * BEAT, 0.5)
		continue
	if sec == 'roll':
		continue  # the snare roll, below
	if sec == 'out':
		if b == B_LOCK:
			put('kick', kick(1.2), bar_t(b), 1.0)
			put('bass', bass808(26, BAR * 1.8), bar_t(b), 1.1)
			put('drums', clap(1.2), bar_t(b), 0.9)
			put('drums', crash(1.2, 4.0), bar_t(b), 1.0)
			put('synth', stab([50, 57, 62, 65, 69, 72], BAR * 1.5, 1.4, 2400), bar_t(b), 1.0)
		continue
	if sec == 'pulse':
		for beat in range(4):
			put('kick', kick(0.8), bar_t(b) + beat * BEAT, 0.55)
			duck(bar_t(b) + beat * BEAT, 0.7)
		for beat in (1, 3):
			put('drums', rim(0.8), bar_t(b) + beat * BEAT, 0.6, pan=0.2)
		continue
	if sec == 'build':
		for beat in range(4):
			put('kick', kick(0.9), bar_t(b) + beat * BEAT, 0.7)
			duck(bar_t(b) + beat * BEAT, 0.6)
		for s in range(16):
			if s % 2 == 0:
				put('drums', hat(v=0.9 if s % 4 == 2 else 0.5), sixteenth(b, s), 1.0, pan=-0.25)
		for beat in (1, 3):
			put('drums', clap(0.6), bar_t(b) + beat * BEAT, 0.6)
		put('bass', bass808(root, BEAT * 1.8), bar_t(b), 0.8)
		if last:
			put('fx', riser(BAR), bar_t(b), 0.8)
		continue
	if sec == 'half':
		put('kick', kick(1.1), bar_t(b), 1.0)
		duck(bar_t(b), 0.3)
		if b % 2:
			put('kick', kick(0.8), sixteenth(b, 11), 0.7)
		put('drums', clap(1.0), bar_t(b) + 2 * BEAT, 0.9)
		put('bass', bass808([35, 31, 33, 33][b % 4], BAR * 0.95), bar_t(b), 1.0)
		for s in range(0, 16, 4):
			put('drums', hat(v=0.5), sixteenth(b, s + 2), 1.0, pan=-0.25)
		if b % 2 == 0:
			put('synth', stab([59, 62, 66, 69], 0.6, 0.8, 900), bar_t(b), 1.0)
		if last:
			put('fx', riser(BAR), bar_t(b), 0.9)
			for k in range(8):
				put('drums', snare(0.3 + k * 0.1), bar_t(b) + 2 * BEAT + k * BEAT / 4, 0.8)
		continue
	# the grooves
	pattern = KICKS['groove' if sec == 'groove' else sec]
	for s in pattern:
		put('kick', kick(), sixteenth(b, s), 1.0)
		duck(sixteenth(b, s))
	for beat in (1, 3):
		put('drums', clap(1.0), bar_t(b) + beat * BEAT, 0.9)
	if sec != 'groove':
		put('drums', snare(0.35), sixteenth(b, 15), 0.7)  # a ghost before the downbeat
	for s in range(16):
		v = 1.0 if s % 4 == 2 else 0.65 if s % 2 == 0 else 0.4
		put('drums', hat(v=v), sixteenth(b, s), 1.0, pan=-0.25)
	if sec != 'groove' and b % 2 == 1:
		put('drums', hat(True, 0.8), sixteenth(b, 14), 1.0, pan=-0.25)
	if sec in ('full', 'full+'):
		for s, n in ((3, 62), (7, 67), (11, 62), (14, 69)):
			put('perc', conga(n, 0.8), sixteenth(b, s), 1.0, pan=0.35)
		for s in range(0, 16, 2):
			put('perc', shaker(1.0 if s % 4 == 2 else 0.6), sixteenth(b, s + 1), 1.0, pan=0.4)
	if sec == 'full+':
		put('drums', rim(0.7), sixteenth(b, 7), 0.8, pan=0.3)
	# the 808: the root, then a glide up on the "and" of 3
	put('bass', bass808(root, BEAT * 2.4), bar_t(b), 1.0)
	put('bass', bass808(root + (7 if b % 2 else 12), BEAT * 0.9, glide_from=root), sixteenth(b, 10), 0.85)
	# a stab on the off-beat of 2, every other bar
	if b % 2 == 0:
		put('synth', stab(STABS[b % 4], 0.3, 1.0, 1600 if sec == 'groove' else 2600), sixteenth(b, 6), 1.0, pan=0.15)
	if last and section(b + 1) != 'half':
		# a tom fill over the last beat
		for k, n in enumerate((50, 47, 45, 43)):
			put('drums', tom(n, 0.9), bar_t(b) + 3 * BEAT + k * BEAT / 4, 0.9, pan=(k - 1.5) * 0.3)
	if last and section(b + 1) == 'half':
		put('fx', downsweep(BEAT * 2), bar_t(b) + 2 * BEAT, 0.8)

# the snare roll from the ring into the lockup
for b in range(B_RING, B_LOCK):
	t0, t1 = bar_t(b), bar_t(b + 1)
	for beat in range(4):
		put('kick', kick(0.9), t0 + beat * BEAT, 0.8)
		duck(t0 + beat * BEAT, 0.6)
	put('bass', bass808(ROOTS[b % 4], BAR * 0.9), t0, 0.8)
roll0 = at('end', 463)
roll1 = bar_t(B_LOCK)
t = roll0
while t < roll1 - 0.01:
	p = (t - roll0) / (roll1 - roll0)
	put('drums', snare(0.25 + 0.75 * p), t, 0.8, pan=rng.uniform(-0.1, 0.1))
	t += BEAT / (2 if p < 0.35 else 4 if p < 0.75 else 8)
put('fx', riser(roll1 - roll0), roll0, 1.0)

for k in ('bass', 'synth', 'perc'):
	buses[k] *= sidechain[:, None] ** 0.8

# ---------- picture: hits, not chimes
# Mark: the stroke, the labels, the lockup
put('fx', riser(1.6), at('mark', 266) - 1.6, 0.5)
for f in (48, 60):
	put('drums', rim(0.9), at('mark', f), 0.8)
put('drums', conga(62, 1.0), at('mark', 122), 1.0)
put('drums', conga(67, 1.0), at('mark', 194), 1.0)
put('kick', kick(1.1), at('mark', 266), 1.0)
put('drums', clap(1.1), at('mark', 266), 0.9)
put('fx', impact(0.6), at('mark', 266), 0.5)
put('fx', downsweep(0.45), at('one', 0), 0.6)

# Stage One: rims on the type tokens, toms down the radius steps
for f in (116, 170, 250, 330, 356):
	put('perc', rim(0.8), at('one', f), 0.7, pan=0.25)
for k, f in enumerate((730, 754, 770, 786, 802, 818)):
	put('perc', tom(55 - k * 2, 0.7), at('one', f), 0.8, pan=(k - 2.5) * 0.15)
for f in (1200, 1230, 1260, 1300, 1335, 1435, 1465, 1495):
	put('perc', rim(0.7), at('one', f), 0.6, pan=-0.25)
put('fx', impact(1.0), at('one', 1560), 0.9)
put('drums', crash(0.8), at('one', 1560), 0.8)
for k, f in enumerate((1740, 1830, 1890)):
	put('perc', tom(43 + k * 3, 0.8), at('one', f), 0.8)
put('drums', crash(0.9), at('one', 2125), 0.8)
put('fx', riser(bar_t(B_TWO) - at('one', 2125)), at('one', 2125), 0.6)

# Stage Two: the six elevations, a tom each going up; the bento levels
for k in range(6):
	put('perc', tom(43 + k * 2, 0.6), at('two', 80 + k * 18), 0.7, pan=(k - 2.5) * 0.15)
for l, f in enumerate((262, 298, 334, 370, 406, 442)):
	put('perc', conga(62 + l * 2, 0.7), at('two', f), 0.7, pan=0.3)

# Stage Three: send, the build, the dark slider
put('drums', clap(0.8), at('three', 151), 0.7)
put('drums', crash(0.6), at('three', 335), 0.6)
put('drums', clap(0.8), at('three', 683), 0.7)
put('fx', downsweep(0.5), at('three', 1059), 0.7)

# End: each recipe on a tom, then the roll
put('drums', crash(0.7), at('end', 14), 0.6)
for k, f in enumerate((123, 208, 293, 378)):
	put('perc', tom(50 - k * 2, 0.9), at('end', f), 0.9)

# ---------- mix
mix = buses['kick'] * 1.0 + buses['bass'] * 0.95 + buses['drums'] * 0.95 + buses['perc'] * 0.8 + buses['synth'] * 0.9 + buses['fx'] * 0.8

ir_t = t_(1.6)
ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t * 3.5)[:, None]
ir = lp(ir, 5000)
send = buses['drums'] * 0.6 + buses['perc'] + buses['synth'] + buses['fx'] * 0.5
wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
mix = mix + wet * 0.03

fade = np.ones(N)
fade[: int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR))
tail = int(2.8 * SR)
fade[-tail:] = np.linspace(1, 0, tail) ** 1.4
mix *= fade[:, None]
mix = hp(mix, 28)
mix *= 10 ** (-15 / 20) / np.sqrt((mix**2).mean())
a = np.abs(mix)
mix = np.where(a > 0.85, np.sign(mix) * (0.85 + 0.14 * np.tanh((a - 0.85) / 0.14)), mix)

mix *= 0.88  # headroom: true peak under -1 dB
out = (mix * 32767).astype(np.int16)
with wave.open('public/audio/score_drums.wav', 'wb') as w:
	w.setnchannels(2)
	w.setsampwidth(2)
	w.setframerate(SR)
	w.writeframes(out.tobytes())
print('wrote public/audio/score_drums.wav', round(DUR, 2), 's; grid at frame', GRID, '; bars', dict(one=B_ONE, hats=B_HATS, groove=B_GROOVE, dark=B_DARK, light=B_LIGHT, two=B_TWO, three=B_THREE, end=B_END, ring=B_RING, lock=B_LOCK))

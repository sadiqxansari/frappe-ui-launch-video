"""Synthesised score for the v2 film (Mark, Stage One, Two, Three, End).

100 bpm, one bar = 144 frames at 60 fps, D major: electric piano chords, a
mallet motif, a soft kit. The bar grid starts at GRID so the lockup lands on
a downbeat; every other cue is a scene start plus the scene-local frame the
React scene uses, so hits land on picture. Keep SCENES and the cue frames in
sync with src/v2 (the frames are copied from each scene's constants).

Run with numpy + scipy: ../fc-launch-video/.venv/bin/python scripts/score.py
"""

import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
FPS = 60
BEATF = 36  # frames per beat
BARF = BEATF * 4
BEAT = BEATF / FPS
BAR = BARF / FPS

# scene lengths in frames, as src/v2/Film.tsx plays them
SCENES = dict(mark=338, one=2205, two=550, three=1199, end=909)
START = {}
_at = 0
for _k, _d in SCENES.items():
	START[_k] = _at
	_at += _d
TOTAL = _at
LOCKUP = START['end'] + 659
GRID = LOCKUP % BARF  # the frame bar 0 starts on, so the lockup is a downbeat
DUR = TOTAL / FPS + 0.5
N = int(DUR * SR)
rng = np.random.default_rng(11)


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


buses = {k: np.zeros((N, 2)) for k in ('keys', 'pad', 'mallet', 'bass', 'drums', 'fx')}


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


# ---------- instruments
def epiano(note, dur, vel=1.0):
	t = t_(dur + 1.0)
	f = midi(note)
	idx = 1.6 * np.exp(-t * 5) + 0.25
	car = np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * f * t) * idx)
	tine = np.sin(2 * np.pi * f * 7.02 * t) * np.exp(-t * 28) * 0.12
	env = np.minimum(1, t * 300) * np.exp(-t * 1.1)
	rel = np.clip((dur + 1.0 - t) / 1.0, 0, 1)
	return (car + tine) * env * rel * 0.16 * vel


def pad(notes, dur, vel=1.0):
	"""Slow, airy chord: detuned sines, a long attack and release."""
	t = t_(dur + 1.5)
	x = np.zeros_like(t)
	for n in notes:
		f = midi(n)
		for det in (-0.004, 0.0, 0.0045):
			x += np.sin(2 * np.pi * f * (1 + det) * t + rng.uniform(0, 6.28))
	env = np.minimum(1, t / 1.2) * np.clip((dur + 1.5 - t) / 1.5, 0, 1)
	return lp(x, 2200) * env * 0.035 * vel


def mallet(note, vel=1.0):
	t = t_(0.9)
	f = midi(note)
	x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 3.99 * t) * np.exp(-t * 18) + 0.12 * np.sin(2 * np.pi * f * 10.1 * t) * np.exp(-t * 40)
	return x * np.exp(-t * 6.5) * np.minimum(1, t * 800) * 0.22 * vel


def sub(note, dur):
	t = t_(dur)
	f = midi(note)
	x = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * 2 * f * t)
	env = np.minimum(1, t * 120) * np.clip((dur - t) / 0.06, 0, 1)
	return np.tanh(x * 1.3) * env * 0.36


def kick(k=1.0):
	t = t_(0.45)
	f = 48 + 90 * np.exp(-t * 38)
	x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
	return np.tanh(x * 1.5 * k) * 0.8


def snap():
	t = t_(0.22)
	n = bp(rng.standard_normal(len(t)), 1400, 6000)
	e = np.exp(-t * 45) + 0.5 * np.exp(-np.clip(t - 0.008, 0, None) * 70) * (t > 0.008)
	body = np.sin(2 * np.pi * 1850 * t) * np.exp(-t * 90) * 0.3
	return (n * e + body) * 0.34


def shaker(accent=1.0):
	t = t_(0.09)
	n = hp(rng.standard_normal(len(t)), 6000)
	e = np.sin(np.pi * np.clip(t / 0.09, 0, 1)) ** 2
	return n * e * 0.07 * accent


def rim():
	t = t_(0.06)
	return (np.sin(2 * np.pi * 1700 * t) + 0.5 * np.sin(2 * np.pi * 3400 * t)) * np.exp(-t * 120) * 0.16


def ui_click(pitch=2600):
	t = t_(0.04)
	return (np.sin(2 * np.pi * pitch * t) * np.exp(-t * 180) + bp(rng.standard_normal(len(t)), 2500, 8000) * np.exp(-t * 300) * 0.4) * 0.22


def key_tap():
	t = t_(0.035)
	return bp(rng.standard_normal(len(t)), 1800, 6500) * np.exp(-t * 240) * 0.16


def blip(note, dur=0.16):
	t = t_(dur)
	f = midi(note) * (1 + 0.02 * np.exp(-t * 60))
	return np.sin(2 * np.pi * f * t) * np.exp(-t * 22) * 0.2


def flip():
	t = t_(0.12)
	f = 2400 * np.exp(-t * 30) + 300
	return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.25


def swell(dur):
	t = t_(dur)
	n = rng.standard_normal(len(t))
	out = np.zeros_like(n)
	seg = int(0.03 * SR)
	for i in range(0, len(n), seg):
		p = i / len(n)
		fc = 500 + 7000 * p**2
		out[i : i + seg] = bp(n[i : i + seg], fc * 0.7, min(fc * 1.5, 20000))
	return out * np.linspace(0, 1, len(t)) ** 2.5 * 0.3


def whoosh(dur=0.5, up=True):
	t = t_(dur)
	n = rng.standard_normal(len(t))
	out = np.zeros_like(n)
	seg = int(0.02 * SR)
	for i in range(0, len(n), seg):
		p = i / len(n)
		fc = (400 + 3600 * p) if up else (4000 - 3600 * p)
		out[i : i + seg] = bp(n[i : i + seg], fc * 0.7, fc * 1.4)
	return out * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5 * 0.4


def drop(size=1.0):
	t = t_(3.0)
	f = 70 * np.exp(-t * 2.2) + 32
	boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.4)
	air = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 3) * 0.12
	return np.tanh((boom * 1.2 + air) * size) * 0.75


# ---------- harmony: one chord per bar
# Dmaj9, Bm9, Gmaj9, A6sus
CHORDS = [
	(38, [62, 66, 69, 73, 76]),
	(35, [62, 66, 69, 73, 74]),
	(31, [59, 62, 66, 69, 73]),
	(33, [62, 64, 66, 69, 71]),
]
# the dark section: Bm9, Gmaj7, Em9, F#m7
DARK = [
	(35, [59, 62, 66, 69, 73]),
	(31, [59, 62, 66, 67, 71]),
	(28, [59, 62, 64, 67, 71]),
	(30, [57, 61, 64, 66, 69]),
]
MOTIF = [0, 2, 4, 3, 2, 4, 1, 3]  # indices into the chord, eighth notes

# where each section starts, in bars of the grid
B_ONE = round(bar_of('one'))  # stage one: the card is built
B_GROOVE = round(bar_of('one', 580))  # w-[440px]: a pulse comes in
B_DARK = int(np.ceil(bar_of('one', 1560)))  # the page goes dark
B_LIGHT = round(bar_of('one', 2125))  # and back to light
B_TWO = round(bar_of('two'))  # the bento: everything in
B_THREE = round(bar_of('three'))
B_END = round(bar_of('end'))
B_LOCK = round(bar_of('end', 659))
BARS = int(np.ceil((TOTAL - GRID) / BARF)) + 1


def layers(b):
	if b < B_ONE:
		return {'pad', 'mallet_sparse'} if b >= 0 else {'pad'}
	if b < B_GROOVE:
		return {'keys_soft', 'mallet_sparse', 'pad'}
	if b < B_DARK:
		return {'keys', 'mallet_sparse', 'shaker', 'kick_soft', 'bass'}
	if b < B_LIGHT:
		return {'keys_dark', 'pad_dark', 'bass'}
	if b < B_TWO:
		return {'keys', 'mallet', 'shaker', 'kick_soft', 'bass'}
	if b < B_THREE:
		return {'keys', 'mallet', 'shaker', 'kick', 'snap', 'bass'}
	if b < B_END:
		return {'keys', 'mallet', 'shaker', 'kick', 'snap', 'bass', 'rim'}
	if b < B_LOCK:
		return {'keys', 'mallet_sparse', 'shaker', 'kick_soft', 'bass'}
	return {'end'}


sidechain = np.ones(N)
for b in range(-1, BARS):
	t0 = bar_t(b)
	if t0 < 0:
		continue
	L = layers(b)
	root, notes = (DARK if 'keys_dark' in L else CHORDS)[b % 4]
	if 'pad' in L or 'pad_dark' in L:
		put('pad', pad(notes, BAR, 0.9 if 'pad' in L else 1.1), t0)
	if L & {'keys', 'keys_soft', 'keys_dark'}:
		v = 0.55 if 'keys_soft' in L else 0.6 if 'keys_dark' in L else 1.0
		for k, n in enumerate(notes):
			put('keys', epiano(n, BEAT * 1.4, v), t0 + k * 0.012, pan=(k - 2) * 0.18)
			put('keys', epiano(n, BEAT * 1.8, v * 0.7), t0 + BEAT * 1.5 + k * 0.01, pan=(k - 2) * 0.18)
	if 'mallet' in L or 'mallet_sparse' in L:
		steps = range(0, 8, 2) if 'mallet_sparse' in L else range(8)
		for i in steps:
			put('mallet', mallet(notes[MOTIF[i]] + 12, 0.8 + 0.2 * (i % 2 == 0)), t0 + i * BEAT / 2, pan=0.3 * np.sin(i * 1.3))
	if 'bass' in L:
		pattern = ((0, 3.8),) if 'keys_dark' in L else ((0, 1.4), (1.5, 0.45), (2.5, 1.2), (3.75, 0.2))
		for tb, d in pattern:
			put('bass', sub(root + (12 if tb == 3.75 else 0), BEAT * d), t0 + tb * BEAT, 0.8 if 'keys_dark' in L else 1.0)
	for beat in range(4):
		tb = t0 + beat * BEAT
		kk = 'kick' in L or 'kick_soft' in L
		if kk and beat in ((0, 2) if 'kick' in L else (0,)):
			put('drums', kick(), tb, 0.9 if 'kick' in L else 0.6)
			i = int(tb * SR)
			dk = np.linspace(0.45, 1, int(0.25 * SR)) ** 1.5
			sidechain[i : i + len(dk)] = np.minimum(sidechain[i : i + len(dk)], dk[: len(sidechain[i : i + len(dk)])])
		if 'kick' in L and beat == 2 and b % 2 == 1:
			put('drums', kick(0.7), tb + BEAT * 0.75, 0.55)
		if 'snap' in L and beat in (1, 3):
			put('drums', snap(), tb, 0.8, pan=0.08)
		if 'shaker' in L:
			for s in range(4):
				put('drums', shaker(1.0 if s == 2 else 0.6), tb + s * BEAT / 4, 0.9, pan=-0.3)
		if 'rim' in L and beat == 3:
			put('drums', rim(), tb + BEAT / 2, 0.8, pan=0.3)
	if 'end' in L and b == B_LOCK:
		for k, n in enumerate([50, 57, 62, 66, 69, 73, 76, 81]):
			put('keys', epiano(n, BAR * 2, 1.1), t0 + k * 0.03, pan=(k - 3.5) * 0.12)
		put('pad', pad([62, 66, 69, 73, 76], BAR * 1.6, 1.2), t0)

for k in ('keys', 'mallet', 'pad'):
	buses[k] *= sidechain[:, None] ** 0.6
# the dark section, under a lowpass
i0, i1 = int(bar_t(B_DARK) * SR), int(bar_t(B_LIGHT) * SR)
for k in ('keys', 'mallet'):
	buses[k][i0:i1] = lp(buses[k][i0:i1], 1400)

PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]

# ---------- cues on picture
# Mark: the stroke draws, the measurements, the fill, the lockup
put('fx', swell(1.2), at('mark', 6), 0.4)
for f in (48, 60):
	put('fx', ui_click(3000), at('mark', f), 0.8)
put('fx', mallet(86, 0.9), at('mark', 122), 1.0)
put('fx', mallet(81), at('mark', 194), 1.0)
for k, n in enumerate((74, 78, 81, 86)):
	put('fx', mallet(n, 1.0), at('mark', 266) + k * 0.025, 1.0, pan=(k - 1.5) * 0.25)
put('fx', drop(0.5), at('mark', 266), 0.5)
# the name slides into the mark
put('fx', whoosh(0.45, up=False), at('one', 0), 0.35)

# Stage One: the type tokens, the box, the radius, the rest of the card
for i, f in enumerate((116, 170, 250, 330, 356)):
	put('fx', blip(74 + PENTA[i], 0.12), at('one', f), 0.6, pan=0.2)
for f in (420, 440, 490, 580):
	put('fx', ui_click(2400), at('one', f), 0.6)
for i, f in enumerate((730, 754, 770, 786, 802, 818)):
	put('fx', mallet(74 + PENTA[i], 0.55), at('one', f), 0.8)
put('fx', blip(86, 0.2), at('one', 892), 0.6)
for i, f in enumerate((950, 980, 1010, 1040, 1070, 1102, 1134)):
	put('fx', mallet(74 + PENTA[i], 0.45), at('one', f), 0.7, pan=(i - 3) * 0.12)
for f in (1200, 1230, 1260, 1300, 1335):
	put('fx', ui_click(2800), at('one', f), 0.7)
for i, f in enumerate((1435, 1465, 1495)):
	put('fx', blip(81 + PENTA[i], 0.14), at('one', f), 0.7)
# dark
put('fx', swell(1.4), at('one', 1560) - 1.4, 0.6)
put('fx', drop(1.0), at('one', 1560), 0.9)
put('fx', flip(), at('one', 1560), 1.1)
for i, f in enumerate((1740, 1830, 1890)):
	put('fx', mallet(62 + PENTA[i], 0.5), at('one', f), 0.8)
put('fx', mallet(66, 0.4), at('one', 1950), 0.7)
# back to light, into the bento
put('fx', flip(), at('one', 2125), 0.9)
put('fx', swell(bar_t(B_TWO) - at('one', 2125)), at('one', 2125), 0.5)

# Stage Two: up through the six elevations, the bento fills
put('fx', whoosh(0.6), at('two', 40), 0.35)
for i in range(6):
	put('fx', mallet(74 + PENTA[i], 0.5), at('two', 80 + i * 18), 0.8)
put('fx', whoosh(0.5, up=False), at('two', 200), 0.35)
for l, f in enumerate((262, 298, 334, 370, 406, 442)):
	for k in range(min(4, 1 + l)):
		put('fx', blip(74 + PENTA[l + k], 0.1), at('two', f) + k * 0.03, 0.45, pan=(k - 1.5) * 0.3)

# Stage Three: the prompt, the build, the dashboard, the dark slider
for i in range(int((151 - 64) / 2.4)):
	put('fx', key_tap(), at('three', 64 + i * 2.4), 0.55, pan=rng.uniform(-0.15, 0.15))
put('fx', ui_click(2600), at('three', 151), 0.9)
for i, f in enumerate((183, 213, 235, 257, 299)):
	put('fx', blip(76 + PENTA[i], 0.12), at('three', f), 0.5)
for i in range(5):
	put('fx', blip(86 + PENTA[i], 0.08), at('three', 359 + i * 10), 0.35)
put('fx', ui_click(2400), at('three', 559), 0.9)
for i in range(int((683 - 609) / 2.4)):
	put('fx', key_tap(), at('three', 609 + i * 2.4), 0.55, pan=rng.uniform(-0.15, 0.15))
put('fx', ui_click(2600), at('three', 683), 0.9)
put('fx', ui_click(2200), at('three', 995), 0.8)
put('fx', flip(), at('three', 1059), 0.8)

# End: the page goes light, the recipes, the ring, the fold, the lockup
put('fx', flip(), at('end', 14), 0.6)
put('fx', whoosh(0.5), at('end', 34), 0.3)
for i, f in enumerate((123, 208, 293, 378)):
	put('fx', mallet(81 + PENTA[i], 0.7), at('end', f), 0.9)
	put('fx', whoosh(0.5), at('end', f) - 0.05, 0.2)
put('fx', swell(bar_t(B_LOCK) - at('end', 463)), at('end', 463), 0.55)
put('fx', whoosh(0.6, up=False), at('end', 573), 0.35)
put('fx', drop(0.7), at('end', 659), 0.7)
for k, n in enumerate((74, 78, 81, 86)):
	put('fx', mallet(n, 1.0), at('end', 659) + k * 0.025, 1.0, pan=(k - 1.5) * 0.25)

# ---------- mix
music = buses['keys'] * 0.95 + buses['pad'] * 1.0 + buses['mallet'] * 0.75 + buses['bass'] * 1.0
mix = music + buses['drums'] * 0.85 + buses['fx'] * 0.8

ir_t = t_(2.4)
ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t * 2.4)[:, None]
ir = lp(ir, 4500)
send = buses['keys'] + buses['pad'] + buses['mallet'] * 1.2 + buses['fx'] * 0.6
wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
mix = mix + wet * 0.025

fade = np.ones(N)
fade[: int(0.05 * SR)] = np.linspace(0, 1, int(0.05 * SR))
tail = int(2.6 * SR)
fade[-tail:] = np.linspace(1, 0, tail) ** 1.6
mix *= fade[:, None]
mix = hp(mix, 26)
mix *= 10 ** (-16 / 20) / np.sqrt((mix**2).mean())
a = np.abs(mix)
mix = np.where(a > 0.8, np.sign(mix) * (0.8 + 0.18 * np.tanh((a - 0.8) / 0.18)), mix)

out = (mix * 32767).astype(np.int16)
with wave.open('public/audio/score_keys.wav', 'wb') as w:
	w.setnchannels(2)
	w.setsampwidth(2)
	w.setframerate(SR)
	w.writeframes(out.tobytes())
print('wrote public/audio/score_keys.wav', round(DUR, 2), 's; grid at frame', GRID, '; bars', dict(one=B_ONE, groove=B_GROOVE, dark=B_DARK, light=B_LIGHT, two=B_TWO, three=B_THREE, end=B_END, lock=B_LOCK))

"""Synthesised score for the Frappe UI 1.0 film, locked to src/timeline.ts.

100 bpm, one bar = 2.4 s = 144 frames at 60 fps. D major, electric piano
chords, a mallet motif, snaps and a shaker. Every cue is a scene start plus
the same scene-local frame the React scene uses, so hits land on picture.

Run with numpy + scipy: ../fc-launch-video/.venv/bin/python scripts/score.py
"""

import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
FPS = 60
BPM = 100
BEAT = 60 / BPM
BAR = BEAT * 4
BARS = 28
DUR = BARS * BAR
N = int(DUR * SR)
rng = np.random.default_rng(11)

# Scene starts in bars — keep in sync with src/timeline.ts
S = dict(mark=0, color=3, layers=6, dark=8, type=12, shape=14, components=16, playground=20, docs=23, end=25)
BEATF = 36  # frames per beat


def at(scene, frame=0):
	return S[scene] * BAR + frame / FPS


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


buses = {k: np.zeros((N, 2)) for k in ('keys', 'mallet', 'bass', 'drums', 'fx')}


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
	"""FM electric piano: bell-ish attack, warm sustain."""
	t = t_(dur + 1.0)
	f = midi(note)
	idx = 1.6 * np.exp(-t * 5) + 0.25
	mod = np.sin(2 * np.pi * f * t) * idx
	car = np.sin(2 * np.pi * f * t + mod)
	tine = np.sin(2 * np.pi * f * 7.02 * t) * np.exp(-t * 28) * 0.12
	env = np.minimum(1, t * 300) * np.exp(-t * 1.1)
	rel = np.clip((dur + 1.0 - t) / 1.0, 0, 1)
	return (car + tine) * env * rel * 0.16 * vel


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
	"""The theme flip: a tight downward chirp with a click."""
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
	"""Sub drop + air: the dark-mode flip and the 1.0 slam."""
	t = t_(3.0)
	f = 70 * np.exp(-t * 2.2) + 32
	boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.4)
	air = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 3) * 0.12
	return np.tanh((boom * 1.2 + air) * size) * 0.75


# ---------- harmony: one chord per bar
# Dmaj9, Bm9, Gmaj9(#11), A6sus
CHORDS = [
	(38, [62, 66, 69, 73, 76]),
	(35, [62, 66, 69, 73, 74]),
	(31, [59, 62, 66, 69, 73]),
	(33, [62, 64, 66, 69, 71]),
]
MOTIF = [0, 2, 4, 3, 2, 4, 1, 3]  # indices into the chord, eighth notes


def chord(b):
	return CHORDS[b % 4]


def layers(b):
	L = {'keys'}
	if b in (0, 1):
		L |= {'mallet_sparse'}
	if b == 2:
		L |= {'mallet'}
	if 3 <= b <= 7:
		L |= {'mallet', 'kick', 'snap', 'shaker', 'bass'}
	if b == 8:  # typing the attribute: drums out, tension
		L = {'keys_soft'}
	if 9 <= b <= 19:
		L |= {'mallet', 'kick', 'snap', 'shaker', 'bass', 'rim'}
	if 20 <= b <= 22:
		L |= {'kick', 'snap', 'shaker', 'bass'}
	if 23 <= b <= 24:
		L |= {'mallet', 'shaker', 'bass', 'kick'}
	if b == 25:
		L |= {'mallet', 'kick', 'snap', 'shaker', 'bass'}
	if b >= 26:
		L = {'keys_end'}
	return L


sidechain = np.ones(N)
for b in range(BARS):
	t0 = b * BAR
	L = layers(b)
	root, notes = chord(b)
	if 'keys' in L or 'keys_soft' in L:
		v = 0.55 if 'keys_soft' in L else 1.0
		# a pushed comp: on 1 and the "and" of 2
		for k, n in enumerate(notes):
			put('keys', epiano(n, BEAT * 1.4, v), t0 + k * 0.012, pan=(k - 2) * 0.18)
			put('keys', epiano(n, BEAT * 1.8, v * 0.7), t0 + BEAT * 1.5 + k * 0.01, pan=(k - 2) * 0.18)
	if 'mallet' in L or 'mallet_sparse' in L:
		steps = range(0, 8, 2) if 'mallet_sparse' in L else range(8)
		for i in steps:
			n = notes[MOTIF[i]] + 12
			put('mallet', mallet(n, 0.8 + 0.2 * (i % 2 == 0)), t0 + i * BEAT / 2, pan=0.3 * np.sin(i * 1.3))
	if 'bass' in L:
		for tb, d in ((0, 1.4), (1.5, 0.45), (2.5, 1.2), (3.75, 0.2)):
			put('bass', sub(root + (12 if tb == 3.75 else 0), BEAT * d), t0 + tb * BEAT)
	for beat in range(4):
		tb = t0 + beat * BEAT
		if 'kick' in L and beat in (0, 2):
			put('drums', kick(), tb, 0.9)
			i = int(tb * SR)
			dk = np.linspace(0.45, 1, int(0.25 * SR)) ** 1.5
			sidechain[i : i + len(dk)] = np.minimum(sidechain[i : i + len(dk)], dk)
		if 'kick' in L and beat == 2 and b % 2 == 1:
			put('drums', kick(0.7), tb + BEAT * 0.75, 0.55)
		if 'snap' in L and beat in (1, 3):
			put('drums', snap(), tb, 0.9, pan=0.08)
		if 'shaker' in L:
			for s in range(4):
				put('drums', shaker(1.0 if s == 2 else 0.6), tb + s * BEAT / 4, 1.0, pan=-0.3)
		if 'rim' in L and beat == 3:
			put('drums', rim(), tb + BEAT / 2, 0.8, pan=0.3)
	if 'keys_end' in L and b == 26:
		for k, n in enumerate([50, 57, 62, 66, 69, 73, 76, 81]):
			put('keys', epiano(n, BAR * 2, 1.1), t0 + k * 0.03, pan=(k - 3.5) * 0.12)

for k in ('keys', 'mallet'):
	buses[k] *= sidechain[:, None] ** 0.6

# ---------- cues on picture
# 00 Mark: measurement ticks, outline fill, lockup, "1.0" slam
for f in (26, 40, BEATF * 4, BEATF * 4.3):
	put('fx', ui_click(3000), at('mark', f), 0.9)
put('fx', mallet(86, 0.9), at('mark', BEATF * 6), 1.0)
put('fx', swell(BEAT * 2), at('mark', BEATF * 8) - BEAT * 2, 0.8)
put('fx', mallet(81), at('mark', BEATF * 8), 1.0)
put('fx', drop(0.9), at('mark', BEATF * 10), 0.9)
for k, n in enumerate((74, 78, 81, 86)):
	put('fx', mallet(n, 1.1), at('mark', BEATF * 10) + k * 0.025, 1.0, pan=(k - 1.5) * 0.25)

# 01 Color: a blip on every field cut, stripes drop, fold
for i, n in enumerate((81, 83, 85, 86)):
	put('fx', blip(n), at('color', i * BEATF), 1.0)
for i in range(11):
	put('fx', ui_click(1800 + i * 160), at('color', 144 + i * 3), 0.55, pan=(i - 5) * 0.08)
put('fx', whoosh(0.7, up=False), at('color', 144 + 124), 0.5)

# 02 Tokens: explode, labels
put('fx', whoosh(0.9), at('layers', 26), 0.55)
for i in range(4):
	put('fx', blip(86 + i * 2, 0.12), at('layers', 70 + i * 18), 0.8, pan=0.3)
put('fx', whoosh(0.6, up=False), at('layers', int(BEATF * 6.4)), 0.5)
put('fx', ui_click(1400), at('layers', int(BEATF * 6.4) + 40), 1.0)

# 03 Dark: typing, the flip, the drag, flip montage
for i in range(24):
	put('fx', key_tap(), at('dark', 14 + i * 2.3), 1.0, pan=rng.uniform(-0.15, 0.15))
put('fx', swell(BAR - 0.3), at('dark', 0) + 0.3, 1.1)
put('fx', drop(1.2), at('dark', 144), 1.1)
put('fx', flip(), at('dark', 144), 1.2)
put('fx', ui_click(2200), at('dark', 144 + 18 + 22), 1.0)
for f in (52, 84, 112):
	put('fx', whoosh(0.35), at('dark', 162 + f) - 0.25, 0.4)
for i in range(3):
	put('fx', flip(), at('dark', 288 + i * BEATF + 18), 1.0)
for i in range(7):
	put('fx', blip(74 + [0, 2, 4, 7, 9, 11, 12][i], 0.1), at('dark', 396 + 10 + i * 8), 0.6)

# 04 Type: weight sweep, ladder, staircase
put('fx', swell(0.6), at('type', 4), 0.6)
for i in range(5):
	put('fx', ui_click(1600 + i * 300), at('type', 72 + i * 6), 0.7)
for i in range(18):
	put('fx', mallet(74 + [0, 2, 4, 7, 9][i % 5] + 12 * (i // 5), 0.35), at('type', 144 + 14 + i * 3), 0.6)

# 05 Shape: radius steps on sixteenths, row, elevations
for i in range(9):
	put('fx', mallet(74 + [0, 2, 4, 5, 7, 9, 11, 12, 14][i], 0.55), at('shape', 8 + i * 9), 0.8)
for i in range(10):
	put('fx', ui_click(2000 + i * 120), at('shape', 108 + i * 3), 0.5)
for i in range(6):
	put('fx', blip(76 + i * 2, 0.14), at('shape', 180 + 6 + i * 4), 0.55)

# 06 Components: tiles land, app assembles, wipe to dark
for i in range(12):
	put('fx', blip(74 + [0, 2, 4, 7, 9][i % 5] + 12 * (i // 5), 0.1), at('components', 6 + i * 4), 0.7, pan=((i % 4) - 1.5) * 0.3)
put('fx', whoosh(0.6), at('components', 288), 0.5)
for f in (4, 18, 30, 40, 52):
	put('fx', ui_click(1500), at('components', 288 + f), 0.6)
put('fx', whoosh(1.0, up=False), at('components', 288 + 144 + 40), 0.6)
put('fx', flip(), at('components', 288 + 144 + 70), 0.8)

# 07 Playground: every click, typing, the theme toggle
for f in (BEATF * 1, BEATF * 2, BEATF * 3, BEATF * 4, BEATF * 5, BEATF * 6):
	put('fx', ui_click(2800), at('playground', f), 1.0)
for i in range(6):
	put('fx', key_tap(), at('playground', BEATF * 6 + 14 + i * 3), 1.0)
put('fx', ui_click(2400), at('playground', BEATF * 9), 1.1)
put('fx', flip(), at('playground', BEATF * 9), 1.0)
put('fx', drop(0.6), at('playground', BEATF * 9), 0.6)

# 08 Docs: palette, query, select, agent
put('fx', whoosh(0.3), at('docs', 4), 0.4)
for i in range(6):
	put('fx', key_tap(), at('docs', 18 + i * 3), 1.0)
put('fx', ui_click(2600), at('docs', BEATF * 3), 0.9)
for i in range(80):
	if i % 2 == 0:
		put('fx', key_tap(), at('docs', BEATF * 4 + 30 + i * 0.9), 0.55, pan=rng.uniform(-0.2, 0.2))

# End: logos, lockup
for i in range(8):
	put('fx', blip(74 + [0, 2, 4, 7, 9, 12, 14, 16][i], 0.14), at('end', 12 + i * 5), 0.7, pan=(i - 3.5) * 0.15)
put('fx', swell(BEAT * 1.5), at('end', 144) - BEAT * 1.5, 0.7)
put('fx', drop(0.8), at('end', 144), 0.8)
put('fx', flip(), at('end', 144 + 30), 0.7)

# ---------- mix
music = buses['keys'] * 0.95 + buses['mallet'] * 0.8 + buses['bass'] * 1.0
mix = music + buses['drums'] * 0.9 + buses['fx'] * 0.95

ir_t = t_(2.2)
ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t * 2.6)[:, None]
ir = lp(ir, 4500)
send = buses['keys'] + buses['mallet'] * 1.2 + buses['fx'] * 0.6
wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
mix = mix + wet * 0.02

fade = np.ones(N)
tail = int(2.4 * SR)
fade[-tail:] = np.linspace(1, 0, tail) ** 1.6
mix *= fade[:, None]
mix = hp(mix, 26)
mix *= 10 ** (-15 / 20) / np.sqrt((mix**2).mean())
a = np.abs(mix)
mix = np.where(a > 0.8, np.sign(mix) * (0.8 + 0.18 * np.tanh((a - 0.8) / 0.18)), mix)

out = (mix * 32767).astype(np.int16)
with wave.open('public/audio/score_v1.wav', 'wb') as w:
	w.setnchannels(2)
	w.setsampwidth(2)
	w.setframerate(SR)
	w.writeframes(out.tobytes())
print('wrote public/audio/score_v1.wav', round(DUR, 2), 's')

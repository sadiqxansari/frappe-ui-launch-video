"""Synthesised score for the v2 film: music that is built the way the UI is.

The film builds things: a mark from construction lines, a card a token at a
time, a wall of components, pages an agent writes, apps that fold back into
the mark. The score does the same. It starts as single notes, and each thing
the film adds brings in an instrument: a woodblock clock for the code,
pizzicato bass with the box, marimba with the padding, glockenspiel up the
radius steps, a pad with the shadow, snaps as the card fills in. Dark mode
flips the music too (the same progression, minor). The prompts drop back to
the clock; the built pages get the whole band; the recipes change chord; the
ring spins an arpeggio; the lockup resolves the motif the mark opened with.

120 bpm (one beat = 30 frames), D major: D, Bm, G, A (dark: Dm, Bb, Gm, A).
Plucks are Karplus-Strong, marimba and glockenspiel are modal, so they sound
like instruments rather than oscillators.

Cue frames are copied from the scene constants in src/v2: keep them in sync.
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

SCENES = dict(mark=338, one=2205, two=550, three=1199, end=909)
START = {}
_at = 0
for _k, _d in SCENES.items():
	START[_k] = _at
	_at += _d
TOTAL = _at
LOCKUP_F = START['end'] + 659
GRID = LOCKUP_F % BARF  # bar 0 starts here, so the lockup is a downbeat
DUR = TOTAL / FPS + 0.3
N = int(DUR * SR)
TT = np.arange(N) / SR
rng = np.random.default_rng(5)


def at(scene, frame=0):
	return (START[scene] + frame) / FPS


def beat_t(k):
	return GRID / FPS + k * BEAT


def beat_after(t):
	"""The first beat at or just before t (a quarter-beat early still counts)."""
	return int(np.ceil((t - GRID / FPS) / BEAT - 0.25))


def t_(dur):
	return np.arange(int(dur * SR)) / SR


def lp(x, fc, order=2):
	return sosfilt(butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos'), x, axis=0)


def hp(x, fc, order=2):
	return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x, axis=0)


def bp(x, lo, hi, order=2):
	return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=0)


def midi(n):
	return 440 * 2 ** ((n - 69) / 12)


def noise(n):
	return rng.standard_normal(n)


BUSES = ('pluck', 'bass', 'marimba', 'glock', 'pad', 'perc', 'kick', 'ui', 'fx')
buses = {k: np.zeros((N, 2)) for k in BUSES}


def put(bus, sig, t0, gain=1.0, pan=0.0):
	i = int(round(t0 * SR))
	if i >= N or i < 0:
		return
	if sig.ndim == 1:
		l = np.cos((pan + 1) * np.pi / 4)
		r = np.sin((pan + 1) * np.pi / 4)
		sig = np.stack([sig * l, sig * r], axis=1) * np.sqrt(2)
	j = min(N, i + len(sig))
	buses[bus][i:j] += sig[: j - i] * gain


# ---------- instruments
def ks(note, dur=1.2, bright=0.6, decay=0.996):
	"""Karplus-Strong plucked string, computed a period at a time."""
	f = midi(note)
	P = max(2, int(round(SR / f)))
	n = int(dur * SR)
	y = np.zeros(n + P + 1)
	burst = noise(P)
	burst = lp(burst, 1500 + 9000 * bright)  # darker or brighter pick
	y[:P] = burst
	for s in range(P, n, P):
		e = min(n, s + P)
		prev = y[s - P : e - P]
		prev1 = y[s - P - 1 : e - P - 1] if s - P - 1 >= 0 else np.concatenate([[0], y[s - P : e - P - 1]])
		y[s:e] = decay * 0.5 * (prev + prev1[: len(prev)])
	x = y[:n]
	x -= np.mean(x[: min(n, 2000)])
	fade = np.clip((n - np.arange(n)) / (0.04 * SR), 0, 1)
	return hp(x * fade, 60) * 0.35


def marimba(note, vel=1.0):
	t = t_(0.9)
	f = midi(note)
	x = (np.sin(2 * np.pi * f * t) * np.exp(-t * 5.5)
		 + 0.45 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 16)
		 + 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 40))
	mallet = bp(noise(len(t)), 1500, 5000) * np.exp(-t * 600) * 0.15
	return (x + mallet) * np.minimum(1, t * 2500) * 0.2 * vel


def glock(note, vel=1.0, dur=1.6):
	t = t_(dur)
	f = midi(note)
	x = (np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2)
		 + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
		 + 0.18 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 12)
		 + 0.06 * np.sin(2 * np.pi * f * 8.93 * t) * np.exp(-t * 20))
	return x * np.minimum(1, t * 3000) * 0.11 * vel


def pad(notes, dur, cutoff=1400, vel=1.0):
	"""Soft and warm: detuned sines with a little second harmonic, slow in and out."""
	t = t_(dur + 1.0)
	L = np.zeros_like(t)
	R = np.zeros_like(t)
	for n in notes:
		f = midi(n)
		for k, det in enumerate((-0.003, 0.0, 0.003)):
			ph = rng.uniform(0, 6.28)
			s = np.sin(2 * np.pi * f * (1 + det) * t + ph) + 0.25 * np.sin(4 * np.pi * f * (1 + det) * t + ph)
			if k == 0:
				L += s
			elif k == 2:
				R += s
			else:
				L += s * 0.7
				R += s * 0.7
	x = lp(np.stack([L, R], axis=1), cutoff)
	env = np.minimum(1, t / 0.5) ** 2 * np.clip((dur + 1.0 - t) / 1.0, 0, 1)
	return x * env[:, None] * 0.018 * vel


def subsine(note, dur, vel=1.0):
	"""A round sine under the pizzicato, for the weight a plucked string lacks."""
	t = t_(dur)
	x = np.sin(2 * np.pi * midi(note) * t)
	env = np.minimum(1, t * 150) * np.exp(-t * 2.5) * np.clip((dur - t) / 0.05, 0, 1)
	return x * env * 0.3 * vel


def woodblock(v=1.0, pitch=900):
	t = t_(0.08)
	x = np.sin(2 * np.pi * pitch * t) * np.exp(-t * 70) + bp(noise(len(t)), 1500, 4000) * np.exp(-t * 400) * 0.3
	return x * 0.12 * v


def snap(v=1.0):
	t = t_(0.15)
	n = bp(noise(len(t)), 1800, 5000)
	e = np.exp(-t * 90) + (t > 0.006) * np.exp(-np.clip(t - 0.006, 0, None) * 120) * 0.6
	return n * e * 0.22 * v


def shaker(v=1.0):
	t = t_(0.07)
	return hp(noise(len(t)), 6500) * np.sin(np.pi * np.clip(t / 0.07, 0, 1)) ** 2 * 0.05 * v


def kick(v=1.0):
	t = t_(0.32)
	f = 55 + 90 * np.exp(-t * 50)
	x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
	return np.tanh(x * 1.4) * 0.55 * v


def tap(v=1.0):
	t = t_(0.035)
	return (bp(noise(len(t)), 1200, 4500) * np.exp(-t * 280) + np.sin(2 * np.pi * 300 * t) * np.exp(-t * 160) * 0.4) * 0.05 * v


def swish(dur=0.5, up=True, v=1.0):
	t = t_(dur)
	n = noise(len(t))
	out = np.zeros(len(t))
	seg = int(0.015 * SR)
	for i in range(0, len(t), seg):
		p = i / len(t)
		fc = 700 + 4500 * (p if up else 1 - p)
		out[i : i + seg] = bp(n[i : i + seg], fc * 0.7, fc * 1.4)
	return out * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2 * 0.12 * v


def riser(dur, v=1.0):
	t = t_(dur)
	n = noise(len(t))
	out = np.zeros(len(t))
	seg = int(0.02 * SR)
	for i in range(0, len(t), seg):
		p = i / len(t)
		fc = 500 + 7000 * p**2
		out[i : i + seg] = bp(n[i : i + seg], fc * 0.75, min(fc * 1.35, 21000))
	return out * (np.linspace(0, 1, len(t)) ** 2.5) * 0.12 * v


def thump(v=1.0):
	t = t_(1.2)
	f = 60 * np.exp(-t * 3) + 40
	return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3) * 1.3) * 0.45 * v


# ---------- harmony
# (bass root, chord tones for the marimba and pad)
MAJOR = [(38, [62, 66, 69, 74]), (35, [59, 62, 66, 71]), (31, [59, 62, 67, 71]), (33, [61, 64, 69, 73])]
MINOR = [(38, [62, 65, 69, 74]), (34, [58, 62, 65, 70]), (31, [58, 62, 67, 70]), (33, [61, 64, 69, 73])]
MOTIF = [69, 74, 76, 78]  # the mark's four notes: A, D, E, F#
MOTIF_M = [69, 74, 76, 77]  # in the dark: F natural
# the marimba's eighth-note figure, as chord-tone indices
FIG = [0, 2, 1, 3, 2, 1, 3, 2]

# ---------- when things come in (seconds)
T = dict(
	code=at('one', 100),  # the code appears: the clock starts
	box=at('one', 420),  # the box: pizzicato bass
	pad_=at('one', 580),  # the padding: marimba
	shadow=at('one', 892),  # shadow-sm: the pad
	rest=at('one', 950),  # the card fills in: snaps
	button=at('one', 1134),  # the button: shaker, the melody
	dark=at('one', 1560),
	light=at('one', 2125),
	bento=at('two', 262),  # the wall: the kick
	ask=at('three', 44),
	send=at('three', 151),
	ask2=at('three', 575),
	send2=at('three', 683),
	slider_dark=at('three', 1059),
	end_light=at('end', 14),
	ring=at('end', 463),
	fold=at('end', 573),
	lock=at('end', 659),
)


def dark_at(t):
	return T['dark'] <= t < T['light'] or T['slider_dark'] <= t < T['end_light']


def breakdown(t):
	"""The prompts: the band steps back to the clock while the words are typed."""
	return T['ask'] - 0.2 <= t < T['send'] + 0.3 or T['ask2'] - 0.2 <= t < T['send2'] + 0.3


K0 = beat_after(0)
K_END = beat_after(T['lock'])
melody_bars = set()

for k in range(max(0, K0), K_END):
	t = beat_t(k)
	if t < 0:
		continue
	bar = k // 4
	beat = k % 4
	dk = dark_at(t)
	root, tones = (MINOR if dk else MAJOR)[bar % 4]
	bd = breakdown(t)
	ringing = t >= T['ring']
	folding = t >= T['fold']
	if folding:
		continue  # the fold: only the pad and the riser, below
	# the clock: the code's tick, through stage one's typing and the prompts
	if (T['code'] <= t < T['bento'] and not dk) or bd:
		put('perc', woodblock(1.0 if beat == 0 else 0.6, 1100 if beat == 0 else 900), t, 1.0, pan=-0.2)
	# the pad, a chord per bar (it holds through the prompts too)
	if beat == 0 and t < T['shadow'] and t >= at('mark', 266):
		put('pad', pad([n - 12 for n in tones[:3]], BAR, 800, 0.8), t)  # a soft bed until the shadow brings the real pad
	if beat == 0 and t >= T['shadow']:
		put('pad', pad([n - 12 for n in tones], BAR, 900 if dk else 1500, 1.2 if dk or bd else 1.0), t)
	if bd:
		continue
	# pizzicato bass, on 1 and 3 (and the "and" of 4 once the kick is in)
	if t >= T['box']:
		if beat in (0, 2):
			put('bass', ks(root + (12 if beat == 2 and not dk else 0), 0.9, 0.35, 0.993), t, 1.0)
			put('bass', subsine(root - 12 if root > 36 else root, BEAT * 1.9), t, 1.0)
		if beat == 3 and t >= T['bento']:
			put('bass', ks(root + 7, 0.4, 0.35, 0.99), t + BEAT / 2, 0.7)
	# marimba, in eighths
	if t >= T['pad_']:
		for e in range(2):
			idx = FIG[(beat * 2 + e) % 8]
			n = tones[idx] + (12 if ringing and e else 0)
			put('marimba', marimba(n, (0.9 if e == 0 else 0.6) * (0.7 if dk else 1.0)), t + e * BEAT / 2, 1.0, pan=0.3 * np.sin(k * 1.7 + e))
	# the ring spins: sixteenths, climbing
	if ringing:
		for s in range(4):
			n = tones[(beat * 4 + s) % 4] + 12 * (1 + (s // 2))
			put('glock', glock(n, 0.5 + 0.1 * s, 0.8), t + s * BEAT / 4, 1.0, pan=np.sin((k * 4 + s) * 0.8) * 0.6)
	# snaps on 2 and 4, then the shaker
	if t >= T['rest'] and beat in (1, 3):
		put('perc', snap(0.6 if dk else 1.0), t, 1.0, pan=0.15)
	if t >= T['button'] and not dk:
		for s in range(2):
			put('perc', shaker(1.0 if s else 0.6), t + s * BEAT / 2, 1.0, pan=0.35)
	# the kick, once the wall fills
	if t >= T['bento'] and beat in ((0, 2) if not dk else (0,)):
		put('kick', kick(), t, 1.0)
	# the melody: the motif on a plucked string, every other bar where the film opens out
	if beat == 0 and bar % 2 == 0 and (T['button'] <= t < T['dark'] or T['bento'] <= t < T['ask'] or at('three', 723) <= t < T['slider_dark'] or T['end_light'] <= t < T['ring']):
		mot = MOTIF_M if dk else MOTIF
		for i, (off, n) in enumerate(zip((0, 0.5, 1, 2), mot)):
			put('pluck', ks(n + 12 * (bar % 4 == 2), 1.4, 0.75, 0.997), t + off * BEAT, 1.0, pan=-0.15)

# the build pages: in sixteenths while the agent writes (marimba doubles up)
for a, b in ((at('three', 175), at('three', 360)), (at('three', 705), at('three', 870))):
	for k in range(beat_after(a), beat_after(b)):
		t = beat_t(k)
		root, tones = MAJOR[(k // 4) % 4]
		for s in (1, 3):
			put('marimba', marimba(tones[(k + s) % 4] + 12, 0.45), t + s * BEAT / 4, 1.0, pan=0.4)

# ---------- picture
# Mark: a note for each construction step, the motif as the logo fills, the chord on the lockup
put('glock', glock(MOTIF[0], 0.7), at('mark', 6), 1.0)
put('glock', glock(MOTIF[1], 0.6), at('mark', 48), 1.0, pan=-0.3)
put('glock', glock(MOTIF[2], 0.6), at('mark', 60), 1.0, pan=0.3)
put('pad', pad([50, 57, 62, 69], at('mark', 266) - at('mark', 6), 1100, 1.4), at('mark', 6))
put('marimba', marimba(MOTIF[0] - 12, 0.8), at('mark', 122), 1.0)
put('marimba', marimba(MOTIF[1] - 12, 0.8), at('mark', 194), 1.0)
for i, n in enumerate((62, 66, 69, 74, 78)):
	put('pluck', ks(n, 2.0, 0.7, 0.998), at('mark', 266) + i * 0.035, 1.0, pan=(i - 2) * 0.2)
put('glock', glock(MOTIF[3] + 12, 0.8, 2.4), at('mark', 266), 1.0)
put('fx', thump(0.6), at('mark', 266), 1.0)
put('fx', swish(0.4, False, 0.8), at('one', 0), 1.0)

# Stage One: every class that lands plays a note, climbing the scale
SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86]
LANDS = [116, 170, 250, 330, 356, 420, 440, 490, 580, 892, 950, 980, 1010, 1040, 1070, 1102, 1134,
		 1200, 1230, 1260, 1300, 1335, 1435, 1465, 1495, 1740, 1830, 1890, 1950]
for i, f in enumerate(LANDS):
	t = at('one', f)
	tones = SCALE if not dark_at(t) else [62, 65, 67, 69, 70, 74, 77, 79, 81, 82, 86]
	put('pluck', ks(tones[i % 7 + (i // 14) * 2], 0.9, 0.55, 0.995), t, 0.85, pan=rng.uniform(-0.3, 0.3))
# the radius, rounded-1 to rounded-6: up the glockenspiel
for i, f in enumerate((730, 754, 770, 786, 802, 818)):
	put('glock', glock(SCALE[3 + i], 0.8), at('one', f), 1.0, pan=(i - 2.5) * 0.15)
# dark mode, and back
put('fx', thump(0.8), T['dark'], 1.0)
put('glock', glock(MOTIF_M[3], 0.6, 2.0), T['dark'], 1.0)
put('fx', swish(0.5, True, 0.8), T['light'], 1.0)
put('glock', glock(MOTIF[3] + 12, 0.7, 2.0), T['light'], 1.0)

# Stage Two: the six elevations rise; the wall fills
for i in range(6):
	put('glock', glock(SCALE[i + 2], 0.7), at('two', 80 + i * 18), 1.0, pan=(i - 2.5) * 0.2)
for i, f in enumerate((262, 298, 334, 370, 406, 442)):
	put('pluck', ks(SCALE[i + 3], 0.8, 0.7), at('two', f), 0.6, pan=0.3)

# Stage Three: typing, sends, the page as it builds, the dark slider
for a, b in ((64, 151), (609, 683)):
	f = a
	while f < b:
		put('ui', tap(rng.uniform(0.7, 1.0)), at('three', f), 1.0, pan=rng.uniform(-0.15, 0.15))
		f += rng.choice([2, 2, 3, 3, 4])
for f in (151, 683):
	put('glock', glock(MOTIF[3], 0.6), at('three', f), 1.0)
for i, f in enumerate((183, 213, 235, 257, 299, 335)):
	put('glock', glock(SCALE[2 + i], 0.5), at('three', f), 1.0, pan=0.25)
put('fx', thump(0.6), T['slider_dark'], 1.0)

# End: a chord change on each recipe; the fold; the lockup
put('fx', swish(0.4, True, 0.6), T['end_light'], 1.0)
for i, f in enumerate((123, 208, 293, 378)):
	put('glock', glock(MOTIF[i], 0.8, 2.0), at('end', f), 1.0, pan=(i - 1.5) * 0.3)
	put('fx', swish(0.4, True, 0.4), at('end', f) - 0.15, 1.0)
put('pad', pad([50, 57, 62, 66], T['lock'] - T['fold'] + 0.3, 1200, 1.1), T['fold'])
put('fx', riser(T['lock'] - T['fold'], 1.0), T['fold'], 1.0)
# the lockup: the motif, whole, and the chord under it
for i, (off, n) in enumerate(zip((0, 0.12, 0.24, 0.36), MOTIF)):
	put('glock', glock(n + 12, 0.9, 3.0), T['lock'] + off, 1.0, pan=(i - 1.5) * 0.25)
for i, n in enumerate((38, 50, 57, 62, 66, 69, 74)):
	put('pluck', ks(n, 3.2, 0.6, 0.9985), T['lock'] + i * 0.02, 1.0, pan=(i - 3) * 0.15)
put('pad', pad([50, 57, 62, 66, 69], 3.5, 1600, 1.4), T['lock'])
put('marimba', marimba(74, 1.0), T['lock'])
put('fx', thump(0.9), T['lock'], 1.0)

# ---------- mix
MIX = dict(pluck=1.0, bass=1.2, marimba=0.9, glock=0.75, pad=1.0, perc=0.9, kick=1.1, ui=0.9, fx=0.8)


def delay(x, time, fb=0.3, taps=5):
	d = int(time * SR)
	out = np.zeros_like(x)
	src = x[:, 0] + x[:, 1]
	for k in range(1, taps + 1):
		out[d * k :, k % 2] += src[: N - d * k] * fb**k * 0.5
	return lp(out, 5000)


buses['pluck'] += delay(buses['pluck'], BEAT * 0.75, 0.35) * 0.5
buses['glock'] += delay(buses['glock'], BEAT * 0.75, 0.3) * 0.4

mix = sum(buses[k] * MIX[k] for k in BUSES)

ir_t = t_(2.6)
ir = noise(len(ir_t) * 2).reshape(-1, 2) * np.exp(-ir_t * 2.4)[:, None]
ir = lp(ir, 6000)
ir[: int(0.015 * SR)] = 0
send = buses['pluck'] + buses['marimba'] * 0.6 + buses['glock'] + buses['pad'] * 0.5 + buses['perc'] * 0.3 + buses['fx'] * 0.4
wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
mix = mix + hp(wet, 200) * 0.02

fade = np.ones(N)
tail = int(2.5 * SR)
fade[-tail:] = np.linspace(1, 0, tail) ** 1.5
mix *= fade[:, None]
mix = hp(mix, 30)
mix *= 10 ** (-16.5 / 20) / np.sqrt((mix**2).mean())
a = np.abs(mix)
mix = np.where(a > 0.8, np.sign(mix) * (0.8 + 0.15 * np.tanh((a - 0.8) / 0.15)), mix)
mix *= 0.9

out = (mix * 32767).astype(np.int16)
with wave.open('public/audio/score_ensemble.wav', 'wb') as w:
	w.setnchannels(2)
	w.setsampwidth(2)
	w.setframerate(SR)
	w.writeframes(out.tobytes())
print('wrote public/audio/score_ensemble.wav', round(DUR, 2), 's; grid at frame', GRID)

"""Synthesised score for the v2 film, from the brief.

Calm and precise, not epic; no vocals; 100 bpm; it grows as the film grows.
Felt piano, marimba plucks, soft percussion and a round bass: no pads, no saws.

	0 - 5.6s     the logo         one felt-piano motif, lots of air
	5.6 - 42.4s  the card         a soft pulse, then plucks build as the card gets detail
	42.4 - 51.5s the wall         fuller: the bass and light percussion come in
	51.5 - 71.5s the CRM          the most driving: steady momentum
	71.5 - 86.7s ring to lockup   lifts into a bright resolve, the last chord rings out

F major: Fmaj9, Am7, Dm9, Bbmaj9 (I, iii, vi, IV); the end lifts through
Bbmaj9 and C to Fmaj9. The bar grid starts where the lockup lands on a
downbeat. Scene lengths are copied from src/v2/Film.tsx: keep them in sync.

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
S16 = BEAT / 4

SCENES = dict(mark=338, one=2205, two=550, three=1199, end=909)
START = {}
_at = 0
for _k, _d in SCENES.items():
	START[_k] = _at / FPS
	_at += _d
TOTAL = _at / FPS
LOCK = START['end'] + 659 / FPS
BARF = int(round(BAR * FPS))  # 144 frames
GRID = ((START['end'] * FPS + 659) % BARF) / FPS  # bar 0 starts here
DUR = TOTAL + 0.3
N = int(DUR * SR)
rng = np.random.default_rng(100)


def bar_t(b, beat=0.0):
	return GRID + b * BAR + beat * BEAT


def bar_at(t):
	return int(round((t - GRID) / BAR))


B_CARD = bar_at(START['one'])
B_WALL = bar_at(START['two'])
B_CRM = bar_at(START['three'])
B_END = bar_at(START['end'])
B_LOCK = bar_at(LOCK)
B_DARK = bar_at(START['one'] + 1560 / FPS)  # the card goes dark
B_LIGHT = bar_at(START['one'] + 2125 / FPS)  # and back


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


BUSES = ('piano', 'pluck', 'bass', 'kick', 'perc')
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


# ---------- felt piano
def piano(note, vel=0.6, hold=1.5):
	"""A felted upright: slightly stretched partials, two strings a hair apart,
	upper partials dying first, a soft thump of felt, a damper at `hold`."""
	f0 = midi(note)
	tau = np.interp(note, [36, 60, 84], [4.5, 2.6, 1.0])  # how long the fundamental rings
	length = min(hold + 0.5, tau * 2.2)
	t = t_(length)
	K = int(max(1, min(14, 9000 / f0)))
	B = 0.0004
	bright = 0.55 + 0.6 * vel  # harder hits, brighter
	x = np.zeros_like(t)
	for k in range(1, K + 1):
		fk = k * f0 * np.sqrt(1 + B * k * k)
		amp = (1 / k**1.2) * np.exp(-(k - 1) * (1.15 - bright) * 0.9)
		dec = np.exp(-t / (tau / (1 + 0.35 * (k - 1))))
		for det in (-0.0005, 0.0005):
			x += np.sin(2 * np.pi * fk * (1 + det) * t + rng.uniform(0, 6.28)) * amp * dec * 0.5
	thump = lp(noise(len(t)), 260) * np.exp(-t * 60) * 0.25
	attack = np.minimum(1, t / 0.004)
	damper = np.clip((hold + 0.35 - t) / 0.35, 0, 1) ** 2
	x = lp(x * attack + thump, 2800 + 2600 * vel) * damper
	return x * 0.16 * vel


# ---------- the other voices
def pluck(note, vel=1.0):
	"""A soft marimba: wooden bar modes, a felt mallet."""
	t = t_(0.8)
	f = midi(note)
	x = (np.sin(2 * np.pi * f * t) * np.exp(-t * 6)
		 + 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 20)
		 + 0.08 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 45))
	mallet = lp(noise(len(t)), 1800) * np.exp(-t * 300) * 0.08
	return (x + mallet) * np.minimum(1, t / 0.002) * 0.13 * vel


def bass(note, dur, vel=1.0):
	"""Round: a sine with a little of its second and third, a plucked start."""
	t = t_(dur + 0.06)
	f = midi(note)
	x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) * np.exp(-t * 6) + 0.1 * np.sin(6 * np.pi * f * t) * np.exp(-t * 10)
	env = np.minimum(1, t / 0.005) * (0.65 + 0.35 * np.exp(-t * 5)) * np.clip((dur + 0.06 - t) / 0.06, 0, 1)
	return np.tanh(x * 1.2) * env * 0.26 * vel


def kick(vel=1.0):
	"""Soft and tight: round, short, no click."""
	t = t_(0.3)
	f = 52 + 70 * np.exp(-t * 45)
	x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 15)
	return np.tanh(x * 1.3) * 0.5 * vel


def rim(vel=1.0):
	t = t_(0.05)
	return (np.sin(2 * np.pi * 1400 * t) * 0.6 + bp(noise(len(t)), 1800, 5000) * 0.5) * np.exp(-t * 140) * 0.12 * vel


def shaker(vel=1.0):
	t = t_(0.07)
	return bp(noise(len(t)), 5500, 12000) * np.sin(np.pi * np.clip(t / 0.07, 0, 1)) ** 2 * 0.05 * vel


def hat(vel=1.0):
	t = t_(0.04)
	return bp(noise(len(t)), 7000, 15000) * np.exp(-t * 110) * 0.06 * vel


def clap(vel=1.0):
	"""A soft clap: brushed, not cracked."""
	t = t_(0.25)
	n = bp(noise(len(t)), 900, 4000)
	e = sum((t >= d) * np.exp(-np.clip(t - d, 0, None) * 160) for d in (0, 0.009, 0.018))
	e = e + (t >= 0.02) * np.exp(-np.clip(t - 0.02, 0, None) * 25) * 0.35
	return n * e * 0.12 * vel


# ---------- harmony: (bass root, piano voicing, pluck tones)
F = (41, [53, 57, 60, 64, 67], [65, 69, 72, 76, 79])  # Fmaj9
Am = (45, [52, 55, 60, 64, 67], [64, 67, 72, 76, 79])  # Am7
Dm = (38, [53, 57, 60, 64, 65], [62, 65, 69, 72, 76])  # Dm9
Bb = (46, [53, 57, 60, 62, 65], [62, 65, 69, 72, 74])  # Bbmaj9 (#11 colour from the E)
C = (36, [55, 60, 62, 65, 67], [60, 62, 67, 72, 74])  # Csus
PROG = [F, Am, Dm, Bb]
LIFT = [Bb, C, Dm, C]  # the end lifts here, into F
# the motif, the first thing heard: C, F, G, A (and its answer, down to F)
MOTIF = [(0, 72), (0.75, 77), (1.5, 79), (2.5, 81)]
ANSWER = [(0, 81), (0.75, 79), (1.5, 76), (2.5, 77)]


def chord_of(b):
	if B_END <= b < B_LOCK:
		return LIFT[(b - B_END) % 4]
	return PROG[b % 4]


# ---------- 0 - 5.6s: the logo. The motif, alone, with air.
for off, n in MOTIF:
	put('piano', piano(n, 0.5, 2.5), 0.15 + off * BEAT * 1.15, pan=(n - 76) * 0.04)
put('piano', piano(41, 0.35, 3.0), 0.15, pan=-0.2)
# the lockup of the mark (frame 266): the chord, softly
for i, n in enumerate(F[1]):
	put('piano', piano(n, 0.4, 2.0), 266 / FPS + i * 0.025, pan=(i - 2) * 0.15)

# ---------- the bars
last_bar = B_LOCK
for b in range(B_CARD, last_bar):
	t0 = bar_t(b)
	root, voicing, tones = chord_of(b)
	k = b - B_CARD  # bars into the card
	card = b < B_WALL
	dark = B_DARK <= b < B_LIGHT
	wall = B_WALL <= b < B_CRM
	crm = B_CRM <= b < B_END
	end = B_END <= b < B_LOCK

	# the piano: whole-bar chords in the card, then a rhythm as things drive
	if card:
		v = 0.32 if not dark else 0.28
		put('piano', piano(voicing[0] - (12 if dark else 0), v, BAR * 0.95), t0, pan=-0.15)
		for i, n in enumerate(voicing[1:]):
			put('piano', piano(n, v, BAR * 0.95), t0 + 0.02 * i, pan=(i - 1.5) * 0.12)
		if k % 2 == 1:  # the motif's answer, every other bar, high and quiet
			off, n = ANSWER[(k // 2) % 4]
			put('piano', piano(n, 0.3, 1.2), t0 + 2.5 * BEAT, pan=0.2)
	else:
		hits = ((0, 1.4), (1.5, 0.9), (2.5, 1.4)) if (crm or end) else ((0, 1.8), (2.5, 1.4))
		for beat, hold in hits:
			v = 0.36 if beat == 0 else 0.28
			for i, n in enumerate(voicing[1:]):
				put('piano', piano(n + (12 if end and i >= 2 else 0), v, hold * BEAT), t0 + beat * BEAT + 0.012 * i, pan=(i - 1.5) * 0.14)
		put('piano', piano(voicing[0], 0.3, BAR * 0.9), t0, pan=-0.2)

	# the pulse: a soft kick on the beat, from the second bar of the card
	if k >= 1:
		for beat in range(4):
			if dark and beat in (1, 3):
				continue  # the dark section breathes: half the pulse
			kv = 0.55 if card else 0.8 if wall else 1.0
			put('kick', kick(kv), t0 + beat * BEAT)

	# the plucks build as the card gets detail
	if card and not dark:
		steps = [0, 6] if k < 4 else [0, 3, 6, 10] if k < 8 else list(range(0, 16, 2))
		for s in steps:
			n = tones[[0, 2, 1, 3, 2, 4, 1, 3][(s // 2) % 8]]
			put('pluck', pluck(n, 0.75 + 0.25 * (s % 4 == 0)), t0 + s * S16, pan=0.35 * np.sin(s + b))
	elif dark:
		for s in (0, 6, 12):
			put('pluck', pluck(tones[[0, 2, 1][s // 6]] - 12, 0.6), t0 + s * S16, pan=0.2)
	else:
		# the wall: eighths; the CRM and the end: sixteenths, the ostinato that drives it
		sixteenths = crm or end
		for s in range(0, 16, 1 if sixteenths else 2):
			idx = [0, 2, 4, 2, 1, 3, 4, 3][(s if sixteenths else s // 2) % 8]
			n = tones[idx] + (12 if end and s % 4 == 2 else 0)
			v = (1.0 if s % 4 == 0 else 0.7 if s % 2 == 0 else 0.5) * (0.9 if sixteenths else 1.0)
			put('pluck', pluck(n, v), t0 + s * S16, pan=0.4 * np.sin(s * 1.3))

	# light percussion and the bass, from the wall on
	if not card:
		for beat in range(4):
			if beat in (1, 3):
				put('perc', clap(0.9 if crm or end else 0.7), t0 + beat * BEAT, pan=0.05)
			put('perc', shaker(0.9), t0 + beat * BEAT + BEAT / 2, pan=0.35)
			if crm or end:
				for s in range(4):
					put('perc', hat(1.0 if s == 2 else 0.5), t0 + beat * BEAT + s * S16, pan=-0.3)
		put('perc', rim(0.8), t0 + 3.5 * BEAT, pan=-0.2)
		# the bass: half notes in the wall, a moving eighth line in the CRM and the end
		if wall:
			put('bass', bass(root, BEAT * 1.9), t0)
			put('bass', bass(root, BEAT * 1.4), t0 + 2.5 * BEAT, 0.8)
		else:
			for beat, d, oct_ in ((0, 0.9, 0), (1, 0.4, 0), (1.5, 0.4, 12), (2.5, 0.9, 0), (3.5, 0.4, 7)):
				put('bass', bass(root + oct_, BEAT * d), t0 + beat * BEAT, 0.95 if beat == 0 else 0.75)
	elif k >= 8 and not dark:
		# late in the card, the bass hints in: one soft note a bar
		put('bass', bass(root, BEAT * 3.5, 0.5), t0)

	# the end: the motif comes back on top, in octaves, as the music lifts
	if end:
		mot = MOTIF if (b - B_END) % 2 == 0 else ANSWER
		for off, n in mot:
			put('piano', piano(n, 0.5, 0.9), t0 + off * BEAT, pan=0.1)
			put('piano', piano(n + 12, 0.32, 0.9), t0 + off * BEAT + 0.01, pan=0.25)

# the last bar before the lockup: a rising run on the piano into it
rb = B_LOCK - 1
for i, n in enumerate([60, 62, 65, 67, 69, 72, 74, 77]):
	put('piano', piano(n + 12, 0.32 + 0.03 * i, 0.5), bar_t(rb, 2) + i * S16, pan=(i - 3.5) * 0.08)

# ---------- the lockup: the motif, whole, over Fmaj9, and the chord rings out
t0 = bar_t(B_LOCK)
put('kick', kick(0.9), t0)
put('bass', bass(41, 3.5, 1.0), t0)
for i, n in enumerate([29, 41, 53, 57, 60, 64, 67, 72]):
	put('piano', piano(n, 0.55, 4.5), t0 + i * 0.02, pan=(i - 3.5) * 0.12)
for off, n in MOTIF:
	put('piano', piano(n + 12, 0.45, 3.0), t0 + 0.6 + off * BEAT * 0.5, pan=0.2)
put('pluck', pluck(84, 0.6), t0 + 0.6 + 2.5 * BEAT * 0.5, pan=0.3)

# ---------- mix
MIX = dict(piano=1.0, pluck=0.95, bass=0.95, kick=0.85, perc=1.25)
# keep the piano's low end clear for the bass: a gentle cut under 140 Hz
buses['piano'] = buses['piano'] * 0.4 + hp(buses['piano'], 140) * 0.6

# the pulse breathes: everything tonal dips a little under each kick
env = np.sqrt(np.maximum(lp((buses['kick'] ** 2).mean(1), 20), 0))
duck = 1 - 0.35 * np.clip(env / (env.max() + 1e-9) * 3, 0, 1)
for k in ('pluck', 'bass'):
	buses[k] *= duck[:, None]

mix = sum(buses[k] * MIX[k] for k in BUSES)

# a warm room: decorrelated tails, darkened, a short pre-delay
ir_t = t_(2.4)
ir = noise(len(ir_t) * 2).reshape(-1, 2) * np.exp(-ir_t * 2.6)[:, None]
ir = lp(ir, 5000)
ir[: int(0.018 * SR)] = 0
send = buses['piano'] + buses['pluck'] * 0.7 + buses['perc'] * 0.4
wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
mix = mix + hp(wet, 180) * 0.03

fade = np.ones(N)
tail = int(1.5 * SR)
fade[-tail:] = np.linspace(1, 0, tail) ** 1.5
mix *= fade[:, None]
mix = hp(mix, 30)
mix *= 10 ** (-16 / 20) / np.sqrt((mix**2).mean())
a = np.abs(mix)
mix = np.where(a > 0.8, np.sign(mix) * (0.8 + 0.15 * np.tanh((a - 0.8) / 0.15)), mix)
mix *= 0.85

out = (mix * 32767).astype(np.int16)
with wave.open('public/audio/score_brief.wav', 'wb') as w:
	w.setnchannels(2)
	w.setsampwidth(2)
	w.setframerate(SR)
	w.writeframes(out.tobytes())
print('wrote public/audio/score_brief.wav', round(DUR, 2), 's; grid', round(GRID, 3), 's; bars',
	  dict(card=B_CARD, dark=B_DARK, light=B_LIGHT, wall=B_WALL, crm=B_CRM, end=B_END, lock=B_LOCK))

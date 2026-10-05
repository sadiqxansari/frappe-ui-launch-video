"""Synthesised score for the v2 film, after the reference reel (~/Downloads/original.mp4).

What the reference does, measured: 120 bpm, F# major, a sustained 808 sub on
F# under everything (two thirds of the energy is bass), warm chords that pump
hard against a four-on-the-floor kick, hats and claps on the beat, falling
"boing" chirps synced to what moves on screen, and a build (snare roll, a
rising sine, a noise riser) into half a second of silence before the drop.

Here: the mark is the intro (drone, chirps, a hit on the lockup); stage one
grooves with a chirp on every class that lands; dark mode is the breakdown;
the six elevations are the build, and the wall of components is the drop;
the prompts filter down to the typing; the ring is the last build, a gap,
and the lockup is the final hit.

Sound follows the picture, on its own 'sfx' bus (the chirps stay off):
- stage one: the groove ramps in over a second (a riser into the first kick,
  kick 0.35 -> 0.7 -> full, hats, claps, and the chord filter opening);
  nothing but chords and sub for the last 67 frames before dark, then a
  reversed crash into the hit; no clap on the light switch;
- each surface-elevation change in dark gets a lift(): a soft warm bell, a
  swoosh up (or down, settling) and a low thump;
- stage two: six lifts up an F# arpeggio on the shadow steps (eighth notes),
  snares on the steps, then a 16th roll; one pop() per wall tile as it
  reveals, notes cycling up the chord, panned by x, and a chord stab per level;
- stage three: real keyboard clicks (key()) on the typing, a heavy enter on send;
- the end: a quiet swoosh across each recipe move, landing on the beat.

F#, D#m, B, C# (two bars each). The grid is set so the lockup lands on a
downbeat. Cue frames are copied from the scene constants in src/v2: keep
them in sync. Run with numpy + scipy:
../fc-launch-video/.venv/bin/python scripts/score.py
"""

import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
FPS = 60
BEATF = 30  # 120 bpm
BEAT = BEATF / FPS
S16 = BEAT / 4

SCENES = dict(mark=338, one=2205, two=550, three=1199, end=909)
START = {}
_at = 0
for _k, _d in SCENES.items():
	START[_k] = _at
	_at += _d
TOTAL = _at
LOCK = START['end'] + 659
GRID = LOCK % (BEATF * 4)
DUR = TOTAL / FPS + 0.3
N = int(DUR * SR)
TT = np.arange(N) / SR
rng = np.random.default_rng(12)


def fr(scene, f=0):
	"""A scene-local frame, as an absolute film frame."""
	return START[scene] + f


def sec(frame):
	return frame / FPS


def beat_frame(k):
	return GRID + k * BEATF


def downbeat_near(frame):
	return GRID + round((frame - GRID) / (BEATF * 4)) * BEATF * 4


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


def lp_sweep(x, c0, c1, n=8):
	"""A low-pass whose cutoff glides c0 -> c1 over x (state carried between slices)."""
	out = np.empty_like(x)
	zi = None
	seg = int(np.ceil(len(x) / n))
	for i in range(n):
		c = c0 + (c1 - c0) * (i + 0.5) / n
		sos = butter(2, min(c, SR * 0.45), 'low', fs=SR, output='sos')
		if zi is None:
			zi = np.zeros((sos.shape[0], 2) + x.shape[1:])
		out[i * seg : (i + 1) * seg], zi = sosfilt(sos, x[i * seg : (i + 1) * seg], axis=0, zi=zi)
	return out


BUSES = ('kick', 'sub', 'chords', 'drums', 'chirp', 'fx', 'ui', 'sfx', 'swoosh')
buses = {k: np.zeros((N, 2)) for k in BUSES}


EVENTS = []  # (bus, tag, film frame): what the checks read


def put(bus, sig, t0, gain=1.0, pan=0.0, tag=''):
	EVENTS.append((bus, tag, t0 * FPS))
	i = int(round(t0 * SR))
	if i >= N or i < 0:
		return
	if sig.ndim == 1:
		l = np.cos((pan + 1) * np.pi / 4)
		r = np.sin((pan + 1) * np.pi / 4)
		sig = np.stack([sig * l, sig * r], axis=1) * np.sqrt(2)
	j = min(N, i + len(sig))
	buses[bus][i:j] += sig[: j - i] * gain


# ---------- sounds
def kick(v=1.0):
	t = t_(0.45)
	f = 45 + 150 * np.exp(-t * 35)
	body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
	click = bp(noise(len(t)), 2500, 9000) * np.exp(-t * 700) * 0.35
	return np.tanh((body + click) * 2.2) * 0.8 * v


def sub(note, dur, v=1.0):
	"""The 808 underneath: a sine, a touch of drive, held."""
	t = t_(dur + 0.05)
	f = midi(note)
	x = np.sin(2 * np.pi * f * t) + 0.15 * np.sin(4 * np.pi * f * t)
	env = np.minimum(1, t / 0.01) * np.clip((dur + 0.05 - t) / 0.05, 0, 1)
	return np.tanh(x * 1.6) * env * 0.42 * v


def chord(notes, dur, cutoff, v=1.0):
	"""Warm chords: band-limited saws, three voices a note, spread, darkened."""
	t = t_(dur + 0.1)
	L = np.zeros_like(t)
	R = np.zeros_like(t)
	for n in notes:
		f0 = midi(n)
		K = int(max(1, min(24, max(cutoff) * 1.6 / f0))) if isinstance(cutoff, tuple) else int(max(1, min(24, cutoff * 1.6 / f0)))
		for vi, det in enumerate((-0.007, 0.0, 0.007)):
			f = f0 * (1 + det)
			ph = rng.uniform(0, 6.28)
			s = sum(np.sin(2 * np.pi * k * f * t + ph * k) / k for k in range(1, K + 1))
			if vi == 0:
				L += s
			elif vi == 2:
				R += s
			else:
				L += s * 0.7
				R += s * 0.7
	x = np.stack([L, R], axis=1)
	x = lp_sweep(x, *cutoff) if isinstance(cutoff, tuple) else lp(x, cutoff)
	env = np.minimum(1, t / 0.01) * np.clip((dur + 0.1 - t) / 0.1, 0, 1)
	return x * env[:, None] * 0.03 * v


def clap(v=1.0):
	t = t_(0.35)
	n = bp(noise(len(t)), 900, 7000)
	e = sum((t >= d) * np.exp(-np.clip(t - d, 0, None) * 200) for d in (0, 0.008, 0.017, 0.026))
	e = e + (t >= 0.03) * np.exp(-np.clip(t - 0.03, 0, None) * 16) * 0.5
	return n * e * 0.3 * v


def snare(v=1.0):
	t = t_(0.25)
	tone = np.sin(2 * np.pi * 200 * t) * np.exp(-t * 35)
	n = bp(noise(len(t)), 1500, 10000) * np.exp(-t * 25)
	return (tone * 0.5 + n) * 0.28 * v


def hat(open_=False, v=1.0):
	dur = 0.3 if open_ else 0.045
	t = t_(dur)
	return bp(noise(len(t)), 7500, 16000) * np.exp(-t * (10 if open_ else 100)) * 0.16 * v


def chirp(f0=3000, f1=480, dur=0.35, v=1.0):
	"""The reference's signature: a falling sine 'boing' on a visual hit."""
	t = t_(dur)
	f = f1 + (f0 - f1) * np.exp(-t * 14)
	x = np.sin(2 * np.pi * np.cumsum(f) / SR)
	return x * np.exp(-t * 7) * np.minimum(1, t / 0.002) * 0.14 * v


def rise_sine(dur, f0=480, f1=1500, v=1.0):
	t = t_(dur)
	f = f0 * (f1 / f0) ** (t / dur)
	return np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / dur) ** 1.5 * 0.12 * v


def riser(dur, v=1.0):
	t = t_(dur)
	n = noise(len(t))
	out = np.zeros(len(t))
	seg = int(0.02 * SR)
	for i in range(0, len(t), seg):
		p = i / len(t)
		fc = 500 + 9000 * p**2
		out[i : i + seg] = bp(n[i : i + seg], fc * 0.75, min(fc * 1.35, 21000))
	return out * (np.linspace(0, 1, len(t)) ** 2.4) * 0.22 * v


def impact(v=1.0):
	t = t_(2.5)
	f = 60 * np.exp(-t * 2.5) + 30
	boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.5)
	air = bp(noise(len(t)), 3000, 12000) * np.exp(-t * 4) * 0.15
	return (np.tanh(boom * 2) + air) * 0.7 * v


def crash(v=1.0, dur=2.5):
	t = t_(dur)
	return bp(noise(len(t)), 4000, 15000) * np.exp(-t * 2) * np.minimum(1, t / 0.001) * 0.13 * v


# the elevation family: a soft warm bell, a swoosh leading into it, a low thump
LIFT_LEAD = 0.25  # the swoosh, before the hit
SW_DB = -4.5  # every swoosh peaks this far under the bed around it: it supports the motion, never leads
SW = []  # (signal, start, tag), levelled against the bed once the rest is down


def swoosh(dur, up=True, v=1.0, pan_from=-0.15, pan_to=0.15):
	"""Soft motion air: pink-ish noise (independent L/R) through a wide band-pass gliding
	300 <-> 1800 Hz, a smooth swell peaking at 70%. Unit RMS at the peak, times v."""
	n = int(dur * SR)
	u = np.linspace(0, 1, n)
	ease = u * u * (3 - 2 * u)
	fc = 300 * 6 ** (ease if up else 1 - ease)
	x = np.zeros((n, 2))
	for ch in range(2):
		w = lp(noise(n), 3000)
		x[:, ch] = w * 0.6 + lp(w, 500) * 1.0  # a gentle tilt toward the lows
	out = np.zeros_like(x)
	zi = None
	seg = 480
	for i in range(0, n, seg):
		c = fc[i]
		sos = butter(2, [c / 1.9, min(c * 1.9, 20000)], 'band', fs=SR, output='sos')  # Q ~0.7, no resonance
		if zi is None:
			zi = np.zeros((sos.shape[0], 2, 2))
		out[i : i + seg], zi = sosfilt(sos, x[i : i + seg], axis=0, zi=zi)
	out /= rms_of(out)
	e = np.where(u < 0.7, np.sin(np.pi / 2 * u / 0.7) ** 2, np.cos(np.pi / 2 * (u - 0.7) / 0.3) ** 2)
	pan = pan_from + (pan_to - pan_from) * u
	l = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
	r = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
	return out * (e * v)[:, None] * np.stack([l, r], axis=1)


def rms_of(x):
	return float(np.sqrt((x**2).mean()) + 1e-12)


def lift(note, v=1.0):
	"""The bell and the thump, the hit at sample 0 (the swoosh is put_lift's)."""
	t = t_(0.8)
	f = midi(note)
	bell = (np.sin(2 * np.pi * f * t) + 0.1 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 6) * np.minimum(1, t / 0.008) * 0.35
	bell = lp(bell, 2500)
	th = t_(0.08)
	bell[: len(th)] += np.sin(2 * np.pi * 55 * th) * np.exp(-th * 45) * np.minimum(1, th / 0.003) * 0.35
	return bell * v


def put_lift(note, frame, up=True, v=1.0, pan=0.0, bus='sfx'):
	put(bus, lift(note, v), sec(frame), pan=pan, tag='lift')
	SW.append((swoosh(LIFT_LEAD, up), sec(frame) - LIFT_LEAD))


def pop(note, v=1.0):
	"""A marimba-ish pluck: sine and a quiet octave, a hair of pitch drop."""
	t = t_(0.3)
	f = midi(note) * (1 + 0.03 * np.exp(-t * 60))
	ph = np.cumsum(f) / SR
	x = np.sin(2 * np.pi * ph) + 0.3 * np.sin(4 * np.pi * ph)
	return x * np.exp(-t * 28) * np.minimum(1, t / 0.003) * 0.3 * v


def click(v=1.0, release=False):
	"""A button click, the send: a tight tick with a short ping in it; the release a touch higher and quieter."""
	t = t_(0.04)
	p = 1.12 if release else 1.0
	tick = lp(bp(noise(len(t)), 2000 * p, 6000 * p), 7000) * np.exp(-t * 1400)
	ping = np.sin(2 * np.pi * 1700 * p * t) * np.exp(-t * 260) * 0.35
	body = np.sin(2 * np.pi * 420 * p * t) * np.exp(-t * 180) * 0.5
	return (tick + ping + body) * np.minimum(1, t / 0.0005) * 0.6 * (0.55 if release else 1.0) * v


def key(v=1.0, big=False):
	"""A keystroke: a soft muted thock, barely any click on top. big = the enter key."""
	p = rng.uniform(0.92, 1.08)
	t = t_(0.08)
	click = lp(bp(noise(len(t)), 1500 * p, 3500 * p), 4000) * np.exp(-t * 800)
	body = bp(noise(len(t)), 250 * p, 900 * p) * 0.6 + np.sin(2 * np.pi * 220 * p * t) * 0.8
	body = body * np.exp(-t * (60 if big else 110)) * np.minimum(1, t / 0.001) * (1.5 if big else 1.0)
	return (click * 0.3 + body) * 0.7 * rng.uniform(0.8, 1.2) * v


# ---------- harmony: F#, D#m, B, C#, two bars each
PROG = [(30, [54, 58, 61, 66]), (27, [51, 54, 58, 63]), (35, [54, 59, 63, 66]), (37, [53, 56, 61, 65])]


def chord_at(k):
	"""The chord on beat k (two bars a chord)."""
	return PROG[(k // 8) % 4]


# ---------- the map, in film frames
def one(f):
	return fr('one', f)


DARK, LIGHT = one(1560), one(2125)
PRE = one(1523)  # the groove's last beat is the downbeat before: 1493
DROP = fr('two', 248)  # the wall fills, on a downbeat (CARD in StageTwo.tsx)
BUILD1 = fr('two', 98)  # the six elevations climb (FIRST in StageTwo.tsx, on a beat)
ASKS = [(fr('three', 44), fr('three', 175)), (fr('three', 575), fr('three', 705))]
SLIDER = (fr('three', 1059), fr('end', 14))
RING = fr('end', 469)  # RING in End.tsx
GAP = LOCK - BEATF  # the beat of silence before the lockup
KICK_IN = one(113)  # the code appears; the first kick, on the first beat after it
# the groove ramps in: a riser into 113, kick 0.35 -> 0.7 (143) -> full (173), the chord filter opening from 83
RAMP = (one(83), one(113), one(143), one(173))
assert (DROP - GRID) % (BEATF * 4) == 0 and (one(173) - GRID) % (BEATF * 4) == 0 and (one(1493) - GRID) % (BEATF * 4) == 0
assert (KICK_IN - GRID) % BEATF == 0 and (fr('two', 98) - GRID) % BEATF == 0 and (fr('end', 29) - GRID) % BEATF == 0

# when each surface class has finished typing (SURF_DONE in StageOne.tsx, computed with typedAt): elevation-1, -2, -3, back to -2
SURF = [one(f) for f in (1768.8, 1835.2, 1895.2, 1955.2)]
# the wall, tile by tile: (scene frame, x across the wall -1..1, level), from wallTiles() in StageTwo.tsx
# (at = LEVEL_AT[l] + (rank - COUNTS[l-1]) * 3, LEVEL_AT = 248, 278, ... 398; x is the tile centre across the wall)
TILES = [(248, -0.084, 0), (278, -0.084, 1), (308, 0.168, 2), (311, -0.503, 2), (338, -0.336, 3), (341, 0, 3), (344, -0.503, 3), (347, 0.42, 3),
		 (368, 0.336, 4), (371, 0.084, 4), (374, 0.336, 4), (377, -0.252, 4), (380, -0.336, 4), (383, 0.252, 4), (386, -0.839, 4), (389, 0.084, 4),
		 (398, 0.503, 5), (401, -0.755, 5), (404, -0.839, 5), (407, -0.755, 5), (410, 0.755, 5), (413, 0.755, 5), (416, 0.839, 5), (419, 0.755, 5),
		 (422, -0.755, 5), (425, 0.839, 5), (428, 0.671, 5)]
LEVEL_AT = [248, 278, 308, 338, 368, 398]
# the recipes: each app settles in the centre at STEP + i * HOLD + MOVE (End.tsx), and the column starts moving MOVE before
MOVE = 40
ARRIVE = [109 + i * 90 + MOVE for i in range(4)]


def in_(f, a, b):
	return a <= f < b


def section(f):
	if f < KICK_IN:
		return 'intro'
	if in_(f, PRE, DARK):
		return 'pre'  # chords and sub only: nothing to cut off when the page goes dark
	if in_(f, DARK, LIGHT):
		return 'breakdown'
	if in_(f, LIGHT, DROP - BEATF):
		return 'half' if f < BUILD1 else 'build'
	if in_(f, DROP - BEATF, DROP):
		return 'gap'
	if any(in_(f, a, b) for a, b in ASKS):
		return 'filtered'
	if in_(f, *SLIDER):
		return 'filtered'
	if in_(f, RING, GAP):
		return 'build'
	if in_(f, GAP, LOCK):
		return 'gap'
	if f >= LOCK:
		return 'out'
	return 'groove' if f < DROP else 'full'


def one_cut(f):
	"""Stage one's chord filter: dark 500, opening to 1100 over the ramp, then on up to 2000 by dark."""
	a, b = RAMP[0], RAMP[3]
	if f <= a:
		return 500
	if f < b:
		return 500 + 600 * (f - a) / (b - a)
	return 1100 + 900 * min(1, (f - b) / (DARK - b))


def ramp(f):
	"""0..1 across the groove's entry."""
	return 0.35 if f < RAMP[2] else 0.7 if f < RAMP[3] else 1.0


pump = np.ones(N)


def pump_at(t0, depth=0.12, length=0.42):
	"""The sidechain: everything tonal ducks on the beat and swells back."""
	i = int(t0 * SR)
	dk = depth + (1 - depth) * (np.linspace(0, 1, int(length * SR)) ** 1.6)
	j = min(N, i + len(dk))
	pump[i:j] = np.minimum(pump[i:j], dk[: j - i])


k = 0
while beat_frame(k) < LOCK:
	f = beat_frame(k)
	t = sec(f)
	s = section(f)
	root, notes = chord_at(k)
	beat = k % 4
	if f < 0:
		k += 1
		continue
	# the sub and the chords, a beat at a time (the filter glides across each)
	if s != 'gap':
		if s in ('intro', 'groove', 'pre'):
			cutoff = (one_cut(f), one_cut(f + BEATF))
			swell = 0.8 + 0.2 * min(1, max(0, (f - RAMP[0]) / (RAMP[3] - RAMP[0]))) if s == 'intro' else 1.0
		else:
			swell = 0.8 if s in ('breakdown', 'filtered') else 1.0
			cutoff = {'breakdown': 600, 'half': 1400,
					  'build': 1400 + 1800 * min(1, max(0, (f - BUILD1) / max(1, DROP - BUILD1))) if f < DROP else 2600 + 1400 * (f - RING) / (GAP - RING),  # the ring's build opens on from 'full', no dip
					  'full': 2600, 'filtered': 700}[s]
		put('chords', chord(notes, BEAT, cutoff, swell), t)
		put('sub', sub(root, BEAT, swell if s == 'intro' else 0.8 if s == 'filtered' else 1.0), t)
	# the kick, and the pump it makes
	if s == 'groove':
		g = ramp(f)
		put('kick', kick(g), t)
		pump_at(t, 1 - 0.88 * g)
	elif s in ('full', 'build'):
		put('kick', kick(), t)
		pump_at(t)
	elif s == 'half':
		if beat in (0, 2):
			put('kick', kick(), t)
		pump_at(t, 0.2)
	elif s in ('intro', 'breakdown', 'filtered', 'pre'):
		pump_at(t, 0.35, 0.45)  # a ghost pump: it still breathes
	# claps, hats
	if s == 'groove' and beat in (1, 3) and f >= RAMP[3]:
		put('drums', clap(0.9), t, tag='clap')
	if s == 'full' and beat in (1, 3):
		put('drums', clap(1.1), t, tag='clap')
	if s == 'groove' and f >= RAMP[2]:
		put('drums', hat(v=0.5 if f < RAMP[3] else 1.0), t + BEAT / 2, pan=-0.25)
	if s in ('full', 'half'):
		put('drums', hat(v=1.0), t + BEAT / 2, pan=-0.25)
		if s == 'full':
			put('drums', hat(v=0.5), t + S16, pan=-0.25)
			put('drums', hat(v=0.5), t + 3 * S16, pan=-0.25)
			if beat == 3:
				put('drums', hat(True, 0.7), t + BEAT / 2, pan=0.25)
	if s in ('breakdown', 'filtered'):
		put('drums', hat(v=0.5), t + BEAT / 2, pan=-0.25)
	k += 1

# the builds: the ring's snare roll speeds up; both get a rising sine and a riser, then the gap
for a, b in ((BUILD1, DROP - BEATF), (RING, GAP)):
	ta, tb = sec(a), sec(b)
	if a == RING:
		t = ta
		while t < tb - 0.01:
			p = (t - ta) / (tb - ta)
			# faded in from almost nothing, sparse first, so the roll grows out of the groove
			put('drums', snare(0.06 + 0.94 * p**1.8), t, pan=rng.uniform(-0.1, 0.1))
			t += BEAT / (1 if p < 0.3 else 2 if p < 0.55 else 4 if p < 0.8 else 8)
	put('fx', riser(tb - ta, 1.0), ta)
	put('fx', rise_sine(min(1.2, tb - ta), 480, 1500, 1.0), tb - min(1.2, tb - ta))

# ---------- picture
# the mark: chirps on the construction, the bouncing logo, a hit on the lockup
for f, f0 in ((6, 2400), (48, 3200), (60, 2800), (122, 3600), (194, 3000)):
	put('chirp', chirp(f0, 450), sec(fr('mark', f)), pan=rng.uniform(-0.3, 0.3))
put('fx', riser(sec(266) - 0.5, 0.6), 0.5)
put('kick', kick(1.2), sec(266))
put('drums', clap(1.1), sec(266), tag='clap')
put('fx', impact(0.8), sec(266))
put('drums', crash(0.8), sec(266))
# stage one: a chirp on every class that lands, a little higher each time
LANDS = [116, 170, 250, 330, 356, 420, 440, 490, 580, 730, 754, 770, 786, 802, 818, 892, 950, 980, 1010, 1040,
		 1070, 1102, 1134, 1200, 1230, 1260, 1300, 1335, 1435, 1465, 1495, 1740, 1830, 1890, 1950]
for i, f in enumerate(LANDS):
	put('chirp', chirp(2200 + (i % 7) * 260, 420 + (i % 5) * 30, 0.3, 0.8), sec(one(f)), pan=rng.uniform(-0.35, 0.35))
# the groove comes in: a noise swell that ends on its first kick
put('fx', riser(0.9, 0.5), sec(KICK_IN) - 0.9)
# the page goes dark: a reversed crash swells into the hit, and the hit
put('fx', crash(0.8, 0.6)[::-1] * np.linspace(0.3, 1, int(0.6 * SR)) ** 1.5, sec(DARK) - 0.6)
put('fx', impact(0.9), sec(DARK))
put('drums', crash(0.8), sec(DARK))
put('drums', crash(0.8), sec(LIGHT))
# the card lifts off the page in dark: a lift on each surface class
ELEV_V = 1.2
for f, note, up, v in zip(SURF, (61, 66, 70, 66), (True, True, True, False), (1.0, 1.0, 1.0, 0.7)):
	put_lift(note, f, up, v * ELEV_V)
# stage two: six lifts up an F# arpeggio on the shadow steps (eighth notes), a snare on each, then a 16th roll
RISE = [18, 40, 70, 106, 146, 196]  # StageTwo.tsx: how high each step is
for i in range(6):
	f = fr('two', 98 + 15 * i)
	assert (i % 2 == 1) or (f - GRID) % BEATF == 0
	put_lift((54, 58, 61, 66, 70, 73)[i], f, True, 0.5 + 0.5 * (RISE[i] - RISE[0]) / (RISE[5] - RISE[0]), pan=-0.6 + 0.24 * i)
	put('drums', snare(0.4 + 0.5 * i / 5), sec(f), pan=-0.3 + 0.12 * i)
for j in range(1, 6):
	put('drums', snare(0.5 + 0.5 * j / 5), sec(fr('two', 173)) + j * S16, pan=rng.uniform(-0.1, 0.1))
put_lift(54, fr('two', 200), False, 0.8)  # the card drops back flat
put('fx', impact(1.1), sec(DROP))
put('drums', crash(1.1), sec(DROP))
put('kick', kick(1.2), sec(DROP))
# the wall: a pop per tile as it draws in, up the level's chord; a chord stab on each level
lv_n = [sum(1 for tl in TILES if tl[2] == l) for l in range(6)]
seen = [0] * 6
for at, x, l in TILES:
	kk = round((fr('two', LEVEL_AT[l]) - GRID) / BEATF)
	tones = sorted(chord_at(kk)[1])
	j = seen[l]
	seen[l] += 1
	put('sfx', pop(tones[j % 4] + 12 * (1 + j // 4), 0.9 / np.sqrt(lv_n[l])), sec(fr('two', at)), pan=0.6 * x, tag='pop')
for l, at in enumerate(LEVEL_AT):
	kk = round((fr('two', at) - GRID) / BEATF)
	put('sfx', chord(chord_at(kk)[1], 0.18, 1500 + 2500 * l / 5, 3.0), sec(fr('two', at)), tag='stab')
# stage three: typing, sends, the page as it builds, the dark slider
KEY_V = 1.7
# a key per character, on the frame it appears: typed() in src/lib/anim.ts, the prompts in StageThree.tsx
for text, at, rate in (('Build a CRM deal page with frappe-ui', 64, 1.8), ('Add a dashboard with frappe-ui/charts', 609, 1.6)):
	for i, ch in enumerate(text, 1):
		f = at + int(np.ceil(i * rate - 1e-9))
		put('ui', key(KEY_V * (1.1 if ch == ' ' else 1.0)), sec(fr('three', f)), pan=rng.uniform(-0.15, 0.15), tag='key')
for f in (151, 683):
	# the send button is pressed for 6 frames (StageThree.tsx: press): a click down, and back up
	put('ui', click(KEY_V), sec(fr('three', f)), tag='enter')
	put('ui', click(KEY_V, True), sec(fr('three', f + 6)))
	SW.append((swoosh(0.3, True), sec(fr('three', f)) - 0.3))
	put('chirp', chirp(3400, 520), sec(fr('three', f)))
	put('drums', crash(0.6), sec(fr('three', f)))
for i, f in enumerate((183, 213, 235, 257, 299, 335)):
	put('chirp', chirp(2400 + i * 200, 480, 0.28, 0.7), sec(fr('three', f)), pan=0.25)
put('fx', impact(0.7), sec(SLIDER[0]))
# the end: a swoosh across each move, ending as each app settles in the centre (the kick on the beat is the landing)
put('drums', crash(0.7), sec(SLIDER[1]))
for i, f in enumerate(ARRIVE):
	SW.append((swoosh(MOVE / FPS, True, 1.0, 0.0, 0.0), sec(fr('end', f - MOVE))))
# the lockup: everything at once, the sub held, a last chirp a second later
tl = sec(LOCK)
put('kick', kick(1.3), tl)
put('drums', clap(1.3), tl, tag='clap')
put('drums', crash(1.3, 3.5), tl)
put('fx', impact(1.3), tl)
put('sub', sub(30, sec(TOTAL - LOCK) + 0.2, 1.2), tl)
put('chords', chord([54, 58, 61, 66, 70], sec(TOTAL - LOCK), 2200, 1.1), tl)
put('chirp', chirp(3800, 460, 0.5, 1.0), tl + 1.0)

# ---------- mix
for k_ in ('chords', 'sub'):
	buses[k_] *= (pump ** (1.0 if k_ == 'chords' else 0.5))[:, None]
# the chirps on every class and click are off for now: True brings them back
CHIRPS = False
if not CHIRPS:
	buses['chirp'][:] = 0  # silenced at the source, so they reach neither the mix nor the reverb
def rms_of_(x):
	return float(np.sqrt((x**2).mean()) + 1e-12)


MIX = dict(kick=1.0, sub=0.5, chords=5.0, drums=1.4, chirp=1.6, fx=0.75, ui=1.0, sfx=1.0, swoosh=1.0)
# the swooshes go in last, each set SW_DB under the bed it sits in (the rest of the mix over its span)
# the swooshes are off for now: True brings them back
SWOOSHES = False
if not SWOOSHES:
	SW = []
bed0 = sum(buses[k_] * MIX[k_] for k_ in BUSES if k_ != 'swoosh')
for sig, t0 in SW:
	i = int(round(t0 * SR))
	bed_r = rms_of_(bed0[i : i + len(sig)])
	pk = max(rms_of_(sig[j : j + int(0.1 * SR)]) for j in range(0, max(1, len(sig) - int(0.1 * SR)), int(0.025 * SR)))
	put('swoosh', sig * (10 ** (SW_DB / 20) * bed_r / pk), t0, tag=f'swoosh:{len(sig) / SR}')
mix = sum(buses[k_] * MIX[k_] for k_ in BUSES)

ir_t = t_(1.6)
ir = noise(len(ir_t) * 2).reshape(-1, 2) * np.exp(-ir_t * 3.5)[:, None]
ir = lp(ir, 6000)
ir[: int(0.012 * SR)] = 0
send = buses['chirp'] + buses['drums'] * 0.4 + buses['chords'] * 0.3 + buses['sfx'] * 0.5 + buses['swoosh'] * 0.5
wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
mix = mix + hp(wet, 250) * 0.03

fade = np.ones(N)
tail = int(1.2 * SR)
fade[-tail:] = np.linspace(1, 0, tail) ** 1.5
mix *= fade[:, None]
mix = hp(mix, 25)
ui_lin = hp(buses['ui'] * MIX['ui'] * fade[:, None], 25)  # the keys alone, to measure them against the rest
sw_lin = hp(buses['swoosh'] * MIX['swoosh'] * fade[:, None], 25)
bed_lin = mix - ui_lin
sw_bed = mix - sw_lin
# loud and punchy, like the reference: drive it into a soft limiter
mix *= 10 ** (-11.5 / 20) / np.sqrt((mix**2).mean())
a = np.abs(mix)
mix = np.where(a > 0.7, np.sign(mix) * (0.7 + 0.25 * np.tanh((a - 0.7) / 0.25)), mix)
mix *= 0.88



# ---------- checks: how loud the new cues sit over what is under them
def rms(x):
	return float(np.sqrt((x**2).mean()) + 1e-12)


def db(a, b):
	return 20 * np.log10(rms(a) / rms(b))


def win(x, t0, t1):
	return x[max(0, int(t0 * SR)) : int(t1 * SR)]


print('elevation hits, 150 ms at the hit vs the 500 ms before (dB):')
for f in SURF:
	t = sec(f)
	print('  frame', round(f, 1), round(db(win(mix, t, t + 0.15), win(mix, t - 0.5, t)), 1))
marg = [db(win(ui_lin, sec(f_), sec(f_) + 0.03), win(bed_lin, sec(f_), sec(f_) + 0.03)) for b_, tg, f_ in EVENTS if tg == 'key']
print('keystrokes:', len(marg), '; 30 ms over the bed, min / mean (dB):', round(min(marg), 1), round(sum(marg) / len(marg), 1))

print('swooshes, peak 100 ms RMS vs the bed over the swoosh (dB; target -3 to -6):')
for grp, lo_, hi_ in (('lift (stage one + two)', 0, START['three']), ('enter', START['three'], START['end']), ('recipe move', START['end'], 1e9)):
	m = []
	for b_, tg, f_ in EVENTS:
		if tg.startswith('swoosh') and lo_ <= f_ < hi_:
			a_, d_ = sec(f_), float(tg.split(':')[1])
			pk = max(rms(win(sw_lin, a_ + x_, a_ + x_ + 0.1)) for x_ in np.arange(0, max(0.01, d_ - 0.1), 0.025))
			m.append(20 * np.log10(pk / rms(win(sw_bed, a_, a_ + d_))))
	if m:
		print(' ', grp, len(m), 'min', round(min(m), 1), 'max', round(max(m), 1))

out = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open('public/audio/score.wav', 'wb') as w:
	w.setnchannels(2)
	w.setsampwidth(2)
	w.setframerate(SR)
	w.writeframes(out.tobytes())
print('wrote public/audio/score.wav', round(DUR, 2), 's; drop at', round(sec(DROP), 2), 's; lockup at', round(sec(LOCK), 2), 's')

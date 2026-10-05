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


BUSES = ('kick', 'sub', 'chords', 'drums', 'chirp', 'fx', 'ui')
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
		K = int(max(1, min(24, cutoff * 1.6 / f0)))
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
	x = lp(np.stack([L, R], axis=1), cutoff)
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


def tap(v=1.0):
	t = t_(0.035)
	return (bp(noise(len(t)), 1200, 4500) * np.exp(-t * 280) + np.sin(2 * np.pi * 300 * t) * np.exp(-t * 160) * 0.4) * 0.07 * v


# ---------- harmony: F#, D#m, B, C#, two bars each
PROG = [(30, [54, 58, 61, 66]), (27, [51, 54, 58, 63]), (35, [54, 59, 63, 66]), (37, [53, 56, 61, 65])]


def chord_at(k):
	"""The chord on beat k (two bars a chord)."""
	return PROG[(k // 8) % 4]


# ---------- the map, in film frames
DARK, LIGHT = fr('one', 1560), fr('one', 2125)
DROP = downbeat_near(fr('two', 262))  # the wall fills
BUILD1 = fr('two', 80)  # the six elevations climb
ASKS = [(fr('three', 44), fr('three', 175)), (fr('three', 575), fr('three', 705))]
SLIDER = (fr('three', 1059), fr('end', 14))
RING = fr('end', 463)
GAP = LOCK - BEATF  # the beat of silence before the lockup
KICK_IN = fr('one', 100)  # the code appears


def in_(f, a, b):
	return a <= f < b


def section(f):
	if f < KICK_IN:
		return 'intro'
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
	# the sub and the chords, a beat at a time (so the filter can move)
	if s != 'gap':
		cutoff = {'intro': 500, 'groove': 1100 + 900 * min(1, (f - KICK_IN) / (DARK - KICK_IN)), 'breakdown': 600,
				  'half': 1400, 'build': 1400 + 1800 * min(1, max(0, (f - BUILD1) / max(1, DROP - BUILD1))) if f < DROP else 1600 + 2400 * (f - RING) / (GAP - RING),
				  'full': 2600, 'filtered': 700}[s]
		put('chords', chord(notes, BEAT, cutoff, 0.8 if s in ('intro', 'breakdown', 'filtered') else 1.0), t)
		put('sub', sub(root, BEAT, 0.8 if s in ('intro', 'filtered') else 1.0), t)
	# the kick, and the pump it makes
	if s in ('groove', 'full', 'build'):
		put('kick', kick(), t)
		pump_at(t)
	elif s == 'half':
		if beat in (0, 2):
			put('kick', kick(), t)
		pump_at(t, 0.2)
	elif s in ('intro', 'breakdown', 'filtered'):
		pump_at(t, 0.35, 0.45)  # a ghost pump: it still breathes
	# claps, hats
	if s in ('groove', 'full') and beat in (1, 3):
		put('drums', clap(0.9 if s == 'groove' else 1.1), t)
	if s == 'half' and beat == 2:
		put('drums', clap(1.0), t)
	if s in ('groove', 'full', 'half'):
		put('drums', hat(v=1.0), t + BEAT / 2, pan=-0.25)
		if s == 'full':
			put('drums', hat(v=0.5), t + S16, pan=-0.25)
			put('drums', hat(v=0.5), t + 3 * S16, pan=-0.25)
			if beat == 3:
				put('drums', hat(True, 0.7), t + BEAT / 2, pan=0.25)
	if s in ('breakdown', 'filtered'):
		put('drums', hat(v=0.5), t + BEAT / 2, pan=-0.25)
	k += 1

# the builds: a snare roll that speeds up, a rising sine, a riser, then the gap
for a, b in ((BUILD1, DROP - BEATF), (RING, GAP)):
	ta, tb = sec(a), sec(b)
	t = ta
	while t < tb - 0.01:
		p = (t - ta) / (tb - ta)
		put('drums', snare(0.35 + 0.65 * p), t, pan=rng.uniform(-0.1, 0.1))
		t += BEAT / (2 if p < 0.4 else 4 if p < 0.75 else 8)
	put('fx', riser(tb - ta, 1.0), ta)
	put('fx', rise_sine(min(1.2, tb - ta), 480, 1500, 1.0), tb - min(1.2, tb - ta))

# ---------- picture
# the mark: chirps on the construction, the bouncing logo, a hit on the lockup
for f, f0 in ((6, 2400), (48, 3200), (60, 2800), (122, 3600), (194, 3000)):
	put('chirp', chirp(f0, 450), sec(fr('mark', f)), pan=rng.uniform(-0.3, 0.3))
put('fx', riser(sec(266) - 0.5, 0.6), 0.5)
put('kick', kick(1.2), sec(266))
put('drums', clap(1.1), sec(266))
put('fx', impact(0.8), sec(266))
put('drums', crash(0.8), sec(266))
# stage one: a chirp on every class that lands, a little higher each time
LANDS = [116, 170, 250, 330, 356, 420, 440, 490, 580, 730, 754, 770, 786, 802, 818, 892, 950, 980, 1010, 1040,
		 1070, 1102, 1134, 1200, 1230, 1260, 1300, 1335, 1435, 1465, 1495, 1740, 1830, 1890, 1950]
for i, f in enumerate(LANDS):
	put('chirp', chirp(2200 + (i % 7) * 260, 420 + (i % 5) * 30, 0.3, 0.8), sec(fr('one', f)), pan=rng.uniform(-0.35, 0.35))
put('fx', impact(0.9), sec(DARK))
put('drums', crash(0.8), sec(DARK))
put('drums', crash(0.8), sec(LIGHT))
# stage two: a chirp per elevation; the drop
for i in range(6):
	put('chirp', chirp(2000 + i * 400, 500 + i * 60, 0.3, 0.8), sec(fr('two', 80 + i * 18)), pan=(i - 2.5) * 0.15)
put('fx', impact(1.1), sec(DROP))
put('drums', crash(1.1), sec(DROP))
put('kick', kick(1.2), sec(DROP))
# stage three: typing, sends, the page as it builds, the dark slider
for a, b in ((64, 151), (609, 683)):
	f = a
	while f < b:
		put('ui', tap(rng.uniform(0.7, 1.0)), sec(fr('three', f)), pan=rng.uniform(-0.15, 0.15))
		f += rng.choice([2, 2, 3, 3, 4])
for f in (151, 683):
	put('chirp', chirp(3400, 520), sec(fr('three', f)))
	put('drums', crash(0.6), sec(fr('three', f)))
for i, f in enumerate((183, 213, 235, 257, 299, 335)):
	put('chirp', chirp(2400 + i * 200, 480, 0.28, 0.7), sec(fr('three', f)), pan=0.25)
put('fx', impact(0.7), sec(SLIDER[0]))
# the end: a chirp per recipe
put('drums', crash(0.7), sec(SLIDER[1]))
for i, f in enumerate((123, 208, 293, 378)):
	put('chirp', chirp(2800 + i * 300, 500, 0.35, 1.0), sec(fr('end', f)), pan=(i - 1.5) * 0.3)
# the lockup: everything at once, the sub held, a last chirp a second later
tl = sec(LOCK)
put('kick', kick(1.3), tl)
put('drums', clap(1.3), tl)
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
MIX = dict(kick=1.0, sub=0.5, chords=5.0, drums=1.4, chirp=1.6, fx=0.75, ui=1.0)
mix = sum(buses[k_] * MIX[k_] for k_ in BUSES)

ir_t = t_(1.6)
ir = noise(len(ir_t) * 2).reshape(-1, 2) * np.exp(-ir_t * 3.5)[:, None]
ir = lp(ir, 6000)
ir[: int(0.012 * SR)] = 0
send = buses['chirp'] + buses['drums'] * 0.4 + buses['chords'] * 0.3
wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
mix = mix + hp(wet, 250) * 0.03

fade = np.ones(N)
tail = int(1.2 * SR)
fade[-tail:] = np.linspace(1, 0, tail) ** 1.5
mix *= fade[:, None]
mix = hp(mix, 25)
# loud and punchy, like the reference: drive it into a soft limiter
mix *= 10 ** (-11.5 / 20) / np.sqrt((mix**2).mean())
a = np.abs(mix)
mix = np.where(a > 0.7, np.sign(mix) * (0.7 + 0.25 * np.tanh((a - 0.7) / 0.25)), mix)
mix *= 0.88

out = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open('public/audio/score.wav', 'wb') as w:
	w.setnchannels(2)
	w.setsampwidth(2)
	w.setframerate(SR)
	w.writeframes(out.tobytes())
print('wrote public/audio/score.wav', round(DUR, 2), 's; drop at', round(sec(DROP), 2), 's; lockup at', round(sec(LOCK), 2), 's')

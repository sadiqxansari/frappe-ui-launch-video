"""Synthesised score for the v2 film: a beat that is built the way the UI is.

Drums and an 808, nothing else. The film builds things (a mark, a card a
token at a time, a wall of components, pages an agent writes) and the beat
builds with it: hats tick when the code appears, the kick comes in with the
box, claps with the padding, toms climb the radius steps, the 808 arrives
with the shadow, percussion as the card fills in. Dark mode goes half-time
and heavy; the wall of components is the drop; the prompts strip back to the
hats and the typing; the ring is a snare roll; one bar of air, then the
lockup hits.

120 bpm (one beat = 30 frames), D minor roots for the 808. The bar grid is
set so the lockup lands on a downbeat. Cue frames are copied from the scene
constants in src/v2: keep them in sync.
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
S16 = BEAT / 4

SCENES = dict(mark=338, one=2205, two=550, three=1199, end=909)
START = {}
_at = 0
for _k, _d in SCENES.items():
	START[_k] = _at
	_at += _d
TOTAL = _at
LOCKUP_F = START['end'] + 659
GRID = LOCKUP_F % BARF
DUR = TOTAL / FPS + 0.3
N = int(DUR * SR)
rng = np.random.default_rng(9)


def at(scene, frame=0):
	return (START[scene] + frame) / FPS


def beat_t(k):
	return GRID / FPS + k * BEAT


def beat_after(t):
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


BUSES = ('kick', 'bass', 'snare', 'hats', 'perc', 'toms', 'ui', 'fx')
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


# ---------- the kit
def kick(v=1.0, tight=1.0):
	"""Three layers: a click, a punchy body that drops in pitch, a sub tail."""
	t = t_(0.5)
	f = 50 + 160 * np.exp(-t * 38 * tight)
	body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7 * tight)
	click = bp(noise(len(t)), 2000, 8000) * np.exp(-t * 700) * 0.4
	knock = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 60) * 0.3
	return np.tanh((body + click + knock) * 2.0) * 0.8 * v


def bass808(note, dur, glide_from=None, v=1.0):
	t = t_(dur + 0.05)
	f0 = midi(note)
	f = f0 if glide_from is None else f0 + (midi(glide_from) - f0) * np.exp(-t * 16)
	x = np.sin(2 * np.pi * np.cumsum(f) / SR)
	env = np.minimum(1, t * 500) * np.exp(-t * 0.8) * np.clip((dur + 0.05 - t) / 0.05, 0, 1)
	return np.tanh(x * 2.5) * env * 0.4 * v


def snare(v=1.0):
	t = t_(0.35)
	tone = (np.sin(2 * np.pi * 185 * t) + 0.6 * np.sin(2 * np.pi * 330 * t)) * np.exp(-t * 30)
	wires = bp(noise(len(t)), 1800, 9000) * (np.exp(-t * 20) * 0.9)
	crack = hp(noise(len(t)), 5000) * np.exp(-t * 300) * 0.5
	return np.tanh((tone * 0.6 + wires + crack) * 1.3) * 0.3 * v


def clap(v=1.0):
	t = t_(0.4)
	n = bp(noise(len(t)), 900, 6500)
	e = np.zeros_like(t)
	for d in (0, 0.008, 0.017, 0.026):
		e += (t >= d) * np.exp(-np.clip(t - d, 0, None) * 200)
	e += (t >= 0.03) * np.exp(-np.clip(t - 0.03, 0, None) * 15) * 0.55
	return n * e * 0.28 * v


def _metal(t):
	return sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0))


def hat(open_=False, v=1.0):
	dur = 0.35 if open_ else 0.05
	t = t_(dur)
	x = bp(_metal(t) * 0.25 + noise(len(t)) * 0.6, 7000, 16000)
	return x * np.exp(-t * (8 if open_ else 95)) * 0.2 * v


def rim(v=1.0):
	t = t_(0.06)
	return (np.sin(2 * np.pi * 1650 * t) + 0.6 * np.sin(2 * np.pi * 3300 * t) + bp(noise(len(t)), 3000, 8000) * 0.4) * np.exp(-t * 130) * 0.2 * v


def tom(note, v=1.0):
	t = t_(0.5)
	f = midi(note) * (1 + 0.6 * np.exp(-t * 28))
	x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) + bp(noise(len(t)), 300, 3000) * np.exp(-t * 60) * 0.25
	return np.tanh(x * 1.6) * 0.45 * v


def perc(note, v=1.0):
	"""A short, tuned hand drum."""
	t = t_(0.22)
	f = midi(note) * (1 + 0.2 * np.exp(-t * 80))
	x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22) + bp(noise(len(t)), 2000, 6000) * np.exp(-t * 250) * 0.3
	return x * 0.28 * v


def shaker(v=1.0):
	t = t_(0.08)
	return hp(noise(len(t)), 6500) * np.sin(np.pi * np.clip(t / 0.08, 0, 1)) ** 2 * 0.07 * v


def crash(v=1.0, dur=3.0):
	t = t_(dur)
	x = bp(_metal(t * 1.7) * 0.3 + noise(len(t)), 4000, 15000)
	return x * np.exp(-t * 1.8) * np.minimum(1, t * 3000) * 0.12 * v


def tap(v=1.0):
	t = t_(0.035)
	return (bp(noise(len(t)), 1200, 4500) * np.exp(-t * 280) + np.sin(2 * np.pi * 300 * t) * np.exp(-t * 160) * 0.4) * 0.06 * v


def riser(dur, v=1.0):
	t = t_(dur)
	n = noise(len(t))
	out = np.zeros(len(t))
	seg = int(0.02 * SR)
	for i in range(0, len(t), seg):
		p = i / len(t)
		fc = 400 + 8000 * p**2.2
		out[i : i + seg] = bp(n[i : i + seg], fc * 0.75, min(fc * 1.35, 21000))
	return out * (np.linspace(0, 1, len(t)) ** 2.4) * 0.22 * v


def impact(v=1.0):
	t = t_(2.0)
	f = 55 * np.exp(-t * 2.5) + 35
	boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2)
	return np.tanh(boom * 1.8) * 0.65 * v


def sweep_down(dur=0.5, v=1.0):
	t = t_(dur)
	n = noise(len(t))
	out = np.zeros(len(t))
	seg = int(0.015 * SR)
	for i in range(0, len(t), seg):
		fc = 6000 - 5400 * i / len(t)
		out[i : i + seg] = bp(n[i : i + seg], fc * 0.7, fc * 1.4)
	return out * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2 * 0.2 * v


# ---------- when things come in (seconds)
T = dict(
	code=at('one', 100),  # hats
	box=at('one', 420),  # kick, on 1
	pad_=at('one', 580),  # kick on 1 and 3, claps on 2 and 4
	shadow=at('one', 892),  # the 808
	rest=at('one', 950),  # percussion
	button=at('one', 1134),  # sixteenth hats, four on the floor
	dark=at('one', 1560),
	light=at('one', 2125),
	bento=at('two', 262),  # the drop
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
ROOTS = [38, 38, 34, 36]  # D, D, Bb, C


def dark_at(t):
	return T['dark'] <= t < T['light'] or T['slider_dark'] <= t < T['end_light']


def breakdown(t):
	return T['ask'] - 0.2 <= t < T['send'] + 0.3 or T['ask2'] - 0.2 <= t < T['send2'] + 0.3


def peak(t):
	"""Where the film is busiest: the wall, the built pages, the recipes."""
	return T['bento'] <= t < T['ring'] and not dark_at(t)


sidechain = np.ones(N)


def duck(t0, depth=0.3, length=0.25):
	i = int(t0 * SR)
	dk = np.linspace(depth, 1, int(length * SR)) ** 2
	j = min(N, i + len(dk))
	sidechain[i:j] = np.minimum(sidechain[i:j], dk[: j - i])


def kick_at(t, v=1.0):
	put('kick', kick(v), t, 1.0)
	duck(t)


K_END = beat_after(T['fold'])
for k in range(0, K_END):
	t = beat_t(k)
	if t < T['code'] - 0.1:
		continue
	bar, beat = k // 4, k % 4
	dk = dark_at(t)
	bd = breakdown(t)
	root = ROOTS[bar % 4]
	full = peak(t) and not bd
	last_of_section = False
	# hats: eighths from the code on; sixteenths once the button lands
	if not dk:
		sixteenths = t >= T['button'] and not bd
		for s in range(4 if sixteenths else 2):
			off = s * (S16 if sixteenths else BEAT / 2)
			v = 1.0 if (s * (1 if sixteenths else 2)) % 4 == 2 else 0.55
			put('hats', hat(v=v), t + off, 1.0, pan=-0.25)
		if full and beat in (1, 3):
			put('hats', hat(True, 0.6), t + BEAT / 2, 1.0, pan=0.25)
	else:
		put('hats', hat(v=0.5), t + BEAT / 2, 1.0, pan=-0.25)
	if bd:
		# the prompts: a muffled pulse under the hats and the typing
		if beat == 0:
			put('kick', lp(kick(0.9), 400), t, 0.8)
		continue
	# the kick
	if dk:
		if beat == 0:
			kick_at(t, 1.1)
		if beat == 2 and bar % 2:
			kick_at(t + BEAT / 2, 0.8)
	elif t >= T['button']:
		kick_at(t)  # four on the floor
		if full and beat == 3 and bar % 2:
			kick_at(t + 3 * S16, 0.6)
	elif t >= T['pad_']:
		if beat in (0, 2):
			kick_at(t)
	elif t >= T['box']:
		if beat in (0, 2):
			kick_at(t, 0.9)
	else:
		if beat == 0:
			kick_at(t, 0.8)  # the code: a kick on the one, under the hats
	# claps and snares (a rim on 2 and 4 before the padding brings the claps)
	if t < T['pad_'] and beat in (1, 3) and not dk:
		put('perc', rim(0.9), t, 1.0, pan=0.1)
	if t >= T['pad_']:
		if dk:
			if beat == 2:
				put('snare', clap(1.1), t, 1.0)
				put('snare', snare(0.5), t, 1.0)
		elif beat in (1, 3):
			put('snare', clap(), t, 1.0)
			if full:
				put('snare', snare(0.45), t, 1.0)
	# the 808, from the shadow on
	if t >= T['shadow'] and beat == 0:
		if dk:
			put('bass', bass808(root - 12 if root > 36 else root, BAR * 0.95), t, 1.0)
		else:
			put('bass', bass808(root, BEAT * 1.6), t, 1.0)
			put('bass', bass808(root + 12 if bar % 2 else root + 7, BEAT * 0.8, glide_from=root), t + 2.5 * BEAT, 0.8)
	# percussion as the card fills in, more of it at the peaks
	if t >= T['rest'] and not dk:
		put('perc', perc(62 if beat % 2 else 67, 0.7), t + 3 * S16, 1.0, pan=0.35)
		if full:
			put('perc', perc(57, 0.6), t + S16, 1.0, pan=-0.35)
			put('perc', shaker(), t + 2 * S16, 1.0, pan=0.4)
		if beat == 3:
			put('perc', rim(0.7), t + BEAT / 2, 1.0, pan=0.2)

# the agent writing the pages: rim sixteenths on top
for a, b in ((at('three', 175), at('three', 360)), (at('three', 705), at('three', 870))):
	for k in range(beat_after(a), beat_after(b)):
		for s in (1, 3):
			put('perc', rim(0.45), beat_t(k) + s * S16, 1.0, pan=0.3)

# ---------- picture
# Mark: rim ticks on the construction, a tom as the logo fills, a hit on the lockup
put('fx', riser(at('mark', 266) - 0.3, 0.6), 0.3)
for f in (6, 48, 60):
	put('perc', rim(0.9), at('mark', f), 1.0)
put('toms', tom(45), at('mark', 122), 1.0)
put('toms', tom(50), at('mark', 194), 1.0)
put('kick', kick(1.2), at('mark', 266), 1.0)
put('snare', clap(1.1), at('mark', 266), 1.0)
put('fx', impact(0.7), at('mark', 266), 1.0)
put('hats', crash(0.7, 2.0), at('mark', 266), 1.0)
put('fx', sweep_down(0.4), at('one', 0), 1.0)
# into the code: a reversed cymbal swells up to the first kick
put('hats', crash(0.9, T['code'] - at('one', 10))[::-1], at('one', 10), 1.0)

# Stage One: a rim on each class that lands
for f in (116, 170, 250, 330, 356, 420, 440, 490, 580, 892, 950, 980, 1010, 1040, 1070, 1102, 1134,
		  1200, 1230, 1260, 1300, 1335, 1435, 1465, 1495, 1740, 1830, 1890, 1950):
	put('perc', rim(0.8), at('one', f), 1.0, pan=rng.uniform(-0.3, 0.3))
# the radius steps: up the toms
for i, f in enumerate((730, 754, 770, 786, 802, 818)):
	put('toms', tom(43 + i * 2, 0.8), at('one', f), 1.0, pan=(i - 2.5) * 0.15)
# dark, and back
put('fx', impact(0.9), T['dark'], 1.0)
put('hats', crash(0.7), T['dark'], 1.0)
for i in range(8):  # a snare roll back into the light
	put('snare', snare(0.3 + 0.08 * i), T['light'] - BEAT * 2 + i * BEAT / 4, 1.0)
put('hats', crash(0.8), T['light'], 1.0)

# Stage Two: the six elevations up the toms, a riser into the wall, the drop
for i in range(6):
	put('toms', tom(41 + i * 2, 0.7), at('two', 80 + i * 18), 1.0, pan=(i - 2.5) * 0.2)
put('fx', riser(T['bento'] - at('two', 200), 1.0), at('two', 200), 1.0)
put('fx', impact(1.0), T['bento'], 1.0)
put('hats', crash(1.0), T['bento'], 1.0)

# Stage Three: typing, sends, the dark slider
for a, b in ((64, 151), (609, 683)):
	f = a
	while f < b:
		put('ui', tap(rng.uniform(0.7, 1.0)), at('three', f), 1.0, pan=rng.uniform(-0.15, 0.15))
		f += rng.choice([2, 2, 3, 3, 4])
for f in (151, 683):
	put('snare', clap(0.9), at('three', f), 1.0)
	put('hats', crash(0.6), at('three', f), 1.0)
put('fx', sweep_down(0.6), T['slider_dark'] - 0.3, 1.0)
put('fx', impact(0.7), T['slider_dark'], 1.0)

# End: each recipe on a tom fill; the ring is a snare roll; a bar of air; the lockup
put('hats', crash(0.7), T['end_light'], 1.0)
for i, f in enumerate((123, 208, 293, 378)):
	for j, n in enumerate((50, 47, 45)):
		put('toms', tom(n - i, 0.7), at('end', f) - BEAT / 2 + j * S16, 1.0, pan=(j - 1) * 0.3)
	put('hats', crash(0.4, 1.5), at('end', f), 1.0)
roll0, roll1 = T['ring'], T['fold']
t = roll0
while t < roll1:
	p = (t - roll0) / (roll1 - roll0)
	put('snare', snare(0.3 + 0.7 * p), t, 1.0, pan=rng.uniform(-0.1, 0.1))
	if (t - roll0) % BEAT < 0.01:
		kick_at(t, 0.8)
	t += BEAT / (2 if p < 0.3 else 4 if p < 0.7 else 8)
put('fx', riser(T['lock'] - roll0, 1.2), roll0, 1.0)
# the fold: only the riser (the air before the hit)
put('kick', kick(1.3), T['lock'], 1.0)
put('snare', clap(1.3), T['lock'], 1.0)
put('snare', snare(0.8), T['lock'], 1.0)
put('hats', crash(1.3, 4.0), T['lock'], 1.0)
put('bass', bass808(26, 3.5), T['lock'], 1.2)
put('fx', impact(1.2), T['lock'], 1.0)

# ---------- mix
buses['bass'] *= sidechain[:, None] ** 0.8
MIX = dict(kick=0.62, bass=0.45, snare=1.2, hats=1.0, perc=1.2, toms=1.1, ui=1.0, fx=0.7)
mix = sum(buses[k] * MIX[k] for k in BUSES)

ir_t = t_(1.4)
ir = noise(len(ir_t) * 2).reshape(-1, 2) * np.exp(-ir_t * 4)[:, None]
ir = lp(ir, 6000)
ir[: int(0.01 * SR)] = 0
send = buses['snare'] + buses['perc'] * 0.7 + buses['toms'] * 0.6 + buses['hats'] * 0.3
wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
mix = mix + hp(wet, 300) * 0.025

# glue: a gentle bus compressor (an RMS follower, 3:1 above the threshold)
env = np.sqrt(np.maximum(lp((mix**2).mean(1), 8), 0))
thr = np.percentile(env, 70)
gain = np.where(env > thr, (thr / np.maximum(env, 1e-9)) ** (1 - 1 / 3), 1)
mix *= gain[:, None]

fade = np.ones(N)
tail = int(2.5 * SR)
fade[-tail:] = np.linspace(1, 0, tail) ** 1.5
mix *= fade[:, None]
mix = hp(mix, 28)
mix *= 10 ** (-15 / 20) / np.sqrt((mix**2).mean())
a = np.abs(mix)
mix = np.where(a > 0.8, np.sign(mix) * (0.8 + 0.15 * np.tanh((a - 0.8) / 0.15)), mix)
mix *= 0.82  # true peak under -1 dB

out = (mix * 32767).astype(np.int16)
with wave.open('public/audio/score_drums2.wav', 'wb') as w:
	w.setnchannels(2)
	w.setsampwidth(2)
	w.setframerate(SR)
	w.writeframes(out.tobytes())
print('wrote public/audio/score_drums2.wav', round(DUR, 2), 's; grid at frame', GRID)

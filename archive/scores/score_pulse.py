"""Synthesised score for the v2 film: a pulse that opens up.

112.5 bpm (one beat = 32 frames, one bar = 128 at 60 fps), A minor:
Am9, Fmaj9, Cadd9, G6. The spine is a sixteenth-note pluck arpeggio whose
filter opens as the film builds, over warm pads and a sub. A clean kick only
where the film peaks, a muffled filter for the dark section, quiet for the
prompts, and one stop of silence before the lockup so the last hit lands.
UI sounds are soft and physical (a tick, a tap), never bleeps.

The bar grid starts at GRID so the lockup lands on a downbeat; picture cues
are scene starts plus the scene-local frames the React scenes use (copied
from each scene's constants: keep them in sync with src/v2).

Run with numpy + scipy: ../fc-launch-video/.venv/bin/python scripts/score.py
"""

import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
FPS = 60
BEATF = 32
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
LOCKUP = START['end'] + 659
GRID = LOCKUP % BARF
DUR = TOTAL / FPS + 0.3
N = int(DUR * SR)
TT = np.arange(N) / SR
rng = np.random.default_rng(3)


def at(scene, frame=0):
	return (START[scene] + frame) / FPS


def bar_t(b):
	return (GRID + b * BARF) / FPS


def bar_of(scene, frame=0):
	return (START[scene] + frame - GRID) / BARF


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


def curve(keys):
	"""Piecewise-linear automation over the whole film: [(seconds, value), ...]."""
	ks = sorted(keys)
	return np.interp(TT, [k[0] for k in ks], [k[1] for k in ks])


BUSES = ('arp', 'pad', 'chords', 'bass', 'kick', 'drums', 'lead', 'ui', 'fx')
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
def pluck(note, cutoff, dur=0.32, vel=1.0):
	"""A band-limited saw through a lowpass whose cutoff falls with the note:
	harmonic by harmonic, so it stays clean however bright it gets."""
	t = t_(dur)
	f = midi(note)
	K = max(1, min(28, int(15000 / f)))
	fc = cutoff * (0.35 + 2.2 * np.exp(-t * 22))
	out = np.zeros_like(t)
	for k in range(1, K + 1):
		gain = 1 / np.sqrt(1 + ((k * f) / fc) ** 4)
		out += np.sin(2 * np.pi * k * f * t) * gain / k
	env = np.minimum(1, t * 900) * np.exp(-t * 9) * np.clip((dur - t) / 0.03, 0, 1)
	return out * env * 0.12 * vel


def pad(notes, dur, cutoff=1600, vel=1.0):
	"""Detuned saws, wide, slow in and out."""
	t = t_(dur + 1.2)
	L = np.zeros_like(t)
	R = np.zeros_like(t)
	for n in notes:
		for v, det in enumerate((-0.011, -0.006, -0.002, 0.002, 0.006, 0.011)):
			ph = (midi(n) * (1 + det) * t + rng.uniform()) % 1
			s = 2 * ph - 1
			if v % 2:
				L += s
			else:
				R += s
	x = np.stack([L, R], axis=1)
	x = hp(lp(lp(x, cutoff), cutoff * 1.4), 220)
	env = np.minimum(1, t / 0.6) ** 2 * np.clip((dur + 1.2 - t) / 1.2, 0, 1)
	return x * env[:, None] * 0.012 * vel


def chord(notes, cutoff=2600, dur=0.28, vel=1.0):
	"""A short, bright chord in the middle of the range."""
	x = sum(pluck(n, cutoff, dur, 1.0) for n in notes)
	return hp(x, 250) * 0.6 * vel


def sub(note, dur, vel=1.0):
	t = t_(dur)
	f = midi(note)
	x = np.sin(2 * np.pi * f * t) + 0.12 * np.sin(4 * np.pi * f * t)
	env = np.minimum(1, t * 200) * np.clip((dur - t) / 0.05, 0, 1)
	return x * env * 0.32 * vel


def bass(note, dur=0.2, vel=1.0):
	"""The off-beat bass: a short, round saw."""
	t = t_(dur)
	f = midi(note)
	x = sum(np.sin(2 * np.pi * k * f * t) / k for k in range(1, 9))
	x = lp(x, 500)
	env = np.minimum(1, t * 600) * np.exp(-t * 6) * np.clip((dur - t) / 0.02, 0, 1)
	return np.tanh(x * 1.5) * env * 0.3 * vel


def bell(note, dur=1.2, vel=1.0):
	"""The lead: a soft FM bell."""
	t = t_(dur)
	f = midi(note)
	mod = np.sin(2 * np.pi * f * 2 * t) * (1.2 * np.exp(-t * 4) + 0.2)
	x = np.sin(2 * np.pi * f * t + mod) + 0.3 * np.sin(2 * np.pi * f * 4.01 * t) * np.exp(-t * 12)
	env = np.minimum(1, t * 500) * np.exp(-t * 2.4)
	return x * env * 0.1 * vel


def kick(v=1.0):
	t = t_(0.38)
	f = 56 + 120 * np.exp(-t * 50)
	body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
	click = bp(noise(len(t)), 1500, 6000) * np.exp(-t * 500) * 0.25
	return np.tanh((body + click) * 1.6) * 0.75 * v


def clap(v=1.0):
	t = t_(0.3)
	n = bp(noise(len(t)), 1000, 6000)
	e = np.zeros_like(t)
	for d in (0, 0.009, 0.019):
		e += (t >= d) * np.exp(-np.clip(t - d, 0, None) * 180)
	e += (t >= 0.025) * np.exp(-np.clip(t - 0.025, 0, None) * 22) * 0.5
	return n * e * 0.22 * v


def hat(open_=False, v=1.0):
	dur = 0.25 if open_ else 0.045
	t = t_(dur)
	x = hp(noise(len(t)), 8000)
	return x * np.exp(-t * (12 if open_ else 110)) * 0.06 * v


def tick(v=1.0):
	"""A UI tick: a small, physical click with a little body."""
	t = t_(0.05)
	snap_ = bp(noise(len(t)), 2500, 7000) * np.exp(-t * 350)
	body = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 90) * 0.6
	return (snap_ + body) * 0.12 * v


def tap(v=1.0):
	"""A key, typed."""
	t = t_(0.04)
	return (bp(noise(len(t)), 1200, 4500) * np.exp(-t * 260) + np.sin(2 * np.pi * 320 * t) * np.exp(-t * 150) * 0.4) * 0.06 * v


def swish(dur=0.5, up=True, v=1.0):
	t = t_(dur)
	n = noise(len(t))
	out = np.zeros(len(t))
	seg = int(0.015 * SR)
	for i in range(0, len(t), seg):
		p = i / len(t)
		fc = 600 + 5000 * (p if up else 1 - p)
		out[i : i + seg] = bp(n[i : i + seg], fc * 0.7, fc * 1.4)
	return out * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2 * 0.18 * v


def riser(dur, v=1.0):
	t = t_(dur)
	n = noise(len(t))
	out = np.zeros(len(t))
	seg = int(0.02 * SR)
	for i in range(0, len(t), seg):
		p = i / len(t)
		fc = 400 + 9000 * p**2.2
		out[i : i + seg] = bp(n[i : i + seg], fc * 0.75, min(fc * 1.35, 21000))
	return out * (np.linspace(0, 1, len(t)) ** 2.4) * 0.2 * v


def thump(v=1.0):
	"""A soft low hit for a reveal."""
	t = t_(1.6)
	f = 55 * np.exp(-t * 2) + 38
	x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.5)
	air = hp(noise(len(t)), 4000) * np.exp(-t * 6) * 0.05
	return (np.tanh(x * 1.4) + air) * 0.6 * v


# ---------- harmony
# Am9, Fmaj9, Cadd9, G6: (sub root, pad voicing, arp tones)
CHORDS = [
	(33, [57, 60, 64, 67, 71], [57, 60, 64, 67, 71, 72]),
	(29, [57, 60, 64, 65, 67], [53, 57, 60, 64, 67, 69]),
	(36, [55, 60, 62, 64, 67], [55, 60, 62, 64, 67, 72]),
	(31, [55, 59, 62, 64, 67], [55, 59, 62, 64, 67, 71]),
]
ARP = [0, 2, 4, 2, 1, 3, 5, 3, 0, 2, 4, 2, 1, 4, 5, 4]
LEAD = [[(0, 76), (1.5, 74), (3, 72)], [(0, 72), (1.5, 69), (3, 67)], [(0, 72), (1.5, 74), (3, 76)], [(0, 74), (2, 71)]]

# sections, in bars of the grid
B_ONE = round(bar_of('one'))
B_PULSE = round(bar_of('one', 250))  # the arp goes to sixteenths
B_GROOVE = round(bar_of('one', 580))  # w-[440px] p-4: the kick comes in
B_DARK = int(np.ceil(bar_of('one', 1560)))
B_LIGHT = int(np.ceil(bar_of('one', 2125)))
B_TWO = round(bar_of('two'))
B_THREE = round(bar_of('three'))
B_END = round(bar_of('end'))
B_RING = int(np.floor(bar_of('end', 463)))
B_LOCK = round(bar_of('end', 659))
BARS = int(np.ceil((TOTAL - GRID) / BARF)) + 1


def section(b):
	for name, until in (('intro', B_ONE), ('soft', B_PULSE), ('pulse', B_GROOVE), ('groove', B_DARK), ('dark', B_LIGHT), ('lift', B_TWO), ('peak', B_THREE), ('drive', B_END), ('end', B_RING), ('build', B_LOCK)):
		if b < until:
			return name
	return 'out'


# the arp's filter over the film: closed under the mark, opening through
# stage one, shut in the dark, wide open at the peaks
CUT = curve([
	(0, 350), (at('one'), 500), (bar_t(B_PULSE), 800), (bar_t(B_GROOVE), 1800), (bar_t(B_DARK) - 0.01, 2600),
	(bar_t(B_DARK), 650), (bar_t(B_LIGHT) - BAR, 700), (bar_t(B_LIGHT), 2600), (bar_t(B_TWO), 4200),
	(bar_t(B_THREE), 4200), (bar_t(B_THREE) + 0.01, 3000), (bar_t(B_END), 3200), (bar_t(B_RING), 3000), (bar_t(B_LOCK), 7000), (DUR, 7000),
])
# quiet for the two prompts: the drums step back while the words are typed
FOCUS = curve([
	(0, 1), (at('three', 30), 1), (at('three', 50), 0.15), (at('three', 150), 0.15), (at('three', 175), 1),
	(at('three', 560), 1), (at('three', 580), 0.15), (at('three', 683), 0.15), (at('three', 705), 1), (DUR, 1),
])

sidechain = np.ones(N)


def duck(t0, depth=0.35, length=0.3):
	i = int(t0 * SR)
	dk = np.linspace(depth, 1, int(length * SR)) ** 2
	j = min(N, i + len(dk))
	sidechain[i:j] = np.minimum(sidechain[i:j], dk[: j - i])


# the pickup before bar 0: the first chord, already sounding
put('pad', pad(CHORDS[-1][1], bar_t(0), 1500, 0.8), 0)
for b in range(-1, BARS):
	t0 = bar_t(b)
	if t0 < 0:
		continue
	sec = section(b)
	root, voicing, tones = CHORDS[b % 4]
	dark = sec == 'dark'
	if sec == 'out':
		if b == B_LOCK:
			put('pad', pad([45, 52, 57, 60, 64, 67, 71], BAR * 1.6, 2400, 1.6), t0)
			put('bass', sub(33, BAR * 1.7, 1.2), t0)
			for k, n in enumerate([57, 64, 67, 71, 72, 76, 79, 83]):
				put('arp', pluck(n, 5000, 0.9, 0.8), t0 + k * S16, pan=(k - 3.5) * 0.15)
		continue
	# pads: always, darker in the dark
	put('pad', pad([n - (12 if dark else 0) for n in voicing], BAR, 900 if dark else 1500 if sec in ('intro', 'soft') else 2200, 1.0), t0)
	if sec in ('intro', 'soft', 'dark'):
		put('bass', sub(root, BAR * 0.98, 0.5 if sec == 'intro' else 0.6), t0)
	# the arp
	step = 2 if sec in ('intro', 'soft') else 1
	for s in range(0, 16, step):
		if sec == 'build' and b == B_LOCK - 1 and s >= 12:
			continue  # the stop: the last beat before the lockup is silent
		ts = t0 + s * S16
		n = tones[ARP[s]] + (12 if (s in (6, 14) and sec in ('peak', 'build')) else 0)
		vel = (1.0 if s % 4 == 0 else 0.75 if s % 2 == 0 else 0.6) * (0.7 if sec == 'intro' else 1.0)
		put('arp', pluck(n, float(CUT[min(N - 1, int(ts * SR))])), ts, vel, pan=0.35 * np.sin(s * 0.9))
	# the mid-range chords, on the off-beats, from stage one on
	if sec not in ('intro', 'dark'):
		for off in (1.5, 3.5) if sec in ('soft', 'pulse') else (0.5, 1.5, 2.5, 3.5):
			if sec == 'build' and b == B_LOCK - 1 and off > 3:
				continue
			put('chords', chord(voicing[1:], 1800 if sec in ('soft', 'pulse') else 3000), t0 + off * BEAT, 1.0, pan=0.12)
	if sec in ('soft', 'pulse'):
		for beat in range(4):
			put('kick', kick(0.8), t0 + beat * BEAT, 0.7)
			duck(t0 + beat * BEAT, 0.6)
	if sec == 'dark':
		for beat in (0, 2):
			put('kick', kick(0.9), t0 + beat * BEAT, 0.8)
			duck(t0 + beat * BEAT, 0.5)
		put('drums', clap(0.6), t0 + 2 * BEAT, 1.0)
	# the groove
	if sec in ('groove', 'lift', 'peak', 'drive', 'end', 'build'):
		last_beat = 3 if (sec == 'build' and b == B_LOCK - 1) else 4
		for beat in range(last_beat):
			put('kick', kick(), t0 + beat * BEAT, 1.0)
			duck(t0 + beat * BEAT)
			put('bass', bass(root + 12, 0.2), t0 + beat * BEAT + BEAT / 2, 1.0)
			if beat in (1, 3):
				put('drums', clap(0.9 if sec in ('peak', 'drive', 'end') else 0.6), t0 + beat * BEAT, 1.0)
			for s in range(4):
				put('drums', hat(v=1.0 if s == 2 else 0.5), t0 + beat * BEAT + s * S16, 1.0, pan=-0.3)
			if sec in ('peak', 'build'):
				put('drums', hat(True, 0.7), t0 + beat * BEAT + BEAT / 2, 1.0, pan=0.3)
	if sec in ('soft', 'pulse'):
		for beat in range(4):
			put('drums', hat(v=0.6), t0 + beat * BEAT + BEAT / 2, 1.0, pan=-0.3)
	# the lead, where the film opens out
	if sec in ('groove', 'peak', 'drive', 'end', 'build') and (sec != 'groove' or b % 2):
		for off, n in LEAD[b % 4]:
			put('lead', bell(n, 1.4, 1.0 if sec in ('peak', 'end') else 0.7), t0 + off * BEAT, 1.0, pan=0.1)

# ---------- picture
# Mark: the stroke draws over a swell; ticks on the two labels; a low hit on the lockup
put('fx', riser(at('mark', 266) - 0.5, 0.6), 0.5)
for f in (48, 60):
	put('ui', tick(), at('mark', f), 1.0)
put('fx', thump(0.8), at('mark', 266), 1.0)
put('lead', bell(76, 2.0, 0.9), at('mark', 266), 1.0)
put('lead', bell(83, 2.0, 0.5), at('mark', 266) + 0.03, 1.0, pan=0.3)
put('fx', swish(0.4, False, 0.8), at('one', 0), 1.0)

# Stage One: a tick on every class that lands
for f in (116, 170, 250, 330, 356, 420, 440, 490, 580, 730, 754, 770, 786, 802, 818, 892,
		  950, 980, 1010, 1040, 1070, 1102, 1134, 1200, 1230, 1260, 1300, 1335, 1435, 1465, 1495, 1740, 1830, 1890, 1950):
	put('ui', tick(0.9), at('one', f), 1.0, pan=rng.uniform(-0.2, 0.2))
put('fx', thump(0.7), at('one', 1560), 1.0)
put('fx', swish(0.5, True, 0.7), at('one', 2125), 1.0)
put('fx', riser(bar_t(B_TWO) - at('one', 2125), 0.8), at('one', 2125), 1.0)

# Stage Two: the six elevations, the bento levels
for k in range(6):
	put('ui', tick(0.8), at('two', 80 + k * 18), 1.0, pan=(k - 2.5) * 0.1)
for f in (262, 298, 334, 370, 406, 442):
	put('fx', swish(0.3, True, 0.4), at('two', f) - 0.1, 1.0)

# Stage Three: typing, sends, the build, the dark slider
for start, end in ((64, 151), (609, 683)):
	f = start
	while f < end:
		put('ui', tap(rng.uniform(0.7, 1.0)), at('three', f), 1.0, pan=rng.uniform(-0.15, 0.15))
		f += rng.choice([2, 2, 3, 3, 4])
for f in (151, 559, 683, 995):
	put('ui', tick(1.1), at('three', f), 1.0)
put('fx', swish(0.6, True, 0.6), at('three', 1059), 1.0)

# End: a swish per recipe; the ring rises; the stop; the lockup
put('fx', swish(0.4, True, 0.6), at('end', 14), 1.0)
for f in (123, 208, 293, 378):
	put('fx', swish(0.45, True, 0.6), at('end', f) - 0.15, 1.0)
put('fx', riser(bar_t(B_LOCK) - BEAT - at('end', 463), 1.0), at('end', 463), 1.0)
put('fx', thump(1.0), at('end', 659), 1.0)
put('lead', bell(76, 3.0, 0.9), at('end', 659), 1.0)
put('lead', bell(88, 3.0, 0.4), at('end', 659) + 0.02, 1.0, pan=0.3)

# ---------- mix
for k in ('pad', 'chords', 'bass', 'arp', 'lead'):
	buses[k] *= (sidechain ** (0.5 if k == 'arp' else 1.0))[:, None]
for k in ('kick', 'drums', 'bass'):
	buses[k] *= FOCUS[:, None]


# the balance, set against the reference films: less low end, more middle
MIX = dict(arp=1.25, pad=1.0, chords=1.25, bass=0.5, kick=0.55, drums=0.9, lead=1.1)


def delay(x, time, fb=0.35, taps=6):
	"""Ping-pong delay: taps alternate left and right."""
	d = int(time * SR)
	out = np.zeros_like(x)
	for k in range(1, taps + 1):
		g = fb**k
		src = x[:, 0] + x[:, 1]
		ch = k % 2
		out[d * k :, ch] += src[: N - d * k] * g * 0.5
	return lp(out, 5000)


buses['arp'] += delay(buses['arp'], BEAT * 0.75, 0.3) * 0.6
buses['lead'] += delay(buses['lead'], BEAT * 0.75, 0.4) * 0.8
buses['chords'] += delay(buses['chords'], BEAT * 0.75, 0.25) * 0.35

# a drop at each scene change: the beat before it falls away, so the cut lands
DROP = np.ones(N)
for b in (B_TWO, B_THREE, B_END):
	i0, i1 = int((bar_t(b) - BEAT) * SR), int(bar_t(b) * SR)
	DROP[i0:i1] = np.minimum(DROP[i0:i1], np.linspace(1, 0.08, i1 - i0) ** 0.3)
for k in ('arp', 'pad', 'chords', 'bass', 'kick', 'drums', 'lead'):
	buses[k] *= DROP[:, None]

mix = (buses['arp'] * MIX['arp'] + buses['pad'] * MIX['pad'] + buses['chords'] * MIX['chords'] + buses['bass'] * MIX['bass'] + buses['kick'] * MIX['kick'] + buses['drums'] * MIX['drums']
	   + buses['lead'] * MIX['lead'] + buses['ui'] * 0.9 + buses['fx'] * 0.8)

# a room: decorrelated tails, darkened, with a short pre-delay
ir_t = t_(2.8)
ir = noise(len(ir_t) * 2).reshape(-1, 2) * np.exp(-ir_t * 2.2)[:, None]
ir = lp(ir, 6000)
ir[: int(0.02 * SR)] = 0
send = buses['arp'] * 0.8 + buses['chords'] * 0.5 + buses['pad'] * 0.6 + buses['lead'] + buses['drums'] * 0.3 + buses['ui'] * 0.4 + buses['fx'] * 0.5
wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
mix = mix + hp(wet, 200) * 0.018

# the dark section sits lower: the page goes quiet with it
mix *= curve([(0, 1), (at('one', 1560), 1), (at('one', 1600), 0.8), (bar_t(B_LIGHT) - BAR, 0.8), (bar_t(B_LIGHT), 1), (DUR, 1)])[:, None]

fade = np.ones(N)
tail = int(2.5 * SR)
fade[-tail:] = np.linspace(1, 0, tail) ** 1.5
mix *= fade[:, None]
mix = hp(mix, 25)
mix *= 10 ** (-15 / 20) / np.sqrt((mix**2).mean())
a = np.abs(mix)
mix = np.where(a > 0.8, np.sign(mix) * (0.8 + 0.15 * np.tanh((a - 0.8) / 0.15)), mix)
mix *= 0.9  # headroom

out = (mix * 32767).astype(np.int16)
with wave.open('public/audio/score_pulse.wav', 'wb') as w:
	w.setnchannels(2)
	w.setsampwidth(2)
	w.setframerate(SR)
	w.writeframes(out.tobytes())
print('wrote public/audio/score_pulse.wav', round(DUR, 2), 's; grid at frame', GRID, '; bars',
	  dict(one=B_ONE, pulse=B_PULSE, groove=B_GROOVE, dark=B_DARK, light=B_LIGHT, two=B_TWO, three=B_THREE, end=B_END, ring=B_RING, lock=B_LOCK))

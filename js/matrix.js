const MATRIX = {
	enabled: true,
	fontSize: 16,
	minSpeed: 1.2,
	maxSpeed: 14,
	fadeAlpha: 0.08,
	intervalMs: 50,
};

const STORM = {
	minDelayMs: 7000,
	maxDelayMs: 16000,
	sparkChance: 0.0004,
	chargeDecay: 0.05,
	boltAlpha: 1,
	flashAlpha: 0.045,
};

const matrixCtl = {
	stop: null,
	start: null,
	pause: null,
	resume: null,
};

function initMatrix() {
	const canvas = document.getElementById("matrix");
	const btn = document.getElementById("matrix-toggle");
	if (!canvas) {
		return;
	}

	const ctx = canvas.getContext("2d");
	const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	let width = 0;
	let height = 0;
	let drops = [];
	let charge = [];
	let timer = null;
	let stormTimer = null;
	let bolt = null;
	let userEnabled = MATRIX.enabled;

	function resize() {
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = width;
		canvas.height = height;
		const columns = Math.floor(width / MATRIX.fontSize);
		drops = Array.from({ length: columns }, function () {
			return Math.random() * (height / MATRIX.fontSize);
		});
		charge = new Array(columns).fill(0);
	}

	function glyphColor(c) {
		if (c <= 0) {
			return "#0f0";
		}
		const r = Math.round(150 * c);
		const g = Math.round(255 - 25 * c);
		const b = Math.round(255 * c);
		return "rgb(" + r + "," + g + "," + b + ")";
	}

	function buildPath(x, y, maxY, step, spread, drift) {
		const pts = [[x, y]];
		while (y < maxY) {
			x += drift * step + (Math.random() - 0.5) * spread;
			y += step * (0.6 + Math.random() * 0.8);
			pts.push([x, y]);
		}
		return pts;
	}

	function makeBolt() {
		const dir = Math.random() < 0.5 ? -1 : 1;
		const drift = dir * (0.6 + Math.random() * 0.5);
		const end = height * (0.5 + Math.random() * 0.4);
		// Start on the side the bolt leans away from so the diagonal stays on screen.
		const x = dir > 0 ? width * (0.05 + Math.random() * 0.45) : width * (0.5 + Math.random() * 0.45);
		const trunk = buildPath(x, 0, end, 22, 40, drift);
		const paths = [trunk];
		for (let i = 2; i < trunk.length - 2; i++) {
			if (Math.random() < 0.14) {
				const p = trunk[i];
				const fork = drift + (Math.random() < 0.5 ? -0.7 : 0.7);
				paths.push(buildPath(p[0], p[1], p[1] + end * (0.12 + Math.random() * 0.25), 16, 34, fork));
			}
		}
		return { paths: paths, frame: 0 };
	}

	function strokeBolt(alpha) {
		ctx.save();
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.shadowColor = "rgba(90, 208, 255, " + alpha + ")";
		ctx.shadowBlur = 20;
		bolt.paths.forEach(function (pts, idx) {
			const main = idx === 0;
			ctx.beginPath();
			ctx.moveTo(pts[0][0], pts[0][1]);
			for (let i = 1; i < pts.length; i++) {
				ctx.lineTo(pts[i][0], pts[i][1]);
			}
			ctx.strokeStyle = "rgba(120, 230, 255, " + alpha * (main ? 0.95 : 0.6) + ")";
			ctx.lineWidth = main ? 3.2 : 1.6;
			ctx.stroke();
			if (main) {
				ctx.strokeStyle = "rgba(240, 255, 255, " + alpha + ")";
				ctx.lineWidth = 1.3;
				ctx.stroke();
			}
		});
		ctx.restore();
	}

	function chargeColumns() {
		bolt.paths.forEach(function (pts) {
			pts.forEach(function (p) {
				const col = Math.floor(p[0] / MATRIX.fontSize);
				for (let k = col - 1; k <= col + 1; k++) {
					if (k >= 0 && k < charge.length) {
						charge[k] = 1;
					}
				}
			});
		});
	}

	function drawBolt() {
		if (!bolt) {
			return;
		}
		if (bolt.frame === 0) {
			ctx.fillStyle = "rgba(90, 208, 255, " + STORM.flashAlpha + ")";
			ctx.fillRect(0, 0, width, height);
			strokeBolt(STORM.boltAlpha);
			chargeColumns();
		} else if (bolt.frame === 2) {
			strokeBolt(STORM.boltAlpha * 0.55);
		} else if (bolt.frame > 3) {
			bolt = null;
			return;
		}
		bolt.frame++;
	}

	function draw() {
		ctx.fillStyle = "rgba(0, 0, 0, " + MATRIX.fadeAlpha + ")";
		ctx.fillRect(0, 0, width, height);
		ctx.font = MATRIX.fontSize + "px monospace";

		const minS = MATRIX.minSpeed;
		const maxS = MATRIX.maxSpeed;

		for (let i = 0; i < drops.length; i++) {
			if (!calm && Math.random() < STORM.sparkChance) {
				charge[i] = 0.8;
			}
			ctx.fillStyle = glyphColor(charge[i]);
			if (charge[i] > 0) {
				charge[i] = Math.max(0, charge[i] - STORM.chargeDecay);
			}
			const text = String.fromCharCode(0x30a0 + Math.random() * 96);
			ctx.fillText(text, i * MATRIX.fontSize, drops[i] * MATRIX.fontSize);
			if (drops[i] * MATRIX.fontSize > height && Math.random() > 0.975) {
				drops[i] = 0;
			}
			drops[i] += minS + Math.random() * (maxS - minS) * 0.15;
		}

		drawBolt();
	}

	function scheduleStrike() {
		if (stormTimer) {
			clearTimeout(stormTimer);
			stormTimer = null;
		}
		if (calm || !userEnabled || document.hidden) {
			return;
		}
		const delay = STORM.minDelayMs + Math.random() * (STORM.maxDelayMs - STORM.minDelayMs);
		stormTimer = setTimeout(function () {
			bolt = makeBolt();
			document.dispatchEvent(new CustomEvent("storm:strike"));
			scheduleStrike();
		}, delay);
	}

	function halt() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
		if (stormTimer) {
			clearTimeout(stormTimer);
			stormTimer = null;
		}
	}

	function restartTimer() {
		halt();
		if (!userEnabled || document.hidden) {
			return;
		}
		draw();
		timer = setInterval(draw, MATRIX.intervalMs);
		scheduleStrike();
	}

	function setButton(on) {
		if (btn) {
			btn.textContent = on ? "Storm: on" : "Storm: off";
			btn.setAttribute("aria-pressed", on ? "true" : "false");
		}
	}

	function stop() {
		userEnabled = false;
		halt();
		bolt = null;
		ctx.clearRect(0, 0, width, height);
		canvas.classList.add("matrix-off");
		setButton(false);
	}

	function start() {
		userEnabled = true;
		canvas.classList.remove("matrix-off");
		setButton(true);
		restartTimer();
	}

	matrixCtl.stop = stop;
	matrixCtl.start = start;
	matrixCtl.pause = halt;
	matrixCtl.resume = function () {
		if (userEnabled && !timer) {
			restartTimer();
		}
	};

	resize();
	window.addEventListener("resize", resize);
	if (userEnabled) {
		restartTimer();
	} else {
		canvas.classList.add("matrix-off");
		setButton(false);
	}

	if (btn) {
		btn.addEventListener("click", function () {
			if (userEnabled) {
				stop();
			} else {
				start();
			}
		});
	}
}

initMatrix();

function initYear() {
	const el = document.getElementById("year");
	if (el) {
		el.textContent = String(new Date().getFullYear());
	}
}

function initTypewriter() {
	const el = document.querySelector(".typewriter");
	if (!el) {
		return;
	}
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		el.style.borderRight = "none";
		return;
	}
	const text = el.textContent;
	el.textContent = "";
	let i = 0;
	function tick() {
		if (i < text.length) {
			el.textContent += text.charAt(i);
			i++;
			setTimeout(tick, 55 + Math.random() * 45);
		} else {
			el.style.borderRight = "none";
		}
	}
	tick();
}

function initNav() {
	const toggle = document.querySelector(".toggle-button");
	const links = document.querySelector(".nav-links");
	if (toggle && links) {
		toggle.addEventListener("click", function () {
			const open = links.classList.toggle("active");
			toggle.setAttribute("aria-expanded", open ? "true" : "false");
		});
		links.querySelectorAll("a:not(.dropbtn)").forEach(function (a) {
			a.addEventListener("click", function () {
				links.classList.remove("active");
				toggle.setAttribute("aria-expanded", "false");
			});
		});
	}
	document.querySelectorAll(".dropdown").forEach(function (dd) {
		const btn = dd.querySelector(".dropbtn");
		if (!btn) {
			return;
		}
		btn.addEventListener("click", function (e) {
			if (window.matchMedia("(max-width: 768px)").matches) {
				e.preventDefault();
				dd.classList.toggle("open");
			}
		});
	});
}

function initStormStatus() {
	const status = document.getElementById("sys-status");
	const container = document.querySelector(".container");
	let strikes = 0;
	document.addEventListener("storm:strike", function () {
		strikes++;
		if (status) {
			status.textContent = "storm active · " + strikes + (strikes === 1 ? " strike" : " strikes");
		}
		if (container) {
			container.classList.add("strike");
			setTimeout(function () {
				container.classList.remove("strike");
			}, 160);
		}
	});
}

function initVisibilityPause() {
	document.addEventListener("visibilitychange", function () {
		if (document.hidden) {
			matrixCtl.pause();
		} else {
			matrixCtl.resume();
		}
	});
}

initYear();
initTypewriter();
initNav();
initStormStatus();
initVisibilityPause();

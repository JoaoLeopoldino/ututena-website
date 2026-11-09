'use strict'

function initNavigation() {
	const menuToggle = document.getElementById('menuToggle')
	const navLinks = document.getElementById('navLinks')

	menuToggle?.addEventListener('click', function () {
		const open = !document.body.classList.contains('menu-open')
		document.body.classList.toggle('menu-open', open)
		menuToggle.setAttribute('aria-expanded', String(open))
		menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu')
	})

	navLinks?.querySelectorAll('a').forEach(function (link) {
		link.addEventListener('click', function () {
			document.body.classList.remove('menu-open')
			menuToggle?.setAttribute('aria-expanded', 'false')
		})
	})

	const mobileCTA = document.querySelector('.mobile-cta')
	const leadSection = document.getElementById('diagnostico')
	const heroSection = document.querySelector('.hero')
	if (mobileCTA && leadSection && heroSection && 'IntersectionObserver' in window) {
		let heroVisible = true
		let formVisible = false
		function updateMobileCTA() {
			mobileCTA.classList.toggle('is-hidden', heroVisible || formVisible)
		}
		updateMobileCTA()
		const heroObserver = new IntersectionObserver(function (entries) {
			heroVisible = entries[0].isIntersecting
			updateMobileCTA()
		}, { threshold: 0 })
		const formObserver = new IntersectionObserver(function (entries) {
			formVisible = entries[0].isIntersecting
			updateMobileCTA()
		}, { threshold: 0.15 })
		heroObserver.observe(heroSection)
		formObserver.observe(leadSection)
	}
}

function initTabs() {
	const tabs = Array.from(document.querySelectorAll('[data-demo]'))
	const panels = Array.from(document.querySelectorAll('[data-panel]'))
	function activateTab(tab) {
		const id = tab.dataset.demo
		tabs.forEach(function (item) {
			const active = item === tab
			item.classList.toggle('is-active', active)
			item.setAttribute('aria-selected', String(active))
			item.tabIndex = active ? 0 : -1
		})
		panels.forEach(function (panel) {
			const active = panel.dataset.panel === id
			panel.classList.toggle('is-visible', active)
			panel.hidden = !active
		})
	}
	tabs.forEach(function (tab, index) {
		tab.addEventListener('click', function () { activateTab(tab) })
		tab.addEventListener('keydown', function (event) {
			if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
			event.preventDefault()
			let next = index
			if (event.key === 'Home') next = 0
			else if (event.key === 'End') next = tabs.length - 1
			else next = (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + tabs.length) % tabs.length
			activateTab(tabs[next])
			tabs[next].focus()
		})
	})
}

function trackLeadSource() {
	const params = new URLSearchParams(window.location.search)
	;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (key) {
		const field = document.querySelector('[name="' + key + '"]')
		if (field) field.value = (params.get(key) || '').slice(0, 120)
	})
	const source = document.querySelector('[name="source_path"]')
	if (source) source.value = (window.location.pathname || '/').slice(0, 120)
}

function initChallengeShortcuts() {
	const selection = document.getElementById('challengeSelect')
	document.querySelectorAll('[data-challenge]').forEach(function (link) {
		link.addEventListener('click', function () {
			if (selection) selection.value = link.dataset.challenge
		})
	})
}

function initTurnstile() {
	const key = window.UTUTENA_CONFIG?.turnstileSiteKey
	if (!key) return
	const slot = document.getElementById('turnstileSlot')
	if (!slot) return
	window.onUtutenaTurnstileLoaded = function () {
		if (window.turnstile) {
			window.ututenaTurnstileWidget = window.turnstile.render(slot, {
				sitekey: key,
				action: 'lead_form',
				theme: 'light'
			})
		}
	}
	const script = document.createElement('script')
	script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onUtutenaTurnstileLoaded&render=explicit'
	script.async = true
	script.defer = true
	document.head.appendChild(script)
}

function showFormMessage(text, type) {
	const message = document.getElementById('formMessage')
	if (!message) return
	message.textContent = text
	message.className = 'form-message ' + (type === 'success' ? 'is-success' : 'is-error')
	message.tabIndex = -1
	message.focus({ preventScroll: true })
}

function resetTurnstile() {
	if (window.turnstile && window.ututenaTurnstileWidget !== undefined) {
		window.turnstile.reset(window.ututenaTurnstileWidget)
	}
}

function initLeadForm() {
	const form = document.getElementById('leadForm')
	const button = document.getElementById('submitBtn')
	if (!form || !button) return

	form.addEventListener('submit', async function (event) {
		event.preventDefault()
		if (!form.reportValidity()) return

		const data = Object.fromEntries(new FormData(form).entries())
		data.consent = document.querySelector('[name="consent"]').checked
		if (window.UTUTENA_CONFIG?.turnstileSiteKey && !data['cf-turnstile-response']) {
			showFormMessage('Confirme a verificação de segurança para enviar o pedido.', 'error')
			return
		}
		button.disabled = true
		button.textContent = 'A enviar…'

		try {
			const response = await fetch('/api/leads', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			})
			const result = await response.json().catch(function () { return {} })
			if (!response.ok || !result.ok) throw new Error(result.message || 'Não foi possível enviar o pedido.')
			showFormMessage('Pedido recebido. Entraremos em contacto através do e-mail indicado.', 'success')
			form.reset()
			trackLeadSource()
			resetTurnstile()
			window.dispatchEvent(new CustomEvent('ututena:lead-success', { detail: { challenge: data.challenge } }))
		} catch (error) {
			showFormMessage(error.message + ' Pode contactar-nos por info@ututena.com.', 'error')
			window.dispatchEvent(new CustomEvent('ututena:lead-error', { detail: { reason: error.message } }))
			resetTurnstile()
		} finally {
			button.disabled = false
			button.innerHTML = 'Enviar pedido <span aria-hidden="true">↗</span>'
		}
	})
}

document.addEventListener('DOMContentLoaded', function () {
	initNavigation()
	initTabs()
	initChallengeShortcuts()
	trackLeadSource()
	initTurnstile()
	initLeadForm()
	initMotion()
	const year = document.getElementById('currentYear')
	if (year) year.textContent = String(new Date().getFullYear())
})

/* ── Motion system: intentionally progressive and dependency-free. ── */
function initMotion() {
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
	const motionEnabled = !motionPreference.matches && !connection?.saveData
	const progress = document.querySelector('.scroll-progress')
	let raf = 0
	function updateScrollProgress() {
		if (!progress) return
		const scrollable = document.documentElement.scrollHeight - window.innerHeight
		const fraction = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
		progress.style.transform = 'scaleX(' + fraction + ')'
	}
	window.addEventListener('scroll', function () {
		if (raf) return
		raf = requestAnimationFrame(function () {
			updateScrollProgress()
			raf = 0
		})
	}, { passive: true })
	updateScrollProgress()

	const heroArt = document.querySelector('.hero-art')
	const bars = document.querySelector('.dashboard-bars')
	const stages = Array.from(document.querySelectorAll('[data-hero-stages] .tiny-metric'))
	const caption = document.querySelector('[data-hero-caption]')
	let stageIndex = 0
	let stageTimer
	const labels = ['Preparar conteúdos de aprendizagem', 'Praticar com o mentor IA', 'Acompanhar a evolução da equipa']
	function updateHeroStage(next) {
		stageIndex = next
		stages.forEach(function (stage, index) { stage.classList.toggle('is-stage-active', index === stageIndex) })
		if (caption) caption.textContent = labels[stageIndex]
	}
	function stopHero() { window.clearInterval(stageTimer); stageTimer = undefined }
	function startHero() {
		if (!motionEnabled || document.body.classList.contains('motion-paused') || document.hidden || stageTimer) return
		stageTimer = window.setInterval(function () { updateHeroStage((stageIndex + 1) % stages.length) }, 4400)
	}
	if (heroArt) {
		if (bars) bars.classList.add('is-animated')
		let visible = true
		function syncHero() { if (visible) startHero(); else stopHero() }
		if ('IntersectionObserver' in window) {
			const observer = new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; syncHero() }, { threshold: .08 })
			observer.observe(heroArt)
		}
		heroArt.addEventListener('pointerenter', stopHero)
		heroArt.addEventListener('pointerleave', syncHero)
		window.addEventListener('visibilitychange', syncHero)
		window.addEventListener('ututena:motion-change', syncHero)
		startHero()
	}

	// Repeated motion is intentionally absent when reduced motion or data saver is active.
	if (motionEnabled && 'IntersectionObserver' in window) {
		const observed = []
		const selectors = [
			'.problem-grid .problem-card', '.service-layout .service-feature',
			'.service-list article', '.ai-card', '.platform-grid article',
			'.sector-grid .sector', '.steps-grid article', '.choice-grid>div',
			'.journey-board'
		]
		selectors.forEach(function (selector) {
			document.querySelectorAll(selector).forEach(function (element, index) {
				if (element.getBoundingClientRect().top < window.innerHeight - 30) return
				element.classList.add('motion-reveal')
				element.dataset.revealDelay = String(index % 4)
				observed.push(element)
			})
		})
		if (observed.length) {
			const observer = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (!entry.isIntersecting) return
					entry.target.classList.add('is-revealed')
					observer.unobserve(entry.target)
				})
			}, { rootMargin: '0px 0px -35px 0px', threshold: .04 })
			observed.forEach(function (element) { observer.observe(element) })
			// Apply this after observers exist; without JS the HTML remains fully visible.
			document.documentElement.classList.add('motion-ready')
		}
	}

	const tabs = Array.from(document.querySelectorAll('[data-journey-step]'))
	const panels = Array.from(document.querySelectorAll('[data-journey-panel]'))
	const nodes = Array.from(document.querySelectorAll('[data-journey-node]'))
	const dots = Array.from(document.querySelectorAll('.journey-pagination i'))
	const board = document.querySelector('[data-journey-board]')
	const toggle = document.getElementById('journeyToggle')
	const trajectory = document.querySelector('.hero-trajectory')
	if (!tabs.length || !board) return
	let step = 0
	let running = motionEnabled
	let inView = false
	let cycleTimer
	let userPaused = !motionEnabled
	function activate(index) {
		step = index
		tabs.forEach(function (tab, i) {
			const active = i === index
			tab.classList.toggle('is-current', active)
			tab.setAttribute('aria-selected', String(active))
			tab.tabIndex = active ? 0 : -1
		})
		panels.forEach(function (panel, i) {
			panel.hidden = i !== index
			panel.classList.toggle('is-current', i === index)
		})
		nodes.forEach(function (node, i) { node.classList.toggle('is-highlighted', i === index) })
		dots.forEach(function (dot, i) { dot.classList.toggle('is-current', i === index) })
	}
	function stopCycle() { window.clearInterval(cycleTimer); cycleTimer = undefined }
	function syncCycle() {
		stopCycle()
		if (!motionEnabled || userPaused || document.hidden || !inView) return
		cycleTimer = window.setInterval(function () { activate((step + 1) % tabs.length) }, 6000)
	}
	function setPaused(paused) {
		userPaused = paused
		if (toggle) {
			toggle.setAttribute('aria-pressed', String(paused))
			toggle.setAttribute('aria-label', paused ? 'Retomar a sequência automática' : 'Pausar a sequência automática')
			toggle.innerHTML = paused ? 'Reproduzir <span aria-hidden="true">▶</span>' : 'Pausar <span aria-hidden="true">Ⅱ</span>'
		}
		document.body.classList.toggle('motion-paused', paused)
		if (trajectory && typeof trajectory.pauseAnimations === 'function') {
			if (paused) trajectory.pauseAnimations()
			else trajectory.unpauseAnimations()
		}
		window.dispatchEvent(new Event('ututena:motion-change'))
		syncCycle()
	}
	tabs.forEach(function (tab, index) {
		tab.addEventListener('click', function () { activate(index); setPaused(true) })
		tab.addEventListener('keydown', function (event) {
			if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return
			event.preventDefault()
			const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
			activate(next)
			tabs[next].focus()
			setPaused(true)
		})
	})
	toggle?.addEventListener('click', function () { setPaused(!userPaused) })
	if ('IntersectionObserver' in window) {
		const observer = new IntersectionObserver(function (entries) {
			inView = entries[0].isIntersecting
			syncCycle()
		}, { threshold: .15 })
		observer.observe(board)
	} else inView = true
	window.addEventListener('visibilitychange', syncCycle)
	if (!motionEnabled) {
		setPaused(true)
		if (toggle) {
			toggle.disabled = true
			toggle.textContent = 'Movimento reduzido'
		}
	} else syncCycle()
}

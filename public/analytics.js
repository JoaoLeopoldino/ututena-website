'use strict'

/* ── PostHog analytics with consent. Inactive while posthogKey is empty. ──
 * Before a choice (or after "Recusar") PostHog runs in memory only: no cookies,
 * no localStorage, no session replay. "Aceitar" enables persistence and replay.
 * Form values are never sent; events only carry labels and the selected challenge. */

const CONSENT_KEY = 'ututena_analytics_consent'
const BANNER_EN = document.documentElement.lang.startsWith('en')

function readConsent() {
	try { return window.localStorage.getItem(CONSENT_KEY) } catch (error) { return null }
}

function storeConsent(value) {
	try { window.localStorage.setItem(CONSENT_KEY, value) } catch (error) { /* private mode: choice lasts for this visit */ }
}

function loadPostHog(key, host, granted, onReady) {
	const stub = window.posthog || []
	stub._i = stub._i || []
	stub.__SV = 1
	stub._i.push([key, {
		api_host: host,
		ui_host: host.replace('.i.posthog.com', '.posthog.com'),
		person_profiles: 'identified_only',
		persistence: granted ? 'localStorage+cookie' : 'memory',
		capture_pageview: true,
		capture_pageleave: true,
		autocapture: false,
		disable_session_recording: !granted,
		session_recording: { maskAllInputs: true },
		loaded: onReady
	}])
	window.posthog = stub
	const script = document.createElement('script')
	script.src = host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js'
	script.async = true
	script.crossOrigin = 'anonymous'
	document.head.appendChild(script)
}

function initConsentBanner(onChoice) {
	const banner = document.createElement('div')
	banner.className = 'consent-banner'
	banner.setAttribute('role', 'region')
	banner.setAttribute('aria-label', BANNER_EN ? 'Analytics preferences' : 'Preferências de estatísticas')
	banner.innerHTML = BANNER_EN
		? '<p>We use usage analytics to improve this page. With your permission, we store an identifier in your browser and record anonymous sessions (without the content of form fields). <a href="/en/privacy">Read the privacy notice</a></p>' +
			'<div class="consent-actions"><button type="button" class="consent-decline">Decline</button><button type="button" class="consent-accept">Accept</button></div>'
		: '<p>Usamos estatísticas de utilização para melhorar esta página. Com a sua autorização, guardamos um identificador no navegador e gravamos sessões anónimas (sem o conteúdo dos campos). <a href="/privacidade">Saber mais</a></p>' +
			'<div class="consent-actions"><button type="button" class="consent-decline">Recusar</button><button type="button" class="consent-accept">Aceitar</button></div>'
	function close(value) {
		storeConsent(value)
		banner.remove()
		onChoice(value)
	}
	banner.querySelector('.consent-accept').addEventListener('click', function () { close('granted') })
	banner.querySelector('.consent-decline').addEventListener('click', function () { close('denied') })
	document.body.appendChild(banner)
}

function initAnalytics() {
	const key = window.UTUTENA_CONFIG?.posthogKey
	const host = window.UTUTENA_CONFIG?.posthogHost || 'https://eu.i.posthog.com'
	if (!key) return

	let ready = false
	const pending = []
	function track(event, properties) {
		if (ready) window.posthog.capture(event, properties)
		else pending.push([event, properties])
	}
	function applyConsent(value) {
		if (!ready || value !== 'granted') return
		window.posthog.set_config({ persistence: 'localStorage+cookie', disable_session_recording: false })
		window.posthog.startSessionRecording()
	}

	const consent = readConsent()
	loadPostHog(key, host, consent === 'granted', function () {
		ready = true
		pending.splice(0).forEach(function (item) { window.posthog.capture(item[0], item[1]) })
	})
	if (!consent) initConsentBanner(applyConsent)

	document.querySelectorAll('[data-consent-reopen]').forEach(function (link) {
		link.addEventListener('click', function (event) {
			event.preventDefault()
			if (!document.querySelector('.consent-banner')) initConsentBanner(applyConsent)
		})
	})

	document.querySelectorAll('a[href="#diagnostico"], a[href="#contact"]').forEach(function (link) {
		link.addEventListener('click', function () {
			track('cta_clicked', {
				label: link.textContent.replace(/[↗→]/g, '').trim().slice(0, 80),
				location: link.className || 'link',
				challenge: link.dataset.challenge || null
			})
		})
	})

	const channels = [
		['wa.me', 'whatsapp'], ['m.me', 'messenger'], ['facebook.com', 'facebook'],
		['linkedin.com', 'linkedin'], ['mailto:', 'email'], ['tel:', 'phone']
	]
	document.querySelectorAll('a[href]').forEach(function (link) {
		const href = link.getAttribute('href')
		const match = channels.find(function (channel) { return href.includes(channel[0]) })
		if (!match) return
		link.addEventListener('click', function () {
			track('contact_clicked', { channel: match[1], location: link.closest('footer') ? 'footer' : 'contact' })
		})
	})

	document.querySelectorAll('[data-demo]').forEach(function (tab) {
		tab.addEventListener('click', function () { track('demo_tab_viewed', { tab: tab.dataset.demo }) })
	})
	document.querySelectorAll('[data-journey-step]').forEach(function (tab) {
		tab.addEventListener('click', function () { track('journey_step_viewed', { step: Number(tab.dataset.journeyStep) }) })
	})

	const form = document.getElementById('leadForm')
	if (form) {
		let started = false
		form.addEventListener('focusin', function () {
			if (started) return
			started = true
			track('lead_form_started')
		})
		window.addEventListener('ututena:lead-success', function (event) {
			track('lead_form_submitted', { challenge: event.detail?.challenge || null })
			started = false
		})
		window.addEventListener('ututena:lead-error', function (event) {
			track('lead_form_error', { reason: event.detail?.reason || 'unknown' })
		})
	}
}

document.addEventListener('DOMContentLoaded', initAnalytics)

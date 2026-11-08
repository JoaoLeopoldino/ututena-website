// Cloudflare Pages Function: POST /api/leads
// Variáveis secretas exigidas: RESEND_API_KEY, TURNSTILE_SECRET_KEY,
// UTUTENA_FROM_EMAIL, UTUTENA_TO_EMAIL.

const allowedChallenges = new Set([
	'Quero uma demonstração',
	'IA, mentor e simulações',
	'Criação de cursos com IA',
	'Implementar um LMS',
	'Modernizar um LMS',
	'Formação e competências',
	'Integrações e suporte',
	'Outro desafio'
])

function jsonResponse(status, payload) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-store',
			'X-Content-Type-Options': 'nosniff'
		}
	})
}

function normalize(value, maxLength) {
	return typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, maxLength) : ''
}

function escapeHtml(value) {
	return String(value).replace(/[&<>"']/g, function (character) {
		return {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;'
		}[character]
	})
}

async function verifyTurnstile(token, request, env) {
	const payload = {
		secret: env.TURNSTILE_SECRET_KEY,
		response: token,
		remoteip: request.headers.get('CF-Connecting-IP') || undefined
	}

	const controller = new AbortController()
	const timeout = setTimeout(function () { controller.abort() }, 7000)
	try {
		const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
			signal: controller.signal
		})
		if (!result.ok) return false
		const verification = await result.json()
		if (!verification.success || verification.action !== 'lead_form') return false

		if (env.TURNSTILE_ALLOWED_HOSTNAMES) {
			const allowed = env.TURNSTILE_ALLOWED_HOSTNAMES.split(',').map(function (item) { return item.trim().toLowerCase() })
			if (!allowed.includes(String(verification.hostname || '').toLowerCase())) return false
		}
		return true
	} catch (_) {
		return false
	} finally {
		clearTimeout(timeout)
	}
}

export async function onRequestPost({ request, env }) {
	const sourceOrigin = request.headers.get('Origin')
	if (sourceOrigin && sourceOrigin !== new URL(request.url).origin) {
		return jsonResponse(403, { ok: false, message: 'Origem de pedido inválida.' })
	}

	if (!env.RESEND_API_KEY || !env.UTUTENA_FROM_EMAIL || !env.UTUTENA_TO_EMAIL || !env.TURNSTILE_SECRET_KEY) {
		return jsonResponse(503, { ok: false, message: 'O formulário ainda não foi activado.' })
	}

	if (!request.headers.get('Content-Type')?.includes('application/json')) {
		return jsonResponse(415, { ok: false, message: 'Formato de pedido não suportado.' })
	}

	const length = Number(request.headers.get('Content-Length') || 0)
	if (length > 8000) return jsonResponse(413, { ok: false, message: 'Pedido demasiado extenso.' })

	let body
	try {
		const raw = await request.text()
		if (raw.length > 8000) return jsonResponse(413, { ok: false, message: 'Pedido demasiado extenso.' })
		body = JSON.parse(raw)
	} catch (_) {
		return jsonResponse(400, { ok: false, message: 'Pedido inválido.' })
	}
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return jsonResponse(400, { ok: false, message: 'Dados inválidos.' })
	}

	// Honeypot: não enviar email nem revelar ao bot o motivo da rejeição.
	if (normalize(body.website, 120)) return jsonResponse(200, { ok: true })

	const name = normalize(body.name, 120)
	const email = normalize(body.email, 254)
	const company = normalize(body.company, 140)
	const challenge = normalize(body.challenge, 100)
	const message = normalize(body.message, 600)
	const token = normalize(body['cf-turnstile-response'], 2048)

	if (name.length < 2 || company.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !allowedChallenges.has(challenge) || body.consent !== true) {
		return jsonResponse(422, { ok: false, message: 'Revise os campos obrigatórios e a autorização de contacto.' })
	}

	if (!token || !(await verifyTurnstile(token, request, env))) {
		return jsonResponse(403, { ok: false, message: 'Verificação de segurança inválida ou expirada. Tente novamente.' })
	}

	const source = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'source_path'].map(function (key) {
		return key + ': ' + normalize(body[key], 120)
	}).join('\n')
	const text = [
		'Novo pedido de diagnóstico — Ututena',
		'',
		'Nome: ' + name,
		'E-mail: ' + email,
		'Organização: ' + company,
		'Necessidade: ' + challenge,
		'Mensagem: ' + (message || '(não indicada)'),
		'Autorização de contacto: Sim',
		'',
		'Origem:', source
	].join('\n')
	const html = '<h2>Novo pedido de diagnóstico — Ututena</h2><p><strong>Nome:</strong> ' + escapeHtml(name) +
		'<br><strong>E-mail:</strong> ' + escapeHtml(email) +
		'<br><strong>Organização:</strong> ' + escapeHtml(company) +
		'<br><strong>Necessidade:</strong> ' + escapeHtml(challenge) +
		'<br><strong>Mensagem:</strong> ' + escapeHtml(message || '(não indicada)') +
		'</p><p>Autorização de contacto: Sim</p><pre>' + escapeHtml(source) + '</pre>'

	try {
		const result = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				from: env.UTUTENA_FROM_EMAIL,
				to: [env.UTUTENA_TO_EMAIL],
				reply_to: email,
				subject: 'Ututena — diagnóstico de ' + company.slice(0, 65),
				text,
				html
			})
		})
		if (!result.ok) return jsonResponse(502, { ok: false, message: 'Não conseguimos concluir o envio neste momento.' })
		return jsonResponse(200, { ok: true })
	} catch (_) {
		return jsonResponse(502, { ok: false, message: 'O serviço de recepção está temporariamente indisponível.' })
	}
}

export function onRequestGet() {
	return jsonResponse(405, { ok: false, message: 'Método não permitido.' })
}

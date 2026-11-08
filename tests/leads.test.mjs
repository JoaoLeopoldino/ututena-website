import test from 'node:test'
import assert from 'node:assert/strict'
import { onRequestGet, onRequestPost } from '../functions/api/leads.js'

const baseURL = 'https://ututena.com/api/leads'
const valid = {
	name: 'Ana Silva',
	email: 'ana@empresa.ao',
	company: 'Empresa Teste',
	challenge: 'Implementar um LMS',
	consent: true,
	'cf-turnstile-response': 'token-de-teste',
	website: ''
}

function ctx(body, env = {}) {
	return { request: new Request(baseURL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Origin: 'https://ututena.com' },
		body: JSON.stringify(body)
	}), env }
}

test('GET não permitido', async function () {
	const response = onRequestGet()
	assert.equal(response.status, 405)
})

test('nunca devolve sucesso com integração não configurada', async function () {
	const response = await onRequestPost(ctx(valid))
	assert.equal(response.status, 503)
	assert.equal((await response.json()).ok, false)
})

test('pedido sem consentimento é rejeitado', async function () {
	const env = { RESEND_API_KEY: 'test', UTUTENA_FROM_EMAIL: 'a@ututena.com', UTUTENA_TO_EMAIL: 'b@ututena.com', TURNSTILE_SECRET_KEY: 'test' }
	const response = await onRequestPost(ctx({ ...valid, consent: false }, env))
	assert.equal(response.status, 422)
})

test('desafio não reconhecido é rejeitado', async function () {
	const env = { RESEND_API_KEY: 'test', UTUTENA_FROM_EMAIL: 'a@ututena.com', UTUTENA_TO_EMAIL: 'b@ututena.com', TURNSTILE_SECRET_KEY: 'test' }
	const response = await onRequestPost(ctx({ ...valid, challenge: 'Outro não listado' }, env))
	assert.equal(response.status, 422)
})

test('honeypot não envia emails', async function () {
	const env = { RESEND_API_KEY: 'test', UTUTENA_FROM_EMAIL: 'a@ututena.com', UTUTENA_TO_EMAIL: 'b@ututena.com', TURNSTILE_SECRET_KEY: 'test' }
	const response = await onRequestPost(ctx({ ...valid, website: 'spam.site' }, env))
	assert.equal(response.status, 200)
})

test('origem divergente é bloqueada', async function () {
	const request = new Request(baseURL, { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: JSON.stringify(valid) })
	const response = await onRequestPost({ request, env: {} })
	assert.equal(response.status, 403)
})

test('pedido válido é enviado somente após Turnstile e Resend confirmarem', async function () {
	const originalFetch = globalThis.fetch
	const calls = []
	globalThis.fetch = async function (url, options) {
		calls.push({ url, body: options.body })
		if (url.includes('/siteverify')) {
			return new Response(JSON.stringify({ success: true, action: 'lead_form', hostname: 'ututena.com' }), { status: 200 })
		}
		if (url.includes('api.resend.com')) {
			return new Response(JSON.stringify({ id: 'email_123' }), { status: 200 })
		}
		throw new Error('Endpoint inesperado')
	}
	const env = {
		RESEND_API_KEY: 'test',
		UTUTENA_FROM_EMAIL: 'Ututena <info@ututena.com>',
		UTUTENA_TO_EMAIL: 'info@ututena.com',
		TURNSTILE_SECRET_KEY: 'test',
		TURNSTILE_ALLOWED_HOSTNAMES: 'ututena.com'
	}
	try {
		const response = await onRequestPost(ctx({ ...valid, message: '<script>alert(1)</script>' }, env))
		assert.equal(response.status, 200)
		assert.equal((await response.json()).ok, true)
		assert.equal(calls.length, 2)
		assert.ok(calls[0].url.includes('siteverify'))
		const emailPayload = JSON.parse(calls[1].body)
		assert.equal(emailPayload.to[0], 'info@ututena.com')
		assert.ok(emailPayload.html.includes('&lt;script&gt;'))
	} finally {
		globalThis.fetch = originalFetch
	}
})

test('falha no fornecedor de email não confirma recepção', async function () {
	const originalFetch = globalThis.fetch
	globalThis.fetch = async function (url) {
		if (url.includes('siteverify')) return new Response(JSON.stringify({ success: true, action: 'lead_form', hostname: 'ututena.com' }), { status: 200 })
		return new Response('Erro', { status: 500 })
	}
	const env = { RESEND_API_KEY: 'test', UTUTENA_FROM_EMAIL: 'info@ututena.com', UTUTENA_TO_EMAIL: 'info@ututena.com', TURNSTILE_SECRET_KEY: 'test' }
	try {
		const response = await onRequestPost(ctx(valid, env))
		assert.equal(response.status, 502)
		assert.equal((await response.json()).ok, false)
	} finally {
		globalThis.fetch = originalFetch
	}
})


test('pedidos de demonstração e IA são aceites e encaminhados', async function () {
	const originalFetch = globalThis.fetch
	const sent = []
	globalThis.fetch = async function (url, options) {
		if (url.includes('/siteverify')) {
			return new Response(JSON.stringify({ success: true, action: 'lead_form', hostname: 'ututena.com' }), { status: 200 })
		}
		if (url.includes('api.resend.com')) {
			sent.push(JSON.parse(options.body))
			return new Response(JSON.stringify({ id: 'email_123' }), { status: 200 })
		}
		throw new Error('Endpoint inesperado')
	}
	const env = { RESEND_API_KEY: 'test', UTUTENA_FROM_EMAIL: 'Ututena <info@ututena.com>', UTUTENA_TO_EMAIL: 'info@ututena.com', TURNSTILE_SECRET_KEY: 'test' }
	try {
		for (const challenge of ['Quero uma demonstração', 'IA, mentor e simulações', 'Criação de cursos com IA']) {
			const response = await onRequestPost(ctx({ ...valid, challenge }, env))
			assert.equal(response.status, 200)
		}
		assert.equal(sent.length, 3)
		assert.ok(sent.every(function (item) { return item.to[0] === 'info@ututena.com' }))
	} finally {
		globalThis.fetch = originalFetch
	}
})

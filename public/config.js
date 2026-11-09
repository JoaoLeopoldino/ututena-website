// Definir a chave pública Turnstile depois de configurar o widget na Cloudflare.
// Nunca colocar TURNSTILE_SECRET_KEY ou RESEND_API_KEY neste ficheiro.
// posthogKey é a Project API key pública (phc_...); vazia = analytics desligado.
window.UTUTENA_CONFIG = {
	turnstileSiteKey: '0x4AAAAAAF5nQ6BNGyoIX_uN',
	posthogKey: '',
	posthogHost: 'https://eu.i.posthog.com'
}

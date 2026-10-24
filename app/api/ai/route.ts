// No provider credentials or ChatGPT Sites authentication are configured here.
// Do not claim AI-generated output or send user content to an unconfigured provider.
export async function POST() {
 return Response.json({ error:'Live AI requires a configured provider and independent authentication; use the validated guided roadmap available to guests.', code:'ai_not_configured' }, { status:503, headers:{'Cache-Control':'no-store'} });
}

// Vercel public demo: ChatGPT Sites auth and Cloudflare D1 do not run on Vercel.
// Client safely retains guest learning progress in localStorage.
const response = () => Response.json({ error:'Account sync is unavailable on this public demo. Your learning progress remains on this device.', code:'sign_in_required' }, { status:401, headers:{'Cache-Control':'no-store'} });
export async function GET() { return response(); }
export async function POST() { return response(); }
export async function DELETE() { return response(); }

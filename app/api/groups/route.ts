// Collaboration requires authenticated accounts and a configured shared database.
const unavailable = () => Response.json({ error:'Group collaboration is unavailable on this public guest demo.', code:'sign_in_required' }, { status:401, headers:{'Cache-Control':'no-store'} });
export async function GET() { return unavailable(); }
export async function POST() { return unavailable(); }

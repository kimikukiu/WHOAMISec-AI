import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('hermes_auth');

  const authenticated = authCookie?.value === '1';

  return NextResponse.json({ authenticated });
}

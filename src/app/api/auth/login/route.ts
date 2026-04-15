import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

const ADMIN_HASH = createHash('sha256').update('#AllOfThem-3301').digest('hex');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const hash = createHash('sha256').update(password).digest('hex');

    if (hash !== ADMIN_HASH) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('hermes_auth', '1', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'Authenticated' });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

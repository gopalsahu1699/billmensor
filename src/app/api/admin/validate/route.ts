import { NextResponse } from 'next/server';
import { verifyAdminCredentials } from '@/lib/admin-auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { valid: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (verifyAdminCredentials(username, password)) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json(
      { valid: false, error: 'Invalid admin credentials' },
      { status: 401 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ valid: false, error: message }, { status: 500 });
  }
}

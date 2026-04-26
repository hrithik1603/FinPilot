import { NextResponse } from 'next/server';
import { getUserContext, updateUserContext } from '@/lib/user/context';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const context = await getUserContext(userId);
  return NextResponse.json(context || {});
}

export async function POST(req: Request) {
  const { userId, context } = await req.json();

  if (!userId || !context) {
    return NextResponse.json({ error: 'userId and context are required' }, { status: 400 });
  }

  const success = await updateUserContext(userId, context);
  if (!success) {
    return NextResponse.json({ error: 'Failed to update context' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

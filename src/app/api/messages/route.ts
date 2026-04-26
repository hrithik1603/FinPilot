import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/messages — save a message to a chat
export async function POST(req: Request) {
  const { chatId, role, content } = await req.json();

  if (!chatId || !role || !content) {
    return NextResponse.json({ error: 'chatId, role, and content are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, role, content })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

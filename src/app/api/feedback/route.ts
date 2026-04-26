import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId, chatId, module, topicTitle, confidenceScore, feedbackType } = await req.json();

    if (!userId || !feedbackType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('answer_feedback')
      .insert({
        user_id: userId,
        chat_id: chatId,
        module,
        topic_title: topicTitle,
        confidence_score: confidenceScore,
        feedback_type: feedbackType
      });

    if (error) {
      console.error('Error logging feedback:', error);
      return NextResponse.json({ error: 'Failed to log feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Feedback API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

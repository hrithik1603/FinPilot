import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ai } from '@/lib/gemini';
import { chunkText } from '@/lib/chunking';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const sourceType = formData.get('source_type') as string || 'user';
    const priority = parseInt(formData.get('priority') as string || '1', 10);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    let textContent = '';

    // Process depending on file type
    if (file.type === 'application/pdf') {
      // Dynamic import to avoid Turbopack ESM issues with pdf-parse
      const pdfModule: any = await import('pdf-parse');
      const pdfParse = pdfModule.default || pdfModule;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      textContent = pdfData.text;
    } else if (file.type === 'text/plain') {
      textContent = await file.text();
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // Chunk the text
    const chunks = chunkText(textContent, 1000);

    const insertedDocuments = [];

    // Process chunks and get embeddings
    for (const [index, chunk] of chunks.entries()) {
      // 1. Get embedding from Gemini
      const embeddingResponse = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: chunk,
        config: {
          outputDimensionality: 768
        }
      });

      const embedding = embeddingResponse.embeddings![0].values;

      // 2. Store in Supabase
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: `${file.name} - Part ${index + 1}`,
          content: chunk,
          source_type: sourceType,
          priority: priority,
          embedding: embedding,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting to Supabase:', error);
        throw error;
      }
      
      insertedDocuments.push(data);
    }

    return NextResponse.json({
      message: 'File processed successfully',
      chunks: chunks.length,
      documents: insertedDocuments.map(d => d.id)
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

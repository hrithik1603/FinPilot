export function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  // Simple chunking by paragraphs or double newlines, then enforcing max size
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\s*\n/);
  
  let currentChunk = "";
  for (const paragraph of paragraphs) {
    if ((currentChunk.length + paragraph.length) > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph + "\n\n";
    } else {
      currentChunk += paragraph + "\n\n";
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

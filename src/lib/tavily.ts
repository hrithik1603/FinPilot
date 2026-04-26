import { tavily } from '@tavily/core';

if (!process.env.TAVILY_API_KEY) {
  console.warn('TAVILY_API_KEY not set — web search will be disabled');
}

const tvly = process.env.TAVILY_API_KEY
  ? tavily({ apiKey: process.env.TAVILY_API_KEY })
  : null;

export async function searchWeb(query: string): Promise<string> {
  if (!tvly) return '';

  try {
    const response = await tvly.search(`${query} India`, {
      maxResults: 5,
      searchDepth: 'basic',
      includeAnswer: true,
    });

    let webContext = '';

    // Include Tavily's AI-generated answer summary if available
    if (response.answer) {
      webContext += `Web Summary: ${response.answer}\n\n`;
    }

    // Include individual search results
    if (response.results && response.results.length > 0) {
      webContext += response.results
        .map((r: any, i: number) => `[Web ${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
        .join('\n\n');
    }

    return webContext;
  } catch (error) {
    console.error('Tavily search error:', error);
    return '';
  }
}

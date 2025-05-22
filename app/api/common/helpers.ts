export async function addToKnowledgeBase(content: string) {
    try {
      const response = await fetch(new URL('/api/resources', new URL(process.env.APP_URL || 'http://localhost:3000')), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to knowledge base');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding to knowledge base:', error);
      throw error;
    }
  }
  
export async function getRelevantContent(query: string) {
try {
    const response = await fetch(
    new URL(`/api/resources?query=${encodeURIComponent(query)}`, new URL(process.env.APP_URL || 'http://localhost:3000'))
    );
    
    if (!response.ok) {
    throw new Error('Failed to get relevant content');
    }
    
    const data = await response.json();
    
    const filteredResults = data.results.filter((result: { similarity: number }) => 
    result.similarity >= 0.75
    );
    
    return filteredResults;
} catch (error) {
    console.error('Error getting relevant content:', error);
    return [];
}
}
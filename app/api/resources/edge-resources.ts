let inMemoryKnowledgeBase: string[] = [];

export async function createResourceEdge({ content }: { content: string }) {
  inMemoryKnowledgeBase.push(content);
  return { success: true, id: Date.now().toString() };
}

export async function findRelevantContentEdge(query: string): Promise<string> {

  const relevantItems = inMemoryKnowledgeBase.filter(item => 
    item.toLowerCase().includes(query.toLowerCase())
  );
  
  return relevantItems.join('\n\n');
}
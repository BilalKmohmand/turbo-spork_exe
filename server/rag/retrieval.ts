import { db } from "../db";
import { knowledgeChunks, type KnowledgeChunk } from "@shared/schema";
import { sql, and, eq, or, ilike } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";

export interface RetrievedChunk {
  chunk: KnowledgeChunk;
  similarity: number;
  citation: string;
}

export async function retrieveRelevantChunks(
  query: string,
  options: {
    topK?: number;
    topic?: string;
    contentType?: string;
    difficulty?: string;
    minSimilarity?: number;
  } = {}
): Promise<RetrievedChunk[]> {
  const { topK = 8, topic, contentType, difficulty, minSimilarity = 0.3 } = options;

  const queryEmbedding = await generateEmbedding(query);
  const embeddingString = `[${queryEmbedding.join(",")}]`;

  let whereConditions: any[] = [];
  
  if (topic) {
    whereConditions.push(
      or(
        eq(knowledgeChunks.topic, topic),
        ilike(knowledgeChunks.topic, `%${topic}%`)
      )
    );
  }
  
  if (contentType) {
    whereConditions.push(eq(knowledgeChunks.contentType, contentType));
  }
  
  if (difficulty) {
    whereConditions.push(eq(knowledgeChunks.difficulty, difficulty));
  }

  const results = await db.execute(sql`
    SELECT 
      id, content, source_book, chapter, section, page, topic, subtopic,
      content_type, difficulty, keywords, related_formulas, common_misconceptions,
      created_at,
      1 - (embedding <=> ${embeddingString}::vector) as similarity
    FROM knowledge_chunks
    WHERE embedding IS NOT NULL
    ${topic ? sql`AND (topic = ${topic} OR topic ILIKE ${'%' + topic + '%'})` : sql``}
    ${contentType ? sql`AND content_type = ${contentType}` : sql``}
    ${difficulty ? sql`AND difficulty = ${difficulty}` : sql``}
    ORDER BY embedding <=> ${embeddingString}::vector
    LIMIT ${topK}
  `);

  const chunks: RetrievedChunk[] = [];
  
  for (const row of results.rows as any[]) {
    const similarity = parseFloat(row.similarity);
    
    if (similarity >= minSimilarity) {
      const chunk: KnowledgeChunk = {
        id: row.id,
        content: row.content,
        embedding: null,
        sourceBook: row.source_book,
        chapter: row.chapter,
        section: row.section,
        page: row.page,
        topic: row.topic,
        subtopic: row.subtopic,
        contentType: row.content_type,
        difficulty: row.difficulty,
        keywords: row.keywords,
        relatedFormulas: row.related_formulas,
        commonMisconceptions: row.common_misconceptions,
        createdAt: row.created_at,
      };

      const citation = formatCitation(chunk);
      
      chunks.push({
        chunk,
        similarity,
        citation,
      });
    }
  }

  return chunks;
}

function formatCitation(chunk: KnowledgeChunk): string {
  let citation = chunk.sourceBook;
  
  if (chunk.chapter) {
    citation += `, Chapter ${chunk.chapter}`;
  }
  
  if (chunk.section) {
    citation += `, Section ${chunk.section}`;
  }
  
  if (chunk.page) {
    citation += `, Page ${chunk.page}`;
  }
  
  return citation;
}

export async function retrieveByKeywords(
  keywords: string[],
  options: { topK?: number } = {}
): Promise<RetrievedChunk[]> {
  const { topK = 5 } = options;

  const keywordConditions = keywords.map(kw => 
    sql`${kw} = ANY(keywords) OR content ILIKE ${'%' + kw + '%'}`
  );

  const results = await db.execute(sql`
    SELECT 
      id, content, source_book, chapter, section, page, topic, subtopic,
      content_type, difficulty, keywords, related_formulas, common_misconceptions,
      created_at
    FROM knowledge_chunks
    WHERE ${sql.join(keywordConditions, sql` OR `)}
    LIMIT ${topK}
  `);

  return (results.rows as any[]).map(row => ({
    chunk: {
      id: row.id,
      content: row.content,
      embedding: null,
      sourceBook: row.source_book,
      chapter: row.chapter,
      section: row.section,
      page: row.page,
      topic: row.topic,
      subtopic: row.subtopic,
      contentType: row.content_type,
      difficulty: row.difficulty,
      keywords: row.keywords,
      relatedFormulas: row.related_formulas,
      commonMisconceptions: row.common_misconceptions,
      createdAt: row.created_at,
    },
    similarity: 0.5,
    citation: formatCitation({
      ...row,
      sourceBook: row.source_book,
      contentType: row.content_type,
      relatedFormulas: row.related_formulas,
      commonMisconceptions: row.common_misconceptions,
    }),
  }));
}

export function formatContextForAI(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "";
  }

  let context = "📚 KNOWLEDGE FROM TEXTBOOKS:\n\n";
  
  const grouped: Record<string, RetrievedChunk[]> = {};
  
  for (const item of chunks) {
    const type = item.chunk.contentType || "general";
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(item);
  }

  const typeLabels: Record<string, string> = {
    definition: "📖 DEFINITIONS",
    theorem: "🔬 THEOREMS & PROOFS",
    formula: "📐 FORMULAS",
    example: "💡 WORKED EXAMPLES",
    exercise: "✏️ PRACTICE PROBLEMS",
    explanation: "📝 EXPLANATIONS",
    general: "📋 GENERAL CONTENT",
  };

  for (const [type, items] of Object.entries(grouped)) {
    context += `\n${typeLabels[type] || type.toUpperCase()}:\n`;
    
    for (let i = 0; i < items.length; i++) {
      const { chunk, citation, similarity } = items[i];
      context += `\n--- Source ${i + 1}: ${citation} (Relevance: ${(similarity * 100).toFixed(0)}%) ---\n`;
      context += chunk.content + "\n";
      
      if (chunk.relatedFormulas && chunk.relatedFormulas.length > 0) {
        context += `Related formulas: ${chunk.relatedFormulas.join(", ")}\n`;
      }
      
      if (chunk.commonMisconceptions) {
        context += `⚠️ Common misconception: ${chunk.commonMisconceptions}\n`;
      }
    }
  }

  return context;
}

export async function getKnowledgeStats(): Promise<{
  totalChunks: number;
  byTopic: Record<string, number>;
  byType: Record<string, number>;
  byDifficulty: Record<string, number>;
}> {
  const totalResult = await db.execute(sql`
    SELECT COUNT(*) as count FROM knowledge_chunks
  `);
  
  const topicResult = await db.execute(sql`
    SELECT topic, COUNT(*) as count 
    FROM knowledge_chunks 
    GROUP BY topic
  `);
  
  const typeResult = await db.execute(sql`
    SELECT content_type, COUNT(*) as count 
    FROM knowledge_chunks 
    GROUP BY content_type
  `);
  
  const difficultyResult = await db.execute(sql`
    SELECT difficulty, COUNT(*) as count 
    FROM knowledge_chunks 
    GROUP BY difficulty
  `);

  const byTopic: Record<string, number> = {};
  for (const row of topicResult.rows as any[]) {
    byTopic[row.topic] = parseInt(row.count);
  }

  const byType: Record<string, number> = {};
  for (const row of typeResult.rows as any[]) {
    byType[row.content_type] = parseInt(row.count);
  }

  const byDifficulty: Record<string, number> = {};
  for (const row of difficultyResult.rows as any[]) {
    byDifficulty[row.difficulty] = parseInt(row.count);
  }

  return {
    totalChunks: parseInt((totalResult.rows[0] as any).count),
    byTopic,
    byType,
    byDifficulty,
  };
}

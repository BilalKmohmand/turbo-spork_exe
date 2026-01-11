interface ChunkResult {
  content: string;
  contentType: "definition" | "theorem" | "formula" | "example" | "exercise" | "explanation" | "general";
  keywords: string[];
  relatedFormulas: string[];
}

const MATH_PATTERNS = {
  definition: /(?:definition|def\.?|defined as|is defined|means that|we define)/i,
  theorem: /(?:theorem|lemma|corollary|proposition|proof|prove|q\.e\.d|qed|∎)/i,
  formula: /(?:formula|equation|=|∫|∑|∏|lim|d\/dx|∂|∇|sin|cos|tan|log|ln|√)/,
  example: /(?:example|e\.g\.|for instance|consider|suppose|let's say|worked example|solution:)/i,
  exercise: /(?:exercise|problem|find|solve|calculate|determine|compute|evaluate|show that|prove that)/i,
  explanation: /(?:note|notice|observe|recall|remember|intuitively|because|since|therefore|thus|hence)/i,
};

const TOPIC_KEYWORDS: Record<string, string[]> = {
  calculus: ["derivative", "integral", "limit", "differentiate", "integrate", "d/dx", "∫", "antiderivative", "chain rule", "product rule", "quotient rule"],
  algebra: ["equation", "polynomial", "factor", "solve", "variable", "expression", "quadratic", "linear", "coefficient"],
  geometry: ["triangle", "circle", "angle", "area", "perimeter", "volume", "radius", "diameter", "perpendicular", "parallel"],
  trigonometry: ["sin", "cos", "tan", "sine", "cosine", "tangent", "radian", "degree", "unit circle", "pythagorean"],
  statistics: ["mean", "median", "mode", "standard deviation", "variance", "probability", "distribution", "sample", "population"],
  linearAlgebra: ["matrix", "vector", "eigenvalue", "eigenvector", "determinant", "transpose", "inverse", "linear transformation"],
  differentialEquations: ["differential equation", "ODE", "PDE", "initial value", "boundary condition", "homogeneous", "particular solution"],
};

function detectContentType(text: string): ChunkResult["contentType"] {
  const scores: Record<string, number> = {
    definition: 0,
    theorem: 0,
    formula: 0,
    example: 0,
    exercise: 0,
    explanation: 0,
  };

  for (const [type, pattern] of Object.entries(MATH_PATTERNS)) {
    const matches = text.match(new RegExp(pattern, "gi"));
    if (matches) {
      scores[type] += matches.length;
    }
  }

  const hasHeavyMath = (text.match(/[=∫∑∏∂∇√±×÷]/g) || []).length > 3;
  if (hasHeavyMath) scores.formula += 2;

  const maxType = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b));
  
  if (maxType[1] === 0) return "general";
  return maxType[0] as ChunkResult["contentType"];
}

function extractKeywords(text: string): string[] {
  const keywords: Set<string> = new Set();
  
  for (const [topic, words] of Object.entries(TOPIC_KEYWORDS)) {
    for (const word of words) {
      if (text.toLowerCase().includes(word.toLowerCase())) {
        keywords.add(word);
        keywords.add(topic);
      }
    }
  }

  const mathSymbols = text.match(/[∫∑∏∂∇√]/g);
  if (mathSymbols) {
    mathSymbols.forEach(s => keywords.add(s));
  }

  return Array.from(keywords);
}

function extractFormulas(text: string): string[] {
  const formulas: string[] = [];
  
  const equationPatterns = [
    /[a-zA-Z]\s*=\s*[^,;\n]+/g,
    /∫[^∫]+d[a-z]/g,
    /lim(?:\s*_{[^}]+})?\s*[^\n]+/g,
    /d\/d[a-z]\s*\[[^\]]+\]/g,
    /\$[^$]+\$/g,
    /\\\([^)]+\\\)/g,
    /\\\[[^\]]+\\\]/g,
  ];

  for (const pattern of equationPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      formulas.push(...matches.map(m => m.trim()));
    }
  }

  return Array.from(new Set(formulas)).slice(0, 10);
}

export function chunkMathContent(
  fullText: string,
  options: {
    chunkSize?: number;
    overlap?: number;
    preserveStructure?: boolean;
  } = {}
): ChunkResult[] {
  const { chunkSize = 600, overlap = 100, preserveStructure = true } = options;
  
  const chunks: ChunkResult[] = [];
  
  if (preserveStructure) {
    const structuralPatterns = [
      /(?:^|\n)(?:Definition|Theorem|Lemma|Corollary|Proposition|Example|Exercise|Problem)\s*[\d.]*[:\s]/gim,
      /(?:^|\n)(?:\d+\.)\s+[A-Z]/gm,
      /(?:^|\n)(?:#{1,3})\s+/gm,
    ];

    let splitPoints: number[] = [0];
    
    for (const pattern of structuralPatterns) {
      let match;
      while ((match = pattern.exec(fullText)) !== null) {
        splitPoints.push(match.index);
      }
    }
    
    splitPoints.push(fullText.length);
    splitPoints = Array.from(new Set(splitPoints)).sort((a, b) => a - b);

    for (let i = 0; i < splitPoints.length - 1; i++) {
      let start = splitPoints[i];
      let end = splitPoints[i + 1];
      let section = fullText.slice(start, end).trim();
      
      if (section.length > chunkSize * 1.5) {
        const subChunks = chunkBySize(section, chunkSize, overlap);
        for (const subChunk of subChunks) {
          if (subChunk.trim().length > 50) {
            chunks.push({
              content: subChunk.trim(),
              contentType: detectContentType(subChunk),
              keywords: extractKeywords(subChunk),
              relatedFormulas: extractFormulas(subChunk),
            });
          }
        }
      } else if (section.length > 50) {
        chunks.push({
          content: section,
          contentType: detectContentType(section),
          keywords: extractKeywords(section),
          relatedFormulas: extractFormulas(section),
        });
      }
    }
  } else {
    const simpleChunks = chunkBySize(fullText, chunkSize, overlap);
    for (const chunk of simpleChunks) {
      if (chunk.trim().length > 50) {
        chunks.push({
          content: chunk.trim(),
          contentType: detectContentType(chunk),
          keywords: extractKeywords(chunk),
          relatedFormulas: extractFormulas(chunk),
        });
      }
    }
  }

  return chunks;
}

function chunkBySize(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = "";
  let lastOverlap = "";
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > size && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.ceil(overlap / 5));
      lastOverlap = overlapWords.join(" ");
      
      currentChunk = lastOverlap + " " + sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

export function detectTopic(text: string): string {
  const scores: Record<string, number> = {};
  
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    scores[topic] = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = text.match(regex);
      if (matches) {
        scores[topic] += matches.length;
      }
    }
  }
  
  const topTopic = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b));
  
  return topTopic[1] > 0 ? topTopic[0] : "general";
}

export function detectDifficulty(text: string): "beginner" | "intermediate" | "advanced" {
  const advancedIndicators = [
    "∫", "∑", "∏", "∂", "∇", "eigenvalue", "eigenvector", "differential equation",
    "matrix", "determinant", "taylor series", "fourier", "laplace", "complex analysis",
    "proof", "theorem", "lemma", "corollary", "∀", "∃", "∈", "⊂", "⊆"
  ];
  
  const beginnerIndicators = [
    "basic", "simple", "introduction", "beginner", "elementary", "first",
    "addition", "subtraction", "multiplication", "division", "fraction", "decimal"
  ];
  
  const textLower = text.toLowerCase();
  
  let advancedScore = 0;
  let beginnerScore = 0;
  
  for (const indicator of advancedIndicators) {
    if (text.includes(indicator) || textLower.includes(indicator.toLowerCase())) {
      advancedScore++;
    }
  }
  
  for (const indicator of beginnerIndicators) {
    if (textLower.includes(indicator)) {
      beginnerScore++;
    }
  }
  
  if (advancedScore >= 3) return "advanced";
  if (beginnerScore >= 2 || advancedScore === 0) return "beginner";
  return "intermediate";
}

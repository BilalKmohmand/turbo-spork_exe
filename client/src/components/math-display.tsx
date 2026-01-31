import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import type { StepObject } from "@shared/schema";

interface MathDisplayProps {
  children: string;
  block?: boolean;
}

function SafeInlineMath({ math }: { math: string }) {
  try {
    return <InlineMath math={math} />;
  } catch (e) {
    return <code className="px-1 py-0.5 bg-muted rounded text-sm">{math}</code>;
  }
}

function SafeBlockMath({ math }: { math: string }) {
  try {
    return <BlockMath math={math} />;
  } catch (e) {
    return <pre className="p-2 bg-muted rounded text-sm overflow-x-auto">{math}</pre>;
  }
}

export function MathDisplay({ children, block = false }: MathDisplayProps) {
  if (block) {
    return (
      <div className="my-4 overflow-x-auto">
        <SafeBlockMath math={children} />
      </div>
    );
  }
  return <SafeInlineMath math={children} />;
}

export function renderMathText(text: string): JSX.Element[] {
  if (!text) return [<span key={0}></span>];
  
  const parts: JSX.Element[] = [];
  let key = 0;
  
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Skip empty lines - add spacing
    if (!line.trim()) {
      parts.push(<div key={key++} className="h-3" />);
      continue;
    }
    
    // Question headers (e.g., "Question 1" or "Question 1:")
    const questionMatch = line.match(/^Question\s+(\d+):?$/i);
    if (questionMatch) {
      parts.push(
        <h2 key={key++} className="text-xl font-bold text-primary mt-6 mb-2 pb-2 border-b border-primary/20">
          Question {questionMatch[1]}
        </h2>
      );
      continue;
    }
    
    // Step headers (e.g., "Calculate the Area of the Base (B)")
    const stepMatch = line.match(/^(Calculate|Identify|Find|Determine|Apply|Use|Solve|Compute|Substitute|Simplify|Convert|Step \d+)[^.]*(\([A-Za-z]\))?$/i);
    if (stepMatch) {
      parts.push(
        <h3 key={key++} className="text-base font-semibold text-foreground mt-4 mb-1">
          {line}
        </h3>
      );
      continue;
    }
    
    // Answer line
    const answerMatch = line.match(/^Answer:?\s*(.*)$/i);
    if (answerMatch) {
      parts.push(
        <div key={key++} className="mt-3 p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
          <span className="font-bold text-primary">Answer: </span>
          <span className="font-semibold">{answerMatch[1]}</span>
        </div>
      );
      continue;
    }
    
    // Handle markdown headers (fallback)
    const h3Match = line.match(/^###\s*\*?\*?(.+?)\*?\*?\s*:?\s*$/);
    if (h3Match) {
      parts.push(<h3 key={key++} className="text-lg font-bold text-primary mt-4 mb-2">{h3Match[1].replace(/\*\*/g, '')}</h3>);
      continue;
    }
    
    // Handle --- dividers
    if (line.trim() === '---') {
      parts.push(<hr key={key++} className="my-4 border-border" />);
      continue;
    }
    
    // Check for block math \[...\]
    const blockMatch = line.match(/^\s*\\\[([\s\S]*?)\\\]\s*$/);
    if (blockMatch) {
      parts.push(
        <div key={key++} className="my-2 text-center overflow-x-auto">
          <SafeBlockMath math={blockMatch[1].trim()} />
        </div>
      );
      continue;
    }
    
    // Process inline content: math and bold
    const lineElements: JSX.Element[] = [];
    let lastIdx = 0;
    
    // Regex for math \(...\), $...$, and bold **...**
    const mixedRegex = /\\\(([^)]+?)\\\)|\$([^$\n]+?)\$|\*\*([^*]+?)\*\*/g;
    let match;
    
    while ((match = mixedRegex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        lineElements.push(<span key={key++}>{line.slice(lastIdx, match.index)}</span>);
      }
      
      if (match[1] || match[2]) {
        const mathContent = match[1] || match[2];
        lineElements.push(<SafeInlineMath key={key++} math={mathContent.trim()} />);
      } else if (match[3]) {
        lineElements.push(<strong key={key++} className="font-semibold">{match[3]}</strong>);
      }
      lastIdx = mixedRegex.lastIndex;
    }
    
    if (lastIdx < line.length) {
      lineElements.push(<span key={key++}>{line.slice(lastIdx)}</span>);
    }
    
    if (lineElements.length > 0) {
      parts.push(<div key={key++} className="leading-relaxed">{lineElements}</div>);
    } else {
      parts.push(<div key={key++} className="leading-relaxed">{line}</div>);
    }
  }

  return parts.length > 0 ? parts : [<span key={0}>{text}</span>];
}

export function SolutionStep({ step, index }: { step: StepObject; index: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center text-muted-foreground font-medium text-sm">
          {index + 1}
        </div>
        <h4 className="font-semibold text-foreground pt-0.5">{renderMathText(step.title)}</h4>
      </div>
      
      {step.math && (
        <div className="ml-9 py-3 text-center overflow-x-auto">
          <SafeBlockMath math={step.math} />
        </div>
      )}
      
      {step.reasoning && (
        <p className="ml-9 text-muted-foreground leading-relaxed">
          {renderMathText(step.reasoning)}
        </p>
      )}
    </div>
  );
}

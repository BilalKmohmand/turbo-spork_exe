import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import type { StepObject } from "@shared/schema";

interface MathDisplayProps {
  children: string;
  block?: boolean;
}

export function MathDisplay({ children, block = false }: MathDisplayProps) {
  if (block) {
    return (
      <div className="my-4 overflow-x-auto">
        <BlockMath math={children} />
      </div>
    );
  }
  return <InlineMath math={children} />;
}

export function renderMathText(text: string): JSX.Element[] {
  if (!text) return [<span key={0}></span>];
  
  const parts: JSX.Element[] = [];
  let key = 0;
  
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) {
      parts.push(<div key={key++} className="h-2" />);
      continue;
    }
    
    // Handle markdown headers
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
      try {
        parts.push(
          <div key={key++} className="my-2 text-center overflow-x-auto">
            <BlockMath math={blockMatch[1].trim()} />
          </div>
        );
      } catch {
        parts.push(<code key={key++}>{blockMatch[1]}</code>);
      }
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
        // Math content
        const mathContent = match[1] || match[2];
        try {
          lineElements.push(<InlineMath key={key++} math={mathContent.trim()} />);
        } catch {
          lineElements.push(<code key={key++}>{mathContent}</code>);
        }
      } else if (match[3]) {
        // Bold content
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
          <BlockMath math={step.math} />
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

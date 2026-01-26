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
  
  // Normalize all LaTeX delimiters to $ format
  let normalizedText = text
    // Remove broken patterns like "1$" at line start
    .replace(/^\d+\$/gm, '')
    // Convert \[...\] to $$...$$ (block math)
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    // Convert \(...\) to $...$ (inline math)
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    // Fix double dollars that got too many
    .replace(/\${3,}/g, '$$');
  
  const parts: JSX.Element[] = [];
  // Match $$...$$ (block) or $...$ (inline)
  const regex = /\$\$([\s\S]*?)\$\$|\$([^$]+?)\$/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(normalizedText)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = normalizedText.slice(lastIndex, match.index);
      const lines = textBefore.split('\n');
      lines.forEach((line, i) => {
        if (line.trim()) parts.push(<span key={key++}>{line}</span>);
        if (i < lines.length - 1) parts.push(<br key={key++} />);
      });
    }

    const mathContent = match[1] || match[2];
    if (mathContent && mathContent.trim()) {
      try {
        if (match[1]) {
          // Block math
          parts.push(
            <span key={key++} className="block my-2 text-center overflow-x-auto">
              <BlockMath math={mathContent.trim()} />
            </span>
          );
        } else {
          // Inline math
          parts.push(<InlineMath key={key++} math={mathContent.trim()} />);
        }
      } catch {
        // If KaTeX fails, show as code
        parts.push(<code key={key++} className="bg-muted px-1 rounded">{mathContent}</code>);
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < normalizedText.length) {
    const remaining = normalizedText.slice(lastIndex);
    const lines = remaining.split('\n');
    lines.forEach((line, i) => {
      if (line.trim()) parts.push(<span key={key++}>{line}</span>);
      if (i < lines.length - 1) parts.push(<br key={key++} />);
    });
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

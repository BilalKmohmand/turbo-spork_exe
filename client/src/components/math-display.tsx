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
  
  // First, normalize all LaTeX delimiters to $ format
  let normalizedText = text
    // Convert \[...\] to $$...$$
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$')
    // Convert \(...\) to $...$
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
    // Convert display math environments
    .replace(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g, '$$$$1$$')
    .replace(/\\begin\{align\}([\s\S]*?)\\end\{align\}/g, '$$$$1$$');
  
  const parts: JSX.Element[] = [];
  // Match $$...$$ (block) or $...$ (inline), handling multiline
  const regex = /\$\$([\s\S]*?)\$\$|\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(normalizedText)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = normalizedText.slice(lastIndex, match.index);
      // Split by newlines and render as separate spans
      const lines = textBefore.split('\n');
      lines.forEach((line, i) => {
        if (line) parts.push(<span key={key++}>{line}</span>);
        if (i < lines.length - 1) parts.push(<br key={key++} />);
      });
    }

    const mathContent = match[1] || match[2];
    if (mathContent) {
      try {
        if (match[1]) {
          // Block math
          parts.push(
            <span key={key++} className="block my-3 text-center overflow-x-auto">
              <BlockMath math={mathContent.trim()} />
            </span>
          );
        } else {
          // Inline math
          parts.push(<InlineMath key={key++} math={mathContent.trim()} />);
        }
      } catch (e) {
        // If KaTeX fails, show the raw text
        parts.push(<code key={key++} className="text-red-500">{mathContent}</code>);
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < normalizedText.length) {
    const remaining = normalizedText.slice(lastIndex);
    const lines = remaining.split('\n');
    lines.forEach((line, i) => {
      if (line) parts.push(<span key={key++}>{line}</span>);
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

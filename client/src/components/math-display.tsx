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
  const parts: JSX.Element[] = [];
  const regex = /\$\$(.*?)\$\$|\$(.*?)\$/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }

    if (match[1]) {
      parts.push(
        <span key={key++} className="block my-3 text-center overflow-x-auto">
          <BlockMath math={match[1]} />
        </span>
      );
    } else if (match[2]) {
      parts.push(<InlineMath key={key++} math={match[2]} />);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
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

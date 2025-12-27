import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

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

export function SolutionStep({ step, index }: { step: string; index: number }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary font-bold text-sm">
        {index + 1}
      </div>
      <div className="flex-1 pt-1">
        <div className="text-base leading-relaxed">{renderMathText(step)}</div>
      </div>
    </div>
  );
}

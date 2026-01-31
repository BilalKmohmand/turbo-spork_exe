import "katex/dist/katex.min.css";
import katex from "katex";
import type { StepObject } from "@shared/schema";

interface MathDisplayProps {
  children: string;
  block?: boolean;
}

function renderKatex(math: string, displayMode: boolean): string {
  try {
    return katex.renderToString(math, {
      displayMode,
      throwOnError: false,
      errorColor: "#cc0000",
      strict: false,
      trust: true,
      macros: {
        "\\f": "#1f(#2)"
      }
    });
  } catch (e) {
    return `<code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">${math}</code>`;
  }
}

export function MathDisplay({ children, block = false }: MathDisplayProps) {
  const html = renderKatex(children, block);
  
  if (block) {
    return (
      <div 
        className="my-4 overflow-x-auto text-center"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  
  return (
    <span dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export function renderMathText(text: string): JSX.Element {
  if (!text) return <span></span>;
  
  const processedHtml = processTextWithMath(text);
  
  return (
    <div 
      className="math-content leading-relaxed"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}

function processTextWithMath(text: string): string {
  let result = text;
  
  result = result.replace(/\n/g, "<br/>");
  
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    return `<div class="my-3 text-center overflow-x-auto">${renderKatex(math.trim(), true)}</div>`;
  });
  
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    return renderKatex(math.trim(), false);
  });
  
  result = result.replace(/\$\$([^$]+?)\$\$/g, (_, math) => {
    return `<div class="my-3 text-center overflow-x-auto">${renderKatex(math.trim(), true)}</div>`;
  });
  
  result = result.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    return renderKatex(math.trim(), false);
  });
  
  result = result.replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  
  result = result.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
  result = result.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>');
  result = result.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>');
  
  result = result.replace(/^---$/gm, '<hr class="my-4 border-border"/>');
  
  result = result.replace(/^(Answer:?\s*)(.*)$/gim, 
    '<div class="mt-3 p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg border-l-4 border-violet-600"><span class="font-bold text-violet-600">Answer: </span><span class="font-semibold">$2</span></div>'
  );
  
  result = result.replace(/^(Step \d+[:.])(.*)$/gim, 
    '<div class="mt-3"><span class="font-semibold text-violet-600">$1</span>$2</div>'
  );
  
  return result;
}

export function SolutionStep({ step, index }: { step: StepObject; index: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 font-medium text-sm">
          {index + 1}
        </div>
        <h4 className="font-semibold text-foreground pt-0.5">{renderMathText(step.title)}</h4>
      </div>
      
      {step.math && (
        <div className="ml-9 py-3 text-center overflow-x-auto">
          <MathDisplay block>{step.math}</MathDisplay>
        </div>
      )}
      
      {step.reasoning && (
        <div className="ml-9 text-muted-foreground leading-relaxed">
          {renderMathText(step.reasoning)}
        </div>
      )}
    </div>
  );
}

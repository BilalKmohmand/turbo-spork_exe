import "katex/dist/katex.min.css";
import katex from "katex";
import type { StepObject } from "@shared/schema";

interface MathDisplayProps {
  children: string;
  block?: boolean;
}

function renderKatex(math: string, displayMode: boolean): string {
  try {
    const cleanMath = math.replace(/<br\s*\/?>/gi, " ").trim();
    return katex.renderToString(cleanMath, {
      displayMode,
      throwOnError: false,
      errorColor: "#cc0000",
      strict: false,
      trust: true,
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function processTextWithMath(text: string): string {
  const mathPlaceholders: string[] = [];
  let placeholderIndex = 0;
  
  let result = text;
  
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    const rendered = `<div class="my-3 text-center overflow-x-auto">${renderKatex(math.trim(), true)}</div>`;
    const placeholder = `@@MATH_BLOCK_${placeholderIndex++}@@`;
    mathPlaceholders.push(rendered);
    return placeholder;
  });
  
  result = result.replace(/\$\$([^$]+?)\$\$/g, (_, math) => {
    const rendered = `<div class="my-3 text-center overflow-x-auto">${renderKatex(math.trim(), true)}</div>`;
    const placeholder = `@@MATH_BLOCK_${placeholderIndex++}@@`;
    mathPlaceholders.push(rendered);
    return placeholder;
  });
  
  result = result.replace(/\\\(([^)]+?)\\\)/g, (_, math) => {
    const rendered = renderKatex(math.trim(), false);
    const placeholder = `@@MATH_INLINE_${placeholderIndex++}@@`;
    mathPlaceholders.push(rendered);
    return placeholder;
  });
  
  result = result.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    const rendered = renderKatex(math.trim(), false);
    const placeholder = `@@MATH_INLINE_${placeholderIndex++}@@`;
    mathPlaceholders.push(rendered);
    return placeholder;
  });
  
  result = result.replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  result = result.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
  result = result.replace(/`([^`\n]+?)`/g, '<code style="padding:1px 4px;background:rgba(255,255,255,0.1);border-radius:4px;font-size:0.85em;font-family:monospace">$1</code>');

  result = result.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-2">$1</h3>');
  result = result.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2">$1</h2>');
  result = result.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-5 mb-3">$1</h1>');

  result = result.replace(/^---$/gm, '<hr class="my-4 border-border"/>');

  result = result.replace(/^(→|->|▸)\s+(.+)$/gm,
    '<div style="display:flex;gap:8px;margin:3px 0"><span style="opacity:0.5;flex-shrink:0;margin-top:1px">→</span><span>$2</span></div>');

  result = result.replace(/^[-•]\s+(.+)$/gm,
    '<div style="display:flex;gap:8px;margin:3px 0"><span style="opacity:0.4;flex-shrink:0">•</span><span>$1</span></div>');

  result = result.replace(/^\d+\.\s+(.+)$/gm, (match, content, offset, str) => {
    const before = str.slice(0, offset);
    const num = (before.match(/^\d+\./gm) || []).length + 1;
    return `<div style="display:flex;gap:8px;margin:3px 0"><span style="opacity:0.5;flex-shrink:0;min-width:16px;text-align:right">${num}.</span><span>${content}</span></div>`;
  });

  result = result.replace(/\n\n+/g, '</p><p class="mt-3">');
  result = result.replace(/\n/g, '<br/>');
  result = `<p>${result}</p>`;
  
  for (let i = 0; i < mathPlaceholders.length; i++) {
    result = result.replace(new RegExp(`@@MATH_BLOCK_${i}@@`, 'g'), mathPlaceholders[i] || '');
    result = result.replace(new RegExp(`@@MATH_INLINE_${i}@@`, 'g'), mathPlaceholders[i] || '');
  }
  
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

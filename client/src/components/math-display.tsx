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
    return `<code style="padding:1px 4px;background:rgba(128,128,128,0.15);border-radius:4px;font-size:0.85em;font-family:monospace">${math}</code>`;
  }
}

export function MathDisplay({ children, block = false }: MathDisplayProps) {
  const html = renderKatex(children, block);
  if (block) {
    return <div className="my-4 overflow-x-auto text-center" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function renderMathText(text: string): JSX.Element {
  if (!text) return <span></span>;
  return (
    <div
      className="math-content leading-relaxed"
      dangerouslySetInnerHTML={{ __html: processTextWithMath(text) }}
    />
  );
}

/* ── Inline formatting ─────────────────────────────────────────── */
function applyInline(text: string): string {
  let r = text;
  r = r.replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  r = r.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
  r = r.replace(/`([^`\n]+?)`/g,
    '<code style="padding:1px 5px;background:rgba(128,128,128,0.15);border-radius:4px;font-size:0.85em;font-family:monospace">$1</code>');
  r = r.replace(/(https?:\/\/[^\s<>")\]]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#3b82f6;text-decoration:underline;word-break:break-all">$1</a>');
  return r;
}

/* ── Block renderer ────────────────────────────────────────────── */
function renderLine(line: string): { html: string; isBlock: boolean } {
  const l = line.trim();
  if (!l) return { html: "", isBlock: false };

  // Headings
  const hMatch = l.match(/^(#{1,3})\s+(.+)$/);
  if (hMatch) {
    const lvl = hMatch[1].length;
    const content = applyInline(hMatch[2]);
    const cls =
      lvl === 1 ? 'font-bold mt-5 mb-2' :
      lvl === 2 ? 'font-bold mt-5 mb-2' :
                  'font-semibold mt-4 mb-1.5';
    const size = lvl === 1 ? 'font-size:1.2em' : lvl === 2 ? 'font-size:1.1em' : 'font-size:1em';
    return { html: `<div class="${cls}" style="${size};display:block">${content}</div>`, isBlock: true };
  }

  // HR
  if (l === '---' || l === '***' || l === '___') {
    return { html: '<hr style="margin:12px 0;opacity:0.2"/>', isBlock: true };
  }

  // Bullet list
  const bulletMatch = l.match(/^[-•*]\s+(.+)$/);
  if (bulletMatch) {
    return {
      html: `<div style="display:flex;gap:8px;margin:3px 0;padding-left:4px"><span style="opacity:0.45;flex-shrink:0;margin-top:3px">•</span><span>${applyInline(bulletMatch[1])}</span></div>`,
      isBlock: true,
    };
  }

  // Numbered list
  const numMatch = l.match(/^(\d+)\.\s+(.+)$/);
  if (numMatch) {
    return {
      html: `<div style="display:flex;gap:8px;margin:3px 0;padding-left:4px"><span style="opacity:0.5;flex-shrink:0;min-width:20px;text-align:right">${numMatch[1]}.</span><span>${applyInline(numMatch[2])}</span></div>`,
      isBlock: true,
    };
  }

  // Arrow steps
  const arrowMatch = l.match(/^(→|->|▸)\s+(.+)$/);
  if (arrowMatch) {
    return {
      html: `<div style="display:flex;gap:8px;margin:3px 0;padding-left:4px"><span style="opacity:0.5;flex-shrink:0;margin-top:3px">→</span><span>${applyInline(arrowMatch[2])}</span></div>`,
      isBlock: true,
    };
  }

  return { html: applyInline(l), isBlock: false };
}

function processTextWithMath(text: string): string {
  if (!text) return "";

  /* 1. Extract math as placeholders */
  const ph: string[] = [];
  let idx = 0;
  let s = text;

  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => {
    ph.push(`<div style="margin:12px 0;text-align:center;overflow-x:auto">${renderKatex(m.trim(), true)}</div>`);
    return `@@PH${idx++}@@`;
  });
  s = s.replace(/\$\$([^$]+?)\$\$/g, (_, m) => {
    ph.push(`<div style="margin:12px 0;text-align:center;overflow-x:auto">${renderKatex(m.trim(), true)}</div>`);
    return `@@PH${idx++}@@`;
  });
  s = s.replace(/\\\(([^)]+?)\\\)/g, (_, m) => {
    ph.push(renderKatex(m.trim(), false));
    return `@@PH${idx++}@@`;
  });
  s = s.replace(/\$([^$\n]+?)\$/g, (_, m) => {
    ph.push(renderKatex(m.trim(), false));
    return `@@PH${idx++}@@`;
  });

  /* 2. Split into paragraph-blocks and render each */
  const blocks = s.split(/\n\n+/);
  const parts: string[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split("\n");
    const rendered = lines.map(renderLine);
    const allBlock = rendered.every(r => r.isBlock || !r.html);

    if (allBlock) {
      parts.push(rendered.map(r => r.html).filter(Boolean).join("\n"));
    } else {
      const inner = rendered
        .map(r => r.html)
        .filter(Boolean)
        .join("<br/>");
      parts.push(`<p style="margin-bottom:0.75rem;line-height:1.75">${inner}</p>`);
    }
  }

  /* 3. Restore math placeholders */
  let result = parts.join("\n");
  for (let i = 0; i < ph.length; i++) {
    result = result.replace(new RegExp(`@@PH${i}@@`, "g"), ph[i]);
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

import "katex/dist/katex.min.css";
import katex from "katex";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import type { StepObject } from "@shared/schema";
import type { Components } from "react-markdown";

interface MathDisplayProps {
  children: string;
  block?: boolean;
}

export function MathDisplay({ children, block = false }: MathDisplayProps) {
  try {
    const html = katex.renderToString(children, {
      displayMode: block,
      throwOnError: false,
      errorColor: "#cc0000",
      strict: false,
      trust: true,
    });
    if (block) {
      return <div className="my-4 overflow-x-auto text-center" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <code className="px-1 py-0.5 bg-muted rounded text-sm font-mono">{children}</code>;
  }
}

const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="math-step-heading text-xl font-bold mt-6 mb-3 pb-2 border-b border-border/40 text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="math-step-heading text-lg font-bold mt-5 mb-2 pb-1.5 border-b border-border/30 text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold mt-4 mb-1.5 text-foreground">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 leading-[1.8] text-[0.95rem]">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-3 space-y-1.5 pl-5 list-disc marker:text-muted-foreground">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 space-y-1.5 pl-5 list-decimal marker:text-muted-foreground marker:font-semibold">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-[1.75] text-[0.95rem]">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block bg-muted/60 rounded-lg px-4 py-3 text-sm font-mono overflow-x-auto my-3">
          {children}
        </code>
      );
    }
    return (
      <code className="inline-block px-1.5 py-0.5 bg-muted/70 rounded text-[0.85em] font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-muted/60 rounded-lg overflow-x-auto my-3">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-violet-400 dark:border-violet-600 pl-4 my-3 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/50">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border border-border px-3 py-2 text-left font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-3 py-2 text-foreground/80">{children}</td>
  ),
  tr: ({ children }) => <tr className="even:bg-muted/20">{children}</tr>,
  hr: () => <hr className="my-4 border-border/30" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 underline underline-offset-2 break-all hover:text-blue-600"
    >
      {children}
    </a>
  ),
};

const RM = ReactMarkdown as any;

export function renderMathText(text: string): JSX.Element {
  if (!text) return <span />;
  return (
    <RM
      className="math-content leading-relaxed"
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={mdComponents}
    >
      {text}
    </RM>
  );
}

function renderInlineText(text: string): JSX.Element {
  if (!text) return <span />;
  return (
    <RM
      className="inline"
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }: any) => <span>{children}</span>,
        strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }: any) => <em className="italic">{children}</em>,
        code: ({ children }: any) => (
          <code className="inline-block px-1 py-0.5 bg-muted/70 rounded text-[0.85em] font-mono">{children}</code>
        ),
      }}
    >
      {text}
    </RM>
  );
}

export function SolutionStep({ step, index }: { step: StepObject; index: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 font-medium text-sm">
          {index + 1}
        </div>
        <span className="font-semibold text-foreground pt-0.5 leading-snug">{renderInlineText(step.title)}</span>
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

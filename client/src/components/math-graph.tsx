import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { evaluate, parse } from "mathjs";

interface MathGraphProps {
  expression: string;
  xMin?: number;
  xMax?: number;
  title?: string;
  color?: string;
}

export function MathGraph({
  expression,
  xMin = -10,
  xMax = 10,
  title,
  color = "#8b5cf6",
}: MathGraphProps) {
  const data = useMemo(() => {
    const points: { x: number; y: number | null }[] = [];
    const steps = 200;
    const step = (xMax - xMin) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      try {
        const y = evaluate(expression, { x });
        if (typeof y === "number" && isFinite(y) && !isNaN(y)) {
          points.push({ x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 });
        } else {
          points.push({ x: Math.round(x * 1000) / 1000, y: null });
        }
      } catch {
        points.push({ x: Math.round(x * 1000) / 1000, y: null });
      }
    }
    return points;
  }, [expression, xMin, xMax]);

  const yValues = data.map((d) => d.y).filter((y): y is number => y !== null);
  const yMin = Math.min(...yValues, -1);
  const yMax = Math.max(...yValues, 1);
  const yPadding = (yMax - yMin) * 0.1;

  return (
    <div className="w-full bg-card border rounded-lg p-4 my-4">
      {title && (
        <h4 className="text-sm font-medium text-center mb-2 text-foreground">{title}</h4>
      )}
      <div className="text-center text-xs text-muted-foreground mb-2">
        y = {expression}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[xMin, xMax]}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickCount={11}
          />
          <YAxis
            domain={[Math.floor(yMin - yPadding), Math.ceil(yMax + yPadding)]}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickCount={9}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelFormatter={(x) => `x = ${x}`}
            formatter={(y: number) => [`y = ${y}`, ""]}
          />
          <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
          <Line
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function parseGraphRequest(text: string): { expression: string; xMin?: number; xMax?: number } | null {
  const graphPatterns = [
    /graph\s+(?:of\s+)?(?:y\s*=\s*)?(.+?)(?:\s+from\s+(-?\d+)\s+to\s+(-?\d+))?$/i,
    /plot\s+(?:y\s*=\s*)?(.+?)(?:\s+from\s+(-?\d+)\s+to\s+(-?\d+))?$/i,
    /draw\s+(?:the\s+)?(?:graph\s+(?:of\s+)?)?(?:y\s*=\s*)?(.+?)(?:\s+from\s+(-?\d+)\s+to\s+(-?\d+))?$/i,
  ];

  for (const pattern of graphPatterns) {
    const match = text.match(pattern);
    if (match) {
      let expr = match[1].trim();
      expr = expr.replace(/\^/g, "^").replace(/×/g, "*").replace(/÷/g, "/");
      
      try {
        parse(expr);
        return {
          expression: expr,
          xMin: match[2] ? parseInt(match[2]) : undefined,
          xMax: match[3] ? parseInt(match[3]) : undefined,
        };
      } catch {
        return null;
      }
    }
  }
  return null;
}

import { useEffect, useRef } from "react";
import type { GraphSpec } from "@shared/schema";

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (element: HTMLElement, options?: object) => DesmosCalculator;
    };
  }
}

interface DesmosCalculator {
  setExpression: (expr: { id: string; latex: string; color?: string }) => void;
  setMathBounds: (bounds: { left: number; right: number; bottom: number; top: number }) => void;
  destroy: () => void;
}

interface GraphPanelProps {
  graphSpec: GraphSpec;
}

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];

export function GraphPanel({ graphSpec }: GraphPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<DesmosCalculator | null>(null);

  useEffect(() => {
    const loadDesmos = () => {
      if (!window.Desmos || !containerRef.current) return;

      if (calculatorRef.current) {
        calculatorRef.current.destroy();
      }

      const calculator = window.Desmos.GraphingCalculator(containerRef.current, {
        expressionsCollapsed: true,
        settingsMenu: false,
        zoomButtons: false,
        lockViewport: false,
        border: false,
        keypad: false,
      });

      calculatorRef.current = calculator;

      if (graphSpec.xMin !== undefined && graphSpec.xMax !== undefined && 
          graphSpec.yMin !== undefined && graphSpec.yMax !== undefined) {
        calculator.setMathBounds({
          left: graphSpec.xMin,
          right: graphSpec.xMax,
          bottom: graphSpec.yMin,
          top: graphSpec.yMax,
        });
      }

      graphSpec.expressions.forEach((expr, index) => {
        calculator.setExpression({
          id: `expr-${index}`,
          latex: expr,
          color: COLORS[index % COLORS.length],
        });
      });
    };

    if (window.Desmos) {
      loadDesmos();
    } else {
      const script = document.createElement("script");
      const desmosApiKey = import.meta.env.VITE_DESMOS_API_KEY ?? "dcb31709b452b1cf9dc26972add0fda6";
      script.src = `https://www.desmos.com/api/v1.9/calculator.js?apiKey=${desmosApiKey}`;
      script.async = true;
      script.onload = loadDesmos;
      document.head.appendChild(script);
    }

    return () => {
      if (calculatorRef.current) {
        calculatorRef.current.destroy();
        calculatorRef.current = null;
      }
    };
  }, [graphSpec]);

  return (
    <div className="w-full">
      {graphSpec.title && (
        <h4 className="text-sm font-medium text-muted-foreground mb-2">{graphSpec.title}</h4>
      )}
      <div 
        ref={containerRef} 
        className="w-full h-[300px] rounded-xl overflow-hidden border bg-white"
        data-testid="graph-panel"
      />
    </div>
  );
}

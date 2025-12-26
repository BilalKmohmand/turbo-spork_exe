import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import Home from "@/pages/home";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="eduai-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="flex flex-col h-screen w-full">
            <header className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
              <h1 className="font-semibold text-lg">AI Evaluator</h1>
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-hidden">
              <Home />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

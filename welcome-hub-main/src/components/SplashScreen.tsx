import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<"logo" | "text" | "fadeOut">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 600);
    const t2 = setTimeout(() => setPhase("fadeOut"), 2200);
    const t3 = setTimeout(onComplete, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background bg-grid-pattern transition-opacity duration-500 ${
        phase === "fadeOut" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Glow effect */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/10 blur-[120px]" />

      <div
        className={`relative z-10 flex flex-col items-center gap-6 transition-all duration-700 ${
          phase === "logo" ? "opacity-0 scale-90" : "opacity-100 scale-100"
        }`}
      >
        <img
          src={logo}
          alt="TheHighGrader"
          width={120}
          height={120}
          className={`transition-all duration-700 ${
            phase === "logo" ? "opacity-100 scale-100" : ""
          }`}
          style={{ opacity: 1 }}
        />
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-foreground">TheHigh</span>
            <span className="text-gradient-purple">Grader</span>
            <span className="text-foreground">™</span>
          </h1>
          <p className="text-muted-foreground text-lg">The smarter way to learn anything.</p>
        </div>
      </div>

      {/* Loading bar */}
      <div className="absolute bottom-20 w-48 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all ease-linear"
          style={{
            width: phase === "logo" ? "0%" : phase === "text" ? "70%" : "100%",
            transitionDuration: phase === "text" ? "1600ms" : "500ms",
          }}
        />
      </div>
    </div>
  );
};

export default SplashScreen;

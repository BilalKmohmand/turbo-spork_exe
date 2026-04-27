import { GraduationCap, BookOpen } from "lucide-react";

interface RoleSelectionProps {
  onSelect: (role: "student" | "teacher") => void;
}

const RoleSelection = ({ onSelect }: RoleSelectionProps) => {
  return (
    <div className="flex flex-col items-center gap-10 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Welcome to <span className="text-gradient-purple">TheHighGrader™</span></h2>
        <p className="text-muted-foreground text-lg">How would you like to get started?</p>
      </div>

      <div className="flex gap-6">
        <button
          onClick={() => onSelect("student")}
          className="group relative w-56 h-64 rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:border-primary hover:shadow-[var(--glow-purple)] hover:scale-105"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground">Student</h3>
            <p className="text-sm text-muted-foreground mt-1">Learn, practice & ace your exams</p>
          </div>
        </button>

        <button
          onClick={() => onSelect("teacher")}
          className="group relative w-56 h-64 rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:border-primary hover:shadow-[var(--glow-purple)] hover:scale-105"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground">Teacher</h3>
            <p className="text-sm text-muted-foreground mt-1">Create courses & evaluate students</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;

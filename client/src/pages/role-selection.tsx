import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users } from "lucide-react";
import type { UserRole } from "@shared/schema";

interface RoleSelectionProps {
  onSelectRole: (role: UserRole) => void;
}

export default function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-welcome-title">
            AI Education Platform
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-welcome-description">
            An intelligent solution for assignments and evaluations. Students submit work and receive AI-powered feedback, while teachers can review and grade submissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card 
            className="hover-elevate cursor-pointer transition-all duration-200"
            onClick={() => onSelectRole("student")}
            data-testid="card-role-student"
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Student Portal</CardTitle>
              <CardDescription className="text-base">
                Submit assignments and receive instant AI feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Upload assignments for AI evaluation
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  View detailed AI-generated feedback
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Track submission history and grades
                </li>
              </ul>
              <Button className="w-full" data-testid="button-enter-student">
                Enter as Student
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="hover-elevate cursor-pointer transition-all duration-200"
            onClick={() => onSelectRole("teacher")}
            data-testid="card-role-teacher"
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-chart-2/10 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-chart-2" />
              </div>
              <CardTitle className="text-2xl">Teacher Portal</CardTitle>
              <CardDescription className="text-base">
                Review AI evaluations and provide manual grades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-chart-2" />
                  View pending student submissions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-chart-2" />
                  Review AI-generated evaluations
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-chart-2" />
                  Override scores and add feedback
                </li>
              </ul>
              <Button className="w-full" variant="secondary" data-testid="button-enter-teacher">
                Enter as Teacher
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          This is a demo application showcasing AI-powered education solutions
        </p>
      </div>
    </div>
  );
}

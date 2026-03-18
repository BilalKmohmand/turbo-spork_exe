import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileDropzone } from "@/components/file-dropzone";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Send, Sparkles } from "lucide-react";
import type { Submission } from "@shared/schema";

interface Assignment {
  id: string;
  title: string;
  subject: string;
}

const submitFormSchema = z.object({
  assignmentId: z.string().min(1, "Please select an assignment"),
  studentName: z.string().min(1, "Student name is required"),
  content: z.string().min(10, "Assignment content must be at least 10 characters"),
});

type SubmitFormValues = z.infer<typeof submitFormSchema>;

export default function SubmitAssignment() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  const form = useForm<SubmitFormValues>({
    resolver: zodResolver(submitFormSchema),
    defaultValues: {
      assignmentId: "",
      studentName: "",
      content: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmitFormValues) => {
      const response = await apiRequest("POST", "/api/submissions", data);
      return response.json() as Promise<Submission>;
    },
    onSuccess: (submission) => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/stats"] });
      toast({
        title: "Assignment Submitted",
        description: "Your assignment is being evaluated by AI...",
      });
      navigate(`/student/submissions/${submission.id}`);
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your assignment. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: SubmitFormValues) => {
    setIsSubmitting(true);
    submitMutation.mutate(data);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Submit Assignment</h1>
        <p className="text-muted-foreground">Upload your work and get instant AI feedback</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI-Powered Evaluation
          </CardTitle>
          <CardDescription>
            Your submission will be analyzed by our AI system for accuracy, completeness, and creativity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your name" 
                        {...field} 
                        data-testid="input-student-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignment</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-assignment">
                          <SelectValue placeholder="Select an assignment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assignments?.map((assignment) => (
                          <SelectItem key={assignment.id} value={assignment.id}>
                            {assignment.title} - {assignment.subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Work</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <FileDropzone 
                          content={field.value} 
                          onContentChange={field.onChange} 
                        />
                        <div className="relative">
                          <Textarea
                            placeholder="Or paste/type your assignment content here..."
                            className="min-h-32 resize-none"
                            {...field}
                            data-testid="textarea-content"
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                  data-testid="button-submit-assignment"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit for AI Evaluation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

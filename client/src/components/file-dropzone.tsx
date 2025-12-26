import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileDropzoneProps {
  onContentChange: (content: string) => void;
  content: string;
}

export function FileDropzone({ onContentChange, content }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      readFile(file);
    }
  }, []);

  const readFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onContentChange(text);
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const clearContent = () => {
    onContentChange("");
    setFileName(null);
  };

  if (content) {
    return (
      <div className="border-2 border-dashed border-border rounded-lg p-6" data-testid="dropzone-with-content">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-medium truncate">{fileName || "Pasted content"}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearContent}
                data-testid="button-clear-content"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{content.substring(0, 200)}...</p>
            <p className="text-xs text-muted-foreground mt-2">{content.length} characters</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragOver ? "border-primary bg-primary/5" : "border-border"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="dropzone-empty"
    >
      <input
        type="file"
        accept=".txt,.md,.js,.ts,.py,.java,.cpp,.c,.html,.css"
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
        data-testid="input-file-upload"
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <Upload className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <div>
          <p className="font-medium mb-1">Drop your assignment file here</p>
          <p className="text-sm text-muted-foreground">
            or{" "}
            <label
              htmlFor="file-upload"
              className="text-primary cursor-pointer hover:underline"
            >
              browse files
            </label>
          </p>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Supports .txt, .md, .js, .ts, .py, .java, .cpp, .c, .html, .css
        </p>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { csvApi } from "@/lib/api";

interface CsvUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CsvUploadModal({ open, onOpenChange }: CsvUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      const response = await csvApi.upload(file);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-sources'] });
      toast({
        title: "CSV uploaded successfully",
        description: "Your CSV data is now available for queries.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload CSV file.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return false;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "File too large",
        description: "Please select a file smaller than 50MB.",
        variant: "destructive",
      });
      return false;
    }
    
    setSelectedFile(file);
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsSubmitting(true);
    try {
      await uploadCsvMutation.mutateAsync(selectedFile);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload CSV File
          </DialogTitle>
          <p className="text-sm text-slate-600 mt-2">
            Upload a CSV file to create a new data source for querying and analysis.
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="csvFile">CSV File</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                  isDragOver 
                    ? "border-blue-400 bg-blue-50" 
                    : selectedFile
                    ? "border-green-400 bg-green-50"
                    : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <Upload className="h-10 w-10 text-slate-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">
                    {selectedFile ? selectedFile.name : "Click to upload CSV file"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedFile 
                      ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` 
                      : "Drag and drop or click to browse (Max 50MB)"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">CSV Requirements:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• First row must contain column headers</li>
              <li>• Use comma separation for values</li>
              <li>• Data will be automatically processed</li>
              <li>• Ready for immediate querying after upload</li>
              <li>• Maximum file size: 50MB</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={isSubmitting || !selectedFile}
            >
              {isSubmitting ? "Uploading..." : "Upload & Process"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
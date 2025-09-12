import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post } from "@/lib/api";
import { Database } from "lucide-react";
import type { InsertDataSource } from "@/types/shared";

interface DatabaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DatabaseModal({ open, onOpenChange }: DatabaseModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    connectionString: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createDataSourceMutation = useMutation({
    mutationFn: async (data: InsertDataSource) => {
      return post('/data-sources', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-sources'] });
      toast({
        title: "Database connected",
        description: "Your database has been connected successfully.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to the database.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      connectionString: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || !formData.connectionString) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createDataSourceMutation.mutateAsync(formData as InsertDataSource);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConnectionStringPlaceholder = (type: string) => {
    switch (type) {
      case 'mysql':
        return 'mysql://username:password@host:port/database';
      case 'postgresql':
        return 'postgresql://username:password@host:port/database';
      case 'sqlite':
        return '/path/to/database.db';
      default:
        return 'Enter connection string...';
    }
  };

  const getConnectionStringHelp = (type: string) => {
    switch (type) {
      case 'mysql':
        return 'Example: mysql://user:pass@localhost:3306/mydb';
      case 'postgresql':
        return 'Example: postgresql://user:pass@localhost:5432/mydb';
      case 'sqlite':
        return 'Example: ./data/database.db or /absolute/path/to/db.sqlite';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Connect Database
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Database Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select database type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Production Database"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="connectionString">Connection String</Label>
            <Input
              id="connectionString"
              type="text"
              placeholder={getConnectionStringPlaceholder(formData.type)}
              value={formData.connectionString}
              onChange={(e) => setFormData({ ...formData, connectionString: e.target.value })}
              required
            />
            {formData.type && (
              <p className="text-xs text-slate-500 mt-1">
                {getConnectionStringHelp(formData.type)}
              </p>
            )}
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
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Connecting..." : "Connect Database"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
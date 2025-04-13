
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProject, updateProject } from "@/services/projectService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Project } from "@/services/types";

export interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  project?: Project;
  onProjectCreated?: () => void;
  onProjectUpdated?: () => void;
}

export const ProjectFormModal = ({
  open,
  onClose,
  project,
  onProjectCreated,
  onProjectUpdated
}: ProjectFormModalProps) => {
  // Initialize state for form fields
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    location: string;
    status: "complete" | "inprogress" | "delayed";
    start_date: string;
    end_date: string;
    progress: number;
  }>({
    name: "",
    description: "",
    location: "",
    status: "inprogress",
    start_date: "",
    end_date: "",
    progress: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // When project data changes, update the form
  useEffect(() => {
    if (project) {
      const startDate = project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : "";
      const endDate = project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : "";
      
      setFormData({
        name: project.name || "",
        description: project.description || "",
        location: project.location || "",
        status: project.status || "inprogress",
        start_date: startDate,
        end_date: endDate,
        progress: project.progress || 0
      });
    } else {
      // Reset form for new project
      setFormData({
        name: "",
        description: "",
        location: "",
        status: "inprogress",
        start_date: "",
        end_date: "",
        progress: 0
      });
    }
  }, [project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (project) {
        // Update existing project
        await updateProject(project.id, formData);
        toast({
          title: "Project Updated",
          description: "The project has been updated successfully",
        });
        if (onProjectUpdated) onProjectUpdated();
      } else {
        // Create new project
        await createProject(formData);
        toast({
          title: "Project Created",
          description: "The project has been created successfully",
        });
        if (onProjectCreated) onProjectCreated();
      }
      onClose();
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: `Failed to ${project ? "update" : "create"} project: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create New Project"}</DialogTitle>
          <DialogDescription>
            {project
              ? "Update the details for this project"
              : "Enter the details for the new project"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Project Name
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter project name"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1">
              Location
            </label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter project location"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">
              Status
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inprogress">In Progress</SelectItem>
                <SelectItem value="complete">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium mb-1">
                End Date
              </label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="progress" className="block text-sm font-medium mb-1">
              Progress
            </label>
            <Input
              id="progress"
              name="progress"
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={handleChange}
              placeholder="Enter progress (0-100)"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {project ? "Updating..." : "Creating..."}
                </>
              ) : (
                project ? "Update Project" : "Create Project"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};


import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSubsystem, updateSubsystem } from "@/services/subsystemService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export interface SubsystemFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  systems: any[];
  selectedProjectId?: string | null;
  subsystem?: any;
}

export const SubsystemFormModal = ({
  open,
  onClose,
  onSuccess,
  systems,
  selectedProjectId,
  subsystem
}: SubsystemFormModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    system_id: "",
    completion_rate: 0,
    start_date: "",
    end_date: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set initial form data based on subsystem (if editing)
    if (subsystem) {
      const startDate = subsystem.start_date
        ? new Date(subsystem.start_date).toISOString().split("T")[0]
        : "";
      const endDate = subsystem.end_date
        ? new Date(subsystem.end_date).toISOString().split("T")[0]
        : "";

      setFormData({
        name: subsystem.name || "",
        system_id: subsystem.system_id || "",
        completion_rate: subsystem.completion_rate || 0,
        start_date: startDate,
        end_date: endDate,
      });
    } else {
      // Reset form for new subsystem
      setFormData({
        name: "",
        system_id: "",
        completion_rate: 0,
        start_date: "",
        end_date: "",
      });

      // If there's only one system for the selected project, preselect it
      if (systems.length === 1 && selectedProjectId) {
        setFormData(prev => ({ ...prev, system_id: systems[0].id }));
      }
    }
  }, [subsystem, systems, selectedProjectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.system_id) {
      toast({
        title: "Validation Error",
        description: "Please select a system",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      if (subsystem) {
        // Update existing subsystem
        await updateSubsystem(subsystem.id, formData);
        toast({
          title: "Success",
          description: "Subsystem updated successfully",
        });
      } else {
        // Create new subsystem
        await createSubsystem(formData);
        toast({
          title: "Success",
          description: "Subsystem created successfully",
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving subsystem:", error);
      toast({
        title: "Error",
        description: `Failed to ${
          subsystem ? "update" : "create"
        } subsystem: ${error.message}`,
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
          <DialogTitle>
            {subsystem ? "Edit Subsystem" : "Create New Subsystem"}
          </DialogTitle>
          <DialogDescription>
            {subsystem
              ? "Update the details for this subsystem"
              : "Enter the details for the new subsystem"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Subsystem Name
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter subsystem name"
            />
          </div>

          <div>
            <label htmlFor="system_id" className="block text-sm font-medium mb-1">
              System
            </label>
            <Select
              value={formData.system_id}
              onValueChange={(value) => handleSelectChange("system_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a system" />
              </SelectTrigger>
              <SelectContent>
                {systems.map((system) => (
                  <SelectItem key={system.id} value={system.id}>
                    {system.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="completion_rate"
              className="block text-sm font-medium mb-1"
            >
              Completion Rate (%)
            </label>
            <Input
              id="completion_rate"
              name="completion_rate"
              type="number"
              min="0"
              max="100"
              value={formData.completion_rate}
              onChange={handleChange}
              placeholder="Enter completion rate"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="start_date"
                className="block text-sm font-medium mb-1"
              >
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
              <label
                htmlFor="end_date"
                className="block text-sm font-medium mb-1"
              >
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
                  {subsystem ? "Updating..." : "Creating..."}
                </>
              ) : (
                subsystem ? "Update Subsystem" : "Create Subsystem"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

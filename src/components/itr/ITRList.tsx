
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Search, Plus, ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { deleteITR } from "@/services/itrService";
import { useToast } from "@/hooks/use-toast";
import { ITRFormModal } from "@/components/modals/ITRFormModal";
import { ITRWithActions, ITRWithDetails, Subsystem, System } from "@/services/types";

interface ITRListProps {
  itrs: ITRWithActions[] | ITRWithDetails[];
  loading: boolean;
  systems?: System[];
  subsystems?: Subsystem[];
  onOpenModal?: () => void;
  onRefresh: () => void;
  selectedProjectId?: string | null;
  filterBySubsystem?: boolean;
}

export const ITRList = ({
  itrs,
  loading,
  systems,
  subsystems,
  onOpenModal,
  onRefresh,
  selectedProjectId,
  filterBySubsystem = false,
}: ITRListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedITR, setSelectedITR] = useState<ITRWithActions | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  // Convert ITRWithDetails to ITRWithActions
  const convertToITRWithActions = (itr: ITRWithDetails): ITRWithActions => {
    return {
      id: itr.id,
      name: itr.name,
      subsystem_id: itr.subsystem_id,
      status: itr.status || "inprogress",
      progress: itr.progress,
      assigned_to: "",
      start_date: "",
      end_date: "",
      created_at: itr.created_at,
      updated_at: itr.updated_at,
      quantity: itr.quantity,
      subsystemName: itr.subsystemName,
      systemName: itr.systemName,
      projectName: itr.projectName,
      actions: {
        canEdit: true,
        canDelete: true,
      }
    };
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteITR(id);
      toast({
        title: "Success",
        description: "ITR deleted successfully",
      });
      onRefresh();
    } catch (error) {
      console.error("Error deleting ITR:", error);
      toast({
        title: "Error",
        description: "Failed to delete ITR",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (itr: ITRWithActions | ITRWithDetails) => {
    if ('actions' in itr) {
      setSelectedITR(itr);
    } else {
      setSelectedITR(convertToITRWithActions(itr));
    }
    setIsEditModalOpen(true);
  };

  // Filter ITRs based on search term
  const filteredITRs = itrs.filter((itr) => {
    const searchLower = searchTerm.toLowerCase();
    const name = 'name' in itr ? itr.name?.toLowerCase() : '';
    const subsystemName = itr.subsystemName?.toLowerCase() || '';
    const systemName = itr.systemName?.toLowerCase() || '';
    const projectName = itr.projectName?.toLowerCase() || '';
    const status = 'status' in itr ? itr.status?.toLowerCase() : '';
    const assignedTo = 'assigned_to' in itr ? itr.assigned_to?.toLowerCase() : '';

    return (
      name?.includes(searchLower) ||
      subsystemName?.includes(searchLower) ||
      systemName?.includes(searchLower) ||
      projectName?.includes(searchLower) ||
      status?.includes(searchLower) ||
      assignedTo?.includes(searchLower)
    );
  });

  // Sort ITRs
  const sortedITRs = [...filteredITRs].sort((a, b) => {
    let aValue: any = 'name' in a ? a[sortField as keyof ITRWithActions] : null;
    let bValue: any = 'name' in b ? b[sortField as keyof ITRWithActions] : null;

    // Handle special cases
    if (sortField === "subsystemName") {
      aValue = a.subsystemName || "";
      bValue = b.subsystemName || "";
    } else if (sortField === "systemName") {
      aValue = a.systemName || "";
      bValue = b.systemName || "";
    } else if (sortField === "projectName") {
      aValue = a.projectName || "";
      bValue = b.projectName || "";
    }

    // Handle undefined values
    if (aValue === undefined) aValue = "";
    if (bValue === undefined) bValue = "";

    // Compare
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      complete: { label: "Completado", variant: "default" },
      inprogress: { label: "En progreso", variant: "secondary" },
      delayed: { label: "Retrasado", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "outline" };

    return (
      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>ITRs</CardTitle>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search ITRs..."
              className="w-[200px] pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {onOpenModal && (
            <Button onClick={onOpenModal} disabled={!selectedProjectId}>
              <Plus className="mr-2 h-4 w-4" /> Add ITR
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {sortedITRs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground">No ITRs found</p>
            {selectedProjectId && onOpenModal && (
              <Button variant="outline" className="mt-4" onClick={onOpenModal}>
                <Plus className="mr-2 h-4 w-4" /> Add your first ITR
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                {!filterBySubsystem && (
                  <>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("subsystemName")}
                    >
                      Subsystem <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("systemName")}
                    >
                      System <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                    </TableHead>
                  </>
                )}
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedITRs.map((itr) => (
                <TableRow key={'id' in itr ? itr.id : ''}>
                  <TableCell className="font-medium">{'name' in itr ? itr.name : ''}</TableCell>
                  {!filterBySubsystem && (
                    <>
                      <TableCell>{itr.subsystemName || "—"}</TableCell>
                      <TableCell>{itr.systemName || "—"}</TableCell>
                    </>
                  )}
                  <TableCell className="text-right">
                    {renderStatusBadge('status' in itr ? itr.status : 'inprogress')}
                  </TableCell>
                  <TableCell className="text-right">
                    {'progress' in itr ? `${itr.progress || 0}%` : '0%'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(itr)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete ITR</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this ITR? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete('id' in itr ? itr.id : '')}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      {/* Edit Modal */}
      {selectedITR && (
        <ITRFormModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          itr={selectedITR}
          systems={systems || []}
          subsystems={subsystems || []}
          onSuccess={() => {
            setIsEditModalOpen(false);
            onRefresh();
          }}
        />
      )}
    </Card>
  );
};

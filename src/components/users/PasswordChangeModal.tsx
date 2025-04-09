
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserProfile, changeUserPassword } from "@/services/userService";
import { PasswordChangeData } from "@/services/types";

interface PasswordChangeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: UserProfile;
}

const PasswordChangeModal = ({ open, onClose, onSuccess, user }: PasswordChangeModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast({
        title: "Contraseña requerida",
        description: "Por favor ingrese una contraseña",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "La contraseña y la confirmación deben ser iguales",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const data: PasswordChangeData = {
        userId: user.id,
        newPassword: password
      };

      console.log("Changing password for user:", user.id);
      const result = await changeUserPassword(data);

      if (result.success) {
        toast({
          title: "Contraseña actualizada",
          description: "La contraseña ha sido actualizada correctamente"
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error al cambiar contraseña:", error);
      toast({
        title: "Error",
        description: `No se pudo cambiar la contraseña: ${error.message || "Error desconocido"}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Cambiar contraseña para {user.full_name || 'usuario'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese la nueva contraseña"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirmar contraseña *</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme la contraseña"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Cambiar contraseña"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordChangeModal;

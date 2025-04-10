
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const passwordChangeSchema = z.object({
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

interface PasswordChangeFormProps {
  userId: string;
  onSubmit: (userId: string, password: string) => Promise<void>;
  isSubmitting?: boolean;
}

const PasswordChangeForm = ({ userId, onSubmit, isSubmitting = false }: PasswordChangeFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const form = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof passwordChangeSchema>) => {
    if (isSubmitting) return;
    await onSubmit(userId, values.password);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva Contraseña</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Escriba la nueva contraseña" 
                    disabled={isSubmitting}
                    {...field} 
                  />
                </FormControl>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Contraseña</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme la nueva contraseña" 
                    disabled={isSubmitting}
                    {...field} 
                  />
                </FormControl>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
              Procesando...
            </>
          ) : (
            "Cambiar Contraseña"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default PasswordChangeForm;

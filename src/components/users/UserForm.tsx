
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User } from "@supabase/supabase-js";
import { AVAILABLE_PERMISSIONS, UserProfile } from "@/services/userService";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, memo, useState } from "react";

const formSchema = z.object({
  email: z.string().email({
    message: "Debe ingresar un email válido",
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  }).optional(),
  full_name: z.string().min(2, {
    message: "El nombre completo debe tener al menos 2 caracteres",
  }),
  role: z.string(),
  permissions: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  user?: User & { profile?: UserProfile };
  onSubmit: (values: FormValues) => void;
  isSubmitting?: boolean;
}

const UserForm = memo(({ user, onSubmit, isSubmitting = false }: UserFormProps) => {
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      role: "user",
      permissions: [],
    },
  });

  // Initialize form values when user data is available
  useEffect(() => {
    if (user) {
      // Try to get email from multiple sources with fallbacks
      const email = user.email || user.profile?.email || "";
      
      const formValues = {
        email,
        password: "", // Password always empty for edit
        full_name: user.profile?.full_name || "",
        role: user.profile?.role || "user",
        permissions: user.profile?.permissions || [],
      };
      
      form.reset(formValues);
      setIsFormLoaded(true);
    } else {
      // Reset form for new user
      form.reset({
        email: "",
        password: "",
        full_name: "",
        role: "user",
        permissions: [],
      });
      setIsFormLoaded(true);
    }
  }, [form, user]);

  const handleSubmit = (values: FormValues) => {
    if (isSubmitting) return; // Prevent multiple submissions
    onSubmit(values);
  };

  if (!isFormLoaded) {
    return <div className="p-4 text-center">Cargando formulario...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="correo@ejemplo.com" 
                  {...field} 
                  readOnly={!!user}
                  disabled={!!user || isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {!user && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Contraseña" 
                    {...field}
                    disabled={isSubmitting} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nombre Completo" 
                  {...field} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="permissions"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Permisos</FormLabel>
                <FormDescription>
                  Seleccione los permisos para este usuario
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <FormField
                    key={permission}
                    control={form.control}
                    name="permissions"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={permission}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(permission)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value || [], permission])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== permission
                                      )
                                    );
                              }}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {permission.charAt(0).toUpperCase() + permission.slice(1)}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
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
              {user ? "Actualizando..." : "Creando..."}
            </>
          ) : (
            user ? "Actualizar Usuario" : "Crear Usuario"
          )}
        </Button>
      </form>
    </Form>
  );
});

UserForm.displayName = "UserForm";

export default UserForm;

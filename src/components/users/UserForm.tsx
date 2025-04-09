
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
import { useEffect } from "react";

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
}

const UserForm = ({ user, onSubmit }: UserFormProps) => {
  console.log("UserForm user data:", user);
  
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
      console.log("Setting form values from user:", {
        email: user.email,
        full_name: user.profile?.full_name,
        role: user.profile?.role,
        permissions: user.profile?.permissions
      });
      
      form.reset({
        email: user.email || "",
        password: "",
        full_name: user.profile?.full_name || "",
        role: user.profile?.role || "user",
        permissions: user.profile?.permissions || [],
      });
    }
  }, [form, user]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        
        <Button type="submit" className="w-full">
          {user ? "Actualizar Usuario" : "Crear Usuario"}
        </Button>
      </form>
    </Form>
  );
};

export default UserForm;

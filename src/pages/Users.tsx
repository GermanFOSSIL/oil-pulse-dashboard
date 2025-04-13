
// Fix the user creation part by handling the createUser response format correctly:

// Original:
// result.success, result.userId, result.message

// Should be updated to handle the response from createUser which returns
// { user, session } instead and doesn't have userId or success properties
// We need to check if user exists to determine success

if (result.user) {
  toast({
    title: "Usuario creado",
    description: "El usuario se ha creado exitosamente",
  });
  setIsUserFormOpen(false);
  
  // Optimistically add the new user to the list
  const newUser = {
    id: result.user.id,
    email: formData.email,
    profile: {
      id: result.user.id,
      full_name: formData.full_name,
      role: formData.role,
      permissions: formData.permissions,
      email: formData.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    created_at: new Date().toISOString()
  };
  
  setUsers(prev => [...prev, newUser]);
} else {
  toast({
    title: "Error",
    description: "No se pudo crear el usuario",
    variant: "destructive",
  });
}

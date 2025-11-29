import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Users, UserPlus, Shield, Search, Loader2, Trash2 } from 'lucide-react';
import type { AppRole } from '@/hooks/useUserRole';

interface UserWithRoles {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  roles: AppRole[];
}

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-destructive text-destructive-foreground',
  profesor: 'bg-primary text-primary-foreground',
  alumno: 'bg-secondary text-secondary-foreground',
  apoderado: 'bg-accent text-accent-foreground'
};

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  profesor: 'Profesor',
  alumno: 'Alumno',
  apoderado: 'Apoderado'
};

export default function Usuarios() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState<AppRole | ''>('');

  // Fetch all profiles with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, nombre, apellido')
        .not('user_id', 'is', null);
      
      if (profilesError) throw profilesError;

      // Then get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRoles[] = profiles.map(profile => ({
        id: profile.user_id!,
        email: profile.email || '',
        nombre: profile.nombre,
        apellido: profile.apellido,
        roles: roles
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role as AppRole)
      }));

      return usersWithRoles;
    }
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          id_institucion: '00000000-0000-0000-0000-000000000001' // Demo institution
        });
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('El usuario ya tiene este rol asignado');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Rol asignado correctamente');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsAssignRoleOpen(false);
      setNewRole('');
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Rol eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast.error('Error al eliminar el rol');
    }
  });

  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.apellido?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignRole = () => {
    if (!selectedUser || !newRole) return;
    assignRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
  };

  const handleRemoveRole = (userId: string, role: AppRole) => {
    if (confirm(`¿Estás seguro de eliminar el rol ${ROLE_LABELS[role]}?`)) {
      removeRoleMutation.mutate({ userId, role });
    }
  };

  const openAssignDialog = (user: UserWithRoles) => {
    setSelectedUser(user);
    setIsAssignRoleOpen(true);
  };

  // Available roles to assign (exclude already assigned roles)
  const availableRoles = selectedUser 
    ? (['admin', 'profesor', 'alumno', 'apoderado'] as AppRole[]).filter(
        role => !selectedUser.roles.includes(role)
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Administra los usuarios y sus roles en el sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter(u => u.roles.includes('admin')).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profesores</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter(u => u.roles.includes('profesor')).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alumnos</CardTitle>
            <Users className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter(u => u.roles.includes('alumno')).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>
            Lista de todos los usuarios con sus roles asignados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {user.nombre && user.apellido 
                                ? `${user.nombre} ${user.apellido}`
                                : user.email}
                            </p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.length === 0 ? (
                              <Badge variant="outline">Sin rol</Badge>
                            ) : (
                              user.roles.map((role) => (
                                <Badge 
                                  key={role} 
                                  className={`${ROLE_COLORS[role]} cursor-pointer hover:opacity-80`}
                                  onClick={() => handleRemoveRole(user.id, role)}
                                  title="Click para eliminar"
                                >
                                  {ROLE_LABELS[role]}
                                  <Trash2 className="ml-1 h-3 w-3" />
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignDialog(user)}
                            disabled={user.roles.length >= 4}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Asignar Rol
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Role Dialog */}
      <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Rol</DialogTitle>
            <DialogDescription>
              Asignar un nuevo rol a {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rol a asignar</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as AppRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedUser && selectedUser.roles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Roles actuales</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedUser.roles.map((role) => (
                    <Badge key={role} className={ROLE_COLORS[role]}>
                      {ROLE_LABELS[role]}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignRoleOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignRole}
              disabled={!newRole || assignRoleMutation.isPending}
            >
              {assignRoleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

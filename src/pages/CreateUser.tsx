import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { User as ServiceUser } from "@/service/userService";
import { useUserContext } from "@/utils/UserContext";
import { useUserStore } from "@/stores/userStore";
import CreateUserModal from "@/components/CreateUserModal";

const CreateUser = () => {
  const { toast } = useToast();
  const { user: loggedInUser } = useUserContext();
  const { users, loading: fetchingUsers, fetchUsers, createUser, updateUser, deleteUser } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // If admin, update selected user if users list changes and none selected
  useEffect(() => {
    if (loggedInUser?.role === "ADMIN" && users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [users, loggedInUser, selectedUserId]);

  const handleEditClick = (userId: string) => {
    setEditingUserId(userId);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingUserId(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      const res = await deleteUser(userId);
      if (!res.error) {
        toast({ title: "User Deleted", description: "User deleted successfully!" });
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete user", variant: "destructive" });
      }
    }
  };

  const handleModalSave = async (userId: string | null, userData: { email: string; name: string; password?: string }) => {
    setLoading(true);
    let res;
    if (isCreating) {
      res = await createUser({ email: userData.email, password: userData.password!, name: userData.name });
    } else if (userId) {
      res = await updateUser({ userId: userId, email: userData.email, name: userData.name });
    }

    if (res && !res.error) {
      toast({ title: `User ${isCreating ? "Created" : "Updated"}`, description: `User ${userData.email} ${isCreating ? "created" : "updated"} successfully!` });
      setIsModalOpen(false);
      setEditingUserId(null);
    } else if (res) {
      toast({ title: "Error", description: res.message || `Failed to ${isCreating ? "create" : "update"} user`, variant: "destructive" });
    }
    setLoading(false);
  };


  let profileUser: (ServiceUser | typeof loggedInUser) | undefined = undefined;
  if (loggedInUser?.role === "ADMIN") {
    profileUser = users.find(u => u.id === selectedUserId);
  } else {
    profileUser = loggedInUser || undefined;
  }

  return (
    <div className="flex flex-col justify-center  bg-gray-50">
        <CreateUserModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          isCreating={isCreating}
          editingUserId={editingUserId}
          onSave={handleModalSave}
          loading={loading}
          onCreateClick={handleCreateClick}
        />

      <Card className="w-full max-w-full">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fetchingUsers ? (
                  <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={5}>No users found.</TableCell></TableRow>
                ) : (
                  users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.id}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditClick(user.id)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(user.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateUser;
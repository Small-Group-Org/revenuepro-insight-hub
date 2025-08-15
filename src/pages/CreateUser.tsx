import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { User as ServiceUser } from "@/service/userService";
import { useUserContext } from "@/utils/UserContext";
import { useUserStore } from "@/stores/userStore";
import CreateUserModal from "@/components/CreateUserModal";
import { UserPlus, Pencil, Trash2 } from "lucide-react";

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
    <div className="flex flex-col min-h-screen bg-background py-6 px-2 sm:px-4 md:px-8">
      <CreateUserModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        isCreating={isCreating}
        editingUserId={editingUserId}
        onSave={handleModalSave}
        loading={loading}
      />

      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gradient-primary">
              User Management
            </h1>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-gradient-primary hover:bg-gradient-accent text-primary-foreground font-semibold shadow"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Add User
          </Button>
        </div>

        <Card className="w-full shadow-lg bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Role</TableHead>
                    <TableHead className="text-muted-foreground">User ID</TableHead>
                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fetchingUsers ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, idx) => (
                      <TableRow
                        key={user.id}
                        className={`transition-colors ${
                          idx % 2 === 0 ? "bg-card" : "bg-muted/50"
                        } hover:bg-accent/10`}
                      >
                        <TableCell className="text-card-foreground">{user.email}</TableCell>
                        <TableCell className="text-card-foreground">{user.name || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              user.role === "ADMIN"
                                ? "bg-primary/20 text-primary"
                                : "bg-accent/20 text-accent-foreground"
                            }`}
                          >
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs break-all text-muted-foreground">{user.id}</TableCell>
                        <TableCell className="text-right flex flex-wrap gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 px-3 py-1 border border-primary/20 text-primary font-medium rounded-md transition-colors hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleEditClick(user.id)}
                            aria-label="Edit"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 px-3 py-1 border border-destructive/20 text-destructive font-medium rounded-md transition-colors hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteClick(user.id)}
                            aria-label="Delete"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
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
    </div>
  );
};

export default CreateUser;
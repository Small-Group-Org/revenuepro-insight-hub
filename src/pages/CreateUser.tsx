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
    <div className="flex flex-col min-h-screen bg-gray-50 py-6 px-2 sm:px-4 md:px-8">
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
            <UserPlus className="h-8 w-8 text-blue-700" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
              User Management
            </h1>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow hover:from-blue-700 hover:to-purple-700"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Add User
          </Button>
        </div>

        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100">
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fetchingUsers ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, idx) => (
                      <TableRow
                        key={user.id}
                        className={`transition-colors ${
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                        } hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50`}
                      >
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.name || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              user.role === "ADMIN"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs break-all">{user.id}</TableCell>
                        <TableCell className="text-right flex flex-wrap gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 px-3 py-1 border border-blue-200 text-blue-700 font-medium rounded-md transition-colors hover:bg-blue-100 hover:text-blue-900"
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
                            className="flex items-center gap-1 px-3 py-1 border border-red-200 text-red-700 font-medium rounded-md transition-colors hover:bg-red-100 hover:text-red-900"
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
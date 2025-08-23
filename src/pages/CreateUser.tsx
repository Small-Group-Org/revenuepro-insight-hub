import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch users when role filter changes
  useEffect(() => {
    if (loggedInUser?.role === "ADMIN") {
      fetchUsers(roleFilter);
      setCurrentPage(1); // Reset to first page when filter changes
    }
  }, [roleFilter, loggedInUser?.role, fetchUsers]);

  // Pagination logic
  const totalUsers = users.length;
  const totalPages = Math.ceil(totalUsers / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentUsers = users.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setCurrentPage(1); // Reset to first page when page size changes
  };

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

  const handleModalSave = async (userId: string | null, userData: { email: string; name: string; password?: string; role: string }) => {
    setLoading(true);
    let res;
    if (isCreating) {
      res = await createUser({ email: userData.email, password: userData.password!, name: userData.name, role: userData.role });
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-card-foreground">All Users</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="role-filter" className="text-sm font-medium text-muted-foreground">
                    Filter by Role:
                  </label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="USER">Clients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Role</TableHead>
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
                        {roleFilter === "all" ? "No users found." : `No ${roleFilter === "ADMIN" ? "admin" : "client"} users found.`}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentUsers.map((user, idx) => (
                      <TableRow
                        key={user.id}
                        className={`transition-all duration-200 ${
                          idx % 2 === 0 ? "bg-card" : "bg-muted/50"
                        } hover:bg-accent/10 hover:shadow-lg hover:shadow-black/10`}
                      >
                        <TableCell className="text-card-foreground">{user.name || "-"}</TableCell>
                        <TableCell className="text-card-foreground">{user.email}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              user.role === "ADMIN"
                                ? "bg-primary/20 text-primary"
                                : "bg-accent/50 text-accent-foreground"
                            }`}
                          >
                            {user.role === "ADMIN" ? "ADMIN" : "CLIENT"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right flex flex-wrap justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center px-2 gap-1 text-primary font-medium rounded-md transition-colors hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleEditClick(user.id)}
                            aria-label="Edit"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 px-2 text-destructive font-medium rounded-md transition-colors hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteClick(user.id)}
                            aria-label="Delete"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Showing {startIndex + 1}-{Math.min(endIndex, totalUsers)} of {totalUsers} users</span>
                  <span className="mx-2">•</span>
                  <span>Page {currentPage} of {totalPages}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="page-size" className="text-sm text-muted-foreground">
                      Show:
                    </label>
                    <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                   <div className="flex items-center gap-1">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handlePageChange(currentPage - 1)}
                       disabled={currentPage === 1}
                       className="h-8 w-8 p-0"
                     >
                       <span className="text-[32px] mb-[6px]">‹</span>
                     </Button>
                     
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handlePageChange(currentPage + 1)}
                       disabled={currentPage === totalPages}
                       className="h-8 w-8 p-0"
                     >
                       <span className="text-[32px] mb-[6px]">›</span>
                     </Button>
                   </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateUser;
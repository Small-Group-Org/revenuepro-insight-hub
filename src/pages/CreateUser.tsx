import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User as ServiceUser } from "@/service/userService";
import { useUserContext } from "@/utils/UserContext";
import { useUserStore } from "@/stores/userStore";
import CreateUserModal from "@/components/CreateUserModal";
import ResetPasswordModal from "@/components/ResetPasswordModal";
import {
  UserPlus,
  Pencil,
  Trash2,
  Key,
  Search,
  X,
  UserX,
  UserCheck,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CreateUser = () => {
  const { toast } = useToast();
  const { user: loggedInUser } = useUserContext();
  const {
    users,
    loading: fetchingUsers,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    updatePassword,
  } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordResetUserId, setPasswordResetUserId] = useState<string | null>(
    null
  );
  const [passwordResetUserName, setPasswordResetUserName] =
    useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusChangeUserId, setStatusChangeUserId] = useState<string | null>(
    null
  );
  const [statusChangeUserName, setStatusChangeUserName] = useState<string>("");
  const [statusChangeAction, setStatusChangeAction] = useState<
    "activate" | "deactivate"
  >("deactivate");

  // Fetch users when role filter changes
  useEffect(() => {
    if (loggedInUser?.role === "ADMIN") {
      fetchUsers(roleFilter);
      setCurrentPage(1); // Reset to first page when filter changes
    }
  }, [roleFilter, loggedInUser?.role, fetchUsers]);

  // Filter users based on search query, role filter, and status filter
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Pagination logic
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
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

  const handleToggleStatusClick = (
    userId: string,
    userName: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const action = newStatus === "active" ? "activate" : "deactivate";

    setStatusChangeUserId(userId);
    setStatusChangeUserName(userName);
    setStatusChangeAction(action);
    setIsStatusModalOpen(true);
  };

  const handleStatusChangeConfirm = async () => {
    if (!statusChangeUserId) return;

    // Find the user to get all their data
    const userToUpdate = users.find((user) => user.id === statusChangeUserId);
    if (!userToUpdate) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return;
    }

    const newStatus = statusChangeAction === "activate" ? "active" : "inactive";
    setLoading(true);

    // Send all user data including the updated status
    const res = await updateUser({
      userId: statusChangeUserId,
      email: userToUpdate.email,
      name: userToUpdate.name,
      status: newStatus,
    });

    if (!res.error) {
      toast({
        title: `User ${
          statusChangeAction === "activate" ? "Activated" : "Deactivated"
        }`,
        description: `User ${statusChangeAction}d successfully!`,
      });
      setIsStatusModalOpen(false);
      setStatusChangeUserId(null);
      setStatusChangeUserName("");
    } else {
      toast({
        title: "Error",
        description: res.message || `Failed to ${statusChangeAction} user`,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handlePasswordResetClick = (userId: string, userName: string) => {
    setPasswordResetUserId(userId);
    setPasswordResetUserName(userName);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordReset = async (userId: string, newPassword: string) => {
    setLoading(true);
    const res = await updatePassword({ userId, newPassword });

    if (!res.error) {
      toast({
        title: "Password Reset",
        description: "Password has been reset successfully!",
      });
      setIsPasswordModalOpen(false);
      setPasswordResetUserId(null);
      setPasswordResetUserName("");
    } else {
      toast({
        title: "Error",
        description: res.message || "Failed to reset password",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleModalSave = async (
    userId: string | null,
    userData: { email: string; name: string; password?: string; role: string }
  ) => {
    setLoading(true);
    let res;
    if (isCreating) {
      res = await createUser({
        email: userData.email,
        password: userData.password!,
        name: userData.name,
        role: userData.role,
      });
    } else if (userId) {
      res = await updateUser({
        userId: userId,
        email: userData.email,
        name: userData.name,
      });
    }

    if (res && !res.error) {
      toast({
        title: `User ${isCreating ? "Created" : "Updated"}`,
        description: `User ${userData.email} ${
          isCreating ? "created" : "updated"
        } successfully!`,
      });
      setIsModalOpen(false);
      setEditingUserId(null);
    } else if (res) {
      toast({
        title: "Error",
        description:
          res.message || `Failed to ${isCreating ? "create" : "update"} user`,
        variant: "destructive",
      });
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

      <ResetPasswordModal
        isOpen={isPasswordModalOpen}
        onOpenChange={setIsPasswordModalOpen}
        userId={passwordResetUserId || ""}
        userName={passwordResetUserName}
        onSave={handlePasswordReset}
        loading={loading}
      />

      <AlertDialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusChangeAction === "activate"
                ? "Activate User"
                : "Deactivate User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {statusChangeAction}{" "}
              <strong>{statusChangeUserName}</strong>?
              {statusChangeAction === "deactivate"
                ? " The user will no longer be able to access the system."
                : " The user will regain access to the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChangeConfirm}
              disabled={loading}
              className={
                statusChangeAction === "activate"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-orange-600 hover:bg-orange-700"
              }
            >
              {loading
                ? "Processing..."
                : `${
                    statusChangeAction === "activate"
                      ? "Activate"
                      : "Deactivate"
                  } User`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-card-foreground text-[18px]">
                    All Users
                  </CardTitle>
                  {/* Search Bar */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearSearch}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {searchQuery && (
                      <div className="text-sm text-muted-foreground">
                        {totalUsers} result{totalUsers !== 1 ? "s" : ""} found
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="role-filter"
                      className="text-sm font-medium text-muted-foreground"
                    >
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
                  <div></div>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="status-filter"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Filter by Status:
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="All status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Email
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Role
                    </TableHead>
                    <TableHead className="text-right text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fetchingUsers ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {searchQuery
                          ? `No users found matching "${searchQuery}".`
                          : roleFilter === "all" && statusFilter === "all"
                          ? "No users found."
                          : `No users found with the selected filters.`}
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
                        <TableCell className="text-card-foreground">
                          <div
                            className={`flex items-center gap-2 ${
                              user.status === "inactive" ? "min-w-0" : ""
                            }`}
                          >
                            <span
                              className={
                                user.status === "inactive"
                                  ? "truncate max-w-[200px]"
                                  : ""
                              }
                              title={
                                user.status === "inactive"
                                  ? user.name || "-"
                                  : undefined
                              }
                            >
                              {user.name || "-"}
                            </span>
                            {user.status === "inactive" && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 flex-shrink-0">
                                INACTIVE
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-card-foreground">
                          <span
                            className="truncate max-w-[250px] block"
                            title={user.email}
                          >
                            {user.email}
                          </span>
                        </TableCell>
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
                            className="flex items-center px-2 gap-1 text-orange-600 font-medium rounded-md transition-colors hover:bg-orange-100 hover:text-orange-700"
                            onClick={() =>
                              handlePasswordResetClick(
                                user.id,
                                user.name || user.email
                              )
                            }
                            aria-label="Reset Password"
                            title="Reset Password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`flex items-center gap-1 px-2 font-medium rounded-md transition-colors ${
                              user.status === "active"
                                ? "text-orange-600 hover:bg-orange-100 hover:text-orange-700"
                                : "text-green-600 hover:bg-green-100 hover:text-green-700"
                            }`}
                            onClick={() =>
                              handleToggleStatusClick(
                                user.id,
                                user.name || user.email,
                                user.status || "active"
                              )
                            }
                            aria-label={
                              user.status === "active"
                                ? "Deactivate"
                                : "Activate"
                            }
                            title={
                              user.status === "active"
                                ? "Deactivate User"
                                : "Activate User"
                            }
                          >
                            {user.status === "active" ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
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
                  <span>
                    Showing {startIndex + 1}-{Math.min(endIndex, totalUsers)} of{" "}
                    {totalUsers} users
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="page-size"
                      className="text-sm text-muted-foreground"
                    >
                      Show:
                    </label>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={handlePageSizeChange}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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

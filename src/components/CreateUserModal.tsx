import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User as ServiceUser, getUserById } from "@/service/userService";
import { Copy, Check } from "lucide-react";

interface CreateUserModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isCreating: boolean;
  editingUserId: string | null;
  onSave: (userId: string | null, userData: { email: string; name: string; password?: string; role: string }) => Promise<void>;
  loading: boolean;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onOpenChange,
  isCreating,
  editingUserId,
  onSave,
  loading,
}) => {
  const [currentUserData, setCurrentUserData] = useState({
    email: "",
    name: "",
    password: "",
    role: "USER",
  });
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (isCreating) {
        setCurrentUserData({ email: "", name: "", password: "", role: "USER" });
      } else if (editingUserId) {
        const fetchUser = async () => {
          try {
            const res = await getUserById(editingUserId);
            if (!res.error) {
              setCurrentUserData({
                email: res.data.data.email,
                name: res.data.data.name || "",
                password: "", // Password should not be pre-filled for security
                role: res.data.data.role || "USER",
              });
            } else {
              toast({ title: "Error", description: res.message || "Failed to fetch user details", variant: "destructive" });
            }
          } catch (error) {
            toast({ title: "Error", description: "An unexpected error occurred while fetching user details.", variant: "destructive" });
            console.error("Error fetching user:", error);
          }
        };
        fetchUser();
      }
    }
  }, [isOpen, isCreating, editingUserId, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCurrentUserData(prev => ({ ...prev, [id]: value }));
  };

  const handleRoleChange = (value: string) => {
    setCurrentUserData(prev => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(editingUserId, currentUserData);
  };

  const handleCopyUserId = async () => {
    if (editingUserId) {
      try {
        await navigator.clipboard.writeText(editingUserId);
        setCopied(true);
        toast({
          title: "Copied!",
          description: "Client ID has been copied to clipboard",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy Client ID",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isCreating ? "Create New User" : "Edit User"}</DialogTitle>
          <DialogDescription>
            {isCreating ? "Fill in the details to create a new user." : "Make changes to the user's profile here. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isCreating && editingUserId && (
            <div>
              <label htmlFor="userId" className="block text-sm font-medium mb-1 text-card-foreground">Client ID</label>
              <div className="flex gap-2">
                <Input 
                  id="userId" 
                  type="text" 
                  value={editingUserId} 
                  readOnly 
                  disabled 
                  className="border-border bg-muted text-muted-foreground font-mono text-sm" 
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUserId}
                  disabled={loading}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1 text-card-foreground">Name</label>
            <Input id="name" type="text" value={currentUserData.name} onChange={handleChange} required={!isCreating} disabled={loading} placeholder="Enter user name" className="border-border focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1 text-card-foreground">Email</label>
            <Input id="email" type="email" value={currentUserData.email} onChange={handleChange} required disabled={loading} placeholder="Enter user email" className="border-border focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1 text-card-foreground">Role</label>
            <Select value={currentUserData.role} onValueChange={handleRoleChange} disabled={loading}>
              <SelectTrigger className="border-border focus:ring-primary">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Client</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isCreating && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-card-foreground">Password</label>
              <Input id="password" type="password" value={currentUserData.password} onChange={handleChange} required disabled={loading} placeholder="Enter password" className="border-border focus:ring-primary" />
            </div>
          )}
          <Button type="submit" className="w-full bg-gradient-primary hover:bg-gradient-accent text-primary-foreground" disabled={loading}>{loading ? (isCreating ? "Creating..." : "Saving...") : (isCreating ? "Create User" : "Save changes")}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal; 
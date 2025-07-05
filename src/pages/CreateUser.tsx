import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { createUser, getAllUsers, User } from "@/service/userService";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";

const CreateUser = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    const res = await getAllUsers();
    if (!res.error && Array.isArray(res.data.data)) {
      setUsers(res?.data?.data);
    } else {
      toast({ title: "Error", description: res.message || "Failed to fetch users", variant: "destructive" });
    }
    setFetchingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createUser({ email: form.email, password: form.password, name: form.name });
    if (!res.error) {
      toast({ title: "User Created", description: `User ${form.email} created successfully!` });
      setForm({ email: "", password: "", name: "" });
      fetchUsers();
    } else {
      toast({ title: "Error", description: res.message || "Failed to create user", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-8">
      <Card className="w-full max-w-md mb-8">
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <Input id="name" type="text" value={form.name} onChange={handleChange} required disabled={loading} placeholder="Enter user name" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <Input id="email" type="email" value={form.email} onChange={handleChange} required disabled={loading} placeholder="Enter user email" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <Input id="password" type="password" value={form.password} onChange={handleChange} required disabled={loading} placeholder="Enter password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Create User"}</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="w-full max-w-2xl">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {fetchingUsers ? (
                  <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={4}>No users found.</TableCell></TableRow>
                ) : (
                  users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.id}</TableCell>
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
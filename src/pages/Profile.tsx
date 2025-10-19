import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, TicketPlus, Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/stores/authStore";
import { useUserContext } from "@/utils/UserContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
const getInitials = (name?: string) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase() || first.toUpperCase() || "U";
};

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { user } = useUserContext();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-full w-full">
      {/* Simple header without background color */}
      <div className="border-b">
        <div className="mx-auto px-6 md:px-8 py-6 md:py-8 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-xl md:text-2xl font-semibold leading-tight">
              {user?.name || "User"}
            </div>
            <div className="text-sm text-muted-foreground">{user?.email || "email@domain.com"}</div>
          </div>
          <div className="ml-auto">
            <button onClick={handleLogout} className="inline-flex h-9 items-center gap-2 justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground shadow transition-colors hover:opacity-90">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto   px-6 md:px-8 py-6 md:py-8">
        <Card>
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="list" className="w-full">
              <TabsList>
                <TabsTrigger value="list" className="gap-2">
                  <Ticket size={16} />
                  My Tickets
                </TabsTrigger>
                <TabsTrigger value="raise" className="gap-2">
                  <TicketPlus size={16} />
                  Raise Ticket
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-right">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { subject: "Cannot access dashboard", status: "Open", priority: "High", updated: "Today" },
                      { subject: "Billing discrepancy in August", status: "In Progress", priority: "Medium", updated: "2 days ago" },
                      { subject: "Feature request: export CSV filters", status: "Closed", priority: "Low", updated: "Last week" },
                      { subject: "Password reset not working", status: "Open", priority: "High", updated: "3 hours ago" },
                    ].map((t, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{t.subject}</TableCell>
                        <TableCell>
                          {t.status === "Open" && <Badge variant="default">Open</Badge>}
                          {t.status === "In Progress" && <Badge variant="secondary">In Progress</Badge>}
                          {t.status === "Closed" && <Badge variant="outline">Closed</Badge>}
                        </TableCell>
                        <TableCell>
                          {t.priority === "High" && <Badge variant="destructive">High</Badge>}
                          {t.priority === "Medium" && <Badge>Medium</Badge>}
                          {t.priority === "Low" && <Badge variant="outline">Low</Badge>}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{t.updated}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="raise" className="mt-4">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="Brief summary" />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input id="category" placeholder="e.g. Billing, Access, Bug" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" rows={6} placeholder="Describe the issue or request" />
                  </div>
                  <div className="flex items-center justify-end">
                    <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:opacity-90">
                      Submit (Dummy)
                    </button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



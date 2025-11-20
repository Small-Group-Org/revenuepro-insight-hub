import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LogOut, TicketPlus, Ticket, Loader2, ArrowDown, Lightbulb, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "@/stores/authStore";
import { useUserContext } from "@/utils/UserContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useTicketStore } from "@/stores/ticketStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { createFeatureRequest } from "@/service/featureRequestService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const { userRole } = useRoleAccess();
  const { tickets, loading, error, fetchTickets, updateTicketData } = useTicketStore();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: ""
  });
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [featureForm, setFeatureForm] = useState({
    title: "",
    description: ""
  });

  const isAdmin = userRole === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch tickets on component mount
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Filter tickets for regular users (only their own tickets)
  let filteredTickets = isAdmin ? tickets : tickets.filter(ticket => ticket.userId._id === user?._id);
  
  // Apply status filter for admin
  if (isAdmin && statusFilter !== "all") {
    filteredTickets = filteredTickets.filter(ticket => ticket.status === statusFilter);
  }
  
  // Sort tickets based on user role
  const userTickets = filteredTickets.sort((a, b) => {
    if (isAdmin) {
      // Admin: Sort by creation time (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      // User: Sort by update time (newest first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-gray-400 hover:bg-gray-500 text-white">In Progress</Badge>;
      case 'closed':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-gray-800 hover:bg-gray-900 text-white">High</Badge>;
      case 'medium':
        return <Badge className="bg-gray-500 hover:bg-gray-600 text-white">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gray-300 hover:bg-gray-400 text-gray-800">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };


  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Ticket management functions for admin
  const handleStatusChange = async (ticketId: string, status: string) => {
      const result = await updateTicketData({
        _id: ticketId,
        status: status as 'open' | 'in_progress' | 'closed', 
      });

    if (result.error) {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      });
    }
  };

  const handlePriorityChange = async (ticketId: string, priority: string) => {
    const result = await updateTicketData({
      _id: ticketId,
      priority: priority as 'low' | 'medium' | 'high',
    });

    if (result.error) {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Ticket priority updated successfully",
      });
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketForm.title.trim() || !ticketForm.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await useTicketStore.getState().createNewTicket({
        title: ticketForm.title,
        description: ticketForm.description,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Ticket created successfully",
        });
        setTicketForm({ title: "", description: "" });
        setIsModalOpen(false);
        fetchTickets(); // Refresh the tickets list
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setTicketForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!featureForm.title.trim() || !featureForm.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createFeatureRequest({
        title: featureForm.title,
        description: featureForm.description,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Feature request submitted successfully",
        });
        setFeatureForm({ title: "", description: "" });
        setIsFeatureModalOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feature request",
        variant: "destructive",
      });
    }
  };

  const handleFeatureFormChange = (field: string, value: string) => {
    setFeatureForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="h-full w-full flex flex-col">
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
          <div className="ml-auto flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFeatureModalOpen(true)}
              className="gap-2"
            >
              <Lightbulb size={16} />
              Request Feature
            </Button>
            <button onClick={handleLogout} className="inline-flex h-9 items-center gap-2 justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground shadow transition-colors hover:opacity-90">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 py-6 md:py-8">
        <Accordion type="multiple" defaultValue={["support-tickets"]} className="w-full space-y-4">
          <AccordionItem value="support-tickets" className="border border-gray-200 rounded-lg bg-white shadow-sm">
            <AccordionTrigger className="text-lg font-semibold px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Ticket size={20} />
                  Support Tickets
                </div>
                {!isAdmin && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModalOpen(true);
                    }}
                    className="mr-4"
                  >
                    <Plus size={16} />
                    Raise Ticket
                  </Button>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {isAdmin && (
                <div className="flex justify-between items-center mb-4 mt-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Filter by Status:</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="mt-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading tickets...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8 text-red-600">
                      <p>Error loading tickets: {error}</p>
                    </div>
                  ) : userTickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No tickets found</p>
                      {!isAdmin && (
                        <p className="text-sm mt-2">Create your first ticket using the "Raise Ticket" tab</p>
                      )}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[25%]">Subject</TableHead>
                          <TableHead className="w-[30%]">Description</TableHead>
                          {isAdmin && <TableHead className="w-[15%]">User</TableHead>}
                          <TableHead className="w-[10%]">Status</TableHead>
                          <TableHead className="w-[10%]">Priority</TableHead>
                          <TableHead className="text-right w-[10%]">
                            <div className="flex items-center justify-end gap-1">
                              {isAdmin ? "Created" : "Updated"}
                              <ArrowDown className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userTickets.map((ticket, index) => (
                          <TableRow key={ticket._id} className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                            <TableCell className="font-medium">{ticket.title}</TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-help">
                                      <span className="text-sm text-muted-foreground">
                                        {truncateText(ticket.description, 60)}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="text-sm">{ticket.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="text-sm text-muted-foreground">
                                <div>
                                  <div className="font-medium">{ticket.userId.name}</div>
                                  <div className="text-xs text-gray-500">{ticket.userId.email}</div>
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              {isAdmin ? (
                                <Select
                                  value={ticket.status}
                                  onValueChange={(value) => handleStatusChange(ticket._id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                                </Select>
                              ) : (
                                getStatusBadge(ticket.status)
                              )}
                            </TableCell>
                            <TableCell>
                              {isAdmin ? (
                                <Select
                                  value={ticket.priority}
                                  onValueChange={(value) => handlePriorityChange(ticket._id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                getPriorityBadge(ticket.priority)
                              )}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatDate(isAdmin ? ticket.createdAt : ticket.updatedAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Info & Links mini list */}
      {/* Profile footer */}
      <footer className="mt-auto w-full z-0 bg-[#1f1c13] text-white">
        <div className="mx-auto px-6 md:px-8 py-4">
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link to="/release-notes" target="_blank" className="opacity-90 hover:opacity-100 hover:underline">
              Release Notes
            </Link>
            <span className="opacity-40">•</span>
            <a
              href="https://getrevpro.co/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-90 hover:opacity-100 hover:underline"
            >
              Privacy Policy
            </a>
            <span className="opacity-40">•</span>
            <a
              href="https://getrevpro.co/revenue-pro-california-privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-90 hover:opacity-100 hover:underline"
            >
              CA Privacy Policy
            </a>
            <span className="opacity-40">•</span>
            <a
              href="https://getrevpro.co/revenue-pro-terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-90 hover:opacity-100 hover:underline"
            >
              Terms & Conditions
            </a>
          </nav>
        </div>
      </footer>

      {/* Raise Ticket Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TicketPlus size={20} />
              Raise New Ticket
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTicketSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={ticketForm.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="Enter ticket title"
                required
              />
            </div>


            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <div className="relative">
                <Textarea
                  id="description"
                  value={ticketForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Describe your issue or request in detail..."
                  className="min-h-[250px] resize-none"
                  maxLength={2000}
                  required
                />
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-white px-1 rounded">
                  {ticketForm.description.length}/2000
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setTicketForm({ title: "", description: "" });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <TicketPlus size={16} />
                Create Ticket
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Feature Request Modal */}
      <Dialog open={isFeatureModalOpen} onOpenChange={setIsFeatureModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb size={20} />
              Request New Feature
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFeatureSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="feature-title">Title *</Label>
              <Input
                id="feature-title"
                value={featureForm.title}
                onChange={(e) => handleFeatureFormChange('title', e.target.value)}
                placeholder="Brief description of the feature"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feature-description">Description *</Label>
              <div className="relative">
                <Textarea
                  id="feature-description"
                  value={featureForm.description}
                  onChange={(e) => handleFeatureFormChange('description', e.target.value)}
                  placeholder="Describe the feature you'd like to see..."
                  className="min-h-[200px] resize-none"
                  maxLength={2000}
                  required
                />
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-white px-1 rounded">
                  {featureForm.description.length}/2000
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFeatureModalOpen(false);
                  setFeatureForm({ title: "", description: "" });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Lightbulb size={16} />
                Submit Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
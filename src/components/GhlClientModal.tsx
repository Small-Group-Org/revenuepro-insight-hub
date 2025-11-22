import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  createGhlClient,
  updateGhlClient,
  GhlClient,
} from "@/service/ghlClientService";
import { Loader2, ExternalLink } from "lucide-react";

interface GhlClientModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  revenueProClientId: string;
  userName: string;
  ghlClients: GhlClient[];
  onRefresh: () => void;
}

const GhlClientModal: React.FC<GhlClientModalProps> = ({
  isOpen,
  onOpenChange,
  revenueProClientId,
  userName,
  ghlClients,
  onRefresh,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [existingClient, setExistingClient] = useState<GhlClient | null>(null);
  const [formData, setFormData] = useState({
    locationId: "",
    ghlApiToken: "",
    queryValue: "1st - Total Job Amount",
    status: "active" as "active" | "inactive",
  });

  // Find existing GHL client when modal opens
  useEffect(() => {
    if (isOpen && revenueProClientId) {
      // Find client by revenueProClientId from passed data
      const client = ghlClients.find(
        (c) => c.revenueProClientId === revenueProClientId
      );
      if (client) {
        setExistingClient(client);
        // Set form data with existing values (token is not displayed)
        setFormData({
          locationId: client.locationId,
          ghlApiToken: "", // Token is never displayed, only updated if provided
          queryValue: client.queryValue,
          status: client.status,
        });
      } else {
        setExistingClient(null);
        // Reset form for new client
        setFormData({
          locationId: "",
          ghlApiToken: "",
          queryValue: "1st - Total Job Amount",
          status: "active",
        });
      }
    } else {
      // Reset form when modal closes
      setFormData({
        locationId: "",
        ghlApiToken: "",
        queryValue: "1st - Total Job Amount",
        status: "active",
      });
      setExistingClient(null);
    }
  }, [isOpen, revenueProClientId, ghlClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.locationId || !formData.queryValue) {
      toast({
        title: "Validation Error",
        description: "Sub Account ID and Total Job Booked Amount are required",
        variant: "destructive",
      });
      return;
    }

    // If updating, token is optional (only update if provided)
    // If creating, token is required
    if (!existingClient && !formData.ghlApiToken) {
      toast({
        title: "Validation Error",
        description: "GHL Integration Token is required when creating a new client",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (existingClient) {
        // Update existing client
        const updatePayload: {
          locationId?: string;
          ghlApiToken?: string;
          queryValue?: string;
          status?: 'active' | 'inactive';
        } = {
          queryValue: formData.queryValue,
          status: formData.status,
        };

        // Only include token if provided (for update)
        if (formData.ghlApiToken) {
          updatePayload.ghlApiToken = formData.ghlApiToken;
        }

        // Only include locationId if changed
        if (formData.locationId !== existingClient.locationId) {
          updatePayload.locationId = formData.locationId;
        }

        const response = await updateGhlClient(
          existingClient.locationId,
          updatePayload
        );

        if (!response.error) {
          toast({
            title: "Success",
            description: "GHL client configuration updated successfully!",
          });
          onRefresh(); // Refresh data in parent
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to update GHL client",
            variant: "destructive",
          });
        }
      } else {
        // Create new client
        const response = await createGhlClient({
          locationId: formData.locationId,
          ghlApiToken: formData.ghlApiToken,
          queryValue: formData.queryValue,
          revenueProClientId: revenueProClientId,
          status: formData.status,
        });

        if (!response.error) {
          toast({
            title: "Success",
            description: "GHL client configuration created successfully!",
          });
          onRefresh(); // Refresh data in parent
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to create GHL client",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingClient ? "Update GHL Client" : "Create GHL Client"}
          </DialogTitle>
          <DialogDescription>
            {existingClient
              ? `Manage GHL client configuration for ${userName}.`
              : `Configure GHL client integration for ${userName}.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
            {existingClient && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Current Configuration</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Sub Account ID:</span>{" "}
                    {existingClient.locationId}
                  </p>
                  <p>
                    <span className="font-medium">Total Job Booked Amount:</span>{" "}
                    {existingClient.queryValue}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        existingClient.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {existingClient.status.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="locationId" className="text-card-foreground">
                  Sub Account ID <span className="text-red-500">*</span>
                </Label>
                {!existingClient && (
                  <a
                    href="https://www.loom.com/share/0ff5ef9ea0a249649143ad1105787012"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Need help?
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="locationId"
                type="text"
                value={formData.locationId}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter GHL Sub Account ID"
                className="mt-1 border-border focus:ring-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ghlApiToken" className="text-card-foreground">
                  GHL Integration Token{" "}
                  {!existingClient && <span className="text-red-500">*</span>}
                </Label>
                {!existingClient && (
                  <a
                    href="https://www.loom.com/share/0ff5ef9ea0a249649143ad1105787012"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Need help?
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="ghlApiToken"
                type="password"
                value={formData.ghlApiToken}
                onChange={handleChange}
                required={!existingClient}
                disabled={loading}
                placeholder={
                  existingClient
                    ? "Leave empty to keep current token"
                    : "Enter GHL Integration Token"
                }
                className="mt-1 border-border focus:ring-primary"
              />
              {existingClient && (
                <p className="text-xs text-muted-foreground mt-1">
                  Token is encrypted and cannot be viewed. Enter a new token to
                  update it.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="queryValue" className="text-card-foreground">
                Total Job Booked Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="queryValue"
                type="text"
                value={formData.queryValue}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="e.g., 1st - Total Job Amount"
                className="mt-1 border-border focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The custom field name to search for in GHL (Total Job Booked Amount)
              </p>
            </div>

            <div>
              <Label htmlFor="status" className="text-card-foreground">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
                disabled={loading}
              >
                <SelectTrigger className="mt-1 border-border focus:ring-primary">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Active clients will be included in automated sync jobs
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:bg-gradient-accent text-primary-foreground"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {existingClient ? "Updating..." : "Creating..."}
                  </>
                ) : existingClient ? (
                  "Update Configuration"
                ) : (
                  "Create Configuration"
                )}
              </Button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  );
};

export default GhlClientModal;


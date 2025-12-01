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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  createGhlClient,
  updateGhlClient,
  GhlClient,
} from "@/service/ghlClientService";
import {
  getAdAccounts,
  assignAdAccountToClient,
  getUserProfile,
  AdAccount,
} from "@/service/metaAdAccountService";
import { useUserContext } from "@/utils/UserContext";
import { Loader2, ExternalLink } from "lucide-react";

interface ClientIntegrationsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  revenueProClientId: string;
  userName: string;
  ghlClients: GhlClient[];
  onRefresh: () => void;
}

const ClientIntegrationsModal: React.FC<ClientIntegrationsModalProps> = ({
  isOpen,
  onOpenChange,
  revenueProClientId,
  userName,
  ghlClients,
  onRefresh,
}) => {
  const { toast } = useToast();
  const { user: loggedInUser } = useUserContext();
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [ghlLoading, setGhlLoading] = useState(false);

  // GHL State
  const [existingGhlClient, setExistingGhlClient] = useState<GhlClient | null>(null);
  const [ghlFormData, setGhlFormData] = useState({
    locationId: "",
    ghlApiToken: "",
    queryValue: "1st - Total Job Amount",
    queryValue2: "Last Date Tag Changed",
    status: "active" as "active" | "inactive",
  });

  // Meta State
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>("");
  const [adminBusinessId, setAdminBusinessId] = useState<string>("");

  // Find existing GHL client when modal opens
  useEffect(() => {
    if (isOpen && revenueProClientId) {
      // Find client by revenueProClientId from passed data
      const client = ghlClients.find(
        (c) => c.revenueProClientId === revenueProClientId
      );
      if (client) {
        setExistingGhlClient(client);
        setGhlFormData({
          locationId: client.locationId,
          ghlApiToken: "", // Token is never displayed, only updated if provided
          queryValue: client.queryValue,
          queryValue2: "Last Date Tag Changed",
          status: client.status,
        });
      } else {
        setExistingGhlClient(null);
        setGhlFormData({
          locationId: "",
          ghlApiToken: "",
          queryValue: "1st - Total Job Amount",
          queryValue2: "Last Date Tag Changed",
          status: "active",
        });
      }
    } else {
      // Reset form when modal closes
      setGhlFormData({
        locationId: "",
        ghlApiToken: "",
        queryValue: "1st - Total Job Amount",
        queryValue2: "Last Date Tag Changed",
        status: "active",
      });
      setExistingGhlClient(null);
      setSelectedAdAccount("");
      setAdAccounts([]);
      setAdminBusinessId("");
    }
  }, [isOpen, revenueProClientId, ghlClients]);

  // Fetch admin profile and ad accounts when Meta tab is accessed
  useEffect(() => {
    if (isOpen && loggedInUser?._id) {
      fetchAdminProfileAndAdAccounts();
    }
  }, [isOpen, loggedInUser?._id]);

  const fetchAdminProfileAndAdAccounts = async () => {
    if (!loggedInUser?._id) return;

    setMetaLoading(true);
    try {
      // Get admin profile to get fbAdAccountId (used as businessId)
      const adminProfileResponse = await getUserProfile(loggedInUser._id);

      if (adminProfileResponse.error || !adminProfileResponse.data) {
        toast({
          title: "Error",
          description:
            adminProfileResponse.message ||
            "Failed to fetch admin profile. Please ensure your Meta account is connected.",
          variant: "destructive",
        });
        setMetaLoading(false);
        return;
      }

      const businessId = adminProfileResponse.data.fbAdAccountId;

      if (!businessId) {
        toast({
          title: "Setup Required",
          description:
            "Please set your Facebook Business ID (fbAdAccountId) in your profile settings.",
          variant: "destructive",
        });
        setMetaLoading(false);
        return;
      }

      setAdminBusinessId(businessId);

      // Fetch ad accounts using businessId
      const accountsResponse = await getAdAccounts(businessId);

      if (accountsResponse.error || !accountsResponse.data) {
        toast({
          title: "Error",
          description:
            accountsResponse.message ||
            "Failed to fetch ad accounts. Please check your Meta connection.",
          variant: "destructive",
        });
        setMetaLoading(false);
        return;
      }

      // Use only the client array (not owned)
      const clientAdAccounts = accountsResponse.data.client || [];

      // Set client ad accounts (empty if none exist)
      setAdAccounts(clientAdAccounts);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "An unexpected error occurred while fetching ad accounts",
        variant: "destructive",
      });
    } finally {
      setMetaLoading(false);
    }
  };

  const handleGhlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!ghlFormData.locationId || !ghlFormData.queryValue) {
      toast({
        title: "Validation Error",
        description: "Sub Account ID and Total Job Booked Amount are required",
        variant: "destructive",
      });
      return;
    }

    // If updating, token is optional (only update if provided)
    // If creating, token is required
    if (!existingGhlClient && !ghlFormData.ghlApiToken) {
      toast({
        title: "Validation Error",
        description: "GHL Integration Token is required when creating a new client",
        variant: "destructive",
      });
      return;
    }

    setGhlLoading(true);
    try {
      if (existingGhlClient) {
        // Update existing client
        const updatePayload: {
          locationId?: string;
          ghlApiToken?: string;
          queryValue?: string;
          queryValue2?: string | null;
          status?: "active" | "inactive";
        } = {
          queryValue: ghlFormData.queryValue,
          queryValue2: "Last Date Tag Changed",
          status: ghlFormData.status,
        };

        // Only include token if provided (for update)
        if (ghlFormData.ghlApiToken) {
          updatePayload.ghlApiToken = ghlFormData.ghlApiToken;
        }

        // Only include locationId if changed
        if (ghlFormData.locationId !== existingGhlClient.locationId) {
          updatePayload.locationId = ghlFormData.locationId;
        }

        const response = await updateGhlClient(
          existingGhlClient.locationId,
          updatePayload
        );

        if (!response.error) {
          toast({
            title: "Success",
            description: "GHL client configuration updated successfully!",
          });
          onRefresh();
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
          locationId: ghlFormData.locationId,
          ghlApiToken: ghlFormData.ghlApiToken,
          queryValue: ghlFormData.queryValue,
          queryValue2: "Last Date Tag Changed",
          revenueProClientId: revenueProClientId,
          status: ghlFormData.status,
        });

        if (!response.error) {
          toast({
            title: "Success",
            description: "GHL client configuration created successfully!",
          });
          onRefresh();
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
      setGhlLoading(false);
    }
  };

  const handleMetaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAdAccount) {
      toast({
        title: "Validation Error",
        description: "Please select an ad account",
        variant: "destructive",
      });
      return;
    }

    setMetaLoading(true);
    try {
      // selectedAdAccount contains the account.id (with act_ prefix), not account.account_id
      const response = await assignAdAccountToClient(
        revenueProClientId,
        selectedAdAccount // This is account.id (e.g., "act_3115069758672562")
      );

      if (!response.error) {
        toast({
          title: "Success",
          description: response.message || "Ad account assigned successfully!",
        });
        // Optionally refresh user data
        onRefresh();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to assign ad account",
          variant: "destructive",
        });
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
      setMetaLoading(false);
    }
  };

  const handleGhlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setGhlFormData((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client Integrations - {userName}</DialogTitle>
          <DialogDescription>
            Manage Meta and GHL integrations for this client.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="meta" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meta">Meta</TabsTrigger>
            <TabsTrigger value="ghl">GHL</TabsTrigger>
          </TabsList>

          {/* Meta Tab */}
          <TabsContent value="meta" className="space-y-4 mt-4">
            <form onSubmit={handleMetaSubmit} className="space-y-4">
              <div>
                <Label htmlFor="adAccount" className="text-card-foreground">
                  Facebook Ad Account <span className="text-red-500">*</span>
                </Label>
                {metaLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading ad accounts...
                    </span>
                  </div>
                ) : adAccounts.length === 0 ? (
                  <div className="mt-1 p-4 border border-border rounded-md bg-muted/50">
                    <p className="text-sm text-muted-foreground text-center">
                      No client ad accounts available
                    </p>
                  </div>
                ) : (
                  <>
                    <Select
                      value={selectedAdAccount}
                      onValueChange={setSelectedAdAccount}
                      disabled={metaLoading}
                    >
                      <SelectTrigger className="mt-1 border-border focus:ring-primary">
                        <SelectValue placeholder="Select an ad account" />
                      </SelectTrigger>
                      <SelectContent>
                        {adAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {/* Using account.id (with act_ prefix) not account.account_id */}
                            {account.name} ({account.account_id}) - {account.currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {adAccounts.length} client ad account{adAccounts.length !== 1 ? "s" : ""}{" "}
                      available
                    </p>
                  </>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:bg-gradient-accent text-primary-foreground"
                  disabled={metaLoading}
                >
                  {metaLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Ad Account"
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* GHL Tab */}
          <TabsContent value="ghl" className="space-y-4 mt-4">
            <form onSubmit={handleGhlSubmit} className="space-y-4">
              {existingGhlClient && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Current Configuration</h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">Sub Account ID:</span>{" "}
                      {existingGhlClient.locationId}
                    </p>
                    <p>
                      <span className="font-medium">Total Job Booked Amount:</span>{" "}
                      {existingGhlClient.queryValue}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          existingGhlClient.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {existingGhlClient.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Horizontal layout for inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="locationId" className="text-card-foreground">
                      Sub Account ID <span className="text-red-500">*</span>
                    </Label>
                    {!existingGhlClient && (
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
                    value={ghlFormData.locationId}
                    onChange={handleGhlChange}
                    required
                    disabled={ghlLoading}
                    placeholder="Enter GHL Sub Account ID"
                    className="mt-1 border-border focus:ring-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ghlApiToken" className="text-card-foreground">
                      GHL Integration Token{" "}
                      {!existingGhlClient && <span className="text-red-500">*</span>}
                    </Label>
                    {!existingGhlClient && (
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
                    value={ghlFormData.ghlApiToken}
                    onChange={handleGhlChange}
                    required={!existingGhlClient}
                    disabled={ghlLoading}
                    placeholder={
                      existingGhlClient
                        ? "Leave empty to keep current token"
                        : "Enter GHL Integration Token"
                    }
                    className="mt-1 border-border focus:ring-primary"
                  />
                  {existingGhlClient && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Token is encrypted and cannot be viewed. Enter a new token to
                      update it.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="queryValue" className="text-card-foreground">
                    Total Job Booked Amount <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="queryValue"
                    type="text"
                    value={ghlFormData.queryValue}
                    onChange={handleGhlChange}
                    required
                    disabled={ghlLoading}
                    placeholder="e.g., 1st - Total Job Amount"
                    className="mt-1 border-border focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The custom field name to search for in GHL
                  </p>
                </div>

                <div>
                  <Label htmlFor="status" className="text-card-foreground">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={ghlFormData.status}
                    onValueChange={(value: "active" | "inactive") =>
                      setGhlFormData((prev) => ({ ...prev, status: value }))
                    }
                    disabled={ghlLoading}
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
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:bg-gradient-accent text-primary-foreground"
                  disabled={ghlLoading}
                >
                  {ghlLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {existingGhlClient ? "Updating..." : "Creating..."}
                    </>
                  ) : existingGhlClient ? (
                    "Update Configuration"
                  ) : (
                    "Create Configuration"
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ClientIntegrationsModal;


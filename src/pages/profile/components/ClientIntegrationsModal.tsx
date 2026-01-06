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
  const [fbPixelId, setFbPixelId] = useState<string>("");
  const [fbPixelToken, setFbPixelToken] = useState<string>("");

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
      setFbPixelId("");
      setFbPixelToken("");
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
      const accountsResponse = await getAdAccounts();
      setAdAccounts(accountsResponse.data || []);
      
      // After ad accounts are loaded, fetch and set client's current fbAdAccountId if it exists
      if (revenueProClientId) {
        try {
          const userProfile = await getUserProfile(revenueProClientId);
          if (!userProfile.error && userProfile.data) {
            // Set the client's current fbAdAccountId in the dropdown
            if (userProfile.data.fbAdAccountId) {
              setSelectedAdAccount(userProfile.data.fbAdAccountId);
            } else {
              setSelectedAdAccount("");
            }

            // Set pixel credentials if they exist
            if (userProfile.data.fbPixelId) {
              setFbPixelId(userProfile.data.fbPixelId);
            }
            // Note: fbPixelToken is never returned for security, so it stays empty
          } else {
            // If no fbAdAccountId exists, leave selection empty for user to select
            setSelectedAdAccount("");
          }
        } catch (error) {
          // If error fetching client profile, leave selection empty
          console.error("Error fetching client profile:", error);
        }
      }
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

    // Validate Pixel ID if provided (should be numeric only)
    if (fbPixelId && !/^\d+$/.test(fbPixelId)) {
      toast({
        title: "Validation Error",
        description: "Facebook Pixel ID must contain only numbers",
        variant: "destructive",
      });
      return;
    }

    setMetaLoading(true);
    try {
      // selectedAdAccount contains the account.id (with act_ prefix), not account.account_id
      const response = await assignAdAccountToClient(
        revenueProClientId,
        selectedAdAccount, // This is account.id (e.g., "act_3115069758672562")
        fbPixelId || undefined,
        fbPixelToken || undefined
      );

      if (!response.error) {
        toast({
          title: "Success",
          description: response.message || "Meta configuration saved successfully!",
        });
        // Optionally refresh user data
        onRefresh();
        // Clear the pixel token field after successful save
        setFbPixelToken("");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to save Meta configuration",
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
      <DialogContent className="p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-semibold text-gray-900">Client Integrations - {userName}</DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-2">
            Manage Meta and GHL integrations for this client.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="meta" className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-0 bg-transparent border-b-2 border-gray-200 p-0 mb-6">
            <TabsTrigger 
              value="meta" 
              className="h-12 px-6 py-3 font-medium text-sm text-gray-500 bg-transparent border-none border-b-2 border-transparent rounded-t-lg transition-all duration-150 cursor-pointer relative box-border flex items-center justify-center -mb-0.5 hover:text-gray-700 hover:bg-gray-50 data-[state=active]:text-gray-900 data-[state=active]:bg-gray-200 data-[state=active]:border-gray-500 data-[state=active]:font-semibold"
            >
              Meta
            </TabsTrigger>
            <TabsTrigger 
              value="ghl" 
              className="h-12 px-6 py-3 font-medium text-sm text-gray-500 bg-transparent border-none border-b-2 border-transparent rounded-t-lg transition-all duration-150 cursor-pointer relative box-border flex items-center justify-center -mb-0.5 hover:text-gray-700 hover:bg-gray-50 data-[state=active]:text-gray-900 data-[state=active]:bg-gray-200 data-[state=active]:border-gray-500 data-[state=active]:font-semibold"
            >
              GHL
            </TabsTrigger>
          </TabsList>

          {/* Meta Tab */}
          <TabsContent value="meta" className="mt-6">
            <form onSubmit={handleMetaSubmit}>
              <div className="mb-6">
                <Label htmlFor="adAccount" className="font-semibold text-sm text-gray-900 mb-2 block">
                  Facebook Ad Account <span className="text-red-600 text-base font-bold ml-0.5">*</span>
                </Label>
                {metaLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-600">
                      Loading ad accounts...
                    </span>
                  </div>
                ) : adAccounts.length === 0 ? (
                  <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-600 text-center">
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
                      <SelectTrigger className="h-11 px-4 py-3 bg-gray-50 border-[1.5px] border-gray-200 rounded-lg text-sm transition-all duration-150 mt-2 hover:border-gray-300 hover:shadow-sm focus:border-gray-500 focus:ring-4 focus:ring-gray-100 focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                        <SelectValue placeholder="Select an ad account" />
                      </SelectTrigger>
                      <SelectContent side="bottom" className="max-h-64">
                        {adAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1.5 leading-snug">
                      {adAccounts.length} client ad account{adAccounts.length !== 1 ? "s" : ""}{" "}
                      available
                    </p>
                  </>
                )}
              </div>

              <div className="mb-6">
                <Label htmlFor="fbPixelId" className="font-semibold text-sm text-gray-900 mb-2 block">
                  Facebook Pixel ID
                </Label>
                <Input
                  id="fbPixelId"
                  type="text"
                  value={fbPixelId}
                  onChange={(e) => setFbPixelId(e.target.value)}
                  disabled={metaLoading}
                  placeholder="Enter Facebook Pixel ID (numeric only)"
                  className="h-11 px-4 py-3 bg-gray-50 border-[1.5px] border-gray-200 rounded-lg text-sm transition-all duration-150 mt-2 w-full hover:border-gray-300 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1.5 leading-snug">
                  Optional: The numeric ID of your Facebook Pixel
                </p>
              </div>

              <div className="mb-6">
                <Label htmlFor="fbPixelToken" className="font-semibold text-sm text-gray-900 mb-2 block">
                  Facebook Pixel Access Token
                </Label>
                <Input
                  id="fbPixelToken"
                  type="password"
                  value={fbPixelToken}
                  onChange={(e) => setFbPixelToken(e.target.value)}
                  disabled={metaLoading}
                  placeholder={fbPixelId ? "Leave empty to keep current token" : "Enter Facebook Pixel Access Token"}
                  className="h-11 px-4 py-3 bg-gray-50 border-[1.5px] border-gray-200 rounded-lg text-sm transition-all duration-150 mt-2 w-full hover:border-gray-300 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1.5 leading-snug">
                  {fbPixelId
                    ? "Token is encrypted and cannot be viewed. Enter a new token to update it."
                    : "Optional: The access token for your Facebook Pixel"}
                </p>
              </div>

              <div className="pt-4 mt-6">
                <Button
                  type="submit"
                  className="h-12 px-6 py-4 font-semibold text-sm rounded-lg transition-all duration-150 shadow-sm w-full bg-gradient-primary hover:bg-gradient-accent text-primary-foreground hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={metaLoading}
                >
                  Save Meta Configuration
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* GHL Tab */}
          <TabsContent value="ghl" className="mt-6">
            <form onSubmit={handleGhlSubmit}>
              {existingGhlClient && (
                <div className="rounded-lg mb-6 pb-4 border-b border-gray-200">
                  <p className="flex justify-end items-center gap-2">
                    <span className="font-semibold text-gray-700">Status:</span>{" "}
                    <span
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center ${
                        existingGhlClient.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {existingGhlClient.status.toUpperCase()}
                    </span>
                  </p>
                </div>
              )}

              {/* Form fields with enhanced spacing */}
              <div className="space-y-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="locationId" className="font-semibold text-sm text-gray-900 block">
                      Sub Account ID <span className="text-red-600 text-base font-bold ml-0.5">*</span>
                    </Label>
                    {!existingGhlClient && (
                      <a
                        href="https://www.loom.com/share/0ff5ef9ea0a249649143ad1105787012"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-blue-600 hover:underline inline-flex items-center gap-1 transition-colors"
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
                    className="h-11 px-4 py-3 bg-gray-50 border-[1.5px] border-gray-200 rounded-lg text-sm transition-all duration-150 w-full hover:border-gray-300 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="ghlApiToken" className="font-semibold text-sm text-gray-900 block">
                      GHL Integration Token{" "}
                      {!existingGhlClient && <span className="text-red-600 text-base font-bold ml-0.5">*</span>}
                    </Label>
                    {!existingGhlClient && (
                      <a
                        href="https://www.loom.com/share/0ff5ef9ea0a249649143ad1105787012"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-blue-600 hover:underline inline-flex items-center gap-1 transition-colors"
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
                    className="h-11 px-4 py-3 bg-gray-50 border-[1.5px] border-gray-200 rounded-lg text-sm transition-all duration-150 w-full hover:border-gray-300 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  />
                  {existingGhlClient && (
                    <p className="text-xs text-gray-500 mt-1.5 leading-snug">
                      Token is encrypted and cannot be viewed. Enter a new token to
                      update it.
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <Label htmlFor="queryValue" className="font-semibold text-sm text-gray-900 mb-2 block">
                    Total Job Booked Amount <span className="text-red-600 text-base font-bold ml-0.5">*</span>
                  </Label>
                  <Input
                    id="queryValue"
                    type="text"
                    value={ghlFormData.queryValue}
                    onChange={handleGhlChange}
                    required
                    disabled={ghlLoading}
                    placeholder="e.g., 1st - Total Job Amount"
                    className="h-11 px-4 py-3 bg-gray-50 border-[1.5px] border-gray-200 rounded-lg text-sm transition-all duration-150 mt-2 w-full hover:border-gray-300 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1.5 leading-snug">
                    The custom field name to search for in GHL
                  </p>
                </div>

                <div className="mb-6">
                  <Label htmlFor="status" className="font-semibold text-sm text-gray-900 mb-2 block">
                    Status <span className="text-red-600 text-base font-bold ml-0.5">*</span>
                  </Label>
                  <Select
                    value={ghlFormData.status}
                    onValueChange={(value: "active" | "inactive") =>
                      setGhlFormData((prev) => ({ ...prev, status: value }))
                    }
                    disabled={ghlLoading}
                  >
                    <SelectTrigger className="h-11 px-4 py-3 bg-gray-50 border-[1.5px] border-gray-200 rounded-lg text-sm transition-all duration-150 mt-2 hover:border-gray-300 hover:shadow-sm focus:border-gray-500 focus:ring-4 focus:ring-gray-100 focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent side="bottom" className="max-h-48">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 mt-6">
                <Button
                  type="submit"
                  className="h-12 px-6 py-4 font-semibold text-sm rounded-lg transition-all duration-150 shadow-sm w-full bg-gradient-primary hover:bg-gradient-accent text-primary-foreground hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
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


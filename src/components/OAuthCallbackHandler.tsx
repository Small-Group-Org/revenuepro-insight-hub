import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

/**
 * Component to handle OAuth callbacks on any route
 * Handles redirects from backend after Meta OAuth flow
 */
export default function OAuthCallbackHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const metaSuccess = urlParams.get("meta_success");
    const metaError = urlParams.get("meta_error");

    // Handle Meta OAuth callback from backend redirect
    if (metaSuccess || metaError) {
      if (metaSuccess === "true") {
        toast({
          title: "Success",
          description: "Meta account connected successfully",
        });
      }

      if (metaError) {
        toast({
          title: "Error",
          description: decodeURIComponent(metaError),
          variant: "destructive",
        });
      }

      // Clean up URL parameters
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location, navigate, toast]);

  return null; // This component doesn't render anything
}


import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, ArrowRight } from "lucide-react";
import { trackUserLogin } from "@/service/trackingService";
import { useToast } from "@/hooks/use-toast";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  privacyPolicyChecked: boolean;
  caPrivacyPolicyChecked: boolean;
  termsConditionsChecked: boolean;
  onPrivacyPolicyChange: (checked: boolean) => void;
  onCaPrivacyPolicyChange: (checked: boolean) => void;
  onTermsConditionsChange: (checked: boolean) => void;
  userId: string;
}

export default function WelcomeModal({ 
  isOpen, 
  onClose, 
  privacyPolicyChecked,
  caPrivacyPolicyChecked,
  termsConditionsChecked,
  onPrivacyPolicyChange,
  onCaPrivacyPolicyChange,
  onTermsConditionsChange,
  userId
}: WelcomeModalProps) {
  const { toast } = useToast();

  const handleGetStarted = async () => {
    try {
      // Call the tracking API
      const response = await trackUserLogin(userId);
      
      if (response.error) {
        toast({
          title: "Error",
          description: "Failed to track login. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // If tracking is successful, close the modal
      onClose();
    } catch (error) {
      console.error("Error in handleGetStarted:", error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Welcome to RevenuePro!
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            You've successfully logged in for the first time. 
            Let's get you started with your revenue analytics journey.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700">
                <strong>Dashboard Overview:</strong> View your key metrics and performance indicators at a glance.
              </p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700">
                <strong>Lead Management:</strong> Track and analyze your leads with our comprehensive lead center.
              </p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700">
                <strong>Target Setting:</strong> Set and monitor your revenue targets and goals.
              </p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700">
                <strong>Analytics & Reports:</strong> Generate detailed reports to make data-driven decisions.
              </p>
            </div>
                     </div>
           
           {/* Policy Checkboxes */}
           <div className="border-t pt-4 mt-6">
             <p className="text-sm font-medium text-gray-700 mb-3">Please agree to our policies to continue:</p>
             <div className="space-y-3">
               <div className="flex items-start space-x-2">
                 <Checkbox 
                   id="privacy-policy-modal" 
                   checked={privacyPolicyChecked}
                   onCheckedChange={(checked) => onPrivacyPolicyChange(checked === true)}
                 />
                 <label htmlFor="privacy-policy-modal" className="text-sm text-gray-600 leading-relaxed">
                   I have read and agreed to the{" "}
                   <a 
                     href="https://getrevpro.co/privacy-policy" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-blue-600 hover:text-blue-800 underline"
                     onClick={(e) => e.stopPropagation()}
                   >
                     Privacy Policy
                   </a>
                 </label>
               </div>
               
               <div className="flex items-start space-x-2">
                 <Checkbox 
                   id="ca-privacy-policy-modal" 
                   checked={caPrivacyPolicyChecked}
                   onCheckedChange={(checked) => onCaPrivacyPolicyChange(checked === true)}
                 />
                 <label htmlFor="ca-privacy-policy-modal" className="text-sm text-gray-600 leading-relaxed">
                   I have read and agreed to the{" "}
                   <a 
                     href="https://getrevpro.co/revenue-pro-california-privacy-policy" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-blue-600 hover:text-blue-800 underline"
                     onClick={(e) => e.stopPropagation()}
                   >
                     CA Privacy Policy
                   </a>
                 </label>
               </div>
               
               <div className="flex items-start space-x-2">
                 <Checkbox 
                   id="terms-conditions-modal" 
                   checked={termsConditionsChecked}
                   onCheckedChange={(checked) => onTermsConditionsChange(checked === true)}
                 />
                 <label htmlFor="terms-conditions-modal" className="text-sm text-gray-600 leading-relaxed">
                   I have read and agreed to the{" "}
                   <a 
                     href="https://getrevpro.co/revenue-pro-terms-and-conditions" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-blue-600 hover:text-blue-800 underline"
                     onClick={(e) => e.stopPropagation()}
                   >
                     Terms and Conditions
                   </a>
                 </label>
               </div>
             </div>
           </div>
         </div>
        
        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleGetStarted}
            disabled={!privacyPolicyChecked || !caPrivacyPolicyChecked || !termsConditionsChecked}
            className="bg-[#1f1c13] hover:bg-[#2a2518] text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Let's Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

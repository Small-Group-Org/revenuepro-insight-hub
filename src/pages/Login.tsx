import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAuthStore from "@/stores/authStore";
import { login } from "@/service/authService";
import { useToast } from "@/hooks/use-toast";
import WelcomeModal from "@/components/WelcomeModal";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [privacyPolicyChecked, setPrivacyPolicyChecked] = useState(false);
  const [caPrivacyPolicyChecked, setCaPrivacyPolicyChecked] = useState(false);
  const [termsConditionsChecked, setTermsConditionsChecked] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setLoggedIn, setUser } = useAuthStore();
  const { toast } = useToast();

  const handleWelcomeModalClose = () => {
    if (!privacyPolicyChecked || !caPrivacyPolicyChecked || !termsConditionsChecked) {
      toast({
        title: "Error",
        description: "Please agree to all policies and terms to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setShowWelcomeModal(false);
    const from = location.state?.from?.pathname || "/";
    navigate(from, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    try {
      const response = await login(email, password);

      if (response.status === 200 && response.data) {
        setUser(response.data.user);
        setLoggedIn();
        
        if (!response.data.user.hasLoggedIn && response.data.user.role === "USER") {
          setShowWelcomeModal(true);
        } else {
          const from = location.state?.from?.pathname || "/";
          navigate(from, { replace: true });
        }
        
        toast({
          title: "Success",
          description: "Successfully logged in",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: '#1f1c13' }}>
      {/* Left Section - 45% */}
      <div className="lg:w-[45%] w-full p-6 sm:p-8 lg:px-12 lg:py-4 flex flex-col gap-4 min-h-[50vh] lg:min-h-screen">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <img 
            src="/logo.png" 
            alt="Revenue Pro Logo" 
            className="w-auto h-8"
          />
        </div>

        {/* Graph Image */}
          <img 
            src="/LoginPageGraph.png" 
            alt="Revenue Analytics Graph" 
            className="h-[55vh] w-auto object-contain rounded-lg"
          />

        {/* Content Section */}
        <div className="text-center">
          <h2 className="text-white font-bold text-2xl my-4 leading-tight">
            See Data Clearly. Change the World.
          </h2>
          <p className="text-gray-300 text-[13px] leading-relaxed max-w-md mx-auto">
            You are on a journey to build an amazing company and make the world a better place. 
            You need exceptional marketing and data to make this happen. RevenuePro allows you to 
            see your marketing data the way it needs to be seen so you can make important decisions.
          </p>
          <p className="text-gray-400 text-xs mt-6">Copyright © HomeownerMarketers</p>
        </div>
      </div>

      {/* Right Section - 55% */}
      <div className="lg:w-[55%] w-full bg-white flex items-center justify-center p-6 sm:p-8 lg:p-12 min-h-[50vh] lg:min-h-screen">
        <div className="w-full max-w-md ">
          {/* Form Header */}
          <div className="text-center space-y-3 mb-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back</h3>
            <p className="text-base text-gray-600">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
                className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-white rounded-lg font-medium shadow-lg transition-colors"
              style={{ backgroundColor: '#1f1c13' }}
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : "Sign In"}
            </Button>
          </form>

          {/* Mobile Copyright */}
          <div className="text-center pt-6">
            <div className="block lg:hidden">
              <p className="text-gray-400 text-xs">Copyright © HomeownerMarketers</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Welcome Modal */}
      <WelcomeModal 
        isOpen={showWelcomeModal}
        onClose={handleWelcomeModalClose}
        privacyPolicyChecked={privacyPolicyChecked}
        caPrivacyPolicyChecked={caPrivacyPolicyChecked}
        termsConditionsChecked={termsConditionsChecked}
        onPrivacyPolicyChange={setPrivacyPolicyChecked}
        onCaPrivacyPolicyChange={setCaPrivacyPolicyChecked}
        onTermsConditionsChange={setTermsConditionsChecked}
        userId={useAuthStore.getState().user?._id || ""}
      />
    </div>
  );
} 
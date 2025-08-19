import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import useAuthStore from "@/stores/authStore";
import { login } from "@/service/authService";
import { useToast } from "@/hooks/use-toast";

export default function NewLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setLoggedIn, setUser } = useAuthStore();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await login(email, password);

      if (response.status === 200 && response.data) {
        setUser(response.data.user);
        setLoggedIn();
        
        // Navigate to the page they were trying to access, or home
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
        
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
      {/* Left Section - 40% */}
      <div className="lg:w-2/5 w-full p-4 sm:p-6 lg:p-12 flex flex-col justify-center relative min-h-[50vh] lg:min-h-screen">
        {/* Logo */}
        <div className="absolute top-6 sm:top-8 lg:top-6 left-4 sm:left-2 lg:left-12 flex items-center gap-3">
          <img 
            src="/favicon.ico" 
            alt="Revenue Pro Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10"
          />
          <h1 className="text-white text-2xl sm:text-3xl font-bold">Revenue Pro</h1>
        </div>

        {/* Login Page Graph */}
        <div className="w-full sm:w-3/4 mx-auto h-48 sm:h-64 lg:h-96 xl:h-[500px] rounded-lg mb-6 sm:mb-8 overflow-hidden border border-gray-700">
          <img 
            src="/LoginPageGraph.png" 
            alt="Revenue Analytics Graph" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Headline and Body Copy */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-white text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight">
            See Data Clearly. Change the World.
          </h2>
          <p className="text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed">
            You are on a journey to build an amazing company and make the world a better place. 
            You need exceptional marketing and data to make this happen. RevenuePro allows you to 
            see your marketing data the way it needs to be seen so you can make important decisions.
          </p>
        </div>

        {/* Copyright */}
        <div className="hidden lg:block absolute bottom-4 sm:bottom-8 left-4 sm:left-8">
          <p className="text-gray-400 text-xs sm:text-sm">Copyright © HomeownerMarketers</p>
        </div>
      </div>

      {/* Right Section - 60% */}
      <div className="lg:w-3/5 w-full bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-[50vh] lg:min-h-screen">
        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          {/* Form Header */}
          <div className="text-center space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome back</h3>
            <p className="text-sm sm:text-base text-gray-600">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
              style={{ backgroundColor: '#1f1c13', hover: { backgroundColor: '#2a251b' } }}
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : "Sign In"}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="text-center space-y-2 pt-4">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-500">
              <a href="#" className="hover:text-gray-700">Privacy Policy</a>
              <a href="#" className="hover:text-gray-700">CA Privacy Policy</a>
              <a href="#" className="hover:text-gray-700">Terms & Conditions</a>
            </div>
            {/* Mobile Copyright */}
            <div className="block lg:hidden pt-4">
              <p className="text-gray-400 text-xs">Copyright © HomeownerMarketers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

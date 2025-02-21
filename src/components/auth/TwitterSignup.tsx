import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { Twitter } from "lucide-react";

interface TwitterSignupProps {
  isLoading?: boolean;
  onSignup: () => void;
}

const TwitterSignup: React.FC<TwitterSignupProps> = ({
  isLoading = false,
  onSignup,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">
            Sign up with Twitter
          </CardTitle>
          <CardDescription>
            Connect your Twitter account to get started with our platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <Twitter className="w-8 h-8 text-white" />
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  By connecting your Twitter account, you'll be able to:
                </p>
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                    Schedule and manage your tweets
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                    Create and organize tweet threads
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                    Analyze your Twitter performance
                  </li>
                </ul>
              </div>

              <Button
                onClick={onSignup}
                disabled={isLoading}
                className="w-full max-w-xs"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Twitter className="w-5 h-5" />
                    <span>Continue with Twitter</span>
                  </div>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                By signing up, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TwitterSignup;

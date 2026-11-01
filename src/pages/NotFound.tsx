import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Home, HelpCircle } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";

export const NotFound: React.FC = () => {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-28 text-center max-w-lg space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-foss-greenLight text-foss-green flex items-center justify-center mx-auto text-2xl font-black font-mono">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-foss-black">
            Page Not Found
          </h1>
          <p className="text-sm text-foss-gray leading-relaxed">
            The page you are looking for does not exist or has been relocated in our
            repository.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button asChild variant="default" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              <span>Back to Homepage</span>
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link to="/about">About Us</Link>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};
export default NotFound;

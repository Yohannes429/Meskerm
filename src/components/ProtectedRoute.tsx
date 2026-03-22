import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles" as any)
        .select("role")
        .eq("id", user.id)
        .single();

      const role = (profileData as any)?.role || user.user_metadata?.role || "student";

      if (!allowedRoles.includes(role)) {
        if (role === "student") navigate("/student-dashboard");
        else if (role === "teacher") navigate("/teacher-dashboard");
        else if (role === "admin") navigate("/admin-dashboard");
        else navigate("/");
        return;
      }

      setAuthorized(true);
      setLoading(false);
    };
    check();
  }, [allowedRoles, navigate]);

  if (loading && !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
};

export default ProtectedRoute;

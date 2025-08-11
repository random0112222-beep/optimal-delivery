import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) {
        setTimeout(() => navigate("/dashboard", { replace: true }), 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard", { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in successfully");
        navigate("/dashboard", { replace: true });
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        toast.info("Check your email to confirm your account");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title={`${mode === "signin" ? "Sign in" : "Sign up"} | Logistics Optimizer`} description="Access your dashboard to plan and optimize delivery routes." />
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md animate-enter">
          <CardHeader>
            <CardTitle>{mode === "signin" ? "Welcome back" : "Create your account"}</CardTitle>
            <CardDescription>
              {mode === "signin" ? "Sign in to your dashboard" : "Sign up with your email and password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading} variant="hero">
                {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>Don't have an account? <button className="story-link" onClick={() => setMode("signup")}>Sign up</button></>
              ) : (
                <>Already have an account? <button className="story-link" onClick={() => setMode("signin")}>Sign in</button></>
              )}
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default Auth;

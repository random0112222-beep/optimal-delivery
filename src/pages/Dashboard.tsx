import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setEmail(data.user?.email ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <>
      <SEO title="Dashboard | Logistics Optimizer" description="Your personal dashboard with route plans and insights." />
      <main className="min-h-screen bg-background px-6 py-10">
        <section className="container mx-auto space-y-6 animate-enter">
          <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Welcome{email ? `, ${email}` : ""}.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/optimizer"><Button variant="secondary">Open Optimizer</Button></Link>
              <Button variant="outline" onClick={signOut}>Sign out</Button>
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Distance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">— km</p>
                <p className="text-sm text-muted-foreground">Aggregate of recent optimizations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fuel Estimate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">— L</p>
                <p className="text-sm text-muted-foreground">Based on vehicle consumption</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saved Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">0</p>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>
          </div>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Your optimization history will appear here.</p>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
};

export default Dashboard;

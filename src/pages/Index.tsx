import { Button } from "@/components/ui/button";
import { Map, Fuel, Clock, BarChart3 } from "lucide-react";
import SEO from "@/components/SEO";

const Index = () => {
  return (
    <>
      <SEO
        title="Logistics Optimizer | Modern Route Planning"
        description="Interactive VRP planner with map, time windows, and multi‑vehicle optimization."
      />
      <header className="w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
        <nav className="container mx-auto flex items-center justify-between py-4">
          <a href="/" className="flex items-center gap-2 story-link">
            <span className="text-base font-semibold tracking-tight">Logistics Optimizer</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/optimizer"><Button variant="secondary" size="sm">Open Optimizer</Button></a>
            <a href="/auth"><Button variant="default" size="sm">Sign in</Button></a>
          </div>
        </nav>
      </header>

      <main className="min-h-[calc(100vh-4rem)] bg-gradient-primary">
        <section className="container mx-auto grid gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6 animate-enter">
            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
              Plan smarter routes. Deliver more, faster.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Optimize multi‑vehicle delivery routes with capacities and time windows. Minimize distance and fuel while visualizing results on an interactive map.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/auth"><Button variant="hero" size="lg" className="hover-scale">Get started free</Button></a>
              <a href="/optimizer"><Button variant="outline" size="lg" className="hover-scale">Try the Optimizer</Button></a>
            </div>
          </div>

          <div className="animate-scale-in">
            <article className="rounded-lg border bg-card p-6 shadow-md">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md bg-secondary p-4">
                  <div className="flex items-center gap-2 text-sm font-medium"><Map className="h-4 w-4"/> Interactive map</div>
                  <p className="mt-2 text-sm text-muted-foreground">Pin depot and stops, drag to reorder, inspect routes.</p>
                </div>
                <div className="rounded-md bg-secondary p-4">
                  <div className="flex items-center gap-2 text-sm font-medium"><Clock className="h-4 w-4"/> Time windows</div>
                  <p className="mt-2 text-sm text-muted-foreground">Respect delivery windows per location.</p>
                </div>
                <div className="rounded-md bg-secondary p-4">
                  <div className="flex items-center gap-2 text-sm font-medium"><Fuel className="h-4 w-4"/> Fuel costs</div>
                  <p className="mt-2 text-sm text-muted-foreground">Account for per‑vehicle fuel consumption.</p>
                </div>
                <div className="rounded-md bg-secondary p-4">
                  <div className="flex items-center gap-2 text-sm font-medium"><BarChart3 className="h-4 w-4"/> Live stats</div>
                  <p className="mt-2 text-sm text-muted-foreground">Distance, fuel, duration and per‑vehicle KPIs.</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="container mx-auto px-6 pb-24 animate-fade-in">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {title: "70 locations", desc: "Add addresses via search or map clicks."},
              {title: "40 vehicles", desc: "Heterogeneous fleets with capacities."},
              {title: "Multi‑objective", desc: "Weighted distance and fuel costs."},
            ].map((f) => (
              <article key={f.title} className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-medium">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Logistics Optimizer</p>
          <a href="https://nominatim.openstreetmap.org/" target="_blank" rel="noreferrer" className="story-link text-sm">Powered by OpenStreetMap</a>
        </div>
      </footer>
    </>
  );
};

export default Index;

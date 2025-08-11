import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <section className="text-center space-y-6 px-6">
        <h1 className="text-5xl font-semibold tracking-tight">Logistics Optimizer</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Plan efficient multi-vehicle delivery routes with capacities and time windows, minimize distance and fuel, and visualize everything on an interactive map.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a href="/optimizer"><Button variant="hero" size="lg">Open Optimizer</Button></a>
          <a href="https://nominatim.openstreetmap.org/" target="_blank" rel="noreferrer"><Button variant="outline" size="lg">Powered by OSM</Button></a>
        </div>
      </section>
    </main>
  );
};

export default Index;

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InteractiveMap, { MapMode } from "@/components/Map/InteractiveMap";
import { DeliveryLocation, LatLng, Vehicle, OptimizeResponse } from "@/types/vrp";
import { toast } from "@/hooks/use-toast";

const randomId = () => Math.random().toString(36).slice(2, 9);

const colorPalette = [
  "#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#be185d", "#059669",
];

const Optimizer = () => {
  const [mode, setMode] = useState<MapMode>('set-depot');
  const [depot, setDepot] = useState<LatLng | null>(null);
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: randomId(), name: 'Van 1', capacity: 100, fuelRate: 0.12 },
  ]);
  const [weights, setWeights] = useState({ distance: 0.5, fuel: 0.5 });
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizeResponse | null>(null);

  const addLocation = (coord: LatLng) => {
    setLocations(prev => [...prev, { id: randomId(), coord, demand: 1 }]);
  };

  const removeLocation = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  const addVehicle = () => setVehicles(v => [...v, { id: randomId(), name: `Van ${v.length+1}` , capacity: 100, fuelRate: 0.12 }]);
  const removeVehicle = (id: string) => setVehicles(v => v.filter(x => x.id !== id));

  const canOptimize = useMemo(() => depot && locations.length > 0 && vehicles.length > 0, [depot, locations.length, vehicles.length]);

  const polylines = useMemo(() => {
    if (!result || !depot) return [] as { points: LatLng[]; color: string }[];
    return result.routes.map((r, idx) => {
      const color = colorPalette[idx % colorPalette.length];
      const points: LatLng[] = [depot!, ...r.stopOrder.map(id => locations.find(l => l.id === id)!.coord), depot!];
      return { points, color };
    });
  }, [result, depot, locations]);

  const handleOptimize = async () => {
    if (!canOptimize || !depot) {
      toast({ title: 'Incomplete input', description: 'Set a depot, add at least one location and one vehicle.' });
      return;
    }
    setOptimizing(true);
    setResult(null);
    try {
      // Build OSRM Table query (depot first, then locations)
      const coords = [depot, ...locations.map(l => l.coord)]
        .map(c => `${c.lng},${c.lat}`)
        .join(';');
      const url = `https://router.project-osrm.org/table/v1/driving/${coords}?annotations=distance,duration`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('OSRM matrix request failed');
      const matrix = await res.json();
      const dist: number[][] = matrix.distances; // meters
      const dur: number[][] = matrix.durations;  // seconds

      // Greedy VRP with capacity constraints (nearest feasible)
      const n = locations.length;
      const unassigned = new Set<number>(Array.from({ length: n }, (_, i) => i + 1)); // 1..n correspond to locations
      const routesIdx: number[][] = vehicles.map(() => []);
      const remainingCap = vehicles.map(v => v.capacity);
      const currentIdx = vehicles.map(() => 0); // start at depot index 0

      while (unassigned.size > 0) {
        let progress = false;
        for (let v = 0; v < vehicles.length; v++) {
          // find nearest feasible next stop
          let bestJ = -1;
          let bestD = Infinity;
          for (const j of unassigned) {
            const demand = locations[j - 1].demand;
            if (demand <= remainingCap[v]) {
              const d = dist[currentIdx[v]][j];
              if (d < bestD) { bestD = d; bestJ = j; }
            }
          }
          if (bestJ !== -1) {
            routesIdx[v].push(bestJ);
            remainingCap[v] -= locations[bestJ - 1].demand;
            currentIdx[v] = bestJ;
            unassigned.delete(bestJ);
            progress = true;
          }
        }
        if (!progress) break; // no feasible insertion
      }

      // Compute stats per route
      const routes = routesIdx.map((stops, v) => {
        let meters = 0;
        let seconds = 0;
        let prev = 0; // depot
        for (const j of stops) {
          meters += dist[prev][j] ?? 0;
          seconds += dur[prev][j] ?? 0;
          prev = j;
        }
        // return to depot
        meters += dist[prev][0] ?? 0;
        seconds += dur[prev][0] ?? 0;
        const km = meters / 1000;
        const min = seconds / 60;
        const fuel = km * vehicles[v].fuelRate;
        return {
          vehicleId: vehicles[v].id,
          stopOrder: stops.map(s => locations[s - 1].id),
          distanceKm: km,
          durationMin: min,
          fuelLiters: fuel,
        };
      });

      const totals = routes.reduce((acc, r) => ({
        distanceKm: acc.distanceKm + r.distanceKm,
        durationMin: acc.durationMin + r.durationMin,
        fuelLiters: acc.fuelLiters + r.fuelLiters,
        cost: 0,
      }), { distanceKm: 0, durationMin: 0, fuelLiters: 0, cost: 0 });

      const cost = weights.distance * totals.distanceKm + weights.fuel * totals.fuelLiters;
      const data: OptimizeResponse = { routes, totals: { ...totals, cost } };
      setResult(data);
      toast({ title: 'Optimization completed', description: 'Routes computed successfully.' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Optimization failed', description: e?.message ?? 'Please try again.' });
    } finally {
      setOptimizing(false);
    }
  };

  const totalLocations = locations.length;

  return (
    <main className="container py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Logistics Optimizer</h1>
        <p className="text-muted-foreground">Plan multi-vehicle delivery routes with capacities and fuel costs, then visualize them on the map.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>Set your depot, add delivery locations, and configure vehicles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="locations">
                <TabsList>
                  <TabsTrigger value="locations">Depot & Locations</TabsTrigger>
                  <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
                  <TabsTrigger value="weights">Weights</TabsTrigger>
                </TabsList>

                <TabsContent value="locations" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label className="min-w-24">Map mode</Label>
                    <div className="flex gap-2">
                      <Button variant={mode==='set-depot'?'hero':'outline'} onClick={() => setMode('set-depot')}>Set Depot</Button>
                      <Button variant={mode==='add-location'?'hero':'outline'} onClick={() => setMode('add-location')}>Add Location</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Depot: {depot ? `${depot.lat.toFixed(4)}, ${depot.lng.toFixed(4)}` : 'Not set'}</div>
                    <div className="text-sm text-muted-foreground">Locations: {totalLocations}</div>
                  </div>

                  {locations.length > 0 && (
                    <div className="rounded-md border overflow-hidden">
                      <div className="grid grid-cols-12 text-xs font-medium bg-muted/50">
                        <div className="p-2 col-span-5">Coordinates</div>
                        <div className="p-2 col-span-3">Demand</div>
                        <div className="p-2 col-span-3">Label</div>
                        <div className="p-2 col-span-1 text-right">Actions</div>
                      </div>
                      {locations.map((l) => (
                        <div key={l.id} className="grid grid-cols-12 items-center border-t">
                          <div className="p-2 col-span-5 text-sm">{l.coord.lat.toFixed(4)}, {l.coord.lng.toFixed(4)}</div>
                          <div className="p-2 col-span-3">
                            <Input type="number" value={l.demand}
                              onChange={(e) => setLocations(prev => prev.map(p => p.id===l.id? { ...p, demand: Number(e.target.value) }: p))} />
                          </div>
                          <div className="p-2 col-span-3">
                            <Input value={l.label ?? ''}
                              onChange={(e) => setLocations(prev => prev.map(p => p.id===l.id? { ...p, label: e.target.value }: p))} />
                          </div>
                          <div className="p-2 col-span-1 text-right">
                            <Button variant="ghost" onClick={() => removeLocation(l.id)}>Remove</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="vehicles" className="space-y-3">
                  <div className="flex items-end gap-3">
                    <div className="space-y-1">
                      <Label>Vehicle name</Label>
                      <Input placeholder="e.g. Van 1" id="veh-name" />
                    </div>
                    <div className="space-y-1">
                      <Label>Capacity</Label>
                      <Input type="number" placeholder="100" id="veh-cap" />
                    </div>
                    <div className="space-y-1">
                      <Label>Fuel rate (L/km)</Label>
                      <Input type="number" step="0.01" placeholder="0.12" id="veh-fuel" />
                    </div>
                    <Button
                      onClick={() => {
                        const name = (document.getElementById('veh-name') as HTMLInputElement)?.value || `Van ${vehicles.length+1}`;
                        const cap = Number((document.getElementById('veh-cap') as HTMLInputElement)?.value || 100);
                        const fuel = Number((document.getElementById('veh-fuel') as HTMLInputElement)?.value || 0.12);
                        setVehicles(v => [...v, { id: randomId(), name, capacity: cap, fuelRate: fuel }]);
                      }}
                    >Add vehicle</Button>
                  </div>

                  <div className="rounded-md border overflow-hidden">
                    <div className="grid grid-cols-12 text-xs font-medium bg-muted/50">
                      <div className="p-2 col-span-5">Name</div>
                      <div className="p-2 col-span-3">Capacity</div>
                      <div className="p-2 col-span-3">Fuel (L/km)</div>
                      <div className="p-2 col-span-1 text-right">Actions</div>
                    </div>
                    {vehicles.map((v) => (
                      <div key={v.id} className="grid grid-cols-12 items-center border-t">
                        <div className="p-2 col-span-5 text-sm">
                          <Input value={v.name} onChange={(e) => setVehicles(prev => prev.map(p => p.id===v.id? { ...p, name: e.target.value }: p))} />
                        </div>
                        <div className="p-2 col-span-3">
                          <Input type="number" value={v.capacity} onChange={(e) => setVehicles(prev => prev.map(p => p.id===v.id? { ...p, capacity: Number(e.target.value) }: p))} />
                        </div>
                        <div className="p-2 col-span-3">
                          <Input type="number" step="0.01" value={v.fuelRate} onChange={(e) => setVehicles(prev => prev.map(p => p.id===v.id? { ...p, fuelRate: Number(e.target.value) }: p))} />
                        </div>
                        <div className="p-2 col-span-1 text-right">
                          <Button variant="ghost" onClick={() => removeVehicle(v.id)}>Remove</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="weights" className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Distance weight</Label>
                      <Input type="number" step="0.1" value={weights.distance}
                        onChange={(e) => setWeights(w => ({ ...w, distance: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fuel weight</Label>
                      <Input type="number" step="0.1" value={weights.fuel}
                        onChange={(e) => setWeights(w => ({ ...w, fuel: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Cost = distance_weight * total_distance + fuel_weight * total_fuel.</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="hero" disabled={!canOptimize || optimizing} onClick={handleOptimize}>
              {optimizing ? 'Optimizing…' : 'Optimize Routes'}
            </Button>
            <Button variant="outline" onClick={() => { setDepot(null); setLocations([]); setResult(null); }}>Reset</Button>
          </div>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>Per-vehicle stats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.routes.map((r, idx) => (
                  <div key={r.vehicleId} className="flex items-center justify-between gap-3 p-3 rounded-md border bg-card">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colorPalette[idx % colorPalette.length] }} />
                      <div className="font-medium">{vehicles.find(v => v.id === r.vehicleId)?.name ?? r.vehicleId}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">Stops: {r.stopOrder.length}</div>
                    <div className="text-sm">{r.distanceKm.toFixed(2)} km</div>
                    <div className="text-sm">{r.durationMin.toFixed(0)} min</div>
                    <div className="text-sm">{r.fuelLiters.toFixed(2)} L</div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-md bg-muted">
                  <div className="font-medium">Totals</div>
                  <div className="text-sm">{result.totals.distanceKm.toFixed(2)} km</div>
                  <div className="text-sm">{result.totals.durationMin.toFixed(0)} min</div>
                  <div className="text-sm">{result.totals.fuelLiters.toFixed(2)} L</div>
                  <div className="text-sm">Cost: {result.totals.cost.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <InteractiveMap
            depot={depot}
            locations={locations}
            polylines={polylines}
            mode={mode}
            onSetDepot={setDepot}
            onAddLocation={addLocation}
          />
          <p className="text-xs text-muted-foreground">Tip: Click the map to {mode === 'set-depot' ? 'set the depot' : 'add locations'}. Switch mode above the map.</p>
        </div>
      </div>
    </main>
  );
};

export default Optimizer;

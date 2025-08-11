export type LatLng = {
  lat: number;
  lng: number;
};

export type TimeWindow = {
  start?: string; // ISO time or HH:mm
  end?: string;   // ISO time or HH:mm
};

export type DeliveryLocation = {
  id: string;
  coord: LatLng;
  demand: number;
  timeWindow?: TimeWindow;
  label?: string;
};

export type Vehicle = {
  id: string;
  name: string;
  capacity: number; // units matching demand
  fuelRate: number; // liters per km
};

export type OptimizeWeights = {
  distance: number; // 0..1
  fuel: number;     // 0..1
};

export type OptimizeRequest = {
  depot: LatLng;
  locations: DeliveryLocation[];
  vehicles: Vehicle[];
  weights?: OptimizeWeights;
};

export type RouteResult = {
  vehicleId: string;
  stopOrder: string[]; // array of location ids in visit order
  distanceKm: number;
  durationMin: number;
  fuelLiters: number;
};

export type OptimizeResponse = {
  routes: RouteResult[];
  totals: {
    distanceKm: number;
    durationMin: number;
    fuelLiters: number;
    cost: number;
  };
};

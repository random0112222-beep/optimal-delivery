import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import L, { LatLng as LeafletLatLng } from 'leaflet';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import marker1x from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { DeliveryLocation, LatLng } from "@/types/vrp";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Fix default icon paths for Leaflet when using bundlers
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker1x,
  shadowUrl: markerShadow,
});

export type MapMode = 'set-depot' | 'add-location';

type Props = {
  depot: LatLng | null;
  locations: DeliveryLocation[];
  polylines?: { points: LatLng[]; color: string }[];
  mode: MapMode;
  onSetDepot: (coord: LatLng) => void;
  onAddLocation: (coord: LatLng) => void;
};

function ClickHandler({ mode, onSetDepot, onAddLocation }: { mode: MapMode; onSetDepot: (c: LatLng)=>void; onAddLocation: (c: LatLng)=>void}) {
  useMapEvents({
    click: (e) => {
      const coord = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (mode === 'set-depot') onSetDepot(coord);
      else onAddLocation(coord);
    }
  });
  return null;
}

export const InteractiveMap = ({ depot, locations, polylines = [], mode, onSetDepot, onAddLocation }: Props) => {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);

  const center = useMemo<LatLng>(() => depot ?? { lat: 40.4168, lng: -3.7038 }, [depot]); // default Madrid

  const onSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      setResults(data ?? []);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const handlePick = (r: { lat: string; lon: string }) => {
    const coord = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
    if (mode === 'set-depot') onSetDepot(coord); else onAddLocation(coord);
    setResults([]);
  };

  useEffect(() => {
    // nothing yet
  }, []);

  return (
    <div className="w-full space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder={mode === 'set-depot' ? 'Search depot address' : 'Search delivery location'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="secondary" onClick={onSearch} disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </Button>
      </div>
      {results.length > 0 && (
        <div className="rounded-md border bg-card text-card-foreground shadow-sm max-h-48 overflow-auto">
          {results.map((r, idx) => (
            <button
              key={`${r.lat}-${r.lon}-${idx}`}
              className="w-full text-left px-3 py-2 hover:bg-muted"
              onClick={() => handlePick(r)}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
      <div className="rounded-lg overflow-hidden border">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={depot ? 11 : 4}
          style={{ height: 420, width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler mode={mode} onSetDepot={onSetDepot} onAddLocation={onAddLocation} />
          {depot && (
            <Marker position={[depot.lat, depot.lng]} />
          )}
          {locations.map((loc) => (
            <Marker key={loc.id} position={[loc.coord.lat, loc.coord.lng]} />
          ))}
          {polylines.map((pl, idx) => (
            <Polyline key={idx} positions={pl.points.map(p => [p.lat, p.lng]) as [number, number][]} pathOptions={{ color: pl.color, weight: 4, opacity: 0.8 }} />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default InteractiveMap;

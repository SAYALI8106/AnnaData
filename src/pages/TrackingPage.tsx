import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Truck, Package, MapPin } from 'lucide-react';

type Delivery = {
  id: string;
  foodId?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropLat?: number;
  dropLng?: number;
  currentLat?: number;
  currentLng?: number;
  status?: string;
};

// ✅ FIX LEAFLET ICON ISSUE
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// STATUS BADGE
const statusBadge: Record<string, string> = {
  in_transit: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  picked_up: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  delivered: 'bg-green-500/10 text-green-500 border-green-500/20',
};

const TrackingPage = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  // 🔥 REALTIME FIREBASE
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'deliveries'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDeliveries(data);
    });

    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Live Tracking
          </h1>

          <p className="text-muted-foreground mb-8">
            Real-time delivery tracking with GPS updates
          </p>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* 🗺️ REAL MAP */}
            <div className="lg:col-span-3">
              <div className="h-[500px] rounded-xl overflow-hidden border">
                <MapContainer
                  center={[19.99, 73.78] as [number, number]}
                  zoom={13}
                  className="h-full w-full"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                  {deliveries.map((d) => (
                    <>
                      {/* DRIVER */}
                      {d.currentLat && d.currentLng && (
                        <Marker position={[d.currentLat, d.currentLng]} />
                      )}

                      {/* PICKUP */}
                      {d.pickupLat && d.pickupLng && (
                        <Marker position={[d.pickupLat, d.pickupLng]} />
                      )}

                      {/* DROP */}
                      {d.dropLat && d.dropLng && (
                        <Marker position={[d.dropLat, d.dropLng]} />
                      )}

                      {/* ROUTE */}
                      {d.pickupLat && d.currentLat && (
                        <Polyline
                          positions={[
                            [d.pickupLat, d.pickupLng],
                            [d.currentLat, d.currentLng],
                            [d.dropLat, d.dropLng],
                          ]}
                        />
                      )}
                    </>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* 📦 DELIVERY LIST */}
            <div className="lg:col-span-2 space-y-4">
              {deliveries.length === 0 && (
                <p className="text-muted-foreground">No active deliveries</p>
              )}

              {deliveries.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-5 border rounded-xl bg-card"
                >
                  {/* HEADER */}
                  <div className="flex justify-between mb-3">
                    <span className="font-semibold text-sm">{d.id}</span>

                    <Badge
                      variant="outline"
                      className={statusBadge[d.status] || ''}
                    >
                      {d.status}
                    </Badge>
                  </div>

                  {/* FOOD */}
                  <p className="text-sm font-medium mb-1">
                    {d.foodId || 'Food Item'}
                  </p>

                  {/* DETAILS */}
                  <div className="text-xs text-muted-foreground mb-3 space-y-1">
                    <p className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Pickup: {d.pickupLat?.toFixed(3)},{' '}
                      {d.pickupLng?.toFixed(3)}
                    </p>

                    <p className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Drop: {d.dropLat?.toFixed(3)}, {d.dropLng?.toFixed(3)}
                    </p>

                    <p className="flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Status: {d.status}
                    </p>
                  </div>

                  {/* SIMPLE PROGRESS */}
                  <div className="flex items-center gap-1">
                    {['picked_up', 'in_transit', 'delivered'].map((s, idx) => (
                      <div key={idx} className="flex items-center gap-1 flex-1">
                        {d.status === s || d.status === 'delivered' ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground/30" />
                        )}

                        {idx < 2 && (
                          <div className="h-0.5 flex-1 bg-muted rounded" />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TrackingPage;

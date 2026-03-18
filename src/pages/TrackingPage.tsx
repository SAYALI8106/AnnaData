import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Truck, Package, MapPin } from "lucide-react";

const activeDeliveries = [
  {
    id: "FB-2847",
    food: "Vegetarian Meals (120 servings)",
    from: "Taj Restaurant",
    to: "Hope Foundation Shelter",
    driver: "Rahul M.",
    status: "in_transit",
    eta: "12 min",
    steps: [
      { label: "Food Listed", done: true },
      { label: "AI Matched", done: true },
      { label: "Picked Up", done: true },
      { label: "In Transit", done: true },
      { label: "Delivered", done: false },
    ],
  },
  {
    id: "FB-2848",
    food: "Assorted Sandwiches (80 servings)",
    from: "Marriott Hotel",
    to: "City Orphanage",
    driver: "Priya S.",
    status: "picked_up",
    eta: "25 min",
    steps: [
      { label: "Food Listed", done: true },
      { label: "AI Matched", done: true },
      { label: "Picked Up", done: true },
      { label: "In Transit", done: false },
      { label: "Delivered", done: false },
    ],
  },
  {
    id: "FB-2846",
    food: "Dal & Rice (150 servings)",
    from: "IIT Hostel Mess",
    to: "Street Care NGO",
    driver: "Amit K.",
    status: "delivered",
    eta: "Completed",
    steps: [
      { label: "Food Listed", done: true },
      { label: "AI Matched", done: true },
      { label: "Picked Up", done: true },
      { label: "In Transit", done: true },
      { label: "Delivered", done: true },
    ],
  },
];

const statusBadge: Record<string, { label: string; className: string }> = {
  in_transit: { label: "In Transit", className: "bg-info/10 text-info border-info/20" },
  picked_up: { label: "Picked Up", className: "bg-warning/10 text-warning border-warning/20" },
  delivered: { label: "Delivered", className: "bg-success/10 text-success border-success/20" },
};

const TrackingPage = () => {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Live Tracking</h1>
          <p className="text-muted-foreground mb-8">Real-time delivery tracking with GPS updates.</p>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Map placeholder */}
            <div className="lg:col-span-3">
              <div className="glass-card-elevated p-1 h-[500px] overflow-hidden">
                <div className="w-full h-full rounded-xl bg-muted flex flex-col items-center justify-center text-muted-foreground relative">
                  <div className="absolute inset-0 opacity-20">
                    {/* Simulated route lines */}
                    <svg className="w-full h-full" viewBox="0 0 600 500">
                      <path d="M100,400 C200,300 300,350 350,200 S450,100 500,150" stroke="hsl(152,55%,28%)" strokeWidth="3" fill="none" strokeDasharray="8,4" />
                      <path d="M80,350 C150,250 250,300 400,150" stroke="hsl(38,92%,55%)" strokeWidth="3" fill="none" strokeDasharray="8,4" />
                      <circle cx="100" cy="400" r="8" fill="hsl(152,55%,28%)" />
                      <circle cx="500" cy="150" r="8" fill="hsl(38,92%,55%)" />
                      <circle cx="350" cy="200" r="6" fill="hsl(200,80%,50%)" className="animate-pulse-glow" />
                      <circle cx="80" cy="350" r="8" fill="hsl(152,55%,28%)" />
                      <circle cx="400" cy="150" r="8" fill="hsl(38,92%,55%)" />
                      <circle cx="250" cy="280" r="6" fill="hsl(200,80%,50%)" className="animate-pulse-glow" />
                    </svg>
                  </div>
                  <MapPin className="w-12 h-12 mb-3 text-primary" />
                  <p className="font-display font-semibold">Live Map View</p>
                  <p className="text-sm">Google Maps / OpenStreetMap integration</p>
                </div>
              </div>
            </div>

            {/* Deliveries list */}
            <div className="lg:col-span-2 space-y-4">
              {activeDeliveries.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card-elevated p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display font-semibold text-foreground text-sm">{d.id}</span>
                    <Badge variant="outline" className={statusBadge[d.status].className}>
                      {statusBadge[d.status].label}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">{d.food}</p>
                  <div className="text-xs text-muted-foreground mb-3 space-y-0.5">
                    <p className="flex items-center gap-1"><Package className="w-3 h-3" />{d.from}</p>
                    <p className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.to}</p>
                    <p className="flex items-center gap-1"><Truck className="w-3 h-3" />{d.driver} · ETA: {d.eta}</p>
                  </div>
                  {/* Progress steps */}
                  <div className="flex items-center gap-1">
                    {d.steps.map((step, si) => (
                      <div key={si} className="flex items-center gap-1 flex-1">
                        {step.done ? (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                        )}
                        {si < d.steps.length - 1 && (
                          <div className={`h-0.5 flex-1 rounded ${step.done ? "bg-primary" : "bg-muted"}`} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-1">
                    {d.steps.map((step, si) => (
                      <span key={si} className={`text-[10px] flex-1 ${step.done ? "text-primary" : "text-muted-foreground/40"}`}>
                        {si === 0 ? "Listed" : si === 1 ? "Matched" : si === 2 ? "Pickup" : si === 3 ? "Transit" : "Done"}
                      </span>
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

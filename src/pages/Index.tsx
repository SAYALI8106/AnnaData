import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Utensils, Truck, Users, BarChart3, Shield, Zap, Globe, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { value: "1.3B", label: "Tons of food wasted yearly", icon: Utensils },
  { value: "828M", label: "People face hunger globally", icon: Users },
  { value: "40%", label: "Food lost in supply chain", icon: TrendingUp },
  { value: "8-10%", label: "Global emissions from waste", icon: Globe },
];

const features = [
  { title: "AI Smart Matching", desc: "Our algorithm matches surplus food to the nearest receivers based on quantity, type, dietary needs, and expiry urgency.", icon: Zap },
  { title: "Route Optimization", desc: "Smart logistics engine calculates the fastest, most fuel-efficient delivery routes across multiple pickups.", icon: Truck },
  { title: "Real-Time Tracking", desc: "Track every donation from pickup to delivery with live GPS updates and ETA notifications.", icon: Clock },
  { title: "Quality Assurance", desc: "AI-powered food safety checks using image recognition and time-based expiry validation.", icon: Shield },
  { title: "Impact Analytics", desc: "Comprehensive dashboards showing meals saved, CO₂ reduced, and community impact metrics.", icon: BarChart3 },
  { title: "Demand Prediction", desc: "ML models predict food demand patterns to proactively coordinate surplus redistribution.", icon: TrendingUp },
];

const steps = [
  { step: "01", title: "Donor Lists Food", desc: "Restaurants and events list surplus food with photos, quantity, and expiry time." },
  { step: "02", title: "AI Matches & Optimizes", desc: "Our engine finds the best receiver match and calculates optimal delivery routes." },
  { step: "03", title: "Smart Pickup", desc: "Nearest volunteer or delivery partner is assigned with turn-by-turn navigation." },
  { step: "04", title: "Verified Delivery", desc: "Food is delivered, quality-verified, and impact is tracked in real-time." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 gradient-hero opacity-80" />
        </div>
        <div className="container mx-auto px-4 relative z-10 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse-glow" />
              AI-Powered Food Rescue Platform
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Every Meal Saved.<br />
              <span className="text-secondary">Every Life Fed.</span>
            </h1>
            <p className="text-primary-foreground/80 text-lg md:text-xl mb-8 max-w-xl font-body">
              FoodBridge connects surplus food from restaurants and events to communities in need using AI matching and smart logistics.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/donate">
                <Button variant="accent" size="lg" className="text-base">
                  Donate Food <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/request">
                <Button variant="heroOutline" size="lg" className="text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  Request Food
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div key={s.label} className="stat-card" custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <s.icon className="w-8 h-8 text-primary" />
                <span className="font-display text-3xl md:text-4xl font-bold text-foreground">{s.value}</span>
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">How FoodBridge Works</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">From surplus to served in under 60 minutes — powered by AI optimization.</p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.step} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative">
                <div className="glass-card-elevated p-6 h-full">
                  <span className="font-display text-5xl font-bold text-primary/15">{s.step}</span>
                  <h3 className="font-display text-lg font-semibold text-foreground mt-2 mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 text-primary/30">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">Powerful Features</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Built for impact. Powered by intelligence.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="glass-card-elevated p-6 hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="gradient-hero rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-secondary blur-3xl" />
              <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-secondary blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
                Join the Food Rescue Movement
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                Whether you're a restaurant with surplus or an NGO serving communities — FoodBridge connects you instantly.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/donate">
                  <Button variant="accent" size="lg">Start Donating</Button>
                </Link>
                <Link to="/request">
                  <Button variant="heroOutline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                    Request Food
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 FoodBridge — Smart Food Waste Redistribution Platform. Built with 💚 for a zero-waste future.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

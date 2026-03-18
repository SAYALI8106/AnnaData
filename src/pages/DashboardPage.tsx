import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Utensils, Truck, Users, Leaf, TrendingUp, ArrowUpRight } from "lucide-react";

const impactStats = [
  { label: "Meals Rescued", value: "12,847", change: "+23%", icon: Utensils },
  { label: "Active Donors", value: "342", change: "+12%", icon: Users },
  { label: "Deliveries Today", value: "47", change: "+8%", icon: Truck },
  { label: "CO₂ Saved (kg)", value: "8,240", change: "+31%", icon: Leaf },
];

const weeklyData = [
  { day: "Mon", meals: 180 },
  { day: "Tue", meals: 240 },
  { day: "Wed", meals: 210 },
  { day: "Thu", meals: 320 },
  { day: "Fri", meals: 280 },
  { day: "Sat", meals: 420 },
  { day: "Sun", meals: 350 },
];

const trendData = [
  { month: "Jan", donated: 3200, received: 2800 },
  { month: "Feb", donated: 3800, received: 3500 },
  { month: "Mar", donated: 4200, received: 3900 },
  { month: "Apr", donated: 4800, received: 4600 },
  { month: "May", donated: 5500, received: 5100 },
  { month: "Jun", donated: 6200, received: 5800 },
];

const foodTypeData = [
  { name: "Cooked", value: 45 },
  { name: "Packaged", value: 25 },
  { name: "Raw", value: 15 },
  { name: "Baked", value: 15 },
];

const COLORS = ["hsl(152,55%,28%)", "hsl(38,92%,55%)", "hsl(200,80%,50%)", "hsl(152,40%,60%)"];

const recentActivity = [
  { time: "2 min ago", text: "Taj Restaurant donated 120 meals → Hope Foundation", type: "donation" },
  { time: "8 min ago", text: "AI matched 80 sandwiches from Marriott → City Orphanage", type: "match" },
  { time: "15 min ago", text: "Delivery completed: Dal & Rice to Street Care NGO", type: "delivery" },
  { time: "22 min ago", text: "New donor registered: Cloud Kitchen Express", type: "registration" },
  { time: "30 min ago", text: "Demand spike predicted for South District — 2 hours", type: "prediction" },
];

const DashboardPage = () => {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Impact Dashboard</h1>
          <p className="text-muted-foreground mb-8">Real-time analytics and AI insights.</p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {impactStats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="stat-card">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="flex items-center gap-0.5 text-xs font-medium text-success">
                    <ArrowUpRight className="w-3 h-3" />{s.change}
                  </span>
                </div>
                <span className="font-display text-2xl md:text-3xl font-bold text-foreground">{s.value}</span>
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Weekly chart */}
            <div className="lg:col-span-2 glass-card-elevated p-6">
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Weekly Meals Rescued
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis axisLine={false} tickLine={false} className="text-xs" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(150,12%,89%)", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="meals" fill="hsl(152,55%,28%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Food type pie */}
            <div className="glass-card-elevated p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">Food Type Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={foodTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {foodTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {foodTypeData.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    {d.name} ({d.value}%)
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Trend chart */}
            <div className="lg:col-span-2 glass-card-elevated p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">Monthly Trend: Donated vs Received</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis axisLine={false} tickLine={false} className="text-xs" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(150,12%,89%)" }} />
                  <Line type="monotone" dataKey="donated" stroke="hsl(152,55%,28%)" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="received" stroke="hsl(38,92%,55%)" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Activity feed */}
            <div className="glass-card-elevated p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">Live Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 animate-pulse-glow" />
                    <div>
                      <p className="text-sm text-foreground">{a.text}</p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;

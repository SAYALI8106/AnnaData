import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Clock, MapPin, Package, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const DonatePage = () => {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    type: "",
    quantity: "",
    description: "",
    location: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "donations"), {
        ...formData,
        status: "pending",
        createdAt: Timestamp.now()
      });

      setSubmitted(true);

      toast({
        title: "Food listing submitted!",
        description: "AI matching started 🚀"
      });

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to submit donation"
      });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card-elevated p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold">Donation Submitted!</h2>
            <Button onClick={() => setSubmitted(false)} className="mt-4">Donate More</Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-bold mb-6">Donate Food</h1>

          <form onSubmit={handleSubmit} className="space-y-6">

            <Input
              placeholder="Quantity"
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
            />

            <Textarea
              placeholder="Description"
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />

            <Input
              placeholder="Location"
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />

            <Button type="submit">Submit</Button>

          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default DonatePage;

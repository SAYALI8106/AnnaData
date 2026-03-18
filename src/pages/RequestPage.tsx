import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";

const RequestPage = () => {
  const { toast } = useToast();
  const [availableFood, setAvailableFood] = useState<any[]>([]);

  // 🔥 REAL-TIME LISTENER
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "donations"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableFood(data);
    });

    return () => unsub();
  }, []);

  // 🔥 REQUEST FUNCTION
  const handleRequest = async (food: any) => {
    await addDoc(collection(db, "requests"), {
      foodId: food.id,
      status: "requested",
      createdAt: new Date()
    });

    toast({
      title: "Request Sent!",
      description: "Delivery partner will be assigned 🚀"
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-bold mb-6">Available Food</h1>

          <div className="space-y-4">
            {availableFood.map((food) => (
              <div key={food.id} className="p-4 border rounded-lg flex justify-between items-center">
                
                <div>
                  <p className="font-semibold">{food.description}</p>
                  <p className="text-sm text-gray-500">
                    {food.quantity} servings • {food.location}
                  </p>
                </div>

                <Button onClick={() => handleRequest(food)}>
                  Request
                </Button>

              </div>
            ))}
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default RequestPage;

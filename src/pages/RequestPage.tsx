import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';

type Food = {
  id: string;
  quantity: string;
  description: string;
  location: string;
  status: string;
  matched?: boolean;
};

const RequestPage = () => {
  const { toast } = useToast();
  const [availableFood, setAvailableFood] = useState<Food[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // 🔥 REAL-TIME LISTENER (ONLY AVAILABLE FOOD)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'donations'), (snapshot) => {
      const data: Food[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();

        return {
          id: docSnap.id,
          quantity: String(d.quantity ?? ''),
          description: String(d.description ?? ''),
          location: String(d.location ?? ''),
          status: String(d.status ?? 'pending'),
          matched: Boolean(d.matched ?? false),
        };
      });

      const filtered: Food[] = data.filter((f) => f.status === 'pending');

      const scoreFood = (food: Food): number => {
        let score = 0;

        score += Number(food.quantity || 0) * 2;

        if (food.description.toLowerCase().includes('urgent')) {
          score += 50;
        }

        return score;
      };

      const sorted: Food[] = [...filtered].sort(
        (a, b) => scoreFood(b) - scoreFood(a)
      );

      setAvailableFood(sorted);
    });

    return () => unsub();
  }, []);
  // 🔥 FULL AUTO MATCH SYSTEM
  const handleRequest = async (food: Food) => {
    try {
      setLoadingId(food.id);

      // 1️⃣ Create request
      const requestRef = await addDoc(collection(db, 'requests'), {
        foodId: food.id,
        status: 'requested',
        createdAt: Timestamp.now(),
      });

      // 2️⃣ Update donation status
      await updateDoc(doc(db, 'donations', food.id), {
        status: 'assigned',
        matched: true,
      });

      // 3️⃣ Create delivery
      const deliveryRef = await addDoc(collection(db, 'deliveries'), {
        foodId: food.id,
        requestId: requestRef.id,
        status: 'assigned',
        driver: 'Auto Assigned',
        eta: '20 min',
        createdAt: Timestamp.now(),
      });

      // 4️⃣ SIMULATE REAL DELIVERY FLOW 🔥
      setTimeout(async () => {
        await updateDoc(doc(db, 'deliveries', deliveryRef.id), {
          status: 'in_transit',
        });
      }, 5000);

      setTimeout(async () => {
        await updateDoc(doc(db, 'deliveries', deliveryRef.id), {
          status: 'delivered',
        });
      }, 10000);

      toast({
        title: 'Matched & Assigned 🚀',
        description: 'Delivery started automatically',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Request failed',
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-bold mb-6">Available Food</h1>

          {/* EMPTY STATE */}
          {availableFood.length === 0 && (
            <p className="text-muted-foreground">No food available right now</p>
          )}

          <div className="space-y-4">
            {availableFood.map((food) => (
              <div
                key={food.id}
                className="p-4 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{food.description}</p>
                  <p className="text-sm text-gray-500">
                    {food.quantity} servings • {food.location}
                  </p>

                  {/* 🔥 AI PRIORITY BADGE */}
                  {food.description?.toLowerCase().includes('urgent') && (
                    <span className="text-xs text-red-500">High Priority</span>
                  )}
                </div>

                <Button
                  onClick={() => handleRequest(food)}
                  disabled={loadingId === food.id}
                >
                  {loadingId === food.id ? 'Processing...' : 'Request'}
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

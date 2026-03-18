import { getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
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
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';

import { useEffect, useState } from 'react';

// ✅ TYPE
type Food = {
  id: string;
  quantity: string;
  description: string;
  location: string;
  status: string;
  expiryTime?: string;
  createdAt?: { seconds: number };
};

const RequestPage = () => {
  const { toast } = useToast();
  const [availableFood, setAvailableFood] = useState<Food[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // 🔥 REAL-TIME LISTENER + SMART SORT
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'donations'), (snapshot) => {
      const data: Food[] = snapshot.docs.map(
        (docSnap: QueryDocumentSnapshot<DocumentData>) => {
          const d = docSnap.data();

          return {
            id: docSnap.id,
            quantity: String(d.quantity ?? ''),
            description: String(d.description ?? ''),
            location: String(d.location ?? ''),
            status: String(d.status ?? 'pending'),
            expiryTime: d.expiryTime ?? '',
            createdAt: d.createdAt ?? null,
          };
        }
      );

      const filtered = data.filter((f) => f.status === 'pending');

      // 🔥 SMART AI SORT
      const scoreFood = (food: Food): number => {
        let score = 0;

        // 1️⃣ Quantity
        const qty = Number(food.quantity || 0);
        score += qty * 2;

        // 2️⃣ Urgent keyword
        if (food.description.toLowerCase().includes('urgent')) {
          score += 50;
        }

        // 3️⃣ Expiry priority
        if (food.expiryTime) {
          const hours =
            (new Date(food.expiryTime).getTime() - Date.now()) /
            (1000 * 60 * 60);

          if (hours <= 2) score += 100;
          else if (hours <= 6) score += 70;
          else if (hours <= 12) score += 40;
        }

        // 4️⃣ Recent (latest first)
        if (food.createdAt?.seconds) {
          score += food.createdAt.seconds / 100000;
        }

        return score;
      };

      const sorted = [...filtered].sort((a, b) => scoreFood(b) - scoreFood(a));

      setAvailableFood(sorted);
    });

    return () => unsub();
  }, []);

  // 🔥 REQUEST FUNCTION (WITH LOCATION)
  const handleRequest = async (food: Food) => {
    try {
      setLoadingId(food.id);

      const user = auth.currentUser;
      if (!user) {
        toast({ title: 'Login Required' });
        return;
      }

      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const donationRef = doc(db, 'donations', food.id);
        const donationSnap = await getDoc(donationRef);

        if (!donationSnap.exists()) return;

        const donationData = donationSnap.data();

        const requestRef = await addDoc(collection(db, 'requests'), {
          foodId: food.id,
          donorId: donationData.userId,
          requesterId: user.uid,
          requesterLat: lat,
          requesterLng: lng,
          requesterLocation: food.location,
          status: 'pending',
          createdAt: Timestamp.now(),
        });

        await updateDoc(doc(db, 'donations', food.id), {
          status: 'assigned',
          matched: true,
        });

        await addDoc(collection(db, 'deliveries'), {
          foodId: food.id,
          requestId: requestRef.id,
          status: 'assigned',
          createdAt: Timestamp.now(),
        });

        toast({
          title: 'Request Sent 🚀',
          description: 'Location shared with donor',
        });
      });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Request failed' });
    } finally {
      setLoadingId(null);
    }
  };

  // 🔥 EXPIRY UI COLOR
  const getExpiryLabel = (expiry?: string) => {
    if (!expiry) return null;

    const hours = (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60);

    if (hours <= 2) return 'text-red-500 ⚠️ Expiring soon';
    if (hours <= 6) return 'text-yellow-500 ⏳ Medium urgency';
    return 'text-green-500 ✅ Safe';
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-bold mb-6">Available Food</h1>

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

                  {/* 🔥 EXPIRY BADGE */}
                  {food.expiryTime && (
                    <p
                      className={`text-xs mt-1 ${getExpiryLabel(food.expiryTime)}`}
                    >
                      {getExpiryLabel(food.expiryTime)}
                    </p>
                  )}

                  {/* 🔥 URGENT */}
                  {food.description.toLowerCase().includes('urgent') && (
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

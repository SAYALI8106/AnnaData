import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { db, auth } from '@/lib/firebase';

// TYPES
type FoodType = 'veg' | 'non-veg' | 'packaged';

type LocationType = {
  lat: number;
  lng: number;
  name: string;
};

const DonatePage = () => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    description: '',
    quantity: '',
    foodType: 'veg' as FoodType,
    expiryTime: '',
  });

  const [location, setLocation] = useState<LocationType | null>(null);
  const [manualLocation, setManualLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);

  const [expiryLevel, setExpiryLevel] = useState<'safe' | 'medium' | 'urgent'>(
    'safe'
  );

  // 🔥 AI SCORE
  useEffect(() => {
    const qty = Number(formData.quantity);
    if (!qty || !formData.expiryTime) return;

    let s = 0;

    s += Math.min(qty * 2, 40);

    const hours =
      (new Date(formData.expiryTime).getTime() - Date.now()) / (1000 * 60 * 60);

    if (hours <= 2) {
      s += 30;
      setExpiryLevel('urgent');
    } else if (hours <= 6) {
      s += 20;
      setExpiryLevel('medium');
    } else {
      setExpiryLevel('safe');
    }

    setScore(s);
  }, [formData]);

  // 🔥 AUTO LOCATION
  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`
        );

        const data = await res.json();

        setLocation({
          lat,
          lng,
          name: `${data.city || data.locality}, ${data.principalSubdivision}`,
        });

        toast({ title: 'Location detected 📍' });
      },
      () => {
        toast({
          title: 'Location Error',
          description: 'Allow location access',
        });
      }
    );
  };

  // SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.description ||
      !formData.quantity ||
      (!location && !manualLocation)
    ) {
      toast({
        title: 'Missing Fields',
        description: 'Fill all fields',
      });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Login Required',
      });
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, 'donations'), {
        ...formData,
        quantity: Number(formData.quantity),
        location: manualLocation || location?.name,
        lat: location?.lat || null,
        lng: location?.lng || null,
        priorityScore: score,
        userId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Donation Added 🚀',
      });

      // RESET
      setFormData({
        description: '',
        quantity: '',
        foodType: 'veg',
        expiryTime: '',
      });

      setScore(0);
      setManualLocation('');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const expiryColor =
    expiryLevel === 'urgent'
      ? 'text-red-500'
      : expiryLevel === 'medium'
        ? 'text-yellow-500'
        : 'text-green-500';

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-xl">
        <h1 className="text-3xl font-bold mb-6">Donate Food</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Textarea
            placeholder="Food description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <Input
            type="number"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: e.target.value })
            }
          />

          {/* FOOD TYPE */}
          <div className="flex gap-2">
            {['veg', 'non-veg', 'packaged'].map((type) => (
              <Button
                key={type}
                type="button"
                variant={formData.foodType === type ? 'default' : 'outline'}
                onClick={() =>
                  setFormData({ ...formData, foodType: type as FoodType })
                }
              >
                {type}
              </Button>
            ))}
          </div>

          {/* EXPIRY */}
          <div>
            <Input
              type="datetime-local"
              value={formData.expiryTime}
              onChange={(e) =>
                setFormData({ ...formData, expiryTime: e.target.value })
              }
            />

            {formData.expiryTime && (
              <p className={`text-sm mt-1 ${expiryColor}`}>
                {expiryLevel === 'urgent'
                  ? '⚠️ Urgent (expires soon)'
                  : expiryLevel === 'medium'
                    ? '⏳ Moderate urgency'
                    : '✅ Safe'}
              </p>
            )}
          </div>

          {/* LOCATION */}
          <div className="space-y-2">
            <Button type="button" onClick={detectLocation}>
              Auto Detect Location
            </Button>

            <Input
              placeholder="Or enter location manually"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
            />

            <p className="text-sm text-muted-foreground">
              📍 {location?.name || 'No auto location'}
            </p>
          </div>

          {/* AI SCORE */}
          {score > 0 && (
            <div className="p-3 bg-muted rounded">
              AI Score: <b>{score}/100</b>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting...' : 'Submit Donation'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DonatePage;

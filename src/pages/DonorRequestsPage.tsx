import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";

import { db, auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

// ✅ TYPE
type Request = {
  id: string;
  foodId: string;
  requesterId: string;
  donorId: string;
  status: string;
  createdAt?: { seconds: number };
  requesterLat?: number;
  requesterLng?: number;
  requesterLocation?: string;

  foodDescription?: string;
  foodLocation?: string;
};

const DonorRequestsPage = () => {
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "requests"), async (snapshot) => {
      const temp: Request[] = [];

      for (const docSnap of snapshot.docs) {
        const d = docSnap.data();

        const req: Request = {
          id: docSnap.id,
          foodId: String(d.foodId ?? ""),
          requesterId: String(d.requesterId ?? ""),
          donorId: String(d.donorId ?? ""),
          status: String(d.status ?? "pending"),
          createdAt: d.createdAt ?? null,
          requesterLat: d.requesterLat ?? null,
          requesterLng: d.requesterLng ?? null,
          requesterLocation: d.requesterLocation ?? "Not Provided",
        };

        // 🔥 FETCH FOOD DETAILS
        if (req.foodId) {
          const foodSnap = await getDoc(doc(db, "donations", req.foodId));
          if (foodSnap.exists()) {
            const foodData = foodSnap.data();
            req.foodDescription = foodData.description ?? "Food Item";
            req.foodLocation = foodData.location ?? "Unknown";
          }
        }

        // 🔥 FILTER ONLY MY REQUESTS
        if (req.donorId === auth.currentUser?.uid) {
          temp.push(req);
        }
      }

      // 🔥 SORT LATEST FIRST
      temp.sort(
        (a, b) =>
          (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );

      setRequests(temp);
    });

    return () => unsub();
  }, []);

  // ✅ ACCEPT FUNCTION (FIXED)
  const handleAccept = async (req: Request) => {
    try {
      if (!auth.currentUser) {
        alert("Login required");
        return;
      }

      const deliveryData = {
        foodId: req.foodId,
        requesterId: req.requesterId,
        donorId: req.donorId,
        requesterLocation: req.requesterLocation || "Not Provided",
        requesterLat: req.requesterLat ?? null,
        requesterLng: req.requesterLng ?? null,
        status: "assigned",
        createdAt: new Date(),
      };

      // 1️⃣ update request
      await updateDoc(doc(db, "requests", req.id), {
        status: "accepted",
      });

      // 2️⃣ update donation
      await updateDoc(doc(db, "donations", req.foodId), {
        status: "assigned",
      });

      // 3️⃣ create delivery
      await addDoc(collection(db, "deliveries"), deliveryData);

      alert("✅ Request Accepted");

    } catch (err) {
      console.error("ACCEPT ERROR:", err);
      alert("❌ Accept failed");
    }
  };

  // ❌ REJECT FUNCTION (FIXED)
  const handleReject = async (req: Request) => {
    try {
      await updateDoc(doc(db, "requests", req.id), {
        status: "rejected",
      });

      alert("❌ Request Rejected");

    } catch (err) {
      console.error("REJECT ERROR:", err);
      alert("❌ Reject failed");
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4">
      <h1 className="text-3xl font-bold mb-6">
        Incoming Requests (Latest First)
      </h1>

      {requests.length === 0 && <p>No requests yet</p>}

      <div className="space-y-4">
        {requests.map((req, index) => (
          <div
            key={req.id}
            className="p-4 border rounded-lg flex justify-between items-center"
          >
            <div>
              {/* 🔥 ORDER */}
              <p className="text-xs text-gray-400">
                Request #{index + 1}
              </p>

              {/* 🔥 FOOD */}
              <p className="font-semibold">
                {req.foodDescription}
              </p>

              <p className="text-sm text-gray-500">
                📍 Pickup: {req.foodLocation}
              </p>

              {/* 🔥 REQUESTER */}
              <p className="text-xs text-blue-500">
                Requested by: {req.requesterId}
              </p>

              {/* 🔥 DELIVERY LOCATION */}
              <p className="text-xs text-green-600">
                Deliver to: {req.requesterLocation}
              </p>

              <p className="text-xs text-gray-400">
                Status: {req.status}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleAccept(req)}
                disabled={req.status === "accepted"}
              >
                Accept
              </Button>

              <Button
                variant="destructive"
                onClick={() => handleReject(req)}
              >
                Reject
              </Button>

              {/* 🔥 NAVIGATION (BONUS) */}
              {req.requesterLat && req.requesterLng && (
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${req.requesterLat},${req.requesterLng}`
                    )
                  }
                >
                  Navigate 📍
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonorRequestsPage;

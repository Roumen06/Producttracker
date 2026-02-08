"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Heart, X, MessageCircle, ShoppingCart } from "lucide-react";

interface BazarActionsProps {
  nalezId: number;
  currentStatus: string;
}

export function BazarActions({ nalezId, currentStatus }: BazarActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/bazary/${nalezId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Chyba při aktualizaci");

      toast({
        title: "Status aktualizován",
        description: `Změněno na: ${newStatus}`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-1">
      {currentStatus !== "interested" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => updateStatus("interested")}
          disabled={loading}
          title="Mám zájem"
        >
          <Heart className="h-4 w-4" />
        </Button>
      )}
      {currentStatus !== "contacted" && currentStatus === "interested" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => updateStatus("contacted")}
          disabled={loading}
          title="Kontaktovat"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      )}
      {currentStatus !== "bought" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => updateStatus("bought")}
          disabled={loading}
          title="Koupeno"
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      )}
      {currentStatus !== "skip" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => updateStatus("skip")}
          disabled={loading}
          title="Přeskočit"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

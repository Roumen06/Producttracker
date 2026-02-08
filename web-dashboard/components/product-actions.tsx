"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { MoreHorizontal, Pencil, Trash2, Check, X, ShoppingCart } from "lucide-react";

interface ProductActionsProps {
  productId: number;
  currentStatus: string;
}

export function ProductActions({ productId, currentStatus }: ProductActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
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

  async function deleteProduct() {
    if (!confirm("Opravdu chcete smazat tento produkt?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Chyba při mazání");

      toast({
        title: "Produkt smazán",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat produkt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/products/${productId}/edit`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Upravit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {currentStatus !== "hledám" && (
          <DropdownMenuItem onClick={() => updateStatus("hledám")}>
            <Check className="mr-2 h-4 w-4" />
            Označit jako hledám
          </DropdownMenuItem>
        )}
        {currentStatus !== "našel" && (
          <DropdownMenuItem onClick={() => updateStatus("našel")}>
            <Check className="mr-2 h-4 w-4 text-green-500" />
            Označit jako našel
          </DropdownMenuItem>
        )}
        {currentStatus !== "koupil" && (
          <DropdownMenuItem onClick={() => updateStatus("koupil")}>
            <ShoppingCart className="mr-2 h-4 w-4 text-purple-500" />
            Označit jako koupil
          </DropdownMenuItem>
        )}
        {currentStatus !== "skip" && (
          <DropdownMenuItem onClick={() => updateStatus("skip")}>
            <X className="mr-2 h-4 w-4 text-gray-500" />
            Přeskočit
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={deleteProduct} className="text-red-500">
          <Trash2 className="mr-2 h-4 w-4" />
          Smazat
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

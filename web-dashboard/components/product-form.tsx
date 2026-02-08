"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface ProductFormProps {
  categories: string[];
  initialData?: {
    id?: number;
    nazev?: string;
    kategorie?: string;
    cenaMin?: number;
    cenaMax?: number;
    priorita?: string;
    url?: string;
  };
}

export function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      nazev: formData.get("nazev") as string,
      kategorie: formData.get("kategorie") as string,
      cenaMin: formData.get("cenaMin") ? Number(formData.get("cenaMin")) : null,
      cenaMax: formData.get("cenaMax") ? Number(formData.get("cenaMax")) : null,
      priorita: formData.get("priorita") as string,
      url: formData.get("url") as string || null,
    };

    try {
      const res = await fetch("/api/products", {
        method: initialData?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData?.id ? { id: initialData.id, ...data } : data),
      });

      if (!res.ok) throw new Error("Chyba při ukládání");

      toast({
        title: initialData?.id ? "Produkt aktualizován" : "Produkt přidán",
        description: data.nazev,
      });

      router.push("/products");
      router.refresh();
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit produkt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="nazev" className="text-sm font-medium">
            Název produktu *
          </label>
          <Input
            id="nazev"
            name="nazev"
            placeholder="např. Rychlovarná konvice Philips"
            defaultValue={initialData?.nazev}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="kategorie" className="text-sm font-medium">
            Kategorie
          </label>
          <Input
            id="kategorie"
            name="kategorie"
            placeholder="např. kuchyně"
            defaultValue={initialData?.kategorie}
            list="categories"
          />
          <datalist id="categories">
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="cenaMin" className="text-sm font-medium">
            Min. cena (Kč)
          </label>
          <Input
            id="cenaMin"
            name="cenaMin"
            type="number"
            min="0"
            placeholder="0"
            defaultValue={initialData?.cenaMin}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="cenaMax" className="text-sm font-medium">
            Max. cena (Kč)
          </label>
          <Input
            id="cenaMax"
            name="cenaMax"
            type="number"
            min="0"
            placeholder="1000"
            defaultValue={initialData?.cenaMax}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="priorita" className="text-sm font-medium">
            Priorita
          </label>
          <Select name="priorita" defaultValue={initialData?.priorita || "medium"}>
            <SelectTrigger>
              <SelectValue placeholder="Vyber prioritu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">🔴 Vysoká</SelectItem>
              <SelectItem value="medium">🟡 Střední</SelectItem>
              <SelectItem value="low">🟢 Nízká</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="url" className="text-sm font-medium">
          URL produktu (volitelné)
        </label>
        <Input
          id="url"
          name="url"
          type="url"
          placeholder="https://..."
          defaultValue={initialData?.url}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={() => router.push("/products")}>
          Zrušit
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Uložit změny" : "Přidat produkt"}
        </Button>
      </div>
    </form>
  );
}

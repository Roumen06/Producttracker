import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatPrice, formatDate, getPriorityColor, getStatusColor } from "@/lib/utils";
import { ProductForm } from "@/components/product-form";
import { ProductActions } from "@/components/product-actions";

async function getProducts(searchParams: { status?: string; kategorie?: string; q?: string }) {
  const where: any = {};
  
  if (searchParams.status) {
    where.status = searchParams.status;
  }
  if (searchParams.kategorie) {
    where.kategorie = searchParams.kategorie;
  }
  if (searchParams.q) {
    where.nazev = { contains: searchParams.q, mode: "insensitive" };
  }

  return prisma.produkt.findMany({
    where,
    orderBy: [
      { priorita: "asc" },
      { datumPridani: "desc" },
    ],
  });
}

async function getCategories() {
  const result = await prisma.produkt.groupBy({
    by: ["kategorie"],
    _count: true,
  });
  return result.filter(r => r.kategorie).map(r => r.kategorie as string);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { status?: string; kategorie?: string; q?: string; add?: string };
}) {
  const [products, categories] = await Promise.all([
    getProducts(searchParams),
    getCategories(),
  ]);

  const showAddForm = searchParams.add === "true";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produkty</h1>
          <p className="text-muted-foreground">
            Spravuj sledované produkty a jejich kritéria
          </p>
        </div>
        <Button className="gap-2" asChild>
          <a href="?add=true">
            <Plus className="h-4 w-4" />
            Přidat produkt
          </a>
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nový produkt</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm categories={categories} />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <form>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="q"
                    placeholder="Hledat produkty..."
                    defaultValue={searchParams.q}
                    className="pl-10"
                  />
                </div>
              </form>
            </div>
            <div className="flex gap-2">
              <Button variant={!searchParams.status ? "default" : "outline"} size="sm" asChild>
                <a href="/products">Vše</a>
              </Button>
              <Button variant={searchParams.status === "hledám" ? "default" : "outline"} size="sm" asChild>
                <a href="?status=hledám">Hledám</a>
              </Button>
              <Button variant={searchParams.status === "našel" ? "default" : "outline"} size="sm" asChild>
                <a href="?status=našel">Našel</a>
              </Button>
              <Button variant={searchParams.status === "koupil" ? "default" : "outline"} size="sm" asChild>
                <a href="?status=koupil">Koupil</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Název</th>
                  <th className="text-left p-4 font-medium">Kategorie</th>
                  <th className="text-left p-4 font-medium">Cena</th>
                  <th className="text-left p-4 font-medium">Priorita</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Přidáno</th>
                  <th className="text-right p-4 font-medium">Akce</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      Žádné produkty k zobrazení
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{product.nazev}</span>
                          {product.url && (
                            <a href={product.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </a>
                          )}
                        </div>
                        {product.claudeReason && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                            {product.claudeReason}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{product.kategorie || "—"}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {product.cenaAktualni && (
                            <span className="font-bold text-green-500">
                              {formatPrice(Number(product.cenaAktualni))}
                            </span>
                          )}
                          {product.cenaMin || product.cenaMax ? (
                            <span className="text-muted-foreground ml-1">
                              ({formatPrice(Number(product.cenaMin || 0))} - {formatPrice(Number(product.cenaMax || "∞"))})
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getPriorityColor(product.priorita)}>
                          {product.priorita}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(product.status)}>
                          {product.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(product.datumPridani)}
                      </td>
                      <td className="p-4">
                        <ProductActions productId={product.id} currentStatus={product.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

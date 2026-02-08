import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Bell,
  Search,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatPrice, formatRelativeDate, getConfidenceColor } from "@/lib/utils";

async function getStats() {
  const [produktyCount, bazaryCount, koupeno] = await Promise.all([
    prisma.produkt.count({ where: { status: "hledám" } }),
    prisma.bazarovyNalez.count({ where: { status: "new" } }),
    prisma.produkt.count({ where: { status: "koupil" } }),
  ]);

  const usetreno = await prisma.produkt.aggregate({
    where: {
      status: "koupil",
      cenaAktualni: { not: null },
      cenaMax: { not: null },
    },
    _sum: { cenaMax: true, cenaAktualni: true },
  });

  const saved =
    Number(usetreno._sum.cenaMax || 0) - Number(usetreno._sum.cenaAktualni || 0);

  return { produktyCount, bazaryCount, koupeno, usetreno: saved > 0 ? saved : 0 };
}

async function getRecentFinds() {
  return prisma.bazarovyNalez.findMany({
    where: { status: "new" },
    orderBy: { datumNalezeni: "desc" },
    take: 6,
    include: { matchedProdukt: true },
  });
}

async function getActiveProducts() {
  return prisma.produkt.findMany({
    where: { status: "hledám" },
    orderBy: [{ priorita: "asc" }, { datumPridani: "desc" }],
    take: 5,
  });
}

export default async function DashboardPage() {
  const [stats, recentFinds, activeProducts] = await Promise.all([
    getStats(),
    getRecentFinds(),
    getActiveProducts(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Přehled sledovaných produktů a nálezů
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/products">
            <Button variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              Prohledat
            </Button>
          </Link>
          <Link href="/products?add=true">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Přidat produkt
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivně hledám</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.produktyCount}</div>
            <p className="text-xs text-muted-foreground">produktů ke sledování</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nové nálezy</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bazaryCount}</div>
            <p className="text-xs text-muted-foreground">čeká na posouzení</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Koupeno</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.koupeno}</div>
            <p className="text-xs text-muted-foreground">úspěšných nákupů</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ušetřeno</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatPrice(stats.usetreno)}
            </div>
            <p className="text-xs text-muted-foreground">oproti max. rozpočtu</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Finds */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Nejnovější nálezy</CardTitle>
              <CardDescription>Bazarové nabídky ke kontrole</CardDescription>
            </div>
            <Link href="/bazary">
              <Button variant="ghost" size="sm" className="gap-1">
                Vše <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFinds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Zatím žádné nálezy
                </p>
              ) : (
                recentFinds.map((find) => (
                  <div
                    key={find.id}
                    className="flex items-center gap-4 rounded-lg border p-3"
                  >
                    {find.fotoUrl && (
                      <img
                        src={find.fotoUrl}
                        alt={find.nazev}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{find.nazev}</p>
                      <p className="text-sm text-muted-foreground">
                        {find.zdroj} • {formatRelativeDate(find.datumNalezeni)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-500">
                        {formatPrice(Number(find.cena))}
                      </p>
                      <Badge
                        variant="outline"
                        className={getConfidenceColor(find.claudeConfidence)}
                      >
                        {find.claudeConfidence}/10
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sledované produkty</CardTitle>
              <CardDescription>Aktivně hledané položky</CardDescription>
            </div>
            <Link href="/products">
              <Button variant="ghost" size="sm" className="gap-1">
                Vše <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Zatím žádné sledované produkty
                </p>
              ) : (
                activeProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.nazev}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.kategorie || "Bez kategorie"}
                      </p>
                    </div>
                    <div className="text-right">
                      {product.cenaMax && (
                        <p className="text-sm">
                          max {formatPrice(Number(product.cenaMax))}
                        </p>
                      )}
                      <Badge
                        variant="outline"
                        className={
                          product.priorita === "high"
                            ? "text-red-500"
                            : product.priorita === "medium"
                            ? "text-yellow-500"
                            : "text-green-500"
                        }
                      >
                        {product.priorita}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

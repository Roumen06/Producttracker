import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [produktyCount, bazaryCount, koupeno, kategorieCount] = await Promise.all([
      prisma.produkt.count({ where: { status: "hledám" } }),
      prisma.bazarovyNalez.count({ where: { status: "new" } }),
      prisma.produkt.count({ where: { status: "koupil" } }),
      prisma.produkt.groupBy({ by: ["kategorie"], _count: true }),
    ]);

    const usetreno = await prisma.produkt.aggregate({
      where: {
        status: "koupil",
        cenaAktualni: { not: null },
        cenaMax: { not: null },
      },
      _sum: { cenaMax: true, cenaAktualni: true },
    });

    const saved = Number(usetreno._sum.cenaMax || 0) - Number(usetreno._sum.cenaAktualni || 0);

    return NextResponse.json({
      aktivniHledani: produktyCount,
      noveNalezy: bazaryCount,
      koupeno,
      usetreno: saved > 0 ? saved : 0,
      pocetKategorii: kategorieCount.length,
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "Chyba při načítání statistik" }, { status: 500 });
  }
}

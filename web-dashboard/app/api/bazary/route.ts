import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const produktId = searchParams.get("produktId");

    const where: any = {};
    if (status) where.status = status;
    if (produktId) where.produktId = parseInt(produktId);

    const nalezy = await prisma.bazarovyNalez.findMany({
      where,
      orderBy: { datumNalezeni: "desc" },
      take: 100,
      include: {
        produkt: true,
      },
    });

    return NextResponse.json(nalezy);
  } catch (error) {
    console.error("GET /api/bazary error:", error);
    return NextResponse.json({ error: "Chyba při načítání nálezů" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const nalez = await prisma.bazarovyNalez.create({
      data: {
        produktId: body.produktId,
        nazev: body.nazev,
        cena: body.cena ? parseFloat(body.cena) : null,
        url: body.url,
        zdroj: body.zdroj || "manual",
        popis: body.popis || null,
        lokalita: body.lokalita || null,
        hodnoceniAi: body.hodnoceniAi || null,
        status: body.status || "new",
      },
    });

    return NextResponse.json(nalez, { status: 201 });
  } catch (error) {
    console.error("POST /api/bazary error:", error);
    return NextResponse.json({ error: "Chyba při vytváření nálezu" }, { status: 500 });
  }
}

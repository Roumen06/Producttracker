import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const kategorie = searchParams.get("kategorie");
    const q = searchParams.get("q");

    const where: any = {};
    if (status) where.status = status;
    if (kategorie) where.kategorie = kategorie;
    if (q) where.nazev = { contains: q, mode: "insensitive" };

    const products = await prisma.produkt.findMany({
      where,
      orderBy: [{ priorita: "asc" }, { datumPridani: "desc" }],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Chyba při načítání produktů" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const product = await prisma.produkt.create({
      data: {
        nazev: body.nazev,
        kategorie: body.kategorie || null,
        cenaMin: body.cenaMin ? parseFloat(body.cenaMin) : null,
        cenaMax: body.cenaMax ? parseFloat(body.cenaMax) : null,
        priorita: body.priorita || "medium",
        status: body.status || "hledám",
        zdroj: body.zdroj || "web",
        url: body.url || null,
        parametry: body.parametry || {},
        userId: body.userId || null,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Chyba při vytváření produktu" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Chybí ID produktu" }, { status: 400 });
    }

    const product = await prisma.produkt.update({
      where: { id: body.id },
      data: {
        ...(body.nazev && { nazev: body.nazev }),
        ...(body.kategorie !== undefined && { kategorie: body.kategorie }),
        ...(body.cenaMin !== undefined && { cenaMin: body.cenaMin ? parseFloat(body.cenaMin) : null }),
        ...(body.cenaMax !== undefined && { cenaMax: body.cenaMax ? parseFloat(body.cenaMax) : null }),
        ...(body.priorita && { priorita: body.priorita }),
        ...(body.status && { status: body.status }),
        ...(body.url !== undefined && { url: body.url }),
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("PATCH /api/products error:", error);
    return NextResponse.json({ error: "Chyba při aktualizaci produktu" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const product = await prisma.produkt.findUnique({
      where: { id },
      include: { bazaroveNalezy: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Produkt nenalezen" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json({ error: "Chyba při načítání produktu" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    const product = await prisma.produkt.update({
      where: { id },
      data: {
        ...(body.nazev && { nazev: body.nazev }),
        ...(body.kategorie !== undefined && { kategorie: body.kategorie }),
        ...(body.cenaAktualni !== undefined && { cenaAktualni: body.cenaAktualni }),
        ...(body.cenaMin !== undefined && { cenaMin: body.cenaMin }),
        ...(body.cenaMax !== undefined && { cenaMax: body.cenaMax }),
        ...(body.priorita && { priorita: body.priorita }),
        ...(body.status && { status: body.status }),
        ...(body.url !== undefined && { url: body.url }),
        ...(body.parametry && { parametry: body.parametry }),
        ...(body.claudeScore !== undefined && { claudeScore: body.claudeScore }),
        ...(body.claudeReason !== undefined && { claudeReason: body.claudeReason }),
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("PATCH /api/products/[id] error:", error);
    return NextResponse.json({ error: "Chyba při aktualizaci produktu" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    await prisma.produkt.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json({ error: "Chyba při mazání produktu" }, { status: 500 });
  }
}

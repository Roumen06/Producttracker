import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    const nalez = await prisma.bazarovyNalez.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
      },
    });

    return NextResponse.json(nalez);
  } catch (error) {
    console.error("PATCH /api/bazary/[id] error:", error);
    return NextResponse.json({ error: "Chyba při aktualizaci" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    await prisma.bazarovyNalez.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/bazary/[id] error:", error);
    return NextResponse.json({ error: "Chyba při mazání" }, { status: 500 });
  }
}

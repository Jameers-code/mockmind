import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        sessions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(user?.sessions || []);
  } catch (error) {
    console.warn("Database fetch failed (SQLite read-only fallback):", error);
    return NextResponse.json([]);
  }
}

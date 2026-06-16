import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const building = await prisma.building.findUnique({
    where: { id },
    include: {
      images: { orderBy: { isPrimary: 'desc' } },
      contacts: true,
      inspections: { orderBy: { inspectionDate: 'desc' } },
    },
  });

  if (!building) {
    return NextResponse.json({ error: 'Building not found' }, { status: 404 });
  }

  return NextResponse.json(building);
}

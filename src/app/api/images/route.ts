import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const buildingId = new URL(request.url).searchParams.get('buildingId');
  if (!buildingId) {
    return NextResponse.json({ error: 'buildingId required' }, { status: 400 });
  }

  const images = await prisma.buildingImage.findMany({
    where: { buildingId },
    orderBy: { isPrimary: 'desc' },
  });

  return NextResponse.json(images);
}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') || undefined;
  const segment = searchParams.get('segment') || undefined;
  const priority = searchParams.get('priority') || undefined;
  const zone = searchParams.get('zone') || undefined;
  const fireSystemStatus = searchParams.get('fireSystemStatus') || undefined;
  const search = searchParams.get('search') || undefined;
  const sortBy = searchParams.get('sortBy') || 'priority';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const where: any = {};
  if (city) where.city = city;
  if (segment) where.segment = segment;
  if (priority) where.priority = priority;
  if (zone) where.zone = zone;
  if (fireSystemStatus) where.fireSystemStatus = fireSystemStatus;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }

  let orderBy: any = { scoreTotal: sortOrder === 'asc' ? 'asc' : 'desc' };
  if (sortBy === 'name') orderBy = { name: sortOrder as 'asc' | 'desc' };
  if (sortBy === 'yearBuilt') orderBy = { yearBuilt: sortOrder as 'asc' | 'desc' };
  if (sortBy === 'city') orderBy = { city: 'asc' as const };

  const buildings = await prisma.building.findMany({
    where,
    orderBy,
    include: {
      images: { orderBy: { isPrimary: 'desc' } },
      contacts: true,
      inspections: { orderBy: { inspectionDate: 'desc' } },
    },
  });

  const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  if (sortBy === 'priority') {
    buildings.sort((a: { priority: string }, b: { priority: string }) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      return dir * ((priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0));
    });
  }

  return NextResponse.json(buildings);
}

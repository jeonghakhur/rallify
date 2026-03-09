import { getAllGames } from '@/service/games';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  return getAllGames(status, startDate, endDate).then((data) =>
    NextResponse.json(data)
  );
}

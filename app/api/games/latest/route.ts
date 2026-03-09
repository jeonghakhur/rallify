import { getLatestGameByStatus } from '@/service/games';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  return getLatestGameByStatus(status).then((data) => NextResponse.json(data));
}

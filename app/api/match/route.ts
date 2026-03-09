import { getAllGames } from '@/service/games';
import { NextResponse } from 'next/server';

export async function GET() {
  return getAllGames().then((data) => NextResponse.json(data));
}

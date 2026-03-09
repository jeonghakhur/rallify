import { getStatsPeriod, setStatsPeriod } from '@/service/schedule';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return withSessionUser(async () =>
    getStatsPeriod().then((data) => NextResponse.json(data))
  );
}

export async function POST(req: NextRequest) {
  return withSessionUser(async () => {
    const body = await req.json();
    const { startDate, endDate } = body;
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: '시작일과 종료일이 필요합니다.' },
        { status: 400 }
      );
    }
    return setStatsPeriod(startDate, endDate).then((data) =>
      NextResponse.json(data)
    );
  });
}

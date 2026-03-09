import { ScheduleFormSchema } from '@/model/schedule';
import { createSchedule, getAllSchedule } from '@/service/schedule';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return getAllSchedule().then((data) => NextResponse.json(data));
}

export async function POST(req: NextRequest) {
  return withSessionUser(async (user) => {
    console.log('🔍 POST /api/schedule 시작');
    console.log('👤 현재 사용자:', user);

    // 사용자 정보 유효성 확인
    if (!user || !user.id) {
      console.error('❌ 유효하지 않은 사용자 정보:', user);
      return NextResponse.json(
        {
          error: '사용자 인증에 실패했습니다.',
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    body.date = new Date(body.date);

    console.log('🔍 API에서 받은 데이터:', body);

    // status가 없으면 기본값 설정
    if (!body.status) {
      body.status = 'pending';
      console.log('⚠️ status가 없어서 기본값으로 설정:', body.status);
    }

    console.log('📋 Zod 검증 전 데이터:', body);

    try {
      const validatedData = ScheduleFormSchema.parse(body);
      console.log('✅ Zod 검증 완료된 데이터:', validatedData);

      const result = await createSchedule(user.id, validatedData);
      console.log('💾 Sanity에 저장된 데이터:', result);

      return NextResponse.json(result);
    } catch (error) {
      console.error('❌ 스케줄 생성 중 오류:', error);
      return NextResponse.json(
        {
          error: '스케줄 생성에 실패했습니다.',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      );
    }
  });
}

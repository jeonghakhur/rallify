import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔍 POST /api/schedule/[id]/comments 시작');

  return await withSessionUser(async (user) => {
    console.log('✅ 인증 성공');

    const { id } = await params;
    console.log('📋 스케줄 ID:', id);

    const body = await request.json();
    console.log('📦 요청 본문:', body);

    const { comment } = body;

    // 코멘트 데이터 검증
    if (!comment || !comment.text || typeof comment.text !== 'string') {
      console.log('❌ 유효하지 않은 코멘트 데이터:', comment);
      return NextResponse.json(
        { error: '유효하지 않은 코멘트 데이터입니다.' },
        { status: 400 }
      );
    }

    try {
      console.log('💾 Sanity에 코멘트 저장 중...');

      // Sanity 스키마에 맞게 데이터 변환
      const sanitizedComment = {
        author: { _ref: user.id, _type: 'reference' },
        text: comment.text,
        createdAt: new Date().toISOString(),
      };

      console.log('🔧 변환된 코멘트 데이터:', sanitizedComment);

      const result = await client
        .patch(id)
        .setIfMissing({ comments: [] })
        .append('comments', [sanitizedComment])
        .commit({ autoGenerateArrayKeys: true });

      console.log('✅ 코멘트 저장 성공:', result);
      return NextResponse.json(result);
    } catch (error) {
      console.error('❌ 코멘트 추가 중 오류:', error);
      return NextResponse.json(
        { error: '코멘트 추가 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return await withSessionUser(async () => {
    const { id } = await params;
    const { commentKey } = await request.json();

    try {
      const schedule = await client.getDocument(id);
      if (!schedule) {
        return NextResponse.json(
          { error: '스케줄을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const updatedComments = (schedule.comments || []).filter(
        (comment: { _key: string }) => comment._key !== commentKey
      );

      const result = await client
        .patch(id)
        .set({ comments: updatedComments })
        .commit({ autoGenerateArrayKeys: true });

      return NextResponse.json(result);
    } catch (error) {
      console.error('코멘트 삭제 중 오류:', error);
      return NextResponse.json(
        { error: '코멘트 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  });
}

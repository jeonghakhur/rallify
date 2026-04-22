import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';
import {
  addCommentToSchedule,
  removeCommentFromSchedule,
} from '@/service/schedule';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return await withSessionUser(async (user) => {
    const { id } = await params;
    const body = await request.json();
    const { comment } = body;

    if (!comment || !comment.text || typeof comment.text !== 'string') {
      return NextResponse.json(
        { error: '유효하지 않은 코멘트 데이터입니다.' },
        { status: 400 }
      );
    }

    try {
      const result = await addCommentToSchedule(id, {
        authorId: user.id,
        text: comment.text,
      });

      return NextResponse.json(result);
    } catch (error) {
      console.error('코멘트 추가 중 오류:', error);
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
      await removeCommentFromSchedule(id, commentKey);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('코멘트 삭제 중 오류:', error);
      return NextResponse.json(
        { error: '코멘트 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  });
}

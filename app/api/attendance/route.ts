import {
  addAttendance,
  removeAttendance,
  updateAttendance,
} from '@/service/schedule';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return withSessionUser(async (user) => {
    const { scheduleId, attendance } = await req.json();

    // 대리 등록(관리자가 다른 회원/게스트 추가) 시 세션 사용자 ID가 아닌
    // 요청 본문의 userId를 저장한다. 게스트는 ''로 전달되어 null로 저장됨.
    const attendeeUserId = attendance?.userId ?? user.id;

    return addAttendance(scheduleId, attendance, attendeeUserId).then((data) =>
      NextResponse.json(data)
    );
  });
}

export async function PATCH(req: NextRequest) {
  return withSessionUser(async () => {
    const { scheduleId, attendance } = await req.json();

    return updateAttendance(scheduleId, attendance).then((data) =>
      NextResponse.json(data)
    );
  });
}

export async function DELETE(req: NextRequest) {
  return withSessionUser(async () => {
    const { scheduleId, attendeeKey } = await req.json();

    return removeAttendance(scheduleId, attendeeKey).then((data) =>
      NextResponse.json(data)
    );
  });
}

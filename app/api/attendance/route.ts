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

    return addAttendance(scheduleId, attendance, user.id).then((data) =>
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

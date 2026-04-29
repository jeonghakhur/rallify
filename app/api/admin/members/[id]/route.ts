import { updateUserById, deleteUserById } from '@/service/user';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mail';
import {
  signupApprovedTemplate,
  signupRejectedTemplate,
} from '@/lib/email-templates';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Context) {
  const { id } = await context.params;
  const body = await req.json();

  return withSessionUser(async (user) => {
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const before = await prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true, name: true },
    });

    // level 변경 시 role도 동기화
    const roleMap: Record<number, string> = {
      0: 'PENDING',
      1: 'USER',
      2: 'USER',
      3: 'USER',
    };
    const newRole =
      body.level >= 4 ? 'SUPER_ADMIN' : (roleMap[body.level] ?? 'USER');
    const result = await updateUserById(id, {
      level: body.level,
      role: newRole,
    });

    // PENDING → 비PENDING 전환 시에만 승인 메일
    if (before?.role === 'PENDING' && newRole !== 'PENDING' && before.email) {
      try {
        const tpl = signupApprovedTemplate(before.name ?? '회원');
        await sendMail({
          to: before.email,
          subject: tpl.subject,
          html: tpl.html,
        });
      } catch (err) {
        console.error('[admin] failed to send approval mail', err);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...safeResult } = result as typeof result & {
      password?: string;
    };
    return NextResponse.json(safeResult);
  });
}

export async function DELETE(_: NextRequest, context: Context) {
  const { id } = await context.params;

  return withSessionUser(async (user) => {
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }
    if (user.id === id) {
      return NextResponse.json(
        { error: '자기 자신은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true, name: true },
    });

    // PENDING 사용자 삭제 = 가입 거절 → 삭제 전 메일 발송
    if (target?.role === 'PENDING' && target.email) {
      try {
        const tpl = signupRejectedTemplate(target.name ?? '회원');
        await sendMail({
          to: target.email,
          subject: tpl.subject,
          html: tpl.html,
        });
      } catch (err) {
        console.error('[admin] failed to send rejection mail', err);
      }
    }

    try {
      await deleteUserById(id);
      return NextResponse.json({ success: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      if (message.includes('Foreign key') || message.includes('P2003')) {
        return NextResponse.json(
          {
            error:
              '이 회원에게 연결된 데이터가 있어 삭제할 수 없습니다. (작성한 게시물·댓글·일정 등)',
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: '삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  });
}

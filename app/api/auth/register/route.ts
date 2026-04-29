import { createEmailUser, existingUser } from '@/service/user';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sendMail } from '@/lib/mail';
import { signupReceivedTemplate } from '@/lib/email-templates';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, name, gender } = body;

  if (!email || !password || !name || !gender) {
    return NextResponse.json(
      { error: '모든 항목을 입력해주세요.' },
      { status: 422 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: '패스워드는 8자 이상이어야 합니다.' },
      { status: 422 }
    );
  }

  const existing = await existingUser(email);
  if (existing) {
    return NextResponse.json(
      { error: '이미 사용 중인 이메일입니다.' },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await createEmailUser({
    email,
    password: hashedPassword,
    name,
    gender,
  });

  // 신청 접수 메일 발송 (실패해도 가입 자체는 성공 처리)
  try {
    const tpl = signupReceivedTemplate(name);
    await sendMail({ to: email, subject: tpl.subject, html: tpl.html });
  } catch (err) {
    console.error('[signup] failed to send received mail', err);
  }

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
}

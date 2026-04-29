import { PrismaAdapter } from '@auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';
import NaverProvider from 'next-auth/providers/naver';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { encryptField } from '@/util/encryption';
import { sendMail } from '@/lib/mail';
import { signupReceivedTemplate } from '@/lib/email-templates';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID || '',
      clientSecret: process.env.NAVER_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: 'name email gender mobile birthday birthyear',
        },
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;
        if (user.role === 'PENDING') {
          throw new Error('PENDING_APPROVAL');
        }
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email || !account) return false;

      if (account.provider === 'credentials') return true;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        if (
          existingUser.provider &&
          existingUser.provider !== account.provider
        ) {
          return `/auth/signin?error=ALREADY_REGISTERED`;
        }

        if (existingUser.role === 'PENDING') {
          return `/auth/signin?error=PENDING_APPROVAL`;
        }

        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (!existingAccount) {
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token ?? null,
              refresh_token: account.refresh_token ?? null,
              expires_at: account.expires_at ?? null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
            },
          });
        }

        return true;
      }

      let userName = user.name;
      const naverProfile = profile as
        | {
            response?: {
              name?: string;
              gender?: string;
              mobile?: string;
              birthday?: string;
              birthyear?: string;
            };
          }
        | undefined;
      if (
        account.provider === 'naver' &&
        !userName &&
        naverProfile?.response?.name
      ) {
        userName = naverProfile.response.name;
      }
      if (!userName) return false;

      let gender: string | null = null;
      let phone_number: string | null = null;
      let birthday: string | null = null;
      let birthyear: string | null = null;

      if (account.provider === 'naver') {
        const response = naverProfile?.response || {};
        gender =
          response.gender === 'M'
            ? '남성'
            : response.gender === 'F'
              ? '여성'
              : null;
        phone_number = response.mobile || null;
        birthday = response.birthday || null;
        birthyear = response.birthyear || null;
      }

      if (account.provider === 'kakao') {
        const kakaoProfile = profile as
          | {
              kakao_account?: {
                gender?: string;
                phone_number?: string;
                birthday?: string;
                birthyear?: string;
              };
            }
          | undefined;
        const response = kakaoProfile?.kakao_account || {};
        gender =
          response.gender === 'male'
            ? '남성'
            : response.gender === 'female'
              ? '여성'
              : null;
        phone_number = response.phone_number || null;
        birthday = response.birthday || null;
        birthyear = response.birthyear || null;
      }

      try {
        await prisma.user.upsert({
          where: { email: user.email },
          create: {
            email: user.email,
            name: userName,
            image: user.image ?? null,
            username: user.email.split('@')[0] ?? null,
            provider: account.provider,
            level: 0,
            role: 'PENDING',
            gender,
            phoneNumber: encryptField(phone_number),
            birthday: encryptField(birthday),
            birthyear: encryptField(birthyear),
          },
          update: {},
        });
      } catch {
        // unique constraint 등 예외 무시
      }

      // 신규 가입 → 신청 접수 메일 발송 (실패해도 가입 흐름은 진행)
      try {
        const tpl = signupReceivedTemplate(userName);
        await sendMail({ to: user.email, subject: tpl.subject, html: tpl.html });
      } catch (err) {
        console.error('[signup] failed to send received mail (social)', err);
      }

      // 세션을 만들지 않고 가입 신청 완료 안내 화면으로 이동
      return `/auth/signin?notice=signup-complete`;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      if (token.id || trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            level: true,
            role: true,
            gender: true,
            username: true,
            name: true,
          },
        });
        if (dbUser) {
          token.level = dbUser.level;
          token.role = dbUser.role ?? 'USER';
          token.gender = dbUser.gender ?? '';
          token.userName = dbUser.username ?? token.email?.split('@')[0] ?? '';
          token.name = dbUser.name ?? token.name ?? '';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.level = (token.level as number) ?? 0;
        session.user.role = (token.role as string) ?? 'USER';
        session.user.gender = (token.gender as string) ?? '';
        session.user.userName = (token.userName as string) ?? '';
        session.user.name = (token.name as string) ?? '';
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
};

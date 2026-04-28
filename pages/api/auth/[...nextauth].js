import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import NextAuth from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';
import NaverProvider from 'next-auth/providers/naver';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { encryptField } from '@/util/encryption';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
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
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      // CredentialsProvider는 별도 처리 없이 통과
      if (account.provider === 'credentials') return true;

      // 기존 사용자 먼저 확인 (반환 사용자는 이름 없어도 허용)
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        if (existingUser.provider && existingUser.provider !== account.provider) {
          return `/auth/signin?error=ALREADY_REGISTERED`;
        }

        // Account 레코드가 없으면 직접 생성 (OAuthAccountNotLinked 방지)
        // 기존 사용자가 Sanity 마이그레이션으로 Account 없이 생성된 경우 처리
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

      // 신규 사용자: 이름 필수 확인
      let userName = user.name;
      if (account.provider === 'naver' && !userName && profile?.response?.name) {
        userName = profile.response.name;
      }
      if (!userName) return false;

      // 소셜 프로필에서 추가 정보 추출
      let gender = null;
      let phone_number = null;
      let birthday = null;
      let birthyear = null;

      if (account.provider === 'naver') {
        const response = profile?.response || {};
        gender = response.gender === 'M' ? '남성' : response.gender === 'F' ? '여성' : null;
        phone_number = response.mobile || null;
        birthday = response.birthday || null;
        birthyear = response.birthyear || null;
      }

      if (account.provider === 'kakao') {
        const response = profile?.kakao_account || {};
        gender = response.gender === 'male' ? '남성' : response.gender === 'female' ? '여성' : null;
        phone_number = response.phone_number || null;
        birthday = response.birthday || null;
        birthyear = response.birthyear || null;
      }

      // 구글은 추가 정보 없이 기본 처리 (gender, phone 등 미제공)

      // PrismaAdapter는 signIn 콜백 이후에 createUser를 실행하므로
      // upsert로 먼저 프로필 데이터를 포함한 유저를 생성
      // allowDangerousEmailAccountLinking과 함께 사용 시 Account가 자동 연결됨
      try {
        await prisma.user.upsert({
          where: { email: user.email },
          create: {
            email: user.email,
            name: userName,
            image: user.image,
            username: user.email.split('@')[0],
            provider: account.provider,
            level: 0,
            role: 'PENDING',
            gender,
            phoneNumber: encryptField(phone_number),
            birthday: encryptField(birthday),
            birthyear: encryptField(birthyear),
          },
          update: {}, // 이미 존재하면 건드리지 않음
        });
      } catch {
        // unique constraint 등 예외 무시
      }

      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // 최초 로그인 시 또는 세션 업데이트 시 DB에서 최신 정보 로드
      if (user) {
        token.id = user.id;
      }
      if (token.id || trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { level: true, role: true, gender: true, username: true, name: true },
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
        session.user.id = token.id;
        session.user.level = token.level ?? 0;
        session.user.role = token.role ?? 'USER';
        session.user.gender = token.gender ?? '';
        session.user.userName = token.userName ?? '';
        session.user.name = token.name ?? '';
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

export default NextAuth(authOptions);

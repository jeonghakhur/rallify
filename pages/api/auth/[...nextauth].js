import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import NextAuth from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';
import NaverProvider from 'next-auth/providers/naver';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID || '',
      clientSecret: process.env.NAVER_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      // 네이버의 경우 name이 없을 수 있으므로 profile에서 가져오기
      let userName = user.name;
      if (account.provider === 'naver' && !userName && profile?.response?.name) {
        userName = profile.response.name;
      }
      if (!userName) return false;

      // 신규 사용자 추가 정보 처리
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        if (existingUser.provider && existingUser.provider !== account.provider) {
          return `/auth/signin?error=ALREADY_REGISTERED`;
        }
        return true;
      }

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
        gender = response.gender || null;
        phone_number = response.phone_number || null;
        birthday = response.birthday || null;
        birthyear = response.birthyear || null;
      }

      // 사용자 생성 (PrismaAdapter가 Account/Session은 자동 처리)
      await prisma.user.update({
        where: { email: user.email },
        data: {
          name: userName,
          username: user.email.split('@')[0],
          provider: account.provider,
          level: 1,
          gender,
          phoneNumber: phone_number,
          birthday,
          birthyear,
        },
      }).catch(() => null); // 아직 생성 전이면 무시 (Adapter가 생성)

      return true;
    },
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { level: true, gender: true, username: true },
      });

      if (session.user) {
        session.user.id = user.id;
        session.user.level = dbUser?.level ?? 0;
        session.user.gender = dbUser?.gender ?? '';
        session.user.userName = dbUser?.username ?? session.user.email?.split('@')[0] ?? '';
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

export default NextAuth(authOptions);

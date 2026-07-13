import SignIn from '@/components/Signin';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams?.callbackUrl || '/';
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/');
  }

  // getProviders()는 NEXTAUTH_URL로 HTTP 자기 호출을 해서 배포 환경 설정에 따라
  // 빈 값이 될 수 있으므로 authOptions에서 직접 목록을 만든다
  const providers = Object.fromEntries(
    authOptions.providers.map((p) => [p.id, { id: p.id, name: p.name }])
  );

  // 프로덕션에서는 소셜 로그인만 노출
  const showEmailLogin = process.env.NODE_ENV !== 'production';

  return (
    <section className="flex flex-col w-[300px] mt-10 mx-auto">
      <SignIn
        providers={providers}
        callbackUrl={callbackUrl}
        showEmailLogin={showEmailLogin}
      />
    </section>
  );
}

'use client';

import { ClientSafeProvider, signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from './ui/button';

type Props = {
  providers: Record<string, ClientSafeProvider>;
  callbackUrl: string;
};

const errorMessages: Record<string, string> = {
  ALREADY_REGISTERED: '이미 다른 소셜 계정으로 가입되어 있습니다.',
  INVALID_CREDENTIALS: '잘못된 로그인 정보입니다.',
  CredentialsSignin: '이메일 또는 패스워드가 올바르지 않습니다.',
  AccessDenied: '로그인 권한이 없습니다. 소셜 앱에서 필수 정보 제공에 동의해 주세요.',
  OAuthCallback: '소셜 로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
  OAuthAccountNotLinked: '이미 다른 방법으로 가입된 이메일입니다.',
  DEFAULT: '알 수 없는 에러가 발생했습니다. 다시 시도해주세요.',
};

const providerLabels: Record<string, string> = {
  kakao: '카카오',
  naver: '네이버',
  google: '구글',
};

const providerLogoExt: Record<string, string> = {
  kakao: 'png',
  naver: 'png',
  google: 'svg',
};

export default function SignIn({ providers, callbackUrl }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorCode = searchParams?.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setLoginError(errorMessages[result.error] ?? errorMessages.DEFAULT);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {(errorCode || loginError) && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md text-center">
          {loginError || errorMessages[errorCode!] || errorMessages.DEFAULT}
        </div>
      )}

      {/* 이메일 로그인 폼 */}
      <form onSubmit={handleEmailLogin} className="flex flex-col gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="패스워드"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button type="submit" className="w-full h-[50px] rounded-xl text-base" disabled={loading}>
          {loading ? '로그인 중...' : '이메일로 로그인'}
        </Button>
      </form>

      <div className="text-center text-xs text-gray-400 my-1">또는</div>

      {/* 소셜 로그인 버튼 */}
      {Object.values(providers)
        .filter(({ id }) => id !== 'credentials')
        .map(({ name, id }) => {
          const label = providerLabels[id] ?? name;
          const ext = providerLogoExt[id] ?? 'png';
          return (
            <button
              key={name}
              type="button"
              onClick={() => signIn(id, { callbackUrl })}
              className={`btn-social ${id}`}
            >
              <Image
                src={`/logo_${id}.${ext}`}
                width={30}
                height={30}
                alt={`${label} 로고`}
                style={{ width: 'auto', height: 'auto' }}
              />
              {`${label} 아이디로 로그인`}
            </button>
          );
        })}

      <div className="mt-2 pt-3 border-t border-gray-200 text-center">
        <Link
          href="/auth/signup"
          className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
        >
          이메일로 가입하기
        </Link>
      </div>
    </div>
  );
}

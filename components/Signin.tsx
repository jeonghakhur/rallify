'use client';

import { ClientSafeProvider, signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

type Props = {
  providers: Record<string, ClientSafeProvider>;
  callbackUrl: string;
};

const errorMessages: Record<string, string> = {
  ALREADY_REGISTERED: '이미 다른 소셜 계정으로 가입되어 있습니다.',
  INVALID_CREDENTIALS: '잘못된 로그인 정보입니다.',
  DEFAULT: '알 수 없는 에러가 발생했습니다. 다시 시도해주세요.',
};

export default function SignIn({ providers, callbackUrl }: Props) {
  const searchParams = useSearchParams();
  const errorCode = searchParams?.get('error'); // 쿼리에서 에러 메시지 가져오기

  return (
    <>
      {errorCode && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {errorMessages[errorCode]}
        </div>
      )}
      {Object.values(providers).map(({ name, id }) => (
        <button
          key={name}
          type="button"
          onClick={() => signIn(id, { callbackUrl })}
          className={`btn-social ${id}`}
        >
          <Image
            src={`/logo_${id}.png`}
            width={30}
            height={30}
            alt=""
            style={{ width: 'auto', height: 'auto' }}
          />
          {`${id === 'kakao' ? '카카오' : '네이버'} 아이디로 로그인`}
        </button>
      ))}
    </>
  );
}

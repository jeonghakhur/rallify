'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', gender: '', phoneNumber: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    // 이미 프로필 완성된 경우
    if (session.user.role === 'PENDING' && session.user.name) {
      router.push('/register/pending');
      return;
    }
    // 이미 승인된 경우
    if (session.user.role !== 'PENDING') {
      router.push('/');
      return;
    }
    // 소셜에서 가져온 이름 기본값 설정
    if (session.user.name) {
      setForm((prev) => ({ ...prev, name: session.user.name || '' }));
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || form.name.length < 2) {
      setError('이름은 2자 이상 입력해주세요.');
      return;
    }
    if (!form.gender) {
      setError('성별을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/members/${session?.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          gender: form.gender,
          phoneNumber: form.phoneNumber || undefined,
        }),
      });

      if (!res.ok) {
        setError('프로필 저장에 실패했습니다.');
        return;
      }

      await update();
      router.push('/register/pending');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return null;

  return (
    <section className="flex flex-col w-[320px] mt-10 mx-auto gap-4">
      <h1 className="text-2xl font-bold text-center text-gray-800">
        프로필 완성
      </h1>
      <p className="text-sm text-gray-500 text-center">
        서비스 가입을 위해 아래 정보를 입력해주세요.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이름
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="실명을 입력해주세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            성별
          </label>
          <div className="flex gap-3">
            {['남성', '여성'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setForm({ ...form, gender: g })}
                className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                  form.gender === g
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            연락처 <span className="text-gray-400">(선택)</span>
          </label>
          <input
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="010-0000-0000"
          />
        </div>

        <p className="text-xs text-gray-400 text-center">
          가입하면{' '}
          <Link href="/terms" className="underline hover:text-gray-600">
            이용약관
          </Link>
          과{' '}
          <Link href="/privacy" className="underline hover:text-gray-600">
            개인정보처리방침
          </Link>
          에 동의하는 것으로 간주됩니다.
        </p>

        <Button type="submit" className="w-full mt-2" disabled={loading}>
          {loading ? '저장 중...' : '완료'}
        </Button>
      </form>
    </section>
  );
}

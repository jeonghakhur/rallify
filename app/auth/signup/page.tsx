'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    gender: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.gender) {
      setError('성별을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '가입에 실패했습니다.');
        return;
      }

      // 자동 로그인하지 않고, 안내와 함께 로그인 화면으로 이동
      router.push('/auth/signin?notice=signup-complete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col w-[320px] mt-10 mx-auto gap-4">
      <h1 className="text-2xl font-bold text-center text-gray-800">
        이메일 회원가입
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이메일
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            패스워드
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="8자 이상"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이름
          </label>
          <input
            type="text"
            required
            minLength={2}
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

        <Button type="submit" className="w-full mt-2" disabled={loading}>
          {loading ? '처리 중...' : '가입하기'}
        </Button>
      </form>

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

      <div className="text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/auth/signin" className="text-blue-600 hover:underline">
          로그인
        </Link>
      </div>
    </section>
  );
}

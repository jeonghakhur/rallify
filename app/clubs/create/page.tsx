'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import { Button } from '@/components/ui/button';

export default function CreateClubPage() {
  const { isLoading: authLoading } = useAuthRedirect();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    city: '',
    district: '',
    joinType: 'APPROVAL',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '클럽 생성에 실패했습니다.');
        return;
      }

      router.push(`/clubs/${data.id}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <main className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">클럽 만들기</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            클럽 이름 *
          </label>
          <input
            type="text"
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="클럽 이름을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            설명
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="클럽에 대한 간단한 설명"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시/도
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="서울"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              구/군
            </label>
            <input
              type="text"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="마포구"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            가입 방식
          </label>
          <div className="flex gap-2">
            {[
              { value: 'OPEN', label: '자유 가입' },
              { value: 'APPROVAL', label: '승인 필요' },
              { value: 'INVITE_ONLY', label: '초대 전용' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, joinType: opt.value })}
                className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                  form.joinType === opt.value
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '생성 중...' : '클럽 만들기'}
        </Button>
      </form>
    </main>
  );
}

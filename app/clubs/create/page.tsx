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

  const testData = [
    {
      name: '망원 테니스 클럽',
      description:
        '망원한강공원에서 매주 화/목 저녁에 활동하는 테니스 동호회입니다. 초보부터 중급까지 환영합니다.',
      city: '서울',
      district: '마포구',
      joinType: 'APPROVAL',
    },
    {
      name: '그랜드슬램 테니스',
      description:
        '주말 아침 테니스를 즐기는 모임입니다. 실력보다 즐거움을 추구합니다.',
      city: '서울',
      district: '마포구',
      joinType: 'OPEN',
    },
    {
      name: '한강 나이트 테니스',
      description: '퇴근 후 한강에서 야간 테니스를 즐기는 직장인 모임입니다.',
      city: '서울',
      district: '영등포구',
      joinType: 'INVITE_ONLY',
    },
    {
      name: '서초 테니스 아카데미',
      description: '체계적인 레슨과 리그전을 운영하는 테니스 클럽입니다.',
      city: '서울',
      district: '서초구',
      joinType: 'APPROVAL',
    },
    {
      name: '송파 위켄드 테니스',
      description: '올림픽공원 인근에서 주말에 모여 복식 경기를 즐깁니다.',
      city: '서울',
      district: '송파구',
      joinType: 'OPEN',
    },
  ];

  const fillTestData = () => {
    const data = testData[Math.floor(Math.random() * testData.length)];
    setForm(data);
  };

  if (authLoading) return null;

  return (
    <main className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">클럽 만들기</h1>
        {process.env.NODE_ENV === 'development' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fillTestData}
            className="text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            테스트 데이터
          </Button>
        )}
      </div>

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

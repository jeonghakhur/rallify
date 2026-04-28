'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleUserProps } from '@/model/user';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import useSWR from 'swr';
import { signOut, useSession } from 'next-auth/react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import LoadingGrid from '@/components/LoadingGrid';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

export default function User() {
  const { data: session, status } = useSession();
  const { data, isLoading, error } = useSWR<SimpleUserProps>('/api/me');
  const { control, register, handleSubmit, reset } = useForm<SimpleUserProps>();
  const [loading, setLoading] = useState<boolean>(isLoading);
  const [largeFont, setLargeFont] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // 클라이언트에서만 localStorage 값을 가져오기
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('bigFont');
    setLargeFont(saved === 'true');
  }, []);

  // 세션 상태 체크 및 강제 로그아웃 처리
  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log('🔒 세션이 만료되었습니다. 로그아웃 처리 중...');
      signOut({ callbackUrl: '/auth/signin' });
      return;
    }

    // API 에러가 401(인증 실패)인 경우 강제 로그아웃
    if (error && error.status === 401) {
      console.log('🔒 인증 실패로 인한 강제 로그아웃 처리 중...');
      signOut({ callbackUrl: '/auth/signin' });
      return;
    }
  }, [status, error]);

  async function updateUser(updateData: SimpleUserProps) {
    return fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    }).then((res) => res.json());
  }

  function onSubmit(formData: SimpleUserProps) {
    setLoading(true);
    updateUser(formData)
      .then((data) => {
        console.log(data);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        toast({
          title: '사용자 정보가 업데이트 되었습니다',
          duration: 1500,
        });
        setLoading(false);
      });
  }

  // 큰글씨 상태를 html에 반영하고 localStorage에 저장
  useEffect(() => {
    if (largeFont !== null) {
      const html = document.documentElement;
      if (largeFont) html.classList.add('big-font');
      else html.classList.remove('big-font');

      localStorage.setItem('bigFont', String(largeFont));
    }
  }, [largeFont]);

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        gender: data.gender,
        birthyear: data.birthyear,
        phone_number: data.phone_number,
        address: data.address,
      });
      setLoading(false);
    }
  }, [data, reset]);

  return (
    <div>
      <div className="flex justify-between items-center gap-2 px-4 my-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          로그아웃
        </Button>
        <div className="flex items-center gap-2">
          {isClient && (
            <Switch checked={largeFont} onCheckedChange={setLargeFont} />
          )}
          <span className="text-xm">큰글씨보기</span>
        </div>
      </div>
      {isLoading && <LoadingGrid loading={loading} />}
      {!isLoading && (
        <form className="px-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <Label>이름</Label>
              <Input type="text" {...register('name')} />
              <p>실명으로 입력해주세요.</p>
            </div>
            <div>
              <Label>성별</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || data?.gender || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="성별을 선택해주세요." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="남성">남성</SelectItem>
                      <SelectItem value="여성">여성</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>출생년도</Label>
              <Input
                type="text"
                {...register('birthyear')}
                placeholder="1988 네 자리 숫자만 입력해주세요."
              />
            </div>
            <div>
              <Label>핸드폰 번호</Label>
              <Input
                type="text"
                {...register('phone_number')}
                placeholder="숫자만 입력해주세요."
              />
            </div>
            <div>
              <Label>거주지</Label>
              <Input
                type="text"
                {...register('address')}
                placeholder="마포구 상암동"
              />
            </div>
            <div>
              <Button type="submit" className="w-full">
                전송
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Danger Zone */}
      <div className="mx-5 mt-8 mb-6 border border-red-200 rounded-lg p-4 bg-red-50">
        <h3 className="text-sm font-semibold text-red-600 mb-2">위험 구역</h3>
        <p className="text-xs text-gray-600 mb-3">
          회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-300 hover:bg-red-100"
          onClick={() => {
            setShowDeleteModal(true);
            setDeleteEmail('');
            setDeleteError('');
          }}
        >
          회원탈퇴
        </Button>
      </div>

      {/* 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-red-600 mb-2">회원탈퇴</h3>
            <p className="text-sm text-gray-600 mb-4">
              탈퇴 시 모든 데이터가 영구 삭제되며 복구할 수 없습니다. 계속하려면
              이메일 주소를 입력하세요.
            </p>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md mb-3">
                {deleteError}
              </div>
            )}

            <input
              type="email"
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
              placeholder={session?.user?.email || '이메일 주소'}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteModal(false)}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteEmail !== session?.user?.email || deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true);
                  setDeleteError('');
                  try {
                    const res = await fetch('/api/me', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        confirmEmail: deleteEmail,
                      }),
                    });
                    const result = await res.json();
                    if (!res.ok) {
                      setDeleteError(result.error);
                      return;
                    }
                    signOut({ callbackUrl: '/auth/signin' });
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
              >
                {deleteLoading ? '처리 중...' : '탈퇴하기'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

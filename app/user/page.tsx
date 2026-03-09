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
  const { status } = useSession();
  const { data, isLoading, error } = useSWR<SimpleUserProps>('/api/me');
  const { control, register, handleSubmit, reset } = useForm<SimpleUserProps>();
  const [loading, setLoading] = useState<boolean>(isLoading);
  const [largeFont, setLargeFont] = useState(false);
  const [isClient, setIsClient] = useState(false);

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
    </div>
  );
}

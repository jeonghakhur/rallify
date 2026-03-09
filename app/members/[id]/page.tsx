'use client';

import { Container } from '@/components/Layout';
import LoadingGrid from '@/components/LoadingGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { UserProps } from '@/model/user';
import { use, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

type Props = {
  params: Promise<{ id: string }>; // params가 Promise로 감싸져 있음
};

export default function Members({ params }: Props) {
  const { id } = use(params); // params를 비동기로 처리
  const { data: member, isLoading } = useSWR<UserProps>(`/api/members/${id}`);
  const [loading, setLoading] = useState<boolean>(isLoading);
  const { control, register, handleSubmit, reset } = useForm<UserProps>();

  useEffect(() => {
    if (member) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = member;
      reset({
        ...rest,
      });
      setLoading(false);
    }
  }, [member, reset]);

  async function updateUser(updateData: UserProps) {
    return fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })
      .then((res) => res.json())
      .catch((error) => console.error(error));
  }

  function onSubmit(formData: UserProps) {
    setLoading(true);
    updateUser({
      ...formData,
      name: formData.name.trim(),
      address: formData.address ? formData.address.trim() : '',
      phone_number: formData.phone_number ? formData.phone_number.trim() : '',
      birthyear: formData.birthyear ? formData.birthyear.trim() : '',
      level: Number(formData.level),
    })
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

  return (
    <Container>
      <LoadingGrid loading={loading} />
      {!loading && member && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <Label>이름</Label>
              <Input type="text" {...register('name')} />
              <p>실명으로 입력해주세요.</p>
            </div>
            <div>
              <Label>레벨</Label>
              <Input type="number" {...register('level')} />
            </div>
            <div>
              <Label>성별</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || member?.gender}
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
    </Container>
  );
}

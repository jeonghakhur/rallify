'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import useSWR, { mutate as globalMutate } from 'swr';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { USER_LEVELS } from '@/lib/userLevel';

type ManagedClub = {
  id: string;
  name: string;
  role: 'OWNER' | 'MANAGER';
};

type MemberDetail = {
  id: string;
  name: string;
  email: string | null;
  level: number;
  gender: string;
  birthyear: string | null;
  phoneNumber: string | null;
  address: string | null;
  managedClubs: ManagedClub[];
};

type FormValues = {
  name: string;
  level: number;
  gender: string;
  birthyear: string | null;
  phoneNumber: string | null;
  address: string | null;
};

type Props = {
  memberId: string | null;
  onClose: () => void;
};

export default function MemberEditDialog({ memberId, onClose }: Props) {
  const open = memberId !== null;
  const { data: member, isLoading } = useSWR<MemberDetail>(
    memberId ? `/api/admin/members/${memberId}` : null
  );
  const { control, register, handleSubmit, reset, formState } =
    useForm<FormValues>();

  useEffect(() => {
    if (member) {
      reset({
        name: member.name,
        level: member.level,
        gender: member.gender,
        birthyear: member.birthyear,
        phoneNumber: member.phoneNumber,
        address: member.address,
      });
    }
  }, [member, reset]);

  async function onSubmit(formData: FormValues) {
    if (!memberId) return;
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          level: Number(formData.level),
          gender: formData.gender,
          birthyear: formData.birthyear ? formData.birthyear.trim() : null,
          phoneNumber: formData.phoneNumber
            ? formData.phoneNumber.trim()
            : null,
          address: formData.address ? formData.address.trim() : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? '회원 정보 업데이트에 실패했습니다.');
      }
      toast({ title: '회원 정보가 업데이트 되었습니다', duration: 1500 });
      // 목록과 상세 둘 다 갱신
      await Promise.all([
        globalMutate('/api/admin/members'),
        globalMutate('/api/admin/members?status=pending'),
        globalMutate(`/api/admin/members/${memberId}`),
      ]);
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title:
          error instanceof Error
            ? error.message
            : '회원 정보 업데이트에 실패했습니다.',
        variant: 'destructive',
        duration: 2000,
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>회원 정보 수정</DialogTitle>
        </DialogHeader>

        {isLoading || !member ? (
          <p className="text-sm text-gray-500 py-8 text-center">불러오는 중…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-gray-500">이메일</Label>
              <p className="text-sm text-gray-700">{member.email ?? '-'}</p>
            </div>

            <div>
              <Label>관리 중인 클럽</Label>
              {member.managedClubs.length === 0 ? (
                <p className="text-sm text-gray-500">없음</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {member.managedClubs.map((club) => (
                    <li key={club.id}>
                      <Link
                        href={`/clubs/${club.id}`}
                        target="_blank"
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          club.role === 'OWNER'
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                      >
                        <span>{club.name}</span>
                        <span className="opacity-70">· {club.role}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-gray-400 mt-1">
                회원 등급과는 별도로 관리되는 클럽 단위 권한입니다.
              </p>
            </div>

            <div>
              <Label>이름</Label>
              <Input type="text" {...register('name')} />
            </div>

            <div>
              <Label>등급</Label>
              <Controller
                control={control}
                name="level"
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value ? String(field.value) : ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="등급을 선택해주세요." />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_LEVELS.map((lvl) => (
                        <SelectItem key={lvl.value} value={String(lvl.value)}>
                          {lvl.label} (Lv.{lvl.value}) — {lvl.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label>성별</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
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
                placeholder="1988"
              />
            </div>

            <div>
              <Label>핸드폰 번호</Label>
              <Input type="text" {...register('phoneNumber')} />
            </div>

            <div>
              <Label>거주지</Label>
              <Input
                type="text"
                {...register('address')}
                placeholder="마포구 상암동"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={formState.isSubmitting}
              >
                저장
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

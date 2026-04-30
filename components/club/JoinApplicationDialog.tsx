'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

type MeProfile = {
  id: string;
  name: string | null;
  phoneNumber: string | null;
  gender: string | null;
  birthyear: string | null;
};

type FormValues = {
  introduction: string;
  phoneNumber: string;
  gender: string;
  birthyear: string;
};

type Props = {
  clubId: string;
  clubName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function JoinApplicationDialog({
  clubId,
  clubName,
  open,
  onClose,
  onSuccess,
}: Props) {
  const { data: me } = useSWR<MeProfile>(open ? '/api/me' : null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { control, register, handleSubmit, reset, formState } =
    useForm<FormValues>({
      defaultValues: {
        introduction: '',
        phoneNumber: '',
        gender: '',
        birthyear: '',
      },
    });

  useEffect(() => {
    if (me) {
      reset({
        introduction: '',
        phoneNumber: me.phoneNumber ?? '',
        gender: me.gender ?? '',
        birthyear: me.birthyear ?? '',
      });
      setServerError(null);
    }
  }, [me, reset]);

  async function onSubmit(formData: FormValues) {
    setServerError(null);
    try {
      const res = await fetch(`/api/clubs/${clubId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          introduction: formData.introduction.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          gender: formData.gender.trim(),
          birthyear: formData.birthyear.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? '가입 신청에 실패했습니다.');
      }
      toast({ title: '가입 신청이 접수되었습니다.', duration: 1500 });
      onSuccess();
      onClose();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : '가입 신청에 실패했습니다.'
      );
    }
  }

  const errors = formState.errors;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{clubName} 가입 신청</DialogTitle>
          <DialogDescription>
            아래 정보는 클럽 운영자와 플랫폼 관리자에게 공개됩니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label>자기소개 *</Label>
            <Textarea
              rows={4}
              placeholder="간단한 자기소개를 입력해주세요. (10~500자)"
              {...register('introduction', {
                required: '자기소개를 입력해주세요.',
                minLength: {
                  value: 10,
                  message: '자기소개는 10자 이상 입력해주세요.',
                },
                maxLength: {
                  value: 500,
                  message: '자기소개는 500자 이하로 입력해주세요.',
                },
              })}
            />
            {errors.introduction ? (
              <p className="text-xs text-red-500 mt-1">
                {errors.introduction.message}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                운동 경력, 가입 동기 등을 자유롭게 적어주세요.
              </p>
            )}
          </div>

          <div>
            <Label>연락처 *</Label>
            <Input
              type="tel"
              placeholder="010-0000-0000"
              {...register('phoneNumber', {
                required: '연락처를 입력해주세요.',
              })}
            />
            {errors.phoneNumber && (
              <p className="text-xs text-red-500 mt-1">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          <div>
            <Label>성별 *</Label>
            <Controller
              control={control}
              name="gender"
              rules={{ required: '성별을 선택해주세요.' }}
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
            {errors.gender && (
              <p className="text-xs text-red-500 mt-1">
                {errors.gender.message}
              </p>
            )}
          </div>

          <div>
            <Label>출생년도 *</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="1990"
              maxLength={4}
              {...register('birthyear', {
                required: '출생년도를 입력해주세요.',
                pattern: {
                  value: /^(19|20)\d{2}$/,
                  message: '네 자리 숫자(예: 1990)로 입력해주세요.',
                },
              })}
            />
            {errors.birthyear ? (
              <p className="text-xs text-red-500 mt-1">
                {errors.birthyear.message}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                네 자리 숫자로 입력해주세요. (예: 1990)
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={formState.isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting ? '신청 중…' : '신청하기'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

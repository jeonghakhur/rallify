'use client';

import { Container } from '@/components/Layout';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ScheduleFormSchema, ScheduleFormType } from '@/model/schedule';
import FormDatePicker from '@/components/FormDatePicker';
import FormCourtName from '@/components/FormCourtName';
import useSchedule from '@/hooks/useSchedule';
import FormCourtNumber from '@/components/FormCourtNumber';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Grid } from 'react-loader-spinner';
import { Switch } from '@/components/ui/switch';
import useAuthRedirect from '@/hooks/useAuthRedirect';

export default function ScheduleForm() {
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { postSchedule } = useSchedule();

  // 사용자 권한 확인
  const { user } = useAuthRedirect('/');

  useEffect(() => {
    console.log('👤 스케줄 생성 페이지 - 사용자 정보:', {
      user: user,
      level: user?.level,
      canCreateSchedule: user && user.level >= 3,
    });
  }, [user]);

  const form = useForm<ScheduleFormType>({
    resolver: zodResolver(ScheduleFormSchema),
    defaultValues: {
      date: new Date(),
      startTime: '6',
      endTime: '24',
      courtNumbers: [{ number: '1', startTime: '19', endTime: '22' }],
      attendees: [],
      status: 'pending',
    },
  });

  // 코트들의 시작시간과 종료시간을 감시하여 최소/최대 시간 계산
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const courtNumbers = form.watch('courtNumbers') || [];

  // 코트 시간이 변경될 때마다 최소/최대 시간 상태 업데이트 및 전역 시간 동기화
  useEffect(() => {
    if (courtNumbers.length > 0) {
      const earliest = Math.min(
        ...courtNumbers.map((court) => parseInt(court.startTime || '19', 10))
      );
      const latest = Math.max(
        ...courtNumbers.map((court) => parseInt(court.endTime || '22', 10))
      );

      // 전역 startTime과 endTime도 동기화 (실시간 업데이트)
      form.setValue('startTime', earliest.toString());
      form.setValue('endTime', latest.toString());
    }
  }, [courtNumbers, form]);

  function onSubmit(data: ScheduleFormType) {
    // 코트별 시간을 기반으로 startTime과 endTime을 동적으로 계산
    if (data.courtNumbers && data.courtNumbers.length > 0) {
      const startTimes = data.courtNumbers.map((court) =>
        parseInt(court.startTime || '19', 10)
      );
      const endTimes = data.courtNumbers.map((court) =>
        parseInt(court.endTime || '22', 10)
      );

      const earliestStartTime = Math.min(...startTimes);
      const latestEndTime = Math.max(...endTimes);

      // 계산된 시간으로 startTime과 endTime 업데이트
      data.startTime = earliestStartTime.toString();
      data.endTime = latestEndTime.toString();
    }

    console.log('📝 폼 제출 데이터:', data);
    setLoading(true);

    if (data.courtName === '직접입력') {
      if (!data.otherCourtName) {
        alert('코트명을 입력해주세요!');
        setLoading(false);
        return;
      }
      data.courtName = data.otherCourtName;
    }

    // status 값이 없으면 명시적으로 설정
    if (!data.status) {
      data.status = 'pending';
    }

    console.log('🚀 서버로 전송할 데이터:', data);

    postSchedule(data)
      .then((result) => {
        console.log('✅ 서버 응답:', result);
        setLoading(false);
        // 생성된 스케줄의 상세 페이지로 이동
        if (result && result._id) {
          router.push(`/schedule/${result._id}`);
        } else {
          // ID가 없는 경우 목록으로 이동
          router.push('/schedule');
        }
      })
      .catch((error) => {
        console.error('❌ 에러:', error);
        setLoading(false);
        // 에러 발생 시에도 목록으로 이동
        router.push('/schedule');
      });
  }

  const handleCourtCountChange = (count: string) => {
    const countNumber = parseInt(count, 10);
    const prevCourts = form.getValues('courtNumbers') || [];

    // 현재 코트들의 시간을 기반으로 기본 시간 계산
    let defaultStart = '19';
    let defaultEnd = '22';

    if (prevCourts.length > 0) {
      const startTimes = prevCourts.map((court) =>
        parseInt(court.startTime || '19', 10)
      );
      const endTimes = prevCourts.map((court) =>
        parseInt(court.endTime || '22', 10)
      );
      defaultStart = Math.min(...startTimes).toString();
      defaultEnd = Math.max(...endTimes).toString();
    }

    let courts = prevCourts.slice(0, countNumber);
    if (courts.length < countNumber) {
      courts = courts.concat(
        Array.from({ length: countNumber - courts.length }, (_, idx) => ({
          number: String(courts.length + idx + 1),
          startTime: defaultStart,
          endTime: defaultEnd,
        }))
      );
    }
    form.setValue('courtNumbers', courts);
    form.trigger('courtNumbers');
  };

  const handleStatusChange = (checked: boolean) => {
    form.setValue('status', checked ? 'attendees' : 'pending');
  };

  return (
    <Container>
      <Form {...form}>
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Grid
              visible={true}
              height="80"
              width="80"
              color="#b91c1c"
              ariaLabel="grid-loading"
              radius="12.5"
              wrapperClass="grid-wrapper"
            />
          </div>
        )}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 pb-[80px]"
        >
          <div className="grid gap-6">
            <FormDatePicker form={form} />
            {/* 
            <div className="grid grid-cols-2 gap-4">
              <FormSelectTime
                form={form}
                name="startTime"
                startTime={startTime}
                label="시작시간"
              />
              <FormSelectTime
                form={form}
                name="endTime"
                startTime={startTime}
                label="종료시간"
              />
            </div> */}

            <FormCourtName form={form} />
            {form.watch('courtName') && (
              <FormField
                control={form.control}
                name="courtCount"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>코트 수</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleCourtCountChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="코트 수를 선택하세요." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch('courtCount') && (
              <div className="flex flex-col gap-4">
                {(form.watch('courtNumbers') || []).map((_, idx) => (
                  <FormCourtNumber key={idx} form={form} idx={idx} />
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 justify-between">
              <label htmlFor="status" className="font-bold">
                참석투표시작
              </label>
              <Switch
                id="status"
                name="status"
                checked={form.watch('status') === 'attendees'}
                onCheckedChange={handleStatusChange}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/schedule')}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                일정 등록
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </Container>
  );
}

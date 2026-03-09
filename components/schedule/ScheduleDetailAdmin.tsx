'use client';

import FormCourtCount from '@/components/FormCourtCount';
import FormCourtNumber from '@/components/FormCourtNumber';
import FormDatePicker from '@/components/FormDatePicker';
import FormMembers from '@/components/FormMembers';
import { Container } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import useSchedule from '@/hooks/useSchedule';
import {
  ScheduleFormSchema,
  ScheduleFormType,
  AttendanceProps,
} from '@/model/schedule';
import { AuthUser } from '@/model/user';
import { zodResolver } from '@hookform/resolvers/zod';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Grid } from 'react-loader-spinner';
import CommentSection from '@/components/common/CommentSection';
import { mutate } from 'swr';

type Props = {
  scheduleId: string;
  user: AuthUser;
};

export default function ScheduleDetailAdmin({ scheduleId, user }: Props) {
  const userName = user?.name;
  const gender = user?.gender;
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [earliestStartTime, setEarliestStartTime] = useState<number>(19);
  const [latestEndTime, setLatestEndTime] = useState<number>(22);
  const {
    schedule,
    isLoading,
    postAttendance,
    patchSchedule,
    removeAttendance,
    removeSchedule,
    addComment,
    removeComment,
  } = useSchedule(scheduleId);

  const form = useForm<ScheduleFormType>({
    resolver: zodResolver(ScheduleFormSchema),
  });

  useEffect(() => {
    if (schedule) {
      console.log(schedule);
      form.reset({
        ...schedule,
        date: schedule.date ? new Date(schedule.date) : new Date(),
        // 코트별 시간 선택 범위를 확장하기 위해 전역 시간 범위를 6시-24시로 설정
        // 단, 기존 스케줄의 실제 시간 값은 그대로 유지
        startTime: '6',
        endTime: '24',
        // courtNumbers: schedule.courtNumbers.map((court) =>
        //   typeof court === 'string' ? court : court.number
        // ),
        attendees: (schedule.attendees || []).map((att) => ({
          ...att,
          userId: att.userId || '',
        })),
      });
    }
  }, [schedule, form, userName, gender]);

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

      setEarliestStartTime(earliest);
      setLatestEndTime(latest);

      // 전역 startTime과 endTime도 동기화 (실시간 업데이트)
      form.setValue('startTime', earliest.toString());
      form.setValue('endTime', latest.toString());
    } else {
      setEarliestStartTime(parseInt(schedule?.startTime || '19', 10));
      setLatestEndTime(parseInt(schedule?.endTime || '22', 10));
    }
  }, [courtNumbers, schedule?.startTime, schedule?.endTime, form]);

  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.log(form.formState.errors);
      toast({
        title: '입력 오류',
        description: '모든 필수 항목을 입력해주세요.',
        variant: 'destructive',
      });
    }
  }, [form.formState.errors]);

  const handleDelete = () => {
    const isConfirmed = confirm('정말 삭제하시겠습니까?');
    if (isConfirmed) {
      setLoading(true);
      removeSchedule()
        .then((data) => console.log(data))
        .catch((error) => console.error(error))
        .finally(() => {
          setLoading(false);
          router.push('/');
        });
    }
  };

  async function onSubmit(data: ScheduleFormType) {
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

    console.log('수정된 데이터:', data);
    setLoading(true);
    try {
      await patchSchedule(data);
      await mutate('/api/schedule', undefined, { revalidate: true });
      alert('스케줄이 수정되었습니다.');
      // router.push('/schedule');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleCourtCountChange = (count: string) => {
    const countNumber = parseInt(count, 10);
    const currentCourtNumbers = form.getValues('courtNumbers') || [];

    // 현재 코트들의 시간을 기반으로 기본 시간 계산
    let defaultStart = '19';
    let defaultEnd = '22';

    if (currentCourtNumbers.length > 0) {
      const startTimes = currentCourtNumbers.map((court) =>
        parseInt(court.startTime || '19', 10)
      );
      const endTimes = currentCourtNumbers.map((court) =>
        parseInt(court.endTime || '22', 10)
      );
      defaultStart = Math.min(...startTimes).toString();
      defaultEnd = Math.max(...endTimes).toString();
    }

    if (countNumber > currentCourtNumbers.length) {
      const newCourts = Array.from(
        { length: countNumber - currentCourtNumbers.length },
        (_, idx) => ({
          number: String(currentCourtNumbers.length + idx + 1),
          startTime: defaultStart,
          endTime: defaultEnd,
        })
      );
      form.setValue('courtNumbers', [...currentCourtNumbers, ...newCourts]);
    } else if (countNumber < currentCourtNumbers.length) {
      form.setValue('courtNumbers', currentCourtNumbers.slice(0, countNumber));
    }
  };

  const handleStatusChange = (value: boolean) => {
    if (value) {
      form.setValue('status', 'attendees');
    } else {
      form.setValue('status', 'pending');
    }
  };

  return (
    <Container>
      {(loading || isLoading) && (
        <Grid
          visible={true}
          height="80"
          width="80"
          color="#b91c1c"
          ariaLabel="grid-loading"
          radius="12.5"
          wrapperClass="grid-wrapper"
        />
      )}
      {schedule && (
        <>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 mb-4"
            >
              <FormDatePicker form={form} />

              <div>
                <Label>코트이름</Label>
                <Input type="text" {...form.register('courtName')} />
              </div>

              <div>
                <FormCourtCount
                  form={form}
                  value={schedule.courtCount}
                  onHandleChange={handleCourtCountChange}
                />
              </div>

              {/* <div className="flex gap-3">
                {Array.from(
                  { length: parseInt(form.watch('courtCount'), 10) },
                  (_, idx) => (
                    <FormCourtNumber key={idx} form={form} idx={idx} />
                  )
                )}
              </div> */}

              {form.watch('courtCount') && (
                <div className="flex flex-col gap-4">
                  {(form.watch('courtNumbers') || []).map(
                    (courtNumber, idx) => (
                      <FormCourtNumber
                        key={courtNumber._key || idx}
                        form={form}
                        idx={idx}
                        onTimeChange={() => {
                          // 시간이 변경될 때마다 폼을 다시 트리거하여 최소/최대 시간 재계산
                          form.trigger('courtNumbers');
                          // 상태 업데이트를 위해 강제로 리렌더링
                          setTimeout(() => {
                            const updatedCourtNumbers =
                              form.getValues('courtNumbers') || [];
                            if (updatedCourtNumbers.length > 0) {
                              const earliest = Math.min(
                                ...updatedCourtNumbers.map((court) =>
                                  parseInt(court.startTime || '19', 10)
                                )
                              );
                              const latest = Math.max(
                                ...updatedCourtNumbers.map((court) =>
                                  parseInt(court.endTime || '22', 10)
                                )
                              );
                              setEarliestStartTime(earliest);
                              setLatestEndTime(latest);
                            }
                          }, 0);
                        }}
                      />
                    )
                  )}
                </div>
              )}

              <FormMembers
                form={form}
                attendees={(
                  (form.watch('attendees') as AttendanceProps[]) || []
                ).map((att) => ({
                  ...att,
                }))}
                startTime={earliestStartTime}
                endTime={latestEndTime}
                postAttendance={postAttendance}
                removeAttendance={removeAttendance}
                user={user}
              />
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
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDelete()}
                  className="flex-1"
                  size="lg"
                >
                  삭제
                </Button>
                <Button type="submit" className="flex-1" size="lg">
                  저장
                </Button>
              </div>
            </form>
          </Form>

          {/* 코멘트 섹션 */}
          <CommentSection
            comments={schedule.comments || []}
            currentUserId={user.id}
            currentUser={{
              name: user.name,
              username: user.userName,
              ...(user.image && { image: user.image }),
            }}
            onAddComment={async (comment) => {
              await addComment(comment);
            }}
            onRemoveComment={async (commentKey) => {
              await removeComment(commentKey);
            }}
            title="관리자 코멘트"
            placeholder="관리자 코멘트를 입력하세요..."
          />
        </>
      )}
    </Container>
  );
}

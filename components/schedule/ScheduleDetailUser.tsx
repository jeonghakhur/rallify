import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Container } from '@/components/Layout';
import LoadingGrid from '@/components/LoadingGrid';
import { AuthUser } from '@/model/user';
import { AttendanceProps } from '@/model/schedule';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import useSchedule from '@/hooks/useSchedule';
import { useToast } from '@/hooks/use-toast';
import CommentSection from '@/components/common/CommentSection';
import useSWR from 'swr';
import { UserProps } from '@/model/user';

const defaultAttendance: AttendanceProps = {
  _key: '',
  name: '',
  gender: '',
  userId: '',
  startHour: '19',
  startMinute: '00',
  endHour: '22',
  endMinute: '00',
};

type Props = {
  scheduleId: string;
  user: AuthUser;
};

export default function ScheduleDetailUser({ scheduleId, user }: Props) {
  const {
    schedule,
    isLoading,
    postAttendance,
    patchAttendance,
    removeAttendance,
    addComment,
    removeComment,
  } = useSchedule(scheduleId);
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [existingIndex, setExistingIndex] = useState<number>(-1);
  const [myAttendance, setMyAttendance] =
    useState<AttendanceProps>(defaultAttendance);

  // 회원 목록 가져오기
  const { data: members } = useSWR<UserProps[]>('/api/members');
  // 정식 회원 정보 찾기
  const myMember = members?.find((m) => m.id === user.id);

  useEffect(() => {
    if (schedule || isLoading) {
      setLoading(false);
    }
  }, [schedule, isLoading]);

  useEffect(() => {
    if (schedule) {
      const foundIndex = schedule.attendees.findIndex(
        (attendee: AttendanceProps) =>
          (attendee.userId &&
            myMember?.id &&
            attendee.userId === myMember.id) ||
          (!attendee.userId &&
            attendee.name === (myMember?.name || user.name) &&
            attendee.gender === (myMember?.gender || user.gender))
      );
      setExistingIndex(foundIndex);

      if (foundIndex !== -1 && schedule.attendees[foundIndex]) {
        setMyAttendance(schedule.attendees[foundIndex]);
      } else {
        setMyAttendance({
          _key: crypto.randomUUID(),
          name: myMember?.name || user.name,
          gender: myMember?.gender || user.gender,
          userId: myMember?.id || user.id,
          startHour: schedule.startTime,
          startMinute: '00',
          endHour: schedule.endTime,
          endMinute: '00',
        });
      }
    }
  }, [schedule, myMember, user.name, user.gender, user.id]);

  const handleAttendance = async () => {
    const { startHour, startMinute, endHour, endMinute } = myAttendance;
    // ✅ 현재 날짜를 기준으로 시작시간과 종료시간을 `Date` 객체로 변환
    const now = new Date(); // 오늘 날짜 사용
    const startTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(startHour, 10),
      parseInt(startMinute, 10)
    );
    const endTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(endHour, 10),
      parseInt(endMinute, 10)
    );

    if (startTime.getTime() === endTime.getTime()) {
      alert('시작시간과 종료시간이 동일합니다.');
      return;
    }
    if (startTime.getTime() > endTime.getTime()) {
      alert('시작시간이 종료시간보다 늦습니다.');
      return;
    }
    if ((endTime.getTime() - startTime.getTime()) / (1000 * 60) <= 30) {
      alert('운동시간이 너무 짧습니다. 확인해주세요.');
      return;
    }

    const request = existingIndex !== -1 ? patchAttendance : postAttendance;

    setLoading(true);
    try {
      const data = await request({
        ...myAttendance,
        name: myMember?.name || user.name,
        gender: myMember?.gender || user.gender,
        userId: myMember?.id || user.id,
      });
      console.log(data);
      toast({
        title:
          existingIndex !== -1
            ? '참석시간이 수정되었습니다.'
            : '참석시간이 등록되었습니다.',
        duration: 500,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: '오류가 발생했습니다.',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAttendance = async () => {
    if (existingIndex === -1) {
      toast({
        title: '삭제할 참석 정보가 없습니다.',
        variant: 'destructive',
        duration: 1500,
      });
      return;
    }

    const isConfirmed = confirm('참석시간을 삭제하시겠습니까?');
    if (!isConfirmed) {
      return;
    }

    setLoading(true);
    try {
      await removeAttendance(myAttendance._key);

      // 삭제 후 상태 초기화
      setExistingIndex(-1);
      setMyAttendance({
        _key: crypto.randomUUID(),
        name: myMember?.name || user.name,
        gender: myMember?.gender || user.gender,
        userId: myMember?.id || user.id,
        startHour: schedule?.startTime || '19',
        startMinute: '00',
        endHour: schedule?.endTime || '22',
        endMinute: '00',
      });

      toast({
        title: '참석시간이 삭제되었습니다.',
        duration: 500,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: '삭제 중 오류가 발생했습니다.',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingGrid loading={isLoading} />;
  }

  if (!schedule) {
    return <p>데이터를 불러 올 수 없습니다.</p>;
  }

  const { date, courtName, startTime, endTime, attendees } = schedule;

  return (
    <Container className="space-y-4 pb-[70px]">
      {loading && <LoadingGrid loading={loading} />}
      <Label className="w-full">참석 시간</Label>
      <div className="flex gap-x-2 items-center">
        <Select
          value={myAttendance.startHour}
          onValueChange={(value) => {
            if (!value) return;
            setMyAttendance({ ...myAttendance, startHour: value });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from(
              { length: Number(endTime) - Number(startTime) },
              (_, idx) => (
                <SelectItem value={String(Number(startTime) + idx)} key={idx}>
                  {String(Number(startTime) + idx)}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        <Select
          value={myAttendance.startMinute}
          onValueChange={(value) => {
            if (!value) return;
            setMyAttendance({ ...myAttendance, startMinute: value });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="00">00</SelectItem>
            <SelectItem value="30">30</SelectItem>
          </SelectContent>
        </Select>
        <span>~</span>
        <Select
          value={myAttendance.endHour}
          onValueChange={(value) => {
            if (!value) return;
            setMyAttendance({ ...myAttendance, endHour: value });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from(
              { length: Number(endTime) - Number(startTime) },
              (_, idx) => (
                <SelectItem
                  value={String(Number(startTime) + idx + 1)}
                  key={idx}
                >
                  {String(Number(startTime) + idx + 1)}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select
          value={myAttendance.endMinute}
          onValueChange={(value) => {
            if (!value) return;
            setMyAttendance({ ...myAttendance, endMinute: value });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="00">00</SelectItem>
            <SelectItem value="30">30</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-x-2">
        {existingIndex !== -1 && (
          <Button
            type="button"
            className="w-full mt-2"
            variant="destructive"
            onClick={handleRemoveAttendance}
          >
            참석시간 삭제
          </Button>
        )}
        <Button
          type="button"
          className="w-full mt-2"
          onClick={handleAttendance}
        >
          {existingIndex !== -1 ? '참석시간 수정' : '참석시간 등록'}
        </Button>
      </div>

      <div className="bg-white border rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{courtName}</h2>
            <p className="text-gray-600">
              {format(new Date(date), 'yyyy년 MM월 dd일 (EEE)', {
                locale: ko,
              })}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">시작</p>
            <p className="text-lg font-bold text-blue-600">
              {startTime}-{endTime}
            </p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">총 참석자</p>
            <p className="text-lg font-bold text-green-600">
              {attendees.length}명
            </p>
          </div>
          <div className=" bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">코트</p>
            <p className="text-lg font-bold text-orange-600">
              {Array.isArray(schedule.courtNumbers)
                ? schedule.courtNumbers
                    .map((cn) =>
                      typeof cn === 'object' && cn.number ? cn.number : cn
                    )
                    .join(', ')
                : '0'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {attendees?.map((attendee, index) => (
            <div
              key={
                attendee._key && attendee._key.trim()
                  ? attendee._key
                  : `attendee-${index}`
              }
              className="bg-gray-100 rounded-lg p-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  참가자 {index + 1}
                </span>
                <div className="text-sm">
                  {attendee.name} ({attendee.gender})
                </div>
                <span className="text-sm text-gray-500">
                  {attendee.startHour}:{attendee.startMinute} -{' '}
                  {attendee.endHour}:{attendee.endMinute}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

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
      />
    </Container>
  );
}

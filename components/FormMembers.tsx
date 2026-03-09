import { useRef, useState, useEffect } from 'react';
import { FormItem, FormLabel } from './ui/form';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import {
  AttendanceProps,
  GetScheduleProps,
  ScheduleFormType,
} from '@/model/schedule';
import {
  useFieldArray,
  UseFormReturn,
  FieldArrayWithId,
} from 'react-hook-form';
import { AuthUser } from '@/model/user';

type Props = {
  form: UseFormReturn<ScheduleFormType>;
  attendees: AttendanceProps[];
  startTime: number;
  endTime: number;
  postAttendance?: (
    data: AttendanceProps
  ) => Promise<GetScheduleProps | undefined>;
  removeAttendance?: (
    attendanceKey: string
  ) => Promise<GetScheduleProps | undefined>;
  user: AuthUser;
};

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function FormMembers({
  attendees,
  form,
  endTime,
  startTime,
  postAttendance,
  removeAttendance,
  user,
}: Props) {
  const guestNameRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLButtonElement>(null);

  const [attendanceTime, setAttendanceTime] = useState({
    startHour: String(startTime),
    startMinute: '00',
    endHour: String(endTime),
    endMinute: '00',
  });

  // startTime과 endTime이 변경될 때 attendanceTime 상태 업데이트
  useEffect(() => {
    setAttendanceTime({
      startHour: String(startTime),
      startMinute: '00',
      endHour: String(endTime),
      endMinute: '00',
    });
  }, [startTime, endTime]);

  const { fields } = useFieldArray({
    control: form.control,
    name: 'attendees',
  });

  // console.log('members', members);

  const isAttendee = (name: string, userId?: string) => {
    if (userId) {
      return fields.some(
        (attendee: FieldArrayWithId<ScheduleFormType, 'attendees', 'id'>) =>
          'userId' in attendee && attendee.userId === userId
      );
    }
    return fields.some((attendee) => {
      return attendee.name === name;
    });
  };

  // 본인이 이미 참석 신청했는지 확인 (이름과 ID가 모두 일치)
  const isMyAttendance = () => {
    return fields.some((att) => {
      return att.name === user.name && att.author?._ref === user.id;
    });
  };

  async function handleAddMember(myAdd?: boolean) {
    let name = '';
    let gender = '';
    if (myAdd) {
      name = user.name;
      gender = user.gender;
    } else {
      name = guestNameRef.current?.value || '';
      gender = genderRef.current?.textContent || '남성';
    }

    if (!name) return;

    if (isAttendee(name)) {
      alert('이미 추가된 참석자입니다.');
      return;
    }
    // postAttendance가 제공된 경우 사용
    if (postAttendance) {
      const attendanceData: AttendanceProps = {
        _key: uuid(),
        name,
        gender,
        userId: user.id,
        startHour: attendanceTime.startHour,
        startMinute: attendanceTime.startMinute,
        endHour: attendanceTime.endHour,
        endMinute: attendanceTime.endMinute,
      };
      try {
        await postAttendance(attendanceData);
      } catch (error) {
        console.error('참석자 추가 실패:', error);
        alert('참석자 추가에 실패했습니다.');
      } finally {
        if (guestNameRef.current) {
          guestNameRef.current.value = '';
        }
      }
    }
  }

  async function handleRemoveMember(attendees: AttendanceProps) {
    const isConfirmed = confirm('참석자를 삭제하시겠습니까?');
    if (!isConfirmed) {
      return;
    }
    if (removeAttendance) {
      try {
        await removeAttendance(attendees._key);
      } catch (error) {
        console.error('참석자 삭제 실패:', error);
      }
    }

    // remove(index);
  }

  return (
    <div>
      <div className="space-y-4">
        <div className="flex items-align justify-between">
          <FormLabel htmlFor="attendeesCheck">게스트 등록</FormLabel>
        </div>

        <FormItem>
          <div className="flex gap-x-2">
            <Input
              type="text"
              ref={guestNameRef}
              placeholder="참석자 이름을 입력해주세요."
              className="flex-1 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              onKeyUp={(e) => {
                if (e.key === 'Enter' && guestNameRef.current?.value) {
                  e.preventDefault();
                  handleAddMember(false);
                  if (guestNameRef.current) {
                    guestNameRef.current.value = '';
                  }
                }
              }}
            />
            <Select defaultValue="남성">
              <SelectTrigger className="basis-[100px]" ref={genderRef}>
                <SelectValue placeholder="성별" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="남성">남성</SelectItem>
                <SelectItem value="여성">여성</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FormItem>

        <FormItem>
          <div className="flex gap-x-2 items-center">
            <Select
              value={attendanceTime.startHour}
              onValueChange={(value) => {
                if (!value) return;
                setAttendanceTime((pre) => ({
                  ...pre,
                  startHour: value,
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: endTime - startTime }, (_, idx) => (
                  <SelectItem value={String(startTime + idx)} key={idx}>
                    {String(startTime + idx)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={attendanceTime.startMinute}
              onValueChange={(value) => {
                if (!value) return;
                setAttendanceTime((pre) => ({
                  ...pre,
                  startMinute: value,
                }));
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
              value={attendanceTime.endHour}
              onValueChange={(value) => {
                if (!value) return;
                setAttendanceTime((pre) => ({ ...pre, endHour: value }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: endTime - startTime }, (_, idx) => (
                  <SelectItem value={`${startTime + idx + 1}`} key={idx}>
                    {startTime + idx + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={attendanceTime.endMinute}
              onValueChange={(value) => {
                if (!value) return;
                setAttendanceTime((pre) => ({
                  ...pre,
                  endMinute: value,
                }));
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
        </FormItem>
        <div className="flex gap-x-2">
          <Button
            variant="secondary"
            onClick={() => handleAddMember(false)}
            type="button"
            className="w-full"
          >
            게스트참석등록
          </Button>

          {!isMyAttendance() && (
            <Button
              variant="secondary"
              onClick={() => handleAddMember(true)}
              type="button"
              className="w-full"
            >
              나의참석등록
            </Button>
          )}
        </div>

        <div>
          {attendees && attendees.length > 0 && (
            <>
              <div>참석자 목록</div>
              <table className="table w-full text-center text-xs">
                <thead>
                  <tr>
                    <th>번호</th>
                    <th>참석자명</th>
                    <th>성별</th>
                    <th>참석시간</th>
                    <th>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((attendees, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{attendees.name}</td>
                      <td>{attendees.gender}</td>
                      <td>
                        {attendees.startHour}:{attendees.startMinute}~
                        {attendees.endHour}:{attendees.endMinute}
                      </td>
                      <td>
                        <Button
                          type="button"
                          size="xs"
                          variant="destructive"
                          onClick={() => {
                            handleRemoveMember(attendees);
                          }}
                          disabled={attendees.author?._ref !== user.id}
                        >
                          삭제
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { z } from 'zod';

export const ScheduleFormSchema = z.object({
  date: z.date({
    required_error: '코트 이용 날짜를 입력해주세요.',
  }),
  startTime: z.string({
    required_error: '코트 이용 시작 시간 입력해주세요.',
  }),
  endTime: z.string({
    required_error: '코트 이용 종료 시간 입력해주세요.',
  }),
  courtName: z.string({
    required_error: '코트장 이름을 입력해주세요.',
  }),
  otherCourtName: z.string().optional(),
  courtCount: z.string({
    required_error: '코트 수 입력해주세요.',
  }),
  courtNumbers: z.array(
    z.object({
      _key: z.string().optional(),
      number: z.string().min(1, '코트 번호를 입력해주세요.'),
      startTime: z.string(),
      endTime: z.string(),
    })
  ),
  status: z
    .enum(['pending', 'attendees', 'matchmaking', 'shared', 'playing', 'done'])
    .default('pending'),
  attendees: z
    .array(
      z.object({
        _key: z.string(),
        author: z
          .object({
            _ref: z.string(),
          })
          .optional(),
        name: z.string(),
        gender: z.string(),
        startHour: z.string(),
        startMinute: z.string(),
        endHour: z.string(),
        endMinute: z.string(),
      })
    )
    .optional()
    .default([]),
});

export type ScheduleFormType = z.infer<typeof ScheduleFormSchema>;

export const GetScheduleSchema = ScheduleFormSchema.extend({
  id: z.string(), // _id 추가
});

export type GetScheduleType = z.infer<typeof GetScheduleSchema>;

export type ScheduleProps = {
  date: Date;
  startTime: string;
  endTime: string;
  courtName: string;
  otherCourtName?: string;
  courtCount: string;
  courtNumbers: {
    _key?: string;
    number: string;
    startTime: string;
    endTime: string;
  }[];
  attendees: AttendanceProps[];
  status:
    | 'pending'
    | 'attendees'
    | 'matchmaking'
    | 'shared'
    | 'playing'
    | 'done';
};

export type AttendanceProps = {
  _key: string;
  author?: {
    _ref: string;
  };
  name: string;
  gender: string;
  userId: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};

export type AttendanceWithKeyProps = AttendanceProps & {
  _key: string;
};

export type GetScheduleProps = {
  id: string;
  hasGameResult?: boolean;
  gameResultId?: string;
  gameResultCount?: number;
  comments?: Array<{
    _key: string;
    author: {
      _ref: string;
      name: string;
      username: string;
      image?: string;
    };
    text: string;
    createdAt?: string;
  }>;
} & ScheduleProps;

import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { ScheduleFormType } from '@/model/schedule';
import FormSelectTime from './FormSelectTime';

type FormProps = {
  form: UseFormReturn<ScheduleFormType>;
  idx: number;
  onTimeChange?: () => void;
};

export default function FormCourtNumber({
  form,
  idx,
  onTimeChange,
}: FormProps) {
  // 코트별 시간 선택은 항상 6시-24시 범위에서 가능하도록 설정
  const timeRangeStart = 6;
  const timeRangeEnd = 24;
  // console.log('courtNumbers', form.watch('courtNumbers'));

  return (
    <div className="flex flex-1 gap-2 border p-2 rounded-md">
      <FormField
        key={idx}
        control={form.control}
        name={`courtNumbers.${idx}.number`}
        render={({ field }) => (
          <FormItem className="flex flex-col flex-1">
            <FormLabel>{`코트 번호 ${idx + 1}`}</FormLabel>
            <Input
              {...field}
              value={field.value ?? ''}
              placeholder={`코트 번호 ${idx + 1}`}
            />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormSelectTime
        form={form}
        name={`courtNumbers.${idx}.startTime`}
        label="시작시간"
        startTime={timeRangeStart}
        endTime={timeRangeEnd}
        onChange={(val) => {
          form.setValue(`courtNumbers.${idx}.startTime`, val, {
            shouldValidate: true,
          });
          onTimeChange?.();
        }}
      />
      <FormSelectTime
        form={form}
        name={`courtNumbers.${idx}.endTime`}
        label="종료시간"
        startTime={timeRangeStart}
        endTime={timeRangeEnd}
        value={form.watch(`courtNumbers.${idx}.endTime`) || '22'}
        onChange={(val) => {
          form.setValue(`courtNumbers.${idx}.endTime`, val, {
            shouldValidate: true,
          });
          onTimeChange?.();
        }}
      />
    </div>
  );
}

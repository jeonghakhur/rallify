import { ScheduleFormType } from '@/model/schedule';
import { FormField, FormItem, FormLabel } from './ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { UseFormReturn, FieldPath } from 'react-hook-form';

// type SelectTimeFormProps = {
//   form: UseFormReturn<ScheduleFormType>;
//   name: keyof ScheduleFormType;
// };

type SelectTimeFormProps = {
  form: UseFormReturn<ScheduleFormType>;
  name: FieldPath<ScheduleFormType>;
  startTime?: number;
  endTime?: number;
  label?: string;
  value?: string | undefined;
  onChange?: (val: string) => void;
};

export default function FormSelectTime({
  form,
  name,
  startTime,
  endTime,
  label,
  value,
  onChange,
}: SelectTimeFormProps) {
  function timeFormat(value: number): string {
    return value.toString().padStart(2, '0'); // ✅ `0`을 앞에 붙여 2자리 문자열로 변환
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        return (
          <FormItem className="flex flex-col">
            {label && <FormLabel>{label}</FormLabel>}
            <Select
              onValueChange={(val) => {
                field.onChange(val);
                onChange?.(val);
              }}
              value={field.value ? String(field.value) : value || ''}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" className="h-[200px]">
                {name.endsWith('startTime')
                  ? Array.from(
                      { length: (endTime ?? 22) - (startTime ?? 19) },
                      (_, i) => {
                        const hour = (startTime ?? 19) + i;
                        if (endTime !== undefined && hour >= endTime)
                          return null;
                        return (
                          <SelectItem value={`${hour}`} key={`startTime_${i}`}>
                            {timeFormat(hour)}
                          </SelectItem>
                        );
                      }
                    )
                  : Array.from(
                      { length: (endTime ?? 22) - (startTime ?? 19) },
                      (_, i) => {
                        const hour = (startTime ?? 19) + i + 1;
                        if (endTime !== undefined && hour > endTime)
                          return null;
                        return (
                          <SelectItem value={`${hour}`} key={`endTime_${i}`}>
                            {timeFormat(hour)}
                          </SelectItem>
                        );
                      }
                    )}
              </SelectContent>
            </Select>
          </FormItem>
        );
      }}
    />
  );
}

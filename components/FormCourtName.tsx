import { ScheduleFormType } from '@/model/schedule';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';

type FormProps = {
  form: UseFormReturn<ScheduleFormType>;
  value?: string;
};

export default function FormCourtName({ form, value }: FormProps) {
  const selectedCourtName = form.watch('courtName'); // 현재 선택된 값 감지
  const isCustomInput = selectedCourtName === '직접입력';

  return (
    <>
      <FormField
        control={form.control}
        name="courtName"
        render={({ field }) => {
          // console.log(field.value);
          return (
            <FormItem className="flex flex-col">
              <FormLabel>코트 이름</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value); // 값 설정
                    if (value !== '직접입력') {
                      form.setValue('otherCourtName', ''); // 직접 입력이 아닐 경우 초기화
                    }
                  }}
                  value={value || field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="코트를 선택해주세요" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="망원한강공원">망원한강공원</SelectItem>
                    <SelectItem value="그랜드슬램">그랜드슬램</SelectItem>
                    <SelectItem value="직접입력">직접입력</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
      {/* 🏀 직접 입력 필드 (직접입력 선택 시만 표시) */}
      {isCustomInput && (
        <FormField
          control={form.control}
          name="otherCourtName"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  placeholder="코트 이름을 입력해주세요"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}

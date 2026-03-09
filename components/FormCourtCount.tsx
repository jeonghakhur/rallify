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
import { ScheduleFormType } from '@/model/schedule';

type FormProps = {
  form: UseFormReturn<ScheduleFormType>;
  value?: string;
  onHandleChange: (count: string) => void;
};

export default function FormCourtCount({
  form,
  value,
  onHandleChange,
}: FormProps) {
  return (
    <FormField
      control={form.control}
      name="courtCount"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>코트 수</FormLabel>
          <Select
            onValueChange={(value) => {
              field.onChange(value);
              onHandleChange(value);
            }}
            value={field.value || value || ''}
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
  );
}

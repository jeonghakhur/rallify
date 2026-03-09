import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScheduleFormType } from '@/model/schedule';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

type FormProps = {
  form: UseFormReturn<ScheduleFormType>; // ✅ useForm 타입 지정
};

export default function FormDatePicker({ form }: FormProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  // const selectedDate = form?.watch ? form.watch('date') : new Date();

  return (
    <FormField
      control={form.control}
      name="date"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>날짜 입력</FormLabel>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  size="lg"
                  className="pl-3 text-left font-normal"
                  onClick={() => setPopoverOpen(true)}
                >
                  {field.value
                    ? format(field.value, 'yyyy.MM.dd')
                    : format(new Date(), 'yyyy.MM.dd')}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value} // ✅ 기본 선택 날짜 지정
                onSelect={(date) => {
                  field.onChange(date);
                  setPopoverOpen(false);
                  console.log(date);
                }}
                defaultMonth={field.value}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

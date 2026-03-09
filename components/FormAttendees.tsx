import { AttendanceProps } from '@/model/schedule';
import { Button } from './ui/button';

type Props = {
  attendees: AttendanceProps[];
  onRemoveAttendee: (attendeeKey: string) => void;
};

export default function FormAttendees({ attendees, onRemoveAttendee }: Props) {
  return (
    <div>
      {attendees && (
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
            {attendees.map((field, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{field.name}</td>
                <td>{field.gender}</td>
                <td>
                  {field.startHour}:{field.startMinute}~{field.endHour}:
                  {field.endMinute}
                </td>
                <td>
                  <Button
                    type="button"
                    size="xs"
                    variant="destructive"
                    onClick={() => onRemoveAttendee(field._key || '')}
                  >
                    삭제
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

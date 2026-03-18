import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { School } from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
  subject: string;
  classCode: string;
  studentCount: number;
}

interface ClassSelectorProps {
  value?: string;
  onChange?: (classId: string) => void;
  selectedClassId?: string;
  onClassChange?: (classId: string) => void;
  placeholder?: string;
  showAll?: boolean;
  showAllOption?: boolean;
  className?: string;
}

export default function ClassSelector({
  value,
  onChange,
  selectedClassId,
  onClassChange,
  placeholder = "Select a class…",
  showAll,
  showAllOption,
  className,
}: ClassSelectorProps) {
  const currentValue = selectedClassId ?? value ?? "";
  const handleChange = onClassChange ?? onChange ?? (() => {});
  const showAllClasses = showAllOption ?? showAll ?? false;

  const { data: classList = [] } = useQuery<ClassItem[]>({
    queryKey: ["/api/teacher/classes"],
  });

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className={`rounded-xl border-[#E5E5E0] dark:border-[#22221F] ${className ?? ""}`} data-testid="select-class">
        <div className="flex items-center gap-2">
          <School className="w-4 h-4 text-[#999990] shrink-0" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {showAllClasses && <SelectItem value="all">All Classes</SelectItem>}
        {classList.length === 0 ? (
          <div className="px-3 py-2 text-sm text-[#999990]">No classes yet — create one in My Classes</div>
        ) : (
          classList.map(cls => (
            <SelectItem key={cls.id} value={cls.id}>
              <span className="font-medium">{cls.name}</span>
              <span className="text-[#999990] ml-2 text-[12px]">{cls.subject} · {cls.studentCount} student{cls.studentCount !== 1 ? "s" : ""}</span>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

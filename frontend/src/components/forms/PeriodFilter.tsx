import React from "react";
import { Select } from "../ui/FormFields";
import { MONTH_NAMES, getYearOptions } from "../../utils/formatters";
import { useFilterStore } from "../../stores/filter.store";
import { useUsers } from "../../hooks/useUsers";

interface PeriodFilterProps {
  showUserFilter?: boolean;
  showAllUsersOption?: boolean;
}

export function PeriodFilter({
  showUserFilter = false,
  showAllUsersOption = true,
}: PeriodFilterProps) {
  const { month, year, selectedUserId, setMonth, setYear, setSelectedUserId } =
    useFilterStore();

  const { data: users } = useUsers();

  const monthOptions = MONTH_NAMES.map((name, i) => ({
    value: String(i + 1),
    label: name,
  }));

  const yearOptions = getYearOptions().map((y) => ({
    value: String(y),
    label: String(y),
  }));

  const userOptions = [
    ...(showAllUsersOption ? [{ value: "", label: "Casal (todos)" }] : []),
    ...(users ?? []).map((u) => ({ value: u.id, label: u.name })),
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Select
        options={monthOptions}
        value={String(month)}
        onChange={(e) => setMonth(Number(e.target.value))}
        className="w-36"
      />
      <Select
        options={yearOptions}
        value={String(year)}
        onChange={(e) => setYear(Number(e.target.value))}
        className="w-28"
      />
      {showUserFilter && (
        <Select
          options={userOptions}
          value={selectedUserId ?? ""}
          onChange={(e) =>
            setSelectedUserId(e.target.value || undefined)
          }
          className="w-44"
        />
      )}
    </div>
  );
}

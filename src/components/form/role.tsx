import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import { UserRoleProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";

const UserRoleField = ({
  handleRoleChange,
  role,
  isUpdate = true
}: UserRoleProps) => {
  const { t } = useTranslation();
  const roleOptions = [
    ...(isUpdate
      ? [
          {
            id: "status-tb-0",
            value: USER_ACCESS_LEVELS.NO_ACCESS.CODE,
            label: t("user.roles.noAccess", "No Access")
          }
        ]
      : []),
    {
      id: "status-tb-1",
      value: USER_ACCESS_LEVELS.READ_ONLY.CODE,
      label: t("user.roles.readOnly", "Read-only")
    },
    {
      id: "status-tb-2",
      value: USER_ACCESS_LEVELS.CONDUCTOR.CODE,
      label: t("user.roles.conductor", "Conductor")
    },
    {
      id: "status-tb-4",
      value: USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE,
      label: t("user.roles.administrator", "Admin")
    }
  ];

  return (
    <ToggleGroup
      aria-label="Select role"
      value={role ? [role] : []}
      variant="outline"
      onValueChange={(values) => {
        const value = values[0];
        if (value) {
          handleRoleChange?.(value);
        }
      }}
      className="flex flex-nowrap gap-0 justify-center w-full"
    >
      {roleOptions.map((roleOption) => (
        <ToggleGroupItem
          key={roleOption.id}
          value={roleOption.value}
          className="min-w-0 flex-1 px-2 text-sm"
        >
          {roleOption.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

export default UserRoleField;

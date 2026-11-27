import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import { UserRoleProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";
import usePublisherRoleEnabled from "../../hooks/usePublisherRoleEnabled";

const UserRoleField = ({ handleRoleChange, role }: UserRoleProps) => {
  const { t } = useTranslation();
  const isPublisherRoleEnabled = usePublisherRoleEnabled();
  // Offered where the role is switched on, and kept for a person who already
  // holds it so their current role still shows.
  const offersPublisher =
    isPublisherRoleEnabled || role === USER_ACCESS_LEVELS.PUBLISHER.CODE;
  const roleOptions = [
    ...(offersPublisher
      ? [
          {
            id: "status-tb-publisher",
            value: USER_ACCESS_LEVELS.PUBLISHER.CODE,
            label: t("user.roles.publisher", "Publisher"),
            hint: t(
              "user.roles.publisherHint",
              "A publisher only sees and works the maps given to their account."
            )
          }
        ]
      : []),
    {
      id: "status-tb-1",
      value: USER_ACCESS_LEVELS.READ_ONLY.CODE,
      label: t("user.roles.readOnly", "Read Only"),
      hint: t(
        "user.roles.readOnlyHint",
        "Can view territories and maps, but cannot change anything."
      )
    },
    {
      id: "status-tb-2",
      value: USER_ACCESS_LEVELS.CONDUCTOR.CODE,
      label: t("user.roles.conductor", "Conductor"),
      hint: t(
        "user.roles.conductorHint",
        "Can update maps and give them out to publishers."
      )
    },
    {
      id: "status-tb-4",
      value: USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE,
      label: t("user.roles.administrator", "Admin"),
      hint: t(
        "user.roles.administratorHint",
        "Can manage everything: territories, maps, members and settings."
      )
    }
  ];

  const hint = roleOptions.find((option) => option.value === role)?.hint;

  return (
    <div className="space-y-1.5">
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
            className="min-w-0 flex-1 px-1 text-xs sm:px-2 sm:text-sm"
          >
            {roleOption.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
};

export default UserRoleField;

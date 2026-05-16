import NiceModal from "@ebay/nice-modal-react";
import * as React from "react";
import { FormEvent, useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RecordModel } from "pocketbase";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { USER_ACCESS_LEVELS, PB_FIELDS } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import { UserModalProps, SelectProps } from "../../utils/interface";
import UserRoleField from "../form/role";
import {
  createData,
  getFirstItemOfList,
  getPaginatedList
} from "../../utils/pocketbase";
import ComponentAuthorizer from "../navigation/authorizer";

const InviteUser = NiceModal.create(
  ({
    uid,
    congregation,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE
  }: UserModalProps) => {
    const { t } = useTranslation();
    const { notifyWarning, runAction } = useNotification();
    const [userRole, setUserRole] = useState(USER_ACCESS_LEVELS.READ_ONLY.CODE);
    const [userId, setUserId] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [searchResults, setSearchResults] = React.useState<SelectProps[]>([]);
    const [selectedUser, setSelectedUser] = React.useState<SelectProps | null>(
      null
    );
    const [isSearching, setIsSearching] = React.useState(false);
    const abortControllerRef = React.useRef<AbortController | null>(null);
    const { modal, dialogProps, contentProps } = useBaseUiDialog();

    React.useEffect(() => {
      return () => {
        abortControllerRef.current?.abort();
      };
    }, []);

    const comboboxItems = React.useMemo(() => {
      if (!selectedUser) return searchResults;
      const found = searchResults.some((r) => r.value === selectedUser.value);
      return found ? searchResults : [...searchResults, selectedUser];
    }, [searchResults, selectedUser]);

    const getRoleDisplayName = (roleCode: string): string => {
      if (roleCode === USER_ACCESS_LEVELS.READ_ONLY.CODE) {
        return t("user.roles.readOnly", "Read Only");
      } else if (roleCode === USER_ACCESS_LEVELS.CONDUCTOR.CODE) {
        return t("user.roles.conductor", "Conductor");
      } else if (roleCode === USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE) {
        return t("user.roles.administrator", "Administrator");
      } else if (roleCode === USER_ACCESS_LEVELS.NO_ACCESS.CODE) {
        return t("user.roles.noAccess", "No Access");
      }
      return "";
    };

    const handleUserDetails = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      await runAction(
        async () => {
          if (userId === uid) {
            notifyWarning(
              t("user.dontInviteSelf", "Please do not invite yourself.")
            );
            return;
          }
          if (
            await getFirstItemOfList(
              "roles",
              `user="${userId}" && congregation="${congregation}"`,
              {
                requestKey: `check-role-${userId}-${congregation}`,
                fields: "id"
              }
            )
          ) {
            notifyWarning(
              t(
                "user.alreadyInCongregation",
                "This user is already part of the congregation."
              )
            );
            return;
          }

          await createData(
            "roles",
            {
              user: userId,
              congregation,
              role: userRole
            },
            {
              requestKey: `create-role-${userId}-${congregation}`
            }
          );

          const roleName = getRoleDisplayName(userRole);
          notifyWarning(
            t("user.accessGranted", "Granted {{role}} access to user.", {
              role: roleName
            })
          );
          modal.hide();
        },
        { setLoading: setIsSaving }
      );
    };

    const handleInputChange = async (
      inputValue: string,
      { reason }: { reason: string }
    ) => {
      if (reason === "item-press") return;

      abortControllerRef.current?.abort();

      if (!inputValue.trim()) {
        setSearchResults([]);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsSearching(true);

      try {
        const users = await getPaginatedList("users", 1, 10, {
          filter: `(email~"${inputValue}%" || name~"${inputValue}%")`,
          fields: PB_FIELDS.USERS,
          requestKey: `get-users-${inputValue}`
        });
        if (controller.signal.aborted) return;
        const options: SelectProps[] = users.items.map((user: RecordModel) => ({
          label:
            user.name && user.email
              ? `${user.name} - ${user.email}`
              : user.name,
          value: user.id
        }));
        setSearchResults(options);
      } catch {
        if (controller.signal.aborted) return;
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader>
            <DialogTitle>{t("user.inviteUser", "Invite User")}</DialogTitle>
            <DialogDescription>
              {t(
                "user.inviteDescription",
                "Search for a user and assign their access level."
              )}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <form onSubmit={handleUserDetails} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("user.user", "User")}</Label>
              <Combobox.Root
                filter={null}
                items={comboboxItems}
                itemToStringLabel={(item: SelectProps) => item.label}
                isItemEqualToValue={(a: SelectProps, b: SelectProps) =>
                  a.value === b.value
                }
                onInputValueChange={handleInputChange}
                onValueChange={(item: SelectProps | null) => {
                  setSelectedUser(item);
                  setUserId(item?.value ?? "");
                }}
                onOpenChangeComplete={(open: boolean) => {
                  if (!open && selectedUser) setSearchResults([selectedUser]);
                }}
              >
                <Combobox.InputGroup className="relative flex h-9 w-full items-center rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                  <Combobox.Input
                    placeholder={t(
                      "user.searchByNameOrEmail",
                      "Search for user by name or email"
                    )}
                    className="h-full w-full border-0 bg-transparent pl-3 pr-16 text-sm outline-none placeholder:text-muted-foreground"
                    required
                  />
                  <div className="absolute right-1 flex h-9 items-center gap-0.5 text-muted-foreground">
                    {isSearching && (
                      <Spinner className="size-3.5" aria-hidden="true" />
                    )}
                    <Combobox.Clear
                      className="flex size-7 items-center justify-center rounded hover:text-foreground"
                      aria-label="Clear"
                    >
                      <X className="size-3.5" />
                    </Combobox.Clear>
                    <Combobox.Trigger
                      className="flex size-7 items-center justify-center rounded hover:text-foreground"
                      aria-label="Open"
                    >
                      <ChevronDown className="size-4" />
                    </Combobox.Trigger>
                  </div>
                </Combobox.InputGroup>
                <Combobox.Portal>
                  <Combobox.Positioner
                    sideOffset={4}
                    className="isolate z-[2001] outline-none"
                  >
                    <Combobox.Popup className="w-[var(--anchor-width)] max-h-[min(var(--available-height),20rem)] overflow-y-auto overscroll-contain rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md origin-[var(--transform-origin)] transition-[transform,scale,opacity] duration-100 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
                      <Combobox.Status>
                        {isSearching && (
                          <div className="px-3 py-1.5 text-xs text-muted-foreground">
                            Searching...
                          </div>
                        )}
                      </Combobox.Status>
                      <Combobox.Empty>
                        <div className="px-3 py-1.5 text-xs text-muted-foreground">
                          {t("common.noResults", "No results found.")}
                        </div>
                      </Combobox.Empty>
                      <Combobox.List>
                        {(item: SelectProps) => (
                          <Combobox.Item
                            key={item.value}
                            value={item}
                            className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                          >
                            <Combobox.ItemIndicator className="flex size-3.5 items-center justify-center">
                              <Check className="size-3.5" />
                            </Combobox.ItemIndicator>
                            {item.label}
                          </Combobox.Item>
                        )}
                      </Combobox.List>
                    </Combobox.Popup>
                  </Combobox.Positioner>
                </Combobox.Portal>
              </Combobox.Root>
            </div>
            <div className="space-y-1.5">
              <Label>{t("user.accessLevel", "Access Level")}</Label>
              <UserRoleField
                role={userRole}
                handleRoleChange={(value) => setUserRole(value)}
                isUpdate={false}
              />
            </div>
            <Separator />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={modal.hide}>
                {t("common.cancel", "Cancel")}
              </Button>
              <ComponentAuthorizer
                requiredPermission={footerSaveAcl}
                userPermission={footerSaveAcl}
              >
                <Button type="submit" disabled={isSaving}>
                  {isSaving && (
                    <Spinner data-icon="inline-start" aria-hidden="true" />
                  )}
                  {t("user.invite", "Invite")}
                </Button>
              </ComponentAuthorizer>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default InviteUser;

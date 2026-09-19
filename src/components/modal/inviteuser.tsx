import NiceModal from "@ebay/nice-modal-react";
import * as React from "react";
import { FormEvent, useState } from "react";
import {
  Combobox,
  ComboboxActions,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  ComboboxTrigger
} from "@/components/ui/combobox";
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
import SubmitButton from "../common/submit-button";
import { USER_ACCESS_LEVELS, PB_FIELDS } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import { UserModalProps, SelectProps } from "../../utils/interface";
import UserRoleField from "../form/role";
import {
  createData,
  getFirstItemOfList,
  getPaginatedList
} from "../../utils/pocketbase";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";

const InviteUser = NiceModal.create(({ uid, congregation }: UserModalProps) => {
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
  const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const { modal, dialogProps, contentProps } = useBaseUiDialog();

  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (searchDebounceRef.current !== null) {
        clearTimeout(searchDebounceRef.current);
      }
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
      return t("user.roles.administrator", "Admin");
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
        trackEvent(ANALYTICS_EVENTS.USER_INVITED, { role: userRole });

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

  const searchUsers = async (inputValue: string) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsSearching(true);

    try {
      const users = await getPaginatedList("users", 1, 10, {
        filter: `(email~"${inputValue}%" || name~"${inputValue}%")`,
        fields: PB_FIELDS.USERS,
        // Stable key: a newer search auto-cancels the in-flight one. A
        // per-keystroke key would let every request run to completion.
        requestKey: "invite-user-search"
      });
      if (controller.signal.aborted) return;
      const options: SelectProps[] = users.items.map((user: RecordModel) => ({
        label:
          user.name && user.email ? `${user.name} - ${user.email}` : user.name,
        value: user.id
      }));
      setSearchResults(options);
    } catch {
      if (controller.signal.aborted) return;
    } finally {
      if (!controller.signal.aborted) setIsSearching(false);
    }
  };

  const handleInputChange = (
    inputValue: string,
    { reason }: { reason: string }
  ) => {
    if (reason === "item-press") return;

    abortControllerRef.current?.abort();
    if (searchDebounceRef.current !== null) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!inputValue.trim()) {
      setSearchResults([]);
      return;
    }

    // Debounce so typing fires one request, not one per keystroke.
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      void searchUsers(inputValue);
    }, 300);
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
            <Combobox
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
              <ComboboxInputGroup>
                <ComboboxInput
                  placeholder={t(
                    "user.searchByNameOrEmail",
                    "Search for user by name or email"
                  )}
                  required
                />
                <ComboboxActions>
                  {isSearching && (
                    <Spinner className="size-3.5" aria-hidden="true" />
                  )}
                  <ComboboxClear />
                  <ComboboxTrigger />
                </ComboboxActions>
              </ComboboxInputGroup>
              <ComboboxContent>
                <ComboboxStatus>
                  {isSearching && t("common.searching", "Searching...")}
                </ComboboxStatus>
                <ComboboxEmpty>
                  {t("common.noResults", "No results found.")}
                </ComboboxEmpty>
                <ComboboxList>
                  {(item: SelectProps) => (
                    <ComboboxItem key={item.value} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
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
            <SubmitButton pending={isSaving}>
              {t("user.invite", "Invite")}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

export default InviteUser;

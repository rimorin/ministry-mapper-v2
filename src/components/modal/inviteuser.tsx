import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useState, FormEvent, useCallback, useMemo } from "react";
import { Modal, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import AsyncSelect from "react-select/async";
import { OptionsOrGroups, GroupBase } from "react-select";
import { RecordModel } from "pocketbase";
import { USER_ACCESS_LEVELS, WIKI_CATEGORIES } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import { UserModalProps, SelectProps } from "../../utils/interface";
import ModalFooter from "../form/footer";
import UserRoleField from "../form/role";
import HelpButton from "../navigation/help";
import {
  createData,
  getFirstItemOfList,
  getPaginatedList
} from "../../utils/pocketbase";
import { useTheme } from "../../hooks/useTheme";
import { getReactSelectStyles } from "../../utils/helpers/reactSelectStyles";

const InviteUser = NiceModal.create(
  ({
    uid,
    congregation,
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE
  }: UserModalProps) => {
    const { t } = useTranslation();
    const { notifyError, notifyWarning } = useNotification();
    const { actualTheme } = useTheme();
    const [userRole, setUserRole] = useState(USER_ACCESS_LEVELS.READ_ONLY.CODE);
    const [userId, setUserId] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const customStyles = useMemo(
      () =>
        getReactSelectStyles<SelectProps>({
          isDark: actualTheme === "dark",
          zIndex: 9999
        }),
      [actualTheme]
    );

    const getUsersByNames = useCallback(async (inputValue: string) => {
      return getPaginatedList("users", 1, 10, {
        filter: `(email ~ "${inputValue}%" || name ~ "${inputValue}") && verified = true`,
        requestKey: `get-users-${inputValue}`
      });
    }, []);

    const getRoleDisplayName = useCallback(
      (roleCode: string): string => {
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
      },
      [t]
    );

    const handleUserDetails = useCallback(
      async (event: FormEvent<HTMLElement>) => {
        event.preventDefault();
        setIsSaving(true);
        try {
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
                requestKey: `check-role-${userId}-${congregation}`
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
        } catch (error) {
          notifyError(error);
        } finally {
          setIsSaving(false);
        }
      },
      [userId, userRole, uid, congregation, t, getRoleDisplayName, modal]
    );

    const promiseOptions = async (
      inputValue: string
    ): Promise<OptionsOrGroups<SelectProps, GroupBase<SelectProps>>> => {
      const users = await getUsersByNames(inputValue);
      const options: SelectProps[] = users.items.map((user: RecordModel) => ({
        label:
          user.name && user.email ? `${user.name} - ${user.email}` : user.name,
        value: user.id
      }));
      return options;
    };

    const handleSelectChange = (option: SelectProps | null) => {
      if (option) {
        setUserId(option.value);
      }
    };
    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>{t("user.inviteUser", "Invite User")}</Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.INVITE_USER} />
        </Modal.Header>
        <Form onSubmit={handleUserDetails}>
          <Modal.Body>
            <AsyncSelect<SelectProps>
              className="mb-3"
              placeholder={t(
                "user.searchByNameOrEmail",
                "Search for user by name or email"
              )}
              styles={customStyles}
              loadOptions={promiseOptions}
              onChange={handleSelectChange}
              required
            />
            <Form.Group
              className="mb-1 text-center"
              controlId="formBasicUsrRolebtnCheckbox"
            >
              <UserRoleField
                role={userRole}
                handleRoleChange={(value) => setUserRole(value)}
                isUpdate={false}
              />
            </Form.Group>
          </Modal.Body>
          <ModalFooter
            handleClick={modal.hide}
            userAccessLevel={footerSaveAcl}
            isSaving={isSaving}
            submitLabel={t("user.invite", "Invite")}
          />
        </Form>
      </Modal>
    );
  }
);

export default InviteUser;

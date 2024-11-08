import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { pb } from "../../utils/pocketbase";
import { USER_ACCESS_LEVELS, WIKI_CATEGORIES } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import { UserModalProps } from "../../utils/interface";
import ModalFooter from "../form/footer";
import UserRoleField from "../form/role";
import HelpButton from "../navigation/help";
import AsyncSelect from "react-select/async";
import { OptionsOrGroups, GroupBase } from "react-select";
import { RecordModel } from "pocketbase";
import getFirstItemOfList from "../../utils/helpers/getfirstiteminlist";

const InviteUser = NiceModal.create(
  ({
    email,
    congregation = "",
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE
  }: UserModalProps) => {
    const [userRole, setUserRole] = useState(USER_ACCESS_LEVELS.READ_ONLY.CODE);
    const [userId, setUserId] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();

    const getUsersByNames = async (inputValue: string) => {
      return pb.collection("users").getList(1, 10, {
        filter: `(email ~ "${inputValue}%" || name ~ "${inputValue}") && verified = true`,
        requestKey: `get-users-${inputValue}`
      });
    };

    const handleUserDetails = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        if (userId === email) {
          alert("Please do not invite yourself.");
          return;
        }
        if (
          await getFirstItemOfList(
            "roles",
            `user="${userId}" && congregation="${congregation}"`
          )
        ) {
          alert("This user is already part of the congregation.");
          return;
        }

        pb.collection("roles").create(
          {
            user: userId,
            congregation,
            role: userRole
          },
          {
            requestKey: `create-role-${userId}-${congregation}`
          }
        );
        let roleDisplay = USER_ACCESS_LEVELS.READ_ONLY.DISPLAY;
        if (userRole === USER_ACCESS_LEVELS.CONDUCTOR.CODE)
          roleDisplay = USER_ACCESS_LEVELS.CONDUCTOR.DISPLAY;
        if (userRole === USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE)
          roleDisplay = USER_ACCESS_LEVELS.TERRITORY_SERVANT.DISPLAY;
        alert(`Granted ${roleDisplay} access to user.`);
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };
    const promiseOptions = async (
      inputValue: string
    ): Promise<OptionsOrGroups<unknown, GroupBase<unknown>>> => {
      const users = await getUsersByNames(inputValue);
      const options = users.items.map((user: RecordModel) => ({
        label: `${user.name} - ${user?.email}`,
        value: user.id
      }));
      return options;
    };
    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>Invite User</Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.INVITE_USER} />
        </Modal.Header>
        <Form onSubmit={handleUserDetails}>
          <Modal.Body>
            <AsyncSelect
              className="mb-3"
              placeholder="Search for user by name or email"
              styles={{
                menu: (provided) => ({ ...provided, zIndex: 9999 })
              }}
              loadOptions={promiseOptions}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(option: any) => {
                setUserId(option.value);
              }}
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
            submitLabel="Invite"
          />
        </Form>
      </Modal>
    );
  }
);

export default InviteUser;

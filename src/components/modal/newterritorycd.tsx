import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent, ChangeEvent } from "react";
import { Modal, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { USER_ACCESS_LEVELS, WIKI_CATEGORIES } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import HelpButton from "../navigation/help";
import IsValidTerritoryCode from "../../utils/helpers/checkterritorycd";
import { NewTerritoryCodeModalProps } from "../../utils/interface";
import { createData, getFirstItemOfList } from "../../utils/pocketbase";

const NewTerritoryCode = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation
  }: NewTerritoryCodeModalProps) => {
    const { t } = useTranslation();
    const { notifyError, notifyWarning } = useNotification();
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const handleCreateTerritory = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();

      setIsSaving(true);
      try {
        if (
          await getFirstItemOfList(
            "territories",
            `code="${code}" && congregation="${congregation}"`
          )
        ) {
          notifyWarning(
            t("territory.codeAlreadyExists", "Territory code already exists.")
          );
          return;
        }
        await createData(
          "territories",
          {
            code,
            description: name,
            congregation
          },
          {
            requestKey: `create-territory-${congregation}-${code}`
          }
        );
        notifyWarning(
          t("territory.createdSuccess", "Created territory, {{name}}.", {
            name
          })
        );
        window.location.reload();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        notifyError(error);
      } finally {
        setIsSaving(false);
      }
    };
    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>
            {t("territory.createNew", "Create New Territory")}
          </Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.CREATE_TERRITORIES} />
        </Modal.Header>
        <Form onSubmit={handleCreateTerritory}>
          <Modal.Body>
            <GenericInputField
              label={t("territory.territoryCode", "Territory Code")}
              name="code"
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                if (!IsValidTerritoryCode(value)) {
                  return;
                }
                setCode(value);
              }}
              changeValue={code}
              required={true}
              placeholder={t(
                "territory.codeExample",
                "Territory code. For eg, M01, W12, etc."
              )}
              autoComplete="off"
            />
            <GenericInputField
              label={t("common.name", "Name")}
              name="name"
              handleChange={(e: ChangeEvent<HTMLElement>) => {
                const { value } = e.target as HTMLInputElement;
                setName(value);
              }}
              changeValue={name}
              required={true}
              placeholder={t(
                "territory.nameExample",
                "Name of the territory. For eg, 801-810, Woodlands Drive."
              )}
              autoComplete="off"
            />
          </Modal.Body>
          <ModalFooter
            handleClick={modal.hide}
            userAccessLevel={footerSaveAcl}
            isSaving={isSaving}
          />
        </Form>
      </Modal>
    );
  }
);

export default NewTerritoryCode;

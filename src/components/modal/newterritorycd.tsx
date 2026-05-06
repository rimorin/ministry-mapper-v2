import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent, ChangeEvent, lazy } from "react";
import { Modal, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import useNotification from "../../hooks/useNotification";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import IsValidTerritoryCode from "../../utils/helpers/checkterritorycd";
import {
  NewTerritoryCodeModalProps,
  TerritoryPolygonCoordinate
} from "../../utils/interface";
import { createData, getFirstItemOfList } from "../../utils/pocketbase";
import { useModalManagement } from "../../hooks/useModalManagement";

const ConfigureTerritoryCoordinates = lazy(
  () => import("./changeterritorycoordinates")
);

const NewTerritoryCode = NiceModal.create(
  ({
    footerSaveAcl = USER_ACCESS_LEVELS.READ_ONLY.CODE,
    congregation,
    origin
  }: NewTerritoryCodeModalProps) => {
    const { t } = useTranslation();
    const { notifyWarning, runAction } = useNotification();
    const { showModal } = useModalManagement();
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [coordinates, setCoordinates] = useState<TerritoryPolygonCoordinate>(
      []
    );
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const handleLocationSelect = async () => {
      const result = await showModal(ConfigureTerritoryCoordinates, {
        coordinates,
        origin,
        isSelectOnly: true
      });
      const newCoordinates = result as TerritoryPolygonCoordinate;
      if (newCoordinates && newCoordinates.length >= 3) {
        setCoordinates(newCoordinates);
      }
    };

    const handleCreateTerritory = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      await runAction(
        async () => {
          if (
            await getFirstItemOfList(
              "territories",
              `code="${code}" && congregation="${congregation}"`,
              {
                requestKey: `check-territory-${code}-${congregation}`,
                fields: "id"
              }
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
              congregation,
              coordinates: coordinates.length >= 3 ? coordinates : undefined
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
        },
        { setLoading: setIsSaving }
      );
    };
    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>
            {t("territory.createNew", "Create New Territory")}
          </Modal.Title>
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
            <Form.Group className="mb-3">
              <Form.Label>
                {t("territory.location", "Territory Boundary (Optional)")}
              </Form.Label>
              <div className="d-flex gap-2 align-items-center">
                <Form.Control
                  type="text"
                  name="boundary"
                  placeholder={
                    coordinates.length >= 3
                      ? t(
                          "territory.locationSet",
                          "Boundary Set ({{count}} points)",
                          {
                            count: coordinates.length
                          }
                        )
                      : t(
                          "territory.clickToSetBoundary",
                          "Click to set boundary"
                        )
                  }
                  onClick={handleLocationSelect}
                  value={
                    coordinates.length >= 3
                      ? t(
                          "territory.locationSet",
                          "Boundary Set ({{count}} points)",
                          {
                            count: coordinates.length
                          }
                        )
                      : ""
                  }
                  onChange={() => {}}
                  readOnly
                  autoComplete="off"
                />
                {coordinates.length >= 3 && (
                  <button
                    type="button"
                    onClick={() => setCoordinates([])}
                    className="btn btn-link text-decoration-none p-0"
                    style={{ fontSize: "1.5rem" }}
                    aria-label="Clear boundary"
                  >
                    🗑️
                  </button>
                )}
              </div>
              <Form.Text muted>
                {t(
                  "territory.locationHelp",
                  "Draw a polygon to define the geographic boundary of this territory"
                )}
              </Form.Text>
            </Form.Group>
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

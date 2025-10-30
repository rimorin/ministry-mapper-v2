import { Offcanvas, Table } from "react-bootstrap";
import { LegendProps } from "../../utils/interface";
import NotHomeIcon from "../table/nothome";
import { useTranslation } from "react-i18next";

const Legend = ({ showLegend, hideFunction }: LegendProps) => {
  const { t } = useTranslation();

  return (
    <Offcanvas show={showLegend} onHide={hideFunction}>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>{t("navigation.legend")}</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Table>
          <thead>
            <tr>
              <th>{t("common.symbol")}</th>
              <th>{t("common.description")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-center align-middle">✅</td>
              <td>{t("address.done")}</td>
            </tr>
            <tr>
              <td className="text-center align-middle">🚫</td>
              <td>{t("address.doNotCall")}</td>
            </tr>
            <tr>
              <td className="text-center align-middle">
                <NotHomeIcon />
              </td>
              <td>{t("address.notHome")}</td>
            </tr>
          </tbody>
        </Table>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default Legend;

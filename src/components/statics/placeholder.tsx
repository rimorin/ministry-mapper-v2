import React from "react";
import { Placeholder, Table } from "react-bootstrap";
import { Policy } from "../../utils/policies";

interface MapPlaceholderProps {
  policy: Policy | undefined;
  rows?: number;
  columns?: number;
}

const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  policy,
  rows = 10,
  columns = 4
}) => {
  const isAdmin = policy?.isFromAdmin() ?? true;
  const containerClass = isAdmin ? "map-body-admin" : "map-body";
  const widths = [6, 8, 7, 5, 9, 4];

  return (
    <div className={`${containerClass} map-placeholder-content bg-light`}>
      <Table
        bordered
        striped
        hover
        responsive
        className="mb-0"
        style={{ opacity: 0.7 }}
      >
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, i) => (
              <th key={i} className="py-2">
                <Placeholder animation="glow">
                  <Placeholder xs={6} />
                </Placeholder>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              {Array.from({ length: columns }, (_, j) => (
                <td key={j} className="py-2">
                  <Placeholder animation="glow">
                    <Placeholder xs={widths[i % widths.length]} />
                  </Placeholder>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default MapPlaceholder;

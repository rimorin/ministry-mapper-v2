import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { Modal, Button, Badge, Card, ListGroup } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { ReleaseEntry } from "../../hooks/useReleaseNotes";
import { resolveLocalized } from "../../utils/resolveLocalized";

const MAX_RELEASES = 3;

interface ReleaseNotesModalProps {
  releases: ReleaseEntry[];
  onSeen: () => void;
}

const ITEM_CONFIG = {
  new: { colorClass: "text-bg-success", labelKey: "releaseNotes.new" },
  fix: { colorClass: "text-bg-warning", labelKey: "releaseNotes.fix" },
  improved: { colorClass: "text-bg-info", labelKey: "releaseNotes.improved" },
  announcement: {
    colorClass: "text-bg-primary",
    labelKey: "releaseNotes.announcement"
  }
} as const;

function renderDescription(text: string) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bullets.length === 0) return;
    nodes.push(
      <ul
        key={key++}
        className="mb-0 mt-2 ps-3"
        style={{ fontSize: "0.82rem", color: "var(--bs-secondary-color)" }}
      >
        {bullets.map((b, i) => (
          <li key={i} className="mb-1">
            {b.slice(2)}
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };

  for (const line of lines) {
    if (line === "") {
      flushBullets();
    } else if (line.startsWith("- ")) {
      bullets.push(line);
    } else if (line.endsWith(":") || line.endsWith("：")) {
      flushBullets();
      nodes.push(
        <p
          key={key++}
          className="mb-0 mt-3"
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--bs-secondary-color)"
          }}
        >
          {line.slice(0, -1)}
        </p>
      );
    } else {
      flushBullets();
      nodes.push(
        <p
          key={key++}
          className="mb-0 mt-2"
          style={{ fontSize: "0.82rem", color: "var(--bs-secondary-color)" }}
        >
          {line}
        </p>
      );
    }
  }
  flushBullets();
  return nodes;
}

const ReleaseNotesModal = NiceModal.create(
  ({ releases, onSeen }: ReleaseNotesModalProps) => {
    const modal = useModal();
    const { t, i18n } = useTranslation();

    const resolve = (value: Parameters<typeof resolveLocalized>[0]) =>
      resolveLocalized(value, i18n.language);

    const formatDate = (iso: string) => {
      const [year, month, day] = iso.split("-").map(Number);
      return new Date(year, month - 1, day).toLocaleDateString(i18n.language, {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    };

    const visibleReleases = releases.slice(0, MAX_RELEASES);

    const handleDismiss = () => {
      onSeen();
      modal.hide();
    };

    return (
      <Modal
        {...bootstrapDialog(modal)}
        onHide={handleDismiss}
        backdrop="static"
        centered
        scrollable
        aria-labelledby="release-notes-title"
      >
        <Modal.Header>
          <Modal.Title id="release-notes-title">
            {t("releaseNotes.title", "What's New")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3">
          <div className="d-flex flex-column gap-3">
            {visibleReleases.map((release, idx) => {
              const notice = resolve(release.notice);
              return (
                <Card key={release.id} className="border overflow-hidden">
                  <Card.Header className="d-flex align-items-center gap-2 py-2">
                    <strong style={{ fontSize: "0.9rem" }}>
                      {formatDate(release.id.substring(0, 10))}
                    </strong>
                    {idx === 0 && (
                      <Badge bg="primary" className="fw-normal ms-auto">
                        {t("releaseNotes.latest", "Latest")}
                      </Badge>
                    )}
                  </Card.Header>
                  {notice && (
                    <div
                      className="px-3 py-2 border-bottom d-flex align-items-start gap-2"
                      style={{
                        borderLeft: "3px solid var(--bs-warning)",
                        backgroundColor: "var(--bs-warning-bg-subtle)",
                        color: "var(--bs-warning-text-emphasis)",
                        fontSize: "0.85rem"
                      }}
                    >
                      <span style={{ flexShrink: 0, marginTop: "0.1rem" }}>
                        ⚠
                      </span>
                      <span>{notice}</span>
                    </div>
                  )}
                  {release.screenshot && (
                    <img
                      src={
                        release.screenshot.startsWith("http")
                          ? release.screenshot
                          : `/${release.screenshot}`
                      }
                      alt={`release screenshot ${release.id}`}
                      className="w-100 d-block"
                      style={{ maxHeight: "300px", objectFit: "contain" }}
                    />
                  )}
                  <ListGroup variant="flush">
                    {release.items.map((item, i) => {
                      const config = ITEM_CONFIG[item.type];
                      const text = resolve(item.text);
                      const description = resolve(item.description);
                      return (
                        <ListGroup.Item
                          key={`${item.type}-${i}`}
                          className="d-flex align-items-start gap-2 py-2 px-3"
                        >
                          <span
                            className={`badge flex-shrink-0 ${config.colorClass}`}
                            style={{
                              fontSize: "0.65rem",
                              minWidth: "4rem",
                              textAlign: "center",
                              marginTop: "0.15rem"
                            }}
                          >
                            {t(config.labelKey)}
                          </span>
                          <span
                            style={{
                              fontSize: "1rem",
                              lineHeight: "1.4",
                              fontWeight: 600
                            }}
                          >
                            {text}
                            {description && renderDescription(description)}
                          </span>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                </Card>
              );
            })}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleDismiss} autoFocus>
            {t("releaseNotes.dismiss", "Dismiss")}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
);

export default ReleaseNotesModal;

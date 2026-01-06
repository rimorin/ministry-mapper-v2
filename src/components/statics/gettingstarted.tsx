import { Alert, Badge, Button, Stack } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import "../../css/admin.css";

interface GettingStartedProps {
  onCreateOptions: () => void;
  onCreateTerritory: () => void;
  hasOptions: boolean;
  hasTerritories: boolean;
  hasAnyMaps: boolean;
  selectedTerritory: {
    id: string;
    code: string | undefined;
    name: string | undefined;
  };
}

const GettingStarted = ({
  onCreateOptions,
  onCreateTerritory,
  hasOptions,
  hasTerritories,
  hasAnyMaps,
  selectedTerritory
}: GettingStartedProps) => {
  const { t } = useTranslation();

  const isTerritorySelected = !!selectedTerritory.code;

  const renderStepCard = (
    stepNumber: number,
    icon: string,
    titleKey: string,
    whereKey: string,
    whatKey: string,
    whyKey: string,
    isComplete: boolean,
    isLocked: boolean,
    exampleKey?: string,
    buttonText?: string,
    onButtonClick?: () => void
  ) => {
    const cardClasses = `guide-step-card ${isComplete ? "completed" : ""} ${isLocked ? "locked" : ""}`;
    const badgeVariant = isComplete
      ? "success"
      : isLocked
        ? "secondary"
        : "primary";

    return (
      <div className={cardClasses} key={`step-${stepNumber}`}>
        <Stack direction="horizontal" gap={3} className="mb-3">
          <div className="guide-step-number">
            {isComplete ? "✓" : stepNumber}
          </div>
          <div>
            <h5 className="mb-1">
              <span className="me-2">{icon}</span>
              {t(titleKey)}
            </h5>
            <Badge bg={badgeVariant} className="text-uppercase">
              {isComplete
                ? t("guide.completed", "Completed")
                : t("guide.stepOf", "Step {{step}} of 5", { step: stepNumber })}
            </Badge>
          </div>
        </Stack>

        <div className="mb-3">
          <p className="mb-2">
            <strong>{t("guide.where", "Where:")} </strong>
            {t(whereKey)}
          </p>
          <p className="mb-2">
            <strong>{t("guide.what", "What:")} </strong>
            {t(whatKey)}
          </p>
          <p className="mb-2">
            <strong>{t("guide.why", "Why:")} </strong>
            {t(whyKey)}
          </p>
          {exampleKey && (
            <Alert variant="light" className="mb-2">
              {t(exampleKey)}
            </Alert>
          )}
          {buttonText && onButtonClick && !isComplete && !isLocked && (
            <div className="mt-3">
              <Button
                variant="primary"
                onClick={onButtonClick}
                className="w-100"
              >
                {buttonText}
              </Button>
            </div>
          )}
          {isLocked && (
            <Alert variant="warning" className="mb-0 mt-3">
              {t("guide.locked", "Complete previous steps first")}
            </Alert>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="guide-container">
      <div className="guide-welcome-card">
        <div className="guide-header">
          <h2 className="text-center mb-2">
            {t("guide.welcome", "Welcome to Ministry Mapper! 👋")}
          </h2>
          <p className="text-center text-muted mb-0">
            {t(
              "guide.subtitle",
              "Let's get your congregation set up in 5 easy steps"
            )}
          </p>
        </div>

        <div className="guide-steps-container">
          <Stack gap={3}>
            {renderStepCard(
              1,
              "📋",
              "guide.step1.title",
              "guide.step1.where",
              "guide.step1.what",
              "guide.step1.why",
              hasOptions,
              false,
              "guide.step1.example",
              t("guide.step1.button", "Create Options"),
              onCreateOptions
            )}

            {renderStepCard(
              2,
              "🗺️",
              "guide.step2.title",
              "guide.step2.where",
              "guide.step2.what",
              "guide.step2.why",
              hasTerritories,
              !hasOptions,
              "guide.step2.example",
              t("guide.step2.button", "Create Territory"),
              onCreateTerritory
            )}

            {renderStepCard(
              3,
              "🎯",
              "guide.step3.title",
              "guide.step3.where",
              "guide.step3.what",
              "guide.step3.why",
              isTerritorySelected,
              !hasTerritories || !hasOptions
            )}

            {renderStepCard(
              4,
              "📍",
              "guide.step4.title",
              "guide.step4.where",
              "guide.step4.what",
              "guide.step4.why",
              hasAnyMaps,
              !isTerritorySelected,
              "guide.step4.example"
            )}

            {renderStepCard(
              5,
              "📤",
              "guide.step5.title",
              "guide.step5.where",
              "guide.step5.what",
              "guide.step5.why",
              false,
              false
            )}
          </Stack>
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;

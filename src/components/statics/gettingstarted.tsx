import { Alert, Badge, Stack } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import "../../css/admin.css";

const GettingStarted = () => {
  const { t } = useTranslation();

  const renderStepCard = (
    stepNumber: number,
    icon: string,
    titleKey: string,
    whereKey: string,
    whatKey: string,
    whyKey: string,
    exampleKey?: string
  ) => {
    return (
      <div className="guide-step-card" key={`step-${stepNumber}`}>
        <Stack direction="horizontal" gap={3} className="mb-3">
          <div className="guide-step-number">{stepNumber}</div>
          <div>
            <h5 className="mb-1">
              <span className="me-2">{icon}</span>
              {t(titleKey)}
            </h5>
            <Badge bg="secondary" className="text-uppercase">
              {t("guide.stepOf", "Step {{step}} of 5", { step: stepNumber })}
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
              "guide.step1.example"
            )}

            {renderStepCard(
              2,
              "🗺️",
              "guide.step2.title",
              "guide.step2.where",
              "guide.step2.what",
              "guide.step2.why",
              "guide.step2.example"
            )}

            {renderStepCard(
              3,
              "🎯",
              "guide.step3.title",
              "guide.step3.where",
              "guide.step3.what",
              "guide.step3.why"
            )}

            {renderStepCard(
              4,
              "📍",
              "guide.step4.title",
              "guide.step4.where",
              "guide.step4.what",
              "guide.step4.why",
              "guide.step4.example"
            )}

            {renderStepCard(
              5,
              "📤",
              "guide.step5.title",
              "guide.step5.where",
              "guide.step5.what",
              "guide.step5.why"
            )}
          </Stack>
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;

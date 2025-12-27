import { Container, Card } from "react-bootstrap";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import { useTranslation } from "react-i18next";

interface StaticPageCardProps {
  title?: string;
  children?: React.ReactNode;
  showLogo?: boolean;
  logoSrc?: string;
  logoAlt?: string;
  cardClassName?: string;
}

const StaticPageCard = ({
  title,
  children,
  showLogo = true,
  logoSrc = "android-chrome-192x192.png",
  logoAlt,
  cardClassName = "card-main"
}: StaticPageCardProps) => {
  const { t } = useTranslation();
  const defaultLogoAlt = t("branding.logo", "Ministry Mapper logo");

  return (
    <Container className="container-main">
      <Card className={cardClassName}>
        {showLogo && (
          <Card.Body className="text-center">
            <Card.Img
              alt={logoAlt || defaultLogoAlt}
              className="mm-logo mx-auto d-block"
              src={getAssetUrl(logoSrc)}
            />
          </Card.Body>
        )}
        <Card.Body>
          {title && <Card.Title className="text-center">{title}</Card.Title>}
          {children}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StaticPageCard;

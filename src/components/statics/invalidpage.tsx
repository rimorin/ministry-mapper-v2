import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { buttonVariants } from "@/components/ui/button";
import StaticPageCard from "./staticpage";
import { getUser } from "../../utils/pocketbase";

const InvalidPage = () => {
  const { t } = useTranslation();

  return (
    <StaticPageCard title={t("errors.linkExpired", "This link has expired ⌛")}>
      {getUser("id") ? (
        // A signed-in account came from its links and can go back to them.
        <div className="mt-4 flex justify-center">
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            {t("myLinks.title", "My maps")}
          </Link>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground mt-4">
          {t("errors.closeTab", "Please close this tab.")}
        </p>
      )}
    </StaticPageCard>
  );
};

export default InvalidPage;

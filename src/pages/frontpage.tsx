import { use, useEffect, useState, lazy, Suspense } from "react";
import { Container, Navbar, Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../utils/helpers/assetpath";
import NavBarBranding from "../components/navigation/branding";
import { StateContext } from "../components/utils/context";
import { authListener, getUser } from "../utils/pocketbase";

import VerificationPage from "../components/navigation/verification";
import { AuthModel } from "pocketbase";
import Loader from "../components/statics/loader";
import LanguageSelector from "../i18n/LanguageSelector";
import { LanguageContext } from "../i18n/LanguageContext";
import useUIState from "../hooks/useUIManagement";
import GenericButton from "../components/navigation/button";
import ThemeToggle from "../components/navigation/themetoggle";
const { VITE_ABOUT_URL } = import.meta.env;

const AboutURL = (VITE_ABOUT_URL ||
  "https://doc.ministry-mapper.com/user-guide") as string;

const SignupComponent = lazy(() => import("./signup"));
const LoginComponent = lazy(() => import("./signin"));
const ForgotComponent = lazy(() => import("./forgot"));
const Admin = lazy(() => import("./admin"));

const FrontPage = () => {
  const { t } = useTranslation();
  const context = use(StateContext);
  const { currentLanguage, changeLanguage, languageOptions } =
    use(LanguageContext);

  const { showLanguageSelector, toggleLanguageSelector } = useUIState();
  const [loginUser, setLoginUser] = useState<AuthModel>(getUser() as AuthModel);
  const { frontPageMode } = context;

  const handleLanguageSelect = (language: string) => {
    changeLanguage(language);
    toggleLanguageSelector();
  };

  const handleOpenAbout = () => {
    window.open(AboutURL);
  };

  useEffect(() => {
    authListener((model: AuthModel) => {
      setLoginUser(model);
    });
  }, []);

  if (loginUser && !loginUser.verified) {
    return <VerificationPage user={loginUser} />;
  }

  if (loginUser) {
    return (
      <Suspense fallback={<Loader suspended />}>
        <Admin user={loginUser} />
      </Suspense>
    );
  }

  let componentToRender;
  switch (frontPageMode) {
    case "forgot":
      componentToRender = <ForgotComponent />;
      break;
    case "signup":
      componentToRender = <SignupComponent />;
      break;
    default:
      componentToRender = <LoginComponent />;
  }

  return (
    <div className="d-flex flex-column" style={{ minHeight: "80vh" }}>
      <Navbar className="flex-shrink-0">
        <LanguageSelector
          showListing={showLanguageSelector}
          hideFunction={toggleLanguageSelector}
          handleSelect={handleLanguageSelect}
          currentLanguage={currentLanguage}
          languageOptions={languageOptions}
        />
        <Container fluid>
          <NavBarBranding naming="Ministry Mapper" />
          <div className="d-flex">
            <GenericButton
              className="m-1"
              size="sm"
              variant="outline-primary"
              onClick={handleOpenAbout}
              label={t("navigation.about", "About")}
            />
            <ThemeToggle className="m-1" />
            <GenericButton
              className="m-1"
              size="sm"
              variant="outline-primary"
              onClick={toggleLanguageSelector}
              label={
                <Image
                  src={getAssetUrl("language.svg")}
                  alt="Language"
                  width={16}
                  height={16}
                  className="language-icon"
                />
              }
            />
          </div>
        </Container>
      </Navbar>
      <Container
        fluid
        className="d-flex align-items-center justify-content-center flex-grow-1"
        style={{ overflow: "auto" }}
      >
        <Suspense fallback={<Loader suspended />}>{componentToRender}</Suspense>
      </Container>
    </div>
  );
};

export default FrontPage;

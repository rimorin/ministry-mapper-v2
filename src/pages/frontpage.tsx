import {
  useContext,
  useEffect,
  useState,
  lazy,
  Suspense,
  useCallback
} from "react";
import { Container, Navbar, Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { MINISTRY_MAPPER_WIKI_PAGE } from "../utils/constants";
import { getAssetUrl } from "../utils/helpers/assetpath";
import NavBarBranding from "../components/navigation/branding";
import { StateContext } from "../components/utils/context";
import { authListener, getUser } from "../utils/pocketbase";

import VerificationPage from "../components/navigation/verification";
import { AuthModel } from "pocketbase";
import Loader from "../components/statics/loader";
import LanguageSelector from "../i18n/LanguageSelector";
import { LanguageContext } from "../i18n/LanguageContext";
import useUIState from "../hooks/uiManagement";
import GenericButton from "../components/navigation/button";
const { VITE_ABOUT_URL } = import.meta.env;

const AboutURL = (VITE_ABOUT_URL || MINISTRY_MAPPER_WIKI_PAGE) as string;

const SignupComponent = lazy(() => import("./signup"));
const LoginComponent = lazy(() => import("./signin"));
const ForgotComponent = lazy(() => import("./forgot"));
const Admin = lazy(() => import("./admin"));

const FrontPage = () => {
  const { t } = useTranslation();
  const context = useContext(StateContext);
  const { currentLanguage, changeLanguage, languageOptions } =
    useContext(LanguageContext);

  const { showLanguageSelector, toggleLanguageSelector } = useUIState();
  const [loginUser, setLoginUser] = useState<AuthModel>(getUser() as AuthModel);
  const { frontPageMode } = context;

  const handleLanguageSelect = useCallback((language: string) => {
    changeLanguage(language);
    toggleLanguageSelector();
  }, []);

  const handleOpenAbout = useCallback(() => {
    window.open(AboutURL);
  }, []);

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
    <>
      <div className="d-flex flex-column" style={{ minHeight: "99vh" }}>
        <Navbar bg="light">
          <LanguageSelector
            showListing={showLanguageSelector}
            hideFunction={toggleLanguageSelector}
            handleSelect={handleLanguageSelect}
            currentLanguage={currentLanguage}
            languageOptions={languageOptions}
          />
          <Container fluid>
            <NavBarBranding naming="" />
            <div className="d-flex">
              <GenericButton
                className="m-1"
                size="sm"
                variant="outline-primary"
                onClick={handleOpenAbout}
                label={t("navigation.about", "About")}
              />
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
                  />
                }
              />
            </div>
          </Container>
        </Navbar>
        <Container
          fluid
          className="d-flex align-items-center justify-content-center"
          style={{ flexGrow: 1 }}
        >
          <Suspense fallback={<Loader suspended />}>
            {componentToRender}
          </Suspense>
        </Container>
      </div>
    </>
  );
};

export default FrontPage;

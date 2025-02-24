import { Container, Card, Spinner } from "react-bootstrap";
import { userInterface } from "../../utils/interface";
import UseAnotherButton from "./useanother";
import { useCallback, useState } from "react";
import errorHandler from "../../utils/helpers/errorhandler";
import { useRollbar } from "@rollbar/react";
import { pb } from "../../utils/pocketbase";

const VerificationPage = ({ user }: userInterface) => {
  const userEmail = user?.email;
  const [isSending, setIsSending] = useState(false);
  const rollbar = useRollbar();
  const handleResendMail = useCallback(async () => {
    setIsSending(true);
    try {
      await pb.collection("users").requestVerification(userEmail, {
        requestKey: `resend-verification-${userEmail}`
      });
      alert(
        "Resent verification email! Please check your inbox or spam folder."
      );
    } catch (error) {
      errorHandler(error, rollbar, true);
    } finally {
      setIsSending(false);
    }
  }, [userEmail]);

  const handleClick = useCallback(() => {
    pb.authStore.clear();
  }, []);

  return (
    <Container className="container-main">
      <Card className="card-main">
        <Card.Img
          alt="Ministry Mapper logo"
          className="mm-logo"
          src="https://assets.ministry-mapper.com/android-chrome-192x192.png"
        />
        <Card.Body>
          <Card.Title className="text-center">
            We are sorry {user?.name}! Please verify your email account before
            proceeding 🪪
          </Card.Title>
        </Card.Body>
        <>
          <span
            className="resend-text fluid-bolding fluid-text"
            onClick={handleResendMail}
          >
            Didn&#39;t receive verification email ?{" "}
            {isSending && (
              <Spinner
                size="sm"
                style={{
                  marginLeft: "5px"
                }}
              />
            )}
          </span>
        </>
        <>
          <UseAnotherButton handleClick={handleClick} />
        </>
      </Card>
    </Container>
  );
};

export default VerificationPage;

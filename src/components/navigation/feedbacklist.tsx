import { useEffect, useRef } from "react";
import { ListGroup, Button } from "react-bootstrap";
import { Message } from "../../utils/interface";
import { Policy } from "../../utils/policies";
import { MESSAGE_TYPES, USER_ACCESS_LEVELS } from "../../utils/constants";

const FeedbackList = ({
  feedbacks,
  policy,
  handleDelete,
  handlePin,
  handleRead
}: {
  feedbacks: Array<Message>;
  policy: Policy;
  handleDelete: (id: string) => void;
  handlePin: (id: string, pinned: boolean) => void;
  handleRead: (id: string) => void;
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const isAdmin = policy.userRole === USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE;

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [feedbacks]);

  return (
    <ListGroup
      variant="flush"
      style={{ maxHeight: "300px", overflowY: "auto" }}
      ref={listRef}
    >
      {feedbacks.map((fb) => (
        <ListGroup.Item
          key={fb.id}
          className="m-2 p-2"
          variant={fb.pinned ? "primary" : undefined}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "5px"
            }}
          >
            <div style={{ flex: 1 }}>
              <strong>{fb.created_by}</strong>
              <div>
                <small>{fb.created.toLocaleString()}</small>
              </div>
            </div>
            <div>
              {isAdmin ? (
                <>
                  {!fb.read && (
                    <Button
                      size="sm"
                      variant="outline-success"
                      className="me-1"
                      onClick={() => handleRead(fb.id)}
                    >
                      ✅
                    </Button>
                  )}
                  {fb.read && fb.type === MESSAGE_TYPES.ADMIN && (
                    <Button
                      size="sm"
                      variant={
                        fb.pinned ? "outline-primary" : "outline-secondary"
                      }
                      className="me-1"
                      onClick={() => handlePin(fb.id, !fb.pinned)}
                    >
                      {fb.pinned ? "📌" : "📍"}
                    </Button>
                  )}
                  {fb.read && (
                    <Button
                      size="sm"
                      variant="outline-warning"
                      className="me-1"
                      onClick={() => handleDelete(fb.id)}
                    >
                      🗑️
                    </Button>
                  )}
                </>
              ) : (
                fb.read && fb.type != MESSAGE_TYPES.ADMIN && <>✅</>
              )}
            </div>
          </div>
          <p>{fb.message}</p>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default FeedbackList;

import { useEffect, useRef } from "react";
import { Message } from "../../utils/interface";
import { Policy } from "../../utils/policies";
import { MESSAGE_TYPES, USER_ACCESS_LEVELS } from "../../utils/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Pin, PinOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
      const viewport = listRef.current.querySelector(
        "[data-slot='scroll-area-viewport']"
      ) as HTMLElement | null;
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [feedbacks]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <ScrollArea className="max-h-64 rounded-md border" ref={listRef} withFade>
      <ul className="divide-y">
        {feedbacks.map((fb) => (
          <li
            key={fb.id}
            className={cn("px-3 py-3", fb.pinned && "bg-primary/5")}
          >
            <div className="mb-2 flex items-start gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {getInitials(fb.created_by)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold">{fb.created_by}</span>
                  {fb.pinned && (
                    <Badge
                      variant="secondary"
                      className="h-4 px-1.5 text-[10px]"
                    >
                      <Pin className="mr-0.5 size-2.5" />
                      Pinned
                    </Badge>
                  )}
                  {fb.read && fb.type !== MESSAGE_TYPES.ADMIN && !isAdmin && (
                    <Badge
                      variant="outline"
                      className="h-4 border-green-200 px-1.5 text-[10px] text-green-600"
                    >
                      <Check className="mr-0.5 size-2.5" />
                      Read
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {fb.created.toLocaleString()}
                </p>
              </div>
              {isAdmin && (
                <div className="flex shrink-0 items-center gap-1">
                  {!fb.read && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleRead(fb.id)}
                      aria-label="Mark as read"
                    >
                      <Check className="size-3.5" />
                    </Button>
                  )}
                  {fb.read && fb.type === MESSAGE_TYPES.ADMIN && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "size-7",
                        fb.pinned
                          ? "text-primary hover:text-primary/80"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => handlePin(fb.id, !fb.pinned)}
                      aria-label={fb.pinned ? "Unpin message" : "Pin message"}
                    >
                      {fb.pinned ? (
                        <PinOff className="size-3.5" />
                      ) : (
                        <Pin className="size-3.5" />
                      )}
                    </Button>
                  )}
                  {fb.read && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                      onClick={() => handleDelete(fb.id)}
                      aria-label="Delete message"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <p className="ml-[calc(2rem+0.625rem)] text-sm text-foreground/80">
              {fb.message}
            </p>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
};

export default FeedbackList;

import { ArrowUpToLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import { backToTopProp } from "../../utils/interface";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { fadeSlideUp, tapFeedback } from "@/lib/motion";

const BackToTopButton = ({ showButton, onScrollToTop }: backToTopProp) => {
  const { t } = useTranslation();

  const handleClick = () => {
    if (onScrollToTop) onScrollToTop();
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {showButton && (
        <m.div
          className="fixed bottom-[30px] right-[25px] z-50"
          variants={fadeSlideUp}
          initial="hidden"
          animate="show"
          exit="hidden"
          whileHover={{ y: -3, scale: 1.1 }}
          whileTap={tapFeedback}
        >
          <Button
            variant="outline"
            size="icon"
            className="size-10 cursor-pointer rounded-full shadow-md bg-background border-border hover:bg-accent"
            onClick={handleClick}
            aria-label={t("navigation.backToTop", "Back to top")}
          >
            <ArrowUpToLine className="h-5 w-5" />
          </Button>
        </m.div>
      )}
    </AnimatePresence>
  );
};

export default BackToTopButton;

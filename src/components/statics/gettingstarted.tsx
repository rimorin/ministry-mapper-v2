import type { TFunction } from "i18next";
import { CheckCircle2, Lightbulb, Lock } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  checkEnter,
  fadeSlideUp,
  fadeZoom,
  staggerContainer,
  tapFeedback
} from "@/lib/motion";
import { cn } from "@/lib/utils";

interface GettingStartedProps {
  onCreateOptions: () => void;
  onCreateTerritory: () => void;
  onCreateMap: () => void;
  hasOptions: boolean;
  hasTerritories: boolean;
  hasAnyMaps: boolean;
  selectedTerritory: {
    id: string;
    code: string | undefined;
    name: string | undefined;
  };
}

type StepDefinition = {
  stepNumber: number;
  titleKey: string;
  whereKey: string;
  whatKey: string;
  whyKey: string;
  exampleKey?: string;
  isComplete: boolean;
  isLocked: boolean;
  buttonLabel?: string;
  onButtonClick?: () => void;
};

type StepCardProps = StepDefinition & {
  isActive: boolean;
  t: TFunction;
};

const StepCard = ({
  stepNumber,
  titleKey,
  whereKey,
  whatKey,
  whyKey,
  exampleKey,
  isComplete,
  isLocked,
  buttonLabel,
  onButtonClick,
  isActive,
  t
}: StepCardProps) => {
  const stateText = isComplete
    ? t("guide.stepCompleted")
    : isLocked
      ? t("guide.stepLocked")
      : isActive
        ? t("guide.stepCurrent")
        : undefined;

  const statusBadge = isComplete ? (
    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
      {t("guide.completed")}
    </Badge>
  ) : isLocked ? (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Badge variant="outline">{t("guide.stepLocked")}</Badge>
      </TooltipTrigger>
      <TooltipContent>{t("guide.lockedTooltip")}</TooltipContent>
    </Tooltip>
  ) : (
    <Badge variant="default">{t("guide.stepOf", { step: stepNumber })}</Badge>
  );

  return (
    <m.li aria-current={isActive ? "true" : undefined} variants={fadeSlideUp}>
      <Card
        data-locked={isLocked ? "true" : "false"}
        data-completed={isComplete ? "true" : "false"}
        className={cn(
          "gap-0 border transition-colors",
          isLocked && "opacity-60",
          isActive && "ring-2 ring-primary/15"
        )}
      >
        <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
          <div className="flex items-start gap-3">
            <AnimatePresence mode="wait" initial={false}>
              {isComplete ? (
                <m.span
                  key="complete"
                  variants={checkEnter}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                >
                  <CheckCircle2 className="h-7 w-7 shrink-0 text-green-600" />
                </m.span>
              ) : isLocked ? (
                <m.span
                  key="locked"
                  variants={fadeZoom}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                >
                  <Lock className="h-7 w-7 shrink-0 text-muted-foreground" />
                </m.span>
              ) : (
                <m.span
                  key={`step-${stepNumber}`}
                  variants={fadeZoom}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground text-muted-foreground"
                    )}
                  >
                    {stepNumber}
                  </div>
                </m.span>
              )}
            </AnimatePresence>
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <span>{t(titleKey)}</span>
                {stateText ? (
                  <span className="sr-only">{stateText}</span>
                ) : null}
              </CardTitle>
              <CardDescription>
                {t("guide.stepOf", { step: stepNumber })}
              </CardDescription>
            </div>
          </div>
          <CardAction className="justify-self-start sm:justify-self-end">
            {statusBadge}
          </CardAction>
        </CardHeader>

        <AnimatePresence>
          {!isLocked && (
            <m.div
              key={`step-${stepNumber}-content`}
              variants={fadeSlideUp}
              initial="hidden"
              animate="show"
              exit="hidden"
            >
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">{t("guide.where")} </span>
                  {t(whereKey)}
                </p>
                <p>
                  <span className="font-medium">{t("guide.what")} </span>
                  {t(whatKey)}
                </p>
                <p>
                  <span className="font-medium">{t("guide.why")} </span>
                  {t(whyKey)}
                </p>
                {exampleKey ? (
                  <p className="flex items-start gap-1.5 text-sm italic text-muted-foreground">
                    <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                    {t(exampleKey)}
                  </p>
                ) : null}
              </CardContent>
              {buttonLabel && onButtonClick && !isComplete ? (
                <CardFooter className="pt-4">
                  <m.div
                    animate={isActive ? { y: [0, -3, 0] } : {}}
                    transition={{
                      repeat: Infinity,
                      repeatDelay: 2.5,
                      duration: 0.45,
                      ease: "easeInOut"
                    }}
                    whileTap={tapFeedback}
                  >
                    <Button size="sm" onClick={onButtonClick}>
                      {buttonLabel}
                    </Button>
                  </m.div>
                </CardFooter>
              ) : null}
            </m.div>
          )}
        </AnimatePresence>
      </Card>
    </m.li>
  );
};

const GettingStarted = ({
  onCreateOptions,
  onCreateTerritory,
  onCreateMap,
  hasOptions,
  hasTerritories,
  hasAnyMaps,
  selectedTerritory
}: GettingStartedProps) => {
  const { t } = useTranslation();

  const isTerritorySelected = !!selectedTerritory.code;
  const steps: StepDefinition[] = [
    {
      stepNumber: 1,
      titleKey: "guide.step1.title",
      whereKey: "guide.step1.where",
      whatKey: "guide.step1.what",
      whyKey: "guide.step1.why",
      exampleKey: "guide.step1.example",
      isComplete: hasOptions,
      isLocked: false,
      buttonLabel: t("guide.step1.button"),
      onButtonClick: onCreateOptions
    },
    {
      stepNumber: 2,
      titleKey: "guide.step2.title",
      whereKey: "guide.step2.where",
      whatKey: "guide.step2.what",
      whyKey: "guide.step2.why",
      exampleKey: "guide.step2.example",
      isComplete: hasTerritories,
      isLocked: !hasOptions,
      buttonLabel: t("guide.step2.button"),
      onButtonClick: onCreateTerritory
    },
    {
      stepNumber: 3,
      titleKey: "guide.step3.title",
      whereKey: "guide.step3.where",
      whatKey: "guide.step3.what",
      whyKey: "guide.step3.why",
      isComplete: isTerritorySelected,
      isLocked: !hasTerritories || !hasOptions
    },
    {
      stepNumber: 4,
      titleKey: "guide.step4.title",
      whereKey: "guide.step4.where",
      whatKey: "guide.step4.what",
      whyKey: "guide.step4.why",
      exampleKey: "guide.step4.example",
      isComplete: hasAnyMaps,
      isLocked: !isTerritorySelected,
      buttonLabel: t("guide.step4.button"),
      onButtonClick: onCreateMap
    }
  ];

  const totalSteps = steps.length;
  const completedCount = steps.filter((step) => step.isComplete).length;
  const activeStepNumber =
    steps.find((step) => !step.isComplete && !step.isLocked)?.stepNumber ?? -1;

  return (
    <TooltipProvider>
      <div className="mx-auto flex h-[calc(100svh-3.5rem)] max-w-2xl flex-col px-4 py-6 sm:px-6">
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="shrink-0 border-b">
            <CardTitle>{t("guide.welcome")}</CardTitle>
            <CardDescription>{t("guide.subtitle")}</CardDescription>
            <div className="pt-2">
              <p className="text-sm font-medium">{t("guide.setupProgress")}</p>
              <m.div
                key={completedCount}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: [1, 1.01, 1] }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ originX: 0 }}
              >
                <Progress
                  value={(completedCount / totalSteps) * 100}
                  className="mt-2"
                />
              </m.div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("guide.progressLabel", {
                  completed: completedCount,
                  total: totalSteps
                })}
              </p>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto p-0">
            <m.ol
              aria-label={t("guide.setupProgress")}
              className="space-y-3 p-4"
              variants={staggerContainer(0.07)}
              initial="hidden"
              animate="show"
            >
              {steps.map((step) => (
                <StepCard
                  key={step.stepNumber}
                  {...step}
                  isActive={step.stepNumber === activeStepNumber}
                  t={t}
                />
              ))}
            </m.ol>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default GettingStarted;

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { type HTMLMotionProps } from "motion/react";
import * as m from "motion/react-m";

import { cn } from "@/lib/utils";
import { fadeZoom } from "@/lib/motion";

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
        warning:
          "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800 *:data-[slot=alert-description]:text-amber-800 dark:*:data-[slot=alert-description]:text-amber-200 *:[svg]:text-amber-600 dark:*:[svg]:text-amber-400",
        info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200 *:data-[slot=alert-description]:text-blue-800 dark:*:data-[slot=alert-description]:text-blue-200 *:[svg]:text-blue-600 dark:*:[svg]:text-blue-400",
        success:
          "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200 *:data-[slot=alert-description]:text-green-800 dark:*:data-[slot=alert-description]:text-green-200 *:[svg]:text-green-600 dark:*:[svg]:text-green-400"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

function Alert({
  className,
  variant,
  ...props
}: HTMLMotionProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <m.div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      variants={fadeZoom}
      initial="hidden"
      animate="show"
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2.5 right-3", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };

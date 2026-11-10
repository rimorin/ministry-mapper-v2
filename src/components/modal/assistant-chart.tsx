import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslation } from "react-i18next";

import type { AssistantChartSpec } from "@/hooks/useAssistant";
import { cn } from "@/lib/utils";
import { weekdayName } from "./assistant-shared";

interface AssistantChartProps {
  rows: Record<string, unknown>[];
  chart: AssistantChartSpec;
  // A column's name as the table heads it.
  columnLabel: (column: string) => string;
  // A value as the table shows it, for names and codes along the axis.
  valueLabel: (value: string) => string;
  locale: string;
  // Off for an answer brought back from history: it is drawn at once.
  animate: boolean;
}

// Categorical slots in fixed order, validated together for colour vision
// deficiency in both modes (see --chart-1..3 in index.css).
const SERIES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
const PLOT_HEIGHT = 140;
// Axes with an order of their own, which bars keep.
const ORDERED_AXES = new Set(["day", "week", "month", "weekday", "hour"]);
const AXIS_HEIGHT = 20;
const TOP_GAP = 16;

// A round step for the axis: 1, 2, 2.5 or 5 times a power of ten.
const niceStep = (span: number) => {
  const magnitude = 10 ** Math.floor(Math.log10(span || 1));
  const step = [1, 2, 2.5, 5, 10].find((k) => k * magnitude >= span) ?? 10;
  return step * magnitude;
};

const scaleOf = (rows: Record<string, unknown>[], columns: string[]) => {
  const values = rows.flatMap((row) =>
    columns.map((column) => row[column]).filter((v) => typeof v === "number")
  ) as number[];
  const max = Math.max(1, ...values);
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) =>
    Number((i * step).toFixed(6))
  );
  return { top, ticks };
};

const numberOf = (value: unknown) =>
  typeof value === "number" ? value : undefined;

// The date-like columns trends are grouped by, read as local dates.
const localDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

// A chart of one function result: a line for a trend, bars to compare rows.
// Every figure comes from the rows themselves; the table of the same check
// stays the way to read them without the chart.
export default function AssistantChart({
  rows,
  chart,
  columnLabel,
  valueLabel,
  locale,
  animate
}: AssistantChartProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const moving = animate && reduceMotion !== true;
  const series = chart.y;
  const numbers = new Intl.NumberFormat(locale);

  const xLabel = (value: unknown, long = false) => {
    if (typeof value !== "string") return String(value ?? "");
    if (chart.x === "day" || chart.x === "week") {
      return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        ...(long && { year: "numeric" })
      }).format(localDate(value));
    }
    if (chart.x === "month") {
      return new Intl.DateTimeFormat(locale, {
        month: long ? "long" : "short",
        year: long ? "numeric" : "2-digit"
      }).format(localDate(value));
    }
    return (
      (chart.x === "weekday" &&
        weekdayName(value, locale, long ? "long" : "short")) ||
      valueLabel(value)
    );
  };

  const title =
    series.length === 1
      ? t("assistant.chart.title", "{{y}} by {{x}}", {
          y: columnLabel(series[0]),
          x: columnLabel(chart.x).toLowerCase()
        })
      : t("assistant.chart.byX", "By {{x}}", {
          x: columnLabel(chart.x).toLowerCase()
        });

  return (
    <figure className="flex flex-col gap-2 rounded-md border p-3">
      <figcaption className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">{title}</span>
        {series.length > 1 && (
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            {series.map((column, index) => (
              <span
                key={column}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Swatch index={index} line={chart.type === "line"} />
                {columnLabel(column)}
              </span>
            ))}
          </span>
        )}
      </figcaption>
      {chart.type === "line" ? (
        <LineChart
          rows={rows}
          x={chart.x}
          series={series}
          columnLabel={columnLabel}
          xLabel={xLabel}
          format={numbers.format}
          moving={moving}
          summary={t(
            "assistant.chart.lineSummary",
            "Line chart of {{title}}, {{count}} points from {{from}} to {{to}}. The table of this check has every value.",
            {
              title,
              count: rows.length,
              from: xLabel(rows[0]?.[chart.x], true),
              to: xLabel(rows.at(-1)?.[chart.x], true)
            }
          )}
        />
      ) : (
        <BarChart
          rows={rows}
          x={chart.x}
          series={series}
          columnLabel={columnLabel}
          xLabel={xLabel}
          format={numbers.format}
          moving={moving}
        />
      )}
    </figure>
  );
}

interface PlotProps {
  rows: Record<string, unknown>[];
  x: string;
  series: string[];
  columnLabel: (column: string) => string;
  xLabel: (value: unknown, long?: boolean) => string;
  format: (value: number) => string;
  moving: boolean;
}

// A series' key: a short stroke for a line, a square for bars.
const Swatch = ({ index, line }: { index: number; line: boolean }) => (
  <span
    aria-hidden="true"
    className={cn(
      "shrink-0",
      line ? "h-0.5 w-3 rounded-full" : "size-2 rounded-[2px]"
    )}
    style={{ background: SERIES[index] }}
  />
);

// The readout for one row: every series' value, values first.
function Readout({
  row,
  series,
  columnLabel,
  format,
  line
}: {
  row: Record<string, unknown>;
  series: string[];
  columnLabel: (column: string) => string;
  format: (value: number) => string;
  line: boolean;
}) {
  return series.map((column, index) => {
    const value = numberOf(row[column]);
    return (
      <span key={column} className="flex items-center gap-1.5">
        <Swatch index={index} line={line} />
        <span className="font-medium text-foreground tabular-nums">
          {value === undefined ? "–" : format(value)}
        </span>
        <span className="text-muted-foreground">{columnLabel(column)}</span>
      </span>
    );
  });
}

function LineChart({
  rows,
  x,
  series,
  columnLabel,
  xLabel,
  format,
  moving,
  summary
}: PlotProps & { summary: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [active, setActive] = useState<number>();
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(200, entry.contentRect.width))
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { top, ticks } = scaleOf(rows, series);
  const tickText = ticks.map(format);
  const left = Math.max(...tickText.map((text) => text.length)) * 7 + 8;
  const right = 6;
  const plotWidth = width - left - right;
  const step = rows.length > 1 ? plotWidth / (rows.length - 1) : 0;
  const xAt = (index: number) => left + index * step;
  const yAt = (value: number) => TOP_GAP + PLOT_HEIGHT * (1 - value / top);
  const height = TOP_GAP + PLOT_HEIGHT + AXIS_HEIGHT;

  // A gap in the data breaks the line rather than dropping it to zero.
  const pathOf = (column: string) =>
    rows
      .map((row, index) => {
        const value = numberOf(row[column]);
        if (value === undefined) return "";
        const previous =
          index > 0 ? numberOf(rows[index - 1][column]) : undefined;
        return `${previous === undefined ? "M" : "L"}${xAt(index)},${yAt(value)}`;
      })
      .join("");

  // As many date labels as fit, always the first and the last.
  const labelCount = Math.min(
    rows.length,
    Math.max(2, Math.floor(plotWidth / 72))
  );
  const labelled = new Set(
    Array.from({ length: labelCount }, (_, i) =>
      Math.round((i * (rows.length - 1)) / Math.max(1, labelCount - 1))
    )
  );

  const pick = (clientX: number) => {
    const bounds = frame.current?.getBoundingClientRect();
    if (!bounds || step === 0) return;
    const index = Math.round((clientX - bounds.left - left) / step);
    setActive(Math.min(rows.length - 1, Math.max(0, index)));
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const last = rows.length - 1;
    const moves: Record<string, number> = {
      ArrowLeft: Math.max(0, (active ?? last) - 1),
      ArrowRight: Math.min(last, (active ?? -1) + 1),
      Home: 0,
      End: last
    };
    if (event.key in moves) {
      event.preventDefault();
      setActive(moves[event.key]);
    } else if (event.key === "Escape") setActive(undefined);
  };

  const single = series.length === 1;
  const lastIndex = rows.length - 1;
  const lastValue = single ? numberOf(rows[lastIndex]?.[series[0]]) : undefined;
  const activeRow = active === undefined ? undefined : rows[active];
  const tooltipLeft =
    active === undefined ? 0 : Math.min(Math.max(xAt(active), 70), width - 70);

  return (
    <div
      ref={frame}
      className="relative outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
      tabIndex={0}
      role="img"
      aria-label={summary}
      onPointerMove={(event) => pick(event.clientX)}
      onPointerLeave={() => setActive(undefined)}
      onFocus={() => setActive((current) => current ?? lastIndex)}
      onBlur={() => setActive(undefined)}
      onKeyDown={onKeyDown}
    >
      <svg width={width} height={height} className="block overflow-visible">
        {ticks.map((tick, index) => (
          <g key={tick}>
            <line
              x1={left}
              x2={width - right}
              y1={yAt(tick)}
              y2={yAt(tick)}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={left - 8}
              y={yAt(tick)}
              dy="0.32em"
              textAnchor="end"
              className="fill-muted-foreground text-[10px] tabular-nums"
            >
              {tickText[index]}
            </text>
          </g>
        ))}
        {rows.map(
          (row, index) =>
            labelled.has(index) && (
              <text
                key={index}
                x={xAt(index)}
                y={height - 4}
                textAnchor={
                  index === 0 ? "start" : index === lastIndex ? "end" : "middle"
                }
                className="fill-muted-foreground text-[10px]"
              >
                {xLabel(row[x])}
              </text>
            )
        )}
        {single && (
          <m.path
            d={`${pathOf(series[0])}L${xAt(lastIndex)},${yAt(0)}L${xAt(0)},${yAt(0)}Z`}
            style={{ fill: SERIES[0] }}
            initial={moving ? { opacity: 0 } : false}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        )}
        {series.map((column, index) => (
          <m.path
            key={column}
            d={pathOf(column)}
            fill="none"
            style={{ stroke: SERIES[index] }}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={moving ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        ))}
        {active !== undefined && (
          <line
            x1={xAt(active)}
            x2={xAt(active)}
            y1={TOP_GAP}
            y2={TOP_GAP + PLOT_HEIGHT}
            className="stroke-muted-foreground/50"
            strokeWidth={1}
          />
        )}
        {series.map((column, index) => {
          const at = active ?? lastIndex;
          const value = numberOf(rows[at]?.[column]);
          if (value === undefined || (active === undefined && !single)) {
            return null;
          }
          return (
            <circle
              key={column}
              cx={xAt(at)}
              cy={yAt(value)}
              r={4}
              strokeWidth={2}
              className="stroke-background"
              style={{ fill: SERIES[index] }}
            />
          );
        })}
        {lastValue !== undefined && active === undefined && (
          <text
            x={xAt(lastIndex) - 8}
            y={yAt(lastValue) - 10}
            textAnchor="end"
            className="fill-foreground text-[10px] font-medium tabular-nums"
          >
            {format(lastValue)}
          </text>
        )}
      </svg>
      {activeRow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 flex -translate-x-1/2 flex-col gap-0.5 rounded-md border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md"
          style={{ left: tooltipLeft }}
        >
          <span className="text-muted-foreground">
            {xLabel(activeRow[x], true)}
          </span>
          <Readout
            row={activeRow}
            series={series}
            columnLabel={columnLabel}
            format={format}
            line
          />
        </div>
      )}
    </div>
  );
}

function BarChart({
  rows,
  x,
  series,
  columnLabel,
  xLabel,
  format,
  moving
}: PlotProps) {
  const [active, setActive] = useState<number>();
  const { top } = scaleOf(rows, series);
  const single = series.length === 1;
  // Names compared read largest first; weekdays and hours keep their order.
  const ordered = ORDERED_AXES.has(x)
    ? rows
    : [...rows].sort(
        (a, b) => (numberOf(b[series[0]]) ?? 0) - (numberOf(a[series[0]]) ?? 0)
      );
  // One series is thick enough to carry its value at the tip; grouped bars
  // stay thin and give their values on hover, focus and in the table.
  const thickness = single ? 16 : 8;

  return (
    <ul className="flex flex-col gap-2">
      {ordered.map((row, rowIndex) => (
        <li
          key={rowIndex}
          tabIndex={0}
          className="relative grid grid-cols-[minmax(3rem,30%)_1fr] items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label={`${xLabel(row[x], true)}: ${series
            .map((column) => {
              const value = numberOf(row[column]);
              return `${value === undefined ? "–" : format(value)} ${columnLabel(column)}`;
            })
            .join(", ")}`}
          onPointerEnter={() => setActive(rowIndex)}
          onPointerLeave={() => setActive(undefined)}
          onFocus={() => setActive(rowIndex)}
          onBlur={() => setActive(undefined)}
        >
          <span
            className="truncate text-xs text-muted-foreground"
            aria-hidden="true"
          >
            {xLabel(row[x])}
          </span>
          <span
            className="flex flex-col gap-0.5 border-l border-border py-0.5"
            aria-hidden="true"
          >
            {series.map((column, index) => {
              const value = numberOf(row[column]) ?? 0;
              return (
                <span key={column} className="flex items-center gap-1.5">
                  <m.span
                    className={cn(
                      "block origin-left rounded-r-[4px] transition-[filter]",
                      active === rowIndex && "brightness-110"
                    )}
                    style={{
                      width: `${(value / top) * 100}%`,
                      height: thickness,
                      background: SERIES[index]
                    }}
                    initial={moving ? { scaleX: 0 } : false}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: 0.5,
                      ease: "easeOut",
                      delay: Math.min(rowIndex * 0.03, 0.3)
                    }}
                  />
                  {single && (
                    <span className="text-[10px] font-medium tabular-nums">
                      {format(value)}
                    </span>
                  )}
                </span>
              );
            })}
          </span>
          {!single && active === rowIndex && (
            <span className="pointer-events-none absolute right-0 bottom-full z-10 mb-1 flex flex-col gap-0.5 rounded-md border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md">
              <span className="text-muted-foreground">
                {xLabel(row[x], true)}
              </span>
              <Readout
                row={row}
                series={series}
                columnLabel={columnLabel}
                format={format}
                line={false}
              />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

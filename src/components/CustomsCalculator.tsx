"use client";

import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { Sparkles } from "lucide-react";
import { formatEGP } from "@/lib/format";

type FormValues = { customsTotal: number };

type Props = {
  totalOrderPrice: number;
  disabled?: boolean;
  onCalculate: (customsTotal: number) => void;
};

export function CustomsCalculator({
  totalOrderPrice,
  disabled,
  onCalculate,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { customsTotal: 0 } });

  const submit = handleSubmit((values) => {
    onCalculate(Number(values.customsTotal));
  });

  return (
    <motion.form
      onSubmit={submit}
      layout
      className="rounded-2xl border border-border bg-surface p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            Customs total
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Order total:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {formatEGP(totalOrderPrice)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            disabled={disabled}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-14 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
            {...register("customsTotal", {
              required: "Required",
              valueAsNumber: true,
              validate: (v) =>
                (Number.isFinite(v) && v > 0) || "Must be greater than 0",
            })}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted">
            EGP
          </span>
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          Calculate
        </button>
      </div>

      {errors.customsTotal && (
        <p className="mt-2 text-xs text-red-500">
          {errors.customsTotal.message}
        </p>
      )}
    </motion.form>
  );
}

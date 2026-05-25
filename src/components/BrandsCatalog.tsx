"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import BrandGrid from "@/components/BrandGrid";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import Pagination from "@/components/Pagination";
import { getBrands } from "@/lib/api";
import type { BrandsApiResponse } from "@/types/brands";

const LIMIT = 12;

function requestedPageNumber(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export default function BrandsCatalog() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"loading" | "error" | "ok">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [payload, setPayload] = useState<BrandsApiResponse | null>(null);
  const [retryBump, setRetryBump] = useState(0);

  const pageFromUrl = requestedPageNumber(searchParams.get("page"));

  useEffect(() => {
    const ctl = new AbortController();

    setStatus("loading");
    setPayload(null);
    setErrorMessage("");

    getBrands(pageFromUrl, LIMIT, ctl.signal)
      .then((response) => {
        setPayload(response);
        setStatus("ok");
        setErrorMessage("");
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === "AbortError") return;
        setPayload(null);
        setStatus("error");
        setErrorMessage(
          e instanceof Error
            ? e.message
            : "Something went wrong while loading brands.",
        );
      });

    return () => ctl.abort();
  }, [pageFromUrl, retryBump]);

  const retry = useCallback(() => {
    setRetryBump((x) => x + 1);
  }, []);

  const totalPagesUi =
    payload != null && payload.meta.totalBrands === 0
      ? 1
      : Math.max(1, payload?.meta.totalPages ?? 1);

  const displayedPage = payload?.meta.page ?? pageFromUrl;

  return (
    <>
      {status === "loading" && <LoadingState />}
      {status === "error" && (
        <ErrorState message={errorMessage} onRetry={retry} />
      )}
      {status === "ok" && payload && (
        <>
          <BrandGrid brands={payload.data} />
          <Pagination
            basePath="/"
            currentPage={displayedPage}
            totalPages={totalPagesUi}
          />
        </>
      )}
    </>
  );
}

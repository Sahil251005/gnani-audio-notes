"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import { useParams } from "next/navigation";

import {
  getUpload,
  getUploadStatus,
} from "@/lib/api";


type UploadStatus = {
  id: string;
  status: string;
  error_code?: string | null;
  error_message?: string | null;
};


type UploadDetails = {
  id: string;
  filename: string;
  language_code: string;
  status: string;
  transcript?: string | null;
  summary?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  created_at?: string;
  completed_at?: string | null;
};


const TERMINAL_STATUSES = [
  "COMPLETED",
  "FAILED",
  "CANCELLED",
];


function formatDate(
  value?: string | null
) {
  if (!value) {
    return null;
  }

  return new Date(
    value
  ).toLocaleString();
}


export default function UploadPage() {
  const params = useParams();

  const id =
    params.id as string;

  const [
    status,
    setStatus,
  ] =
    useState<UploadStatus | null>(
      null
    );

  const [
    details,
    setDetails,
  ] =
    useState<UploadDetails | null>(
      null
    );

  const [error, setError] =
    useState("");


  useEffect(() => {
    let active = true;

    let timer:
      ReturnType<
        typeof setInterval
      > | null = null;


    async function refreshDetails() {
      const fullDetails =
        await getUpload(id);

      if (active) {
        setDetails(
          fullDetails
        );
      }
    }


    async function checkStatus() {
      try {
        const current =
          await getUploadStatus(id);

        if (!active) {
          return;
        }

        setStatus(current);

        /*
         * Transcript can already exist
         * while summary is running.
         */
        if (
          current.status ===
          "SUMMARIZING"
        ) {
          await refreshDetails();
        }


        if (
          TERMINAL_STATUSES.includes(
            current.status
          )
        ) {
          if (timer) {
            clearInterval(timer);
            timer = null;
          }

          await refreshDetails();
        }

      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Could not load upload."
        );
      }
    }


    async function loadInitialData() {
      try {
        const [
          fullDetails,
          currentStatus,
        ] = await Promise.all([
          getUpload(id),
          getUploadStatus(id),
        ]);

        if (!active) {
          return;
        }

        setDetails(
          fullDetails
        );

        setStatus(
          currentStatus
        );


        if (
          !TERMINAL_STATUSES.includes(
            currentStatus.status
          )
        ) {
          timer =
            setInterval(
              checkStatus,
              3000
            );
        }

      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Could not load upload."
        );
      }
    }


    loadInitialData();


    return () => {
      active = false;

      if (timer) {
        clearInterval(timer);
      }
    };

  }, [id]);


  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">

        <div className="mx-auto max-w-4xl px-6 py-12">

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>

        </div>

      </main>
    );
  }


  if (!details || !status) {
    return (
      <main className="min-h-screen bg-gray-50">

        <div className="mx-auto max-w-4xl px-6 py-12">

          <p className="text-sm text-gray-500">
            Loading audio note...
          </p>

        </div>

      </main>
    );
  }


  const createdAt =
    formatDate(
      details.created_at
    );

  const completedAt =
    formatDate(
      details.completed_at
    );


  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-4xl px-6 py-12">


        {/* Back */}
        <Link
          href="/"
          className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          ← Back to dashboard
        </Link>


        {/* Header */}
        <header className="mt-6">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div className="min-w-0">

              <h1 className="break-words text-3xl font-semibold tracking-tight text-gray-900">
                {details.filename}
              </h1>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">

                <span>
                  Language:{" "}
                  {details.language_code}
                </span>

                {createdAt && (
                  <span>
                    Uploaded:{" "}
                    {createdAt}
                  </span>
                )}

                {completedAt && (
                  <span>
                    Completed:{" "}
                    {completedAt}
                  </span>
                )}

              </div>

            </div>


            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                status.status ===
                "COMPLETED"
                  ? "bg-green-50 text-green-700"
                  : status.status ===
                    "FAILED"
                  ? "bg-red-50 text-red-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {status.status}
            </span>

          </div>

        </header>


        {/* Still processing */}
        {!TERMINAL_STATUSES.includes(
          status.status
        ) && (

          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/50 px-5 py-4">

            <p className="text-sm font-medium text-blue-900">
              This audio note is still
              being processed.
            </p>

            <p className="mt-1 text-sm text-blue-700">
              The page will update when
              more results become
              available.
            </p>

          </div>

        )}


        {/* Failure */}
        {status.status ===
          "FAILED" && (

          <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">

            <h2 className="text-lg font-semibold text-red-800">
              Processing failed
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {details.error_message ??
                status.error_message ??
                "Processing failed."}
            </p>

            {details.error_code && (
              <p className="mt-3 text-xs text-red-600">
                Error code:{" "}
                {details.error_code}
              </p>
            )}

          </section>
        )}


        {/* Full Transcript */}
        {details.transcript && (

          <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-4">

              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Transcript
              </p>

              <h2 className="mt-1 text-xl font-semibold text-gray-900">
                Full audio transcript
              </h2>

            </div>


            <div className="px-6 py-6">

              <p className="whitespace-pre-wrap text-[15px] leading-7 text-gray-700">
                {details.transcript}
              </p>

            </div>

          </section>
        )}


        {/* Full Summary */}
        {details.summary && (

          <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-100 bg-blue-50/30 px-6 py-4">

              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                Summary
              </p>

              <h2 className="mt-1 text-xl font-semibold text-gray-900">
                Complete summary
              </h2>

            </div>


            <div className="px-6 py-6">

              <p className="whitespace-pre-wrap text-[15px] leading-7 text-gray-700">
                {details.summary}
              </p>

            </div>

          </section>
        )}


        {/* No results yet */}
        {!details.transcript &&
          !details.summary &&
          status.status !== "FAILED" && (

            <div className="mt-8 rounded-xl border border-gray-200 bg-white px-6 py-8 text-center">

              <p className="text-sm text-gray-500">
                Transcript and summary
                are not available yet.
              </p>

            </div>

          )}

      </div>

    </main>
  );
}
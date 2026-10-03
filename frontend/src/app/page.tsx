"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  getUpload,
  getUploads,
  getUploadStatus,
  uploadAudio,
} from "@/lib/api";


const CURRENT_UPLOAD_KEY =
  "gnani-current-upload-id";


const LANGUAGES = [
  { code: "en-IN", name: "English" },
  { code: "hi-IN", name: "Hindi" },
  { code: "bn-IN", name: "Bengali" },
  { code: "kn-IN", name: "Kannada" },
  { code: "ml-IN", name: "Malayalam" },
  { code: "mr-IN", name: "Marathi" },
  { code: "ta-IN", name: "Tamil" },
  { code: "te-IN", name: "Telugu" },
];


const STAGES = [
  "UPLOADED",
  "QUEUED",
  "TRANSCRIBING",
  "SUMMARIZING",
  "COMPLETED",
];


const PROCESSING_PROGRESS: Record<
  string,
  number
> = {
  UPLOADED: 20,
  QUEUED: 40,
  TRANSCRIBING: 60,
  SUMMARIZING: 80,
  COMPLETED: 100,
};


const STATUS_LABELS: Record<
  string,
  string
> = {
  UPLOADED: "Uploaded",
  QUEUED: "Queued",
  TRANSCRIBING: "Transcribing",
  SUMMARIZING: "Summarizing",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};


const STATUS_MESSAGES: Record<
  string,
  string
> = {
  UPLOADED:
    "Audio uploaded successfully. Preparing it for processing.",

  QUEUED:
    "The audio is queued and waiting for the background worker.",

  TRANSCRIBING:
    "Gnani Batch STT is transcribing the audio.",

  SUMMARIZING:
    "The transcript is ready. Generating the summary.",

  COMPLETED:
    "Processing is complete. Transcript and summary are ready.",

  FAILED:
    "The audio could not be processed successfully.",

  CANCELLED:
    "Processing was cancelled.",
};


const TERMINAL_STATUSES = [
  "COMPLETED",
  "FAILED",
  "CANCELLED",
];


type CurrentUploadDetails = {
  filename?: string;
  language_code?: string;
  transcript?: string | null;
  summary?: string | null;
  error_code?: string | null;
  error_message?: string | null;
};


type RecentUpload = {
  id: string;
  filename: string;
  language_code?: string;
  status: string;
  created_at?: string;
};


/* -------------------------------------------------
   SMALL UI COMPONENTS
------------------------------------------------- */

function WaveIcon() {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-sm">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-7 w-7 text-blue-600"
        aria-hidden="true"
      >
        <path
          d="M3 12h2m2-4v8m3-12v16m3-12v8m3-6v4m3-2h2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}


function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M12 8v4l2.5 1.5M21 12a9 9 0 1 1-3-6.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M18 2v4h-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M7 3h7l4 4v14H7V3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M14 3v5h4M10 12h5M10 16h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}


function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="m12 3 1.1 3.4A5.4 5.4 0 0 0 16.6 10L20 11l-3.4 1.1a5.4 5.4 0 0 0-3.5 3.5L12 19l-1.1-3.4a5.4 5.4 0 0 0-3.5-3.5L4 11l3.4-1a5.4 5.4 0 0 0 3.5-3.6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M5 12h14M14 7l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


/* -------------------------------------------------
   HELPERS
------------------------------------------------- */

function createPreview(
  text: string,
  maxLength: number
) {
  if (text.length <= maxLength) {
    return text;
  }

  const shortened =
    text.slice(0, maxLength);

  const lastSpace =
    shortened.lastIndexOf(" ");

  return `${
    lastSpace > 0
      ? shortened.slice(0, lastSpace)
      : shortened
  }...`;
}


function formatUploadDate(
  value?: string
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function statusStyle(
  status: string
) {
  if (status === "COMPLETED") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "FAILED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "CANCELLED") {
    return "border-gray-200 bg-gray-100 text-gray-600";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}


/* -------------------------------------------------
   PAGE
------------------------------------------------- */

export default function Home() {
  const [file, setFile] =
    useState<File | null>(null);

  const [
    languageCode,
    setLanguageCode,
  ] = useState("en-IN");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState(0);

  const [
    currentUploadId,
    setCurrentUploadId,
  ] = useState<string | null>(null);

  const [
    currentStatus,
    setCurrentStatus,
  ] = useState<string | null>(null);

  const [
    currentDetails,
    setCurrentDetails,
  ] =
    useState<CurrentUploadDetails | null>(
      null
    );

  const [
    recentUploads,
    setRecentUploads,
  ] = useState<RecentUpload[]>([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(true);

  const [
    historyError,
    setHistoryError,
  ] = useState(false);


  /* -----------------------------------------------
     HISTORY
  ------------------------------------------------ */

  const refreshRecentUploads =
    useCallback(async () => {
      try {
        const uploads =
          (await getUploads()) as RecentUpload[];

        const latest = [...uploads]
          .sort((a, b) => {
            const first =
              Date.parse(
                a.created_at ?? ""
              ) || 0;

            const second =
              Date.parse(
                b.created_at ?? ""
              ) || 0;

            return second - first;
          })
          .slice(0, 10);

        setRecentUploads(latest);
        setHistoryError(false);

      } catch {
        setHistoryError(true);

      } finally {
        setHistoryLoading(false);
      }
    }, []);


  /* -----------------------------------------------
     RESTORE CURRENT JOB
  ------------------------------------------------ */

  useEffect(() => {
    const storedUploadId =
      sessionStorage.getItem(
        CURRENT_UPLOAD_KEY
      );

    if (storedUploadId) {
      setCurrentUploadId(
        storedUploadId
      );
    }
  }, []);


  /* -----------------------------------------------
     REFRESH HISTORY
  ------------------------------------------------ */

  useEffect(() => {
    void refreshRecentUploads();

    const timer = setInterval(
      () => {
        void refreshRecentUploads();
      },
      10000
    );

    return () => {
      clearInterval(timer);
    };
  }, [refreshRecentUploads]);


  /* -----------------------------------------------
     UPLOAD
  ------------------------------------------------ */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!file) {
      setError(
        "Please select an audio file."
      );
      return;
    }

    setLoading(true);
    setError("");
    setUploadProgress(0);

    try {
      const result =
        await uploadAudio(
          file,
          languageCode,
          setUploadProgress
        );

      setCurrentUploadId(
        result.id
      );

      setCurrentStatus(null);
      setCurrentDetails(null);

      sessionStorage.setItem(
        CURRENT_UPLOAD_KEY,
        result.id
      );

      void refreshRecentUploads();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Upload failed."
      );

    } finally {
      setLoading(false);
    }
  }


  /* -----------------------------------------------
     POLL STATUS
  ------------------------------------------------ */

  useEffect(() => {
    if (!currentUploadId) {
      return;
    }

    const uploadId =
      currentUploadId;

    let active = true;

    let timer:
      ReturnType<
        typeof setTimeout
      > | null = null;


    async function refreshStatus() {
      try {
        const result =
          await getUploadStatus(
            uploadId
          );

        if (!active) {
          return;
        }

        setCurrentStatus(
          result.status
        );

        if (
          TERMINAL_STATUSES.includes(
            result.status
          )
        ) {
          void refreshRecentUploads();
          return;
        }

        timer = setTimeout(
          refreshStatus,
          3000
        );

      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Could not load processing status."
        );

        timer = setTimeout(
          refreshStatus,
          3000
        );
      }
    }


    void refreshStatus();


    return () => {
      active = false;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [
    currentUploadId,
    refreshRecentUploads,
  ]);


  /* -----------------------------------------------
     LOAD DETAILS
  ------------------------------------------------ */

  useEffect(() => {
    if (!currentUploadId) {
      return;
    }

    const uploadId =
      currentUploadId;

    let active = true;


    async function loadDetails() {
      try {
        const details =
          await getUpload(
            uploadId
          );

        if (!active) {
          return;
        }

        setCurrentDetails({
          filename:
            details.filename,

          language_code:
            details.language_code,

          transcript:
            details.transcript,

          summary:
            details.summary,

          error_code:
            details.error_code,

          error_message:
            details.error_message,
        });

      } catch {
        // Status polling continues.
      }
    }


    void loadDetails();


    return () => {
      active = false;
    };
  }, [
    currentUploadId,
    currentStatus,
  ]);


  const processingProgress =
    currentStatus
      ? PROCESSING_PROGRESS[
          currentStatus
        ] ?? 0
      : 0;


  const currentStageIndex =
    currentStatus
      ? STAGES.indexOf(
          currentStatus
        )
      : -1;


  return (
    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 lg:px-8 lg:py-10">


        {/* ---------------------------------------
            HERO
        ---------------------------------------- */}

        <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 px-6 py-8 shadow-sm sm:px-8">

          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-blue-100/50 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">

            <div className="flex items-start gap-4 sm:gap-5">

              <WaveIcon />

              <div>

                <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                  Audio Notes Workspace
                </div>

                <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Turn audio into useful notes
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                  Upload an audio file, follow its
                  processing status, and review the
                  generated transcript and summary.
                </p>

              </div>

            </div>


            <div className="grid grid-cols-2 gap-3 sm:flex">

              <div className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">

                <p className="text-xs font-medium text-slate-400">
                  Processing
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  Background jobs
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">

                <p className="text-xs font-medium text-slate-400">
                  Output
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  Transcript + Summary
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ---------------------------------------
            MAIN GRID
        ---------------------------------------- */}

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_350px] xl:grid-cols-[minmax(0,1fr)_370px]">


          {/* =====================================
              LEFT COLUMN
          ====================================== */}

          <div className="min-w-0 space-y-6">


            {/* -----------------------------------
                UPLOAD CARD
            ------------------------------------ */}

            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >

              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <UploadIcon />
                </div>

                <div>

                  <h2 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
                    Create Audio Note
                  </h2>

                  <p className="mt-0.5 text-sm text-slate-500">
                    Choose the audio and its spoken language.
                  </p>

                </div>

              </div>


              <div className="p-6">

                <div className="grid gap-5 md:grid-cols-2">


                  {/* FILE */}
                  <div>

                    <label
                      htmlFor="audio"
                      className="text-sm font-semibold text-slate-800"
                    >
                      Audio file
                    </label>

                    <p className="mt-1 text-xs text-slate-400">
                      MP3, WAV, M4A, AAC, OGG or FLAC
                    </p>

                    <input
                      id="audio"
                      type="file"
                      accept=".mp3,.wav,.m4a,.aac,.ogg,.flac"
                      onChange={(event) => {
                        setFile(
                          event.target
                            .files?.[0] ??
                            null
                        );

                        setError("");
                      }}
                      className="mt-3 block w-full cursor-pointer rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700 hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />

                  </div>


                  {/* LANGUAGE */}
                  <div>

                    <label
                      htmlFor="language"
                      className="text-sm font-semibold text-slate-800"
                    >
                      Spoken language
                    </label>

                    <p className="mt-1 text-xs text-slate-400">
                      Select the language used in the recording
                    </p>

                    <select
                      id="language"
                      value={languageCode}
                      onChange={(event) =>
                        setLanguageCode(
                          event.target.value
                        )
                      }
                      className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >

                      {LANGUAGES.map(
                        (language) => (
                          <option
                            key={language.code}
                            value={language.code}
                          >
                            {language.name} (
                            {language.code})
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>


                {/* SELECTED FILE */}
                {file && (
                  <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3.5 sm:flex-row sm:items-center">

                    <div className="min-w-0">

                      <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                        Selected audio
                      </p>

                      <p
                        className="mt-1 truncate text-sm font-semibold text-slate-900"
                        title={file.name}
                      >
                        {file.name}
                      </p>

                    </div>


                    <div className="flex shrink-0 items-center gap-2">

                      <span className="rounded-lg border border-blue-100 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">
                        {(
                          file.size /
                          (1024 * 1024)
                        ).toFixed(2)}{" "}
                        MB
                      </span>

                      <span className="rounded-lg border border-blue-100 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">
                        {file.type ||
                          "Audio"}
                      </span>

                    </div>

                  </div>
                )}


                {/* UPLOAD PROGRESS */}
                {loading && (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

                    <div className="flex items-center justify-between text-sm">

                      <span className="font-medium text-slate-700">
                        {uploadProgress < 100
                          ? "Uploading audio..."
                          : "Upload received"}
                      </span>

                      <span className="font-semibold tabular-nums text-blue-700">
                        {uploadProgress}%
                      </span>

                    </div>


                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">

                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{
                          width: `${uploadProgress}%`,
                        }}
                      />

                    </div>

                  </div>
                )}


                {/* ERROR */}
                {error && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">

                    <p className="text-sm font-medium text-red-700">
                      {error}
                    </p>

                  </div>
                )}


                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UploadIcon />

                  {loading
                    ? "Uploading..."
                    : "Upload and Process"}
                </button>

              </div>

            </form>


            {/* -----------------------------------
                CURRENT JOB
            ------------------------------------ */}

            {currentUploadId &&
              currentStatus && (

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">


                  {/* HEADER */}
                  <div className="flex flex-col justify-between gap-5 px-6 py-6 sm:flex-row sm:items-start">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Current Job
                        </p>

                        {currentDetails?.language_code && (
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                            {currentDetails.language_code}
                          </span>
                        )}

                      </div>


                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                        {STATUS_LABELS[
                          currentStatus
                        ] ??
                          currentStatus}
                      </h2>


                      {currentDetails?.filename && (
                        <p
                          className="mt-2 max-w-xl truncate text-sm font-medium text-slate-600"
                          title={
                            currentDetails.filename
                          }
                        >
                          {currentDetails.filename}
                        </p>
                      )}


                      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                        {STATUS_MESSAGES[
                          currentStatus
                        ]}
                      </p>

                    </div>


                    <span
                      className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyle(
                        currentStatus
                      )}`}
                    >
                      <span
                        className={`mr-2 h-2 w-2 rounded-full ${
                          currentStatus ===
                          "COMPLETED"
                            ? "bg-green-500"
                            : currentStatus ===
                              "FAILED"
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }`}
                      />

                      {STATUS_LABELS[
                        currentStatus
                      ] ??
                        currentStatus}
                    </span>

                  </div>


                  {/* WORKFLOW */}
                  {![
                    "FAILED",
                    "CANCELLED",
                  ].includes(
                    currentStatus
                  ) && (

                    <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-6">

                      <div className="flex items-end justify-between gap-4">

                        <div>

                          <p className="text-sm font-semibold text-slate-900">
                            Processing workflow
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Current progress through the processing pipeline
                          </p>

                        </div>


                        <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
                          {processingProgress}
                          <span className="ml-0.5 text-base text-slate-400">
                            %
                          </span>
                        </span>

                      </div>


                      {/* BAR */}
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">

                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            currentStatus ===
                            "COMPLETED"
                              ? "bg-green-500"
                              : "bg-blue-600"
                          }`}
                          style={{
                            width: `${processingProgress}%`,
                          }}
                        />

                      </div>


                      {/* STAGES */}
                      <div className="mt-6 grid grid-cols-5 gap-1 sm:gap-3">

                        {STAGES.map(
                          (
                            stage,
                            index
                          ) => {

                            const reached =
                              index <=
                              currentStageIndex;

                            const active =
                              stage ===
                              currentStatus;

                            const finalCompleted =
                              currentStatus ===
                              "COMPLETED";

                            return (
                              <div
                                key={stage}
                                className="min-w-0 text-center"
                              >

                                <div
                                  className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${
                                    finalCompleted &&
                                    reached
                                      ? "border-green-500 bg-green-500"
                                      : active
                                      ? "border-blue-600 bg-blue-600"
                                      : reached
                                      ? "border-blue-300 bg-blue-100"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {reached && (
                                    <span
                                      className={`h-2 w-2 rounded-full ${
                                        finalCompleted
                                          ? "bg-white"
                                          : active
                                          ? "bg-white"
                                          : "bg-blue-500"
                                      }`}
                                    />
                                  )}
                                </div>


                                <p
                                  className={`mt-2 truncate text-[11px] sm:text-xs ${
                                    finalCompleted &&
                                    reached
                                      ? "font-semibold text-green-700"
                                      : active
                                      ? "font-semibold text-blue-700"
                                      : reached
                                      ? "font-medium text-slate-600"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {stage ===
                                  "COMPLETED"
                                    ? "Done"
                                    : STATUS_LABELS[
                                        stage
                                      ]}
                                </p>

                              </div>
                            );
                          }
                        )}

                      </div>

                    </div>
                  )}


                  {/* FAILURE */}
                  {currentStatus ===
                    "FAILED" && (

                    <div className="border-t border-red-100 bg-red-50 px-6 py-5">

                      <p className="text-sm font-semibold text-red-800">
                        Processing failed
                      </p>

                      <p className="mt-1.5 text-sm leading-6 text-red-700">
                        {currentDetails?.error_message ??
                          "The audio could not be processed successfully."}
                      </p>

                      {currentDetails?.error_code && (
                        <p className="mt-2 text-xs font-medium text-red-500">
                          Error code:{" "}
                          {currentDetails.error_code}
                        </p>
                      )}

                    </div>

                  )}

                </section>
              )}


            {/* -----------------------------------
                TRANSCRIPT + SUMMARY
            ------------------------------------ */}

            {(currentDetails?.transcript ||
              currentDetails?.summary) && (

              <div className="grid gap-6 xl:grid-cols-2">


                {/* TRANSCRIPT */}
                {currentUploadId &&
                  currentDetails?.transcript && (

                    <section className="flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <DocumentIcon />
                          </div>

                          <div>

                            <h2 className="font-semibold text-slate-950">
                              Transcript
                            </h2>

                            <p className="text-xs text-slate-400">
                              Generated from the uploaded audio
                            </p>

                          </div>

                        </div>

                      </div>


                      <div className="flex-1 px-5 py-5">

                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                          {createPreview(
                            currentDetails.transcript,
                            520
                          )}
                        </p>

                      </div>


                      <div className="border-t border-slate-100 px-5 py-4">

                        <Link
                          href={`/uploads/${currentUploadId}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                        >
                          Read full transcript

                          <ArrowIcon />
                        </Link>

                      </div>

                    </section>
                  )}


                {/* SUMMARY */}
                {currentUploadId &&
                  currentDetails?.summary && (

                    <section className="flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                            <SparkIcon />
                          </div>

                          <div>

                            <h2 className="font-semibold text-slate-950">
                              Summary
                            </h2>

                            <p className="text-xs text-slate-400">
                              Generated from the saved transcript
                            </p>

                          </div>

                        </div>

                      </div>


                      <div className="flex-1 px-5 py-5">

                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                          {createPreview(
                            currentDetails.summary,
                            430
                          )}
                        </p>

                      </div>


                      <div className="border-t border-slate-100 px-5 py-4">

                        <Link
                          href={`/uploads/${currentUploadId}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 transition hover:text-violet-800"
                        >
                          View complete note

                          <ArrowIcon />
                        </Link>

                      </div>

                    </section>
                  )}

              </div>
            )}

          </div>


          {/* =====================================
              RIGHT COLUMN - HISTORY
          ====================================== */}

          <aside className="self-start lg:sticky lg:top-6">

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">


              {/* HEADER */}
              <div className="border-b border-slate-100 bg-gradient-to-br from-white to-blue-50/50 px-5 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <HistoryIcon />
                  </div>


                  <div className="min-w-0 flex-1">

                    <div className="flex items-center justify-between gap-3">

                      <h2 className="text-base font-semibold text-slate-950">
                        Recent Uploads
                      </h2>

                      <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {recentUploads.length}
                      </span>

                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      Your latest audio notes
                    </p>

                  </div>

                </div>

              </div>


              {/* HISTORY CONTENT */}
              <div className="space-y-2.5 p-3.5">


                {historyLoading && (
                  <div className="rounded-xl bg-slate-50 px-4 py-6 text-center">

                    <p className="text-sm text-slate-500">
                      Loading recent uploads...
                    </p>

                  </div>
                )}


                {!historyLoading &&
                  historyError && (

                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-5">

                      <p className="text-sm text-red-700">
                        Recent uploads could not be loaded.
                      </p>

                    </div>
                  )}


                {!historyLoading &&
                  !historyError &&
                  recentUploads.length ===
                    0 && (

                    <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">

                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                        <HistoryIcon />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-800">
                        No uploads yet
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Your recent audio notes will appear here.
                      </p>

                    </div>
                  )}


                {!historyLoading &&
                  !historyError &&
                  recentUploads.map(
                    (upload) => (

                      <Link
                        key={upload.id}
                        href={`/uploads/${upload.id}`}
                        className="group block rounded-xl border border-slate-100 bg-white px-4 py-3.5 transition hover:border-blue-200 hover:bg-blue-50/30"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-slate-800 transition group-hover:text-blue-700">
                              {upload.filename}
                            </p>


                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">

                              {upload.language_code && (
                                <span className="font-medium text-slate-500">
                                  {upload.language_code}
                                </span>
                              )}


                              {upload.language_code &&
                                upload.created_at && (
                                  <span className="text-slate-300">
                                    •
                                  </span>
                                )}


                              {upload.created_at && (
                                <span className="text-slate-400">
                                  {formatUploadDate(
                                    upload.created_at
                                  )}
                                </span>
                              )}

                            </div>

                          </div>


                          <span
                            className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${statusStyle(
                              upload.status
                            )}`}
                          >
                            {STATUS_LABELS[
                              upload.status
                            ] ??
                              upload.status}
                          </span>

                        </div>

                      </Link>
                    )
                  )}

              </div>


              {/* FULL HISTORY */}
              <div className="border-t border-slate-100 px-4 py-4">

                <Link
                  href="/history"
                  className="flex items-center justify-between rounded-xl px-2 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  <span>
                    View full history
                  </span>

                  <ArrowIcon />
                </Link>

              </div>

            </section>

          </aside>

        </div>

      </div>

    </main>
  );
}
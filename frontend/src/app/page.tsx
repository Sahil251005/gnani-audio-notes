"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  uploadAudio,
  getUploadStatus,
  getUpload,
  getUploads,
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
    "Audio upload completed. Preparing it for processing.",

  QUEUED:
    "Audio is queued and waiting for the background worker.",

  TRANSCRIBING:
    "Gnani is transcribing the audio.",

  SUMMARIZING:
    "Transcription is complete. Generating the summary.",

  COMPLETED:
    "Processing is complete. Transcript and summary are ready.",

  FAILED:
    "Processing could not be completed.",

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


function AudioIllustration() {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-sm">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-7 w-7 text-blue-600"
        aria-hidden="true"
      >
        <path
          d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}


function HistoryIllustration() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5 text-blue-600"
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
    </div>
  );
}


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
    return "border border-green-100 bg-green-50 text-green-700";
  }

  if (status === "FAILED") {
    return "border border-red-100 bg-red-50 text-red-700";
  }

  if (status === "CANCELLED") {
    return "border border-gray-200 bg-gray-100 text-gray-600";
  }

  return "border border-blue-100 bg-blue-50 text-blue-700";
}


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


  /*
   * Recent uploads
   */
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


  /*
   * Restore current dashboard upload.
   */
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


  /*
   * Load recent history and refresh it.
   */
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


  /*
   * Poll current processing status.
   */
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


  /*
   * Load current job details.
   */
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

      <div className="mx-auto max-w-[1280px] px-6 py-10 lg:px-8">


        {/* HERO */}
        <section className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-white via-white to-blue-50/60 px-7 py-7 shadow-sm">

          <div className="flex items-start gap-5">

            <AudioIllustration />


            <div className="max-w-3xl">

              <p className="font-medium text-blue-600">
                Audio Notes Workspace
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                Turn audio into structured notes
              </h1>

              <p className="mt-2 max-w-2xl text-base leading-7 text-gray-600">
                Upload audio, follow its processing
                workflow, and review the generated
                transcript and summary.
              </p>

            </div>

          </div>

        </section>


        {/* DASHBOARD */}
        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_365px]">


          {/* LEFT SIDE */}
          <div className="min-w-0 space-y-6">


            {/* UPLOAD */}
            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >

              <div className="border-b border-gray-100 px-6 py-5">

                <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                  Create Audio Note
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Choose an audio file and its
                  spoken language to start processing.
                </p>

              </div>


              <div className="p-6">


                <div className="grid gap-6 md:grid-cols-2">


                  {/* Audio */}
                  <div>

                    <label
                      htmlFor="audio"
                      className="block text-sm font-semibold text-gray-800"
                    >
                      Audio file
                    </label>

                    <input
                      id="audio"
                      type="file"
                      accept=".mp3,.wav,.m4a,.aac,.ogg,.flac"
                      onChange={(event) =>
                        setFile(
                          event.target
                            .files?.[0] ??
                            null
                        )
                      }
                      className="mt-2 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />

                  </div>


                  {/* Language */}
                  <div>

                    <label
                      htmlFor="language"
                      className="block text-sm font-semibold text-gray-800"
                    >
                      Language
                    </label>

                    <select
                      id="language"
                      value={languageCode}
                      onChange={(event) =>
                        setLanguageCode(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >

                      {LANGUAGES.map(
                        (language) => (
                          <option
                            key={
                              language.code
                            }
                            value={
                              language.code
                            }
                          >
                            {
                              language.name
                            }{" "}
                            (
                            {
                              language.code
                            }
                            )
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>


                {/* Selected file */}
                {file && (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3.5">

                    <div className="min-w-0">

                      <p className="text-sm text-gray-500">
                        Selected audio
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                        {file.name}
                      </p>

                    </div>


                    <div className="flex items-center gap-3">

                      <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-600">
                        {(
                          file.size /
                          (1024 * 1024)
                        ).toFixed(2)}{" "}
                        MB
                      </span>

                      <span className="text-sm text-gray-500">
                        {file.type ||
                          "Audio"}
                      </span>

                    </div>

                  </div>
                )}


                {/* Real upload progress */}
                {loading && (
                  <div className="mt-5 rounded-xl bg-gray-50 p-4">

                    <div className="flex justify-between text-sm">

                      <span className="font-medium text-gray-700">
                        {uploadProgress <
                        100
                          ? "Uploading audio"
                          : "Upload received"}
                      </span>

                      <span className="font-semibold text-blue-700">
                        {
                          uploadProgress
                        }
                        %
                      </span>

                    </div>


                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">

                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width: `${uploadProgress}%`,
                        }}
                      />

                    </div>

                  </div>
                )}


                <button
                  type="submit"
                  disabled={loading}
                  className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Uploading..."
                    : "Upload Audio"}
                </button>


                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

              </div>

            </form>


            {/* CURRENT JOB */}
            {currentUploadId &&
              currentStatus && (

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">


                  {/* JOB HEADER */}
                  <div className="grid gap-5 px-6 py-6 md:grid-cols-[minmax(0,1fr)_auto]">


                    {/* LEFT INFORMATION */}
                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-3">

                        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                          Current Job
                        </h2>


                        {currentDetails?.language_code && (
                          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-600">
                            {
                              currentDetails.language_code
                            }
                          </span>
                        )}

                      </div>


                      {currentDetails?.filename && (
                        <p
                          className="mt-3 truncate text-base text-gray-600"
                          title={
                            currentDetails.filename
                          }
                        >
                          {
                            currentDetails.filename
                          }
                        </p>
                      )}


                      <div className="mt-5">

                        <p className="text-xl font-semibold text-gray-900">
                          {STATUS_LABELS[
                            currentStatus
                          ] ??
                            currentStatus}
                        </p>

                        <p className="mt-1.5 text-base leading-7 text-gray-600">
                          {STATUS_MESSAGES[
                            currentStatus
                          ]}
                        </p>

                      </div>

                    </div>


                    {/* RIGHT STATUS */}
                    <div className="md:justify-self-end">

                      <span
                        className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${statusStyle(
                          currentStatus
                        )}`}
                      >
                        {STATUS_LABELS[
                          currentStatus
                        ] ??
                          currentStatus}
                      </span>

                    </div>

                  </div>


                  {/* WORKFLOW */}
                  {![
                    "FAILED",
                    "CANCELLED",
                  ].includes(
                    currentStatus
                  ) && (

                    <div className="border-t border-gray-100 bg-slate-50/70 px-6 py-6">

                      <div className="flex items-end justify-between gap-4">

                        <div>

                          <p className="font-semibold text-gray-900">
                            Processing workflow
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Follow the current
                            processing stage.
                          </p>

                        </div>


                        <span className="text-2xl font-semibold tabular-nums text-gray-900">
                          {
                            processingProgress
                          }
                          %
                        </span>

                      </div>


                      {/* Bar */}
                      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-200">

                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            currentStatus ===
                            "COMPLETED"
                              ? "bg-green-600"
                              : "bg-blue-600"
                          }`}
                          style={{
                            width: `${processingProgress}%`,
                          }}
                        />

                      </div>


                      {/* Stages */}
                      <div className="mt-6 grid grid-cols-5 gap-2">

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

                            const completed =
                              currentStatus ===
                              "COMPLETED";

                            return (
                              <div
                                key={stage}
                                className="text-center"
                              >

                                <div
                                  className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full border ${
                                    completed &&
                                    reached
                                      ? "border-green-600 bg-green-600"
                                      : active
                                      ? "border-blue-600 bg-blue-600"
                                      : reached
                                      ? "border-gray-500 bg-gray-500"
                                      : "border-gray-300 bg-white"
                                  }`}
                                >
                                  {reached && (
                                    <div className="h-2 w-2 rounded-full bg-white" />
                                  )}
                                </div>


                                <p
                                  className={`mt-2 text-sm ${
                                    completed &&
                                    reached
                                      ? "font-medium text-green-700"
                                      : active
                                      ? "font-semibold text-blue-700"
                                      : reached
                                      ? "text-gray-600"
                                      : "text-gray-400"
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


                  {/* Failure */}
                  {currentStatus ===
                    "FAILED" && (

                    <div className="border-t border-red-100 bg-red-50 px-6 py-5">

                      <p className="font-semibold text-red-800">
                        Processing failed
                      </p>

                      <p className="mt-1 text-sm text-red-700">
                        {currentDetails?.error_message ??
                          "The audio could not be processed successfully."}
                      </p>

                    </div>

                  )}

                </section>
              )}


            {/* TRANSCRIPT */}
            {currentUploadId &&
              currentDetails?.transcript && (

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                  <div className="flex items-center justify-between gap-5 border-b border-gray-100 px-6 py-5">

                    <div>

                      <h2 className="text-xl font-semibold text-gray-900">
                        Transcript
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Generated from your
                        uploaded audio.
                      </p>

                    </div>


                    <Link
                      href={`/uploads/${currentUploadId}`}
                      className="shrink-0 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 font-medium text-blue-700 transition hover:bg-blue-100"
                    >
                      Read more →
                    </Link>

                  </div>


                  <div className="px-6 py-6">

                    <p className="whitespace-pre-wrap text-base leading-7 text-gray-600">
                      {createPreview(
                        currentDetails.transcript,
                        400
                      )}
                    </p>

                  </div>

                </section>
              )}


            {/* SUMMARY */}
            {currentUploadId &&
              currentDetails?.summary && (

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                  <div className="flex items-center justify-between gap-5 border-b border-gray-100 px-6 py-5">

                    <div>

                      <h2 className="text-xl font-semibold text-gray-900">
                        Summary
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Key points generated
                        from the transcript.
                      </p>

                    </div>


                    <Link
                      href={`/uploads/${currentUploadId}`}
                      className="shrink-0 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 font-medium text-blue-700 transition hover:bg-blue-100"
                    >
                      Read more →
                    </Link>

                  </div>


                  <div className="px-6 py-6">

                    <p className="whitespace-pre-wrap text-base leading-7 text-gray-600">
                      {createPreview(
                        currentDetails.summary,
                        330
                      )}
                    </p>

                  </div>

                </section>
              )}

          </div>


          {/* RECENT HISTORY */}
          <aside className="self-start lg:sticky lg:top-6">

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">


              {/* Header */}
              <div className="border-b border-gray-100 bg-gradient-to-br from-white to-blue-50/50 px-5 py-5">

                <div className="flex items-center gap-3">

                  <HistoryIllustration />


                  <div className="min-w-0 flex-1">

                    <div className="flex items-center justify-between gap-3">

                      <h2 className="text-lg font-semibold text-gray-900">
                        Recent uploads
                      </h2>


                      <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1 text-sm font-semibold text-blue-700">
                        {
                          recentUploads.length
                        }
                      </span>

                    </div>


                    <p className="mt-1 text-sm text-gray-500">
                      Latest 10 audio notes.
                    </p>

                  </div>

                </div>

              </div>


              {/* Items */}
              <div className="space-y-2.5 p-3.5">


                {historyLoading && (
                  <div className="rounded-xl bg-gray-50 px-4 py-5">

                    <p className="text-sm text-gray-500">
                      Loading recent uploads...
                    </p>

                  </div>
                )}


                {!historyLoading &&
                  historyError && (

                    <div className="rounded-xl bg-gray-50 px-4 py-5">

                      <p className="text-sm text-gray-500">
                        Recent uploads could
                        not be loaded.
                      </p>

                    </div>

                  )}


                {!historyLoading &&
                  !historyError &&
                  recentUploads.length ===
                    0 && (

                    <div className="rounded-xl bg-gray-50 px-4 py-7 text-center">

                      <p className="font-medium text-gray-800">
                        No uploads yet
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Recent audio notes
                        will appear here.
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
                        className="group block rounded-xl border border-gray-100 bg-white px-4 py-3.5 transition hover:border-blue-100 hover:bg-blue-50/30"
                      >

                        <div className="flex items-start justify-between gap-3">


                          <div className="min-w-0">

                            <p className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-700">
                              {
                                upload.filename
                              }
                            </p>


                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">

                              {upload.language_code && (
                                <span className="text-gray-500">
                                  {
                                    upload.language_code
                                  }
                                </span>
                              )}


                              {upload.created_at && (
                                <>
                                  <span className="text-gray-300">
                                    •
                                  </span>

                                  <span className="text-gray-400">
                                    {formatUploadDate(
                                      upload.created_at
                                    )}
                                  </span>
                                </>
                              )}

                            </div>

                          </div>


                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${statusStyle(
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


              {/* Full history */}
              <div className="border-t border-gray-100 px-4 py-4">

                <Link
                  href="/history"
                  className="flex items-center justify-between rounded-xl px-2 py-2 font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  <span>
                    View full history
                  </span>

                  <span aria-hidden="true">
                    →
                  </span>
                </Link>

              </div>

            </section>

          </aside>

        </div>

      </div>

    </main>
  );
}
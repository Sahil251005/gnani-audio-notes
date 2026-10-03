import type { ReactNode } from "react";


type SectionHeadingProps = {
  number: string;
  title: string;
  description?: string;
};


function SectionHeading({
  number,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
          {number}
        </span>

        <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
          {title}
        </h2>
      </div>

      {description && (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}


type FlowStepProps = {
  number: string;
  title: string;
  technology: string;
  children: ReactNode;
};


function FlowStep({
  number,
  title,
  technology,
  children,
}: FlowStepProps) {
  return (
    <div className="w-[150px] shrink-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-700">
          {number}
        </span>

        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {technology}
        </span>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-1.5 text-xs leading-5 text-slate-500">
        {children}
      </p>
    </div>
  );
}


function FlowArrow() {
  return (
    <div
      className="flex w-7 shrink-0 items-center justify-center text-slate-300"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
      >
        <path
          d="M5 12h13M14 7l5 5-5 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}


type ImprovementCardProps = {
  number: string;
  title: string;
  children: ReactNode;
};


function ImprovementCard({
  number,
  title,
  children,
}: ImprovementCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200">
      <div className="flex items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
          {number}
        </span>

        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {title}
          </h3>

          <div className="mt-2 text-sm leading-6 text-slate-600">
            {children}
          </div>
        </div>
      </div>
    </article>
  );
}


function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
      aria-hidden="true"
    >
      <path
        d="m5 10 3 3 7-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.29-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.17 1.18a10.95 10.95 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.71 5.4-5.29 5.69.42.36.79 1.07.79 2.16v3.2c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}


export default function ArchitecturePage() {
  return (
    <main className="min-h-screen bg-slate-50">

      {/* HERO */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">

          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-7 py-10 shadow-sm sm:px-10 sm:py-12">

            <div className="max-w-3xl">

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                Audio Notes
                <span className="h-1 w-1 rounded-full bg-blue-300" />
                Architecture
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                System Architecture
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                I built this project with a Next.js frontend and a
                FastAPI backend. The main idea was to keep the upload
                request short and move longer work like transcription
                and summarization into background processing.
              </p>

            </div>

          </div>

        </div>
      </section>


      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10 lg:px-8 lg:py-14">

        {/* 1. FLOW */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <SectionHeading
            number="1"
            title="Upload to Transcript Flow"
            description="This is the path an audio file follows from the frontend until the final transcript and summary are ready."
          />


          <div className="mt-6 space-y-4 text-[15px] leading-7 text-slate-600">

            <p>
              When a user selects an audio file and language, the
              Next.js frontend sends both to the FastAPI backend.
              FastAPI first checks that the file type and language
              are supported.
            </p>

            <p>
              If the request is valid, the original audio is uploaded
              to <strong className="font-semibold text-slate-800">
                Cloudflare R2
              </strong>. I then create a record in{" "}
              <strong className="font-semibold text-slate-800">
                PostgreSQL
              </strong>{" "}
              to store the upload details and processing state.
            </p>

            <p>
              After that, the upload is marked as{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm font-semibold text-slate-700">
                QUEUED
              </code>{" "}
              and FastAPI sends a Celery task through Redis. The API
              returns the upload ID instead of waiting for the full
              transcription to finish.
            </p>

            <p>
              The Celery worker generates a temporary presigned URL
              for the audio in R2 and uses it to create and start a{" "}
              <strong className="font-semibold text-slate-800">
                Gnani Batch STT
              </strong>{" "}
              job. The worker then checks the Gnani job status at
              intervals.
            </p>

            <p>
              Once transcription finishes, the worker retrieves the
              transcript and saves it in PostgreSQL. I save the
              transcript before starting summarization, so the
              transcription result is preserved even if the LLM step
              fails later. The saved transcript is then sent to the
              LLM, the summary is stored, and the upload is marked as{" "}
              <code className="rounded bg-green-50 px-1.5 py-0.5 text-sm font-semibold text-green-700">
                COMPLETED
              </code>.
            </p>

          </div>


          {/* COMPACT FLOW DIAGRAM */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <div className="flex items-center justify-between gap-4">

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Processing flow
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  From upload to completed audio note
                </p>
              </div>

              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Background after queueing
              </span>

            </div>


            <div className="mt-5 overflow-x-auto pb-2">

              <div className="flex min-w-max items-stretch">

                <FlowStep
                  number="1"
                  title="Select & Upload"
                  technology="Next.js"
                >
                  Audio file and language are sent to the API.
                </FlowStep>

                <FlowArrow />

                <FlowStep
                  number="2"
                  title="Validate & Store"
                  technology="FastAPI"
                >
                  Validate the request, store audio in R2 and create the database record.
                </FlowStep>

                <FlowArrow />

                <FlowStep
                  number="3"
                  title="Queue Task"
                  technology="Redis"
                >
                  Mark the upload as QUEUED and send the Celery task.
                </FlowStep>

                <FlowArrow />

                <FlowStep
                  number="4"
                  title="Transcribe"
                  technology="Gnani"
                >
                  Celery creates the Batch STT job using a presigned R2 URL.
                </FlowStep>

                <FlowArrow />

                <FlowStep
                  number="5"
                  title="Save Transcript"
                  technology="PostgreSQL"
                >
                  Retrieve and persist the completed transcript.
                </FlowStep>

                <FlowArrow />

                <FlowStep
                  number="6"
                  title="Generate Summary"
                  technology="LLM"
                >
                  Summarize the saved transcript and store the result.
                </FlowStep>

                <FlowArrow />

                <FlowStep
                  number="7"
                  title="Completed"
                  technology="Status"
                >
                  Transcript and summary are available to the frontend.
                </FlowStep>

              </div>

            </div>

          </div>

        </section>


        {/* 2. STORAGE */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <SectionHeading
            number="2"
            title="Where the Files and Data Live"
            description="I keep the original audio and application data separate because they serve different purposes."
          />


          <div className="mt-7 grid gap-5 md:grid-cols-2">

            {/* R2 */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M4 7c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M4 7v5c0 1.1 3.6 2 8 2s8-.9 8-2V7M4 12v5c0 1.1 3.6 2 8 2s8-.9 8-2v-5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                </svg>

              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                File Storage
              </p>

              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                Cloudflare R2
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                The original audio files are stored in R2 using
                unique object keys. Celery later creates a temporary
                presigned URL when Gnani needs access to the file.
              </p>

            </div>


            {/* POSTGRES */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <ellipse
                    cx="12"
                    cy="6"
                    rx="7"
                    ry="3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                </svg>

              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Application Data
              </p>

              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                PostgreSQL
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                PostgreSQL stores the filename, language, processing
                state, R2 key, Gnani job information, transcript,
                summary, timestamps and error details.
              </p>

            </div>

          </div>


          <div className="mt-5 rounded-xl border border-slate-200 bg-white px-5 py-4">

            <p className="text-sm leading-6 text-slate-600">
              I store the final transcript in PostgreSQL instead of
              depending on Gnani&apos;s transcript URL because that URL
              is temporary. This also allows previous uploads to be
              opened again from the History page.
            </p>

          </div>

        </section>


        {/* 3. LONG AUDIO */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <SectionHeading
            number="3"
            title="Handling Long Audio"
            description="Long transcription work is kept outside the original HTTP request."
          />


          <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">

            <div className="space-y-4 text-[15px] leading-7 text-slate-600">

              <p>
                For longer recordings, I use{" "}
                <strong className="font-semibold text-slate-800">
                  Gnani Batch STT
                </strong>{" "}
                instead of trying to finish the transcription inside
                the upload request.
              </p>

              <p>
                The audio is first stored in R2. The Celery worker
                then creates a temporary presigned HTTPS URL that
                Gnani can use to access the file.
              </p>

              <p>
                Gnani processes the audio asynchronously, while the
                worker checks the job status roughly every{" "}
                <strong className="font-semibold text-slate-800">
                  10 seconds
                </strong>{" "}
                until the job completes or fails.
              </p>

              <p>
                Because transcription runs in the background, the
                upload request does not need to stay open for the
                whole processing time. This is what allows the
                application to comfortably handle audio longer than
                two minutes.
              </p>

            </div>


            <aside className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">

              <p className="text-sm font-semibold text-blue-900">
                Why this works for long audio
              </p>

              <div className="mt-4 space-y-3">

                {[
                  "Original audio is stored before transcription starts.",
                  "Gnani receives a temporary R2 URL instead of the browser request.",
                  "Celery waits and polls outside the HTTP upload request.",
                  "The frontend only checks the application status.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex gap-2.5"
                  >
                    <CheckIcon />

                    <p className="text-sm leading-5 text-blue-950/70">
                      {item}
                    </p>
                  </div>
                ))}

              </div>

            </aside>

          </div>

        </section>


        {/* 4. SYNC VS BACKGROUND */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <SectionHeading
            number="4"
            title="Synchronous vs Background Processing"
            description="I split the workflow based on what must finish during the upload request and what can continue after the response."
          />


          <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200">

            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Difference between the two parts of the workflow
              </h3>
            </div>


            <div className="overflow-x-auto">

              <table className="w-full min-w-[760px] border-collapse text-left">

                <thead>
                  <tr className="border-b border-slate-200 bg-white">

                    <th className="w-[22%] px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Area
                    </th>

                    <th className="w-[39%] border-l border-slate-200 px-5 py-4">
                      <div className="flex items-center gap-2">

                        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />

                        <span className="text-sm font-semibold text-slate-900">
                          Synchronous
                        </span>

                      </div>
                    </th>

                    <th className="w-[39%] border-l border-slate-200 px-5 py-4">
                      <div className="flex items-center gap-2">

                        <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />

                        <span className="text-sm font-semibold text-slate-900">
                          Background
                        </span>

                      </div>
                    </th>

                  </tr>
                </thead>


                <tbody className="divide-y divide-slate-200 text-sm">

                  <tr>

                    <td className="bg-slate-50/70 px-5 py-4 font-medium text-slate-700">
                      When it runs
                    </td>

                    <td className="border-l border-slate-200 px-5 py-4 leading-6 text-slate-600">
                      Inside the original FastAPI upload request.
                    </td>

                    <td className="border-l border-slate-200 px-5 py-4 leading-6 text-slate-600">
                      After the job has been queued and the API has returned.
                    </td>

                  </tr>


                  <tr>

                    <td className="bg-slate-50/70 px-5 py-4 font-medium text-slate-700">
                      Main work
                    </td>

                    <td className="border-l border-slate-200 px-5 py-4 align-top">

                      <ul className="space-y-2 text-slate-600">
                        <li>Validate file and language</li>
                        <li>Upload audio to R2</li>
                        <li>Create PostgreSQL record</li>
                        <li>Set status to QUEUED</li>
                        <li>Send task through Redis</li>
                      </ul>

                    </td>

                    <td className="border-l border-slate-200 px-5 py-4 align-top">

                      <ul className="space-y-2 text-slate-600">
                        <li>Generate presigned R2 URL</li>
                        <li>Create and start Gnani job</li>
                        <li>Poll transcription status</li>
                        <li>Retrieve and save transcript</li>
                        <li>Generate and save LLM summary</li>
                        <li>Handle supported retries and final state</li>
                      </ul>

                    </td>

                  </tr>


                  <tr>

                    <td className="bg-slate-50/70 px-5 py-4 font-medium text-slate-700">
                      Result
                    </td>

                    <td className="border-l border-slate-200 px-5 py-4 leading-6 text-slate-600">
                      Returns the upload ID once the job has been queued.
                    </td>

                    <td className="border-l border-slate-200 px-5 py-4 leading-6 text-slate-600">
                      Continues processing independently and updates PostgreSQL as the job moves through each stage.
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>


          <p className="mt-4 text-sm leading-6 text-slate-500">
            This separation keeps the API responsive even when
            transcription takes more time.
          </p>

        </section>


        {/* 5. STATUS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <SectionHeading
            number="5"
            title="Processing Status and Failures"
            description="The frontend reads application state from FastAPI instead of communicating with Gnani directly."
          />


          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <p className="text-sm font-semibold text-slate-900">
              Main processing states
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">

              {[
                "QUEUED",
                "TRANSCRIBING",
                "SUMMARIZING",
                "COMPLETED",
              ].map((status, index, statuses) => (
                <div
                  key={status}
                  className="flex items-center gap-2"
                >

                  <span
                    className={
                      status === "COMPLETED"
                        ? "rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700"
                        : "rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                    }
                  >
                    {status}
                  </span>

                  {index < statuses.length - 1 && (
                    <span className="text-slate-300">
                      →
                    </span>
                  )}

                </div>
              ))}

            </div>

          </div>


          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <div className="rounded-xl border border-slate-200 p-5">

              <p className="text-sm font-semibold text-slate-900">
                Failure after a record exists
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                If queueing, transcription, transcript retrieval or
                summarization fails, the upload can be marked as{" "}
                <code className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                  FAILED
                </code>{" "}
                and the error code and readable message are stored in
                PostgreSQL.
              </p>

            </div>


            <div className="rounded-xl border border-slate-200 p-5">

              <p className="text-sm font-semibold text-slate-900">
                Failure before the record is created
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                If the initial R2 upload or database creation cannot
                complete, FastAPI returns an error directly instead of
                starting the background pipeline.
              </p>

            </div>

          </div>


          <p className="mt-5 text-sm leading-6 text-slate-500">
            For stored failures, the saved error information means the
            user can still see what happened after refreshing or
            reopening the upload from History.
          </p>

        </section>


        {/* 6. IMPROVEMENTS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <SectionHeading
            number="6"
            title="What I Would Improve With More Time"
            description="These are the next areas I would improve without changing the main architecture that is already working."
          />


          <div className="mt-7 grid gap-4 md:grid-cols-2">

            <ImprovementCard
              number="01"
              title="Better Monitoring"
            >
              <p>
                I would add structured logs and metrics around each
                upload so I can follow a job across the complete
                pipeline.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Upload ID",
                  "Gnani job ID",
                  "Current stage",
                  "Processing time",
                  "Error type",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <p className="mt-4">
                This would make it easier to find where a job failed
                and which stage is taking the most time.
              </p>
            </ImprovementCard>


            <ImprovementCard
              number="02"
              title="Rate Limiting and Upload Protection"
            >
              <p>
                Since every upload can use R2 storage, Gnani,
                Celery workers and the LLM, I would add stronger
                protection around public usage.
              </p>

              <ul className="mt-4 space-y-2">
                {[
                  "Maximum upload size",
                  "Request rate limiting",
                  "Per-user or per-IP limits",
                  "Stronger validation before expensive processing",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex gap-2"
                  >
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </ImprovementCard>


            <ImprovementCard
              number="03"
              title="Cancellation and File Lifecycle"
            >
              <p>
                I would allow users to cancel uploads while they are
                still QUEUED or TRANSCRIBING, so unnecessary
                background work does not continue.
              </p>

              <p className="mt-4">
                I would also add a retention policy for R2. For
                example, original audio could be removed after a fixed
                period while keeping the transcript and summary in
                PostgreSQL.
              </p>
            </ImprovementCard>


            <ImprovementCard
              number="04"
              title="Better Transcript Reading Experience"
            >
              <p>
                I would improve how users work with the result after
                processing, especially for longer recordings.
              </p>

              <ul className="mt-4 space-y-2">
                {[
                  "Transcript and summary shown clearly together",
                  "Search inside long transcripts",
                  "Highlighted search matches",
                  "Copy and transcript download actions",
                  "Better navigation and mobile readability",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex gap-2"
                  >
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </ImprovementCard>

          </div>

        </section>


        {/* 7. GITHUB */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <GitHubIcon />
              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Source Code
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                  GitHub Repository
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  The complete source code for this project is
                  available in the repository below.
                </p>

                <p className="mt-2 break-all text-sm text-slate-500">
                  github.com/Sahil251005/gnani-audio-notes
                </p>

              </div>

            </div>


            <a
              href="https://github.com/Sahil251005/gnani-audio-notes"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View Repository

              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M7 17 17 7M9 7h8v8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>

          </div>

        </section>

      </div>

    </main>
  );
}
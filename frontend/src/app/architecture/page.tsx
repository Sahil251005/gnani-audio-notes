export default function ArchitecturePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">
          System Architecture
        </h1>

        <div className="mt-8 space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              Upload to Transcript Flow
            </h2>

            <p className="mt-2 leading-7">
              The Next.js frontend sends the selected audio file
              and language code to the FastAPI backend. FastAPI
              validates the request, uploads the original audio to
              Cloudflare R2, creates an upload record in PostgreSQL,
              and queues a Celery background task through Redis.
              The Celery worker then generates a temporary presigned
              URL for the stored audio and submits that URL to Gnani
              Batch STT. The worker starts the Gnani job and polls its
              status until processing finishes. After a successful
              transcription, the worker retrieves the transcript from
              Gnani and stores the full transcript permanently in
              PostgreSQL. The saved transcript is then sent to the LLM
              for summarization, and the generated summary is also
              stored in PostgreSQL.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              File and Data Storage
            </h2>

            <p className="mt-2 leading-7">
              Original audio files are stored in Cloudflare R2 using
              unique object keys. PostgreSQL stores the application
              record for each upload, including the filename,
              language, processing status, R2 storage key, Gnani job
              information, transcript, summary, timestamps, and error
              information. The transcript is stored in PostgreSQL
              instead of depending on Gnani&apos;s temporary
              transcript URL.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              Long Audio Handling
            </h2>

            <p className="mt-2 leading-7">
              Long prerecorded audio is processed with Gnani Batch
              STT. The audio is first stored in Cloudflare R2, and the
              worker generates a temporary presigned HTTPS URL that
              Gnani can access. Gnani processes the audio
              asynchronously while the Celery worker checks the job
              status at intervals. This keeps long transcription work
              outside the original upload request and supports audio
              longer than two minutes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              Synchronous and Background Work
            </h2>

            <p className="mt-2 leading-7">
              During the synchronous upload request, FastAPI validates
              the file and language, uploads the audio to R2, creates
              the PostgreSQL record, marks the upload as queued, and
              sends the processing task to Redis. The request then
              returns the upload ID to the frontend.
            </p>

            <p className="mt-3 leading-7">
              The Celery worker handles the long-running work in the
              background: generating the presigned audio URL, creating
              and starting the Gnani Batch job, polling Gnani,
              retrieving the transcript, persisting the transcript,
              generating the LLM summary, retrying supported transient
              failures, and updating the final database state.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              What I Would Improve With More Time
            </h2>

            <p className="mt-2 leading-7">
              I would add automatic cleanup for R2 objects if an upload
              reaches storage but the database record cannot be
              created, add stronger production monitoring for worker
              and external API failures, add automated end-to-end
              tests for the complete deployed workflow, and add
              pagination as upload history grows.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              Source Code
            </h2>

            <p className="mt-2">
              <a
                href="https://github.com/Sahil251005/gnani-audio-notes"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                View GitHub repository
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
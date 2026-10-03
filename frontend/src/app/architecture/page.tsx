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
                System Flow
              </h2>
  
              <p className="mt-2">
                The Next.js frontend uploads audio to the
                FastAPI backend. FastAPI validates the request,
                stores the original audio in Cloudflare R2,
                creates a PostgreSQL record, and queues
                background processing through Redis and Celery.
              </p>
            </section>
  
  
            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Long Audio Processing
              </h2>
  
              <p className="mt-2">
                Long audio is processed using Gnani Batch STT.
                The Celery worker creates a temporary presigned
                R2 URL, creates and starts a Gnani Batch job,
                then polls its status until processing finishes.
              </p>
            </section>
  
  
            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Transcript and Summary
              </h2>
  
              <p className="mt-2">
                When transcription completes, the worker fetches
                the transcript from Gnani and stores the full text
                permanently in PostgreSQL. The transcript is then
                sent to an LLM for summarization, and the summary
                is also stored in PostgreSQL.
              </p>
            </section>
  
  
            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Background Processing
              </h2>
  
              <p className="mt-2">
                Upload validation, storage, database record
                creation, and job queueing happen during the
                request. Gnani transcription, polling, transcript
                retrieval, summarization, retries, and final
                database updates run in Celery background jobs.
              </p>
            </section>
  
  
            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Progress and Failures
              </h2>
  
              <p className="mt-2">
                The frontend polls FastAPI and displays real
                application states: QUEUED, TRANSCRIBING,
                SUMMARIZING, COMPLETED, or FAILED. Errors are
                stored in PostgreSQL and shown as understandable
                messages instead of exposing internal exceptions.
              </p>
            </section>
  
  
            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Storage
              </h2>
  
              <p className="mt-2">
                Original audio files are stored in Cloudflare R2.
                PostgreSQL stores metadata, processing state,
                Gnani job information, transcript, summary,
                timestamps, and error information.
              </p>
            </section>
  
  
            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Improvements With More Time
              </h2>
  
              <p className="mt-2">
                I would add database migrations, stronger object
                cleanup, richer monitoring, pagination, improved
                retry controls, and additional frontend polish.
              </p>
            </section>
  
  
            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Source Code
              </h2>
  
              <a
                href="https://github.com/Sahil251005"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-blue-600 underline"
              >
                View GitHub repository
              </a>
            </section>
  
          </div>
        </div>
      </main>
    );
  }
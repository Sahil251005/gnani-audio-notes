"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getUploads } from "@/lib/api";


type Upload = {
  id: string;
  filename: string;
  language_code: string;
  status: string;
  created_at: string;
};


export default function HistoryPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    async function loadUploads() {
      try {
        const data = await getUploads();
        setUploads(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load upload history."
        );
      } finally {
        setLoading(false);
      }
    }

    loadUploads();
  }, []);


  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-12">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Upload History
          </h1>

          <Link
            href="/"
            className="text-sm font-medium text-blue-600"
          >
            New upload
          </Link>
        </div>


        {loading && (
          <p className="mt-8 text-gray-600">
            Loading uploads...
          </p>
        )}


        {error && (
          <div className="mt-8 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}


        {!loading && !error && uploads.length === 0 && (
          <p className="mt-8 text-gray-600">
            No uploads yet.
          </p>
        )}


        <div className="mt-8 space-y-4">
          {uploads.map((upload) => (
            <Link
              key={upload.id}
              href={`/uploads/${upload.id}`}
              className="block rounded-xl bg-white p-5 shadow-sm
                         transition hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-4">

                <div>
                  <p className="font-medium text-gray-900">
                    {upload.filename}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {upload.language_code}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {new Date(
                      upload.created_at
                    ).toLocaleString()}
                  </p>
                </div>


                <span className="rounded-full bg-gray-100 px-3 py-1
                                 text-sm font-medium text-gray-700">
                  {upload.status}
                </span>

              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
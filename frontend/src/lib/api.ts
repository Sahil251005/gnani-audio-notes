const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is not configured"
  );
}


export function uploadAudio(
  file: File,
  languageCode: string,
  onProgress?: (progress: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("language_code", languageCode);

    const request = new XMLHttpRequest();

    request.open(
      "POST",
      `${API_BASE_URL}/uploads`
    );

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round(
          (event.loaded / event.total) * 100
        );

        onProgress(progress);
      }
    };

    request.onload = () => {
      let data;

      try {
        data = JSON.parse(request.responseText);
      } catch {
        reject(new Error("Invalid server response."));
        return;
      }

      if (
        request.status >= 200 &&
        request.status < 300
      ) {
        resolve(data);
      } else {
        reject(
          new Error(
            data.detail || "Upload failed."
          )
        );
      }
    };

    request.onerror = () => {
      reject(
        new Error(
          "Could not connect to the server."
        )
      );
    };

    request.send(formData);
  });
}


export async function getUploads() {
  const response = await fetch(
    `${API_BASE_URL}/uploads`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Could not load uploads");
  }

  return response.json();
}


export async function getUpload(id: string) {
  const response = await fetch(
    `${API_BASE_URL}/uploads/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Could not load upload");
  }

  return response.json();
}


export async function getUploadStatus(
  id: string
) {
  const response = await fetch(
    `${API_BASE_URL}/uploads/${id}/status`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Could not load processing status"
    );
  }

  return response.json();
}
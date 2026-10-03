const STAGES = [
    "UPLOADED",
    "QUEUED",
    "TRANSCRIBING",
    "SUMMARIZING",
    "COMPLETED",
  ];
  
  const LABELS = [
    "Uploaded",
    "Queued",
    "Transcribing",
    "Summarizing",
    "Completed",
  ];
  
  type Props = {
    status: string;
  };
  
  export default function ProcessingProgress({
    status,
  }: Props) {
    if (status === "FAILED") {
      return (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          Processing failed
        </div>
      );
    }
  
    if (status === "CANCELLED") {
      return (
        <div className="mt-6 rounded-lg bg-gray-100 p-4 text-gray-700">
          Processing cancelled
        </div>
      );
    }
  
    const currentIndex = STAGES.indexOf(status);
  
    return (
      <div className="mt-6">
        <div className="flex gap-2">
          {STAGES.map((stage, index) => {
            const reached = index <= currentIndex;
  
            return (
              <div
                key={stage}
                className={`h-2 flex-1 rounded-full ${
                  reached
                    ? "bg-black"
                    : "bg-gray-200"
                }`}
              />
            );
          })}
        </div>
  
        <div className="mt-3 flex justify-between text-xs text-gray-600">
          {LABELS.map((label, index) => (
            <span
              key={label}
              className={
                index <= currentIndex
                  ? "font-semibold text-gray-900"
                  : ""
              }
            >
              {label}
            </span>
          ))}
        </div>
  
        <p className="mt-4 text-sm font-medium text-gray-700">
          Current stage:{" "}
          {LABELS[currentIndex] ?? status}
        </p>
      </div>
    );
  }
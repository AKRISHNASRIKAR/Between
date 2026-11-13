/** Web has no native file-system share sheet; download the same archive as JSON. */
export async function shareExport(data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `between-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    // Give the browser time to begin consuming the Blob before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/** Let the browser stream the attachment directly instead of buffering a multi-photo Blob. */
export async function shareArchive(url: string, _cookie: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = `between-export-${new Date().toISOString().slice(0, 10)}.tar`;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
  }
}

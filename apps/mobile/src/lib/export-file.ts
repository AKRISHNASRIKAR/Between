import { Directory, File, Paths } from "expo-file-system";
import { Platform, Share } from "react-native";

/** Hand a JSON archive to the native share sheet. */
export async function shareExport(data: unknown) {
  const file = new File(Paths.cache, `between-export-${new Date().toISOString().slice(0, 10)}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(data, null, 2));
  await Share.share({ url: file.uri, title: "Between export" });
}

/** Native download writes the streamed archive to disk without buffering all photos in JS memory. */
export async function shareArchive(url: string, cookie: string) {
  const destination = Platform.OS === "android" ? await Directory.pickDirectoryAsync() : null;
  const file = new File(Paths.cache, `between-export-${Date.now()}.tar`);
  try {
    const downloaded = await File.downloadFileAsync(url, file, { headers: cookie ? { Cookie: cookie } : undefined });
    if (destination) {
      downloaded.copy(new File(destination, downloaded.name));
      downloaded.delete();
    } else {
      await Share.share({ url: downloaded.uri, title: "Between export" });
    }
  } catch (error) {
    // Never leave a failed/incomplete archive looking like a usable backup.
    if (file.exists) file.delete();
    throw error;
  }
}

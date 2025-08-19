import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadImageAndGetUrl(
  file: File,
  path: string
): Promise<string> {
  const r = ref(storage, path);
  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(r, file);
    task.on(
      "state_changed",
      () => void 0,
      reject,
      () => resolve()
    );
  });
  return await getDownloadURL(r);
}

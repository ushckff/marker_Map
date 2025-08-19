export async function loadYMaps3(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.ymaps3) return;

  const apiKey = import.meta.env.VITE_YMAPS_API_KEY;
  if (!apiKey) {
    console.warn("VITE_YMAPS_API_KEY is not set");
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=ru_RU`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Yandex Maps v3 script"));
    document.head.appendChild(s);
  });
}

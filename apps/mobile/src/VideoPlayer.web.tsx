/** YouTube player in the browser preview: a plain iframe. */
export function VideoPlayer({ url }: { url: string }) {
  return <iframe src={url} title="Video" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen style={{ border: 0, width: "100%", height: "100%" }} />;
}

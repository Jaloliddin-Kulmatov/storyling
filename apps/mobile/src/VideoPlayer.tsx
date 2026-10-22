import { WebView } from "react-native-webview";

/** YouTube player inside the app (phones). */
export function VideoPlayer({ url }: { url: string }) {
  return <WebView source={{ uri: url }} allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} allowsFullscreenVideo style={{ flex: 1, backgroundColor: "#000" }} />;
}

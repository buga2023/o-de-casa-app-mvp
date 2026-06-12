/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // o badge "Static route" do dev fica sobre a bottom nav (e intercepta cliques no E2E)
  devIndicators: { appIsrStatus: false },
};
export default nextConfig;

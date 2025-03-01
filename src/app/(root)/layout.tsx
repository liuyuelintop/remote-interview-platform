import StreamClientProvider from "@/components/providers/StreamClientProvider";

// only need use StreamClient in root, so wrap child components in root/layout components
function Layout({ children }: { children: React.ReactNode }) {
  return <StreamClientProvider>{children}</StreamClientProvider>;
}
export default Layout;

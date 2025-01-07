import {ChatInterfaceComponent} from "@/components/chat-interface";
import {Metadata} from "next";
export const metadata: Metadata = {
  title: 'Wiki Chat',
};
export default function Page() {
  return <ChatInterfaceComponent />
}
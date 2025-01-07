import { ChatInterfaceComponent } from "@/components/chat-interface"
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'General Chat',
  description:
      'Chatbot AI from VTS',
};

export default function Page() {
  return <ChatInterfaceComponent />
}
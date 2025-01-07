import {LoginPageComponent} from "@/components/login-page";
import {Metadata} from "next";
export const metadata: Metadata = {
  title: 'Login to VTS AI Assistant',
  description:
      'Chatbot AI from VTS',
};
export default function Page() {
  return <LoginPageComponent />
}
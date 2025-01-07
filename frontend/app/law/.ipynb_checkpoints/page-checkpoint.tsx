import {Law} from "@/components/law";
import {Metadata} from "next";
export const metadata: Metadata = {
  title: 'Law Chat',
};
export default function Page() {
  return <Law />
}
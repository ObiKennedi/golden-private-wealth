import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import { FullscreenLoader } from "@/components/essentials/FullscreenLoader";

export default function Page() {
    return (
        <Suspense fallback={<FullscreenLoader />}>
            <LoginForm />
        </Suspense>
    );
}
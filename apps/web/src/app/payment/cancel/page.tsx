"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">
            결제가 취소되었습니다
          </h1>
          <p className="text-muted-foreground">
            결제가 취소되었습니다. 언제든지 다시 시도하실 수 있습니다.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <button
            onClick={() => router.push("/#pricing")}
            className="btn-primary w-full"
          >
            요금제 다시 보기
          </button>
          <button
            onClick={() => router.push("/")}
            className="btn-ghost w-full"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

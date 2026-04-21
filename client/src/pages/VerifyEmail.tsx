// src/pages/VerifyEmail.tsx
import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  // ✅ Add ref to prevent duplicate verification attempts
  const hasAttemptedVerification = useRef(false);
  const verificationInProgress = useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");

    // ✅ Prevent verification if no token
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    // ✅ Prevent duplicate verification attempts
    if (hasAttemptedVerification.current || verificationInProgress.current) {
      console.log(
        "⏭️ Verification already attempted, skipping duplicate request...",
      );
      return;
    }

    const verifyEmail = async () => {
      verificationInProgress.current = true;
      hasAttemptedVerification.current = true;

      console.log(
        "📧 Starting email verification with token:",
        token.substring(0, 20) + "...",
      );

      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/verify-email",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          },
        );

        const data = await response.json();
        console.log("📧 Verification response:", data);

        if (data.success) {
          setStatus("success");
          setMessage(data.message);

          // Auto redirect to login after 3 seconds
          setTimeout(() => {
            window.location.href = "/";
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      } catch (error) {
        console.error("❌ Verification error:", error);

        // Only show error if we haven't already succeeded
        setStatus("error");
        setMessage("Failed to verify email. Please try again.");
      } finally {
        verificationInProgress.current = false;
      }
    };

    verifyEmail();
  }, [searchParams]); // ✅ Only re-run if searchParams changes

  // ✅ Handle case where email is already verified (status from backend)
  const isAlreadyVerified = message.toLowerCase().includes("already verified");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Verifying your email...
            </h2>
            <p className="text-gray-500 mt-2">Please wait a moment</p>
            <p className="text-xs text-gray-400 mt-4">
              This may take a few seconds...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-semibold text-green-600">
              {isAlreadyVerified
                ? "Email Already Verified!"
                : "Email Verified!"}
            </h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to login in 3 seconds...
            </p>
            <Link
              to="/"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login Now
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-red-600">
              Verification Failed
            </h2>
            <p className="text-gray-600 mt-2">{message}</p>

            {/* Show helpful suggestions based on error */}
            {message.includes("expired") && (
              <p className="text-sm text-gray-500 mt-4">
                Please request a new verification email from the login page.
              </p>
            )}

            {message.includes("already verified") && (
              <p className="text-sm text-gray-500 mt-4">
                Your email is already verified. You can log in now.
              </p>
            )}

            <div className="flex gap-3 justify-center mt-6">
              <Link
                to="/"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </Link>
              <Link
                to="/"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Back to Home
              </Link>
            </div>

            {/* Option to resend verification */}
            {message.includes("expired") && (
              <Link
                to="/resend-verification"
                className="block mt-4 text-sm text-blue-600 hover:underline"
              >
                Resend verification email
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}

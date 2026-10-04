"use client";

import {
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

export default function RequestDevicePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(
      "/employee/assets?request=1"
    );
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f8fc",
        color: "#64748b",
        fontFamily: "Arial, sans-serif",
      }}
    >
      Opening device request...
    </div>
  );
}
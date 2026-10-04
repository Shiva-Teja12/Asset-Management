"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";

import Side from "../../../../components/Side";
import { api } from "../../../../lib/api";

type Asset = {
  id: number | string;
  assetTag?: string;
  name?: string;
};

function getArray<T>(response: any): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.content)) {
    return response.content;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

export default function RaiseTicketPage() {
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);

  const [type, setType] = useState("ISSUE");
  const [assetId, setAssetId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadAssets() {
      try {
        const response = await api(
          "/api/v1/employees/me/assets"
        );

        setAssets(getArray<Asset>(response));
      } catch (err) {
        console.error(
          "Unable to load employee assets:",
          err
        );
      }
    }

    void loadAssets();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    try {
      setSubmitting(true);

      await api("/api/v1/tickets", {
        method: "POST",
        body: JSON.stringify({
          type,
          assetId: assetId
            ? Number(assetId)
            : null,
          subject: subject.trim(),
          description: description.trim(),
        }),
      });

      setSuccess("Ticket submitted successfully.");

      setTimeout(() => {
        router.push("/employee/tickets");
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit ticket."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.shell}>
      <Side role="employee" />

      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            Raise Ticket
          </h1>

          <p style={styles.subtitle}>
            Submit an asset issue, new asset request,
            replacement request or return request.
          </p>
        </div>

        <section style={styles.panel}>
          <div style={styles.panelHeading}>
            <h2 style={styles.panelTitle}>
              Asset Request
            </h2>

            <p style={styles.panelSubtitle}>
              Fill in the information below and submit
              your request to the Asset Admin.
            </p>
          </div>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {success && (
            <div style={styles.success}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>
                Request Type *
              </label>

              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
                style={styles.input}
              >
                <option value="ISSUE">
                  Report Asset Issue
                </option>

                <option value="NEW_ASSET">
                  Request New Asset
                </option>

                <option value="REPLACEMENT">
                  Request Replacement
                </option>

                <option value="RETURN">
                  Return Asset
                </option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Related Asset
              </label>

              <select
                value={assetId}
                onChange={(event) =>
                  setAssetId(event.target.value)
                }
                style={styles.input}
              >
                <option value="">
                  No related asset
                </option>

                {assets.map((asset) => (
                  <option
                    key={asset.id}
                    value={asset.id}
                  >
                    {asset.assetTag || "Asset"} -{" "}
                    {asset.name || "Company Asset"}
                  </option>
                ))}
              </select>

              <div style={styles.help}>
                For a new asset request, you can leave
                this empty.
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Subject *
              </label>

              <input
                type="text"
                value={subject}
                onChange={(event) =>
                  setSubject(event.target.value)
                }
                placeholder="Example: Laptop screen is not working"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Description *
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe your issue or request in detail..."
                rows={7}
                style={{
                  ...styles.input,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={styles.actions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() =>
                  router.push("/employee")
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...styles.submitButton,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Ticket"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f5f8fc",
  },

  main: {
    flex: 1,
    minWidth: 0,
    padding: "36px 40px",
  },

  header: {
    marginBottom: "25px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    color: "#10243a",
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#7c8b9c",
    fontSize: "14px",
  },

  panel: {
    width: "100%",
    maxWidth: "760px",
    boxSizing: "border-box",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "28px",
  },

  panelHeading: {
    marginBottom: "22px",
  },

  panelTitle: {
    margin: 0,
    color: "#10243a",
    fontSize: "21px",
  },

  panelSubtitle: {
    color: "#8996a5",
    fontSize: "13px",
    margin: "6px 0 0",
  },

  field: {
    marginBottom: "19px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#34495e",
    fontSize: "13px",
    fontWeight: 700,
  },

  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #dce3eb",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#25384c",
    fontSize: "14px",
    outline: "none",
  },

  help: {
    marginTop: "6px",
    color: "#8996a5",
    fontSize: "11px",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    paddingTop: "8px",
  },

  cancelButton: {
    padding: "11px 19px",
    backgroundColor: "#ffffff",
    color: "#405367",
    border: "1px solid #dce3eb",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },

  submitButton: {
    padding: "11px 21px",
    backgroundColor: "#1473e6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
  },

  error: {
    marginBottom: "18px",
    padding: "12px 14px",
    backgroundColor: "#fff0f0",
    border: "1px solid #ffcaca",
    color: "#b42318",
    borderRadius: "8px",
  },

  success: {
    marginBottom: "18px",
    padding: "12px 14px",
    backgroundColor: "#eaf8f0",
    border: "1px solid #b9e8ce",
    color: "#18794e",
    borderRadius: "8px",
  },
};
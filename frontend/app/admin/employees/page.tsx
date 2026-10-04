"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { CSSProperties } from "react";

import Side from "@/components/Side";
import { api } from "@/lib/api";

type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  department?: string | null;
};

export default function AdminEmployeesPage() {
  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    void loadEmployees();
  }, []);

  async function loadEmployees() {
    setLoading(true);
    setError("");

    try {
      const data =
        await api("/api/v1/employees");

      setEmployees(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
          ? data.content
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load employees."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredEmployees =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return employees;
      }

      return employees.filter((employee) => {
        return (
          employee.name
            ?.toLowerCase()
            .includes(query) ||
          employee.email
            ?.toLowerCase()
            .includes(query) ||
          employee.employeeCode
            ?.toLowerCase()
            .includes(query) ||
          employee.department
            ?.toLowerCase()
            .includes(query)
        );
      });
    }, [employees, search]);

  const departmentCount =
    useMemo(() => {
      const departments = new Set(
        employees
          .map((employee) =>
            employee.department?.trim()
          )
          .filter(
            (department): department is string =>
              Boolean(department)
          )
      );

      return departments.size;
    }, [employees]);

  function getInitial(name: string) {
    if (!name) {
      return "?";
    }

    return name
      .trim()
      .charAt(0)
      .toUpperCase();
  }

  return (
    <div style={styles.shell}>
      <Side role="admin" />

      <main style={styles.main}>
        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Employees
            </h1>

            <p style={styles.subtitle}>
              View registered employees and their
              department information
            </p>
          </div>

          <button
            type="button"
            style={styles.refreshButton}
            onClick={() =>
              void loadEmployees()
            }
          >
            Refresh
          </button>
        </div>

        {/* SUMMARY */}

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              Total Employees
            </div>

            <div style={styles.statValue}>
              {employees.length}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              Departments
            </div>

            <div style={styles.statValue}>
              {departmentCount}
            </div>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}

        {/* EMPLOYEE DIRECTORY */}

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>
                Employee Directory
              </h2>

              <p style={styles.panelSubtitle}>
                Registered employees
              </p>
            </div>

            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              style={styles.searchInput}
            />
          </div>

          {loading ? (
            <div style={styles.emptyState}>
              Loading employees...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div style={styles.emptyState}>
              No employees found.
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      Code
                    </th>

                    <th style={styles.th}>
                      Employee
                    </th>

                    <th style={styles.th}>
                      Email
                    </th>

                    <th style={styles.th}>
                      Department
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.map(
                    (employee) => (
                      <EmployeeRow
                        key={employee.id}
                        employee={employee}
                        getInitial={getInitial}
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

type EmployeeRowProps = {
  employee: Employee;

  getInitial: (
    name: string
  ) => string;
};

function EmployeeRow({
  employee,
  getInitial,
}: EmployeeRowProps) {
  return (
    <tr>
      <td style={styles.td}>
        <strong>
          {employee.employeeCode}
        </strong>
      </td>

      <td style={styles.td}>
        <div style={styles.employeeCell}>
          <div style={styles.avatar}>
            {getInitial(employee.name)}
          </div>

          <strong>
            {employee.name}
          </strong>
        </div>
      </td>

      <td style={styles.td}>
        {employee.email}
      </td>

      <td style={styles.td}>
        {employee.department ? (
          <span
            style={styles.departmentBadge}
          >
            {employee.department}
          </span>
        ) : (
          <span
            style={styles.unassignedBadge}
          >
            Not Assigned
          </span>
        )}
      </td>
    </tr>
  );
}

const styles: Record<
  string,
  CSSProperties
> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f4f7fb",
  },

  main: {
    flex: 1,
    minWidth: 0,
    padding: "32px 32px 60px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "28px",
  },

  title: {
    margin: 0,
    color: "#0b2239",
    fontSize: "34px",
    fontWeight: 800,
  },

  subtitle: {
    margin: "5px 0 0",
    color: "#718096",
    fontSize: "15px",
  },

  refreshButton: {
    border: "none",
    borderRadius: "9px",
    padding: "11px 19px",
    background: "#1677e8",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(200px, 280px))",
    gap: "18px",
    marginBottom: "24px",
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #dce5ef",
    borderRadius: "14px",
    padding: "20px",
    minHeight: "102px",
  },

  statLabel: {
    color: "#718096",
    fontSize: "14px",
    marginBottom: "8px",
  },

  statValue: {
    color: "#0b2239",
    fontSize: "29px",
    fontWeight: 800,
  },

  errorMessage: {
    background: "#fff1f1",
    border: "1px solid #f2c5c5",
    color: "#b42318",
    borderRadius: "10px",
    padding: "13px 16px",
    marginBottom: "18px",
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #dce5ef",
    borderRadius: "14px",
    overflow: "hidden",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "20px 24px",
  },

  panelTitle: {
    margin: 0,
    color: "#0b2239",
    fontSize: "20px",
    fontWeight: 800,
  },

  panelSubtitle: {
    margin: "4px 0 0",
    color: "#7a8ca1",
    fontSize: "14px",
  },

  searchInput: {
    width: "280px",
    boxSizing: "border-box",
    border: "1px solid #d5dfeb",
    borderRadius: "9px",
    padding: "11px 14px",
    fontSize: "14px",
    outline: "none",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "14px 18px",
    background: "#f7f9fc",
    borderTop: "1px solid #e5ebf2",
    borderBottom: "1px solid #e5ebf2",
    color: "#60738a",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  td: {
    padding: "16px 18px",
    borderBottom: "1px solid #edf1f5",
    color: "#22384d",
    fontSize: "14px",
    verticalAlign: "middle",
  },

  employeeCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#e8f1ff",
    color: "#1677e8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 800,
  },

  departmentBadge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "20px",
    background: "#e8f8ef",
    color: "#16834b",
    fontSize: "12px",
    fontWeight: 700,
  },

  unassignedBadge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "20px",
    background: "#edf2f8",
    color: "#60738a",
    fontSize: "12px",
  },

  emptyState: {
    padding: "50px 20px",
    textAlign: "center",
    color: "#7b8da1",
  },
};
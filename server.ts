import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_API_UPSTREAM = "https://dynamicpricing-api.dynamicpricingbuilder.com";

/** Remote API origin (no trailing slash). Used when proxying /api — see USE_LOCAL_API_MOCK. */
const API_UPSTREAM_BASE = (
  process.env.API_BASE_URL ??
  process.env.VITE_API_BASE_URL ??
  DEFAULT_API_UPSTREAM
)
  .trim()
  .replace(/\/+$/, "");

/** Set to "true" to use built-in mock responses instead of forwarding to API_UPSTREAM_BASE. */
const USE_LOCAL_API_MOCK = process.env.USE_LOCAL_API_MOCK === "true";

function forwardClientHeaders(req: express.Request): Headers {
  const skip = new Set([
    "host",
    "connection",
    "content-length",
    "transfer-encoding",
  ]);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value || skip.has(key.toLowerCase())) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  return headers;
}

async function proxyApiToUpstream(req: express.Request, res: express.Response) {
  const targetUrl = `${API_UPSTREAM_BASE}${req.originalUrl}`;
  try {
    const headers = forwardClientHeaders(req);
    const init: RequestInit = { method: req.method, headers };

    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.body !== undefined && req.body !== null) {
        init.body =
          typeof req.body === "string" ? req.body : JSON.stringify(req.body);
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json");
        }
      }
    }

    const upstream = await fetch(targetUrl, init);
    const body = Buffer.from(await upstream.arrayBuffer());
    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("content-type", ct);
    res.status(upstream.status).send(body);
  } catch (err) {
    console.error(`Upstream proxy failed (${targetUrl}):`, err);
    res.status(502).json({
      error: "Bad Gateway",
      message: "Could not reach reconciliation API upstream.",
    });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  if (!USE_LOCAL_API_MOCK) {
    app.use("/api", (req, res) => proxyApiToUpstream(req, res));
    console.log(`API requests proxied to ${API_UPSTREAM_BASE}`);
  } else {
    console.log("Using local API mocks (USE_LOCAL_API_MOCK=true)");

    // Admin Credentials & Rotation Logic
    let currentAdminPassword = "VJbcdRcXq2BDFN0YkoHm";
    const adminUsername = "mmuaz9193lgu@gmail.com";
    let lastRotationTime = Date.now();

    const sendRotationEmail = (newPassword: string) => {
      console.log("------------------------------------------");
      console.log(`SENDING EMAIL TO: ${adminUsername}`);
      console.log("SUBJECT: Security Alert: Your Admin Password Has Been Rotated");
      console.log("BODY:");
      console.log(`Hello,\n\nYour security policy requires a password change every 24 hours. Your new access credentials for the Kiwiticketing Reconciliation Portal are:\n\nUsername: ${adminUsername}\nNew Password: ${newPassword}\n\nThis password will expire in 24 hours.\n\nRegards,\nSecurity System`);
      console.log("------------------------------------------");
    };

    const checkPasswordRotation = () => {
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (Date.now() - lastRotationTime > twentyFourHours) {
        const newPass =
          Math.random().toString(36).substring(2, 10) +
          Math.random().toString(36).substring(2, 10).toUpperCase();
        currentAdminPassword = newPass;
        lastRotationTime = Date.now();
        sendRotationEmail(newPass);
      }
    };

    app.post("/api/admin/login", (req: any, res: any) => {
      checkPasswordRotation();
      const { username, password } = req.body;

      if (username === adminUsername && password === currentAdminPassword) {
        res.json({
          success: true,
          user: { id: 1001, name: "Muaz", role: "Super Admin" },
        });
      } else {
        res.status(401).json({
          success: false,
          message:
            "Invalid credentials. Please check your latest email for the rotated password.",
        });
      }
    });

    app.post("/api/StripeDbReconciliation/run-manual", (req: any, res: any) => {
      const { authCode, reconciliationDate, triggeredByUserId } = req.body;

      if (!authCode || !reconciliationDate) {
        return res.status(400).json({
          error: "Bad Request",
          message: "authCode and reconciliationDate are required.",
        });
      }

      console.log(
        `Running manual reconciliation for ${authCode} on ${reconciliationDate} triggered by ${triggeredByUserId || "system"}`,
      );

      setTimeout(() => {
        const outcome = {
          runId:
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15),
          recordsChecked: Math.floor(Math.random() * 200) + 50,
          matched: Math.floor(Math.random() * 50) + 40,
          autoFixed: Math.floor(Math.random() * 10),
          markedFraudulent: Math.floor(Math.random() * 5),
          flagged: Math.floor(Math.random() * 15),
          failed: Math.floor(Math.random() * 3),
          status: "Succeeded",
          errorMessage: null,
        };
        res.json(outcome);
      }, 2000);
    });

    const mockRuns = [
      {
        runId: "run_7v9x2k8l1m0j",
        triggeredBy: "scheduler",
        windowStartUtc: "2026-04-25T00:00:00Z",
        windowEndUtc: "2026-04-25T23:59:59Z",
        matchedCount: 145,
        autoFixedCount: 12,
        flaggedCount: 3,
        failedCount: 0,
        recordsChecked: 160,
        status: "Succeeded",
        startedAtUtc: "2026-04-26T02:00:00Z",
        completedAtUtc: "2026-04-26T02:05:30Z",
        durationMs: 330000,
        errorMessage: null,
      },
      {
        runId: "run_a1b2c3d4e5f6",
        triggeredBy: "admin_manual",
        windowStartUtc: "2026-04-24T00:00:00Z",
        windowEndUtc: "2026-04-24T23:59:59Z",
        matchedCount: 88,
        autoFixedCount: 5,
        flaggedCount: 15,
        failedCount: 2,
        recordsChecked: 110,
        status: "Partial",
        startedAtUtc: "2026-04-25T14:30:00Z",
        completedAtUtc: "2026-04-25T14:32:00Z",
        durationMs: 120000,
        errorMessage:
          "Stripe connection timed out briefly for 2 records.",
      },
    ];

    app.get("/api/StripeDbReconciliation/report/runs", (req: any, res: any) => {
      const { authCode, clientId, take } = req.query;
      if (!authCode && !clientId) {
        return res.status(400).json({
          error: "At least one filter (authCode or clientId) is required.",
        });
      }

      const limit = parseInt(take as string) || 50;
      res.json(mockRuns.slice(0, limit));
    });

    app.get(
      "/api/StripeDbReconciliation/report/runs/:runId/audit",
      (req: any, res: any) => {
        const { runId } = req.params;
        const { authCode, clientId } = req.query;

        if (!authCode && !clientId) {
          return res.status(400).json({
            error:
              "At least one filter (authCode or clientId) is required for scope security.",
          });
        }

        const mockAuditLines = [
          {
            auditId: 101,
            orderNumber: "FG-26-7231532575",
            mismatchType: "MarkedFraudulent",
            actionTaken: "FraudMarked",
            reasonCode: "RC_FRAUD_NO_STRIPE",
            reasonText:
              "Paid in DB but no charge found in Stripe for amount 25.00",
            beforeJson: '{"status": "Paid", "isFraud": false}',
            afterJson: '{"status": "Paid", "isFraud": true}',
            createdAtUtc: new Date().toISOString(),
          },
          {
            auditId: 102,
            orderNumber: "FG-26-9901235512",
            mismatchType: "MissingTransactionId",
            actionTaken: "AutoFixed",
            reasonCode: "RC_FIX_TXID_SYNC",
            reasonText:
              "Transaction ID was null, matched by Order # and amount. Synced ch_3P7x... from Stripe.",
            beforeJson: '{"transactionId": null}',
            afterJson: '{"transactionId": "ch_3P7x9vL2j..."}',
            createdAtUtc: new Date().toISOString(),
          },
        ];

        res.json({
          runId,
          fraudMarkedCount: mockAuditLines.filter(
            (l) => l.actionTaken === "FraudMarked",
          ).length,
          lines: mockAuditLines,
        });
      },
    );
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express from "express";
import cors from "cors";
import { config } from "./config/env";
import { errorHandler } from "./utils/errors";

// Rotas Sprint 1
import userRoutes from "./routes/user.routes";
import categoryRoutes from "./routes/category.routes";
import transactionRoutes from "./routes/transaction.routes";
import installmentRoutes from "./routes/installment.routes";
import dashboardRoutes from "./routes/dashboard.routes";

// Rotas Sprint 2
import creditCardRoutes from "./routes/credit-card.routes";
import bankAccountRoutes from "./routes/bank-account.routes";
import recurringExpenseRoutes from "./routes/recurring-expense.routes";
import alertRoutes from "./routes/alert.routes";

// Rotas Sprint 3
import healthScoreRoutes from "./routes/health-score.routes";
import financialAssistantRoutes from "./routes/financial-assistant.routes";
import financialGoalRoutes from "./routes/financial-goal.routes";
import projectionRoutes from "./routes/projection.routes";
import emergencyReserveRoutes from "./routes/emergency-reserve.routes";
import timelineRoutes from "./routes/timeline.routes";
import scenarioRoutes from "./routes/scenario.routes";
import bankImportRoutes from "./routes/bank-import.routes";
import executiveDashboardRoutes from "./routes/executive-dashboard.routes";

const app = express();

app.use(
  cors({
    origin: config.frontendUrl,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: config.env });
});

// Sprint 1
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/installments", installmentRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Sprint 2
app.use("/api/credit-cards", creditCardRoutes);
app.use("/api/bank-accounts", bankAccountRoutes);
app.use("/api/recurring-expenses", recurringExpenseRoutes);
app.use("/api/alerts", alertRoutes);

// Sprint 3
app.use("/api/health-score", healthScoreRoutes);
app.use("/api/assistant", financialAssistantRoutes);
app.use("/api/goals", financialGoalRoutes);
app.use("/api/projection", projectionRoutes);
app.use("/api/emergency-reserve", emergencyReserveRoutes);
app.use("/api/timeline", timelineRoutes);
app.use("/api/scenarios", scenarioRoutes);
app.use("/api/bank-imports", bankImportRoutes);
app.use("/api/executive-dashboard", executiveDashboardRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Rota não encontrada" });
});

app.use(errorHandler);

export default app;

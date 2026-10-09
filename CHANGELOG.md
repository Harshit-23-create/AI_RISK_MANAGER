# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] — 2026-10-10

### Added
- **XGBoost + Isolation Forest** ML pipeline with SHAP explainability layer
- **Python FastAPI** ML microservice (port 8001) decoupled from Node.js core
- **WebSocket live feed** with Redis Pub/Sub for real-time transaction streaming
- **SHAP feature importance** returned per-transaction for analyst explainability
- **Generative AI narrative** — LLM (OpenAI/Gemini) synthesizes SHAP values into plain-English explanations
- **Risk Score Gauge** SVG component (0–100 arc gauge with animated needle)
- **Simulation Engine** — configurable transaction rate and suspicious-ratio sliders
- **Network / DPI page** — simulated deep packet inspection telemetry
- **Alert management** — acknowledge, escalate, and resolve CRITICAL/HIGH alerts
- **SOC Dashboard** — 6 KPI cards, area chart, donut chart, live feed table
- **Swagger / OpenAPI** documentation at `/api-docs`
- **GitHub Actions CI** — runs lint, type-check, and tests for all 3 services on every push
- **JWT authentication** with Google OAuth support
- **Helmet** security headers, **Zod** input validation, **rate-limiting**
- **Winston** structured logging, global error handler middleware
- **Skeleton loaders** and **toast notifications** for polished UX
- **Error Boundary** component wrapping the entire React app
- MIT License, CONTRIBUTING.md

### Changed
- Risk score weights refined: Transaction (25%), Behavioral (25%), Network (20%), IF Anomaly (15%), XGBoost (15%)
- Decision thresholds: ALLOW (0–30), MONITOR (31–60), STEP-UP (61–80), BLOCK (81–100)

---

## [1.0.0] — 2026-08-01

### Added
- Initial MERN stack scaffolding (MongoDB + Express + React + Node.js)
- Basic transaction ingestion and storage
- Simple rule-based risk scoring
- React SPA with React Router
- MongoDB Atlas integration via Mongoose
- Redis connection for event streaming
- Basic JWT authentication

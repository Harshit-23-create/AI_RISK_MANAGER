# Contributing to AI Risk Manager

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch**: `git checkout -b feature/your-feature-name`
4. **Make your changes** following the code style guidelines
5. **Test your changes** (see Testing section below)
6. **Submit a pull request** against the `main` branch

## 🏗️ Project Structure

```
ai-risk-manager/
├── frontend/          # React + TypeScript + Vite dashboard
├── backend/           # Node.js + Express + MongoDB REST API
├── ml-service/        # Python + FastAPI ML microservice
├── ml/                # ML model training scripts & artifacts
├── simulation/        # Transaction simulation scripts
└── .github/workflows/ # CI/CD pipelines
```

## 🧪 Testing

### Backend
```bash
cd backend
npm test
npm run test:coverage  # Check coverage report
```

### Python ML Service
```bash
cd ml-service
pytest -v
```

### Frontend
```bash
cd frontend
npm run lint
npm run build  # Validates TypeScript compilation
```

## 📋 Code Style

- **TypeScript**: Strict mode enabled; no `any` types without justification
- **Python**: Follow PEP 8; type hints required for all public functions
- **Commits**: Use conventional commits format: `feat:`, `fix:`, `docs:`, `chore:`
- **Formatting**: Run Prettier before committing (`npx prettier --write .`)

## 🐛 Reporting Issues

Please use the [GitHub Issues](https://github.com/Harshit-23-create/AI_RISK_MANAGER/issues) tracker. Include:
- Steps to reproduce
- Expected vs actual behavior
- System info (OS, Node.js version, Python version)

## 📝 Pull Request Checklist

- [ ] Tests pass locally
- [ ] New code has appropriate comments/JSDoc
- [ ] No new `console.log` statements in production code
- [ ] Environment variables documented in `.env.example`
- [ ] README updated if behavior changed

## 🔒 Security

For security vulnerabilities, please do **not** open a public issue. Email directly instead.

---

By contributing, you agree that your contributions will be licensed under the MIT License.

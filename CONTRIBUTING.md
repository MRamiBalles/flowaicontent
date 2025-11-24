# Contributing to FlowAI

Thank you for your interest in contributing to FlowAI! This document provides guidelines and instructions for contributing.

## 🌟 Ways to Contribute

- **Bug Reports**: Report bugs via GitHub Issues
- **Feature Requests**: Suggest new features
- **Code Contributions**: Submit Pull Requests
- **Documentation**: Improve docs, add examples
- **Testing**: Write tests, report test results
- **Design**: UI/UX improvements, mockups

## 🚀 Getting Started

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/flowai.git
cd flowai
git remote add upstream https://github.com/flowai/flowai.git
```

### 2. Create Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes
- Follow code style guidelines
- Write tests for new features
- Update documentation

### 4. Commit
```bash
git commit -m "feat: add amazing feature"
```

**Commit Message Format**:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting, no code change
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance

### 5. Push & PR
```bash
git push origin feature/your-feature-name
```
Then open a Pull Request on GitHub.

## 📝 Code Style

### Python (Backend)
```bash
# Format with Black
black app/

# Lint with flake8
flake8 app/

# Type check with mypy
mypy app/
```

### TypeScript (Frontend)
```bash
# Format with Prettier
npm run format

# Lint with ESLint
npm run lint

# Type check
npm run type-check
```

## 🧪 Testing

### Run All Tests
```bash
# Backend
pytest tests/ -v --cov

# Frontend
npm test
```

### Add Tests
- Place tests in `tests/` directory
- Name test files `test_*.py` or `*.test.ts`
- Aim for >80% code coverage

## 📋 Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Commits follow conventional format
- [ ] No merge conflicts
- [ ] CI/CD passes

## 🐛 Reporting Bugs

**Use GitHub Issues** with:
1. **Title**: Clear, concise description
2. **Steps to Reproduce**: Numbered list
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What happens
5. **Environment**: OS, browser, versions
6. **Screenshots**: If applicable

## 💡 Feature Requests

**Use GitHub Discussions** with:
1. **Problem Statement**: What pain point does this solve?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other approaches considered
4. **Use Cases**: Real-world examples

## 📞 Questions?

- Discord: [Join Community](https://discord.gg/flowai)
- Email: dev@flowai.com

Thank you for contributing! 🎉

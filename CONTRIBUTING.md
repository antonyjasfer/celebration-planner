# Contributing to CelebriPlan AI

Thank you for your interest in contributing to CelebriPlan! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm install`
4. Create a `.env` file with your Gemini API key (see `.env.example`)
5. Start the dev server: `npm run dev`

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Write or update tests as needed
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Commit with descriptive messages
7. Push and open a Pull Request

## Code Standards

- Use functional React components with hooks
- Include JSDoc comments for all exported functions
- Follow the existing CSS naming conventions
- Ensure all components have proper ARIA attributes
- Maintain accessibility compliance (WCAG 2.1 AA)

## Testing

- Write tests for new features and bug fixes
- Maintain test coverage above 80%
- Use React Testing Library for component tests
- Use Vitest for unit tests

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bug reports
- Tag issues appropriately

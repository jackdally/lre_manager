# Contributing Guidelines

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Process

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Run tests:
   ```bash
   ./scripts/test.sh
   ```
5. Commit your changes:
   ```bash
   git commit -m "feat: your feature description"
   ```
6. Push to your fork
7. Create a Pull Request

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

## Code Style

### TypeScript/JavaScript
- Use ESLint and Prettier
- Follow the TypeScript style guide
- Write meaningful comments
- Use meaningful variable names

### React Components
- Use functional components with hooks
- Follow the React style guide
- Implement proper prop types
- Write component documentation

## Testing

- Write unit tests for new features
- Maintain test coverage
- Follow the testing guidelines in `docs/TESTING.md`

## Documentation

- Update documentation for new features
- Follow the documentation style guide
- Include examples where appropriate

## Pull Request Process

1. Update documentation
2. Add tests for new features
3. Ensure all tests pass
4. Update the changelog
5. Request review from maintainers

## Review Process

- All PRs require at least one review
- Address review comments promptly
- Keep PRs focused and manageable

## Getting Help

- Check existing issues
- Join our community chat
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the project's license.

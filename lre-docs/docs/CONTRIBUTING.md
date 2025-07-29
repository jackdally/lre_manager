# Contributing Guidelines

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Process

 - Fork the repository
 - Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
 - Make your changes
 - Run tests:
   ```bash
   ./scripts/testing/test.sh
   ```
 - Commit your changes:
   ```bash
   git commit -m "feat: your feature description"
   ```
 - Push to your fork
 - Create a Pull Request

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

 - Update documentation
 - Add tests for new features
 - Ensure all tests pass
 - Update the changelog
 - Request review from maintainers

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

# Frontend

The frontend application for LRE Manager, built with React, TypeScript, and Tailwind CSS.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run format` - Format code with Prettier

### Project Structure

```
frontend/
├── src/
│   ├── components/    # React components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom React hooks
│   ├── services/     # API services
│   ├── utils/        # Utility functions
│   ├── types/        # TypeScript types
│   ├── styles/       # Global styles
│   └── App.tsx       # Root component
├── public/           # Static assets
└── dist/            # Build output
```

### Styling

The project uses Tailwind CSS for styling. Configuration is in `tailwind.config.js`.

To add new styles:
1. Use Tailwind utility classes
2. Add custom styles in `src/styles/`
3. Update Tailwind config if needed

### State Management

The application uses:
- React Query for server state
- Context API for global state
- Local state for component-specific state

### Testing

Tests are written using Jest and React Testing Library. Run the test suite:
```bash
npm test
```

For test coverage:
```bash
npm run test:coverage
```

## Building for Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Preview the build:
   ```bash
   npm run preview
   ```

## Deployment

The frontend is containerized using Docker. Build the image:
```bash
docker build -t lre-manager-frontend .
```

## Contributing

1. Follow the coding standards
2. Write tests for new features
3. Update documentation
4. Submit a pull request

## Troubleshooting

Common issues and solutions:

1. **Build Errors**
   - Clear node_modules: `rm -rf node_modules`
   - Clear build cache: `npm run clean`
   - Reinstall dependencies: `npm install`

2. **TypeScript Errors**
   - Run `npm run build` to check for errors
   - Check tsconfig.json settings

3. **Styling Issues**
   - Check Tailwind configuration
   - Verify PostCSS setup
   - Clear browser cache 
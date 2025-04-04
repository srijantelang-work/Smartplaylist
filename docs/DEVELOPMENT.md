# Development Guide

This guide covers the development setup and best practices for the SmartPlaylist project.

## Development Environment Setup

### Prerequisites

1. Node.js (v16 or higher)
2. npm or yarn
3. Git
4. VS Code (recommended)
   - Extensions:
     - ESLint
     - Prettier
     - Tailwind CSS IntelliSense
     - TypeScript Vue Plugin (Volar)

### Initial Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/smartplaylist.git
   cd smartplaylist
   ```

2. **Install Dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   ```

3. **Environment Configuration**

   Create `.env` in project root:
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_APP_URL=http://localhost:5173
   VITE_API_URL=http://localhost:3001
   ```

   Create `.env` in server directory:
   ```env
   PORT=3001
   NODE_ENV=development
   GROQ_API_KEY=your-groq-api-key
   FRONTEND_URL=http://localhost:5173
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## Development Workflow

### Running the Application

1. **Start Backend Server**
   ```bash
   cd server
   npm run dev
   ```

2. **Start Frontend Development Server**
   ```bash
   # In another terminal, from project root
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Code Structure

```
smartplaylist/
├── src/                # Frontend source code
│   ├── components/     # Reusable UI components
│   │   ├── common/     # Generic components
│   │   ├── layout/     # Layout components
│   │   └── playlist/   # Playlist-specific components
│   ├── pages/         # Page components
│   ├── services/      # API and service integrations
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom React hooks
│   ├── types/         # TypeScript definitions
│   ├── lib/           # Utility functions
│   └── styles/        # Global styles
├── server/            # Backend source code
│   ├── index.ts       # Main server file
│   └── types/         # Backend type definitions
└── docs/             # Documentation
```

### Coding Standards

1. **TypeScript**
   - Use strict type checking
   - Define interfaces for all data structures
   - Use type inference when possible
   - Document complex types

2. **React Components**
   - Use functional components
   - Implement proper prop types
   - Use hooks for state management
   - Keep components focused and small

3. **Styling**
   - Use Tailwind CSS classes
   - Follow BEM naming for custom CSS
   - Maintain consistent spacing
   - Use CSS variables for theming

4. **API Integration**
   - Use service classes for API calls
   - Implement proper error handling
   - Cache responses when appropriate
   - Use TypeScript interfaces

### Git Workflow

1. **Branch Naming**
   - Feature: `feature/description`
   - Bug fix: `fix/description`
   - Documentation: `docs/description`
   - Refactor: `refactor/description`

2. **Commit Messages**
   ```
   type(scope): description

   [optional body]

   [optional footer]
   ```
   Types: feat, fix, docs, style, refactor, test, chore

3. **Pull Requests**
   - Create descriptive titles
   - Include detailed descriptions
   - Reference related issues
   - Add appropriate labels

### Testing

1. **Unit Tests**
   ```bash
   # Run frontend tests
   npm test

   # Run backend tests
   cd server
   npm test
   ```

2. **E2E Tests**
   ```bash
   npm run test:e2e
   ```

3. **Test Coverage**
   ```bash
   npm run test:coverage
   ```

### Debugging

1. **Frontend Debugging**
   - Use React Developer Tools
   - Check browser console
   - Use network tab for API calls
   - Implement proper error boundaries

2. **Backend Debugging**
   - Use VS Code debugger
   - Check server logs
   - Monitor API responses
   - Use postman for API testing

### Performance Optimization

1. **Frontend**
   - Implement code splitting
   - Use React.memo for expensive components
   - Optimize images and assets
   - Use proper caching strategies

2. **Backend**
   - Implement rate limiting
   - Use caching where appropriate
   - Optimize database queries
   - Monitor response times

### Security Best Practices

1. **Frontend**
   - Sanitize user input
   - Implement proper CSRF protection
   - Use secure HTTP headers
   - Follow Content Security Policy

2. **Backend**
   - Validate all input
   - Use proper authentication
   - Implement rate limiting
   - Follow security headers

### Error Handling

1. **Frontend Errors**
   ```typescript
   try {
     // API call or operation
   } catch (error) {
     if (error instanceof ApiError) {
       // Handle API-specific error
     } else {
       // Handle general error
     }
   }
   ```

2. **Backend Errors**
   ```typescript
   try {
     // Operation
   } catch (error) {
     console.error('Error:', error);
     res.status(500).json({
       error: error instanceof Error ? error.message : 'Unknown error'
     });
   }
   ```

## Development Tools

### Recommended VS Code Extensions

1. **Essential**
   - ESLint
   - Prettier
   - TypeScript Vue Plugin (Volar)
   - Tailwind CSS IntelliSense

2. **Optional**
   - GitLens
   - REST Client
   - Error Lens
   - Import Cost

### Useful Commands

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# Clean install dependencies
npm ci
```

### Troubleshooting

1. **Common Issues**
   - CORS errors
   - Type errors
   - Build failures
   - Environment variables

2. **Solutions**
   - Check CORS configuration
   - Verify types and interfaces
   - Clear cache and node_modules
   - Verify environment setup

## Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Groq Documentation](https://groq.com/docs) 
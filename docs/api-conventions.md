# API Conventions - InternTracker

## Rules
- All routes under `/api/`
- Response format: `{ data: ... }` or `{ error: { message, code } }`
- Auth via `auth-token` cookie + profileId
- Use Zod for validation
- Every mutation creates Activity log
- Return proper HTTP status codes
```


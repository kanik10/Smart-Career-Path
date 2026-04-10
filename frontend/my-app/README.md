# Smart Career Path

A career guidance platform for VPPCOE students.

## Run Locally

1. Start backend at port 5000.
2. In this folder, install dependencies and run Vite:
	- npm install
	- npm run dev

## Vercel Deployment Notes

1. Deploy from repository root. The root vercel.json builds this frontend from frontend/my-app.
2. Set frontend environment variable in Vercel:
	- VITE_API_ORIGIN=https://your-backend-domain.com
3. Redeploy after saving environment variables.

You can copy frontend/my-app/.env.example for local environment setup.

## Dependencies

### Backend Dependencies
- express: ^5.1.0 (Web framework)
- mongoose: ^8.18.3 (MongoDB ODM)
- cors: ^2.8.5 (Cross-Origin Resource Sharing)
- dotenv: ^17.2.3 (Environment variables)
- express-async-handler: ^1.2.0 (Async error handling)
- jsonwebtoken: ^9.0.2 (JWT authentication)
- bcryptjs: ^3.0.2 (Password hashing)
- mongodb: Th Latest (MongoDB driver)

### Frontend Dependencies
- react: ^19.1.1
- react-dom: ^19.1.1
- react-router-dom: ^7.9.1
- axios: ^1.12.2 (HTTP client)
- lucide-react: ^0.544.0 (Icons)

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

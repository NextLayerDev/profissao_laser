export { AuthGuard } from './components/auth-guard';
export { ChangePasswordModal } from './components/change-password-modal';

export { useForgotPassword } from './hooks/use-forgot-password';
export { useLogin } from './hooks/use-login';
export { useResetPassword } from './hooks/use-reset-password';
export { useSignup } from './hooks/use-signup';

export {
	forgotPassword,
	login,
	resetPassword,
	signup,
} from './services/auth.service';
export type {
	AuthMessageResponse,
	AuthTokenResponse,
	ForgotPasswordPayload,
	LoginPayload,
	ResetPasswordPayload,
	SignupPayload,
} from './types/auth';
export {
	authMessageResponseSchema,
	authTokenResponseSchema,
	forgotPasswordSchema,
	loginSchema,
	resetPasswordSchema,
	signupSchema,
} from './types/auth';

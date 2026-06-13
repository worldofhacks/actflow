import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { ForgotPasswordForm } from './_components/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] lg:min-h-[calc(100vh-92px)] flex items-center justify-center px-4 py-8 bg-transparent">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

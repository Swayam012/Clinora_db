import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, User, ShieldCheck, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { loginUser, registerUser } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFillDemo = (e) => {
    e.preventDefault();
    setIsSignUp(false);
    setEmail('test@clinora.com');
    setPassword('Test1234!');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await registerUser({ full_name: fullName, email, password, role });
        const loginRes = await loginUser(email, password);
        if (loginRes.access_token) {
          localStorage.setItem('clinora_token', loginRes.access_token);
          navigate('/dashboard');
        }
      } else {
        const result = await loginUser(email, password);
        if (result.access_token) {
          localStorage.setItem('clinora_token', result.access_token);
          navigate('/dashboard');
        } else {
          setError(result.detail || 'Authentication failed.');
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full bg-slate-950 bg-dot-pattern">
      {/* Subtle radial ambient background highlights */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-purple/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-20 h-96 w-96 rounded-full bg-brand-coral/15 blur-3xl" />

      {/* Main Container */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between p-6 lg:p-12">
        {/* Left Hero Branding Section */}
        <div className="hidden lg:flex flex-col max-w-xl pr-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-purple/30 bg-brand-purple/10 px-3.5 py-1 text-xs font-semibold text-brand-lavender backdrop-blur-md mb-6 w-fit">
            <Sparkles className="h-3.5 w-3.5 text-brand-coral" />
            <span>Next-Gen Clinical Intelligence Platform</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-purple via-indigo-500 to-brand-coral text-white font-bold shadow-xl shadow-brand-purple/25">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">CLINORA</h1>
              <p className="text-xs text-slate-400 font-medium">Enterprise Healthcare Document AI</p>
            </div>
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Turn Clinical Documents Into Intelligent Insights
          </h2>

          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            Automated OCR text extraction, clinical entity recognition, multi-modal knowledge graphs, and RAG search for prescriptions, lab panels, and patient charts.
          </p>

          {/* Value Badges */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/[0.08] bg-slate-900/60 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>HIPAA & Safe-AI</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Strict patient data privacy and audit trails.</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-slate-900/60 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Zap className="h-4 w-4 text-brand-coral" />
                <span>Instant Digitization</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">High-speed OCR & structured extraction.</p>
            </div>
          </div>
        </div>

        {/* Right Authentication Form Card */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold tracking-tight text-white">
                  {isSignUp ? 'Create Clinora Account' : 'Welcome Back'}
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFillDemo}
                  className="text-[11px] h-7 text-brand-lavender border-brand-purple/30 bg-brand-purple/10 hover:bg-brand-purple/20"
                >
                  <Zap className="mr-1 h-3 w-3 text-brand-coral" />
                  Auto Demo
                </Button>
              </div>
              <CardDescription>
                {isSignUp
                  ? 'Register a new clinician or researcher account'
                  : 'Enter your verified credentials to access patient data'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Full Name</label>
                    <Input
                      icon={User}
                      type="text"
                      placeholder="Dr. Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Email Address</label>
                  <Input
                    icon={Mail}
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">Password</label>
                    {!isSignUp && (
                      <a href="#" className="text-[11px] font-medium text-brand-lavender hover:underline">
                        Forgot?
                      </a>
                    )}
                  </div>
                  <Input
                    icon={Lock}
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                {isSignUp && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-1 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-purple"
                    >
                      <option value="staff">Healthcare Staff / Doctor</option>
                      <option value="admin">Clinical Administrator</option>
                    </select>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="coral"
                  className="w-full h-10 font-semibold text-sm mt-2"
                  disabled={loading}
                >
                  {loading
                    ? isSignUp ? 'Creating Profile...' : 'Authenticating...'
                    : isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <div className="mt-6 border-t border-white/[0.08] pt-4 text-center">
                <p className="text-xs text-slate-400">
                  {isSignUp ? 'Already registered?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                    className="font-semibold text-brand-lavender hover:underline"
                  >
                    {isSignUp ? 'Sign In here' : 'Sign Up now'}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

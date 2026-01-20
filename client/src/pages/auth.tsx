import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Fingerprint, Mail, Lock, User, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onLoginSubmit(data: LoginFormValues) {
    loginMutation.mutate(data);
  }

  async function onSignUpSubmit(data: SignUpFormValues) {
    registerMutation.mutate(data);
  }

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-stretch bg-background overflow-hidden">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex w-1/2 relative bg-primary items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent opacity-90" />
        
        {/* Abstract background elements */}
        <div className="absolute top-0 -left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="relative z-10 max-w-lg text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-8">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <Fingerprint className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Hiring Predictor</h1>
            </div>
            
            <h2 className="text-5xl font-extrabold mb-6 leading-tight">
              Predict your <span className="text-white/80">future career</span> with AI precision.
            </h2>
            <p className="text-lg text-white/80 mb-10 leading-relaxed">
              Join thousands of professionals using our AI-driven insights to find their perfect role and predict hiring outcomes with 95% accuracy.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "AI Analysis", value: "Real-time" },
                { label: "Accuracy", value: "95%" },
                { label: "Verified Users", value: "10k+" },
                { label: "Success Rate", value: "88%" },
              ].map((stat, i) => (
                <div key={i} className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                  <p className="text-sm text-white/60 mb-1">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-12 lg:p-24 bg-card/30 backdrop-blur-sm">
        <div className="max-w-md w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="mb-10 lg:hidden">
              <div className="flex items-center gap-2 mb-2">
                <Fingerprint className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Hiring Predictor</h1>
              </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="login" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-none shadow-none bg-transparent">
                      <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-3xl font-bold">Welcome back</CardTitle>
                        <CardDescription>Enter your credentials to access your account</CardDescription>
                      </CardHeader>
                      <CardContent className="px-0 py-6 space-y-4">
                        <Form {...loginForm}>
                          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                            <FormField
                              control={loginForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input placeholder="name@example.com" className="pl-10 h-11" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={loginForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input type="password" placeholder="••••••••" className="pl-10 h-11" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                              {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                "Sign In"
                              )}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                      <CardFooter className="px-0 pb-0 flex flex-col space-y-4">
                        <div className="relative w-full">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-transparent px-2 text-muted-foreground">Or continue with</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full">
                          <Button variant="outline" className="h-11">Google</Button>
                          <Button variant="outline" className="h-11">GitHub</Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-none shadow-none bg-transparent">
                      <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-3xl font-bold">Create an account</CardTitle>
                        <CardDescription>Get started with your free career dashboard</CardDescription>
                      </CardHeader>
                      <CardContent className="px-0 py-6">
                        <Form {...signUpForm}>
                          <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
                            <FormField
                              control={signUpForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input placeholder="John Doe" className="pl-10 h-11" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={signUpForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input placeholder="name@example.com" className="pl-10 h-11" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={signUpForm.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="••••••••" className="h-11" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={signUpForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirm</FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="••••••••" className="h-11" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button type="submit" className="w-full h-11 text-base font-semibold group" disabled={isLoading}>
                              {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  Create Account
                                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                              )}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                      <CardFooter className="px-0 pb-0">
                        <p className="text-center text-sm text-muted-foreground w-full">
                          By clicking continue, you agree to our{" "}
                          <a href="#" className="underline underline-offset-4 hover:text-primary">Terms of Service</a>{" "}
                          and <a href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</a>.
                        </p>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

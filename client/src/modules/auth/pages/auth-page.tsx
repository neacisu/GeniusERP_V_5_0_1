import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/ui/logo";

// Loader spinner component
function Loader({ className }: { className?: string }) {
  return (
    <svg 
      className={`animate-spin ${className || ''}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

// Login schema
const loginSchema = z.object({
  username: z.string().min(1, "Numele de utilizator este obligatoriu"),
  password: z.string().min(1, "Parola este obligatorie"),
});

// Registration schema
const registerSchema = z.object({
  username: z.string().min(3, "Numele de utilizator trebuie să aibă minim 3 caractere"),
  password: z.string().min(6, "Parola trebuie să aibă minim 6 caractere"),
  email: z.string().email("Adresa de email nu este validă"),
  firstName: z.string().min(1, "Prenumele este obligatoriu"),
  lastName: z.string().min(1, "Numele este obligatoriu"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "admin", // Pre-completat pentru dezvoltare
      password: "admin", // Pre-completat pentru dezvoltare
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <Logo />
            <CardTitle className="text-2xl">Autentificare</CardTitle>
            <CardDescription>
              Accesați sistemul GeniusERP pentru a gestiona contabilitatea afacerii dvs.
            </CardDescription>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Autentificare</TabsTrigger>
              <TabsTrigger value="register">Înregistrare</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nume utilizator</FormLabel>
                          <FormControl>
                            <Input placeholder="Introduceți numele de utilizator" {...field} />
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
                          <FormLabel>Parolă</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Introduceți parola" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary-dark"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader className="mr-2 h-4 w-4" />
                          Se procesează...
                        </>
                      ) : (
                        "Autentificare"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prenume</FormLabel>
                            <FormControl>
                              <Input placeholder="Prenume" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nume</FormLabel>
                            <FormControl>
                              <Input placeholder="Nume" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nume utilizator</FormLabel>
                          <FormControl>
                            <Input placeholder="Nume utilizator" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parolă</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Parolă" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary-dark"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader className="mr-2 h-4 w-4" />
                          Se procesează...
                        </>
                      ) : (
                        "Înregistrare"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
      
      {/* Right side - Hero section */}
      <div className="hidden lg:block lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-dark/20"></div>
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-lg text-white">
            <h1 className="text-4xl font-bold mb-6">GeniusERP v.5</h1>
            <h2 className="text-2xl font-semibold mb-4">Sistem de Contabilitate Românesc</h2>
            <p className="text-lg mb-6">
              Soluția completă pentru contabilitatea afacerii dvs., conformă cu standardele românești.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <div className="w-5 h-5 mr-2 flex items-center justify-center rounded-full bg-white text-primary">✓</div>
                <span>Contabilitate în partidă dublă</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 mr-2 flex items-center justify-center rounded-full bg-white text-primary">✓</div>
                <span>Plan de conturi românesc actualizat 2025</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 mr-2 flex items-center justify-center rounded-full bg-white text-primary">✓</div>
                <span>Gestiune stocuri și inventar</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 mr-2 flex items-center justify-center rounded-full bg-white text-primary">✓</div>
                <span>Rapoarte financiare conforme cu legislația</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 mr-2 flex items-center justify-center rounded-full bg-white text-primary">✓</div>
                <span>Interfață modernă și intuitivă</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

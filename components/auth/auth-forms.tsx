"use client"

import { formResolver } from "@/lib/form-resolver"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { errorMessage } from "@/lib/api"

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").max(72),
})

const registerSchema = z
  .object({
    full_name: z.string().max(200, "Name is too long"),
    email: z.email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(72, "Password is too long")
      .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), "Include at least one letter and one digit"),
    confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((value) => value.password === value.confirm, { path: ["confirm"], message: "Passwords do not match" })

export function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const [formError, setFormError] = useState("")
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: formResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setFormError("")
    try {
      await login(values.email, values.password)
      router.replace("/dashboard")
    } catch (error) {
      setFormError(errorMessage(error, "Could not sign in."))
    }
  }

  const registered = params.get("registered") === "1"
  const expired = params.get("expired") === "1"

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to continue your career pivot.</p>
      {registered ? <p className="mt-4 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">Account created. Sign in to continue.</p> : null}
      {expired ? <p className="mt-4 rounded-lg bg-secondary px-3 py-2 text-sm">Your session expired. Sign in again.</p> : null}
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
        </Field>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}

export function RegisterForm() {
  const { register: registerAccount } = useAuth()
  const router = useRouter()
  const [formError, setFormError] = useState("")
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: formResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "", confirm: "" },
  })

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setFormError("")
    try {
      await registerAccount({ email: values.email, password: values.password, full_name: values.full_name })
      router.replace("/login?registered=1")
    } catch (error) {
      setFormError(errorMessage(error, "Could not create the account."))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Start with your name, then add a resume and a target role.</p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Field label="Full name" htmlFor="full_name" error={form.formState.errors.full_name?.message}>
          <Input id="full_name" autoComplete="name" {...form.register("full_name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message} hint="At least 8 characters, with a letter and a number.">
          <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={form.formState.errors.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
        </Field>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

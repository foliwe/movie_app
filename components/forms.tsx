"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { Movie } from "@/lib/movies";

type FormState = "idle" | "loading" | "error" | "success";

export function AuthForm({ mode }: { mode: "login" | "register" | "forgot" }) {
  const [state, setState] = useState<FormState>("idle");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    window.setTimeout(() => {
      setState(email.includes("@") ? "success" : "error");
    }, 650);
  }

  const title = mode === "login" ? "Welcome back" : mode === "register" ? "Create your profile" : "Reset your password";
  const success = mode === "forgot" ? "Reset link prepared for the mock inbox." : "Mock account flow completed.";

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>{title}</h2>
      {mode === "register" ? (
        <label>
          Display name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Aline N." />
        </label>
      ) : null}
      <label>
        Email
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
      </label>
      {mode !== "forgot" ? (
        <label>
          Password
          <input type="password" placeholder="At least 8 characters" />
        </label>
      ) : null}
      {state === "error" ? <p className="form-message error">Use a valid email address to continue.</p> : null}
      {state === "success" ? (
        <p className="form-message success">
          <CheckCircle2 size={18} />
          {success}
        </p>
      ) : null}
      <button className="primary-action" type="submit" disabled={state === "loading"}>
        {state === "loading" ? <Loader2 className="spin" size={18} /> : null}
        {mode === "login" ? "Sign in" : mode === "register" ? "Register" : "Send reset link"}
      </button>
      <div className="form-links">
        {mode !== "login" ? <Link href="/login">Sign in</Link> : <Link href="/forgot-password">Forgot password?</Link>}
        {mode !== "register" ? <Link href="/register">Create account</Link> : null}
      </div>
    </form>
  );
}

export function WriteReviewForm({ movie }: { movie: Movie }) {
  const [rating, setRating] = useState(8);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<FormState>("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    window.setTimeout(() => {
      setState(title.trim().length > 3 && body.trim().length > 20 ? "success" : "error");
    }, 700);
  }

  return (
    <form className="auth-form review-form" onSubmit={handleSubmit}>
      <h2>Review {movie.title}</h2>
      <label>
        Rating
        <span className="range-field">
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
          />
          <strong>{rating}/10</strong>
        </span>
      </label>
      <label>
        Review title
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What should readers know?" />
      </label>
      <label>
        Your review
        <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write at least a few sentences." />
      </label>
      {state === "error" ? <p className="form-message error">Add a title and at least 20 characters of review text.</p> : null}
      {state === "success" ? (
        <p className="form-message success">
          <CheckCircle2 size={18} />
          Review saved locally for the Phase 1 demo.
        </p>
      ) : null}
      <button className="primary-action" type="submit" disabled={state === "loading"}>
        {state === "loading" ? <Loader2 className="spin" size={18} /> : null}
        Publish mock review
      </button>
    </form>
  );
}

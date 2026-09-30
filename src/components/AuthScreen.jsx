import { useState } from "react"
import { supabase } from "../supabase"
import { useToast } from "./ToastProvider"

export default function AuthScreen({ onLogin }) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  async function handleAuth() {
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const user = data.user;

      if (user) {
        await supabase.from("profiles").insert({
          id: user.id,
          player_name: playerName,
        });
      }

      toast.success("Account created. You can now log in.");
      setIsSignup(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      onLogin();
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>{isSignup ? "Create Account" : "Login"}</h2>

      {isSignup && (
        <>
          <p>Player Name</p>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </>
      )}

      <p>Email</p>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <p>Password</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={handleAuth}>
        {isSignup ? "Create Account" : "Login"}
      </button>

      <br /><br />

      <button onClick={() => setIsSignup(!isSignup)}>
        {isSignup ? "Already have an account?" : "Create new account"}
      </button>
    </div>
  );
}
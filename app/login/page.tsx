"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import "./styles.css";

export default function Login() {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);
   const [showPass, setShowPass] = useState(false);

   const router = useRouter();

   const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      try {
         const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
         });

         if (error) {
            setError("Credenciales incorrectas");
         } else {
            router.push("/admin");
            router.refresh();
         }
      } catch (err) {
         console.error("Error inesperado:", err);
         setError("Ocurrió un error inesperado");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="login">

         {/* BOTÓN PARA VOLVER AL CATÁLOGO */}
         <button
            type="button"
            className="back-catalog"
            onClick={() => router.push("/")}
         >
            ← Volver al catálogo
         </button>

         <div className="box">

            {/* LOGO */}
            <div className="logo-side">
               <img
                  src="/ks.jpg"
                  alt="Kasaca Sport"
                  className="logo"
               />
            </div>

            {/* FORMULARIO */}
            <div className="form-side">

               <h2>Bienvenido</h2>

               <p className="subtitle">
                  Ingresa a tu cuenta | Kasaca Sport
               </p>

               <form onSubmit={handleLogin}>

                  <label>Usuario</label>

                  <input
                     type="email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                  />

                  <label>Contraseña</label>

                  <div className="pass">

                     <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                     />

                     <button
                        type="button"
                        className="eye"
                        onClick={() => setShowPass(!showPass)}
                     >
                        {showPass ? <FaEyeSlash /> : <FaEye />}
                     </button>

                  </div>

                  {/* MENSAJE DE ERROR */}
                  {error && (
                     <p className="text-red-500 text-sm">
                        {error}
                     </p>
                  )}

                  <div className="options">

                     <label className="remember">
                        {/* <input type="checkbox" /> */}
                        {/* Recordarme */}
                     </label>

                  </div>

                  {/* BOTÓN LOGIN */}
                  <button
                     className="btn"
                     type="submit"
                     disabled={loading}
                  >
                     {loading ? "Entrando..." : "Iniciar Sesión"}
                  </button>

               </form>

            </div>

         </div>

      </div>
   );
}
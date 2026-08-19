import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  // Inicializamos la respuesta para poder modificar las cookies si es necesario
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Creamos el cliente de Supabase específico para el Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obtenemos el usuario actual a partir de las cookies
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // PROTECCIÓN: Si NO hay usuario y la URL intenta entrar a /admin
  if (!user && request.nextUrl.pathname.startsWith('/admin')) {
    // Clonamos la URL actual y lo mandamos a /login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // PROTECCIÓN INVERSA: Si YA hay usuario y trata de ir al login, lo mandamos al admin
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

// Le decimos a Next.js en qué rutas debe ejecutarse este middleware
export const config = {
  matcher: [
    // Se ejecuta en todas las rutas EXCEPTO archivos estáticos, imágenes, etc.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
